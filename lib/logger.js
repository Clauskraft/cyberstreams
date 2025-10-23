import pino from "pino";

const level =
  process.env.INGESTION_LOG_LEVEL || process.env.LOG_LEVEL || "info";

export const logger = pino({
  level,
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            translateTime: "SYS:standard",
            colorize: true,
          },
        }
      : undefined,
});

export function createChildLogger(bindings = {}) {
  try {
    return logger.child(bindings);
  } catch {
    return logger;
  }
}

export default logger;
