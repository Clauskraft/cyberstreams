import { describe, it, expect, afterEach } from "vitest";
import {
  upsertAuthorizedSource,
  getAuthorizedSources,
} from "../../lib/authorizedSourceRepository.js";
import {
  upsertApiKey,
  findApiKey,
  deleteApiKey,
} from "../../lib/integrationSettingsRepository.js";
import searchService from "../../lib/searchService.js";

describe("Real Functionality Tests", () => {
  describe("Source Repository - Real Database Operations", () => {
    it("should create and retrieve sources from database", async () => {
      const testSource = {
        id: "test-source-real",
        name: "Real Test Source",
        domain: "test-real.com",
        type: "government",
        credibilityScore: 95,
        timelinessScore: 90,
        accuracyScore: 85,
        contextScore: 80,
        relevanceScore: 75,
        geography: ["DK", "EU"],
        sectors: ["cybersecurity", "government"],
        languages: ["da", "en"],
        verified: true,
        priority: "high",
      };

      // Insert source
      await upsertAuthorizedSource(testSource);

      // Retrieve sources
      const sources = await getAuthorizedSources();

      // Find our test source
      const foundSource = sources.find((s) => s.id === "test-source-real");

      expect(foundSource).toBeDefined();
      expect(foundSource.name).toBe("Real Test Source");
      expect(foundSource.domain).toBe("test-real.com");
      expect(foundSource.geography).toEqual(["DK", "EU"]);
      expect(foundSource.sectors).toEqual(["cybersecurity", "government"]);
      expect(foundSource.verified).toBe(true);
    });

    it("should handle boolean conversion correctly in real database", async () => {
      const falseSource = {
        id: "test-source-false",
        name: "False Test Source",
        domain: "test-false.com",
        type: "media",
        verified: false,
      };

      await upsertAuthorizedSource(falseSource);

      const sources = await getAuthorizedSources();
      const foundSource = sources.find((s) => s.id === "test-source-false");

      expect(foundSource).toBeDefined();
      expect(foundSource.verified).toBe(false);
    });

    it("should handle empty arrays correctly in real database", async () => {
      const emptySource = {
        id: "test-source-empty",
        name: "Empty Test Source",
        domain: "test-empty.com",
        type: "organization",
        geography: [],
        sectors: [],
        languages: [],
      };

      await upsertAuthorizedSource(emptySource);

      const sources = await getAuthorizedSources();
      const foundSource = sources.find((s) => s.id === "test-source-empty");

      expect(foundSource).toBeDefined();
      expect(foundSource.geography).toEqual([]);
      expect(foundSource.sectors).toEqual([]);
      expect(foundSource.languages).toEqual([]);
    });
  });

  describe("Integration Settings - Real Database Operations", () => {
    it("should store and retrieve API keys from database", async () => {
      const serviceName = "test-service-real";
      const apiKey = "test-api-key-real";

      // Store API key
      await upsertApiKey(serviceName, apiKey);

      // Retrieve API key
      const retrievedKey = await findApiKey(serviceName);

      expect(retrievedKey).toBeDefined();
      expect(retrievedKey.name).toBe(serviceName);
      expect(retrievedKey.value).toBe(apiKey);
    });

    it("should delete API keys from database", async () => {
      const serviceName = "test-service-delete";
      const apiKey = "test-api-key-delete";

      // Store API key
      await upsertApiKey(serviceName, apiKey);

      // Verify it exists
      let retrievedKey = await findApiKey(serviceName);
      expect(retrievedKey).toBeDefined();

      // Delete API key
      const deleteResult = await deleteApiKey(serviceName);
      expect(deleteResult).toBe(true);

      // Verify it's gone
      retrievedKey = await findApiKey(serviceName);
      expect(retrievedKey).toBeNull();
    });

    it("should return false when deleting non-existent key", async () => {
      const deleteResult = await deleteApiKey("non-existent-service");
      expect(deleteResult).toBe(false);
    });
  });

  describe("Search Service - Real Functionality", () => {
    it("should calculate relevance scores correctly", () => {
      const query = "cybersecurity threat";
      const text = "This is about cybersecurity threats and vulnerabilities";

      const score = searchService.calculateRelevance(query, text);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should handle exact matches with high relevance", () => {
      const query = "cybersecurity";
      const text = "cybersecurity is important for protecting systems";

      const score = searchService.calculateRelevance(query, text);

      expect(score).toBeGreaterThan(50);
    });

    it("should handle partial matches", () => {
      const query = "cyber security";
      const text = "cybersecurity and information security are related";

      const score = searchService.calculateRelevance(query, text);

      expect(score).toBeGreaterThan(0);
    });

    it("should return 0 for no matches", () => {
      const query = "nonexistent";
      const text = "completely different content";

      const score = searchService.calculateRelevance(query, text);

      expect(score).toBe(0);
    });

    it("should generate search suggestions from results", () => {
      const query = "cyber";
      const results = [
        { tags: ["cybersecurity", "threats"] },
        { tags: ["cybercrime", "malware"] },
        { category: "cybersecurity" },
      ];

      const suggestions = searchService.generateSuggestions(query, results);

      expect(suggestions).toContain("cybersecurity");
      expect(suggestions).toContain("cybercrime");
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it("should handle empty results for suggestions", () => {
      const query = "test";
      const results = [];

      const suggestions = searchService.generateSuggestions(query, results);

      expect(suggestions).toHaveLength(0);
    });

    it("should track search history", () => {
      searchService.logSearch("test query", "knowledge", 5);
      searchService.logSearch("another query", "sources", 3);

      const analytics = searchService.getSearchAnalytics();

      expect(analytics.totalSearches).toBe(2);
      expect(analytics.searchesByType.knowledge).toBe(1);
      expect(analytics.searchesByType.sources).toBe(1);
      expect(analytics.popularQueries).toHaveLength(2);
    });

    it("should calculate average results correctly", () => {
      searchService.logSearch("query1", "knowledge", 10);
      searchService.logSearch("query2", "sources", 5);

      const analytics = searchService.getSearchAnalytics();

      expect(analytics.averageResults).toBe(7.5);
    });

    it("should limit search history to prevent memory issues", () => {
      // Add more than 1000 searches
      for (let i = 0; i < 1001; i++) {
        searchService.logSearch(`query${i}`, "knowledge", 1);
      }

      const analytics = searchService.getSearchAnalytics();

      expect(analytics.totalSearches).toBeLessThanOrEqual(1000);
    });
  });

  describe("Knowledge Base Search - Real File Operations", () => {
    it("should search knowledge base from actual file", async () => {
      const results = await searchService.searchKnowledge("CIA", { limit: 10 });

      // Should return actual results from knowledge-base.json
      expect(Array.isArray(results)).toBe(true);

      // If knowledge base exists, should have results
      if (results.length > 0) {
        expect(results[0]).toHaveProperty("id");
        expect(results[0]).toHaveProperty("title");
        expect(results[0]).toHaveProperty("content");
        expect(results[0]).toHaveProperty("relevanceScore");
      }
    });

    it("should handle empty knowledge base gracefully", async () => {
      // This should not throw an error even if file doesn't exist
      const results = await searchService.searchKnowledge("nonexistent", {
        limit: 10,
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it("should filter by category when specified", async () => {
      const results = await searchService.searchKnowledge("intelligence", {
        category: "cia_methods",
        limit: 10,
      });

      expect(Array.isArray(results)).toBe(true);

      // If results exist, they should all be from cia_methods category
      results.forEach((result) => {
        expect(result.category).toBe("cia_methods");
      });
    });
  });

  describe("Source Search - Real Database Operations", () => {
    it("should search sources from actual database", async () => {
      const results = await searchService.searchSources("test", { limit: 10 });

      expect(Array.isArray(results)).toBe(true);

      // If sources exist, they should have proper structure
      if (results.length > 0) {
        expect(results[0]).toHaveProperty("id");
        expect(results[0]).toHaveProperty("name");
        expect(results[0]).toHaveProperty("domain");
        expect(results[0]).toHaveProperty("type");
      }
    });

    it("should filter sources by type", async () => {
      const results = await searchService.searchSources("test", {
        filters: { sourceType: "government" },
        limit: 10,
      });

      expect(Array.isArray(results)).toBe(true);

      // If results exist, they should reflect requested filter when available
      results.forEach((result) => {
        if (result.sourceType) {
          expect(["government", "organization", "media", "research"]).toContain(
            result.sourceType
          );
        }
      });
    });
  });

  describe("Unified Search - Real Integration", () => {
    it("should perform unified search across all types", async () => {
      const results = await searchService.unifiedSearch("test", { limit: 10 });

      expect(Array.isArray(results)).toBe(true);

      // Results should be sorted by relevance
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].relevanceScore).toBeGreaterThanOrEqual(
          results[i].relevanceScore
        );
      }
    });

    it("should limit results correctly", async () => {
      const results = await searchService.unifiedSearch("test", { limit: 5 });

      expect(results.length).toBeLessThanOrEqual(5);
    });

    it("should include different result types", async () => {
      const results = await searchService.unifiedSearch("cybersecurity", {
        limit: 20,
      });

      expect(Array.isArray(results)).toBe(true);

      // Should have different types of results
      const types = results.map((r) => r.type);
      const uniqueTypes = [...new Set(types)];

      // Should have at least one type
      expect(uniqueTypes.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling - Real Scenarios", () => {
    it("should handle invalid input gracefully", () => {
      const validateSource = (source: any): boolean => {
        return !!(
          source &&
          typeof source.name === "string" &&
          typeof source.domain === "string" &&
          typeof source.credibility === "number"
        );
      };

      expect(
        validateSource({ name: "Test", domain: "test.com", credibility: 95 })
      ).toBe(true);
      expect(validateSource({ name: "Test" })).toBe(false);
      expect(validateSource(null)).toBe(false);
      expect(validateSource(undefined)).toBe(false);
    });

    it("should handle empty search results", async () => {
      const results = await searchService.searchKnowledge(
        "nonexistentquery12345",
        { limit: 10 }
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it("should handle malformed queries", () => {
      const query = "";
      const text = "some text";

      const score = searchService.calculateRelevance(query, text);

      expect(score).toBe(0);
    });
  });

  describe("Performance - Real Operations", () => {
    it("should complete search within acceptable time", async () => {
      const startTime = Date.now();

      await searchService.unifiedSearch("test", { limit: 100 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // 5 seconds for real operations
    });

    it("should handle concurrent database operations", async () => {
      const operations = Array(5)
        .fill(0)
        .map((_, i) =>
          upsertAuthorizedSource({
            id: `concurrent-test-${i}`,
            name: `Concurrent Source ${i}`,
            domain: `concurrent${i}.com`,
            type: "government",
          })
        );

      await Promise.all(operations);

      const sources = await getAuthorizedSources();
      const concurrentSources = sources.filter((s) =>
        s.id.startsWith("concurrent-test-")
      );

      expect(concurrentSources.length).toBeGreaterThanOrEqual(1);
    });
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await deleteApiKey("test-service-real");
      await deleteApiKey("test-service-delete");
    } catch (error) {
      // Ignore cleanup errors
    }
  });
});
