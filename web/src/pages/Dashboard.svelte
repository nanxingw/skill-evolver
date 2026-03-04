<script lang="ts">
  import { onMount } from "svelte";
  import { fetchStatus, triggerEvolution, fetchReports, fetchSkills } from "../lib/api";
  import { createWsConnection } from "../lib/ws";

  let state: string = $state("idle");
  let lastRun: string | null = $state(null);
  let nextRun: string | null = $state(null);
  let totalReports: number = $state(0);
  let evolvedSkills: number = $state(0);
  let liveOutput: string = $state("");
  let triggering: boolean = $state(false);

  let stateColor = $derived(
    state === "running" ? "var(--state-running)" : state === "idle" ? "var(--state-idle)" : "var(--state-default)"
  );

  async function loadStatus() {
    try {
      const s = await fetchStatus();
      state = s.state;
      lastRun = s.lastRun;
      nextRun = s.nextRun;
    } catch {
      // will retry via ws
    }
    try {
      const reports = await fetchReports();
      totalReports = reports.length;
    } catch { /* ignore */ }
    try {
      const skills = await fetchSkills();
      evolvedSkills = skills.length;
    } catch { /* ignore */ }
  }

  async function handleTrigger() {
    triggering = true;
    liveOutput = "";
    try {
      await triggerEvolution();
      state = "running";
    } catch {
      // ignore
    } finally {
      triggering = false;
    }
  }

  onMount(() => {
    loadStatus();
    const ws = createWsConnection((event, data) => {
      if (event === "cycle_start") {
        state = "running";
        liveOutput = "";
      } else if (event === "cycle_progress") {
        liveOutput += data.text ?? "";
      } else if (event === "cycle_end") {
        state = "idle";
        loadStatus();
      } else if (event === "cycle_error") {
        state = "idle";
        liveOutput += `\n[ERROR] ${data.message ?? "Unknown error"}`;
      }
    });
    return () => ws.close();
  });

  function formatTime(iso: string | null): string {
    if (!iso) return "--";
    return new Date(iso).toLocaleString();
  }
</script>

<div class="dashboard">
  <div class="cards">
    <div class="card">
      <h3>Status</h3>
      <span class="badge" style="background:{stateColor}">{state}</span>
    </div>
    <div class="card">
      <h3>Last Run</h3>
      <p>{formatTime(lastRun)}</p>
    </div>
    <div class="card">
      <h3>Next Scheduled</h3>
      <p>{formatTime(nextRun)}</p>
    </div>
    <div class="card">
      <h3>Reports</h3>
      <p class="stat">{totalReports}</p>
    </div>
    <div class="card">
      <h3>Evolved Skills</h3>
      <p class="stat">{evolvedSkills}</p>
    </div>
  </div>

  <button
    class="trigger-btn"
    onclick={handleTrigger}
    disabled={state === "running" || triggering}
  >
    {state === "running" ? "Running..." : "Run Evolution"}
  </button>

  {#if state === "running" || liveOutput}
    <div class="live-panel">
      <h3>Live Output</h3>
      <pre>{liveOutput || "Waiting for output..."}</pre>
    </div>
  {/if}
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }

  .card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 0.625rem;
    padding: 1rem;
  }

  .card h3 {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
    letter-spacing: 0.03em;
  }

  .badge {
    display: inline-block;
    padding: 0.2rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--badge-text);
  }

  .stat {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--accent);
  }

  .trigger-btn {
    align-self: flex-start;
    background: var(--accent);
    color: var(--accent-text);
    border: none;
    padding: 0.6rem 1.5rem;
    border-radius: 0.625rem;
    font-weight: 500;
    cursor: pointer;
    font-size: 0.95rem;
    transition: background 0.15s, opacity 0.15s;
  }

  .trigger-btn:hover {
    background: var(--accent-hover);
  }

  .trigger-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .live-panel {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 0.625rem;
    padding: 1rem;
  }

  .live-panel h3 {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
    letter-spacing: 0.03em;
  }

  .live-panel pre {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.8rem;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 400px;
    overflow-y: auto;
    color: var(--text-secondary);
  }
</style>
