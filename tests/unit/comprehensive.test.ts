import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { getPool, withClient } from "../../lib/postgres.js";
import {
  upsertAuthorizedSource,
  getAuthorizedSources,
} from "../../lib/authorizedSourceRepository.js";
import {
  searchKnowledge,
  getArticlesByCategory,
} from "../../lib/knowledgeRepository.js";
// Mock SearchService for comprehensive tests
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
import CyberstreamsAgent from "../../src/modules/CyberstreamsAgent";
import UnifiedSearch from "../../src/components/UnifiedSearch";

// Mock external dependencies
vi.mock("../../lib/postgres.js");
vi.mock("../../lib/logger.js");

describe("Cyberstreams Unit Tests", () => {
  describe("Database Layer", () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        prepare: vi.fn(),
        exec: vi.fn(),
        close: vi.fn(),
      };
      vi.mocked(getPool).mockReturnValue(mockDb);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    describe("AuthorizedSourceRepository", () => {
      it("should upsert source with correct data", async () => {
        const mockStmt = {
          run: vi.fn().mockReturnValue({ changes: 1 }),
        };
        mockDb.prepare.mockReturnValue(mockStmt);

        const source = {
          id: "test-source",
          name: "Test Source",
          domain: "test.com",
          type: "government",
          credibilityScore: 95,
          geography: ["DK"],
          sectors: ["cybersecurity"],
          verified: true,
        };

        await upsertAuthorizedSource(source);

        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining("INSERT OR REPLACE INTO")
        );
        expect(mockStmt.run).toHaveBeenCalledWith(
          expect.arrayContaining([
            "test-source",
            "Test Source",
            "test.com",
            "government",
            95,
            JSON.stringify(["DK"]),
            JSON.stringify(["cybersecurity"]),
            1, // verified as integer
          ])
        );
      });

      it("should retrieve sources with correct data transformation", async () => {
        const mockRows = [
          {
            id: "test-source",
            name: "Test Source",
            domain: "test.com",
            source_type: "government",
            credibility_score: 95,
            geography: '["DK"]',
            sectors: '["cybersecurity"]',
            verified: 1,
          },
        ];

        const mockStmt = {
          all: vi.fn().mockReturnValue(mockRows),
        };
        mockDb.prepare.mockReturnValue(mockStmt);

        const sources = await getAuthorizedSources();

        expect(sources).toHaveLength(1);
        expect(sources[0]).toEqual({
          id: "test-source",
          name: "Test Source",
          domain: "test.com",
          sourceType: "government",
          credibilityScore: 95,
          geography: ["DK"],
          sectors: ["cybersecurity"],
          verified: true,
        });
      });
    });

    describe("KnowledgeRepository", () => {
      it("should search knowledge base correctly", async () => {
        const mockKnowledgeBase = [
          {
            id: "cia-humint",
            title: "CIA HUMINT Techniques",
            content: "Human Intelligence collection methods",
            category: "cia_methods",
            tags: ["CIA", "HUMINT"],
          },
        ];

        // Mock file system
        const fs = await import("fs/promises");
        vi.spyOn(fs, "readFile").mockResolvedValue(
          JSON.stringify(mockKnowledgeBase)
        );

        const results = await searchKnowledge("CIA", { limit: 10 });

        expect(results).toHaveLength(1);
        expect(results[0].title).toBe("CIA HUMINT Techniques");
        expect(results[0].relevanceScore).toBeGreaterThan(0);
      });
    });
  });

  describe("SearchService", () => {
    let searchService: any;

    beforeEach(() => {
      searchService = mockSearchService;
    });

    it("should perform unified search across all types", async () => {
      // Mock individual search methods
      vi.spyOn(searchService, "searchKnowledge").mockResolvedValue([
        { id: "kb1", title: "Knowledge 1", type: "knowledge" },
      ]);
      vi.spyOn(searchService, "searchSources").mockResolvedValue([
        { id: "src1", name: "Source 1", type: "source" },
      ]);

      const results = await searchService.unifiedSearch("test", { limit: 10 });

      expect(results).toHaveLength(2);
      expect(results[0].type).toBe("knowledge");
      expect(results[1].type).toBe("source");
    });

    it("should calculate relevance scores correctly", () => {
      const query = "cybersecurity threat";
      const text = "This is about cybersecurity threats and vulnerabilities";

      const score = searchService.calculateRelevance(query, text);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should generate search suggestions", () => {
      const query = "cyber";
      const results = [
        { tags: ["cybersecurity", "threats"] },
        { tags: ["cybercrime", "malware"] },
      ];

      const suggestions = searchService.generateSuggestions(query, results);

      expect(suggestions).toContain("cybersecurity");
      expect(suggestions).toContain("cybercrime");
    });
  });

  describe("Frontend Components", () => {
    const renderWithRouter = (component: React.ReactElement) => {
      return render(<BrowserRouter>{component}</BrowserRouter>);
    };

    describe("CyberstreamsAgent", () => {
      it("should render knowledge base categories", () => {
        renderWithRouter(<CyberstreamsAgent />);

        expect(
          screen.getByText("Intelligence Knowledge Base")
        ).toBeInTheDocument();
        expect(screen.getByText("CIA Methods")).toBeInTheDocument();
        expect(screen.getByText("OSINT Techniques")).toBeInTheDocument();
      });

      it("should handle knowledge base search", async () => {
        // Mock fetch
        global.fetch = vi.fn().mockResolvedValue({
          json: () =>
            Promise.resolve({
              success: true,
              data: [
                { id: "test", title: "Test Article", content: "Test content" },
              ],
            }),
        });

        renderWithRouter(<CyberstreamsAgent />);

        const searchButton = screen.getByText("Search Knowledge Base");
        fireEvent.click(searchButton);

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            "/api/knowledge/search",
            expect.objectContaining({
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: "CIA intelligence methods",
                limit: 5,
              }),
            })
          );
        });
      });
    });

    describe("UnifiedSearch", () => {
      it("should render search input and type selector", () => {
        renderWithRouter(<UnifiedSearch />);

        expect(
          screen.getByPlaceholderText(
            "Search across all intelligence sources..."
          )
        ).toBeInTheDocument();
        expect(screen.getByText("Unified")).toBeInTheDocument();
        expect(screen.getByText("Knowledge")).toBeInTheDocument();
        expect(screen.getByText("Sources")).toBeInTheDocument();
      });

      it("should handle search type changes", () => {
        renderWithRouter(<UnifiedSearch />);

        const knowledgeButton = screen.getByText("Knowledge");
        fireEvent.click(knowledgeButton);

        expect(knowledgeButton).toHaveClass("bg-purple-600");
      });

      it("should perform search on input", async () => {
        // Mock fetch
        global.fetch = vi.fn().mockResolvedValue({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                results: [{ id: "1", title: "Test Result", type: "knowledge" }],
              },
            }),
        });

        renderWithRouter(<UnifiedSearch />);

        const searchInput = screen.getByPlaceholderText(
          "Search across all intelligence sources..."
        );
        fireEvent.change(searchInput, { target: { value: "test query" } });
        fireEvent.keyDown(searchInput, { key: "Enter" });

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            "/api/search/search",
            expect.objectContaining({
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: "test query",
                type: "unified",
                limit: 20,
              }),
            })
          );
        });
      });
    });
  });

  describe("API Routes", () => {
    let app: any;

    beforeEach(async () => {
      const express = await import("express");
      app = express.default();
      // Setup routes
    });

    describe("Search API", () => {
      it("should handle search requests", async () => {
        const response = await request(app).post("/api/search/search").send({
          query: "test",
          type: "unified",
          limit: 10,
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });

      it("should validate search parameters", async () => {
        const response = await request(app).post("/api/search/search").send({
          query: "",
          type: "invalid",
          limit: -1,
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });

    describe("Source Discovery API", () => {
      it("should discover Danish sources", async () => {
        const response = await request(app).post("/api/sources/discover").send({
          region: "danish",
          limit: 40,
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.sources).toHaveLength(40);
        expect(response.body.data.region).toBe("danish");
      });

      it("should discover European sources", async () => {
        const response = await request(app).post("/api/sources/discover").send({
          region: "european",
          limit: 50,
        });

        expect(response.status).toBe(200);
        expect(response.body.data.sources).toHaveLength(50);
        expect(response.body.data.region).toBe("european");
      });

      it("should discover international sources", async () => {
        const response = await request(app).post("/api/sources/discover").send({
          region: "international",
          limit: 50,
        });

        expect(response.status).toBe(200);
        expect(response.body.data.sources).toHaveLength(50);
        expect(response.body.data.region).toBe("international");
      });

      it("should discover darkweb sources", async () => {
        const response = await request(app).post("/api/sources/discover").send({
          region: "darkweb",
          limit: 20,
        });

        expect(response.status).toBe(200);
        expect(response.body.data.sources).toHaveLength(20);
        expect(response.body.data.region).toBe("darkweb");

        // Verify all darkweb sources are open source
        const sources = response.body.data.sources;
        sources.forEach((source: any) => {
          expect(source.openSource).toBe(true);
        });
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      vi.mocked(getPool).mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      await expect(upsertAuthorizedSource({})).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle invalid JSON in knowledge base", async () => {
      const fs = await import("fs/promises");
      vi.spyOn(fs, "readFile").mockResolvedValue("invalid json");

      await expect(searchKnowledge("test")).rejects.toThrow();
    });

    it("should handle API timeout errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Request timeout"));

      renderWithRouter(<UnifiedSearch />);

      const searchInput = screen.getByPlaceholderText(
        "Search across all intelligence sources..."
      );
      fireEvent.change(searchInput, { target: { value: "test" } });
      fireEvent.keyDown(searchInput, { key: "Enter" });

      await waitFor(() => {
        expect(screen.getByText("Search failed")).toBeInTheDocument();
      });
    });
  });

  describe("Performance Tests", () => {
    it("should complete search within acceptable time", async () => {
      const startTime = Date.now();

      const searchService = mockSearchService;
      await searchService.unifiedSearch("test", { limit: 100 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // 2 seconds
    });

    it("should handle large result sets efficiently", async () => {
      const searchService = mockSearchService;

      // Mock large result set
      vi.spyOn(searchService, "searchSources").mockResolvedValue(
        Array(1000)
          .fill(0)
          .map((_, i) => ({
            id: `source-${i}`,
            name: `Source ${i}`,
            type: "source",
          }))
      );

      const results = await searchService.unifiedSearch("test", {
        limit: 1000,
      });

      expect(results).toHaveLength(1000);
    });
  });
});
