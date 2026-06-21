import dotenv from "dotenv";
import path from "path";

const nodeEnv = process.env.NODE_ENV ?? "development";
dotenv.config({ path: path.join(process.cwd(), `.env.${nodeEnv}`) });

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optionalNumber = (key: string, fallback: number): number => {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const placeholderKeyMarkers = ["your-openai-api-key", "sk-your", "changeme"];

const resolveOpenAiKey = (): string | null => {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || !key.startsWith("sk-")) return null;
  if (placeholderKeyMarkers.some((marker) => key.includes(marker))) return null;
  return key;
};

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
  port: optionalNumber("PORT", 8000),
  databaseUrl: required("DATABASE_URL"),
  frontendBaseUrl: process.env.FE_BASE_URL ?? "http://localhost:5173",
  openai: {
    apiKey: resolveOpenAiKey(),
    baseURL: process.env.LLM_BASE_URL?.trim() || undefined,
    model: process.env.LLM_MODEL ?? "gpt-4.1-mini",
    maxTokens: optionalNumber("LLM_MAX_TOKENS", 600),
    timeoutMs: optionalNumber("LLM_TIMEOUT_MS", 15000),
  },
  chatRateLimitMax: optionalNumber("CHAT_RATE_LIMIT_MAX", 20),
} as const;
