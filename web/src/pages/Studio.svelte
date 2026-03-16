<script lang="ts">
  import { onMount } from "svelte";
  import { t, getLanguage, subscribe } from "../lib/i18n";
  import { fetchWork, type Work, type PipelineStep } from "../lib/api";
  import { createWorkWs } from "../lib/ws";
  import ChatPanel from "../components/ChatPanel.svelte";
  import PipelineSteps from "../components/PipelineSteps.svelte";

  interface ChatMessage {
    role: "user" | "assistant";
    text: string;
  }

  let {
    workId,
    onBack,
  }: {
    workId: string;
    onBack: () => void;
  } = $props();

  let lang = $state(getLanguage());
  function tt(key: string): string { void lang; return t(key); }

  let work: Work | null = $state(null);
  let sessionReady = $state(false);
  let streaming = $state(false);
  let agentOutput = $state("");
  let messages: ChatMessage[] = $state([]);
  let currentStep = $state("");
  let wsConn: { send: (text: string) => void; close: () => void } | null = null;

  const statusLabels: Record<string, string> = {
    draft: "workDraft",
    creating: "workCreating",
    ready: "workReady",
    publishing: "workPublishing",
    published: "workPublished",
    failed: "workFailed",
  };

  function statusBadgeClass(status: string): string {
    if (status === "published") return "badge-success";
    if (status === "failed") return "badge-error";
    if (status === "creating" || status === "publishing") return "badge-running";
    return "badge-default";
  }

  function handleSend(text: string) {
    messages = [...messages, { role: "user", text }];
    agentOutput = "";
    wsConn?.send(text);
  }

  function handleStepClick(stepKey: string) {
    currentStep = stepKey;
    // Show step result in center panel
    if (work?.pipeline[stepKey]) {
      const step = work.pipeline[stepKey];
      agentOutput = step.note ?? `Step: ${stepKey} — ${step.status}`;
    }
  }

  onMount(async () => {
    const unsub = subscribe(() => { lang = getLanguage(); });

    try {
      work = await fetchWork(workId);
      // Set initial current step from pipeline
      if (work?.pipeline) {
        const keys = Object.keys(work.pipeline);
        const activeKey = keys.find(k => work!.pipeline[k].status === "active");
        if (activeKey) currentStep = activeKey;
        else if (keys.length > 0) currentStep = keys[0];
      }
    } catch {
      // work fetch failed
    }

    wsConn = createWorkWs(workId, (event, data) => {
      switch (event) {
        case "session_ready":
          sessionReady = true;
          break;

        case "session_state":
          // Restore state + history
          if (data.pipeline && work) {
            work = { ...work, pipeline: data.pipeline };
          }
          if (data.messages) {
            messages = data.messages;
          }
          if (data.currentStep) {
            currentStep = data.currentStep;
          }
          sessionReady = true;
          break;

        case "agent_message":
          agentOutput += data.text ?? data.content ?? "";
          streaming = true;
          break;

        case "turn_complete":
          streaming = false;
          if (agentOutput.trim()) {
            messages = [...messages, { role: "assistant", text: agentOutput }];
          }
          // Update pipeline if provided
          if (data.pipeline && work) {
            work = { ...work, pipeline: data.pipeline };
          }
          if (data.currentStep) {
            currentStep = data.currentStep;
          }
          break;

        case "user_message":
          messages = [...messages, { role: "user", text: data.text ?? "" }];
          break;

        case "step_update":
          if (data.pipeline && work) {
            work = { ...work, pipeline: data.pipeline };
          }
          if (data.currentStep) {
            currentStep = data.currentStep;
          }
          break;
      }
    });

    return () => {
      unsub();
      wsConn?.close();
    };
  });
</script>

<div class="studio-layout">
  <!-- Header -->
  <div class="studio-header">
    <button class="back-btn" onclick={onBack}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      {tt("backToHome")}
    </button>
    <div class="header-center">
      <h2 class="studio-title">{work?.title ?? tt("studio")}</h2>
      {#if work}
        <span class="status-badge {statusBadgeClass(work.status)}">
          {tt(statusLabels[work.status] ?? "workDraft")}
        </span>
      {/if}
    </div>
    <div class="header-right">
      {#if sessionReady}
        <span class="session-indicator ready">{tt("sessionReady")}</span>
      {:else}
        <span class="session-indicator connecting">{tt("sessionConnecting")}</span>
      {/if}
    </div>
  </div>

  <!-- Three-panel body -->
  <div class="studio-body">
    <!-- Left: Pipeline Steps -->
    <div class="panel-left">
      <PipelineSteps
        pipeline={work?.pipeline ?? {}}
        contentType={work?.type ?? "short-video"}
        platforms={work?.platforms?.map(p => p.platform) ?? []}
        {currentStep}
        onStepClick={handleStepClick}
      />
    </div>

    <!-- Center: Agent Output -->
    <div class="panel-center">
      <div class="agent-output">
        {#if agentOutput}
          <pre class="output-text">{agentOutput}</pre>
          {#if streaming}
            <span class="streaming-dot">●</span>
          {/if}
        {:else}
          <div class="output-placeholder">
            <p>{tt("studio")}</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Right: Chat Panel -->
    <div class="panel-right">
      <ChatPanel
        {messages}
        onSend={handleSend}
        disabled={!sessionReady}
        placeholder={tt("chatPlaceholder")}
      />
    </div>
  </div>
</div>

<style>
  .studio-layout {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 120px);
    min-height: 400px;
  }

  .studio-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
    margin-bottom: 0.5rem;
    gap: 1rem;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: none;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 0.4rem 0.8rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 550;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .back-btn:hover {
    color: var(--text);
    border-color: var(--text-dim);
    background: var(--bg-hover);
  }

  .header-center {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex: 1;
    min-width: 0;
  }

  .studio-title {
    font-size: 1rem;
    font-weight: 650;
    letter-spacing: -0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status-badge {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.15rem 0.55rem;
    border-radius: 9999px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .badge-success {
    background: rgba(52, 211, 153, 0.15);
    color: var(--success);
  }

  .badge-error {
    background: rgba(251, 113, 133, 0.15);
    color: var(--error);
  }

  .badge-running {
    background: rgba(245, 158, 11, 0.15);
    color: var(--state-running);
  }

  .badge-default {
    background: var(--bg-surface);
    color: var(--text-muted);
  }

  .header-right {
    flex-shrink: 0;
  }

  .session-indicator {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
  }

  .session-indicator.ready {
    background: rgba(52, 211, 153, 0.12);
    color: var(--success);
  }

  .session-indicator.connecting {
    background: rgba(245, 158, 11, 0.12);
    color: var(--state-running);
  }

  /* Three-panel layout */
  .studio-body {
    display: flex;
    flex: 1;
    min-height: 0;
    border: 1px solid var(--border);
    border-radius: var(--card-radius);
    overflow: hidden;
    background: var(--card-bg);
    backdrop-filter: var(--card-blur);
    -webkit-backdrop-filter: var(--card-blur);
  }

  .panel-left {
    width: 260px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .panel-center {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .panel-right {
    width: 300px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .agent-output {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    position: relative;
  }

  .output-text {
    font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
    font-size: 0.82rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--text);
    margin: 0;
  }

  .streaming-dot {
    color: var(--state-running);
    animation: blink 1s ease-in-out infinite;
    margin-left: 0.25rem;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .output-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-dim);
    font-size: 0.9rem;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .panel-left,
    .panel-right {
      display: none;
    }

    .studio-body {
      border-radius: 12px;
    }
  }
</style>
