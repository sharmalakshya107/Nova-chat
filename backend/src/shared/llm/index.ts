import { env } from "@config/env";
import { createOpenAiProvider } from "./openai.provider";
import { type LlmProvider } from "./llm.types";

let cachedProvider: LlmProvider | null = null;

export const resolveLlmProvider = (): LlmProvider | null => {
  if (!env.openai.apiKey) return null;

  cachedProvider ??= createOpenAiProvider({
    apiKey: env.openai.apiKey,
    baseURL: env.openai.baseURL,
    model: env.openai.model,
    maxTokens: env.openai.maxTokens,
    timeoutMs: env.openai.timeoutMs,
  });

  return cachedProvider;
};

export const isLlmAvailable = (): boolean => resolveLlmProvider() !== null;
