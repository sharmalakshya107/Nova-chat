<script lang="ts">
</script>

<div class="typing-row" aria-label="Agent is typing">
  <div class="avatar" aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 8V4M9 3h6" />
      <circle cx="9" cy="13" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  </div>
  <div class="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
</div>

<style>
  .typing-row {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
    margin-right: auto;
    animation: fade-in 0.2s var(--ease-out);
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

  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: var(--space-3) var(--space-4);
    background: var(--color-ai-bubble);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-bubble);
    border-bottom-left-radius: 5px;
    width: fit-content;
  }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-text-muted);
    animation: bounce 1.2s ease-in-out infinite;
  }

  span:nth-child(2) { animation-delay: 0.2s; }
  span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
    30%           { transform: translateY(-5px); opacity: 1; }
  }
</style>
