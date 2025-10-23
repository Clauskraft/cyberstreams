import express from "express";
import logger from "../lib/logger.js";
import searchService from "../lib/searchService.js";

const router = express.Router();

/**
 * Unified Search API
 * Consolidates all search functionality into a single endpoint
 */

// Main search endpoint
router.post("/search", async (req, res) => {
  try {
    const {
      query,
      type = "unified",
      category = null,
      limit = 10,
      filters = {},
      includeVector = false,
      includeSemantic = true,
    } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    const result = await searchService.search(query, {
      type,
      category,
      limit: Math.min(limit, 100), // Cap at 100 results
      filters,
      includeVector,
      includeSemantic,
    });

    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Unified search failed");
    res.status(500).json({
      success: false,
      error: "Search failed",
    });
  }
});

// Search suggestions endpoint
router.get("/suggestions", async (req, res) => {
  try {
    const { q: query, type = "unified" } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: [],
          query,
        },
      });
    }

    // Get suggestions from search service
    const result = await searchService.search(query, {
      type,
      limit: 5,
    });

    const suggestions = result.data.suggestions || [];

    res.json({
      success: true,
      data: {
        suggestions,
        query,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Search suggestions failed");
    res.status(500).json({
      success: false,
      error: "Failed to get suggestions",
    });
  }
});

// Search analytics endpoint
router.get("/analytics", async (req, res) => {
  try {
    const analytics = searchService.getSearchAnalytics();

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error({ err: error }, "Search analytics failed");
    res.status(500).json({
      success: false,
      error: "Failed to get analytics",
    });
  }
});

// Search history endpoint
router.get("/history", async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const history = searchService.searchHistory.slice(-limit).reverse();

    res.json({
      success: true,
      data: {
        history,
        total: searchService.searchHistory.length,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Search history failed");
    res.status(500).json({
      success: false,
      error: "Failed to get search history",
    });
  }
});

// Advanced search endpoint with multiple criteria
router.post("/advanced", async (req, res) => {
  try {
    const {
      queries = [], // Array of search queries
      types = ["unified"], // Array of search types
      filters = {},
      limit = 20,
      sortBy = "relevance", // relevance, date, score
      sortOrder = "desc", // asc, desc
    } = req.body;

    if (!queries.length) {
      return res.status(400).json({
        success: false,
        error: "At least one search query is required",
      });
    }

    // Perform multiple searches in parallel
    const searchPromises = [];

    for (const query of queries) {
      for (const type of types) {
        searchPromises.push(
          searchService.search(query, {
            type,
            limit: Math.ceil(limit / (queries.length * types.length)),
            filters,
          })
        );
      }
    }

    const results = await Promise.all(searchPromises);

    // Combine and deduplicate results
    const combinedResults = [];
    const seenIds = new Set();

    results.forEach((result) => {
      if (result.success && result.data.results) {
        result.data.results.forEach((item) => {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            combinedResults.push({
              ...item,
              searchQuery: result.data.query,
              searchType: result.data.type,
            });
          }
        });
      }
    });

    // Sort results
    combinedResults.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "relevance":
          comparison = (b.relevance || 0) - (a.relevance || 0);
          break;
        case "date":
          comparison =
            new Date(b.timestamp || b.createdAt || 0) -
            new Date(a.timestamp || a.createdAt || 0);
          break;
        case "score":
          comparison =
            (b.qualityScore || b.credibilityScore || 0) -
            (a.qualityScore || a.credibilityScore || 0);
          break;
        default:
          comparison = (b.relevance || 0) - (a.relevance || 0);
      }

      return sortOrder === "asc" ? -comparison : comparison;
    });

    res.json({
      success: true,
      data: {
        results: combinedResults.slice(0, limit),
        totalResults: combinedResults.length,
        queries,
        types,
        filters,
        sortBy,
        sortOrder,
        searchId: searchService.generateSearchId(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Advanced search failed");
    res.status(500).json({
      success: false,
      error: "Advanced search failed",
    });
  }
});

// Search by category endpoint
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const { q: query = "", limit = 20 } = req.query;

    const result = await searchService.search(query, {
      type: "unified",
      category,
      limit: parseInt(limit),
    });

    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Category search failed");
    res.status(500).json({
      success: false,
      error: "Category search failed",
    });
  }
});

// Search by source endpoint
router.get("/source/:source", async (req, res) => {
  try {
    const { source } = req.params;
    const { q: query = "", limit = 20 } = req.query;

    const result = await searchService.search(query, {
      type: "unified",
      filters: { source },
      limit: parseInt(limit),
    });

    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Source search failed");
    res.status(500).json({
      success: false,
      error: "Source search failed",
    });
  }
});

// Real-time search endpoint (for autocomplete)
router.post("/autocomplete", async (req, res) => {
  try {
    const { query, type = "unified", limit = 5 } = req.body;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: { suggestions: [] },
      });
    }

    const result = await searchService.search(query, {
      type,
      limit,
    });

    // Extract quick suggestions from results
    const suggestions = result.data.results.map((item) => ({
      id: item.id,
      title: item.title || item.name || item.ssid,
      type: item.type,
      source: item.source,
      preview: item.description || item.content || "",
    }));

    res.json({
      success: true,
      data: {
        suggestions,
        query,
        totalResults: result.data.totalResults,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Autocomplete search failed");
    res.status(500).json({
      success: false,
      error: "Autocomplete failed",
    });
  }
});

export default router;
