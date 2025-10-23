import { describe, it, expect, beforeEach, vi } from "vitest";
import { getPool } from "../../lib/postgres.js";
import SearchService from "../../lib/searchService.js";

// Mock external dependencies
vi.mock("../../lib/postgres.js", () => ({
  getPool: vi.fn(),
}));

vi.mock("../../lib/logger.js", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}));

// Mock SearchService
const mockSearchService = {
  search: vi.fn(),
  unifiedSearch: vi.fn(),
  searchKnowledge: vi.fn(),
  searchSources: vi.fn(),
  searchIntelligence: vi.fn(),
  searchAgents: vi.fn(),
  searchWiFi: vi.fn(),
  calculateRelevance: vi.fn(),
  generateSuggestions: vi.fn(),
  logSearch: vi.fn(),
  getSearchAnalytics: vi.fn(),
};

vi.mock("../../lib/searchService.js", () => ({
  default: vi.fn().mockImplementation(() => mockSearchService),
}));

import SearchService from "../../lib/searchService.js";

describe("SearchService Tests", () => {
  let searchService: any;
  let mockDb: any;

  beforeEach(() => {
    searchService = mockSearchService;

    mockDb = {
      prepare: vi.fn(),
    };

    vi.mocked(getPool).mockReturnValue(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Search Knowledge", () => {
    it("should search knowledge base correctly", async () => {
      const mockKnowledgeBase = [
        {
          id: "cia-humint",
          title: "CIA HUMINT Techniques",
          content: "Human Intelligence collection methods",
          category: "cia_methods",
          tags: ["CIA", "HUMINT"],
          source: "CIA Documents",
          author: "CIA",
          date: "2025-01-27T10:00:00Z",
        },
        {
          id: "osint-social",
          title: "OSINT Social Media Intelligence",
          content: "Open Source Intelligence from social platforms",
          category: "osint_techniques",
          tags: ["OSINT", "SOCMINT"],
          source: "OSINT Handbook",
          author: "Cyberstreams Research",
          date: "2025-01-27T10:00:00Z",
        },
      ];

      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(mockKnowledgeBase)
      );

      const results = await searchService.searchKnowledge("CIA", { limit: 10 });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("CIA HUMINT Techniques");
      expect(results[0].relevanceScore).toBeGreaterThan(0);
      expect(results[0].type).toBe("knowledge");
    });

    it("should handle empty knowledge base", async () => {
      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockResolvedValue("[]");

      const results = await searchService.searchKnowledge("test", {
        limit: 10,
      });

      expect(results).toHaveLength(0);
    });

    it("should handle invalid knowledge base format", async () => {
      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockResolvedValue("invalid json");

      const results = await searchService.searchKnowledge("test", {
        limit: 10,
      });

      expect(results).toHaveLength(0);
    });

    it("should filter by category", async () => {
      const mockKnowledgeBase = [
        {
          id: "cia-humint",
          title: "CIA HUMINT Techniques",
          content: "Human Intelligence collection methods",
          category: "cia_methods",
          tags: ["CIA", "HUMINT"],
        },
        {
          id: "osint-social",
          title: "OSINT Social Media Intelligence",
          content: "Open Source Intelligence from social platforms",
          category: "osint_techniques",
          tags: ["OSINT", "SOCMINT"],
        },
      ];

      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(mockKnowledgeBase)
      );

      const results = await searchService.searchKnowledge("intelligence", {
        category: "cia_methods",
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].category).toBe("cia_methods");
    });
  });

  describe("Search Sources", () => {
    it("should search sources correctly", async () => {
      const mockRows = [
        {
          id: "cfcs",
          name: "Center for Cybersikkerhed",
          domain: "cfcs.dk",
          source_type: "government",
          credibility_score: 98,
          timeliness_score: 95,
          accuracy_score: 97,
          geography: '["DK"]',
          sectors: '["cybersecurity", "government"]',
          languages: '["da", "en"]',
        },
      ];

      const mockStmt = {
        all: vi.fn().mockReturnValue(mockRows),
      };

      mockDb.prepare.mockReturnValue(mockStmt);

      const results = await searchService.searchSources("CFCS", { limit: 10 });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Center for Cybersikkerhed");
      expect(results[0].type).toBe("source");
      expect(results[0].geography).toEqual(["DK"]);
      expect(results[0].sectors).toEqual(["cybersecurity", "government"]);
    });

    it("should filter sources by type", async () => {
      const mockRows = [
        {
          id: "cfcs",
          name: "Center for Cybersikkerhed",
          domain: "cfcs.dk",
          source_type: "government",
          credibility_score: 98,
          timeliness_score: 95,
          accuracy_score: 97,
          geography: '["DK"]',
          sectors: '["cybersecurity"]',
          languages: '["da"]',
        },
      ];

      const mockStmt = {
        all: vi.fn().mockReturnValue(mockRows),
      };

      mockDb.prepare.mockReturnValue(mockStmt);

      const results = await searchService.searchSources("CFCS", {
        filters: { sourceType: "government" },
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].sourceType).toBe("government");
    });

    it("should handle missing sources table", async () => {
      const mockStmt = {
        get: vi.fn().mockReturnValue(null),
      };

      mockDb.prepare.mockReturnValue(mockStmt);

      const results = await searchService.searchSources("test", { limit: 10 });

      expect(results).toHaveLength(0);
    });
  });

  describe("Search Intelligence", () => {
    it("should search intelligence findings", async () => {
      const mockRows = [
        {
          id: "finding-1",
          title: "Ransomware Attack on Healthcare",
          description: "Major ransomware attack targeting healthcare systems",
          source: "CFCS",
          severity: "high",
          category: "ransomware",
          timestamp: "2025-01-27T10:00:00Z",
          verified: 1,
          quality_score: 95,
          geography: '["DK"]',
          affected_sectors: '["healthcare"]',
        },
      ];

      const mockStmt = {
        all: vi.fn().mockReturnValue(mockRows),
      };

      mockDb.prepare.mockReturnValue(mockStmt);

      const results = await searchService.searchIntelligence("ransomware", {
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Ransomware Attack on Healthcare");
      expect(results[0].type).toBe("intelligence");
      expect(results[0].severity).toBe("high");
    });

    it("should filter by severity", async () => {
      const mockRows = [
        {
          id: "finding-1",
          title: "High Severity Threat",
          description: "Critical security threat",
          source: "CFCS",
          severity: "high",
          category: "threat",
          timestamp: "2025-01-27T10:00:00Z",
          verified: 1,
          quality_score: 95,
          geography: '["DK"]',
          affected_sectors: '["government"]',
        },
      ];

      const mockStmt = {
        all: vi.fn().mockReturnValue(mockRows),
      };

      mockDb.prepare.mockReturnValue(mockStmt);

      const results = await searchService.searchIntelligence("threat", {
        filters: { severity: "high" },
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe("high");
    });

    it("should handle missing findings table", async () => {
      const mockStmt = {
        get: vi.fn().mockReturnValue(null),
      };

      mockDb.prepare.mockReturnValue(mockStmt);

      const results = await searchService.searchIntelligence("test", {
        limit: 10,
      });

      expect(results).toHaveLength(0);
    });
  });

  describe("Search Agents", () => {
    it("should search agent runs", async () => {
      const mockRows = [
        {
          id: "run-123",
          workflow_id: "email_warning",
          workflow_name: "Email Warning Generation",
          status: "completed",
          priority: "high",
          created_at: "2025-01-27T10:00:00Z",
          updated_at: "2025-01-27T10:05:00Z",
          inputs: '{"threat_level": "high"}',
          results: '{"email_sent": true}',
        },
      ];

      const mockStmt = {
        all: vi.fn().mockReturnValue(mockRows),
      };

      mockDb.prepare.mockReturnValue(mockStmt);

      const results = await searchService.searchAgents("email", { limit: 10 });

      expect(results).toHaveLength(1);
      expect(results[0].workflowName).toBe("Email Warning Generation");
      expect(results[0].type).toBe("agent");
      expect(results[0].status).toBe("completed");
      expect(results[0].inputs).toEqual({ threat_level: "high" });
      expect(results[0].results).toEqual({ email_sent: true });
    });

    it("should filter by status", async () => {
      const mockRows = [
        {
          id: "run-123",
          workflow_id: "email_warning",
          workflow_name: "Email Warning Generation",
          status: "running",
          priority: "high",
          created_at: "2025-01-27T10:00:00Z",
          updated_at: "2025-01-27T10:05:00Z",
          inputs: "{}",
          results: "{}",
        },
      ];

      const mockStmt = {
        all: vi.fn().mockReturnValue(mockRows),
      };

      mockDb.prepare.mockReturnValue(mockStmt);

      const results = await searchService.searchAgents("email", {
        filters: { status: "running" },
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe("running");
    });

    it("should handle missing agent_runs table", async () => {
      const mockStmt = {
        get: vi.fn().mockReturnValue(null),
      };

      mockDb.prepare.mockReturnValue(mockStmt);

      const results = await searchService.searchAgents("test", { limit: 10 });

      expect(results).toHaveLength(0);
    });
  });

  describe("Search WiFi", () => {
    it("should search WiFi networks", async () => {
      const mockRows = [
        {
          ssid: "TestNetwork",
          bssid: "00:11:22:33:44:55",
          lat: 55.6761,
          lon: 12.5683,
          channel: 6,
          encryption: "WPA2",
          first_seen: "2025-01-27T10:00:00Z",
          last_seen: "2025-01-27T10:05:00Z",
          country: "DK",
          region: "Copenhagen",
        },
      ];

      const mockStmt = {
        all: vi.fn().mockReturnValue(mockRows),
      };

      mockDb.prepare.mockReturnValue(mockStmt);

      const results = await searchService.searchWiFi("TestNetwork", {
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].ssid).toBe("TestNetwork");
      expect(results[0].type).toBe("wifi");
      expect(results[0].country).toBe("DK");
    });

    it("should filter by country", async () => {
      const mockRows = [
        {
          ssid: "DanishNetwork",
          bssid: "00:11:22:33:44:55",
          lat: 55.6761,
          lon: 12.5683,
          channel: 6,
          encryption: "WPA2",
          first_seen: "2025-01-27T10:00:00Z",
          last_seen: "2025-01-27T10:05:00Z",
          country: "DK",
          region: "Copenhagen",
        },
      ];

      const mockStmt = {
        all: vi.fn().mockReturnValue(mockRows),
      };

      mockDb.prepare.mockReturnValue(mockStmt);

      const results = await searchService.searchWiFi("network", {
        filters: { country: "DK" },
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].country).toBe("DK");
    });

    it("should handle missing wifi_networks table", async () => {
      const mockStmt = {
        get: vi.fn().mockReturnValue(null),
      };

      mockDb.prepare.mockReturnValue(mockStmt);

      const results = await searchService.searchWiFi("test", { limit: 10 });

      expect(results).toHaveLength(0);
    });
  });

  describe("Unified Search", () => {
    it("should perform unified search across all types", async () => {
      // Mock individual search methods
      vi.spyOn(searchService, "searchKnowledge").mockResolvedValue([
        { id: "kb1", title: "Knowledge 1", type: "knowledge" },
      ]);
      vi.spyOn(searchService, "searchSources").mockResolvedValue([
        { id: "src1", name: "Source 1", type: "source" },
      ]);
      vi.spyOn(searchService, "searchIntelligence").mockResolvedValue([
        { id: "int1", title: "Intelligence 1", type: "intelligence" },
      ]);
      vi.spyOn(searchService, "searchAgents").mockResolvedValue([
        { id: "agent1", workflowName: "Agent 1", type: "agent" },
      ]);
      vi.spyOn(searchService, "searchWiFi").mockResolvedValue([
        { id: "wifi1", ssid: "WiFi 1", type: "wifi" },
      ]);

      const results = await searchService.unifiedSearch("test", { limit: 10 });

      expect(results).toHaveLength(5);
      expect(results[0].type).toBe("knowledge");
      expect(results[1].type).toBe("source");
      expect(results[2].type).toBe("intelligence");
      expect(results[3].type).toBe("agent");
      expect(results[4].type).toBe("wifi");
    });

    it("should limit results correctly", async () => {
      vi.spyOn(searchService, "searchKnowledge").mockResolvedValue([
        { id: "kb1", title: "Knowledge 1", type: "knowledge" },
        { id: "kb2", title: "Knowledge 2", type: "knowledge" },
      ]);
      vi.spyOn(searchService, "searchSources").mockResolvedValue([
        { id: "src1", name: "Source 1", type: "source" },
      ]);

      const results = await searchService.unifiedSearch("test", { limit: 2 });

      expect(results).toHaveLength(2);
    });
  });

  describe("Relevance Scoring", () => {
    it("should calculate relevance scores correctly", () => {
      const query = "cybersecurity threat";
      const text = "This is about cybersecurity threats and vulnerabilities";

      const score = searchService.calculateRelevance(query, text);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should handle exact matches", () => {
      const query = "cybersecurity";
      const text = "cybersecurity is important";

      const score = searchService.calculateRelevance(query, text);

      expect(score).toBeGreaterThan(50);
    });

    it("should handle partial matches", () => {
      const query = "cyber security";
      const text = "cybersecurity and information security";

      const score = searchService.calculateRelevance(query, text);

      expect(score).toBeGreaterThan(0);
    });

    it("should handle no matches", () => {
      const query = "nonexistent";
      const text = "completely different content";

      const score = searchService.calculateRelevance(query, text);

      expect(score).toBe(0);
    });
  });

  describe("Search Suggestions", () => {
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

    it("should handle empty results", () => {
      const query = "test";
      const results = [];

      const suggestions = searchService.generateSuggestions(query, results);

      expect(suggestions).toHaveLength(0);
    });
  });

  describe("Search Analytics", () => {
    it("should track search history", () => {
      searchService.logSearch("test query", "knowledge", 5);
      searchService.logSearch("another query", "sources", 3);

      const analytics = searchService.getSearchAnalytics();

      expect(analytics.totalSearches).toBe(2);
      expect(analytics.searchesByType.knowledge).toBe(1);
      expect(analytics.searchesByType.sources).toBe(1);
      expect(analytics.popularQueries).toHaveLength(2);
    });

    it("should calculate average results", () => {
      searchService.logSearch("query1", "knowledge", 10);
      searchService.logSearch("query2", "sources", 5);

      const analytics = searchService.getSearchAnalytics();

      expect(analytics.averageResults).toBe(7.5);
    });

    it("should limit search history", () => {
      // Add more than 1000 searches
      for (let i = 0; i < 1001; i++) {
        searchService.logSearch(`query${i}`, "knowledge", 1);
      }

      const analytics = searchService.getSearchAnalytics();

      expect(analytics.totalSearches).toBeLessThanOrEqual(1000);
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockDb.prepare.mockImplementation(() => {
        throw new Error("Database error");
      });

      const results = await searchService.searchSources("test", { limit: 10 });

      expect(results).toHaveLength(0);
    });

    it("should handle file system errors", async () => {
      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));

      const results = await searchService.searchKnowledge("test", {
        limit: 10,
      });

      expect(results).toHaveLength(0);
    });
  });
});
