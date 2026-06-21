import { type Message } from "@prisma/client";

export interface SendMessageInput {
  message: string;
  sessionId?: string;
}

export interface SendMessageResult {
  reply: string;
  sessionId: string;
  degraded: boolean;
}

export interface ConversationHistory {
  messages: Message[];
  sessionId: string;
}

export type StreamEvent =
  | { type: "session"; sessionId: string }
  | { type: "token"; value: string }
  | { type: "done"; degraded: boolean }
  | { type: "error"; message: string };
