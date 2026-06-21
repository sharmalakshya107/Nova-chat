import { describe, expect, it } from "vitest";
import { buildChatMessages } from "./chat.prompt";

describe("buildChatMessages", () => {
  const context = "Q: Do you ship?\nA: Yes, in 3 to 5 days.";

  it("starts with a grounded system prompt", () => {
    const messages = buildChatMessages(context, [], "Do you ship?");
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("Nova Gear");
    expect(messages[0].content).toContain(context);
  });

  it("places the user message last", () => {
    const messages = buildChatMessages(context, [], "Do you ship?");
    const last = messages[messages.length - 1];
    expect(last.role).toBe("user");
    expect(last.content).toBe("Do you ship?");
  });

  it("includes prior history between system and user message", () => {
    const history = [
      { role: "user" as const, content: "Hi" },
      { role: "assistant" as const, content: "Hello, how can I help?" },
    ];
    const messages = buildChatMessages(context, history, "Do you ship?");
    expect(messages).toHaveLength(4);
    expect(messages[1].content).toBe("Hi");
    expect(messages[2].content).toBe("Hello, how can I help?");
  });

  it("trims history to the most recent turns", () => {
    const history = Array.from({ length: 20 }, (_, index) => ({
      role: "user" as const,
      content: `message ${index}`,
    }));
    const messages = buildChatMessages(context, history, "latest");
    expect(messages.length).toBeLessThanOrEqual(12);
    expect(messages[messages.length - 1].content).toBe("latest");
  });
});
