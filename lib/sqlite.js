import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

let db;

function createDatabase() {
  if (db) {
    return db;
  }

  const dbPath = process.env.SQLITE_DB_PATH || "data/cyberstreams.db";

  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  return db;
}

export function getPool() {
  return createDatabase();
}

export async function withClient(callback) {
  const client = createDatabase();
  try {
    return await callback(client);
  } catch (error) {
    throw error;
  }
}

export async function closePool() {
  if (db) {
    db.close();
    db = null;
  }
}
