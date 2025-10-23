import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const ConfigSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  // Security and server middleware
  CORS_ORIGIN: z.string().default("*"),
  ENABLE_SECURITY_HEADERS: z
    .union([z.literal("true"), z.literal("false")])
    .default("true"),
  ENABLE_RATE_LIMITING: z
    .union([z.literal("true"), z.literal("false")])
    .default("true"),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(100),
  JSON_BODY_LIMIT: z.string().default("1mb"),
  TRUST_PROXY: z.union([z.literal("true"), z.literal("false")]).default("true"),

  // DB
  DATABASE_URL: z.string().url().optional().or(z.literal("")).optional(),
  POSTGRES_HOST: z.string().default("localhost"),
  POSTGRES_PORT: z.coerce.number().int().default(5432),
  POSTGRES_DB: z.string().optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_SSL: z
    .union([z.literal("true"), z.literal("false")])
    .default("false"),
  POSTGRES_SSL_REJECT_UNAUTHORIZED: z
    .union([z.literal("true"), z.literal("false")])
    .default("true"),

  // Feature flags
  AUTO_START_INTEL_SCRAPER: z
    .union([z.literal("true"), z.literal("false")])
    .default("true"),
  AUTO_SEED_SOURCES: z
    .union([z.literal("true"), z.literal("false")])
    .default("true"),

  // Integrations (optional at startup)
  MISP_BASE_URL: z.string().optional(),
  MISP_API_KEY: z.string().optional(),
  MISP_VERIFY_TLS: z
    .union([z.literal("true"), z.literal("false")])
    .default("true"),

  OPENCTI_API_URL: z.string().optional(),
  OPENCTI_TOKEN: z.string().optional(),
  OPENCTI_PUBLIC_URL: z.string().optional(),

  VECTOR_DB_URL: z.string().optional(),
  VECTOR_DB_API_KEY: z.string().optional(),

  // Ollama (optional, for local LLM)
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OLLAMA_CHAT_MODEL: z.string().default("llama3.1:8b"),
  OLLAMA_EMBED_MODEL: z.string().default("nomic-embed-text"),

  // Wigle WiFi & Google Maps Integration
  WIGLE_API_KEY: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
});

let cachedConfig = null;

export function loadConfig() {
  if (cachedConfig) return cachedConfig;
  const parsed = ConfigSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues?.map(
      (i) => `${i.path.join(".")}: ${i.message}`
    );
    throw new Error(`Invalid configuration: ${issues?.join(", ")}`);
  }
  cachedConfig = parsed.data;
  return cachedConfig;
}

export default loadConfig;
