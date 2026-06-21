<script lang="ts">
  import { chatStore } from "$lib/features/chat/stores/chat.store.svelte";
  import ThemeToggle from "$lib/shared/components/ThemeToggle.svelte";
  import MessageInput from "./MessageInput.svelte";
  import MessageList from "./MessageList.svelte";
  import { onMount } from "svelte";

  onMount(() => {
    void chatStore.loadHistory();
  });

  function newChat() {
    chatStore.reset();
  }
</script>

<div class="chat" role="region" aria-label="Customer support chat">
  <header class="header">
    <div class="brand">
      <div class="avatar" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="8" width="16" height="11" rx="3" />
          <path d="M12 8V4M9 3h6" />
          <circle cx="9" cy="13" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <div class="brand-text">
        <p class="title">Nova Gear Support</p>
        <p class="status" class:offline={chatStore.degraded}>
          <span class="status-dot" aria-hidden="true"></span>
          {chatStore.degraded ? "Offline mode - answering from FAQs" : "AI assistant · online"}
        </p>
      </div>
    </div>

    <div class="actions">
      <button class="action-btn" onclick={newChat} disabled={!chatStore.hasMessages} title="Start a new chat">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>New chat</span>
      </button>
      <ThemeToggle />
    </div>
  </header>

  {#if chatStore.error}
    <div class="error-banner" role="alert">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <span class="error-text">{chatStore.error}</span>
      <button class="retry-btn" onclick={() => chatStore.retryLast()}>Try again</button>
      <button class="dismiss-btn" onclick={() => chatStore.clearError()} aria-label="Dismiss error">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  {/if}

  <MessageList />

  <MessageInput />
</div>

<style>
  .chat {
    width: 100%;
    max-width: var(--chat-max);
    height: min(860px, 100dvh - 48px);
    display: flex;
    flex-direction: column;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-widget);
    box-shadow: var(--shadow-card);
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
    flex-shrink: 0;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: linear-gradient(140deg, var(--color-primary), #8b8ef5);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .title {
    font-size: var(--text-base);
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-xs);
    color: var(--color-text-soft);
    line-height: 1.3;
    margin-top: 2px;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-success);
    box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.18);
  }

  .status.offline .status-dot {
    background: var(--color-text-muted);
    box-shadow: none;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 38px;
    padding: 0 var(--space-3);
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-soft);
    font-size: var(--text-sm);
    font-weight: 500;
    transition: color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  .action-btn:hover:not(:disabled) {
    color: var(--color-text);
    border-color: var(--color-border-strong);
    transform: translateY(-1px);
  }

  .action-btn:disabled {
    opacity: 0.45;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-5);
    background: var(--color-error-bg);
    border-bottom: 1px solid var(--color-error-border);
    color: var(--color-error);
    font-size: var(--text-sm);
    flex-shrink: 0;
  }

  .error-text {
    flex: 1;
    min-width: 0;
  }

  .retry-btn {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-error);
    padding: 4px 10px;
    border: 1px solid var(--color-error-border);
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }

  .retry-btn:hover {
    background: var(--color-error);
    color: #fff;
  }

  .dismiss-btn {
    color: var(--color-error);
    display: flex;
    flex-shrink: 0;
    opacity: 0.7;
  }

  .dismiss-btn:hover {
    opacity: 1;
  }

  @media (max-width: 640px) {
    .chat {
      height: 100dvh;
      max-width: none;
      border: none;
      border-radius: 0;
    }

    .action-btn span {
      display: none;
    }

    .action-btn {
      width: 38px;
      padding: 0;
      justify-content: center;
    }
  }
</style>
