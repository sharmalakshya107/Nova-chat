<script lang="ts">
  import ChatWidget from "$lib/features/chat/components/ChatWidget.svelte";
</script>

<div class="page">
  <ChatWidget />
</div>

<style>
  .page {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-5);
    background:
      radial-gradient(900px 480px at 78% -8%, var(--color-bg-grad-1), transparent 60%),
      radial-gradient(700px 420px at 8% 4%, var(--color-bg-grad-2), transparent 55%),
      var(--color-bg);
  }

  @media (max-width: 640px) {
    .page {
      padding: 0;
    }
  }
</style>
