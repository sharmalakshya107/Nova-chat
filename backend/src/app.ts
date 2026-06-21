import bodyParser from "body-parser";
import cors, { type CorsOptions } from "cors";
import express, { type Express, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "@config/env";
import routes from "@/routes";
import { errorHandler } from "@shared/middlewares/error-handler.middleware";
import { globalRateLimiter } from "@shared/middlewares/rate-limit.middleware";

const buildAllowedOrigins = (): string[] => {
  const origins = new Set<string>([env.frontendBaseUrl]);
  if (!env.isProduction) {
    origins.add("http://localhost:5173");
    origins.add("http://localhost:4173");
  }
  return [...origins];
};

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    const allowed = buildAllowedOrigins();
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
};

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  if (!env.isTest) {
    app.use(morgan("dev"));
  }
  app.use(globalRateLimiter);

  app.use("/api", routes);

  app.get("/", (_req: Request, res: Response) => {
    res.send({ status: "ok" });
  });

  app.use(errorHandler);

  return app;
};
