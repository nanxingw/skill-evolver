<script lang="ts">
  import { onMount } from "svelte";
  import { fetchStatus, triggerEvolution, fetchReports, fetchSkills, openSkillDir, type Skill } from "../lib/api";
  import { createWsConnection } from "../lib/ws";

  let state: string = $state("idle");
  let lastRun: string | null = $state(null);
  let nextRun: string | null = $state(null);
  let totalReports: number = $state(0);
  let evolvedSkills: number = $state(0);
  let skillsList: Skill[] = $state([]);
  let showSkillsPanel: boolean = $state(false);
  let liveOutput: string = $state("");
  let triggering: boolean = $state(false);

  function handleOpenSkill(name: string) {
    openSkillDir(name).catch(() => {});
  }

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
      skillsList = skills;
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
    <div
      class="card card-clickable"
      role="button"
      tabindex="0"
      aria-label="View evolved skills"
      onclick={() => showSkillsPanel = !showSkillsPanel}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') showSkillsPanel = !showSkillsPanel; }}
    >
      <h3>Evolved Skills</h3>
      <p class="stat">{evolvedSkills}</p>
      <span class="card-hint">Click to view</span>
    </div>
  </div>

  {#if showSkillsPanel}
    <div class="skills-panel">
      <div class="skills-panel-header">
        <h3>Evolved Skills</h3>
        <button class="close-btn" onclick={() => showSkillsPanel = false} aria-label="Close">&times;</button>
      </div>
      {#if skillsList.length === 0}
        <p class="empty-msg">No evolved skills yet. Skills will appear here after the Skill Agent creates them.</p>
      {:else}
        <div class="skills-list">
          {#each skillsList as skill}
            <div class="skill-item" class:skill-missing={!skill.exists}>
              <div class="skill-header">
                <span class="skill-name">{skill.name}</span>
                <span class="skill-status" class:exists={skill.exists}>
                  {skill.exists ? "installed" : "missing"}
                </span>
              </div>
              {#if skill.description}
                <p class="skill-desc">{skill.description}</p>
              {:else if skill.summary}
                <p class="skill-desc">{skill.summary}</p>
              {/if}
              <div class="skill-footer">
                <code class="skill-path">{skill.path}</code>
                {#if skill.exists}
                  <button class="open-btn" onclick={() => handleOpenSkill(skill.name)}>
                    Open in Finder
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

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

  /* Clickable card */
  .card-clickable {
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
    position: relative;
  }

  .card-clickable:hover {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }

  .card-hint {
    font-size: 0.65rem;
    color: var(--text-muted);
    position: absolute;
    bottom: 0.5rem;
    right: 0.75rem;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .card-clickable:hover .card-hint {
    opacity: 1;
  }

  /* Skills panel */
  .skills-panel {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 0.625rem;
    padding: 1rem;
  }

  .skills-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .skills-panel-header h3 {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 0.03em;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0 0.25rem;
    line-height: 1;
  }

  .close-btn:hover {
    color: var(--text-primary);
  }

  .empty-msg {
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .skills-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .skill-item {
    background: var(--bg-base);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
  }

  .skill-item.skill-missing {
    opacity: 0.5;
  }

  .skill-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.35rem;
  }

  .skill-name {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text-primary);
  }

  .skill-status {
    font-size: 0.7rem;
    padding: 0.1rem 0.5rem;
    border-radius: 9999px;
    background: var(--border);
    color: var(--text-muted);
  }

  .skill-status.exists {
    background: color-mix(in srgb, var(--state-idle) 20%, transparent);
    color: var(--state-idle);
  }

  .skill-desc {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
    line-height: 1.45;
  }

  .skill-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .skill-path {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.7rem;
    color: var(--text-muted);
    background: var(--bg-surface);
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
    word-break: break-all;
    flex: 1;
    min-width: 0;
  }

  .open-btn {
    flex-shrink: 0;
    background: var(--accent);
    color: var(--accent-text);
    border: none;
    padding: 0.25rem 0.7rem;
    border-radius: 0.375rem;
    font-size: 0.7rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }

  .open-btn:hover {
    background: var(--accent-hover);
  }
</style>
