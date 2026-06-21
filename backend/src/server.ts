import http from "http";
import { env } from "@config/env";
import { createApp } from "@/app";
import { isLlmAvailable } from "@shared/llm";
import {
  connectDatabase,
  disconnectDatabase,
} from "@shared/services/prisma.service";
import { logger } from "@shared/utils/logger";

console.log(`[BOOT] server.ts loaded | PORT=${process.env.PORT ?? "(unset)"}`);

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
  try {
    console.log("[BOOT] start() called, building app...");
    const app = createApp();
    console.log("[BOOT] app built, creating http server...");
    const server = http.createServer(app);

    server.on("error", (error) => {
      console.error("[BOOT] server 'error' event:", error);
    });

    console.log(`[BOOT] calling listen on 0.0.0.0:${env.port}...`);
    server.listen(env.port, "0.0.0.0", () => {
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
  } catch (error) {
    console.error("[BOOT] fatal error during start():", error);
    process.exit(1);
  }
};

process.on("uncaughtException", (error) => {
  console.error("[BOOT] uncaughtException:", error);
});
process.on("unhandledRejection", (reason) => {
  console.error("[BOOT] unhandledRejection:", reason);
});

start();
