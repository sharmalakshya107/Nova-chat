import type {
  ApiResponse,
  ConversationHistory,
  SendMessageResult,
  StreamEvent,
} from "$lib/features/chat/types/chat.types";
import { httpClient } from "$lib/shared/services/http.service";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const chatService = {
  sendMessage(message: string, sessionId: string | null) {
    return httpClient.post<ApiResponse<SendMessageResult>>("/chat/message", {
      message,
      sessionId,
    });
  },

  getHistory(sessionId: string) {
    return httpClient.get<ApiResponse<ConversationHistory>>(
      `/chat/history/${sessionId}`
    );
  },

  async *streamMessage(
    message: string,
    sessionId: string | null,
    signal?: AbortSignal
  ): AsyncGenerator<StreamEvent> {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/chat/message/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
        signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new Error(
        "Can't reach the server. Please check your connection and try again."
      );
    }

    if (response.status === 429) {
      throw new Error("You're sending messages too quickly. Please wait a moment and try again.");
    }
    if (response.status >= 500) {
      throw new Error("The server ran into a problem. Please try again in a moment.");
    }
    if (!response.ok || !response.body) {
      throw new Error("Unable to reach the assistant. Please try again.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const line = frame.trim();
        if (!line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (!json) continue;
        yield JSON.parse(json) as StreamEvent;
      }
    }
  },
};
