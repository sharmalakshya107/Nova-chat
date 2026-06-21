import { browser } from "$app/environment";
import { chatService } from "$lib/features/chat/services/chat.service";
import type { ChatMessage } from "$lib/features/chat/types/chat.types";

const SESSION_KEY = "chat_session_id";

function createLocalMessage(
  sender: "user" | "assistant",
  content: string,
  sessionId: string
): ChatMessage {
  return {
    id: `local-${sender}-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    conversationId: sessionId,
    sender,
    content,
    createdAt: new Date().toISOString(),
  };
}

export class ChatStore {
  messages = $state<ChatMessage[]>([]);
  isLoading = $state(false);
  error = $state<string | null>(null);
  degraded = $state(false);
  isInitializing = $state(false);

  #sessionId = $state<string | null>(null);
  #historyLoaded = false;

  constructor() {
    if (browser) {
      this.#sessionId = localStorage.getItem(SESSION_KEY);
      this.isInitializing = this.#sessionId !== null;
    }
  }

  get sessionId(): string | null {
    return this.#sessionId;
  }

  set sessionId(value: string | null) {
    this.#sessionId = value;
    if (!browser) return;
    if (value) localStorage.setItem(SESSION_KEY, value);
    else localStorage.removeItem(SESSION_KEY);
  }

  get hasMessages(): boolean {
    return this.messages.length > 0;
  }

  async loadHistory(): Promise<void> {
    if (this.#historyLoaded) return;
    this.#historyLoaded = true;

    if (!this.sessionId) {
      this.isInitializing = false;
      return;
    }
    try {
      const response = await chatService.getHistory(this.sessionId);
      if (this.messages.length === 0) {
        this.messages = response.data.messages;
      }
    } catch {
      this.sessionId = null;
    } finally {
      this.isInitializing = false;
    }
  }

  async sendMessage(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || this.isLoading) return;

    const optimistic = createLocalMessage("user", trimmed, this.sessionId ?? "");
    this.messages = [...this.messages, optimistic];
    this.isLoading = true;
    this.error = null;

    let assistantId: string | null = null;
    let receivedToken = false;

    const appendToAssistant = (value: string): void => {
      if (!assistantId) {
        const created = createLocalMessage("assistant", value, this.sessionId ?? "");
        assistantId = created.id;
        this.messages = [...this.messages, created];
        return;
      }
      this.messages = this.messages.map((m) =>
        m.id === assistantId ? { ...m, content: m.content + value } : m
      );
    };

    try {
      for await (const event of chatService.streamMessage(
        trimmed,
        this.sessionId
      )) {
        if (event.type === "session") {
          this.sessionId = event.sessionId;
        } else if (event.type === "token") {
          receivedToken = true;
          this.isLoading = false;
          appendToAssistant(event.value);
        } else if (event.type === "done") {
          this.degraded = event.degraded;
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }

      if (!receivedToken) {
        throw new Error("The assistant didn't respond. Please try again.");
      }
    } catch (error: unknown) {
      this.error =
        error instanceof Error ? error.message : "Failed to send message";
      this.messages = this.messages.filter(
        (m) => m.id !== optimistic.id && m.id !== assistantId
      );
    } finally {
      this.isLoading = false;
    }
  }

  retryLast(): void {
    const lastUser = [...this.messages].reverse().find((m) => m.sender === "user");
    this.error = null;
    if (lastUser) void this.sendMessage(lastUser.content);
  }

  reset(): void {
    this.messages = [];
    this.error = null;
    this.degraded = false;
    this.sessionId = null;
  }

  clearError(): void {
    this.error = null;
  }
}

export const chatStore = new ChatStore();
