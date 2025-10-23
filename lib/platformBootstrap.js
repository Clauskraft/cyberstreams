import logger from "./logger.js";
import createOllamaAdmin from "./ollamaAdmin.js";

export default function createPlatformBootstrap() {
  const DEFAULTS = {
    keywords: [
      "ransomware",
      "data breach",
      "phishing",
      "zero-day",
      "CVE-2024",
      "APT",
      "DDoS",
      "supply chain",
    ],
    sources: [
      { name: "CFCS", domain: "cfcs.dk", url: "https://www.cfcs.dk/" },
      {
        name: "ENISA",
        domain: "enisa.europa.eu",
        url: "https://www.enisa.europa.eu/",
      },
      {
        name: "CISA KEV",
        domain: "cisa.gov",
        url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
      },
      {
        name: "CERT-EU",
        domain: "cert.europa.eu",
        url: "https://cert.europa.eu/",
      },
    ],
    ollamaModels: [
      // Primary curated set for OSINT and threat intelligence
      "dolphin-llama3:8b", // Uncensored model, perfect for OSINT analysis
      "llama3.1:8b", // General purpose, good for analysis
      "llama3.1:latest", // Latest version, often less censored
      "nomic-embed-text", // Embedding model for semantic search
    ],
  };

  async function standardizeEnv(env = process.env) {
    const applied = {};
    function setDefault(key, value) {
      if (!env[key]) {
        env[key] = value;
        applied[key] = value;
      }
    }

    setDefault("NODE_ENV", "development");
    setDefault("PORT", "3001");
    setDefault("LOG_LEVEL", "info");
    setDefault("AUTO_START_INTEL_SCRAPER", "true");
    setDefault("AUTO_SEED_SOURCES", "true");
    setDefault("OLLAMA_BASE_URL", "http://localhost:11434");
    setDefault("OLLAMA_CHAT_MODEL", "dolphin-llama3:8b");
    setDefault("OLLAMA_EMBED_MODEL", "nomic-embed-text");

    return applied;
  }

  async function ensureOllamaModels({ allowPull = true } = {}) {
    const admin = createOllamaAdmin();
    const reachable = await admin.isReachable();
    if (!reachable) {
      logger.warn(
        "Ollama not reachable at OLLAMA_BASE_URL; skipping model setup"
      );
      return { reachable: false, results: [] };
    }
    const models = DEFAULTS.ollamaModels;
    const results = allowPull ? await admin.ensureModelsInstalled(models) : [];
    return { reachable: true, results };
  }

  function initialKeywords() {
    return [...DEFAULTS.keywords];
  }

  function initialSources() {
    return [...DEFAULTS.sources];
  }

  return {
    standardizeEnv,
    ensureOllamaModels,
    initialKeywords,
    initialSources,
    DEFAULTS,
  };
}
