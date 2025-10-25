import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fetch from "node-fetch";
import { performance } from "perf_hooks";
import * as smoketest from "../online-smoketest.js";

// Mock node-fetch
vi.mock("node-fetch", () => ({
  __esModule: true,
  default: vi.fn(),
}));

// Mock performance
vi.spyOn(performance, "now");

// Prepare a spy handle we can re-initialize per test
let logSpy: any;

describe("Cyberstreams Online Smoketest", () => {
  beforeEach(() => {
    // Reset mocks and results before each test
    vi.clearAllMocks();
    smoketest.resetResults();
    // Recreate spy after clearing mocks so calls are captured
    logSpy = vi.spyOn(smoketest, "log").mockImplementation(() => {});
  });

  describe("testOnlineConnectivity", () => {
    it("should PASS on successful health check", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ status: "OK" }),
      };
      fetch.mockResolvedValue(mockResponse);

      await smoketest.testOnlineConnectivity(
        "https://example.com",
        "production"
      );

      expect(smoketest.results.passed).toBe(1);
      expect(smoketest.results.failed).toBe(0);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[PASS] production Health Check"),
        "green"
      );
    });

    it("should FAIL on failed health check", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };
      fetch.mockResolvedValue(mockResponse);

      await smoketest.testOnlineConnectivity(
        "https://example.com",
        "production"
      );

      expect(smoketest.results.passed).toBe(0);
      expect(smoketest.results.failed).toBe(1);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[FAIL] production Health Check"),
        "red"
      );
    });

    it("should FAIL on request error", async () => {
      fetch.mockRejectedValue(new Error("Network error"));

      await smoketest.testOnlineConnectivity(
        "https://example.com",
        "production"
      );

      expect(smoketest.results.passed).toBe(0);
      expect(smoketest.results.failed).toBe(1);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Network error"),
        "red"
      );
    });
  });

  describe("testOnlineAPIEndpoints", () => {
    it("should PASS for all endpoints", async () => {
      const mockResponse = { ok: true, status: 200 };
      fetch.mockResolvedValue(mockResponse);

      await smoketest.testOnlineAPIEndpoints(
        "https://example.com",
        "production"
      );

      expect(smoketest.results.passed).toBe(6);
      expect(smoketest.results.failed).toBe(0);
    });

    it("should FAIL for an endpoint", async () => {
      fetch.mockResolvedValueOnce({ ok: true, status: 200 }); // health
      fetch.mockResolvedValueOnce({ ok: true, status: 200 }); // stats
      fetch.mockResolvedValueOnce({ ok: false, status: 500 }); // threats
      fetch.mockResolvedValue({ ok: true, status: 200 }); // rest

      await smoketest.testOnlineAPIEndpoints(
        "https://example.com",
        "production"
      );

      expect(smoketest.results.passed).toBe(5);
      expect(smoketest.results.failed).toBe(1);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[FAIL] GET /api/threats (production)"),
        "red"
      );
    });
  });

  // Add more tests for other functions like testOnlinePerformance, testOnlineSSL etc.
});
