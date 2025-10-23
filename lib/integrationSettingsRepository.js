import { withClient } from "./postgres.js";
import logger from "./logger.js";

const inMemoryKeys = new Map();
let useInMemoryStore = false;

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
      "Database integration store unavailable. Falling back to in-memory storage for API keys."
    );
    return true;
  }

  return useInMemoryStore;
}

function listInMemoryKeys() {
  return Array.from(inMemoryKeys.values()).sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

function upsertInMemoryKey(name, value) {
  const now = new Date().toISOString();
  const existing = inMemoryKeys.get(name);
  const record = {
    name,
    value,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  inMemoryKeys.set(name, record);
  return record;
}

function deleteInMemoryKey(name) {
  const existed = inMemoryKeys.delete(name);
  return existed;
}

function findInMemoryKey(name) {
  return inMemoryKeys.get(name) || null;
}

const CREATE_API_KEYS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS integration_api_keys (
    name TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

const UPSERT_API_KEY_SQL = `
  INSERT OR REPLACE INTO integration_api_keys (name, value, created_at, updated_at)
  VALUES (?, ?, datetime('now'), datetime('now'))
`;

const SELECT_API_KEYS_SQL = `
  SELECT name, value, created_at, updated_at
  FROM integration_api_keys
  ORDER BY updated_at DESC
`;

const DELETE_API_KEY_SQL = `
  DELETE FROM integration_api_keys
  WHERE name = ?
`;

const SELECT_API_KEY_SQL = `
  SELECT name, value, created_at, updated_at
  FROM integration_api_keys
  WHERE name = ?
`;

export async function ensureIntegrationTables() {
  if (useInMemoryStore) {
    return false;
  }

  try {
    await withClient(async (client) => {
      if (client.exec) {
        client.exec(CREATE_API_KEYS_TABLE_SQL);
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

export async function listApiKeys() {
  const tablesReady = await ensureIntegrationTables();
  if (!tablesReady) {
    return listInMemoryKeys();
  }

  try {
    const result = await withClient((client) => {
      if (client.getAuthorizedSources) {
        // Fallback JSON store keeps integrations in memory map
        return listInMemoryKeys();
      }

      if (client.prepare) {
        const stmt = client.prepare(SELECT_API_KEYS_SQL);
        return stmt.all();
      }

      return [];
    });
    return result;
  } catch (error) {
    if (handleDatabaseFailure(error)) {
      return listInMemoryKeys();
    }
    throw error;
  }
}

export async function upsertApiKey(name, value) {
  if (!name || !value) {
    throw new Error("Both name and value are required to store an API key");
  }

  const tablesReady = await ensureIntegrationTables();
  const normalizedName = name.trim().toLowerCase();
  const trimmedValue = value.trim();

  if (!tablesReady) {
    return upsertInMemoryKey(normalizedName, trimmedValue);
  }

  try {
    const result = await withClient((client) => {
      if (client.addAuthorizedSource) {
        return upsertInMemoryKey(normalizedName, trimmedValue);
      }

      if (client.prepare) {
        const stmt = client.prepare(UPSERT_API_KEY_SQL);
        stmt.run(normalizedName, trimmedValue);
        // Return the inserted/updated record
        const selectStmt = client.prepare(
          "SELECT * FROM integration_api_keys WHERE name = ?"
        );
        return selectStmt.get(normalizedName);
      }

      return upsertInMemoryKey(normalizedName, trimmedValue);
    });
    return result;
  } catch (error) {
    if (handleDatabaseFailure(error)) {
      return upsertInMemoryKey(normalizedName, trimmedValue);
    }
    throw error;
  }
}

export async function deleteApiKey(name) {
  if (!name) {
    throw new Error("API key name is required for deletion");
  }

  const tablesReady = await ensureIntegrationTables();
  const normalizedName = name.trim().toLowerCase();

  if (!tablesReady) {
    return deleteInMemoryKey(normalizedName);
  }

  try {
    const result = await withClient((client) => {
      if (client.addAuthorizedSource) {
        return deleteInMemoryKey(normalizedName);
      }

      if (client.prepare) {
        const stmt = client.prepare(DELETE_API_KEY_SQL);
        const info = stmt.run(normalizedName);
        return info.changes > 0;
      }

      return deleteInMemoryKey(normalizedName);
    });
    return result;
  } catch (error) {
    if (handleDatabaseFailure(error)) {
      return deleteInMemoryKey(normalizedName);
    }
    throw error;
  }
}

export async function findApiKey(name) {
  if (!name) {
    return null;
  }

  const tablesReady = await ensureIntegrationTables();
  const normalizedName = name.trim().toLowerCase();
  if (!tablesReady) {
    return findInMemoryKey(normalizedName);
  }

  try {
    const result = await withClient((client) => {
      if (client.addAuthorizedSource) {
        return findInMemoryKey(normalizedName);
      }

      if (client.prepare) {
        const stmt = client.prepare(SELECT_API_KEY_SQL);
        return stmt.get(normalizedName);
      }

      return findInMemoryKey(normalizedName);
    });
    return result || null;
  } catch (error) {
    if (handleDatabaseFailure(error)) {
      return findInMemoryKey(normalizedName);
    }
    throw error;
  }
}
