import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StreamEvent } from "$lib/features/chat/types/chat.types";

const streamMessage = vi.fn();
const getHistory = vi.fn();

vi.mock("$lib/features/chat/services/chat.service", () => ({
  chatService: {
    streamMessage: (...args: unknown[]) => streamMessage(...args),
    getHistory: (...args: unknown[]) => getHistory(...args),
  },
}));

import { ChatStore } from "./chat.store.svelte";

async function* events(list: StreamEvent[]) {
  for (const event of list) yield event;
}

const okStream = (reply: string, degraded = false): StreamEvent[] => [
  { type: "session", sessionId: "sess-1" },
  ...reply.split(" ").map((w, i) => ({
    type: "token" as const,
    value: i === 0 ? w : ` ${w}`,
  })),
  { type: "done", degraded },
];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("ChatStore.sendMessage (streaming)", () => {
  it("adds the user message optimistically and streams the assistant reply", async () => {
    streamMessage.mockReturnValue(events(okStream("Hello there friend")));
    const store = new ChatStore();

    await store.sendMessage("hi");

    expect(store.messages).toHaveLength(2);
    expect(store.messages[0]).toMatchObject({ sender: "user", content: "hi" });
    expect(store.messages[1]).toMatchObject({
      sender: "assistant",
      content: "Hello there friend",
    });
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeNull();
  });

  it("rebuilds the assistant message immutably on each token (Svelte reactivity)", async () => {
    streamMessage.mockReturnValue(events(okStream("one two three")));
    const store = new ChatStore();

    await store.sendMessage("hi");

    const assistant = store.messages.find((m) => m.sender === "assistant");
    expect(assistant?.content).toBe("one two three");
  });
  it("persists the sessionId from the stream to localStorage", async () => {
    streamMessage.mockReturnValue(events(okStream("ok")));
    const store = new ChatStore();

    await store.sendMessage("hi");

    expect(store.sessionId).toBe("sess-1");
    expect(localStorage.getItem("chat_session_id")).toBe("sess-1");
  });

  it("sets the degraded flag when the stream reports offline mode", async () => {
    streamMessage.mockReturnValue(events(okStream("from the FAQ", true)));
    const store = new ChatStore();

    await store.sendMessage("returns?");

    expect(store.degraded).toBe(true);
  });

  it("rolls back the optimistic message and surfaces the error on stream failure", async () => {
    streamMessage.mockReturnValue(
      events([
        { type: "session", sessionId: "sess-1" },
        { type: "error", message: "Assistant is unavailable" },
      ])
    );
    const store = new ChatStore();

    await store.sendMessage("hi");

    expect(store.messages).toHaveLength(0);
    expect(store.error).toBe("Assistant is unavailable");
    expect(store.isLoading).toBe(false);
  });

  it("ignores empty input and does not call the service", async () => {
    const store = new ChatStore();
    await store.sendMessage("   ");
    expect(streamMessage).not.toHaveBeenCalled();
    expect(store.messages).toHaveLength(0);
  });
});

describe("ChatStore.reset", () => {
  it("clears messages, error, degraded, and the persisted session", async () => {
    streamMessage.mockReturnValue(events(okStream("hello")));
    const store = new ChatStore();
    await store.sendMessage("hi");
    expect(localStorage.getItem("chat_session_id")).toBe("sess-1");

    store.reset();

    expect(store.messages).toHaveLength(0);
    expect(store.sessionId).toBeNull();
    expect(store.degraded).toBe(false);
    expect(localStorage.getItem("chat_session_id")).toBeNull();
  });
});

describe("ChatStore.loadHistory", () => {
  it("loads stored messages for an existing session", async () => {
    localStorage.setItem("chat_session_id", "sess-9");
    getHistory.mockResolvedValue({
      data: { messages: [{ id: "m1", sender: "user", content: "hey" }] },
    });
    const store = new ChatStore();

    await store.loadHistory();

    expect(store.messages).toHaveLength(1);
    expect(getHistory).toHaveBeenCalledWith("sess-9");
  });

  it("clears a stale session when history fetch fails", async () => {
    localStorage.setItem("chat_session_id", "bad");
    getHistory.mockRejectedValue(new Error("404"));
    const store = new ChatStore();

    await store.loadHistory();

    expect(store.sessionId).toBeNull();
  });
});
