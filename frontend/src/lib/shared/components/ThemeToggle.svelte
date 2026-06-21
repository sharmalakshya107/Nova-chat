<script lang="ts">
  import { themeStore } from "$lib/shared/stores/theme.store.svelte";

  const isDark = $derived(themeStore.current === "dark");
</script>

<button
  class="theme-toggle"
  onclick={() => themeStore.toggle()}
  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
>
  {#if isDark}
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  {:else}
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  {/if}
</button>

<style>
  .theme-toggle {
    width: 38px;
    height: 38px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
  }

  .theme-toggle:hover {
    color: var(--color-text);
    border-color: var(--color-border-strong);
    transform: translateY(-1px);
  }

  .theme-toggle:active {
    transform: translateY(0);
  }
</style>
