import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getPool, withClient } from "../../lib/postgres.js";
import {
  upsertAuthorizedSource,
  getAuthorizedSources,
  ensureSourcesTable,
} from "../../lib/authorizedSourceRepository.js";
import {
  upsertApiKey,
  findApiKey,
  deleteApiKey,
} from "../../lib/integrationSettingsRepository.js";

// Mock external dependencies
vi.mock("../../lib/postgres.js", () => ({
  getPool: vi.fn(),
  withClient: vi.fn(),
}));

vi.mock("../../lib/logger.js", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Database Layer Tests", () => {
  let mockDb: any;
  let mockStmt: any;

  beforeEach(() => {
    mockStmt = {
      run: vi.fn(),
      all: vi.fn(),
      get: vi.fn(),
    };

    mockDb = {
      prepare: vi.fn().mockReturnValue(mockStmt),
      exec: vi.fn(),
      close: vi.fn(),
    };

    vi.mocked(getPool).mockReturnValue(mockDb);
    vi.mocked(withClient).mockImplementation(async (callback) => {
      return await callback(mockDb);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("AuthorizedSourceRepository", () => {
    it("should create sources table", async () => {
      mockDb.exec.mockReturnValue(undefined);

      await ensureSourcesTable();

      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS sources")
      );
    });

    it("should upsert source with correct data transformation", async () => {
      mockStmt.run.mockReturnValue({ changes: 1 });

      const source = {
        id: "test-source",
        name: "Test Source",
        domain: "test.com",
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

      await upsertAuthorizedSource(source);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT OR REPLACE INTO sources")
      );

      const callArgs = mockStmt.run.mock.calls[0][0];
      expect(callArgs[0]).toBe("test-source");
      expect(callArgs[1]).toBe("Test Source");
      expect(callArgs[2]).toBe("test.com");
      expect(callArgs[3]).toBe("government");
      expect(callArgs[4]).toBe(95);
      expect(callArgs[5]).toBe(90);
      expect(callArgs[6]).toBe(85);
      expect(callArgs[7]).toBe(80);
      expect(callArgs[8]).toBe(75);
      expect(callArgs[11]).toBe(JSON.stringify([])); // formats
      expect(callArgs[12]).toBe(60); // updateFrequency
      expect(callArgs[13]).toBe(null); // logoUrl
      expect(callArgs[14]).toBe(1); // verified as integer
      expect(callArgs[15]).toBe("high"); // priority
      expect(callArgs[16]).toBe(JSON.stringify(["DK", "EU"])); // geography
      expect(callArgs[17]).toBe(JSON.stringify(["cybersecurity", "government"])); // sectors
      expect(callArgs[18]).toBe(JSON.stringify(["da", "en"])); // languages
    });

    it("should retrieve sources with correct data transformation", async () => {
      const mockRows = [
        {
          id: "test-source",
          name: "Test Source",
          domain: "test.com",
          source_type: "government",
          credibility_score: 95,
          timeliness_score: 90,
          accuracy_score: 85,
          context_score: 80,
          relevance_score: 75,
          geography: '["DK", "EU"]',
          sectors: '["cybersecurity", "government"]',
          languages: '["da", "en"]',
          verified: 1,
          priority: "high",
        },
      ];

      mockStmt.all.mockReturnValue(mockRows);

      const sources = await getAuthorizedSources();

      expect(sources).toHaveLength(1);
      expect(sources[0]).toEqual({
        id: "test-source",
        name: "Test Source",
        domain: "test.com",
        source_type: "government",
        credibility_score: 95,
        timeliness_score: 90,
        accuracy_score: 85,
        context_score: 80,
        relevance_score: 75,
        formats: [],
        geography: ["DK", "EU"],
        sectors: ["cybersecurity", "government"],
        languages: ["da", "en"],
        verified: true,
        priority: "high",
      });
    });

    it("should handle boolean conversion correctly", async () => {
      mockStmt.run.mockReturnValue({ changes: 1 });

      const source = {
        id: "test-source",
        name: "Test Source",
        domain: "test.com",
        type: "government",
        verified: false,
      };

      await upsertAuthorizedSource(source);

      const callArgs = mockStmt.run.mock.calls[0][0];
      expect(callArgs[14]).toBe(0); // false converted to 0
    });

    it("should handle empty arrays correctly", async () => {
      mockStmt.run.mockReturnValue({ changes: 1 });

      const source = {
        id: "test-source",
        name: "Test Source",
        domain: "test.com",
        type: "government",
        geography: [],
        sectors: [],
        languages: [],
      };

      await upsertAuthorizedSource(source);

      const callArgs = mockStmt.run.mock.calls[0][0];
      expect(callArgs[11]).toBe("[]"); // formats
      expect(callArgs[12]).toBe(60); // updateFrequency
      expect(callArgs[13]).toBe(null); // logoUrl
      expect(callArgs[14]).toBe(0); // verified as integer (false)
      expect(callArgs[15]).toBe("medium"); // priority
      expect(callArgs[16]).toBe("[]"); // geography
      expect(callArgs[17]).toBe("[]"); // sectors
      expect(callArgs[18]).toBe("[]"); // languages
    });
  });

  describe("IntegrationSettingsRepository", () => {
    it("should upsert API key", async () => {
      mockDb.exec.mockReturnValue(undefined);
      mockStmt.run.mockReturnValue({ changes: 1 });
      mockStmt.get.mockReturnValue({
        id: "test-key",
        service: "test-service",
        key_value: "encrypted-key",
      });

      const result = await upsertApiKey("test-service", "test-key");

      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS integration_api_keys")
      );
      expect(mockStmt.run).toHaveBeenCalledWith("test-service", "test-key");
      expect(result).toEqual({
        id: "test-key",
        service: "test-service",
        key_value: "encrypted-key",
      });
    });

    it("should find API key", async () => {
      mockStmt.get.mockReturnValue({
        id: "test-key",
        service: "test-service",
        key_value: "encrypted-key",
      });

      const result = await findApiKey("test-service");

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("SELECT name, value, created_at, updated_at")
      );
      expect(mockStmt.get).toHaveBeenCalledWith("test-service");
      expect(result).toEqual({
        id: "test-key",
        service: "test-service",
        key_value: "encrypted-key",
      });
    });

    it("should delete API key", async () => {
      mockStmt.run.mockReturnValue({ changes: 1 });

      const result = await deleteApiKey("test-service");

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM integration_api_keys")
      );
      expect(mockStmt.run).toHaveBeenCalledWith("test-service");
      expect(result).toBe(true);
    });

    it("should return false when deleting non-existent key", async () => {
      mockStmt.run.mockReturnValue({ changes: 0 });

      const result = await deleteApiKey("non-existent-service");

      expect(result).toBe(false);
    });
  });

  describe("Database Error Handling", () => {
    it("should handle database connection errors", async () => {
      vi.mocked(withClient).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(upsertAuthorizedSource({})).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle SQL execution errors", async () => {
      mockStmt.run.mockImplementation(() => {
        throw new Error("SQL execution failed");
      });

      await expect(
        upsertAuthorizedSource({
          id: "test",
          name: "Test",
          domain: "test.com",
          type: "government",
        })
      ).rejects.toThrow("SQL execution failed");
    });

    it("should handle invalid JSON in database", async () => {
      const mockRows = [
        {
          id: "test-source",
          geography: "invalid-json",
          sectors: '["cybersecurity"]',
          verified: 1,
        },
      ];

      mockStmt.all.mockReturnValue(mockRows);

      // Should handle invalid JSON gracefully
      await expect(getAuthorizedSources()).rejects.toThrow();
    });
  });

  describe("Database Performance", () => {
    it("should handle large batch operations", async () => {
      mockStmt.run.mockReturnValue({ changes: 1 });

      const sources = Array(100).fill(0).map((_, i) => ({
        id: `source-${i}`,
        name: `Source ${i}`,
        domain: `source${i}.com`,
        type: "government",
        credibilityScore: 90 + (i % 10),
      }));

      // Test that we can handle multiple operations
      for (const source of sources) {
        await upsertAuthorizedSource(source);
      }

      expect(mockStmt.run).toHaveBeenCalledTimes(100);
    });

    it("should handle concurrent operations", async () => {
      mockStmt.run.mockReturnValue({ changes: 1 });

      const operations = Array(10).fill(0).map((_, i) =>
        upsertAuthorizedSource({
          id: `concurrent-${i}`,
          name: `Concurrent Source ${i}`,
          domain: `concurrent${i}.com`,
          type: "government",
        })
      );

      await Promise.all(operations);

      expect(mockStmt.run).toHaveBeenCalledTimes(10);
    });
  });
});
