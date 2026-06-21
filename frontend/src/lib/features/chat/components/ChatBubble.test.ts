import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import type { ChatMessage } from "$lib/features/chat/types/chat.types";
import ChatBubble from "./ChatBubble.svelte";

const makeMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "1",
  conversationId: "c1",
  sender: "user",
  content: "Hello there",
  createdAt: "2026-06-21T10:30:00.000Z",
  ...overrides,
});

describe("ChatBubble", () => {
  it("renders the message content", () => {
    render(ChatBubble, {
      message: makeMessage({ content: "What is your return policy?" }),
    });
    expect(screen.getByText("What is your return policy?")).toBeInTheDocument();
  });

  it("renders the agent avatar only for assistant messages", () => {
    const { container, unmount } = render(ChatBubble, {
      message: makeMessage({ sender: "assistant" }),
    });
    expect(container.querySelector('[aria-label="AI agent"]')).toBeInTheDocument();
    unmount();

    const { container: userContainer } = render(ChatBubble, {
      message: makeMessage({ sender: "user" }),
    });
    expect(
      userContainer.querySelector('[aria-label="AI agent"]')
    ).not.toBeInTheDocument();
  });

  it("escapes HTML to prevent XSS injection", () => {
    const { container } = render(ChatBubble, {
      message: makeMessage({ content: "<script>alert('xss')</script>" }),
    });
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("alert('xss')");
  });

  it("renders **bold** markdown as a <strong> element", () => {
    const { container } = render(ChatBubble, {
      message: makeMessage({ content: "This is **important**" }),
    });
    const strong = container.querySelector("strong");
    expect(strong).toBeInTheDocument();
    expect(strong?.textContent).toBe("important");
  });
});
