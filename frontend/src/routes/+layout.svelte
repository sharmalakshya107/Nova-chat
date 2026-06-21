<script lang="ts">
  import "../app.css";

  let { children } = $props();
</script>

<svelte:head>
  <title>Nova Gear Support Assistant</title>
</svelte:head>

{@render children()}
