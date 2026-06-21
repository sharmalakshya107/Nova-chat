<script lang="ts">
  import { chatStore } from "$lib/features/chat/stores/chat.store.svelte";

  let text = $state("");
  let textarea: HTMLTextAreaElement;

  $effect(() => {
    if (textarea && !chatStore.isLoading) {
      textarea.focus();
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || chatStore.isLoading) return;
    chatStore.sendMessage(trimmed);
    text = "";
    resetHeight();
  }

  function handleInput() {
    resetHeight();
  }

  function resetHeight() {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + "px";
  }

  const canSend = $derived(text.trim().length > 0 && !chatStore.isLoading);
</script>

<div class="input-area">
  <div class="input-shell" class:disabled={chatStore.isLoading}>
    <textarea
      bind:this={textarea}
      bind:value={text}
      onkeydown={handleKeydown}
      oninput={handleInput}
      placeholder="Ask about shipping, returns, orders…"
      rows="1"
      maxlength="1000"
      disabled={chatStore.isLoading}
      aria-label="Chat message input"
    ></textarea>

    <button
      class="send-btn"
      onclick={submit}
      disabled={!canSend}
      aria-label="Send message"
      title="Send (Enter)"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M22 2 11 13" />
        <path d="M22 2 15 22l-4-9-9-4z" />
      </svg>
    </button>
  </div>
  <p class="hint">Press <kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line</p>
</div>

<style>
  .input-area {
    padding: var(--space-3) var(--space-5) var(--space-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
    flex-shrink: 0;
  }

  .input-shell {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-input);
    padding: 6px 6px 6px var(--space-3);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .input-shell:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-dim);
  }

  .input-shell.disabled {
    opacity: 0.65;
  }

  textarea {
    flex: 1;
    background: transparent;
    border: none;
    padding: 8px 0;
    color: var(--color-text);
    font-size: var(--text-sm);
    line-height: 1.5;
    outline: none;
    min-height: 24px;
    max-height: 140px;
    overflow-y: auto;
  }

  textarea::placeholder {
    color: var(--color-text-muted);
  }

  .send-btn {
    width: 38px;
    height: 38px;
    border-radius: var(--radius-md);
    background: var(--color-primary);
    color: var(--color-on-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s ease, transform 0.1s ease;
  }

  .send-btn:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .send-btn:active:not(:disabled) {
    transform: scale(0.92);
  }

  .send-btn:disabled {
    background: var(--color-surface);
    color: var(--color-text-muted);
    cursor: not-allowed;
  }

  .hint {
    margin-top: var(--space-2);
    font-size: 11px;
    color: var(--color-text-muted);
    text-align: center;
  }

  kbd {
    font-family: var(--font-sans);
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 4px;
    border: 1px solid var(--color-border-strong);
    background: var(--color-surface);
    color: var(--color-text-soft);
  }

  @media (max-width: 640px) {
    .hint {
      display: none;
    }
  }
</style>
