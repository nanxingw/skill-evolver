<script lang="ts">
  import { fetchContext } from "../lib/api";

  const categories = [
    {
      label: "User Context",
      pillars: [
        { key: "preference", label: "Preference" },
        { key: "objective", label: "Objective" },
        { key: "cognition", label: "Cognition" },
      ],
    },
    {
      label: "AutoCode",
      pillars: [
        { key: "success_experience", label: "Success" },
        { key: "failure_experience", label: "Failure" },
        { key: "useful_tips", label: "Tips" },
      ],
    },
  ];

  let activeCategory: number = $state(0);
  let activePillar: string = $state("preference");
  let loading: boolean = $state(false);
  let contextEntries: { content: string; graduated?: string }[] = $state([]);
  let tmpEntries: { content: string; times_seen: number; signals: ({ session?: string; date?: string; detail?: string } | string)[] }[] =
    $state([]);
  let expandedTmp: number | null = $state(null);

  function selectCategory(idx: number) {
    activeCategory = idx;
    activePillar = categories[idx].pillars[0].key;
  }

  async function load() {
    loading = true;
    expandedTmp = null;
    try {
      const data = await fetchContext(activePillar);
      contextEntries = data.context ?? [];
      tmpEntries = data.tmp ?? [];
    } catch {
      contextEntries = [];
      tmpEntries = [];
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    activePillar;
    load();
  });
</script>

<div class="browser">
  <h2>Data Browser</h2>

  <div class="category-tabs">
    {#each categories as cat, i}
      <button
        class="cat-tab"
        class:active={activeCategory === i}
        onclick={() => selectCategory(i)}
      >
        {cat.label}
      </button>
    {/each}
  </div>

  <div class="pillar-pills">
    {#each categories[activeCategory].pillars as p}
      <button
        class="pill"
        class:active={activePillar === p.key}
        onclick={() => (activePillar = p.key)}
      >
        {p.label}
      </button>
    {/each}
  </div>

  {#if loading}
    <p class="muted">Loading...</p>
  {:else}
    <section>
      <h3>Context (Confirmed) - {contextEntries.length}</h3>
      {#if contextEntries.length === 0}
        <p class="muted">No confirmed entries.</p>
      {:else}
        <ul>
          {#each contextEntries as entry}
            <li class="entry">
              <p>{entry.content}</p>
              {#if entry.graduated}
                <span class="meta">Graduated: {entry.graduated}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section>
      <h3>Tmp (Accumulating) - {tmpEntries.length}</h3>
      {#if tmpEntries.length === 0}
        <p class="muted">No accumulating entries.</p>
      {:else}
        <ul>
          {#each tmpEntries as entry, i}
            <li class="entry">
              <button class="entry-header" onclick={() => (expandedTmp = expandedTmp === i ? null : i)}>
                <span>{entry.content}</span>
                <span class="seen">seen {entry.times_seen}x</span>
              </button>
              {#if expandedTmp === i && entry.signals.length > 0}
                <div class="signals">
                  <h4>Signals</h4>
                  <ul>
                    {#each entry.signals as signal}
                      <li>
                        {#if typeof signal === "string"}
                          {signal}
                        {:else}
                          <span class="signal-date">{signal.date ?? ""}</span>
                          <span class="signal-session">[{signal.session ?? ""}]</span>
                          {signal.detail ?? ""}
                        {/if}
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
</div>

<style>
  .browser {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  h2 {
    font-size: 1.1rem;
    font-weight: 500;
  }

  .category-tabs {
    display: flex;
    gap: 0.5rem;
  }

  .cat-tab {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 0.625rem;
    padding: 0.5rem 1.25rem;
    color: var(--text-muted);
    font-size: 0.9rem;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.15s;
  }

  .cat-tab:hover {
    color: var(--text);
    border-color: var(--text-muted);
  }

  .cat-tab.active {
    background: var(--accent);
    color: var(--accent-text);
    border-color: var(--accent);
    font-weight: 500;
  }

  .pillar-pills {
    display: flex;
    gap: 0.375rem;
  }

  .pill {
    background: none;
    border: 1px solid var(--border);
    border-radius: 9999px;
    padding: 0.3rem 0.9rem;
    color: var(--text-muted);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .pill:hover {
    color: var(--text);
    border-color: var(--text-muted);
  }

  .pill.active {
    background: var(--bg-surface);
    color: var(--accent);
    border-color: var(--accent);
    font-weight: 500;
  }

  .muted {
    color: var(--text-dim);
  }

  section h3 {
    font-size: 0.85rem;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
    letter-spacing: 0.03em;
  }

  section {
    display: flex;
    flex-direction: column;
  }

  ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .entry {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 0.625rem;
    padding: 0.75rem 1rem;
  }

  .entry-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    background: none;
    border: none;
    color: var(--text);
    cursor: pointer;
    text-align: left;
    font-size: 0.9rem;
    padding: 0;
  }

  .seen {
    white-space: nowrap;
    color: var(--accent);
    font-size: 0.8rem;
  }

  .meta {
    display: block;
    margin-top: 0.4rem;
    font-size: 0.75rem;
    color: var(--text-dim);
  }

  .signals {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
  }

  .signals h4 {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 0.4rem;
  }

  .signals ul {
    padding-left: 1rem;
    list-style: disc;
  }

  .signals li {
    background: none;
    border: none;
    padding: 0.15rem 0;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .signal-date {
    color: var(--text-dim);
    margin-right: 0.4rem;
  }

  .signal-session {
    color: var(--accent);
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.75rem;
    margin-right: 0.4rem;
  }
</style>
