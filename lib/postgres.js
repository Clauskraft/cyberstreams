import dotenv from "dotenv";
import database from "./database-fallback.js";

dotenv.config();

let db;

function createPool() {
  if (db) {
    return db;
  }

  // Use fallback database for Windows compatibility
  console.log("Using fallback JSON database for Windows compatibility");
  db = database;

  return db;
}

export function getPool() {
  return createPool();
}

export async function withClient(callback) {
  const client = createPool();
  try {
    return await callback(client);
  } catch (error) {
    throw error;
  }
}

export async function closePool() {
  if (db && db.close) {
    db.close();
    db = null;
  }
}
