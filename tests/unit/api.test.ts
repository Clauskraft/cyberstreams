import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";

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

vi.mock("../../lib/searchService.js", () => ({
  SearchService: vi.fn().mockImplementation(() => ({
    search: vi.fn(),
    unifiedSearch: vi.fn(),
    searchKnowledge: vi.fn(),
    searchSources: vi.fn(),
    searchIntelligence: vi.fn(),
    searchAgents: vi.fn(),
    searchWiFi: vi.fn(),
  })),
}));

describe("API Route Tests", () => {
  let app: express.Application;

  beforeEach(async () => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());

    // Mock the routes
    app.post("/api/search/search", (req, res) => {
      const { query, type, limit } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          error: "Query is required and must be a string",
        });
      }

      if (limit && (typeof limit !== "number" || limit < 0)) {
        return res.status(400).json({
          success: false,
          error: "Limit must be a positive number",
        });
      }

      const validTypes = ["unified", "knowledge", "sources", "intelligence", "agents", "wifi"];
      if (type && !validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: "Invalid search type",
        });
      }

      res.json({
        success: true,
        data: {
          results: [
            {
              id: "test-result",
              title: "Test Result",
              type: type || "unified",
              relevanceScore: 95,
            },
          ],
          total: 1,
          query,
          type: type || "unified",
        },
      });
    });

    app.post("/api/sources/discover", (req, res) => {
      const { region, limit } = req.body;

      if (!region || typeof region !== "string") {
        return res.status(400).json({
          success: false,
          error: "Region is required and must be a string",
        });
      }

      const validRegions = ["all", "danish", "european", "international", "darkweb"];
      if (!validRegions.includes(region)) {
        return res.status(400).json({
          success: false,
          error: "Invalid region",
        });
      }

      if (limit && (typeof limit !== "number" || limit < 0)) {
        return res.status(400).json({
          success: false,
          error: "Limit must be a positive number",
        });
      }

      // Mock source discovery based on region
      const sources = [];
      const sourceCount = limit || 50;

      if (region === "danish" || region === "all") {
        for (let i = 0; i < Math.min(sourceCount, 40); i++) {
          sources.push({
            name: `Danish Source ${i + 1}`,
            domain: `source${i + 1}.dk`,
            type: "government",
            credibility: 90 + (i % 10),
            geography: ["DK"],
            sectors: ["cybersecurity"],
          });
        }
      }

      if (region === "european" || region === "all") {
        for (let i = 0; i < Math.min(sourceCount, 50); i++) {
          sources.push({
            name: `European Source ${i + 1}`,
            domain: `source${i + 1}.eu`,
            type: "government",
            credibility: 85 + (i % 15),
            geography: ["EU"],
            sectors: ["cybersecurity"],
          });
        }
      }

      if (region === "international" || region === "all") {
        for (let i = 0; i < Math.min(sourceCount, 50); i++) {
          sources.push({
            name: `International Source ${i + 1}`,
            domain: `source${i + 1}.com`,
            type: "government",
            credibility: 80 + (i % 20),
            geography: ["US"],
            sectors: ["cybersecurity"],
          });
        }
      }

      if (region === "darkweb" || region === "all") {
        for (let i = 0; i < Math.min(sourceCount, 20); i++) {
          sources.push({
            name: `Darkweb Source ${i + 1}`,
            domain: `source${i + 1}.onion`,
            type: "organization",
            credibility: 70 + (i % 30),
            geography: ["Global"],
            sectors: ["privacy"],
            openSource: true,
          });
        }
      }

      res.json({
        success: true,
        data: {
          sources: sources.slice(0, limit || 50),
          total: sources.length,
          region,
          timestamp: new Date().toISOString(),
        },
      });
    });

    app.get("/api/knowledge/categories", (req, res) => {
      res.json({
        success: true,
        data: [
          { key: "cia_methods", name: "CIA Methods", count: 3 },
          { key: "osint_techniques", name: "OSINT Techniques", count: 3 },
          { key: "analysis_frameworks", name: "Analysis Frameworks", count: 3 },
          { key: "wikileaks_intel", name: "WikiLeaks Intel", count: 2 },
          { key: "cyber_intelligence", name: "Cyber Intelligence", count: 2 },
          { key: "counterintelligence", name: "Counterintelligence", count: 1 },
        ],
      });
    });

    app.post("/api/knowledge/search", (req, res) => {
      const { query, limit } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          error: "Query is required and must be a string",
        });
      }

      res.json({
        success: true,
        data: [
          {
            id: "test-knowledge",
            title: "Test Knowledge Article",
            content: "Test content about " + query,
            category: "cia_methods",
            tags: ["test", "knowledge"],
            source: "Test Source",
            author: "Test Author",
            date: "2025-01-27T10:00:00Z",
          },
        ],
      });
    });

    app.get("/api/agentic/workflows", (req, res) => {
      res.json({
        success: true,
        data: {
          workflows: [
            {
              id: "email_warning_generation",
              name: "Email Warning Generation",
              description: "Automated workflow to generate and send email warnings",
              category: "communication",
              steps: [
                {
                  id: "threat_assessment",
                  name: "Threat Assessment",
                  type: "analysis",
                  description: "Analyze threat severity and impact",
                },
                {
                  id: "content_generation",
                  name: "Content Generation",
                  type: "generation",
                  description: "Generate warning content",
                },
                {
                  id: "email_delivery",
                  name: "Email Delivery",
                  type: "action",
                  description: "Send email to recipients",
                },
              ],
              triggers: ["high_severity_threat", "critical_vulnerability"],
              estimated_duration: "5-15 minutes",
              success_criteria: ["email_sent", "recipients_notified"],
            },
          ],
        },
      });
    });

    app.post("/api/agentic/runs", (req, res) => {
      const { workflowId, inputs, priority } = req.body;

      if (!workflowId || typeof workflowId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Workflow ID is required",
        });
      }

      res.json({
        success: true,
        data: {
          id: "run-" + Date.now(),
          workflowId,
          workflowName: "Test Workflow",
          status: "pending",
          priority: priority || "normal",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          inputs: inputs || {},
          results: {},
        },
      });
    });
  });

  describe("Search API", () => {
    it("should handle valid search requests", async () => {
      const response = await request(app)
        .post("/api/search/search")
        .send({
          query: "cybersecurity threat",
          type: "unified",
          limit: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(1);
      expect(response.body.data.query).toBe("cybersecurity threat");
      expect(response.body.data.type).toBe("unified");
    });

    it("should validate required query parameter", async () => {
      const response = await request(app)
        .post("/api/search/search")
        .send({
          type: "unified",
          limit: 10,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Query is required");
    });

    it("should validate query type", async () => {
      const response = await request(app)
        .post("/api/search/search")
        .send({
          query: 123,
          type: "unified",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("must be a string");
    });

    it("should validate search type", async () => {
      const response = await request(app)
        .post("/api/search/search")
        .send({
          query: "test",
          type: "invalid_type",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid search type");
    });

    it("should validate limit parameter", async () => {
      const response = await request(app)
        .post("/api/search/search")
        .send({
          query: "test",
          limit: -1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("positive number");
    });

    it("should handle different search types", async () => {
      const types = ["knowledge", "sources", "intelligence", "agents", "wifi"];

      for (const type of types) {
        const response = await request(app)
          .post("/api/search/search")
          .send({
            query: "test",
            type,
          });

        expect(response.status).toBe(200);
        expect(response.body.data.type).toBe(type);
      }
    });
  });

  describe("Source Discovery API", () => {
    it("should discover Danish sources", async () => {
      const response = await request(app)
        .post("/api/sources/discover")
        .send({
          region: "danish",
          limit: 40,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sources).toHaveLength(40);
      expect(response.body.data.region).toBe("danish");
      expect(response.body.data.sources[0].geography).toContain("DK");
    });

    it("should discover European sources", async () => {
      const response = await request(app)
        .post("/api/sources/discover")
        .send({
          region: "european",
          limit: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.sources).toHaveLength(50);
      expect(response.body.data.region).toBe("european");
      expect(response.body.data.sources[0].geography).toContain("EU");
    });

    it("should discover international sources", async () => {
      const response = await request(app)
        .post("/api/sources/discover")
        .send({
          region: "international",
          limit: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.sources).toHaveLength(50);
      expect(response.body.data.region).toBe("international");
      expect(response.body.data.sources[0].geography).toContain("US");
    });

    it("should discover darkweb sources", async () => {
      const response = await request(app)
        .post("/api/sources/discover")
        .send({
          region: "darkweb",
          limit: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.sources).toHaveLength(20);
      expect(response.body.data.region).toBe("darkweb");
      expect(response.body.data.sources[0].openSource).toBe(true);
    });

    it("should discover all sources", async () => {
      const response = await request(app)
        .post("/api/sources/discover")
        .send({
          region: "all",
          limit: 100,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.sources.length).toBeGreaterThan(0);
      expect(response.body.data.region).toBe("all");
    });

    it("should validate required region parameter", async () => {
      const response = await request(app)
        .post("/api/sources/discover")
        .send({
          limit: 50,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Region is required");
    });

    it("should validate region type", async () => {
      const response = await request(app)
        .post("/api/sources/discover")
        .send({
          region: 123,
          limit: 50,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("must be a string");
    });

    it("should validate region value", async () => {
      const response = await request(app)
        .post("/api/sources/discover")
        .send({
          region: "invalid_region",
          limit: 50,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid region");
    });

    it("should validate limit parameter", async () => {
      const response = await request(app)
        .post("/api/sources/discover")
        .send({
          region: "danish",
          limit: -1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("positive number");
    });
  });

  describe("Knowledge API", () => {
    it("should get knowledge categories", async () => {
      const response = await request(app).get("/api/knowledge/categories");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(6);
      expect(response.body.data[0]).toHaveProperty("key");
      expect(response.body.data[0]).toHaveProperty("name");
      expect(response.body.data[0]).toHaveProperty("count");
    });

    it("should search knowledge base", async () => {
      const response = await request(app)
        .post("/api/knowledge/search")
        .send({
          query: "CIA HUMINT techniques",
          limit: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe("Test Knowledge Article");
    });

    it("should validate knowledge search query", async () => {
      const response = await request(app)
        .post("/api/knowledge/search")
        .send({
          limit: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Query is required");
    });
  });

  describe("Agentic API", () => {
    it("should get workflows", async () => {
      const response = await request(app).get("/api/agentic/workflows");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workflows).toHaveLength(1);
      expect(response.body.data.workflows[0].id).toBe("email_warning_generation");
      expect(response.body.data.workflows[0].steps).toHaveLength(3);
    });

    it("should create workflow run", async () => {
      const response = await request(app)
        .post("/api/agentic/runs")
        .send({
          workflowId: "email_warning_generation",
          inputs: { threat_level: "high" },
          priority: "high",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workflowId).toBe("email_warning_generation");
      expect(response.body.data.status).toBe("pending");
      expect(response.body.data.priority).toBe("high");
    });

    it("should validate workflow ID", async () => {
      const response = await request(app)
        .post("/api/agentic/runs")
        .send({
          inputs: { threat_level: "high" },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Workflow ID is required");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/api/search/search")
        .set("Content-Type", "application/json")
        .send("invalid json");

      expect(response.status).toBe(400);
    });

    it("should handle missing Content-Type header", async () => {
      const response = await request(app)
        .post("/api/search/search")
        .send("test");

      expect(response.status).toBe(400);
    });

    it("should handle large request bodies", async () => {
      const largeQuery = "a".repeat(10000);
      const response = await request(app)
        .post("/api/search/search")
        .send({
          query: largeQuery,
          type: "unified",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("Performance", () => {
    it("should handle concurrent requests", async () => {
      const requests = Array(10).fill(0).map(() =>
        request(app)
          .post("/api/search/search")
          .send({
            query: "test",
            type: "unified",
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it("should respond within acceptable time", async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post("/api/search/search")
        .send({
          query: "test",
          type: "unified",
        });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // 1 second
    });
  });
});
