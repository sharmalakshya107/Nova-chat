import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_MESSAGE_LENGTH } from "@config/constants";

const sendMessage = vi.fn();

vi.mock("@config/env", () => ({
  env: {
    nodeEnv: "test",
    isProduction: false,
    isTest: true,
    port: 8000,
    databaseUrl: "postgresql://localhost:5432/test",
    frontendBaseUrl: "http://localhost:5173",
    openai: { apiKey: null, model: "test", maxTokens: 600, timeoutMs: 15000 },
    chatRateLimitMax: 1000,
  },
}));

vi.mock("@modules/chat/chat.service", () => ({
  sendMessage: (...args: unknown[]) => sendMessage(...args),
  getConversationHistory: vi.fn(),
}));

import { createApp } from "@/app";

const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
  sendMessage.mockResolvedValue({
    reply: "Hi there!",
    sessionId: "abc",
    degraded: true,
  });
});

describe("POST /api/chat/message validation", () => {
  it("accepts a first message with sessionId: null (browser default)", async () => {
    const res = await request(app)
      .post("/api/chat/message")
      .send({ message: "hi", sessionId: null });

    expect(res.status).toBe(200);
    expect(sendMessage).toHaveBeenCalledWith("hi", null);
  });

  it("accepts a message with sessionId omitted entirely", async () => {
    const res = await request(app).post("/api/chat/message").send({ message: "hi" });
    expect(res.status).toBe(200);
  });

  it("accepts a message with a valid string sessionId", async () => {
    const res = await request(app)
      .post("/api/chat/message")
      .send({ message: "hi", sessionId: "session-123" });
    expect(res.status).toBe(200);
    expect(sendMessage).toHaveBeenCalledWith("hi", "session-123");
  });

  it("rejects an empty message", async () => {
    const res = await request(app).post("/api/chat/message").send({ message: "" });
    expect(res.status).toBe(400);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("rejects a message over the length limit", async () => {
    const res = await request(app)
      .post("/api/chat/message")
      .send({ message: "x".repeat(MAX_MESSAGE_LENGTH + 1) });
    expect(res.status).toBe(400);
  });

  it("rejects a non-string sessionId", async () => {
    const res = await request(app)
      .post("/api/chat/message")
      .send({ message: "hi", sessionId: 42 });
    expect(res.status).toBe(400);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("rejects unexpected extra fields", async () => {
    const res = await request(app)
      .post("/api/chat/message")
      .send({ message: "hi", role: "admin" });
    expect(res.status).toBe(400);
  });
});
