<script lang="ts">
  import { t, getLanguage, subscribe } from "../lib/i18n";
  import { onMount } from "svelte";
  import type { PipelineStep } from "../lib/api";

  let {
    pipeline = {},
    contentType = "short-video",
    platforms = [],
    currentStep = "",
    onStepClick,
  }: {
    pipeline: Record<string, PipelineStep>;
    contentType: string;
    platforms: string[];
    currentStep: string;
    onStepClick: (stepKey: string) => void;
  } = $props();

  let lang = $state(getLanguage());
  function tt(key: string): string { void lang; return t(key); }

  onMount(() => {
    const unsub = subscribe(() => { lang = getLanguage(); });
    return unsub;
  });

  const stepLabels: Record<string, Record<string, string>> = {
    "short-video": {
      topic: "爆款选题",
      remix: "热点改编",
      differentiation: "差异化洞察",
      script: "脚本分镜",
      production: "视频制作",
      publish: "发布复盘",
    },
    "image-text": {
      topic: "选题策划",
      remix: "热点改编",
      differentiation: "差异化洞察",
      script: "文案撰写",
      production: "图片制作",
      publish: "发布复盘",
    },
    "long-video": {
      topic: "深度选题",
      remix: "热点改编",
      differentiation: "差异化洞察",
      script: "脚本大纲",
      production: "视频剪辑",
      publish: "发布复盘",
    },
    livestream: {
      topic: "直播策划",
      remix: "热点融入",
      differentiation: "差异化洞察",
      script: "话术准备",
      production: "场景布置",
      publish: "复盘总结",
    },
  };

  const defaultLabels: Record<string, string> = {
    topic: "选题",
    remix: "改编",
    differentiation: "洞察",
    script: "脚本",
    production: "制作",
    publish: "发布",
  };

  const stepOrder = ["topic", "remix", "differentiation", "script", "production", "publish"];

  function getLabel(key: string): string {
    return stepLabels[contentType]?.[key] ?? defaultLabels[key] ?? key;
  }

  function statusIcon(status: string): string {
    if (status === "done") return "✓";
    if (status === "active") return "●";
    if (status === "skipped") return "✗";
    return "○";
  }

  function statusClass(status: string, key: string): string {
    const active = key === currentStep ? " step-active" : "";
    if (status === "done") return "step-done" + active;
    if (status === "active") return "step-running" + active;
    if (status === "skipped") return "step-failed" + active;
    return "step-pending" + active;
  }

  const typeLabels: Record<string, string> = {
    "short-video": "🎬 短视频",
    "image-text": "📷 图文",
    "long-video": "🎥 长视频",
    livestream: "📡 直播",
  };

  const platformLabels: Record<string, string> = {
    xiaohongshu: "小红书",
    douyin: "抖音",
  };
</script>

<div class="pipeline-panel">
  <div class="pipeline-header">
    <span class="pipeline-title">{tt("pipelineSteps")}</span>
  </div>

  <div class="steps-list">
    {#each stepOrder as key, i}
      {@const step = pipeline[key]}
      {@const status = step?.status ?? "pending"}
      <button
        class="step-item {statusClass(status, key)}"
        onclick={() => onStepClick(key)}
      >
        <span class="step-num">{i + 1}</span>
        <span class="step-icon">{statusIcon(status)}</span>
        <span class="step-label">{getLabel(key)}</span>
        <span class="step-status-text">
          {#if status === "done"}
            {tt("stepCompletedLabel")}
          {:else if status === "active"}
            {tt("stepRunningLabel")}
          {:else if status === "skipped"}
            {tt("stepFailedLabel")}
          {:else}
            {tt("stepPendingLabel")}
          {/if}
        </span>
      </button>
    {/each}
  </div>

  <div class="pipeline-footer">
    <div class="footer-item">
      <span class="footer-label">{tt("selectType")}</span>
      <span class="footer-value">{typeLabels[contentType] ?? contentType}</span>
    </div>
    <div class="footer-item">
      <span class="footer-label">{tt("selectPlatforms")}</span>
      <span class="footer-value">
        {platforms.map(p => platformLabels[p] ?? p).join(", ")}
      </span>
    </div>
  </div>
</div>

<style>
  .pipeline-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-right: 1px solid var(--border);
    background: var(--bg-elevated);
  }

  .pipeline-header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .pipeline-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .steps-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
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
  }

  .step-item:hover {
    background: var(--bg-hover);
  }

  .step-num {
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--text-dim);
    width: 1.2rem;
    text-align: center;
    flex-shrink: 0;
  }

  .step-icon {
    font-size: 0.75rem;
    flex-shrink: 0;
    width: 1rem;
    text-align: center;
  }

  .step-label {
    flex: 1;
    font-weight: 550;
  }

  .step-status-text {
    font-size: 0.68rem;
    font-weight: 500;
    flex-shrink: 0;
  }

  /* Status colors */
  .step-done {
    border-color: rgba(52, 211, 153, 0.3);
  }
  .step-done .step-icon { color: var(--success); }
  .step-done .step-status-text { color: var(--success); }

  .step-running {
    border-color: rgba(245, 158, 11, 0.3);
  }
  .step-running .step-icon { color: var(--state-running); }
  .step-running .step-status-text { color: var(--state-running); }

  .step-failed {
    border-color: rgba(251, 113, 133, 0.3);
  }
  .step-failed .step-icon { color: var(--error); }
  .step-failed .step-status-text { color: var(--error); }

  .step-pending {
    opacity: 0.5;
  }
  .step-pending .step-icon { color: var(--text-dim); }
  .step-pending .step-status-text { color: var(--text-dim); }

  /* Active step highlight */
  .step-active {
    border-color: var(--accent) !important;
    background: var(--accent-soft);
    opacity: 1;
  }

  .pipeline-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .footer-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.72rem;
  }

  .footer-label {
    color: var(--text-dim);
    font-weight: 500;
  }

  .footer-value {
    color: var(--text-secondary);
    font-weight: 600;
  }
</style>
