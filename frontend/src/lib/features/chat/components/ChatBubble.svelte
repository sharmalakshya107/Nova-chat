<script lang="ts">
  import type { ChatMessage } from "$lib/features/chat/types/chat.types";

  let { message }: { message: ChatMessage } = $props();

  const isUser = $derived(message.sender === "user");

  const formattedTime = $derived(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(message.createdAt))
  );

  function renderContent(content: string): string {
    return content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }
</script>

<div class="bubble-wrapper" class:user={isUser} class:ai={!isUser} data-id={message.id}>
  {#if !isUser}
    <div class="avatar" aria-label="AI agent">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="4" y="8" width="16" height="11" rx="3" />
        <path d="M12 8V4M9 3h6" />
        <circle cx="9" cy="13" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="13" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    </div>
  {/if}

  <div class="bubble">
    <p class="text">{@html renderContent(message.content)}</p>
    <span class="timestamp">{formattedTime}</span>
  </div>
</div>

<style>
  .bubble-wrapper {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
    max-width: 80%;
    animation: slide-in 0.25s var(--ease-out);
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .bubble-wrapper.user {
    margin-left: auto;
    flex-direction: row-reverse;
  }

  .bubble-wrapper.ai {
    margin-right: auto;
  }

  .avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(140deg, var(--color-primary), #8b8ef5);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-bottom: 2px;
  }

  .bubble {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-bubble);
    box-shadow: var(--shadow-bubble);
    word-break: break-word;
  }

  .user .bubble {
    background: var(--color-user-bubble);
    color: var(--color-user-bubble-text);
    border-bottom-right-radius: 5px;
  }

  .ai .bubble {
    background: var(--color-ai-bubble);
    border: 1px solid var(--color-border);
    border-bottom-left-radius: 5px;
  }

  .text {
    font-size: var(--text-sm);
    line-height: 1.55;
  }

  .user .text {
    color: var(--color-user-bubble-text);
  }

  .ai .text {
    color: var(--color-text);
  }

  .timestamp {
    display: block;
    font-size: 11px;
    margin-top: var(--space-1);
    text-align: right;
  }

  .user .timestamp {
    color: rgba(255, 255, 255, 0.65);
  }

  .ai .timestamp {
    color: var(--color-text-muted);
  }
</style>
