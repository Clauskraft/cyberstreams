import logger from "./logger.js";

function baseUrl() {
  return (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(
    /\/$/,
    ""
  );
}

async function request(path, { method = "POST", body } = {}) {
  const url = `${baseUrl()}${path}`;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ollama ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export default function createOllamaAdmin() {
  async function isReachable() {
    try {
      await listModels();
      return true;
    } catch (err) {
      return false;
    }
  }

  async function listModels() {
    const res = await request("/api/tags", { method: "GET" });
    // { models: [{ name, model, size, digest, modified_at } ...] }
    return Array.isArray(res?.models) ? res.models : [];
  }

  async function pullModel(name) {
    try {
      await request("/api/pull", { body: { name, stream: false } });
      return { name, ok: true };
    } catch (err) {
      logger.warn({ err: String(err), name }, "ollama pull failed");
      return { name, ok: false, error: String(err) };
    }
  }

  async function ensureModelsInstalled(models) {
    const installed = await listModels();
    const installedSet = new Set(installed.map((m) => m.name || m.model));
    const results = [];
    for (const m of models) {
      if (installedSet.has(m)) {
        results.push({ name: m, ok: true, skipped: true });
        continue;
      }
      results.push(await pullModel(m));
    }
    return results;
  }

  return { isReachable, listModels, pullModel, ensureModelsInstalled };
}
