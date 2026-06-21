export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type Sender = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: Sender;
  content: string;
  createdAt: string;
}

export interface SendMessageResult {
  reply: string;
  sessionId: string;
  degraded: boolean;
}

export interface ConversationHistory {
  messages: ChatMessage[];
  sessionId: string;
}

export type StreamEvent =
  | { type: "session"; sessionId: string }
  | { type: "token"; value: string }
  | { type: "done"; degraded: boolean }
  | { type: "error"; message: string };
