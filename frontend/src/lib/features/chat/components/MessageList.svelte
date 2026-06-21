<script lang="ts">
  import { chatStore } from "$lib/features/chat/stores/chat.store.svelte";
  import ChatBubble from "./ChatBubble.svelte";
  import TypingIndicator from "./TypingIndicator.svelte";

  let container: HTMLDivElement;
  let previousCount = 0;
  let pinnedUserId: string | null = null;

  const suggestions = [
    "How long does shipping take?",
    "What's your return policy?",
    "How do I track my order?",
    "Do you ship internationally?",
  ];

  $effect(() => {
    const messages = chatStore.messages;
    const count = messages.length;
    const last = messages[count - 1];
    if (!container) return;

    if (previousCount === 0 && count > 1) {
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight });
      });
    } else if (last && last.sender === "user" && last.id !== pinnedUserId) {
      pinnedUserId = last.id;
      requestAnimationFrame(() => {
        const el = container.querySelector<HTMLElement>(`[data-id="${last.id}"]`);
        el?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    }

    previousCount = count;
  });

  function ask(text: string) {
    chatStore.sendMessage(text);
  }
</script>

<div class="message-list" bind:this={container} role="log" aria-live="polite" aria-label="Chat messages">
  {#if chatStore.messages.length === 0 && !chatStore.isLoading && !chatStore.isInitializing}
    <div class="empty-state">
      <div class="empty-icon" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h2>How can I help today?</h2>
      <p>Ask me about shipping, returns, warranty, payments, or your order.</p>

      <div class="suggestions">
        {#each suggestions as suggestion}
          <button class="suggestion" onclick={() => ask(suggestion)}>
            {suggestion}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#each chatStore.messages as message (message.id)}
    <ChatBubble {message} />
  {/each}

  {#if chatStore.isLoading}
    <TypingIndicator />
  {/if}
</div>

<style>
  .message-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    scroll-behavior: smooth;
  }

  .message-list::-webkit-scrollbar {
    width: 8px;
  }

  .message-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .message-list::-webkit-scrollbar-thumb {
    background: var(--color-border-strong);
    border-radius: var(--radius-full);
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: 100%;
    text-align: center;
    padding: var(--space-5);
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-lg);
    background: var(--color-primary-dim);
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-2);
  }

  .empty-state h2 {
    font-size: var(--text-xl);
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--color-text);
  }

  .empty-state p {
    font-size: var(--text-sm);
    color: var(--color-text-soft);
    max-width: 380px;
    line-height: 1.6;
  }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    justify-content: center;
    margin-top: var(--space-4);
    max-width: 460px;
  }

  .suggestion {
    font-size: var(--text-sm);
    color: var(--color-text);
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-surface-2);
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
  }

  .suggestion:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-dim);
    transform: translateY(-1px);
  }
</style>
