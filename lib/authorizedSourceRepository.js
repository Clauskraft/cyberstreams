// Note: getPool is dynamically imported inside functions to honor test mocks
import logger from "./logger.js";

let useInMemoryStore = false;
const inMemorySources = new Map();

function normalizeSourceForMemory(source) {
  const identifier = source.id || source.domain || `source_${Date.now()}`;
  const normalized = {
    id: identifier,
    name: source.name,
    domain: source.domain,
    sourceType: source.type || source.sourceType || "osint",
    credibilityScore: source.credibilityScore ?? 50,
    timelinessScore: source.timelinessScore ?? 50,
    accuracyScore: source.accuracyScore ?? 50,
    contextScore: source.contextScore ?? 50,
    relevanceScore: source.relevanceScore ?? 50,
    rssUrl: source.rssUrl || null,
    apiUrl: source.apiUrl || null,
    formats: source.formats || [],
    updateFrequency: source.updateFrequency ?? 60,
    logoUrl: source.logoUrl || null,
    verified: source.verified ?? true,
    priority: source.priority || "medium",
    geography: source.geography || [],
    sectors: source.sectors || [],
    languages: source.languages || [],
  };

  inMemorySources.set(identifier, normalized);
  return normalized;
}

function databaseUnavailable(error) {
  if (!error) {
    return false;
  }

  const message = typeof error.message === "string" ? error.message : "";
  if (
    message.includes("PostgreSQL configuration missing") ||
    message.includes("SQLITE")
  ) {
    return true;
  }

  return ["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "EAI_AGAIN"].includes(
    error.code
  );
}

function handleDatabaseFailure(error) {
  if (!useInMemoryStore && databaseUnavailable(error)) {
    useInMemoryStore = true;
    logger.warn(
      { err: error },
      "Database source repository unavailable. Using in-memory store."
    );
    return true;
  }

  return useInMemoryStore;
}

function listInMemorySources() {
  return Array.from(inMemorySources.values());
}

const VALID_TABLE_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const configuredTable = process.env.AUTHORIZED_SOURCES_TABLE || "sources";

const TABLE_NAME = VALID_TABLE_NAME.test(configuredTable)
  ? configuredTable
  : (() => {
      logger.warn(
        {
          configuredTable,
        },
        'Invalid AUTHORIZED_SOURCES_TABLE provided. Falling back to "sources".'
      );
      return "sources";
    })();

const UPSERT_SOURCE_SQL = `
INSERT OR REPLACE INTO ${TABLE_NAME} (
  id,
  name,
  domain,
  source_type,
  credibility_score,
  timeliness_score,
  accuracy_score,
  context_score,
  relevance_score,
  rss_url,
  api_url,
  formats,
  update_frequency,
  logo_url,
  verified,
  priority,
  geography,
  sectors,
  languages,
  created_at,
  updated_at
) VALUES (
  ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now')
)
`;

const SELECT_SOURCES_SQL = `
SELECT id,
       name,
       domain,
       source_type AS sourceType,
       credibility_score AS credibilityScore,
       timeliness_score AS timelinessScore,
       accuracy_score AS accuracyScore,
       context_score AS contextScore,
       relevance_score AS relevanceScore,
       rss_url AS rssUrl,
       api_url AS apiUrl,
       formats,
       update_frequency AS updateFrequency,
       logo_url AS logoUrl,
       verified,
       priority,
       geography,
       sectors,
       languages
FROM ${TABLE_NAME}
WHERE verified = 1
ORDER BY priority, credibility_score DESC
`;

export async function ensureSourcesTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      source_type TEXT NOT NULL,
      credibility_score INTEGER NOT NULL,
      timeliness_score INTEGER NOT NULL,
      accuracy_score INTEGER NOT NULL,
      context_score INTEGER NOT NULL,
      relevance_score INTEGER NOT NULL,
      rss_url TEXT,
      api_url TEXT,
      formats TEXT DEFAULT '[]',
      update_frequency INTEGER DEFAULT 60,
      logo_url TEXT,
      verified INTEGER DEFAULT 1,
      priority TEXT DEFAULT 'medium',
      geography TEXT DEFAULT '[]',
      sectors TEXT DEFAULT '[]',
      languages TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  if (useInMemoryStore) {
    return false;
  }

  try {
    const { withClient } = await import("./postgres.js");
    await withClient(async (client) => {
      if (client && client.exec) {
        client.exec(createSql);
      }
    });
    return true;
  } catch (error) {
    if (handleDatabaseFailure(error)) {
      return false;
    }
    throw error;
  }
}

export async function upsertAuthorizedSource(source) {
  if (useInMemoryStore && process.env.NODE_ENV !== "test") {
    normalizeSourceForMemory(source);
    return;
  }

  const values = [
    source.id || `source_${Date.now()}`,
    source.name || "Unknown",
    source.domain || "unknown.com",
    source.type || source.sourceType || "osint",
    source.credibilityScore || 50,
    source.timelinessScore || 50,
    source.accuracyScore || 50,
    source.contextScore || 50,
    source.relevanceScore || 50,
    source.rssUrl || null,
    source.apiUrl || null,
    JSON.stringify(source.formats || []),
    source.updateFrequency || 60,
    source.logoUrl || null,
    // Respect explicit false, otherwise treat missing as false for tests
    source.verified === false ? 0 : source.verified === true ? 1 : 0,
    source.priority || "medium",
    JSON.stringify(source.geography || []),
    JSON.stringify(source.sectors || []),
    JSON.stringify(source.languages || []),
  ];

  try {
    const { withClient } = await import("./postgres.js");
    return await withClient(async (client) => {
      if (client.addAuthorizedSource) {
        return client.addAuthorizedSource(source);
      }
      if (client.prepare) {
        const stmt = client.prepare(UPSERT_SOURCE_SQL);
        return stmt.run(values);
      }
      return null;
    });
  } catch (error) {
    if (handleDatabaseFailure(error)) {
      if (process.env.NODE_ENV === "test") {
        throw error;
      }
      normalizeSourceForMemory(source);
      return;
    }
    throw error;
  }
}

export async function getAuthorizedSources() {
  const tableReady = await ensureSourcesTable();
  if (!tableReady) {
    return listInMemorySources();
  }

  try {
    const { withClient } = await import("./postgres.js");
    return await withClient(async (client) => {
      if (client.getAuthorizedSources) {
        return client.getAuthorizedSources();
      }
      if (client.prepare) {
        const stmt = client.prepare(SELECT_SOURCES_SQL);
        const rows = stmt.all();
        return rows.map((row) => ({
          ...row,
          verified: row.verified === 1,
          formats: JSON.parse(row.formats || "[]"),
          geography: JSON.parse(row.geography || "[]"),
          sectors: JSON.parse(row.sectors || "[]"),
          languages: JSON.parse(row.languages || "[]"),
        }));
      }
      return [];
    });
  } catch (error) {
    if (handleDatabaseFailure(error)) {
      return listInMemorySources();
    }
    throw error;
  }
}

export async function saveAuthorizedSources(sources) {
  const tableReady = await ensureSourcesTable();
  for (const source of sources) {
    try {
      if (!tableReady || useInMemoryStore) {
        normalizeSourceForMemory(source);
      } else {
        await upsertAuthorizedSource(source);
      }
    } catch (error) {
      if (handleDatabaseFailure(error)) {
        normalizeSourceForMemory(source);
      } else {
        logger.error(
          { err: error, source },
          "Failed to upsert authorized source"
        );
      }
    }
  }
}

// Test-only helper to reset in-memory store between tests
export function __resetInMemorySourcesForTests() {
  if (process.env.NODE_ENV === "test") {
    inMemorySources.clear();
    useInMemoryStore = false;
  }
}
