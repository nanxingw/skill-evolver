<script lang="ts">
  import { onMount } from "svelte";
  import { fetchReports, fetchReport } from "../lib/api";

  let reports: { filename: string; date: string }[] = $state([]);
  let loading: boolean = $state(true);
  let expanded: string | null = $state(null);
  let reportContent: string = $state("");
  let loadingContent: boolean = $state(false);

  onMount(async () => {
    try {
      reports = await fetchReports();
      reports.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch {
      // ignore
    } finally {
      loading = false;
    }
  });

  async function toggle(filename: string) {
    if (expanded === filename) {
      expanded = null;
      return;
    }
    expanded = filename;
    loadingContent = true;
    try {
      const r = await fetchReport(filename);
      reportContent = r.content;
    } catch {
      reportContent = "Failed to load report.";
    } finally {
      loadingContent = false;
    }
  }
</script>

<div class="reports">
  <h2>Reports</h2>

  {#if loading}
    <p class="muted">Loading reports...</p>
  {:else if reports.length === 0}
    <p class="muted">No reports yet.</p>
  {:else}
    <ul>
      {#each reports as report}
        <li>
          <button class="report-item" onclick={() => toggle(report.filename)}>
            <span class="date"
              >{new Date(report.date).toLocaleDateString()}</span
            >
            <span class="filename">{report.filename}</span>
            <span class="chevron">{expanded === report.filename ? "v" : ">"}</span
            >
          </button>
          {#if expanded === report.filename}
            <div class="content">
              {#if loadingContent}
                <p class="muted">Loading...</p>
              {:else}
                <pre>{reportContent}</pre>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .reports h2 {
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 1rem;
  }

  .muted {
    color: var(--text-dim);
  }

  ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .report-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 0.625rem;
    padding: 0.75rem 1rem;
    color: var(--text);
    cursor: pointer;
    text-align: left;
    font-size: 0.9rem;
    transition: border-color 0.15s;
  }

  .report-item:hover {
    border-color: var(--accent);
  }

  .date {
    color: var(--text-muted);
    min-width: 90px;
  }

  .filename {
    flex: 1;
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.85rem;
  }

  .chevron {
    color: var(--text-dim);
  }

  .content {
    background: var(--bg-inset);
    border: 1px solid var(--border);
    border-radius: 0 0 0.625rem 0.625rem;
    padding: 1rem;
    margin-top: -0.25rem;
  }

  .content pre {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.8rem;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--text-secondary);
    max-height: 500px;
    overflow-y: auto;
  }
</style>
