<script lang="ts">
  interface ProgressLine {
    type: "search" | "result" | "analyzing" | "done" | "error";
    text: string;
  }

  let {
    active,
    lines,
    phase,
    onCancel,
  }: {
    active: boolean;
    lines: ProgressLine[];
    phase: "idle" | "searching" | "analyzing" | "done" | "error";
    onCancel: () => void;
  } = $props();

  function lineIcon(type: string): string {
    if (type === "done" || type === "result") return "\u2713";
    if (type === "error") return "\u2715";
    return "\u2192";
  }

  function lineClass(type: string): string {
    if (type === "done" || type === "result") return "line-done";
    if (type === "error") return "line-error";
    return "line-active";
  }
</script>

<div class="research-progress" class:expanded={active} class:has-error={phase === "error"}>
  <div class="progress-inner">
    {#if active || phase === "error"}
      <div class="progress-header">
        <div class="header-left">
          {#if phase === "error"}
            <span class="dot dot-error"></span>
            <span class="header-text">调研失败</span>
          {:else if phase === "done"}
            <span class="dot dot-done"></span>
            <span class="header-text">调研完成</span>
          {:else}
            <span class="dot dot-pulse"></span>
            <span class="header-text">正在调研趋势...</span>
          {/if}
        </div>
        {#if phase === "error"}
          <button class="cancel-btn" onclick={onCancel}>重试</button>
        {:else if active}
          <button class="cancel-btn" onclick={onCancel}>取消</button>
        {/if}
      </div>

      <div class="lines">
        {#each lines as line, i (i)}
          <div class="line {lineClass(line.type)}" style="animation-delay: {i * 0.05}s">
            <span class="line-icon">{lineIcon(line.type)}</span>
            <span class="line-text">{line.text}</span>
          </div>
        {/each}
      </div>

      <div class="progress-bar-track">
        <div
          class="progress-bar-fill"
          class:indeterminate={phase === "searching"}
          class:almost={phase === "analyzing"}
          class:full={phase === "done"}
        ></div>
      </div>
    {/if}
  </div>
</div>

<style>
  .research-progress {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 300ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .research-progress.expanded,
  .research-progress.has-error {
    grid-template-rows: 1fr;
  }

  .progress-inner {
    overflow: hidden;
    min-height: 0;
  }

  .progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .header-text {
    font-size: 0.85rem;
    font-weight: 650;
    color: var(--text);
    letter-spacing: -0.01em;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  .dot-pulse {
    background: var(--accent);
    animation: pulse 1.2s ease-in-out infinite;
  }

  .dot-done {
    background: #34d399;
  }

  .dot-error {
    background: var(--error, #fb7185);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .cancel-btn {
    padding: 0.3rem 0.7rem;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: none;
    color: var(--text-dim);
    font-size: 0.75rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .cancel-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .lines {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0 0 0.75rem;
  }

  .line {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 500;
    animation: lineIn 200ms ease both;
  }

  .line-done {
    color: var(--text-dim);
  }

  .line-active {
    color: var(--text);
  }

  .line-error {
    color: var(--error, #fb7185);
  }

  .line-icon {
    font-size: 0.7rem;
    width: 1em;
    text-align: center;
    flex-shrink: 0;
  }

  .line-text {
    line-height: 1.4;
  }

  @keyframes lineIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .progress-bar-track {
    height: 3px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 1rem;
  }

  .progress-bar-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    width: 0%;
    transition: width 400ms ease;
  }

  .progress-bar-fill.indeterminate {
    width: 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--accent) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
  }

  .progress-bar-fill.almost {
    width: 90%;
  }

  .progress-bar-fill.full {
    width: 100%;
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
</style>
