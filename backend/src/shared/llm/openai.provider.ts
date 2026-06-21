import OpenAI from "openai";
import { logger, toErrorMessage } from "@shared/utils/logger";
import {
  type ChatTurn,
  type LlmProvider,
  type LlmReply,
  type LlmStreamChunk,
} from "./llm.types";

interface OpenAiProviderConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  timeoutMs: number;
  baseURL?: string;
}

const isAbortError = (error: unknown): boolean =>
  error instanceof OpenAI.APIUserAbortError ||
  (error instanceof Error && error.name === "AbortError");

const isRetryableError = (error: unknown): boolean => {
  if (error instanceof OpenAI.APIConnectionError) return true;
  if (error instanceof OpenAI.APIError && typeof error.status === "number") {
    return error.status === 429 || error.status >= 500;
  }
  return false;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const createOpenAiProvider = (
  config: OpenAiProviderConfig
): LlmProvider => {
  const client = new OpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  });

  const requestOnce = async (messages: ChatTurn[]): Promise<string | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const completion = await client.chat.completions.create(
        {
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: 0.3,
          messages,
        },
        { signal: controller.signal }
      );
      return completion.choices[0]?.message?.content?.trim() ?? null;
    } finally {
      clearTimeout(timer);
    }
  };

  const generateReply = async (messages: ChatTurn[]): Promise<LlmReply> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const reply = await requestOnce(messages);
        if (reply) return { status: "ok", reply };
        logger.warn("LLM returned an empty completion", { provider: "openai" });
        return { status: "unavailable" };
      } catch (error) {
        if (isAbortError(error)) {
          logger.warn("LLM request timed out", {
            provider: "openai",
            timeoutMs: config.timeoutMs,
            attempt,
          });
          return { status: "timeout" };
        }
        const retryable = isRetryableError(error);
        logger.warn("LLM request failed", {
          provider: "openai",
          error: toErrorMessage(error),
          attempt,
          retryable,
        });
        if (retryable && attempt === 0) {
          await delay(300);
          continue;
        }
        return { status: "unavailable" };
      }
    }
    return { status: "unavailable" };
  };

  async function* streamReply(
    messages: ChatTurn[]
  ): AsyncGenerator<LlmStreamChunk> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    let produced = false;
    try {
      const stream = await client.chat.completions.create(
        {
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: 0.3,
          messages,
          stream: true,
        },
        { signal: controller.signal }
      );

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content;
        if (token) {
          produced = true;
          yield { type: "token", value: token };
        }
      }
      yield { type: "done" };
    } catch (error) {
      if (isAbortError(error)) {
        logger.warn("LLM stream timed out", {
          provider: "openai",
          timeoutMs: config.timeoutMs,
        });
        yield produced ? { type: "done" } : { type: "timeout" };
        return;
      }
      logger.warn("LLM stream failed", {
        provider: "openai",
        error: toErrorMessage(error),
      });
      yield produced ? { type: "done" } : { type: "error" };
    } finally {
      clearTimeout(timer);
    }
  }

  return { name: "openai", generateReply, streamReply };
};
