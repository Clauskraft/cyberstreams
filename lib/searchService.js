import logger from "./logger.js";
import { getPool } from "./postgres.js";
import databaseFallback from "./database-fallback.js";
import path from "path";

/**
 * Unified Search Service
 * Consolidates all search functionality across the platform
 */
class SearchService {
  constructor() {
    this.searchIndex = new Map();
    this.vectorEmbeddings = new Map();
    this.searchHistory = [];
  }

  /**
   * Main search entry point - routes to appropriate search method
   */
  async search(query, options = {}) {
    const {
      type = "unified", // unified, knowledge, wifi, intelligence, agents
      category = null,
      limit = 10,
      filters = {},
      includeVector = false,
      includeSemantic = true,
    } = options;

    logger.info({ query, type, options }, "Performing unified search");

    try {
      let results = [];

      switch (type) {
        case "unified":
          results = await this.unifiedSearch(query, {
            limit,
            filters,
            includeVector,
            includeSemantic,
          });
          break;
        case "knowledge":
          results = await this.searchKnowledge(query, { category, limit });
          break;
        case "wifi":
          results = await this.searchWiFi(query, { limit, filters });
          break;
        case "intelligence":
          results = await this.searchIntelligence(query, { limit, filters });
          break;
        case "agents":
          results = await this.searchAgents(query, { limit, filters });
          break;
        case "sources":
          results = await this.searchSources(query, { limit, filters });
          break;
        default:
          throw new Error(`Unknown search type: ${type}`);
      }

      // Log search for analytics
      this.logSearch(query, type, results.length);

      return {
        success: true,
        data: {
          results,
          query,
          type,
          totalResults: results.length,
          searchId: this.generateSearchId(),
          timestamp: new Date().toISOString(),
          filters: filters,
          suggestions: this.generateSuggestions(query, results),
        },
      };
    } catch (error) {
      logger.error({ err: error, query, type }, "Search failed");
      return {
        success: false,
        error: error.message,
        data: { results: [], query, type },
      };
    }
  }

  /**
   * Unified search across all data sources
   */
  async unifiedSearch(query, options) {
    const {
      limit = 10,
      filters = {},
      includeVector,
      includeSemantic,
    } = options || {};
    const results = [];

    // Search across all data sources in parallel
    const searchPromises = [
      this.searchKnowledge(query, { limit: Math.ceil(limit * 0.3) }),
      this.searchIntelligence(query, { limit: Math.ceil(limit * 0.4) }),
      this.searchAgents(query, { limit: Math.ceil(limit * 0.2) }),
      this.searchSources(query, { limit: Math.ceil(limit * 0.1) }),
    ];

    const [
      knowledgeResults = [],
      intelligenceResults = [],
      agentResults = [],
      sourceResults = [],
    ] = await Promise.all(searchPromises).catch(() => [[], [], [], []]);

    // Combine and rank results
    results.push(
      ...knowledgeResults.map((r) => {
        const rel =
          typeof r.relevanceScore === "number"
            ? r.relevanceScore
            : this.calculateRelevance(query, r);
        return {
          ...r,
          source: "knowledge",
          type: r.type || "knowledge",
          relevanceScore: rel,
          relevance: rel,
        };
      })
    );
    results.push(
      ...intelligenceResults.map((r) => {
        const rel = this.calculateRelevance(query, r);
        return {
          ...r,
          source: "intelligence",
          type: r.type || "intelligence",
          relevanceScore: rel,
          relevance: rel,
        };
      })
    );
    results.push(
      ...agentResults.map((r) => {
        const rel = this.calculateRelevance(query, r);
        return {
          ...r,
          source: "agents",
          type: r.type || "agent",
          relevanceScore: rel,
          relevance: rel,
        };
      })
    );
    results.push(
      ...sourceResults.map((r) => {
        const rel = this.calculateRelevance(query, r);
        return {
          ...r,
          source: "sources",
          type: r.type || "source",
          relevanceScore: rel,
          relevance: rel,
        };
      })
    );

    // Sort by relevance and apply filters
    return this.rankAndFilter(results, query, filters, limit);
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(query, options) {
    const { category, limit } = options;

    try {
      const fsMod = await import("fs/promises");
      const knowledgeBasePath = path.join(
        process.cwd(),
        "data",
        "knowledge-base.json"
      );
      const data = await fsMod.readFile(knowledgeBasePath, "utf8");
      const kb = JSON.parse(data);

      const results = [];
      const queryLower = String(query || "").toLowerCase();

      // Helper to push a matched article into results
      const pushIfMatch = (article, inferredCategory) => {
        const articleCategory = article.category || inferredCategory || null;
        if (category && articleCategory !== category) return;

        const pieces = [
          article.title,
          article.summary,
          article.content,
          ...(article.tags || []),
        ]
          .filter(Boolean)
          .map((x) => (typeof x === "string" ? x : String(x)));

        const searchText = pieces.join(" ").toLowerCase();
        const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const wordBoundary = new RegExp(
          `\\b${escapeRegExp(queryLower)}\\b`,
          "i"
        );

        if (wordBoundary.test(searchText)) {
          results.push({
            id: article.id,
            title: article.title,
            content:
              (article.content || article.summary || "").slice(0, 200) +
              (article.content ? "..." : ""),
            category: articleCategory,
            tags: article.tags || [],
            source: article.source,
            author: article.author,
            date: article.date,
            relevanceScore: this.calculateRelevance(queryLower, searchText),
            type: "knowledge",
          });
        }
      };

      // The knowledge base may be an array of articles OR an object with nested categories
      if (Array.isArray(kb)) {
        for (const article of kb) {
          pushIfMatch(article, null);
        }
      } else if (kb && typeof kb === "object") {
        // Expect structure { categories: { key: { articles: [...] } } }
        const categories =
          kb.categories && typeof kb.categories === "object"
            ? kb.categories
            : {};
        for (const [catKey, catVal] of Object.entries(categories)) {
          const articles = Array.isArray(catVal?.articles)
            ? catVal.articles
            : [];
          for (const article of articles) {
            // If article lacks explicit category, infer from category key
            pushIfMatch(article, catKey);
          }
        }
      } else {
        logger.warn(
          "Knowledge base JSON has unexpected structure, returning empty results"
        );
      }

      return results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit || 10);
    } catch (error) {
      logger.error({ err: error }, "Knowledge search failed");
      return [];
    }
  }

  /**
   * Search intelligence findings
   */
  async searchIntelligence(query, options) {
    const { limit, filters = {} } = options;

    try {
      const db = getPool();

      if (!db.prepare) {
        logger.warn(
          "Database not available, returning empty intelligence results"
        );
        return [];
      }

      // Check if findings table exists, if not return empty results
      const tableCheck = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='findings'"
      );
      const tableExists = tableCheck.get();

      if (!tableExists) {
        logger.warn("Findings table does not exist, returning empty results");
        return [];
      }

      // Build search query
      let sql = `
        SELECT id, title, description, source, severity, category, 
               timestamp, verified, quality_score, geography, affected_sectors
        FROM findings 
        WHERE (
          title LIKE ? OR 
          description LIKE ? OR 
          category LIKE ? OR
          source LIKE ?
        )
      `;

      const searchTerm = `%${query}%`;
      const params = [searchTerm, searchTerm, searchTerm, searchTerm];

      // Add filters
      if (filters.severity) {
        sql += " AND severity = ?";
        params.push(filters.severity);
      }

      if (filters.source) {
        sql += " AND source = ?";
        params.push(filters.source);
      }

      sql += " ORDER BY quality_score DESC, timestamp DESC LIMIT ?";
      params.push(limit);

      const stmt = db.prepare(sql);
      const rows = stmt.all(params);

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        source: row.source,
        severity: row.severity,
        category: row.category,
        timestamp: row.timestamp,
        verified: row.verified,
        qualityScore: row.quality_score,
        geography: row.geography,
        affectedSectors: row.affected_sectors,
        type: "intelligence",
      }));
    } catch (error) {
      logger.error({ err: error }, "Intelligence search failed");
      return [];
    }
  }

  /**
   * Search agent workflows and runs
   */
  async searchAgents(query, options) {
    const { limit, filters = {} } = options;

    try {
      const db = getPool();

      if (!db.prepare) {
        logger.warn("Database not available, returning empty agent results");
        return [];
      }

      // Check if agent_runs table exists, if not return empty results
      const tableCheck = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='agent_runs'"
      );
      const tableExists = tableCheck.get();

      if (!tableExists) {
        logger.warn("Agent_runs table does not exist, returning empty results");
        return [];
      }

      let sql = `
        SELECT id, workflow_id, workflow_name, status, priority, 
               created_at, updated_at, inputs, results
        FROM agent_runs 
        WHERE (
          workflow_name LIKE ? OR 
          inputs LIKE ? OR
          results LIKE ?
        )
      `;

      const searchTerm = `%${query}%`;
      const params = [searchTerm, searchTerm, searchTerm];

      if (filters.status) {
        sql += " AND status = ?";
        params.push(filters.status);
      }

      sql += " ORDER BY created_at DESC LIMIT ?";
      params.push(limit);

      const stmt = db.prepare(sql);
      const rows = stmt.all(params);

      return rows.map((row) => ({
        id: row.id,
        workflowId: row.workflow_id,
        workflowName: row.workflow_name,
        status: row.status,
        priority: row.priority,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        inputs: JSON.parse(row.inputs || "{}"),
        results: JSON.parse(row.results || "{}"),
        type: "agent",
      }));
    } catch (error) {
      logger.error({ err: error }, "Agent search failed");
      return [];
    }
  }

  /**
   * Search intelligence sources
   */
  async searchSources(query, options) {
    const { limit, filters = {} } = options;

    try {
      const db = getPool();

      if (!db.prepare) {
        logger.info(
          "Database not available, using fallback authorized sources"
        );
        const sources = databaseFallback.getAuthorizedSources();
        return sources
          .filter((source) => source.verified !== false)
          .filter((source) => {
            const searchTerm = query.toLowerCase();
            const geography = (source.geography || []).join(",").toLowerCase();
            const sectors = (source.sectors || []).join(",").toLowerCase();
            return (
              (source.name || "").toLowerCase().includes(searchTerm) ||
              (source.domain || "").toLowerCase().includes(searchTerm) ||
              geography.includes(searchTerm) ||
              sectors.includes(searchTerm)
            );
          })
          .slice(0, limit)
          .map((source) => ({
            id: source.id,
            name: source.name,
            domain: source.domain,
            sourceType: source.sourceType,
            credibilityScore: source.credibilityScore,
            timelinessScore: source.timelinessScore,
            accuracyScore: source.accuracyScore,
            geography: source.geography || [],
            sectors: source.sectors || [],
            languages: source.languages || [],
            type: "source",
          }));
      }

      let sql = `
        SELECT id, name, domain, source_type, credibility_score, 
               timeliness_score, accuracy_score, geography, sectors, languages
        FROM sources 
        WHERE verified = 1 AND (
          name LIKE ? OR 
          domain LIKE ? OR 
          geography LIKE ? OR
          sectors LIKE ?
        )
      `;

      const searchTerm = `%${query}%`;
      const params = [searchTerm, searchTerm, searchTerm, searchTerm];

      if (filters.sourceType) {
        sql += " AND source_type = ?";
        params.push(filters.sourceType);
      }

      sql += " ORDER BY credibility_score DESC LIMIT ?";
      params.push(limit);

      const stmt = db.prepare(sql);
      const rows = stmt.all(params);

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        domain: row.domain,
        sourceType: row.source_type,
        credibilityScore: row.credibility_score,
        timelinessScore: row.timeliness_score,
        accuracyScore: row.accuracy_score,
        geography: JSON.parse(row.geography || "[]"),
        sectors: JSON.parse(row.sectors || "[]"),
        languages: JSON.parse(row.languages || "[]"),
        type: "source",
      }));
    } catch (error) {
      logger.error({ err: error }, "Source search failed");
      return [];
    }
  }

  /**
   * Search WiFi networks (Wigle integration)
   */
  async searchWiFi(query, options) {
    const { limit, filters = {} } = options;

    try {
      const db = getPool();

      // Check if wifi_networks table exists, if not return empty results
      const tableCheck = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='wifi_networks'"
      );
      const tableExists = tableCheck.get();

      if (!tableExists) {
        logger.warn(
          "Wifi_networks table does not exist, returning empty results"
        );
        return [];
      }

      let sql = `
        SELECT ssid, bssid, lat, lon, channel, encryption, 
               first_seen, last_seen, country, region
        FROM wifi_networks 
        WHERE (
          ssid LIKE ? OR 
          bssid LIKE ? OR
          country LIKE ?
        )
      `;

      const searchTerm = `%${query}%`;
      const params = [searchTerm, searchTerm, searchTerm];

      if (filters.country) {
        sql += " AND country = ?";
        params.push(filters.country);
      }

      sql += " ORDER BY last_seen DESC LIMIT ?";
      params.push(limit);

      const stmt = db.prepare(sql);
      const rows = stmt.all(params);

      return rows.map((row) => ({
        ssid: row.ssid,
        bssid: row.bssid,
        lat: row.lat,
        lon: row.lon,
        channel: row.channel,
        encryption: row.encryption,
        firstSeen: row.first_seen,
        lastSeen: row.last_seen,
        country: row.country,
        region: row.region,
        type: "wifi",
      }));
    } catch (error) {
      logger.error({ err: error }, "WiFi search failed");
      return [];
    }
  }

  /**
   * Calculate relevance score for search results
   */
  calculateRelevance(query, text) {
    if (!query || (typeof query !== "string" && typeof query !== "number"))
      return 0;

    // If text is not a string, attempt to derive a textual representation
    let candidateText = text;
    if (text && typeof text === "object") {
      try {
        const values = Object.values(text)
          .filter((v) => v != null)
          .map((v) => (typeof v === "string" ? v : JSON.stringify(v)));
        candidateText = values.join(" ");
      } catch {
        candidateText = "";
      }
    }

    if (candidateText == null) candidateText = "";
    if (typeof candidateText !== "string") {
      try {
        candidateText = String(candidateText);
      } catch {
        candidateText = "";
      }
    }

    const queryWords = String(query).toLowerCase().split(/\s+/).filter(Boolean);
    if (queryWords.length === 0) return 0;
    const textLower = candidateText.toLowerCase();

    let score = 0;
    let exactMatches = 0;

    for (const word of queryWords) {
      if (textLower.includes(word)) {
        score += 1;
        if (
          textLower.includes(` ${word} `) ||
          textLower.startsWith(`${word} `) ||
          textLower.endsWith(` ${word}`)
        ) {
          exactMatches += 1;
        }
      }
    }

    // Boost score for exact matches
    score += exactMatches * 0.5;

    // Normalize score
    const normalized = (score / queryWords.length) * 100;
    if (!isFinite(normalized) || isNaN(normalized)) return 0;
    return Math.min(Math.max(normalized, 0), 100);
  }

  /**
   * Rank and filter search results
   */
  rankAndFilter(results, query, filters, limit) {
    const safeResults = Array.isArray(results) ? results : [];
    // Sort by relevance with stable tie-breaker by type/source order
    const typeOrder = {
      knowledge: 0,
      source: 1,
      sources: 1,
      intelligence: 2,
      agent: 3,
      agents: 3,
      wifi: 4,
    };
    safeResults.sort((a, b) => {
      const relDiff =
        (b.relevanceScore || b.relevance || 0) -
        (a.relevanceScore || a.relevance || 0);
      if (relDiff !== 0) return relDiff;
      const aType = a.type || a.source || "";
      const bType = b.type || b.source || "";
      const aOrd = typeOrder[aType] ?? 99;
      const bOrd = typeOrder[bType] ?? 99;
      return aOrd - bOrd;
    });

    // Apply additional filters
    let filtered = safeResults;

    if (filters && filters.source) {
      filtered = filtered.filter((r) => r.source === filters.source);
    }

    if (filters && filters.type) {
      filtered = filtered.filter((r) => r.type === filters.type);
    }

    if (filters && filters.severity) {
      filtered = filtered.filter((r) => r.severity === filters.severity);
    }

    return filtered.slice(0, limit || 10);
  }

  /**
   * Generate search suggestions
   */
  generateSuggestions(query, results) {
    const safeResults = Array.isArray(results) ? results : [];
    const suggestions = [];

    // Extract common terms from results
    const terms = new Set();
    safeResults.forEach((result) => {
      if (result.tags) {
        result.tags.forEach((tag) => terms.add(tag));
      }
      if (result.category) {
        terms.add(result.category);
      }
    });

    // Add popular search terms
    const popularTerms = [
      "ransomware",
      "APT",
      "phishing",
      "malware",
      "zero-day",
      "CVE",
      "IOC",
      "threat intelligence",
      "cybersecurity",
      "vulnerability",
    ];

    popularTerms.forEach((term) => {
      if (
        term.toLowerCase().includes(String(query || "").toLowerCase()) &&
        !String(query || "")
          .toLowerCase()
          .includes(term.toLowerCase())
      ) {
        suggestions.push(term);
      }
    });

    return Array.from(terms).slice(0, 5).concat(suggestions.slice(0, 3));
  }

  /**
   * Log search for analytics
   */
  logSearch(query, type, resultCount) {
    this.searchHistory.push({
      query,
      type,
      resultCount,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 1000 searches
    if (this.searchHistory.length > 1000) {
      this.searchHistory = this.searchHistory.slice(-1000);
    }
  }

  /**
   * Generate unique search ID
   */
  generateSearchId() {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get search analytics
   */
  getSearchAnalytics() {
    const totalSearches = this.searchHistory.length;
    const searchesByType = {};
    const popularQueries = {};

    this.searchHistory.forEach((search) => {
      searchesByType[search.type] = (searchesByType[search.type] || 0) + 1;
      popularQueries[search.query] = (popularQueries[search.query] || 0) + 1;
    });

    const avg = totalSearches
      ? this.searchHistory.reduce((sum, s) => sum + (s.resultCount || 0), 0) /
        totalSearches
      : 0;

    return {
      totalSearches,
      searchesByType,
      popularQueries: Object.entries(popularQueries)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count })),
      averageResults: avg,
    };
  }
}

// Export singleton instance
export default new SearchService();
