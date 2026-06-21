export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

export type LlmReply =
  | { status: "ok"; reply: string }
  | { status: "timeout" }
  | { status: "unavailable" };

export type LlmStreamChunk =
  | { type: "token"; value: string }
  | { type: "done" }
  | { type: "timeout" }
  | { type: "error" };

export interface LlmProvider {
  readonly name: string;
  generateReply(messages: ChatTurn[]): Promise<LlmReply>;
  streamReply(messages: ChatTurn[]): AsyncGenerator<LlmStreamChunk>;
}
