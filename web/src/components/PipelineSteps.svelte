<script lang="ts">
  import { t, getLanguage, subscribe } from "../lib/i18n";
  import { onMount } from "svelte";
  import type { PipelineStep } from "../lib/api";

  let {
    pipeline = {},
    contentType = "short-video",
    platforms = [],
    currentStep = "",
    topicHint = "",
    workTitle = "",
    onStepClick,
    onNextStep,
  }: {
    pipeline: Record<string, PipelineStep>;
    contentType: string;
    platforms: string[];
    currentStep: string;
    topicHint?: string;
    workTitle?: string;
    onStepClick: (stepKey: string) => void;
    onNextStep?: (stepKey: string) => void;
  } = $props();

  let lang = $state(getLanguage());
  function tt(key: string): string { void lang; return t(key); }

  onMount(() => {
    const unsub = subscribe(() => { lang = getLanguage(); });
    return unsub;
  });

  let stepKeys = $derived(Object.keys(pipeline));

  function statusIcon(status: string): string {
    if (status === "done") return "\u2713";
    if (status === "active") return "\u25C9";
    if (status === "skipped") return "\u2717";
    return "\u25CB";
  }

  function statusClass(status: string, key: string): string {
    const active = key === currentStep ? " step-current" : "";
    if (status === "done") return "step-done" + active;
    if (status === "active") return "step-running" + active;
    if (status === "skipped") return "step-failed" + active;
    return "step-pending" + active;
  }

  function elapsed(step: PipelineStep): string {
    if (!step.startedAt) return "";
    const start = new Date(step.startedAt).getTime();
    const end = step.completedAt ? new Date(step.completedAt).getTime() : Date.now();
    const sec = Math.round((end - start) / 1000);
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  }

  let nextPendingStep = $derived.by(() => {
    const idx = stepKeys.indexOf(currentStep);
    if (idx < 0) return null;
    for (let i = idx + 1; i < stepKeys.length; i++) {
      if (pipeline[stepKeys[i]]?.status === "pending") return stepKeys[i];
    }
    return null;
  });

  const typeLabels: Record<string, string> = {
    "short-video": "shortVideo",
    "image-text": "imageText",
  };

  const platformLabels: Record<string, string> = {
    xiaohongshu: "xiaohongshu",
    douyin: "douyin",
  };
</script>

<div class="pipeline-panel">
  <!-- Work info header -->
  <div class="work-info">
    {#if workTitle}
      <h3 class="work-title">{workTitle}</h3>
    {/if}
    <div class="work-meta">
      <span class="meta-tag type-tag">{tt(typeLabels[contentType] ?? contentType)}</span>
      {#each platforms as p}
        <span class="meta-tag">{tt(platformLabels[p] ?? p)}</span>
      {/each}
    </div>
    {#if topicHint}
      <p class="topic-hint">{topicHint}</p>
    {/if}
  </div>

  <!-- Steps timeline -->
  <div class="steps-timeline">
    <span class="section-title">{tt("pipelineSteps")}</span>
    <div class="steps-list">
      {#each stepKeys as key, i}
        {@const step = pipeline[key]}
        {@const status = step?.status ?? "pending"}
        <div class="step-row">
          <!-- Connecting line -->
          {#if i > 0}
            <div class="connector" class:connector-done={pipeline[stepKeys[i - 1]]?.status === "done"}></div>
          {/if}
          <button
            class="step-item {statusClass(status, key)}"
            onclick={() => onStepClick(key)}
          >
            <span class="step-indicator" class:pulse={status === "active"}>
              {statusIcon(status)}
            </span>
            <div class="step-content">
              <span class="step-name">{step?.name ?? key}</span>
              <span class="step-status-text">
                {#if status === "done"}
                  {tt("stepCompletedLabel")}
                  {#if elapsed(step)}
                    <span class="step-time">{elapsed(step)}</span>
                  {/if}
                {:else if status === "active"}
                  {tt("stepRunningLabel")}
                  {#if elapsed(step)}
                    <span class="step-time">{elapsed(step)}</span>
                  {/if}
                {:else if status === "skipped"}
                  {tt("stepFailedLabel")}
                {:else}
                  {tt("stepPendingLabel")}
                {/if}
              </span>
            </div>
          </button>
        </div>
      {/each}
    </div>
  </div>

  {#if nextPendingStep && onNextStep}
    <div class="next-step-bar">
      <button class="next-step-btn" onclick={() => onNextStep!(nextPendingStep!)}>
        {pipeline[nextPendingStep]?.name ?? nextPendingStep}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  {/if}
</div>

<style>
  .pipeline-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-elevated);
  }

  /* Work info */
  .work-info {
    padding: 1rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .work-title {
    font-size: 0.92rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .work-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .meta-tag {
    font-size: 0.65rem;
    font-weight: 650;
    padding: 0.12rem 0.45rem;
    border-radius: 6px;
    background: var(--bg-surface);
    color: var(--text-muted);
    border: 1px solid var(--border);
  }

  .type-tag {
    color: var(--accent);
    background: var(--accent-soft);
    border-color: transparent;
  }

  .topic-hint {
    font-size: 0.75rem;
    color: var(--text-dim);
    line-height: 1.45;
    margin-top: 0.15rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Steps timeline */
  .steps-timeline {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .section-title {
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0 0.3rem 0.5rem;
  }

  .steps-list {
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .step-row {
    position: relative;
  }

  .connector {
    position: absolute;
    left: 1.05rem;
    top: -0.3rem;
    width: 2px;
    height: 0.6rem;
    background: var(--border);
    z-index: 0;
  }

  .connector-done {
    background: rgba(52, 211, 153, 0.4);
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.5rem;
    border-radius: 10px;
    border: 1.5px solid transparent;
    background: none;
    color: var(--text);
    font-family: inherit;
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .step-item:hover { background: var(--bg-hover); }

  .step-indicator {
    width: 1.6rem;
    height: 1.6rem;
    min-width: 1.6rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    border: 2px solid var(--border);
    background: var(--bg-inset);
    transition: all 0.2s ease;
  }

  .step-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  .step-name {
    font-weight: 600;
    font-size: 0.82rem;
    line-height: 1.3;
  }

  .step-status-text {
    font-size: 0.68rem;
    font-weight: 500;
    color: var(--text-dim);
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .step-time {
    font-size: 0.62rem;
    color: var(--text-dim);
    font-variant-numeric: tabular-nums;
  }

  /* Done */
  .step-done .step-indicator {
    border-color: var(--success);
    color: var(--success);
    background: rgba(52, 211, 153, 0.1);
  }
  .step-done .step-status-text { color: var(--success); }

  /* Running */
  .step-running .step-indicator {
    border-color: var(--state-running);
    color: var(--state-running);
    background: rgba(245, 158, 11, 0.1);
  }
  .step-running .step-status-text { color: var(--state-running); }

  /* Pulsing active indicator */
  .pulse {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.3); }
    50% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
  }

  /* Failed */
  .step-failed .step-indicator {
    border-color: var(--error);
    color: var(--error);
    background: rgba(251, 113, 133, 0.1);
  }
  .step-failed .step-status-text { color: var(--error); }

  /* Pending */
  .step-pending { opacity: 0.5; }
  .step-pending .step-indicator { color: var(--text-dim); }

  /* Current / selected step */
  .step-current {
    border-color: var(--accent) !important;
    background: var(--accent-soft);
    opacity: 1;
  }

  .step-current .step-indicator {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(134, 120, 191, 0.15);
  }

  /* Next step bar */
  .next-step-bar {
    padding: 0.6rem;
    border-top: 1px solid var(--border);
  }

  .next-step-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    background: var(--accent-gradient);
    color: var(--accent-text);
    border: none;
    border-radius: 10px;
    padding: 0.6rem 0.75rem;
    font-size: 0.82rem;
    font-weight: 650;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 4px 14px rgba(134, 120, 191, 0.2);
  }

  .next-step-btn:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
</style>
