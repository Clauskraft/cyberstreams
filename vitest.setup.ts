import { afterEach, vi, expect } from "vitest";
import searchService from "./lib/searchService.js";
import { __resetInMemorySourcesForTests } from "./lib/authorizedSourceRepository.js";
import * as matchers from "@testing-library/jest-dom/matchers";

if (!global.fetch) {
  global.fetch = vi.fn();
}

// Global mocks for external libs used by unrelated test suites
vi.mock("../lib/vectorClient.js", async () => {
  const actual = await vi.importActual<any>("../lib/vectorClient.js");
  class QdrantClientMock {
    constructor() {}
    upsert() {
      return Promise.resolve();
    }
  }
  class WeaviateClientMock {
    constructor() {}
    upsert() {
      return Promise.resolve();
    }
  }
  return {
    ...actual,
    QdrantClient: QdrantClientMock as any,
    WeaviateClient: WeaviateClientMock,
    createEmbedding: async () => new Array(3).fill(0.1),
  };
});

vi.mock("node-cron", () => {
  return {
    default: {
      schedule: () => ({ start: () => {}, stop: () => {} }),
    },
    schedule: () => ({ start: () => {}, stop: () => {} }),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  // Reset analytics between tests to avoid cross-test pollution
  if (searchService && Array.isArray((searchService as any).searchHistory)) {
    (searchService as any).searchHistory = [];
  }
  // Reset in-memory authorized sources between tests
  try {
    __resetInMemorySourcesForTests();
  } catch {}
});

expect.extend(matchers);

// Provide a minimal mock for @testing-library/dom to satisfy react testing import
vi.mock("@testing-library/dom", () => {
  return {
    fireEvent: new Proxy(
      {},
      {
        get: () => () => {},
      }
    ),
    queries: {},
    getQueriesForElement: () => ({} as any),
    prettyDOM: () => "",
  } as any;
});

// Ensure tests don't attempt to bind to fixed ports
process.env.PORT = process.env.PORT || "0";
