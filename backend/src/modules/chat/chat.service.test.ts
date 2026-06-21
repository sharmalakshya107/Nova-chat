import { beforeEach, describe, expect, it, vi } from "vitest";

const conversation = { id: "clxabc123def456ghi789jkl0" };
const findUnique = vi.fn();
const create = vi.fn();
const findMany = vi.fn();
const messageCreate = vi.fn();
const transaction = vi.fn();
const generateReply = vi.fn();
const streamReply = vi.fn();
const resolveLlmProvider = vi.fn();

vi.mock("@shared/services/prisma.service", () => ({
  prisma: {
    conversation: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      create: (...args: unknown[]) => create(...args),
    },
    message: {
      findMany: (...args: unknown[]) => findMany(...args),
      create: (...args: unknown[]) => messageCreate(...args),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

vi.mock("@shared/llm", () => ({
  resolveLlmProvider: () => resolveLlmProvider(),
}));

import { getConversationHistory, sendMessage, streamMessage } from "./chat.service";

const useOfflineMode = (): void => {
  resolveLlmProvider.mockReturnValue(null);
};
const useLiveMode = (): void => {
  resolveLlmProvider.mockReturnValue({
    name: "test",
    generateReply,
    streamReply,
  });
};

async function* fromChunks(
  chunks: Array<{ type: string; value?: string }>
) {
  for (const chunk of chunks) yield chunk;
}

const collect = async (
  gen: AsyncGenerator<{ type: string; value?: string; message?: string }>
) => {
  const events = [];
  for await (const event of gen) events.push(event);
  return events;
};

const lastOf = <T,>(items: T[]): T => items[items.length - 1];

beforeEach(() => {
  vi.clearAllMocks();
  create.mockResolvedValue(conversation);
  findUnique.mockResolvedValue(null);
  findMany.mockResolvedValue([]);
  messageCreate.mockResolvedValue({});
  transaction.mockResolvedValue([{}, {}]);
});

describe("sendMessage in offline mode", () => {
  beforeEach(useOfflineMode);

  it("answers from the knowledge base and flags the reply as degraded", async () => {
    const result = await sendMessage("What is your return policy?");
    expect(result.degraded).toBe(true);
    expect(result.reply.toLowerCase()).toContain("return");
    expect(result.sessionId).toBe(conversation.id);
    expect(generateReply).not.toHaveBeenCalled();
  });

  it("persists both messages atomically in a single transaction", async () => {
    await sendMessage("How long does shipping take?");
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(messageCreate).toHaveBeenCalledTimes(2);
  });

  it("welcomes a greeting instead of the email fallback", async () => {
    const result = await sendMessage("hi");
    expect(result.degraded).toBe(true);
    expect(result.reply.toLowerCase()).toContain("support assistant");
    expect(result.reply.toLowerCase()).not.toContain("not sure");
  });

  it("treats varied greetings as greetings", async () => {
    for (const greeting of ["Hello!", "hey there", "good morning"]) {
      const result = await sendMessage(greeting);
      expect(result.reply.toLowerCase()).toContain("help");
      expect(result.reply.toLowerCase()).not.toContain("not sure");
    }
  });

  it("acknowledges a thank-you message", async () => {
    const result = await sendMessage("thanks!");
    expect(result.reply.toLowerCase()).toContain("welcome");
  });

  it("answers a 'do you sell…' question from the product catalog", async () => {
    const result = await sendMessage("what do you sell?");
    expect(result.reply.toLowerCase()).toContain("nova gear");
    expect(result.reply.toLowerCase()).not.toContain("not sure");
  });

  it("gives a helpful capabilities reply for a genuinely unmatched question", async () => {
    const result = await sendMessage("what is the meaning of life");
    expect(result.reply.toLowerCase()).toContain("shipping");
    expect(result.reply.toLowerCase()).toContain("returns");
  });

  it("still answers a real question even when prefixed with a greeting", async () => {
    const result = await sendMessage("hi, how do I track my order?");
    expect(result.reply.toLowerCase()).toContain("tracking");
    expect(result.reply.toLowerCase()).not.toContain("support assistant");
  });
});

describe("sendMessage in live mode", () => {
  beforeEach(useLiveMode);

  it("returns the provider reply when the completion succeeds", async () => {
    generateReply.mockResolvedValue({ status: "ok", reply: "Sure!" });
    const result = await sendMessage("Hi");
    expect(result.degraded).toBe(false);
    expect(result.reply).toBe("Sure!");
  });

  it("throws a 503 and persists nothing when the provider is unavailable", async () => {
    generateReply.mockResolvedValue({ status: "unavailable" });
    await expect(sendMessage("Hi")).rejects.toMatchObject({ status: 503 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("reuses an existing conversation when given a known sessionId", async () => {
    generateReply.mockResolvedValue({ status: "ok", reply: "ok" });
    findUnique.mockResolvedValue(conversation);
    await sendMessage("Hi", conversation.id);
    expect(create).not.toHaveBeenCalled();
  });

  it("starts a fresh conversation when the sessionId is unknown", async () => {
    generateReply.mockResolvedValue({ status: "ok", reply: "ok" });
    findUnique.mockResolvedValue(null);
    await sendMessage("Hi", "unknown-session-id");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("seeds the new conversation title from the first message", async () => {
    generateReply.mockResolvedValue({ status: "ok", reply: "ok" });
    await sendMessage("How long does international shipping take?");
    expect(create).toHaveBeenCalledWith({
      data: { title: "How long does international shipping take?" },
    });
  });

  it("truncates a long first message into the title", async () => {
    generateReply.mockResolvedValue({ status: "ok", reply: "ok" });
    await sendMessage("x".repeat(200));
    const titleArg = create.mock.calls[0][0].data.title as string;
    expect(titleArg.length).toBeLessThanOrEqual(60);
    expect(titleArg.endsWith("…")).toBe(true);
  });
});

describe("sendMessage moderation", () => {
  beforeEach(useLiveMode);

  it("returns a safe decline and skips the main reply when flagged as abusive", async () => {
    // First generateReply call is the safety classifier → BLOCK.
    generateReply.mockResolvedValueOnce({ status: "ok", reply: "BLOCK" });

    const result = await sendMessage("an abusive message");

    expect(result.reply.toLowerCase()).toContain("respectful");
    expect(result.degraded).toBe(false);
    // Classifier ran once; the main support completion was never requested.
    expect(generateReply).toHaveBeenCalledTimes(1);
  });

  it("lets a normal message through when the classifier says SAFE", async () => {
    generateReply
      .mockResolvedValueOnce({ status: "ok", reply: "SAFE" })
      .mockResolvedValueOnce({ status: "ok", reply: "Happy to help!" });

    const result = await sendMessage("what is your return policy?");

    expect(result.reply).toBe("Happy to help!");
    expect(generateReply).toHaveBeenCalledTimes(2);
  });

  it("fails open and answers normally when the classifier itself errors", async () => {
    generateReply
      .mockRejectedValueOnce(new Error("classifier down"))
      .mockResolvedValueOnce({ status: "ok", reply: "Still answering." });

    const result = await sendMessage("a normal question");

    expect(result.reply).toBe("Still answering.");
  });
});

describe("streamMessage", () => {
  it("offline: emits a session event, streams tokens, and persists once", async () => {
    useOfflineMode();
    const events = await collect(streamMessage("What is your return policy?"));

    expect(events[0]).toEqual({ type: "session", sessionId: conversation.id });
    const tokens = events.filter((e) => e.type === "token");
    expect(tokens.length).toBeGreaterThan(0);
    expect(lastOf(events)).toEqual({ type: "done", degraded: true });

    const streamed = tokens.map((e) => e.value).join("");
    expect(streamed.toLowerCase()).toContain("return");
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("live: concatenates tokens and persists the full reply", async () => {
    useLiveMode();
    streamReply.mockReturnValue(
      fromChunks([
        { type: "token", value: "Hello" },
        { type: "token", value: " there" },
        { type: "done" },
      ])
    );

    const events = await collect(streamMessage("hi"));
    const streamed = events
      .filter((e) => e.type === "token")
      .map((e) => e.value)
      .join("");

    expect(streamed).toBe("Hello there");
    expect(lastOf(events)).toEqual({ type: "done", degraded: false });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("live: surfaces an error and persists nothing when the stream fails early", async () => {
    useLiveMode();
    streamReply.mockReturnValue(fromChunks([{ type: "error" }]));

    const events = await collect(streamMessage("hi"));
    expect(lastOf(events)?.type).toBe("error");
    expect(transaction).not.toHaveBeenCalled();
  });
});

describe("getConversationHistory", () => {
  it("returns an empty list when the conversation has no messages", async () => {
    findMany.mockResolvedValue([]);
    const result = await getConversationHistory("unknown-session-id");
    expect(result.messages).toEqual([]);
  });

  it("returns stored messages for a known sessionId", async () => {
    const stored = [{ id: "m1" }];
    findMany.mockResolvedValue(stored);
    const result = await getConversationHistory(conversation.id);
    expect(result.messages).toBe(stored);
  });
});
