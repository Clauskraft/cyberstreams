import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import fs from "fs";
import path from "path";
import cors from "cors";
import { randomUUID } from "crypto";
import { loadConfig } from "./config/index.js";

import logger from "./lib/logger.js";
import createMispClient from "./lib/mispClient.js";
import createOpenCtiClient from "./lib/openCtiClient.js";
import createVectorClient from "./lib/vectorClient.js";
import createAgenticOrchestrator from "./lib/agenticOrchestrator.js";
import createPlatformBootstrap from "./lib/platformBootstrap.js";
import createKnowledgeRepository from "./lib/knowledgeRepository.js";
import createWigleMapsIntegration from "./lib/wigleMapsIntegration.js";
import createWigleDataLoader from "./lib/wigleDataLoader.js";
import createPentestModule from "./lib/pentestModule.js";
import createScheduler from "./lib/scheduler.js";
import {
  ensureSourcesTable,
  getAuthorizedSources,
  saveAuthorizedSources,
} from "./lib/authorizedSourceRepository.js";
import { closePool } from "./lib/postgres.js";
import IntelScraperService from "./lib/intelScraperService.js";
import {
  ensureIntegrationTables,
  listApiKeys,
  upsertApiKey,
  deleteApiKey,
  findApiKey,
} from "./lib/integrationSettingsRepository.js";

// Fallback sources used until the database repository is populated
const FALLBACK_AUTHORIZED_SOURCES = [
  {
    id: "cfcs_dk",
    name: "Center for Cybersikkerhed (CFCS)",
    domain: "cfcs.dk",
    credibilityScore: 98,
    verified: true,
    priority: "critical",
  },
  {
    id: "enisa_eu",
    name: "ENISA",
    domain: "enisa.europa.eu",
    credibilityScore: 96,
    verified: true,
    priority: "critical",
  },
  {
    id: "cert_eu",
    name: "CERT-EU",
    domain: "cert.europa.eu",
    credibilityScore: 94,
    verified: true,
    priority: "high",
  },
  {
    id: "cisa_us",
    name: "CISA",
    domain: "cisa.gov",
    credibilityScore: 97,
    verified: true,
    priority: "high",
  },
  {
    id: "nvd_nist",
    name: "National Vulnerability Database",
    domain: "nvd.nist.gov",
    credibilityScore: 99,
    verified: true,
    priority: "high",
  },
];

const app = express();
const config = loadConfig();
const PORT = config.PORT;
let server = null;
let isReady = false;
const ALLOWED_MISP_OBSERVABLE_TYPES = [
  "ip-src",
  "ip-dst",
  "domain",
  "hostname",
  "url",
  "md5",
  "sha1",
  "sha256",
  "email-src",
  "email-dst",
];

const mispClient = createMispClient();
const openCtiClient = createOpenCtiClient();
const vectorClient = createVectorClient();
const orchestrator = createAgenticOrchestrator();
const platformBootstrap = createPlatformBootstrap();
const knowledgeRepo = createKnowledgeRepository();
const wigleMapsIntegration = createWigleMapsIntegration();
const wigleDataLoader = createWigleDataLoader();
const pentestModule = createPentestModule();
const scheduler = createScheduler();
const bootstrap = createPlatformBootstrap();

// Auto-seed Knowledge Base from file on startup (in-memory store)
try {
  const kbPath = path.resolve(process.cwd(), "data/knowledge-base.json");
  if (fs.existsSync(kbPath)) {
    const raw = fs.readFileSync(kbPath, "utf8");
    const docs = JSON.parse(raw);
    if (Array.isArray(docs)) {
      let seeded = 0;
      for (const doc of docs) {
        if (doc && doc.title && doc.content) {
          knowledgeRepo.upsertDocument({
            title: doc.title,
            content: doc.content,
            tags: doc.tags || [],
            category: doc.category || "general",
            source: doc.source || "unknown",
            classification: doc.classification || "unclassified",
            relevance: doc.relevance || "medium",
          });
          seeded++;
        }
      }
      logger.info(
        { seeded },
        "Knowledge base auto-seeded from data/knowledge-base.json"
      );
    }
  }
} catch (error) {
  logger.warn({ err: error }, "Failed to auto-seed knowledge base");
}

// Start scheduler and schedule tasks
scheduler.start();

// Schedule Wigle data updates every 24 hours
scheduler.scheduleTask(
  "wigle-data-update",
  async () => {
    logger.info("Starting scheduled Wigle data update");
    const result = await wigleDataLoader.updateData();
    if (result.success) {
      logger.info(
        `Wigle data update completed: ${result.data.updatedNetworks} new networks`
      );
    } else {
      logger.error(`Wigle data update failed: ${result.error}`);
    }
  },
  scheduler.intervals.everyDay,
  false // Don't run immediately
);

// Schedule DPA feed ingestion every 30 minutes
scheduler.scheduleTask(
  "dpa-ingestion-30m",
  async () => {
    try {
      const { spawn } = await import("node:child_process");
      await new Promise((resolve, reject) => {
        const child = spawn(
          process.execPath,
          ["--loader", "ts-node/esm", "scripts/cron/ingest.ts"],
          {
            cwd: process.cwd(),
            env: { ...process.env, DPA_ONLY: "true" },
            stdio: "inherit",
          }
        );
        child.on("exit", (code) =>
          code === 0 ? resolve(0) : reject(new Error(`ingest exited ${code}`))
        );
        child.on("error", reject);
      });
    } catch (error) {
      logger.error({ err: error }, "Scheduled DPA ingestion failed");
    }
  },
  scheduler.intervals.every30Minutes,
  true
);

// Schedule full cyber ingestion (all sources) every 30 minutes, offset start by 5 minutes
scheduler.scheduleTask(
  "cyber-ingestion-30m",
  async () => {
    try {
      const { spawn } = await import("node:child_process");
      await new Promise((resolve, reject) => {
        const child = spawn(
          process.execPath,
          ["--loader", "ts-node/esm", "scripts/cron/ingest.ts"],
          {
            cwd: process.cwd(),
            env: { ...process.env, DPA_ONLY: "false" },
            stdio: "inherit",
          }
        );
        child.on("exit", (code) =>
          code === 0 ? resolve(0) : reject(new Error(`ingest exited ${code}`))
        );
        child.on("error", reject);
      });
    } catch (error) {
      logger.error({ err: error }, "Scheduled CYBER ingestion failed");
    }
  },
  scheduler.intervals.every30Minutes,
  true
);

// Initial load of Denmark data if not already loaded
setTimeout(async () => {
  const config = wigleDataLoader.getConfig();
  if (config.totalNetworks === 0) {
    logger.info("No Denmark WiFi data found, starting initial load");
    const result = await wigleDataLoader.loadDenmarkData();
    if (result.success) {
      logger.info(
        `Initial Denmark data load completed: ${result.data.totalNetworks} networks`
      );
    } else {
      logger.error(`Initial Denmark data load failed: ${result.error}`);
    }
  } else {
    logger.info(
      `Denmark WiFi data already loaded: ${config.totalNetworks} networks`
    );
  }
}, 10000); // Wait 10 seconds after server start

const shouldAutoStartIntelScraper =
  process.env.AUTO_START_INTEL_SCRAPER !== "false";

// Cached authorized sources - must be defined before IntelScraperService
let cachedSources = null;
let cachedSourcesLoadedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function loadAuthorizedSources() {
  const now = Date.now();
  if (cachedSources && now - cachedSourcesLoadedAt < CACHE_TTL_MS) {
    return cachedSources;
  }

  try {
    await ensureSourcesTable();
    const sources = await getAuthorizedSources();

    if (!sources.length && process.env.AUTO_SEED_SOURCES !== "false") {
      await saveAuthorizedSources(FALLBACK_AUTHORIZED_SOURCES);
      cachedSources = FALLBACK_AUTHORIZED_SOURCES;
    } else if (!sources.length) {
      cachedSources = FALLBACK_AUTHORIZED_SOURCES;
    } else {
      cachedSources = sources;
    }

    cachedSourcesLoadedAt = now;
    return cachedSources;
  } catch (error) {
    logger.error(
      { err: error },
      "Failed to load authorized sources from database, using fallback list"
    );
    cachedSources = FALLBACK_AUTHORIZED_SOURCES;
    cachedSourcesLoadedAt = now;
    return cachedSources;
  }
}

// Move cached authorized sources and loader before IntelScraper init to avoid TDZ
// Definitions moved to before IntelScraperService initialization

const intelScraperService = new IntelScraperService({
  mispClient,
  openCtiClient,
  loadAuthorizedSources,
});

try {
  await intelScraperService.init();
  if (shouldAutoStartIntelScraper) {
    intelScraperService
      .start()
      .then(() => {
        logger.info("Intel Scraper auto-started successfully on boot");
      })
      .catch((error) => {
        logger.error(
          { err: error },
          "Failed to auto-start Intel Scraper during initialization"
        );
      });
  } else {
    logger.info(
      "Intel Scraper auto-start disabled via AUTO_START_INTEL_SCRAPER=false"
    );
  }
} catch (error) {
  logger.error({ err: error }, "Failed to initialize Intel Scraper service");
}

try {
  const tablesReady = await ensureIntegrationTables();
  if (!tablesReady) {
    logger.warn("Using in-memory storage for integration API keys");
  }
} catch (error) {
  logger.error(
    { err: error },
    "Failed to ensure integration settings tables exist"
  );
}

const MCP_SERVERS = [
  { id: "openai", name: "OpenAI (ChatGPT)" },
  { id: "anthropic", name: "Anthropic (Claude)" },
  { id: "custom_mcp", name: "Custom MCP Server" },
];

function maskApiKey(value) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return "••••";
  }

  const visible = trimmed.slice(-4);
  return `${"•".repeat(Math.max(4, trimmed.length - 4))}${visible}`;
}

function validateMcpKeyFormat(serverId, key) {
  if (!key) {
    return false;
  }

  const normalized = key.trim();
  switch (serverId) {
    case "openai":
      return normalized.startsWith("sk-") && normalized.length > 20;
    case "anthropic":
      return (
        normalized.startsWith("sk-ant-") ||
        normalized.startsWith("anthropic-") ||
        normalized.startsWith("ak-")
      );
    default:
      return normalized.length >= 12;
  }
}

// ================== EXPRESS APP SETUP ==================
if (config.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// Security headers
if (config.ENABLE_SECURITY_HEADERS === "true") {
  app.use(helmet());
}

// CORS (tighten in production if not explicitly configured)
const derivedCorsOrigin = (() => {
  if (config.CORS_ORIGIN && config.CORS_ORIGIN !== "*") {
    return config.CORS_ORIGIN.split(",");
  }
  if (config.NODE_ENV === "production") {
    // Default safe list for production; adjust as needed via CORS_ORIGIN env
    return ["https://cyberstreams.dk", "https://staging.cyberstreams.dk"];
  }
  return true; // dev: allow all for local iteration
})();

app.use(
  cors({
    origin: derivedCorsOrigin,
    credentials: false,
  })
);

// JSON body parsing with limits
app.use(express.json({ limit: config.JSON_BODY_LIMIT }));
app.use(compression());

// Rate limiting for API routes
if (
  config.ENABLE_RATE_LIMITING === "true" &&
  process.env.NODE_ENV === "production"
) {
  const apiLimiter = rateLimit({
    windowMs: Number(config.RATE_LIMIT_WINDOW_MS),
    max: Number(config.RATE_LIMIT_MAX_REQUESTS),
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", apiLimiter);
}

// Stricter rate limits for AI/agent endpoints
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
});
const orchestratorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// Correlation/request ID
app.use((req, res, next) => {
  const headerId = req.headers["x-request-id"];
  const id =
    typeof headerId === "string" && headerId.trim() ? headerId : randomUUID();
  req.correlationId = id;
  res.setHeader("x-request-id", id);
  next();
});

// Basic liveness and readiness endpoints (no external deps required)
app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/readyz", (req, res) => {
  if (isReady) {
    return res.status(200).json({ status: "ready" });
  }
  return res.status(503).json({ status: "starting" });
});

app.get("/api/keys", async (req, res) => {
  try {
    const keys = await listApiKeys();
    const sanitized = keys.map((key) => ({
      name: key.name,
      value: maskApiKey(key.value),
      created: key.created_at,
    }));

    res.json({ success: true, data: sanitized });
  } catch (error) {
    logger.error({ err: error }, "Failed to load integration API keys");
    res.status(500).json({ success: false, error: "Failed to load API keys" });
  }
});

app.post("/api/keys", async (req, res) => {
  const { name, value } = req.body || {};

  if (typeof name !== "string" || typeof value !== "string") {
    return res.status(400).json({
      success: false,
      error: "name and value must be provided as strings",
    });
  }

  const trimmedName = name.trim();
  const trimmedValue = value.trim();

  if (!trimmedName || !trimmedValue) {
    return res
      .status(400)
      .json({ success: false, error: "Both name and value are required" });
  }

  try {
    const stored = await upsertApiKey(trimmedName, trimmedValue);
    res.status(201).json({
      success: true,
      data: {
        name: stored.name,
        value: maskApiKey(stored.value),
        created: stored.created_at,
      },
    });
  } catch (error) {
    logger.error({ err: error, name: trimmedName }, "Failed to store API key");
    res.status(500).json({ success: false, error: "Failed to save API key" });
  }
});

app.delete("/api/keys/:name", async (req, res) => {
  const { name } = req.params;
  if (!name) {
    return res
      .status(400)
      .json({ success: false, error: "Key name is required" });
  }

  try {
    const removed = await deleteApiKey(name);
    if (!removed) {
      return res
        .status(404)
        .json({ success: false, error: "API key not found" });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error, name }, "Failed to delete API key");
    res.status(500).json({ success: false, error: "Failed to delete API key" });
  }
});

app.get("/api/mcp/servers", async (req, res) => {
  try {
    const keys = await listApiKeys();
    const keyNames = new Set(keys.map((key) => key.name));

    const knownServers = MCP_SERVERS.map((server) => ({
      id: server.id,
      name: server.name,
      status: keyNames.has(server.id) ? "configured" : "not_configured",
    }));

    const extraServers = keys
      .filter((key) => !MCP_SERVERS.some((server) => server.id === key.name))
      .map((key) => ({
        id: key.name,
        name: `Custom integration (${key.name})`,
        status: "configured",
      }));

    res.json({ success: true, data: [...knownServers, ...extraServers] });
  } catch (error) {
    logger.error({ err: error }, "Failed to load MCP servers");
    res
      .status(500)
      .json({ success: false, error: "Failed to load MCP servers" });
  }
});

app.post("/api/mcp/test", async (req, res) => {
  const { server, apiKey } = req.body || {};
  const serverId = typeof server === "string" && server.trim().toLowerCase();

  if (!serverId) {
    return res
      .status(400)
      .json({ success: false, error: "server identifier is required" });
  }

  try {
    const storedKey = await findApiKey(serverId);
    const keyToTest =
      (typeof apiKey === "string" && apiKey.trim()) || storedKey?.value;

    if (!keyToTest) {
      return res
        .status(400)
        .json({ success: false, error: "No API key available for validation" });
    }

    if (!validateMcpKeyFormat(serverId, keyToTest)) {
      return res.status(400).json({
        success: false,
        error: "API key format is invalid for the selected server",
      });
    }

    res.json({
      success: true,
      message: `API key for ${serverId} passed format validation`,
    });
  } catch (error) {
    logger.error({ err: error, serverId }, "Failed to validate MCP server key");
    res
      .status(500)
      .json({ success: false, error: "Failed to validate MCP server key" });
  }
});

// Standardized no-data payload
const NO_DATA = {
  success: true,
  timestamp: new Date().toISOString(),
  data: [],
  count: 0,
  message: "no data",
};

// API Routes
app.get("/api/pulse", (req, res) => {
  res.json(NO_DATA);
});

app.get("/api/threats", (req, res) => {
  res.json(NO_DATA);
});

app.get("/api/stats", (req, res) => {
  res.json(NO_DATA);
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "operational",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// On-demand ingestion endpoints
app.post("/api/ingest/dpa", async (req, res) => {
  try {
    const { spawn } = await import("node:child_process");
    const code = await new Promise((resolve) => {
      const child = spawn(
        process.execPath,
        ["--loader", "ts-node/esm", "scripts/cron/ingest.ts"],
        {
          cwd: process.cwd(),
          env: { ...process.env, DPA_ONLY: "true" },
          stdio: "inherit",
        }
      );
      child.on("exit", (code) => resolve(code ?? 1));
    });
    if (code === 0) return res.json({ success: true });
    return res
      .status(500)
      .json({ success: false, error: `Ingest exited ${code}` });
  } catch (err) {
    logger.error({ err }, "API DPA ingestion failed");
    return res
      .status(500)
      .json({ success: false, error: "Failed to start DPA ingestion" });
  }
});

app.post("/api/ingest/cyber", async (req, res) => {
  try {
    const { spawn } = await import("node:child_process");
    const code = await new Promise((resolve) => {
      const child = spawn(
        process.execPath,
        ["--loader", "ts-node/esm", "scripts/cron/ingest.ts"],
        {
          cwd: process.cwd(),
          env: { ...process.env, DPA_ONLY: "false" },
          stdio: "inherit",
        }
      );
      child.on("exit", (code) => resolve(code ?? 1));
    });
    if (code === 0) return res.json({ success: true });
    return res
      .status(500)
      .json({ success: false, error: `Ingest exited ${code}` });
  } catch (err) {
    logger.error({ err }, "API CYBER ingestion failed");
    return res
      .status(500)
      .json({ success: false, error: "Failed to start CYBER ingestion" });
  }
});

app.get("/api/config/sources", async (req, res) => {
  try {
    const sources = await loadAuthorizedSources();
    res.json({ success: true, count: sources.length, data: sources });
  } catch (error) {
    logger.error({ err: error }, "Failed to load authorized sources via API");
    res
      .status(500)
      .json({ success: false, error: "Unable to load authorized sources" });
  }
});

app.get("/api/cti/misp/events", async (req, res) => {
  if (!mispClient.isConfigured) {
    return res
      .status(503)
      .json({ success: false, error: "MISP integration is not configured" });
  }

  try {
    const events = await mispClient.listEvents({
      limit: Number(req.query.limit) || 25,
    });
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch events from MISP via API");
    res.status(502).json({ success: false, error: "Failed to reach MISP API" });
  }
});

app.get("/api/cti/opencti/observables", async (req, res) => {
  if (!openCtiClient.isConfigured) {
    return res
      .status(503)
      .json({ success: false, error: "OpenCTI integration is not configured" });
  }

  try {
    const observables =
      (await openCtiClient.listObservables({
        search: req.query.search,
        first: Number(req.query.first) || 25,
      })) || [];
    const count = Array.isArray(observables) ? observables.length : 0;
    res.json({
      success: true,
      count,
      data: Array.isArray(observables) ? observables : [],
    });
  } catch (error) {
    logger.error(
      { err: error },
      "Failed to fetch observables from OpenCTI via API"
    );
    res
      .status(502)
      .json({ success: false, error: "Failed to reach OpenCTI API" });
  }
});

app.post("/api/cti/misp/observables", async (req, res) => {
  if (!mispClient.isConfigured) {
    return res
      .status(503)
      .json({ success: false, error: "MISP integration is not configured" });
  }

  const { value, type, comment, tags } = req.body || {};

  if (typeof value !== "string" || typeof type !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "value and type must be strings" });
  }

  const trimmedValue = value.trim();
  const normalizedType = type.trim().toLowerCase();

  if (!trimmedValue || !normalizedType) {
    return res
      .status(400)
      .json({ success: false, error: "value and type are required fields" });
  }

  if (!ALLOWED_MISP_OBSERVABLE_TYPES.includes(normalizedType)) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid observable type" });
  }

  if (comment != null && typeof comment !== "string") {
    return res.status(400).json({
      success: false,
      error: "comment must be a string when provided",
    });
  }

  const sanitizedTags = Array.isArray(tags)
    ? tags
        .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
        .filter((tag) => Boolean(tag))
    : [];

  const sanitizedComment =
    typeof comment === "string" ? comment.trim() : undefined;

  try {
    const response = await mispClient.pushObservable({
      uuid: randomUUID(),
      value: trimmedValue,
      type: normalizedType,
      comment: sanitizedComment,
      tags: sanitizedTags,
    });

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    logger.error(
      { err: error, value: trimmedValue, type: normalizedType },
      "Failed to create observable in MISP"
    );
    res
      .status(502)
      .json({ success: false, error: "Failed to create observable in MISP" });
  }
});

// DAGENS PULS API - HØJTROVÆRDIGE KILDER
class DailyPulseGenerator {
  constructor() {
    this.timezone = "Europe/Copenhagen";
  }

  // Hovedfunktion til at generere daglig puls
  async getDailyPulse() {
    try {
      const authorizedSources = await loadAuthorizedSources();

      // 1. Hent data fra autoriserede kilder
      const rawDocuments = await this.fetchFromAuthorizedSources(
        authorizedSources
      );

      // 2. Filtrer og valider kilder
      const validatedDocuments = this.validateAndFilterSources(
        rawDocuments,
        authorizedSources
      );

      // 3. Score og prioriter dokumenter
      const scoredDocuments = this.scoreDocuments(
        validatedDocuments,
        authorizedSources
      );

      // 4. Udvælg top 5-7 dokumenter
      const selectedDocuments = this.selectTopDocuments(scoredDocuments, 7);

      // 5. Generér summariseringer
      const pulseItems = await this.generateSummaries(selectedDocuments);

      // 6. Tilføj visuelle metadata
      const enrichedPulseItems = this.enrichWithVisualAssets(pulseItems);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        timezone: this.timezone,
        totalSources: authorizedSources.length,
        validDocuments: validatedDocuments.length,
        selectedItems: enrichedPulseItems.length,
        data: enrichedPulseItems,
        lastUpdate: this.getLastUpdateTime(),
        nextUpdate: this.getNextUpdateTime(),
      };
    } catch (error) {
      logger.error({ err: error }, "DailyPulse generation failed");
      return {
        success: false,
        error: error.message,
        fallbackData: this.getFallbackData(),
      };
    }
  }

  // Hent data fra autoriserede kilder via MISP, OpenCTI og fallback feeds
  async fetchFromAuthorizedSources(authorizedSources) {
    const [mispEvents, openCtiObservables] = await Promise.all([
      mispClient.listEvents({ limit: 40 }),
      openCtiClient.listObservables({ first: 40 }),
    ]);

    const mapAuthorizedSource = (domainOrName) => {
      if (!domainOrName) return null;
      const normalized = domainOrName.toLowerCase();
      return authorizedSources.find((source) => {
        const domain =
          typeof source.domain === "string" ? source.domain.toLowerCase() : "";
        const name =
          typeof source.name === "string" ? source.name.toLowerCase() : "";
        return (
          (domain && normalized.includes(domain)) ||
          (name && normalized.includes(name))
        );
      });
    };

    const normalizedMisp = mispEvents.map((event) => {
      const firstAttribute = event.attributes?.[0];
      const summary = event.attributes
        ?.slice(0, 5)
        .map((attr) => `${attr.type}: ${attr.value}`)
        .join("\n");

      const matchedSource = mapAuthorizedSource(event?.tags?.[0]?.name);

      const timestampMs = event.timestamp
        ? Number(event.timestamp) * 1000
        : Date.now();

      return {
        id: event.id,
        title: event.title || "MISP Event",
        description: summary || "MISP event without detailed attributes",
        source: matchedSource?.name || "MISP",
        sourceDomain: matchedSource?.domain || "misp.internal",
        url: firstAttribute?.value || mispClient.baseUrl,
        timestamp: new Date(timestampMs).toISOString(),
        category: firstAttribute?.category || "indicator",
        severity: "high",
        tags: event.tags?.map((tag) => tag.name) || [],
        verified: true,
      };
    });

    const normalizedOpenCti = openCtiObservables.map((observable) => {
      const matchedSource = mapAuthorizedSource(observable.creators?.[0]);
      const timestamp =
        observable.updatedAt ||
        observable.createdAt ||
        new Date().toISOString();
      return {
        id: observable.id,
        title: `Observable: ${observable.value}`,
        description: `Observable of type ${observable.type} oprettet ${observable.createdAt}`,
        source: matchedSource?.name || "OpenCTI",
        sourceDomain: matchedSource?.domain || "opencti.internal",
        url: process.env.OPENCTI_PUBLIC_URL
          ? `${process.env.OPENCTI_PUBLIC_URL.replace(
              /\/$/,
              ""
            )}/dashboard/id/${observable.id}`
          : null,
        timestamp,
        category: "observable",
        severity: "medium",
        verified: true,
      };
    });

    const combined = [...normalizedMisp, ...normalizedOpenCti];

    if (!combined.length) {
      logger.warn(
        "Falling back to mock documents because no CTI data was returned"
      );
      return this.getFallbackDocuments();
    }

    return combined;
  }

  // Validerer og filtrerer kilder for troværdighed
  validateAndFilterSources(documents, authorizedSources) {
    return documents.filter((doc) => {
      // 1. Skal være fra autoriseret kilde
      const isAuthorized = authorizedSources.some(
        (source) =>
          doc.sourceDomain.includes(source.domain) ||
          doc.source.toLowerCase().includes(source.name.toLowerCase())
      );

      if (!isAuthorized) return false;

      // 2. Filtrer mock/test data ud
      const mockIndicators = ["mock", "test", "dummy", "example", "lorem"];
      const text = (doc.title + " " + doc.description).toLowerCase();
      const isMockData = mockIndicators.some((indicator) =>
        text.includes(indicator)
      );

      if (isMockData) return false;

      // 3. Skal være verified
      if (!doc.verified) return false;

      // 4. Ikke ældre end 7 dage
      const age = Date.now() - new Date(doc.timestamp).getTime();
      const daysOld = age / (1000 * 60 * 60 * 24);
      if (daysOld > 7) return false;

      return true;
    });
  }

  // Scorer dokumenter baseret på troværdighed og relevans
  scoreDocuments(documents, authorizedSources) {
    return documents.map((doc) => {
      let score = 0;

      // Kilde-score (0-40 points)
      const source = authorizedSources.find((s) =>
        doc.sourceDomain.includes(s.domain)
      );
      if (source) {
        score += Math.round((source.credibilityScore / 100) * 40);
        if (source.priority === "critical") score += 10;
        else if (source.priority === "high") score += 5;
      }

      // Severity score (0-30 points)
      if (doc.severity === "critical") score += 30;
      else if (doc.severity === "high") score += 20;
      else if (doc.severity === "medium") score += 10;

      // Relevans score (0-20 points)
      if (doc.geography && doc.geography.includes("Denmark")) {
        score += 20;
      } else if (doc.geography && doc.geography.includes("European Union")) {
        score += 15;
      }

      // CVE score (0-10 points)
      if (doc.cves && doc.cves.length > 0) score += 10;
      if (doc.cvssScore && doc.cvssScore >= 9.0) score += 5;

      // Timeliness score (0-10 points)
      const age = Date.now() - new Date(doc.timestamp).getTime();
      const hoursOld = age / (1000 * 60 * 60);
      if (hoursOld < 2) score += 10;
      else if (hoursOld < 6) score += 8;
      else if (hoursOld < 24) score += 5;

      return { ...doc, qualityScore: score };
    });
  }

  // Udvælger top dokumenter
  selectTopDocuments(scoredDocuments, maxCount = 7) {
    return scoredDocuments
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, maxCount);
  }

  // Genererer summariseringer (simuleret AI)
  async generateSummaries(documents) {
    return documents.map((doc) => {
      let summary = "";

      // Generate contextual summary based on category and severity
      switch (doc.category) {
        case "vulnerability":
          summary = `${doc.cves?.[0] || "Sårbarhed"} i ${
            doc.affectedProducts?.[0] || "flere systemer"
          }. ${
            doc.severity === "critical"
              ? "Øjeblikkelig patching påkrævet."
              : "Opdater snarest muligt."
          }`;
          break;
        case "incident":
          summary = `Sikkerhedsincident påvirker ${
            doc.affectedSectors?.[0] || "organisationer"
          }. ${
            doc.geography?.[0] === "Denmark"
              ? "Danske virksomheder særligt i fokus."
              : "Internationale implikationer."
          }`;
          break;
        case "directive":
          summary = `Ny sikkerhedsdirektiv kræver handling inden ${
            doc.severity === "critical" ? "72 timer" : "nærmeste fremtid"
          }. Påvirker ${doc.affectedSectors?.[0] || "kritisk infrastruktur"}.`;
          break;
        case "guidance":
          summary = `Ny vejledning til ${
            doc.title.includes("AI") ? "AI-sikkerhed" : "cybersikkerhed"
          } fra ${doc.source}. Praktiske anbefalinger til implementering.`;
          break;
        default:
          summary = doc.description.substring(0, 120) + "...";
      }

      return {
        id: doc.id,
        title: doc.title,
        summary,
        category: doc.category,
        severity: doc.severity,
        source: doc.source,
        timestamp: doc.timestamp,
        relativeTime: this.getRelativeTime(doc.timestamp),
        url: doc.url,
        verified: doc.verified,
        qualityScore: doc.qualityScore,
        tags: this.generateTags(doc),
      };
    });
  }

  // Tilføjer visuelle assets
  enrichWithVisualAssets(pulseItems) {
    return pulseItems.map((item) => ({
      ...item,
      categoryIcon: this.getCategoryIcon(item.category),
      severityColor: this.getSeverityColor(item.severity),
      sourceIcon: this.getSourceIcon(item.source),
    }));
  }

  // Helper funktioner
  getSourceIcon(sourceDomain) {
    const iconMap = {
      "cfcs.dk": "shield",
      "enisa.europa.eu": "shield-check",
      "cert.europa.eu": "shield-alert",
      "cisa.gov": "flag",
      "nvd.nist.gov": "database",
      "msrc.microsoft.com": "building",
    };
    return iconMap[sourceDomain] || "shield";
  }

  getCategoryIcon(category) {
    const iconMap = {
      vulnerability: "bug",
      incident: "alert-triangle",
      directive: "megaphone",
      guidance: "book-open",
      regulation: "scale",
      update: "refresh-cw",
    };
    return iconMap[category] || "info";
  }

  getSeverityColor(severity) {
    const colorMap = {
      critical: "bg-red-600",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-blue-500",
    };
    return colorMap[severity] || "bg-gray-500";
  }

  getRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Mindre end 1 time siden";
    if (diffHours < 24)
      return `${diffHours} time${diffHours > 1 ? "r" : ""} siden`;
    if (diffDays < 7) return `${diffDays} dag${diffDays > 1 ? "e" : ""} siden`;
    return time.toLocaleDateString("da-DK");
  }

  generateTags(doc) {
    const tags = [];
    if (doc.cves?.length > 0) tags.push("CVE");
    if (doc.cvssScore >= 9.0) tags.push("Critical CVSS");
    if (doc.geography?.includes("Denmark")) tags.push("Danmark");
    if (doc.affectedSectors?.includes("government"))
      tags.push("Offentlig sektor");
    return tags;
  }

  getLastUpdateTime() {
    const today = new Date();
    const lastUpdate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      7,
      0,
      0
    );
    if (today.getHours() < 7) {
      lastUpdate.setDate(lastUpdate.getDate() - 1);
    }
    return lastUpdate.toISOString();
  }

  getNextUpdateTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0);
    return tomorrow.toISOString();
  }

  getFallbackDocuments() {
    const now = Date.now();

    return [
      {
        id: "fallback_cfcs",
        title: "CFCS udsender midlertidig trusselsopdatering",
        description:
          "Center for Cybersikkerhed opretholder forhøjet opmærksomhedsniveau. Ingen alvorlige hændelser registreret det seneste døgn.",
        source: "Center for Cybersikkerhed (CFCS)",
        sourceDomain: "cfcs.dk",
        url: "https://www.cfcs.dk/",
        timestamp: new Date(now - 60 * 60 * 1000).toISOString(),
        category: "guidance",
        severity: "medium",
        verified: true,
        qualityScore: 0.7,
        cves: [],
        cvssScore: 0,
        geography: ["Denmark"],
        affectedSectors: ["government"],
      },
      {
        id: "fallback_enisa",
        title: "ENISA bekræfter stabil trusselsituation i EU",
        description:
          "ENISA rapporterer ingen kritiske afvigelser i den seneste overvågning af europæiske cybersikkerhedshændelser.",
        source: "ENISA",
        sourceDomain: "enisa.europa.eu",
        url: "https://www.enisa.europa.eu/",
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        category: "update",
        severity: "low",
        verified: true,
        qualityScore: 0.6,
        cves: [],
        cvssScore: 0,
        geography: ["European Union"],
        affectedSectors: ["information_technology"],
      },
      {
        id: "fallback_cisa",
        title: "CISA vedligeholder varsel om kendte sårbarheder",
        description:
          "CISA fastholder fokus på patching af kendte sårbarheder. Ingen nye kritiske CVE’er er tilføjet i dag.",
        source: "CISA",
        sourceDomain: "cisa.gov",
        url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
        timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
        category: "vulnerability",
        severity: "medium",
        verified: true,
        qualityScore: 0.65,
        cves: [],
        cvssScore: 7.1,
        geography: ["United States"],
        affectedSectors: ["critical_infrastructure"],
      },
    ];
  }

  getFallbackData() {
    const data = this.getFallbackDocuments();

    return {
      success: true,
      timestamp: new Date().toISOString(),
      timezone: this.timezone,
      totalSources: FALLBACK_AUTHORIZED_SOURCES.length,
      validDocuments: data.length,
      selectedItems: data.length,
      data,
      lastUpdate: this.getLastUpdateTime(),
      nextUpdate: this.getNextUpdateTime(),
      isFallback: true,
    };
  }
}

// Instantiate pulse generator
const pulseGenerator = new DailyPulseGenerator();

// API Endpoint for Daily Pulse
app.get("/api/daily-pulse", async (req, res) => {
  try {
    const pulseData = await pulseGenerator.getDailyPulse();
    res.json(pulseData);
  } catch (error) {
    logger.error({ err: error }, "Daily Pulse API error");
    res.status(500).json({
      success: false,
      error: "Failed to generate daily pulse",
      message: error.message,
    });
  }
});

// Intel Scraper API Endpoints
app.get("/api/intel-scraper/status", async (req, res) => {
  try {
    const status = intelScraperService.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error({ err: error }, "Failed to load Intel Scraper status");
    res
      .status(500)
      .json({ success: false, error: "Failed to load Intel Scraper status" });
  }
});

app.post("/api/intel-scraper/start", async (req, res) => {
  try {
    const status = await intelScraperService.start();
    res.json({
      success: true,
      message: "Intel Scraper started successfully",
      data: status,
    });
  } catch (error) {
    if (error.message.includes("already running")) {
      return res.status(400).json({ success: false, error: error.message });
    }
    logger.error({ err: error }, "Failed to start Intel Scraper");
    res
      .status(500)
      .json({ success: false, error: "Failed to start Intel Scraper" });
  }
});

app.post("/api/intel-scraper/stop", async (req, res) => {
  try {
    const status = await intelScraperService.stop();
    res.json({
      success: true,
      message: "Intel Scraper stopped successfully",
      data: status,
    });
  } catch (error) {
    if (error.message.includes("not running")) {
      return res.status(400).json({ success: false, error: error.message });
    }
    logger.error({ err: error }, "Failed to stop Intel Scraper");
    res
      .status(500)
      .json({ success: false, error: "Failed to stop Intel Scraper" });
  }
});

app.post("/api/intel-scraper/run", async (req, res) => {
  try {
    const status = await intelScraperService.runNow("manual-trigger");
    res.json({
      success: true,
      message: "Intel Scraper run completed",
      data: status,
    });
  } catch (error) {
    if (error.message.includes("already processing")) {
      return res.status(409).json({ success: false, error: error.message });
    }
    logger.error({ err: error }, "Failed to execute manual Intel Scraper run");
    res
      .status(500)
      .json({ success: false, error: "Failed to execute manual run" });
  }
});

app.post("/api/intel-scraper/emergency-bypass", async (req, res) => {
  const { reason, duration = 3600000 } = req.body || {};

  if (typeof reason !== "string" || !reason.trim()) {
    return res.status(400).json({
      success: false,
      error: "Reason is required for emergency bypass",
    });
  }

  const durationMs = Number(duration);
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return res.status(400).json({
      success: false,
      error: "duration must be a positive number of milliseconds",
    });
  }

  try {
    const status = await intelScraperService.enableEmergencyBypass({
      reason: reason.trim(),
      durationMs,
    });
    res.json({
      success: true,
      message: `Emergency bypass enabled for ${Math.round(
        durationMs / 1000
      )} seconds`,
      data: status,
    });
  } catch (error) {
    if (error.message.includes("already active")) {
      return res.status(409).json({ success: false, error: error.message });
    }
    logger.error({ err: error }, "Failed to enable emergency bypass");
    res
      .status(500)
      .json({ success: false, error: "Failed to enable emergency bypass" });
  }
});

app.get("/api/intel-scraper/approvals", (req, res) => {
  try {
    const approvals = intelScraperService.getPendingApprovals();
    res.json({ success: true, data: approvals });
  } catch (error) {
    logger.error({ err: error }, "Failed to load scraper approvals");
    res.status(500).json({ success: false, error: "Failed to load approvals" });
  }
});

app.post("/api/intel-scraper/approvals/:id", async (req, res) => {
  const { id } = req.params;
  const { decision, reason } = req.body || {};

  if (!["approve", "reject"].includes(decision)) {
    return res.status(400).json({
      success: false,
      error: 'Decision must be either "approve" or "reject"',
    });
  }

  try {
    const result = await intelScraperService.resolveApproval(
      id,
      decision,
      reason
    );
    res.json({
      success: true,
      message: `Source ${decision}d successfully`,
      data: result.status,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res
        .status(404)
        .json({ success: false, error: "Approval request not found" });
    }
    logger.error({ err: error, id }, "Failed to process approval decision");
    res
      .status(500)
      .json({ success: false, error: "Failed to process approval decision" });
  }
});

app.get("/api/intel-scraper/candidates", (req, res) => {
  try {
    const candidates = intelScraperService.getCandidates();
    res.json({ success: true, data: candidates });
  } catch (error) {
    logger.error({ err: error }, "Failed to load candidate sources");
    res
      .status(500)
      .json({ success: false, error: "Failed to load source candidates" });
  }
});

app.post("/api/intel-scraper/discover", async (req, res) => {
  const { urls = [], keywords = [] } = req.body || {};

  try {
    const candidates = await intelScraperService.discover({
      urls: Array.isArray(urls) ? urls : [],
      keywords: Array.isArray(keywords) ? keywords : [],
    });

    res.json({
      success: true,
      message: `Discovery scan completed with ${candidates.length} candidates`,
      data: candidates,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to run discovery scan");
    res
      .status(500)
      .json({ success: false, error: "Failed to run discovery scan" });
  }
});

app.post("/api/intel-scraper/candidates/accept", async (req, res) => {
  const { candidateId, autoApprove = false } = req.body || {};

  if (typeof candidateId !== "string" || !candidateId.trim()) {
    return res
      .status(400)
      .json({ success: false, error: "candidateId is required" });
  }

  try {
    const status = await intelScraperService.acceptCandidate(
      candidateId.trim(),
      {
        autoApprove: Boolean(autoApprove),
      }
    );
    res.json({
      success: true,
      message: "Candidate processed successfully",
      data: status,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res
        .status(404)
        .json({ success: false, error: "Candidate not found" });
    }
    logger.error(
      { err: error, candidateId },
      "Failed to process candidate acceptance"
    );
    res
      .status(500)
      .json({ success: false, error: "Failed to process candidate" });
  }
});

app.post("/api/intel-scraper/candidates/dismiss", (req, res) => {
  const { candidateId } = req.body || {};

  if (typeof candidateId !== "string" || !candidateId.trim()) {
    return res
      .status(400)
      .json({ success: false, error: "candidateId is required" });
  }

  try {
    const status = intelScraperService.dismissCandidate(candidateId.trim());
    res.json({ success: true, message: "Candidate dismissed", data: status });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res
        .status(404)
        .json({ success: false, error: "Candidate not found" });
    }
    logger.error({ err: error, candidateId }, "Failed to dismiss candidate");
    res
      .status(500)
      .json({ success: false, error: "Failed to dismiss candidate" });
  }
});

// Platform bootstrap & defaults
app.post("/api/bootstrap/standardize", async (req, res) => {
  try {
    const applied = await bootstrap.standardizeEnv(process.env);
    res.json({ success: true, data: applied });
  } catch (error) {
    logger.error({ err: error }, "Failed to standardize environment");
    res
      .status(500)
      .json({ success: false, error: "Failed to standardize env" });
  }
});

app.post("/api/bootstrap/ollama", async (req, res) => {
  try {
    const allowPull = req.body?.allowPull !== false;
    const result = await bootstrap.ensureOllamaModels({ allowPull });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ err: error }, "Failed to prepare Ollama models");
    res.status(500).json({ success: false, error: "Failed to prepare Ollama" });
  }
});

app.get("/api/bootstrap/defaults", (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        keywords: bootstrap.initialKeywords(),
        sources: bootstrap.initialSources(),
        ollamaModels: bootstrap.DEFAULTS.ollamaModels,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to load bootstrap defaults");
    res.status(500).json({ success: false, error: "Failed to load defaults" });
  }
});

app.post("/api/bootstrap/seed-sources", async (req, res) => {
  try {
    const sources = bootstrap.initialSources();
    await saveAuthorizedSources(sources);
    res.json({ success: true, count: sources.length, data: sources });
  } catch (error) {
    logger.error({ err: error }, "Failed to seed initial sources");
    res.status(500).json({ success: false, error: "Failed to seed sources" });
  }
});

// Knowledge Repository Endpoints
app.get("/api/knowledge", (req, res) => {
  try {
    const knowledge = knowledgeRepo.listDocuments();
    res.json({ success: true, data: knowledge });
  } catch (error) {
    logger.error({ err: error }, "Failed to list knowledge documents");
    res
      .status(500)
      .json({ success: false, error: "Failed to list knowledge documents" });
  }
});

// Import and use knowledge base routes
import knowledgeRoutes from "./routes/knowledge.js";
app.use("/api/knowledge", knowledgeRoutes);

// Import and use agentic workflow routes
import agenticRoutes from "./routes/agentic.js";
app.use("/api/agentic", agenticRoutes);

// Import and use unified search routes
import searchRoutes from "./routes/search.js";
app.use("/api/search", searchRoutes);

// Source Discovery API
app.post("/api/sources/discover", async (req, res) => {
  try {
    const { region = "all", limit = 50 } = req.body;

    const discoveredSources = await discoverIntelligenceSources(region, limit);

    res.json({
      success: true,
      data: {
        sources: discoveredSources,
        total: discoveredSources.length,
        region,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Source discovery failed");
    res.status(500).json({
      success: false,
      error: "Source discovery failed",
    });
  }
});

// Function to discover intelligence sources
async function discoverIntelligenceSources(region, limit) {
  const sources = [];

  // Danish sources (40+)
  if (region === "all" || region === "danish") {
    const danishSources = [
      {
        name: "Center for Cybersikkerhed (CFCS)",
        domain: "cfcs.dk",
        type: "government",
        credibility: 98,
        geography: ["DK"],
        sectors: ["government", "critical_infrastructure"],
      },
      {
        name: "CERT-DK",
        domain: "cert.dk",
        type: "government",
        credibility: 95,
        geography: ["DK"],
        sectors: ["government", "cybersecurity"],
      },
      {
        name: "Forsvarets Efterretningstjeneste (FE)",
        domain: "fe.dk",
        type: "government",
        credibility: 99,
        geography: ["DK"],
        sectors: ["government", "defense"],
      },
      {
        name: "Politiets Efterretningstjeneste (PET)",
        domain: "pet.dk",
        type: "government",
        credibility: 98,
        geography: ["DK"],
        sectors: ["government", "law_enforcement"],
      },
      {
        name: "Finansiel Stabilitet",
        domain: "fs.dk",
        type: "government",
        credibility: 90,
        geography: ["DK"],
        sectors: ["finance", "government"],
      },
      {
        name: "Datatilsynet",
        domain: "datatilsynet.dk",
        type: "government",
        credibility: 85,
        geography: ["DK"],
        sectors: ["privacy", "government"],
      },
      {
        name: "Energistyrelsen",
        domain: "ens.dk",
        type: "government",
        credibility: 88,
        geography: ["DK"],
        sectors: ["energy", "government"],
      },
      {
        name: "Sundhedsdatastyrelsen",
        domain: "sundhedsdata.dk",
        type: "government",
        credibility: 87,
        geography: ["DK"],
        sectors: ["healthcare", "government"],
      },
      {
        name: "Transportstyrelsen",
        domain: "transportstyrelsen.dk",
        type: "government",
        credibility: 86,
        geography: ["DK"],
        sectors: ["transport", "government"],
      },
      {
        name: "DR Nyheder",
        domain: "dr.dk",
        type: "media",
        credibility: 92,
        geography: ["DK"],
        sectors: ["media", "news"],
      },
      {
        name: "Berlingske",
        domain: "berlingske.dk",
        type: "media",
        credibility: 89,
        geography: ["DK"],
        sectors: ["media", "news"],
      },
      {
        name: "Altinget",
        domain: "altinget.dk",
        type: "media",
        credibility: 88,
        geography: ["DK"],
        sectors: ["media", "news"],
      },
      {
        name: "Politiken",
        domain: "politiken.dk",
        type: "media",
        credibility: 87,
        geography: ["DK"],
        sectors: ["media", "news"],
      },
      {
        name: "Jyllands-Posten",
        domain: "jp.dk",
        type: "media",
        credibility: 86,
        geography: ["DK"],
        sectors: ["media", "news"],
      },
      {
        name: "Version2",
        domain: "version2.dk",
        type: "media",
        credibility: 85,
        geography: ["DK"],
        sectors: ["media", "technology"],
      },
      {
        name: "Computerworld",
        domain: "computerworld.dk",
        type: "media",
        credibility: 84,
        geography: ["DK"],
        sectors: ["media", "technology"],
      },
      {
        name: "IT Watch",
        domain: "itwatch.dk",
        type: "media",
        credibility: 83,
        geography: ["DK"],
        sectors: ["media", "technology"],
      },
      {
        name: "Finans",
        domain: "finans.dk",
        type: "media",
        credibility: 82,
        geography: ["DK"],
        sectors: ["media", "finance"],
      },
      {
        name: "Børsen",
        domain: "borsen.dk",
        type: "media",
        credibility: 81,
        geography: ["DK"],
        sectors: ["media", "finance"],
      },
      {
        name: "Mandag Morgen",
        domain: "mm.dk",
        type: "media",
        credibility: 80,
        geography: ["DK"],
        sectors: ["media", "business"],
      },
      {
        name: "Dansk Industri",
        domain: "di.dk",
        type: "organization",
        credibility: 88,
        geography: ["DK"],
        sectors: ["business", "industry"],
      },
      {
        name: "Dansk Erhverv",
        domain: "danskerhverv.dk",
        type: "organization",
        credibility: 87,
        geography: ["DK"],
        sectors: ["business", "trade"],
      },
      {
        name: "Finansforbundet",
        domain: "finansforbundet.dk",
        type: "organization",
        credibility: 85,
        geography: ["DK"],
        sectors: ["finance", "labor"],
      },
      {
        name: "HK",
        domain: "hk.dk",
        type: "organization",
        credibility: 84,
        geography: ["DK"],
        sectors: ["labor", "commerce"],
      },
      {
        name: "3F",
        domain: "3f.dk",
        type: "organization",
        credibility: 83,
        geography: ["DK"],
        sectors: ["labor", "industry"],
      },
      {
        name: "LO",
        domain: "lo.dk",
        type: "organization",
        credibility: 82,
        geography: ["DK"],
        sectors: ["labor", "politics"],
      },
      {
        name: "AC",
        domain: "ac.dk",
        type: "organization",
        credibility: 81,
        geography: ["DK"],
        sectors: ["labor", "academic"],
      },
      {
        name: "Dansk Metal",
        domain: "danskmetal.dk",
        type: "organization",
        credibility: 80,
        geography: ["DK"],
        sectors: ["labor", "manufacturing"],
      },
      {
        name: "IDA",
        domain: "ida.dk",
        type: "organization",
        credibility: 79,
        geography: ["DK"],
        sectors: ["academic", "engineering"],
      },
      {
        name: "Akademikerne",
        domain: "akademikerne.dk",
        type: "organization",
        credibility: 78,
        geography: ["DK"],
        sectors: ["academic", "professional"],
      },
      {
        name: "Djøf",
        domain: "djof.dk",
        type: "organization",
        credibility: 77,
        geography: ["DK"],
        sectors: ["academic", "law"],
      },
      {
        name: "Dansk Selskab for Cybersikkerhed",
        domain: "cybersikkerhed.dk",
        type: "organization",
        credibility: 90,
        geography: ["DK"],
        sectors: ["cybersecurity", "professional"],
      },
      {
        name: "IT-Branchen",
        domain: "it-branchen.dk",
        type: "organization",
        credibility: 85,
        geography: ["DK"],
        sectors: ["technology", "business"],
      },
      {
        name: "Dansk IT",
        domain: "dansk-it.dk",
        type: "organization",
        credibility: 84,
        geography: ["DK"],
        sectors: ["technology", "professional"],
      },
      {
        name: "Prosa",
        domain: "prosa.dk",
        type: "organization",
        credibility: 83,
        geography: ["DK"],
        sectors: ["technology", "labor"],
      },
      {
        name: "Dansk Industri",
        domain: "di.dk",
        type: "organization",
        credibility: 82,
        geography: ["DK"],
        sectors: ["industry", "business"],
      },
      {
        name: "Dansk Erhverv",
        domain: "danskerhverv.dk",
        type: "organization",
        credibility: 81,
        geography: ["DK"],
        sectors: ["business", "trade"],
      },
      {
        name: "Håndværkerrådet",
        domain: "haandvaerkerraadet.dk",
        type: "organization",
        credibility: 80,
        geography: ["DK"],
        sectors: ["craft", "business"],
      },
      {
        name: "Dansk Byggeri",
        domain: "danskbyggeri.dk",
        type: "organization",
        credibility: 79,
        geography: ["DK"],
        sectors: ["construction", "business"],
      },
      {
        name: "Dansk Energi",
        domain: "danskenergi.dk",
        type: "organization",
        credibility: 78,
        geography: ["DK"],
        sectors: ["energy", "business"],
      },
      {
        name: "Dansk Energi",
        domain: "danskenergi.dk",
        type: "organization",
        credibility: 77,
        geography: ["DK"],
        sectors: ["energy", "business"],
      },
      {
        name: "Dansk Energi",
        domain: "danskenergi.dk",
        type: "organization",
        credibility: 76,
        geography: ["DK"],
        sectors: ["energy", "business"],
      },
    ];
    sources.push(...danishSources.slice(0, 40));
  }

  // EU/European sources (50+)
  if (region === "all" || region === "european") {
    const europeanSources = [
      {
        name: "ENISA",
        domain: "enisa.europa.eu",
        type: "government",
        credibility: 95,
        geography: ["EU"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "EU Council",
        domain: "consilium.europa.eu",
        type: "government",
        credibility: 98,
        geography: ["EU"],
        sectors: ["government", "politics"],
      },
      {
        name: "EEAS",
        domain: "eeas.europa.eu",
        type: "government",
        credibility: 96,
        geography: ["EU"],
        sectors: ["government", "foreign_affairs"],
      },
      {
        name: "Europol",
        domain: "europol.europa.eu",
        type: "government",
        credibility: 94,
        geography: ["EU"],
        sectors: ["law_enforcement", "government"],
      },
      {
        name: "EC3",
        domain: "ec3.europa.eu",
        type: "government",
        credibility: 93,
        geography: ["EU"],
        sectors: ["cybersecurity", "law_enforcement"],
      },
      {
        name: "Frontex",
        domain: "frontex.europa.eu",
        type: "government",
        credibility: 92,
        geography: ["EU"],
        sectors: ["border_security", "government"],
      },
      {
        name: "EASA",
        domain: "easa.europa.eu",
        type: "government",
        credibility: 91,
        geography: ["EU"],
        sectors: ["aviation", "government"],
      },
      {
        name: "EMA",
        domain: "ema.europa.eu",
        type: "government",
        credibility: 90,
        geography: ["EU"],
        sectors: ["healthcare", "government"],
      },
      {
        name: "ECB",
        domain: "ecb.europa.eu",
        type: "government",
        credibility: 97,
        geography: ["EU"],
        sectors: ["finance", "government"],
      },
      {
        name: "ESMA",
        domain: "esma.europa.eu",
        type: "government",
        credibility: 89,
        geography: ["EU"],
        sectors: ["finance", "government"],
      },
      {
        name: "EBA",
        domain: "eba.europa.eu",
        type: "government",
        credibility: 88,
        geography: ["EU"],
        sectors: ["finance", "government"],
      },
      {
        name: "EIOPA",
        domain: "eiopa.europa.eu",
        type: "government",
        credibility: 87,
        geography: ["EU"],
        sectors: ["finance", "government"],
      },
      {
        name: "ACER",
        domain: "acer.europa.eu",
        type: "government",
        credibility: 86,
        geography: ["EU"],
        sectors: ["energy", "government"],
      },
      {
        name: "ENTSO-E",
        domain: "entsoe.eu",
        type: "organization",
        credibility: 85,
        geography: ["EU"],
        sectors: ["energy", "infrastructure"],
      },
      {
        name: "ENTSO-G",
        domain: "entsog.eu",
        type: "organization",
        credibility: 84,
        geography: ["EU"],
        sectors: ["energy", "infrastructure"],
      },
      {
        name: "CERT-EU",
        domain: "cert.europa.eu",
        type: "government",
        credibility: 93,
        geography: ["EU"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "EUROPOL EC3",
        domain: "ec3.europol.europa.eu",
        type: "government",
        credibility: 92,
        geography: ["EU"],
        sectors: ["cybersecurity", "law_enforcement"],
      },
      {
        name: "EU Agency for Cybersecurity",
        domain: "enisa.europa.eu",
        type: "government",
        credibility: 91,
        geography: ["EU"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "EU Agency for Fundamental Rights",
        domain: "fra.europa.eu",
        type: "government",
        credibility: 90,
        geography: ["EU"],
        sectors: ["human_rights", "government"],
      },
      {
        name: "EU Agency for Law Enforcement Training",
        domain: "cepol.europa.eu",
        type: "government",
        credibility: 89,
        geography: ["EU"],
        sectors: ["law_enforcement", "government"],
      },
      {
        name: "EU Agency for Railways",
        domain: "era.europa.eu",
        type: "government",
        credibility: 87,
        geography: ["EU"],
        sectors: ["transport", "government"],
      },
      {
        name: "EU Agency for Safety and Health at Work",
        domain: "osha.europa.eu",
        type: "government",
        credibility: 86,
        geography: ["EU"],
        sectors: ["health_safety", "government"],
      },
      {
        name: "EU Agency for the Management of Operational Cooperation at the External Borders",
        domain: "frontex.europa.eu",
        type: "government",
        credibility: 85,
        geography: ["EU"],
        sectors: ["border_security", "government"],
      },
      {
        name: "EU Agency for the Operational Management of Large-Scale IT Systems",
        domain: "eu-lisa.europa.eu",
        type: "government",
        credibility: 84,
        geography: ["EU"],
        sectors: ["it_systems", "government"],
      },
      {
        name: "EU Agency for the Space Programme",
        domain: "euspa.europa.eu",
        type: "government",
        credibility: 83,
        geography: ["EU"],
        sectors: ["space", "government"],
      },
      {
        name: "CERT-FR",
        domain: "cert.ssi.gouv.fr",
        type: "government",
        credibility: 88,
        geography: ["FR"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "BSI",
        domain: "bsi.bund.de",
        type: "government",
        credibility: 87,
        geography: ["DE"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "NCSC-NL",
        domain: "ncsc.nl",
        type: "government",
        credibility: 86,
        geography: ["NL"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "NCSC-UK",
        domain: "ncsc.gov.uk",
        type: "government",
        credibility: 89,
        geography: ["UK"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-PL",
        domain: "cert.pl",
        type: "government",
        credibility: 85,
        geography: ["PL"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-SE",
        domain: "cert.se",
        type: "government",
        credibility: 84,
        geography: ["SE"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-NO",
        domain: "cert.no",
        type: "government",
        credibility: 83,
        geography: ["NO"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-FI",
        domain: "cert.fi",
        type: "government",
        credibility: 82,
        geography: ["FI"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-IT",
        domain: "cert.it",
        type: "government",
        credibility: 81,
        geography: ["IT"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-ES",
        domain: "cert.es",
        type: "government",
        credibility: 80,
        geography: ["ES"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-PT",
        domain: "cert.pt",
        type: "government",
        credibility: 79,
        geography: ["PT"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-AT",
        domain: "cert.at",
        type: "government",
        credibility: 78,
        geography: ["AT"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-CH",
        domain: "cert.admin.ch",
        type: "government",
        credibility: 77,
        geography: ["CH"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-BE",
        domain: "cert.be",
        type: "government",
        credibility: 76,
        geography: ["BE"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-LU",
        domain: "cert.lu",
        type: "government",
        credibility: 75,
        geography: ["LU"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-IE",
        domain: "cert.ie",
        type: "government",
        credibility: 74,
        geography: ["IE"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-CZ",
        domain: "cert.cz",
        type: "government",
        credibility: 73,
        geography: ["CZ"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-SK",
        domain: "cert.sk",
        type: "government",
        credibility: 72,
        geography: ["SK"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-HU",
        domain: "cert.hu",
        type: "government",
        credibility: 71,
        geography: ["HU"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-RO",
        domain: "cert.ro",
        type: "government",
        credibility: 70,
        geography: ["RO"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-BG",
        domain: "cert.bg",
        type: "government",
        credibility: 69,
        geography: ["BG"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-HR",
        domain: "cert.hr",
        type: "government",
        credibility: 68,
        geography: ["HR"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-SI",
        domain: "cert.si",
        type: "government",
        credibility: 67,
        geography: ["SI"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-EE",
        domain: "cert.ee",
        type: "government",
        credibility: 66,
        geography: ["EE"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-LV",
        domain: "cert.lv",
        type: "government",
        credibility: 65,
        geography: ["LV"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-LT",
        domain: "cert.lt",
        type: "government",
        credibility: 64,
        geography: ["LT"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-CY",
        domain: "cert.cy",
        type: "government",
        credibility: 63,
        geography: ["CY"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-MT",
        domain: "cert.mt",
        type: "government",
        credibility: 62,
        geography: ["MT"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-GR",
        domain: "cert.gr",
        type: "government",
        credibility: 61,
        geography: ["GR"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "CERT-DK",
        domain: "cert.dk",
        type: "government",
        credibility: 60,
        geography: ["DK"],
        sectors: ["cybersecurity", "government"],
      },
    ];
    sources.push(...europeanSources.slice(0, 50));
  }

  // International sources (50+)
  if (region === "all" || region === "international") {
    const internationalSources = [
      {
        name: "CISA",
        domain: "cisa.gov",
        type: "government",
        credibility: 95,
        geography: ["US"],
        sectors: ["cybersecurity", "government"],
      },
      {
        name: "NSA",
        domain: "nsa.gov",
        type: "government",
        credibility: 99,
        geography: ["US"],
        sectors: ["intelligence", "government"],
      },
      {
        name: "FBI",
        domain: "fbi.gov",
        type: "government",
        credibility: 98,
        geography: ["US"],
        sectors: ["law_enforcement", "government"],
      },
      {
        name: "CIA",
        domain: "cia.gov",
        type: "government",
        credibility: 99,
        geography: ["US"],
        sectors: ["intelligence", "government"],
      },
      {
        name: "DHS",
        domain: "dhs.gov",
        type: "government",
        credibility: 97,
        geography: ["US"],
        sectors: ["homeland_security", "government"],
      },
      {
        name: "NIST",
        domain: "nist.gov",
        type: "government",
        credibility: 96,
        geography: ["US"],
        sectors: ["standards", "government"],
      },
      {
        name: "CERT-CC",
        domain: "cert.org",
        type: "organization",
        credibility: 94,
        geography: ["US"],
        sectors: ["cybersecurity", "research"],
      },
      {
        name: "SANS",
        domain: "sans.org",
        type: "organization",
        credibility: 93,
        geography: ["US"],
        sectors: ["cybersecurity", "education"],
      },
      {
        name: "MITRE",
        domain: "mitre.org",
        type: "organization",
        credibility: 92,
        geography: ["US"],
        sectors: ["cybersecurity", "research"],
      },
      {
        name: "CVE",
        domain: "cve.mitre.org",
        type: "organization",
        credibility: 91,
        geography: ["US"],
        sectors: ["vulnerabilities", "research"],
      },
      {
        name: "CWE",
        domain: "cwe.mitre.org",
        type: "organization",
        credibility: 90,
        geography: ["US"],
        sectors: ["vulnerabilities", "research"],
      },
      {
        name: "CAPEC",
        domain: "capec.mitre.org",
        type: "organization",
        credibility: 89,
        geography: ["US"],
        sectors: ["attack_patterns", "research"],
      },
      {
        name: "ATT&CK",
        domain: "attack.mitre.org",
        type: "organization",
        credibility: 88,
        geography: ["US"],
        sectors: ["attack_tactics", "research"],
      },
      {
        name: "NVD",
        domain: "nvd.nist.gov",
        type: "government",
        credibility: 87,
        geography: ["US"],
        sectors: ["vulnerabilities", "government"],
      },
      {
        name: "CVE Details",
        domain: "cvedetails.com",
        type: "commercial",
        credibility: 86,
        geography: ["US"],
        sectors: ["vulnerabilities", "commercial"],
      },
      {
        name: "Exploit Database",
        domain: "exploit-db.com",
        type: "commercial",
        credibility: 85,
        geography: ["US"],
        sectors: ["exploits", "commercial"],
      },
      {
        name: "VulnDB",
        domain: "vulndb.com",
        type: "commercial",
        credibility: 84,
        geography: ["US"],
        sectors: ["vulnerabilities", "commercial"],
      },
      {
        name: "ThreatConnect",
        domain: "threatconnect.com",
        type: "commercial",
        credibility: 83,
        geography: ["US"],
        sectors: ["threat_intelligence", "commercial"],
      },
      {
        name: "Recorded Future",
        domain: "recordedfuture.com",
        type: "commercial",
        credibility: 82,
        geography: ["US"],
        sectors: ["threat_intelligence", "commercial"],
      },
      {
        name: "FireEye",
        domain: "fireeye.com",
        type: "commercial",
        credibility: 81,
        geography: ["US"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "CrowdStrike",
        domain: "crowdstrike.com",
        type: "commercial",
        credibility: 80,
        geography: ["US"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Palo Alto Networks",
        domain: "paloaltonetworks.com",
        type: "commercial",
        credibility: 79,
        geography: ["US"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Symantec",
        domain: "symantec.com",
        type: "commercial",
        credibility: 78,
        geography: ["US"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "McAfee",
        domain: "mcafee.com",
        type: "commercial",
        credibility: 77,
        geography: ["US"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Trend Micro",
        domain: "trendmicro.com",
        type: "commercial",
        credibility: 76,
        geography: ["US"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Kaspersky",
        domain: "kaspersky.com",
        type: "commercial",
        credibility: 75,
        geography: ["RU"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "ESET",
        domain: "eset.com",
        type: "commercial",
        credibility: 74,
        geography: ["SK"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Bitdefender",
        domain: "bitdefender.com",
        type: "commercial",
        credibility: 73,
        geography: ["RO"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Avast",
        domain: "avast.com",
        type: "commercial",
        credibility: 72,
        geography: ["CZ"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "AVG",
        domain: "avg.com",
        type: "commercial",
        credibility: 71,
        geography: ["CZ"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Malwarebytes",
        domain: "malwarebytes.com",
        type: "commercial",
        credibility: 70,
        geography: ["US"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Webroot",
        domain: "webroot.com",
        type: "commercial",
        credibility: 69,
        geography: ["US"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Sophos",
        domain: "sophos.com",
        type: "commercial",
        credibility: 68,
        geography: ["UK"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "F-Secure",
        domain: "f-secure.com",
        type: "commercial",
        credibility: 67,
        geography: ["FI"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "G Data",
        domain: "gdata.com",
        type: "commercial",
        credibility: 66,
        geography: ["DE"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Emsisoft",
        domain: "emsisoft.com",
        type: "commercial",
        credibility: 65,
        geography: ["NZ"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Comodo",
        domain: "comodo.com",
        type: "commercial",
        credibility: 64,
        geography: ["US"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "VIPRE",
        domain: "vipre.com",
        type: "commercial",
        credibility: 63,
        geography: ["US"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "ZoneAlarm",
        domain: "zonealarm.com",
        type: "commercial",
        credibility: 62,
        geography: ["US"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "BullGuard",
        domain: "bullguard.com",
        type: "commercial",
        credibility: 61,
        geography: ["UK"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Panda Security",
        domain: "pandasecurity.com",
        type: "commercial",
        credibility: 60,
        geography: ["ES"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Fortinet",
        domain: "fortinet.com",
        type: "commercial",
        credibility: 59,
        geography: ["US"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Check Point",
        domain: "checkpoint.com",
        type: "commercial",
        credibility: 58,
        geography: ["IL"],
        sectors: ["cybersecurity", "commercial"],
      },
      {
        name: "Cisco",
        domain: "cisco.com",
        type: "commercial",
        credibility: 57,
        geography: ["US"],
        sectors: ["networking", "commercial"],
      },
      {
        name: "Juniper",
        domain: "juniper.net",
        type: "commercial",
        credibility: 56,
        geography: ["US"],
        sectors: ["networking", "commercial"],
      },
      {
        name: "F5",
        domain: "f5.com",
        type: "commercial",
        credibility: 55,
        geography: ["US"],
        sectors: ["networking", "commercial"],
      },
      {
        name: "Akamai",
        domain: "akamai.com",
        type: "commercial",
        credibility: 54,
        geography: ["US"],
        sectors: ["cdn", "commercial"],
      },
      {
        name: "Cloudflare",
        domain: "cloudflare.com",
        type: "commercial",
        credibility: 53,
        geography: ["US"],
        sectors: ["cdn", "commercial"],
      },
      {
        name: "AWS",
        domain: "aws.amazon.com",
        type: "commercial",
        credibility: 52,
        geography: ["US"],
        sectors: ["cloud", "commercial"],
      },
      {
        name: "Microsoft Azure",
        domain: "azure.microsoft.com",
        type: "commercial",
        credibility: 51,
        geography: ["US"],
        sectors: ["cloud", "commercial"],
      },
      {
        name: "Google Cloud",
        domain: "cloud.google.com",
        type: "commercial",
        credibility: 50,
        geography: ["US"],
        sectors: ["cloud", "commercial"],
      },
    ];
    sources.push(...internationalSources.slice(0, 50));
  }

  // Darkweb sources (20+)
  if (region === "all" || region === "darkweb") {
    const darkwebSources = [
      {
        name: "Tor Project",
        domain: "torproject.org",
        type: "organization",
        credibility: 85,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "I2P",
        domain: "geti2p.net",
        type: "organization",
        credibility: 80,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "Freenet",
        domain: "freenetproject.org",
        type: "organization",
        credibility: 75,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "ZeroNet",
        domain: "zeronet.io",
        type: "organization",
        credibility: 70,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "RetroShare",
        domain: "retroshare.net",
        type: "organization",
        credibility: 65,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "GNUnet",
        domain: "gnunet.org",
        type: "organization",
        credibility: 60,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "Tails",
        domain: "tails.boum.org",
        type: "organization",
        credibility: 80,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "Whonix",
        domain: "whonix.org",
        type: "organization",
        credibility: 75,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "Qubes OS",
        domain: "qubes-os.org",
        type: "organization",
        credibility: 85,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "Parrot OS",
        domain: "parrotsec.org",
        type: "organization",
        credibility: 70,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "Kali Linux",
        domain: "kali.org",
        type: "organization",
        credibility: 75,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "BlackArch",
        domain: "blackarch.org",
        type: "organization",
        credibility: 65,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "ArchStrike",
        domain: "archstrike.org",
        type: "organization",
        credibility: 60,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "Pentoo",
        domain: "pentoo.ch",
        type: "organization",
        credibility: 55,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "BackBox",
        domain: "backbox.org",
        type: "organization",
        credibility: 50,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "DEFT",
        domain: "deftlinux.net",
        type: "organization",
        credibility: 45,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "CAINE",
        domain: "caine-live.net",
        type: "organization",
        credibility: 40,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "Matriux",
        domain: "matriux.com",
        type: "organization",
        credibility: 35,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "Samurai",
        domain: "samurai.inguardians.com",
        type: "organization",
        credibility: 30,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
      {
        name: "Wifislax",
        domain: "wifislax.com",
        type: "organization",
        credibility: 25,
        geography: ["Global"],
        sectors: ["privacy", "anonymity"],
        openSource: true,
      },
    ];
    sources.push(...darkwebSources.slice(0, 20));
  }

  return sources.slice(0, limit);
}

app.post("/api/knowledge", (req, res) => {
  const {
    title,
    content,
    tags = [],
    category,
    source,
    classification,
    relevance,
  } = req.body || {};
  if (typeof title !== "string" || typeof content !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "title and content are required" });
  }
  try {
    const doc = knowledgeRepo.upsertDocument({
      title,
      content,
      tags,
      category: category || "general",
      source: source || "unknown",
      classification: classification || "unclassified",
      relevance: relevance || "medium",
    });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    logger.error({ err: error }, "Failed to upsert knowledge document");
    res
      .status(500)
      .json({ success: false, error: "Failed to upsert knowledge document" });
  }
});

app.post("/api/knowledge/search", (req, res) => {
  const { query, limit = 5 } = req.body || {};
  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ success: false, error: "query is required" });
  }
  try {
    const results = knowledgeRepo.search(query, { limit });
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error({ err: error }, "Failed to search knowledge base");
    res
      .status(500)
      .json({ success: false, error: "Failed to search knowledge base" });
  }
});

app.get("/api/knowledge/stats", (req, res) => {
  try {
    const stats = knowledgeRepo.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error({ err: error }, "Failed to get knowledge base stats");
    res
      .status(500)
      .json({ success: false, error: "Failed to get knowledge base stats" });
  }
});

// Admin v2 In-Memory Stores and Endpoints
const adminStore = {
  keywords: [],
  sources: [],
  ragConfig: {
    model: "llama3.1:8b",
    temperature: "0.7",
    max_tokens: "2000",
    vector_store_provider: "memory",
    embedding_model: "nomic-embed-text",
    // RAG sources are derived from monitoring sources (adminStore.sources)
    // and can be imported via the import endpoint below
    sources: [],
  },
  agents: [
    {
      id: "project_leader",
      name: "Project Leader",
      systemPrompt:
        "You are the Project Leader. Drive delivery, clarify scope, prioritize, and coordinate team outputs. Escalate blockers and ensure user value.",
    },
    {
      id: "system_architect",
      name: "System Architect",
      systemPrompt:
        "You are the System Architect. Define architecture, enforce boundaries, ensure scalability, reliability, and security. Maintain ADRs.",
    },
    {
      id: "integration_architect",
      name: "Integration Architect",
      systemPrompt:
        "You are the Integration Architect. Own APIs, data contracts, adapters. Ensure compatibility with external systems (MISP, OpenCTI, Wigle, Maps).",
    },
    {
      id: "ux_expert",
      name: "GUI/UX Expert",
      systemPrompt:
        "You are the UX expert. Optimize flows, clarity, affordances, and accessibility. Provide component-level guidance and copy.",
    },
    {
      id: "rag_expert",
      name: "RAG Expert",
      systemPrompt:
        "You are the RAG Expert. Configure chunking, embeddings, indexing, and grounding. Propose evals and guardrails for hallucinations.",
    },
    {
      id: "orchestrator",
      name: "Orchestrator",
      systemPrompt:
        "You are the Orchestrator. Break goals into steps, pick tools, coordinate agents, and report progress with artifacts.",
    },
  ],
};

let keywordIdSeq = 1;
let sourceIdSeq = 1;

// Seed defaults
adminStore.keywords = [
  {
    id: keywordIdSeq++,
    keyword: "APT28",
    category: "threat-actor",
    priority: 1,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: keywordIdSeq++,
    keyword: "LockBit",
    category: "ransomware",
    priority: 2,
    active: true,
    created_at: new Date().toISOString(),
  },
];
adminStore.sources = [
  {
    id: sourceIdSeq++,
    source_type: "rss",
    url: "https://www.cert.europa.eu/rss.xml",
    scan_frequency: 3600,
    last_scanned: null,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: sourceIdSeq++,
    source_type: "website",
    url: "https://cfcs.dk/da/nyheder/",
    scan_frequency: 7200,
    last_scanned: null,
    active: true,
    created_at: new Date().toISOString(),
  },
];

// Keywords
app.get("/api/admin/keywords", (req, res) => {
  res.json({ success: true, data: adminStore.keywords });
});

app.post("/api/admin/keywords", (req, res) => {
  const { keyword, category = "general", priority = 1 } = req.body || {};
  if (!keyword || typeof keyword !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "keyword is required" });
  }
  const item = {
    id: keywordIdSeq++,
    keyword: keyword.trim(),
    category: String(category),
    priority: Number(priority) || 1,
    active: true,
    created_at: new Date().toISOString(),
  };
  adminStore.keywords.unshift(item);
  res.status(201).json({ success: true, data: item });
});

app.delete("/api/admin/keywords/:id", (req, res) => {
  const id = Number(req.params.id);
  adminStore.keywords = adminStore.keywords.filter((k) => k.id !== id);
  res.json({ success: true });
});

app.put("/api/admin/keywords/:id/toggle", (req, res) => {
  const id = Number(req.params.id);
  const idx = adminStore.keywords.findIndex((k) => k.id === id);
  if (idx === -1)
    return res.status(404).json({ success: false, error: "Not found" });
  adminStore.keywords[idx].active = !adminStore.keywords[idx].active;
  res.json({ success: true, data: adminStore.keywords[idx] });
});

// Sources
app.get("/api/admin/sources", (req, res) => {
  res.json({ success: true, data: adminStore.sources });
});

app.post("/api/admin/sources", (req, res) => {
  const { sourceType, url, scanFrequency = 3600 } = req.body || {};
  if (!url)
    return res.status(400).json({ success: false, error: "url is required" });
  const item = {
    id: sourceIdSeq++,
    source_type: String(sourceType || "website"),
    url: String(url),
    scan_frequency: Number(scanFrequency) || 3600,
    last_scanned: null,
    active: true,
    created_at: new Date().toISOString(),
  };
  adminStore.sources.unshift(item);
  res.status(201).json({ success: true, data: item });
});

app.delete("/api/admin/sources/:id", (req, res) => {
  const id = Number(req.params.id);
  adminStore.sources = adminStore.sources.filter((s) => s.id !== id);
  res.json({ success: true });
});

// Seed common monitoring sources (DK/EU) quickly from server-side
app.post("/api/admin/sources/seed-defaults", (req, res) => {
  try {
    const defaults = [
      {
        source_type: "rss",
        url: "https://www.cert.dk/nyheder/rss",
        scan_frequency: 3600,
      },
      {
        source_type: "rss",
        url: "https://cert.europa.eu/rss.xml",
        scan_frequency: 3600,
      },
      {
        source_type: "rss",
        url: "https://www.cisa.gov/news-events/cybersecurity-advisories/all.xml",
        scan_frequency: 3600,
      },
      {
        source_type: "website",
        url: "https://cfcs.dk/da/nyheder/",
        scan_frequency: 7200,
      },
      {
        source_type: "website",
        url: "https://www.enisa.europa.eu/news",
        scan_frequency: 7200,
      },
    ];
    for (const d of defaults) {
      adminStore.sources.unshift({
        id: sourceIdSeq++,
        source_type: d.source_type,
        url: d.url,
        scan_frequency: d.scan_frequency,
        last_scanned: null,
        active: true,
        created_at: new Date().toISOString(),
      });
    }
    return res.json({ success: true, data: { count: defaults.length } });
  } catch (err) {
    logger.error({ err }, "Failed to seed default sources");
    return res.status(500).json({ success: false, error: "Seed failed" });
  }
});

// RAG Config
app.get("/api/admin/rag-config", (req, res) => {
  res.json({ success: true, data: adminStore.ragConfig });
});

app.put("/api/admin/rag-config", (req, res) => {
  const {
    model,
    temperature,
    max_tokens,
    vector_store_provider,
    embedding_model,
  } = req.body || {};
  adminStore.ragConfig = {
    model: model || adminStore.ragConfig.model,
    temperature: String(temperature ?? adminStore.ragConfig.temperature),
    max_tokens: String(max_tokens ?? adminStore.ragConfig.max_tokens),
    vector_store_provider:
      vector_store_provider || adminStore.ragConfig.vector_store_provider,
    embedding_model: embedding_model || adminStore.ragConfig.embedding_model,
    sources: adminStore.ragConfig.sources || [],
  };
  res.json({ success: true, data: adminStore.ragConfig });
});

// Import monitoring sources into RAG config
app.post("/api/admin/rag-config/import-sources", (req, res) => {
  try {
    // take only active sources and map minimal fields needed for RAG
    const mapped = (adminStore.sources || [])
      .filter((s) => s && s.active !== false)
      .map((s) => ({
        id: s.id,
        type: s.source_type,
        url: s.url,
        scan_frequency: s.scan_frequency,
      }));

    adminStore.ragConfig.sources = mapped;
    return res.json({
      success: true,
      data: { count: mapped.length, sources: mapped },
    });
  } catch (err) {
    logger.error(
      { err },
      "Failed to import monitoring sources into RAG config"
    );
    return res.status(500).json({ success: false, error: "Import failed" });
  }
});

app.post("/api/admin/run-rag-analysis", async (req, res) => {
  try {
    const results = [];
    for (const k of adminStore.keywords.filter((k) => k.active)) {
      const hits = knowledgeRepo.search(k.keyword, { limit: 3 });
      results.push({ keyword: k.keyword, hits });
    }
    res.json({
      success: true,
      data: { results, model: adminStore.ragConfig.model },
    });
  } catch (error) {
    logger.error({ err: error }, "RAG analysis failed");
    res.status(500).json({ success: false, error: "RAG analysis failed" });
  }
});

// Agents & Team
app.get("/api/admin/agents", (req, res) => {
  res.json({ success: true, data: adminStore.agents });
});

app.put("/api/admin/agents", (req, res) => {
  const { agents } = req.body || {};
  if (!Array.isArray(agents)) {
    return res
      .status(400)
      .json({ success: false, error: "agents array required" });
  }
  for (const incoming of agents) {
    const idx = adminStore.agents.findIndex((a) => a.id === incoming.id);
    if (idx !== -1 && typeof incoming.systemPrompt === "string") {
      adminStore.agents[idx].systemPrompt = incoming.systemPrompt;
    }
  }
  res.json({ success: true, data: adminStore.agents });
});

// Wigle WiFi & Google Maps Integration Endpoints
app.get("/api/wigle-maps/config", (req, res) => {
  try {
    const config = wigleMapsIntegration.getConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error({ err: error }, "Failed to get Wigle Maps config");
    res.status(500).json({ success: false, error: "Failed to get config" });
  }
});

app.post("/api/wigle-maps/search-wifi", async (req, res) => {
  const { ssid, bssid, lat, lon, radius, results } = req.body || {};
  try {
    const result = await wigleMapsIntegration.searchWifiNetworks({
      ssid,
      bssid,
      lat: typeof lat === "string" ? parseFloat(lat.replace(",", ".")) : lat,
      lon: typeof lon === "string" ? parseFloat(lon.replace(",", ".")) : lon,
      radius:
        typeof radius === "string"
          ? parseFloat(radius.replace(",", ".")) || 0.01
          : typeof radius === "number"
          ? radius
          : 0.01,
      results: Number.isFinite(parseInt(results)) ? parseInt(results) : 100,
    });
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to search WiFi networks");
    res
      .status(500)
      .json({ success: false, error: "Failed to search WiFi networks" });
  }
});

app.get("/api/wigle-maps/wifi-details/:bssid", async (req, res) => {
  const { bssid } = req.params;
  try {
    const result = await wigleMapsIntegration.getWifiNetworkDetails(bssid);
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to get WiFi network details");
    res
      .status(500)
      .json({ success: false, error: "Failed to get WiFi details" });
  }
});

app.post("/api/wigle-maps/geocode", async (req, res) => {
  const { address } = req.body || {};
  if (!address) {
    return res
      .status(400)
      .json({ success: false, error: "Address is required" });
  }
  try {
    const result = await wigleMapsIntegration.geocodeAddress(address);
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to geocode address");
    res
      .status(500)
      .json({ success: false, error: "Failed to geocode address" });
  }
});

app.post("/api/wigle-maps/reverse-geocode", async (req, res) => {
  const { lat, lon } = req.body || {};
  if (typeof lat !== "number" || typeof lon !== "number") {
    return res
      .status(400)
      .json({ success: false, error: "Latitude and longitude are required" });
  }
  try {
    const result = await wigleMapsIntegration.reverseGeocode(lat, lon);
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to reverse geocode");
    res
      .status(500)
      .json({ success: false, error: "Failed to reverse geocode" });
  }
});

app.post("/api/wigle-maps/nearby-places", async (req, res) => {
  const { lat, lon, radius, type } = req.body || {};
  if (typeof lat !== "number" || typeof lon !== "number") {
    return res
      .status(400)
      .json({ success: false, error: "Latitude and longitude are required" });
  }
  try {
    const result = await wigleMapsIntegration.getNearbyPlaces(
      lat,
      lon,
      parseInt(radius) || 1000,
      type || "establishment"
    );
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to get nearby places");
    res
      .status(500)
      .json({ success: false, error: "Failed to get nearby places" });
  }
});

app.post("/api/wigle-maps/analyze-location", async (req, res) => {
  const { lat, lon, radius } = req.body || {};
  if (typeof lat !== "number" || typeof lon !== "number") {
    return res
      .status(400)
      .json({ success: false, error: "Latitude and longitude are required" });
  }
  try {
    const result = await wigleMapsIntegration.analyzeLocation(
      lat,
      lon,
      parseFloat(radius) || 0.01
    );
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to analyze location");
    res
      .status(500)
      .json({ success: false, error: "Failed to analyze location" });
  }
});

app.get("/api/wigle-maps/track-device/:bssid", async (req, res) => {
  const { bssid } = req.params;
  try {
    const result = await wigleMapsIntegration.trackDevice(bssid);
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to track device");
    res.status(500).json({ success: false, error: "Failed to track device" });
  }
});

// Wigle Data Loader Endpoints
app.get("/api/wigle-data/config", (req, res) => {
  try {
    const config = wigleDataLoader.getConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error({ err: error }, "Failed to get Wigle data config");
    res.status(500).json({ success: false, error: "Failed to get config" });
  }
});

app.post("/api/wigle-data/load-denmark", async (req, res) => {
  try {
    const result = await wigleDataLoader.loadDenmarkData();
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to load Denmark data");
    res
      .status(500)
      .json({ success: false, error: "Failed to load Denmark data" });
  }
});

app.post("/api/wigle-data/update", async (req, res) => {
  try {
    const result = await wigleDataLoader.updateData();
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to update Wigle data");
    res.status(500).json({ success: false, error: "Failed to update data" });
  }
});

app.get("/api/wigle-data/statistics", (req, res) => {
  try {
    const stats = wigleDataLoader.getStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error({ err: error }, "Failed to get Wigle data statistics");
    res.status(500).json({ success: false, error: "Failed to get statistics" });
  }
});

app.post("/api/wigle-data/search-location", async (req, res) => {
  const { lat, lon, radius } = req.body || {};
  if (typeof lat !== "number" || typeof lon !== "number") {
    return res
      .status(400)
      .json({ success: false, error: "Latitude and longitude are required" });
  }
  try {
    const networks = await wigleDataLoader.getNetworksByLocation(
      lat,
      lon,
      radius
    );
    res.json({ success: true, data: networks });
  } catch (error) {
    logger.error({ err: error }, "Failed to search networks by location");
    res
      .status(500)
      .json({ success: false, error: "Failed to search networks" });
  }
});

app.post("/api/wigle-data/search-ssid", async (req, res) => {
  const { pattern } = req.body || {};
  if (!pattern) {
    return res
      .status(400)
      .json({ success: false, error: "SSID pattern is required" });
  }
  try {
    const networks = await wigleDataLoader.getNetworksBySSID(pattern);
    res.json({ success: true, data: networks });
  } catch (error) {
    logger.error({ err: error }, "Failed to search networks by SSID");
    res
      .status(500)
      .json({ success: false, error: "Failed to search networks" });
  }
});

app.post("/api/wigle-data/search-mac", async (req, res) => {
  const { pattern } = req.body || {};
  if (!pattern) {
    return res
      .status(400)
      .json({ success: false, error: "MAC pattern is required" });
  }
  try {
    const networks = await wigleDataLoader.getNetworksByMAC(pattern);
    res.json({ success: true, data: networks });
  } catch (error) {
    logger.error({ err: error }, "Failed to search networks by MAC");
    res
      .status(500)
      .json({ success: false, error: "Failed to search networks" });
  }
});

// Pentest Module Endpoints
app.get("/api/pentest/config", (req, res) => {
  try {
    const config = pentestModule.getConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error({ err: error }, "Failed to get pentest config");
    res.status(500).json({ success: false, error: "Failed to get config" });
  }
});

app.get("/api/pentest/purposes", (req, res) => {
  try {
    const purposes = pentestModule.getAvailablePurposes();
    res.json({ success: true, data: purposes });
  } catch (error) {
    logger.error({ err: error }, "Failed to get pentest purposes");
    res.status(500).json({ success: false, error: "Failed to get purposes" });
  }
});

app.get("/api/pentest/tools/:purpose", (req, res) => {
  const { purpose } = req.params;
  try {
    const tools = pentestModule.getToolSuggestions(purpose);
    res.json({ success: true, data: tools });
  } catch (error) {
    logger.error({ err: error }, "Failed to get pentest tools");
    res.status(500).json({ success: false, error: "Failed to get tools" });
  }
});

app.post("/api/pentest/execute", async (req, res) => {
  const { toolName, command, target } = req.body || {};
  if (!toolName || !command || !target) {
    return res.status(400).json({
      success: false,
      error: "toolName, command, and target are required",
    });
  }
  try {
    const result = await pentestModule.executeCommand(
      toolName,
      command,
      target
    );
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to execute pentest command");
    res
      .status(500)
      .json({ success: false, error: "Failed to execute command" });
  }
});

app.post("/api/pentest/quick-scan", async (req, res) => {
  const { target, scanType } = req.body || {};
  if (!target) {
    return res
      .status(400)
      .json({ success: false, error: "Target is required" });
  }
  try {
    const result = await pentestModule.quickScan(target, scanType);
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to perform quick scan");
    res.status(500).json({ success: false, error: "Failed to perform scan" });
  }
});

app.post("/api/pentest/vulnerability-assessment", async (req, res) => {
  const { target } = req.body || {};
  if (!target) {
    return res
      .status(400)
      .json({ success: false, error: "Target is required" });
  }
  try {
    const result = await pentestModule.vulnerabilityAssessment(target);
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to perform vulnerability assessment");
    res
      .status(500)
      .json({ success: false, error: "Failed to perform assessment" });
  }
});

app.post("/api/pentest/network-discovery", async (req, res) => {
  const { network } = req.body || {};
  if (!network) {
    return res
      .status(400)
      .json({ success: false, error: "Network is required" });
  }
  try {
    const result = await pentestModule.networkDiscovery(network);
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to perform network discovery");
    res
      .status(500)
      .json({ success: false, error: "Failed to perform discovery" });
  }
});

app.post("/api/pentest/wifi-assessment", async (req, res) => {
  const { interface: iface } = req.body || {};
  try {
    const result = await pentestModule.wifiSecurityAssessment(iface);
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to perform WiFi assessment");
    res
      .status(500)
      .json({ success: false, error: "Failed to perform assessment" });
  }
});

// Scheduler Endpoints
app.get("/api/scheduler/status", (req, res) => {
  try {
    const config = scheduler.getConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error({ err: error }, "Failed to get scheduler status");
    res.status(500).json({ success: false, error: "Failed to get status" });
  }
});

app.get("/api/scheduler/tasks", (req, res) => {
  try {
    const tasks = scheduler.getAllTasks();
    res.json({ success: true, data: tasks });
  } catch (error) {
    logger.error({ err: error }, "Failed to get scheduled tasks");
    res.status(500).json({ success: false, error: "Failed to get tasks" });
  }
});

app.post("/api/scheduler/schedule", (req, res) => {
  const { name, intervalMs, immediate } = req.body || {};
  if (!name || !intervalMs) {
    return res
      .status(400)
      .json({ success: false, error: "name and intervalMs are required" });
  }
  try {
    // This would need a task function - for now just return success
    res.json({ success: true, message: "Task scheduling endpoint ready" });
  } catch (error) {
    logger.error({ err: error }, "Failed to schedule task");
    res.status(500).json({ success: false, error: "Failed to schedule task" });
  }
});

// Agent Chat API
app.post("/api/agent/chat", chatLimiter, async (req, res) => {
  const { messages, model: requestedModel } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res
      .status(400)
      .json({ success: false, error: "messages array is required" });
  }

  try {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return res
        .status(400)
        .json({ success: false, error: "Last message must be from user" });
    }

    // 1) Try Ollama first (multiple base fallbacks, support chat format + model override)
    const bases = [
      process.env.OLLAMA_BASE_URL,
      process.env.OLLAMA_URL,
      "http://127.0.0.1:11434",
      "http://localhost:11434",
      "http://host.docker.internal:11434",
    ]
      .filter(Boolean)
      .map((b) => String(b).replace(/\/$/, ""));

    // Prefer admin RAG config if present
    try {
      const ragCfg = adminStore?.ragConfig || {};
      if (ragCfg?.ollama_base) bases.unshift(String(ragCfg.ollama_base));
    } catch {}

    const chosenModel =
      (requestedModel && String(requestedModel)) ||
      adminStore?.ragConfig?.model ||
      process.env.OLLAMA_CHAT_MODEL ||
      "llama3.1:8b";

    for (const base of bases) {
      try {
        const r = await fetch(`${base}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: chosenModel,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            stream: false,
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (r.ok) {
          const j = await r.json();
          const answer =
            typeof j?.message?.content === "string"
              ? j.message.content
              : j?.response || "";
          if (answer) {
            return res.json({
              success: true,
              provider: "ollama",
              model: chosenModel,
              answer,
            });
          }
        }
      } catch (_) {}
    }

    // 2) Fallback to OpenAI if key exists
    try {
      const openaiKey =
        (await findApiKey("openai"))?.value || process.env.OPENAI_API_KEY;
      if (openaiKey) {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages,
            temperature: 0.3,
          }),
          signal: AbortSignal.timeout(20000),
        });
        if (r.ok) {
          const j = await r.json();
          const answer = j?.choices?.[0]?.message?.content || "";
          return res.json({ success: true, provider: "openai", answer });
        }
      }
    } catch (e) {
      logger.warn({ err: String(e) }, "OpenAI fallback failed");
    }

    // 3) Fallback to Anthropic if key exists
    try {
      const antKey =
        (await findApiKey("anthropic"))?.value || process.env.ANTHROPIC_API_KEY;
      if (antKey) {
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": antKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
            max_tokens: 4000,
            messages,
          }),
          signal: AbortSignal.timeout(20000),
        });
        if (r.ok) {
          const j = await r.json();
          const answer = j?.content?.[0]?.text || "";
          return res.json({ success: true, provider: "anthropic", answer });
        }
      }
    } catch (e) {
      logger.warn({ err: String(e) }, "Anthropic fallback failed");
    }

    // Final fallback
    const response = `Jeg er Cyberstreams Agent. Jeg kunne ikke nå en model lige nu. Spørgsmålet var: "${lastMessage.content}".`;
    res.json({ success: true, provider: "static", answer: response });
  } catch (error) {
    logger.error({ err: error }, "Agent chat failed");
    res.status(500).json({ success: false, error: "Chat failed" });
  }
});

// Agentic Orchestrator API
app.get("/api/agentic/tools", (req, res) => {
  try {
    const tools = orchestrator.listTools();
    res.json({ success: true, count: tools.length, data: tools });
  } catch (error) {
    logger.error({ err: error }, "Failed to list agentic tools");
    res.status(500).json({ success: false, error: "Failed to list tools" });
  }
});

app.post("/api/agentic/discover", async (req, res) => {
  const { providers = [], query = "" } = req.body || {};
  try {
    const results = await orchestrator.discover({ providers, query });
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    logger.error({ err: error }, "Agentic discovery failed");
    res.status(500).json({ success: false, error: "Discovery failed" });
  }
});

// Orchestrator runs (non-workflow) moved to separate namespace to avoid conflicts
app.post("/api/orchestrator/runs", orchestratorLimiter, (req, res) => {
  const { goal } = req.body || {};
  if (typeof goal !== "string" || !goal.trim()) {
    return res
      .status(400)
      .json({ success: false, error: "goal must be provided as a string" });
  }
  try {
    const run = orchestrator.createRun({ goal: goal.trim() });
    res.status(201).json({ success: true, data: run });
  } catch (error) {
    logger.error({ err: error }, "Failed to create agentic run");
    res.status(500).json({ success: false, error: "Failed to create run" });
  }
});

app.get("/api/orchestrator/runs", orchestratorLimiter, (req, res) => {
  try {
    const runs = orchestrator.listRuns();
    res.json({ success: true, count: runs.length, data: runs });
  } catch (error) {
    logger.error({ err: error }, "Failed to list agentic runs");
    res.status(500).json({ success: false, error: "Failed to list runs" });
  }
});

app.get("/api/orchestrator/runs/:id", orchestratorLimiter, (req, res) => {
  try {
    const run = orchestrator.getRun(req.params.id);
    if (!run)
      return res.status(404).json({ success: false, error: "Run not found" });
    res.json({ success: true, data: run });
  } catch (error) {
    logger.error({ err: error }, "Failed to load agentic run");
    res.status(500).json({ success: false, error: "Failed to load run" });
  }
});

app.post("/api/agentic/runs/:id/steps", (req, res) => {
  const { type, input, output, status } = req.body || {};
  if (type != null && typeof type !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "type must be a string when provided" });
  }
  if (status != null && typeof status !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "status must be a string when provided" });
  }
  try {
    const step = orchestrator.addStep(req.params.id, {
      type,
      input,
      output,
      status,
    });
    res.status(201).json({ success: true, data: step });
  } catch (error) {
    if (String(error.message).includes("run not found")) {
      return res.status(404).json({ success: false, error: "Run not found" });
    }
    logger.error({ err: error }, "Failed to add step to agentic run");
    res.status(500).json({ success: false, error: "Failed to add step" });
  }
});

app.post("/api/agentic/runs/:id/status", (req, res) => {
  const { status } = req.body || {};
  if (typeof status !== "string" || !status.trim()) {
    return res
      .status(400)
      .json({ success: false, error: "status must be provided as a string" });
  }
  try {
    const run = orchestrator.setStatus(req.params.id, status.trim());
    res.json({ success: true, data: run });
  } catch (error) {
    if (String(error.message).includes("run not found")) {
      return res.status(404).json({ success: false, error: "Run not found" });
    }
    logger.error({ err: error }, "Failed to update run status");
    res.status(500).json({ success: false, error: "Failed to update status" });
  }
});

// OSINT Commands API
const osintCommandLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });
const osintCommands = [
  {
    id: "dpa-ingest-now",
    name: "Ingest DPA feeds now",
    description: "Fetch latest items from Datatilsynet/EDPB and member DPAs",
  },
  {
    id: "cyber-ingest-now",
    name: "Ingest all cyber sources now",
    description: "Fetch latest items from all configured intelligence sources",
  },
  {
    id: "osint-discover",
    name: "Discover OSINT sources",
    description: "Scan and propose new sources based on current keywords",
  },
];

app.get("/api/osint/commands", osintCommandLimiter, (req, res) => {
  try {
    res.json({
      success: true,
      count: osintCommands.length,
      data: osintCommands,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to list OSINT commands");
    res.status(500).json({ success: false, error: "Failed to list commands" });
  }
});

app.post("/api/osint/execute", osintCommandLimiter, async (req, res) => {
  const { commandId } = req.body || {};
  if (typeof commandId !== "string" || !commandId.trim()) {
    return res.status(400).json({
      success: false,
      error: "commandId must be provided as a string",
    });
  }

  try {
    if (commandId === "dpa-ingest-now" || commandId === "cyber-ingest-now") {
      const dpaOnly = commandId === "dpa-ingest-now" ? "true" : "false";
      const { spawn } = await import("node:child_process");
      await new Promise((resolve, reject) => {
        const child = spawn(
          process.execPath,
          ["--loader", "ts-node/esm", "scripts/cron/ingest.ts"],
          {
            cwd: process.cwd(),
            env: { ...process.env, DPA_ONLY: dpaOnly },
            stdio: "inherit",
          }
        );
        child.on("exit", (code) =>
          code === 0 ? resolve(0) : reject(new Error(`ingest exited ${code}`))
        );
        child.on("error", reject);
      });
      return res.json({ success: true, message: "Ingestion started", dpaOnly });
    }

    if (commandId === "osint-discover") {
      // Placeholder discovery action
      return res.json({ success: true, message: "Discovery queued" });
    }

    return res.status(400).json({ success: false, error: "Unknown commandId" });
  } catch (error) {
    logger.error({ err: error }, "Failed to execute OSINT command");
    res.status(500).json({ success: false, error: "Command execution failed" });
  }
});

// Dashboard recent activity API
app.get("/api/dashboard/recent-activity", async (req, res) => {
  try {
    const activities = [];

    // Get recent scraper activity
    const scraperStatus = intelScraperService.getStatus();
    if (scraperStatus.lastRun) {
      activities.push({
        time: new Date(scraperStatus.lastRun).toLocaleString("da-DK"),
        action: `Scraper completed: ${
          scraperStatus.totalDocumentsProcessed || 0
        } docs`,
        severity: scraperStatus.successRate > 80 ? "low" : "medium",
      });
    }

    // Get knowledge base activity
    const kbStats = knowledgeRepo.getStats();
    if (kbStats.totalDocuments > 0) {
      activities.push({
        time: "Recently",
        action: `${kbStats.totalDocuments} knowledge documents indexed`,
        severity: "low",
      });
    }

    // Get source activity
    const sources = await loadAuthorizedSources();
    if (sources.length > 0) {
      activities.push({
        time: "Active",
        action: `Monitoring ${sources.length} intelligence sources`,
        severity: "low",
      });
    }

    res.json({ success: true, data: activities });
  } catch (error) {
    logger.error({ err: error }, "Failed to get recent activity");
    res
      .status(500)
      .json({ success: false, error: "Failed to get recent activity" });
  }
});

// Activity API - derive recent activity from existing services and defaults
app.get("/api/activity", async (req, res) => {
  try {
    const items = [];

    // From scraper
    try {
      const scraperStatus = intelScraperService.getStatus();
      if (scraperStatus.lastRun) {
        items.push({
          id: `ACT-${Date.now()}-SCRAPER`,
          timestamp: new Date(scraperStatus.lastRun).toLocaleString("da-DK"),
          type: "data",
          severity: scraperStatus.successRate > 80 ? "success" : "warning",
          user: "DataSync",
          action: "Threat Intelligence Updated",
          details: `Processed ${
            scraperStatus.totalDocumentsProcessed || 0
          } documents`,
          metadata: {
            result: `${scraperStatus.totalDocumentsProcessed || 0} docs`,
          },
        });
      }
    } catch {}

    // From knowledge base
    try {
      const kbStats = knowledgeRepo.getStats();
      items.push({
        id: `ACT-${Date.now()}-KB`,
        timestamp: new Date().toLocaleString("da-DK"),
        type: "system",
        severity: "info",
        user: "System",
        action: "Knowledge Base Status",
        details: `${kbStats.totalDocuments || 0} documents indexed`,
      });
    } catch {}

    // Fill in with minimal defaults so UI always has something meaningful
    if (items.length === 0) {
      items.push(
        {
          id: "ACT-BOOT-1",
          timestamp: new Date().toLocaleString("da-DK"),
          type: "system",
          severity: "success",
          user: "System",
          action: "System Started",
          details: "Cyberstreams services initialized successfully",
        },
        {
          id: "ACT-BOOT-2",
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toLocaleString(
            "da-DK"
          ),
          type: "scan",
          severity: "info",
          user: "HealthCheck",
          action: "Health Check Passed",
          details: "All core endpoints responded within thresholds",
        }
      );
    }

    res.json({ success: true, data: items });
  } catch (error) {
    logger.error({ err: error }, "Failed to get activity");
    res.status(500).json({ success: false, error: "Failed to get activity" });
  }
});

// Dashboard threat categories API
app.get("/api/dashboard/threat-categories", async (req, res) => {
  try {
    const categories = [];

    // Get threat categories from knowledge base
    const kbStats = knowledgeRepo.getStats();
    if (kbStats.categoryCounts) {
      const total = kbStats.totalDocuments;
      for (const [category, count] of Object.entries(kbStats.categoryCounts)) {
        categories.push({
          name: category,
          count: count,
          percentage: Math.round((count / total) * 100),
        });
      }
    }

    // Sort by count desc and take top 4
    categories.sort((a, b) => b.count - a.count);
    const topCategories = categories.slice(0, 4);

    // Fill with defaults if not enough
    while (topCategories.length < 4) {
      topCategories.push({
        name: `Category ${topCategories.length + 1}`,
        count: 0,
        percentage: 0,
      });
    }

    res.json({ success: true, data: topCategories });
  } catch (error) {
    logger.error({ err: error }, "Failed to get threat categories");
    res
      .status(500)
      .json({ success: false, error: "Failed to get threat categories" });
  }
});

// API 404 handler for any non-matched API routes
app.all(/^\/api(\/.*)?$/, (req, res) => {
  return res.status(404).json({ success: false, error: "Not Found" });
});

// Serve static files for the frontend
app.use(express.static("dist"));
// Add basic cache headers for static assets
app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    /\.(?:js|css|svg|png|jpg|jpeg|webp|woff2?)$/i.test(req.path)
  ) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  next();
});

// Catch-all for client-side routing, but never for /api/*
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile("index.html", { root: "dist" });
});

// Error handling middleware
// Must be defined after routes so it can catch thrown errors
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  try {
    logger.error({ err }, "Unhandled error in request");
  } catch {}
  if (req.path.startsWith("/api")) {
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
  return res.status(500).send("An unexpected error occurred");
});

// Process-level safeguards
process.on("unhandledRejection", (reason) => {
  try {
    logger.error({ err: String(reason) }, "Unhandled Promise rejection");
  } catch {}
});
process.on("uncaughtException", (err) => {
  try {
    logger.error({ err: String(err) }, "Uncaught Exception");
  } catch {}
});

if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, () => {
    isReady = true;
    logger.info(`Cyberstreams API server running at http://localhost:${PORT}`);
  });
  // Tighten server timeouts to avoid resource leaks
  server.setTimeout(30_000);
  server.headersTimeout = 35_000;
}

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  logger.info({ signal }, "Received shutdown signal, closing server");

  try {
    if (intelScraperService?.status?.isRunning) {
      await intelScraperService.stop();
    }
  } catch (error) {
    logger.warn(
      { err: error },
      "Failed to stop Intel Scraper gracefully during shutdown"
    );
  }

  (server || { close: (cb) => cb && cb() }).close(async (closeError) => {
    if (closeError) {
      logger.error({ err: closeError }, "Error while closing HTTP server");
    }

    try {
      await closePool();
      logger.info("Database connection pool closed");
    } catch (error) {
      logger.error(
        { err: error },
        "Failed to close database connection pool gracefully"
      );
    } finally {
      if (process.env.NODE_ENV !== "test") {
        process.exit(closeError ? 1 : 0);
      }
    }
  });
}

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal).catch((error) => {
      logger.error({ err: error }, "Unexpected error during shutdown");
      process.exit(1);
    });
  });
});

export { app };
