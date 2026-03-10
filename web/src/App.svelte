<script lang="ts">
  import { onMount } from "svelte";
  import Dashboard from "./pages/Dashboard.svelte";
  import Tasks from "./pages/Tasks.svelte";
  import Reports from "./pages/Reports.svelte";
  import DataBrowser from "./pages/DataBrowser.svelte";
  import Settings from "./pages/Settings.svelte";

  const tabs = ["Dashboard", "Tasks", "Reports", "Data Browser", "Settings"] as const;
  type Tab = (typeof tabs)[number];

  let activeTab: Tab = $state("Dashboard");
  let theme: "light" | "dark" = $state("dark");

  let CurrentPage = $derived(
    activeTab === "Dashboard"
      ? Dashboard
      : activeTab === "Tasks"
        ? Tasks
        : activeTab === "Reports"
          ? Reports
          : activeTab === "Data Browser"
            ? DataBrowser
            : Settings
  );

  function toggleTheme() {
    theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("se-theme", theme);
  }

  onMount(() => {
    // Read from the attribute set by the inline script in index.html (avoids FOUC)
    const current = document.documentElement.getAttribute("data-theme") as "light" | "dark" | null;
    theme = current ?? "dark";
  });
</script>

<div class="shell">
  <header>
    <h1>AutoCode</h1>
    <nav>
      {#each tabs as tab}
        <button
          class:active={activeTab === tab}
          onclick={() => (activeTab = tab)}
        >
          {tab}
        </button>
      {/each}
    </nav>
    <button class="theme-toggle" onclick={toggleTheme} title="Toggle theme">
      {#if theme === "dark"}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      {:else}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      {/if}
    </button>
  </header>

  <main>
    <CurrentPage />
  </main>
</div>

<style>
  :global(:root),
  :global([data-theme="dark"]) {
    --bg: #1c1917;
    --bg-surface: #292524;
    --bg-inset: #1c1917;
    --border: #3f3a36;
    --text: #e7e5e4;
    --text-secondary: #d6d3d1;
    --text-muted: #a8a29e;
    --text-dim: #78716c;
    --accent: #c4704b;
    --accent-hover: #b5633f;
    --accent-text: #fff;
    --badge-text: #1c1917;
    --state-running: #d97706;
    --state-idle: #c4704b;
    --state-default: #78716c;
    --error: #d4183d;
    --scrollbar: #44403c;
    --selection: rgba(196, 112, 75, 0.3);
    --nav-hover: #292524;
    --nav-active-bg: #292524;
  }

  :global([data-theme="light"]) {
    --bg: #ffffff;
    --bg-surface: #f5f5f4;
    --bg-inset: #fafaf9;
    --border: #e7e5e4;
    --text: #1c1917;
    --text-secondary: #292524;
    --text-muted: #78716c;
    --text-dim: #a8a29e;
    --accent: #c4704b;
    --accent-hover: #b5633f;
    --accent-text: #fff;
    --badge-text: #fff;
    --state-running: #d97706;
    --state-idle: #c4704b;
    --state-default: #a8a29e;
    --error: #d4183d;
    --scrollbar: #d6d3d1;
    --selection: rgba(196, 112, 75, 0.2);
    --nav-hover: #f5f5f4;
    --nav-active-bg: #f5f5f4;
  }

  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;
    font-weight: 400;
    line-height: 1.5;
    transition: background 0.2s, color 0.2s;
  }

  :global(::selection) {
    background: var(--selection);
  }

  :global(::-webkit-scrollbar) {
    width: 6px;
  }

  :global(::-webkit-scrollbar-track) {
    background: transparent;
  }

  :global(::-webkit-scrollbar-thumb) {
    background: var(--scrollbar);
    border-radius: 3px;
  }

  .shell {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.5rem;
  }

  header {
    display: flex;
    align-items: center;
    gap: 2rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 1rem;
  }

  h1 {
    font-size: 1.25rem;
    font-weight: 500;
    color: var(--accent);
    white-space: nowrap;
    letter-spacing: -0.01em;
  }

  nav {
    display: flex;
    gap: 0.25rem;
    flex: 1;
  }

  nav button {
    background: none;
    border: none;
    color: var(--text-muted);
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 0.625rem;
    font-size: 0.9rem;
    font-weight: 400;
    transition: background 0.15s, color 0.15s;
  }

  nav button:hover {
    background: var(--nav-hover);
    color: var(--text-secondary);
  }

  nav button.active {
    background: var(--nav-active-bg);
    color: var(--accent);
    font-weight: 500;
  }

  .theme-toggle {
    background: none;
    border: 1px solid var(--border);
    color: var(--text-muted);
    padding: 0.4rem;
    border-radius: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s, border-color 0.15s;
    flex-shrink: 0;
  }

  .theme-toggle:hover {
    color: var(--text);
    border-color: var(--text-muted);
  }
</style>
