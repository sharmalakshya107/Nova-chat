import http from "http";
import { env } from "@config/env";
import { createApp } from "@/app";
import { isLlmAvailable } from "@shared/llm";
import {
  connectDatabase,
  disconnectDatabase,
} from "@shared/services/prisma.service";
import { logger } from "@shared/utils/logger";

const registerShutdown = (server: http.Server): void => {
  const shutdown = (signal: string): void => {
    logger.info("Shutting down", { signal });
    server.close(() => {
      void disconnectDatabase().then(() => process.exit(0));
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

const start = (): void => {
  const server = http.createServer(createApp());

  server.listen(env.port, () => {
    logger.info("Server started", {
      port: env.port,
      env: env.nodeEnv,
      assistant: isLlmAvailable() ? "live" : "offline",
    });
    if (!isLlmAvailable()) {
      logger.warn(
        "No LLM provider configured. Running in offline mode; set OPENAI_API_KEY to enable the live assistant."
      );
    }
  });

  registerShutdown(server);

  connectDatabase().catch((error: unknown) => {
    logger.error("Database connection failed at startup", {
      error: error instanceof Error ? error.message : String(error),
    });
  });
};

start();
