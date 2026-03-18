<script lang="ts">
  import { t, getLanguage, subscribe } from "../lib/i18n";
  import { onMount } from "svelte";

  let {
    open = false,
    onClose,
    onCreate,
  }: {
    open: boolean;
    onClose: () => void;
    onCreate: (data: { title: string; type: string; platforms: string[]; topicHint: string }) => void;
  } = $props();

  let lang = $state(getLanguage());
  function tt(key: string): string { void lang; return t(key); }

  let title = $state("");
  let selectedType = $state("short-video");
  let selectedPlatforms: string[] = $state(["xiaohongshu"]);
  let topicHint = $state("");

  onMount(() => {
    const unsub = subscribe(() => { lang = getLanguage(); });
    return unsub;
  });

  function togglePlatform(p: string) {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        selectedPlatforms = selectedPlatforms.filter(x => x !== p);
      }
    } else {
      selectedPlatforms = [...selectedPlatforms, p];
    }
  }

  function handleCreate() {
    onCreate({ title, type: selectedType, platforms: selectedPlatforms, topicHint });
    title = "";
    selectedType = "short-video";
    selectedPlatforms = ["xiaohongshu"];
    topicHint = "";
  }

  function handleOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains("modal-overlay")) {
      onClose();
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={handleOverlayClick}>
    <div class="modal-card">
      <h2 class="modal-title">{tt("newWorkBtn")}</h2>

      <!-- Content Type: 2 large cards -->
      <div class="form-section">
        <span class="form-label">{tt("selectType")}</span>
        <div class="type-grid">
          <button
            class="type-card"
            class:selected={selectedType === "short-video"}
            onclick={() => selectedType = "short-video"}
          >
            <span class="type-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </span>
            <span class="type-name">{tt("shortVideo")}</span>
          </button>
          <button
            class="type-card"
            class:selected={selectedType === "image-text"}
            onclick={() => selectedType = "image-text"}
          >
            <span class="type-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </span>
            <span class="type-name">{tt("imageText")}</span>
          </button>
        </div>
      </div>

      <!-- Platforms: toggleable chips -->
      <div class="form-section">
        <span class="form-label">{tt("selectPlatforms")}</span>
        <div class="platform-row">
          <button
            class="platform-chip"
            class:selected={selectedPlatforms.includes("douyin")}
            onclick={() => togglePlatform("douyin")}
          >
            {tt("douyin")}
          </button>
          <button
            class="platform-chip"
            class:selected={selectedPlatforms.includes("xiaohongshu")}
            onclick={() => togglePlatform("xiaohongshu")}
          >
            {tt("xiaohongshu")}
          </button>
        </div>
      </div>

      <!-- Title -->
      <div class="form-section">
        <span class="form-label">{tt("resultTitle")}</span>
        <input
          type="text"
          class="form-input"
          bind:value={title}
          placeholder={tt("titlePlaceholder")}
        />
      </div>

      <!-- Topic Hint -->
      <div class="form-section">
        <span class="form-label">{tt("topicHint")}</span>
        <textarea
          class="form-textarea"
          bind:value={topicHint}
          placeholder={tt("topicHintPlaceholder")}
          rows="3"
        ></textarea>
      </div>

      <!-- Actions -->
      <div class="modal-actions">
        <button class="btn-cancel" onclick={onClose}>{tt("cancel")}</button>
        <button class="btn-create" onclick={handleCreate}>{tt("create")}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-card {
    background: var(--bg-elevated);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
    padding: 1.75rem;
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
    backdrop-filter: var(--card-blur);
    -webkit-backdrop-filter: var(--card-blur);
    animation: scaleIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.96) translateY(8px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .modal-title {
    font-size: 1.15rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    letter-spacing: -0.02em;
  }

  .form-section {
    margin-bottom: 1.25rem;
  }

  .form-label {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  /* 2-column type cards */
  .type-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .type-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.65rem;
    padding: 1.25rem 1rem;
    border: 2px solid var(--border);
    border-radius: 16px;
    background: var(--bg-surface);
    color: var(--text);
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .type-card:hover {
    border-color: var(--text-dim);
    background: var(--bg-hover);
    transform: translateY(-2px);
  }

  .type-card.selected {
    border-color: var(--accent);
    background: var(--accent-soft);
    box-shadow: 0 0 0 3px rgba(134, 120, 191, 0.1);
  }

  .type-icon {
    color: var(--text-muted);
    transition: color 0.2s ease;
  }

  .type-card.selected .type-icon {
    color: var(--accent);
  }

  .type-name {
    font-size: 0.85rem;
    font-weight: 650;
  }

  /* Platform chips */
  .platform-row {
    display: flex;
    gap: 0.5rem;
  }

  .platform-chip {
    padding: 0.5rem 1.25rem;
    border: 1.5px solid var(--border);
    border-radius: 9999px;
    background: var(--bg-surface);
    color: var(--text);
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 550;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .platform-chip:hover {
    border-color: var(--text-dim);
  }

  .platform-chip.selected {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
  }

  .form-input {
    width: 100%;
    background: var(--bg-inset);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.55rem 0.8rem;
    font-size: 0.85rem;
    font-family: inherit;
    transition: border-color 0.15s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  .form-textarea {
    width: 100%;
    background: var(--bg-inset);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.55rem 0.8rem;
    font-size: 0.85rem;
    font-family: inherit;
    resize: vertical;
    line-height: 1.5;
    transition: border-color 0.15s ease;
  }

  .form-textarea:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .btn-cancel {
    padding: 0.55rem 1.25rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--bg-surface);
    color: var(--text);
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 550;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-cancel:hover {
    background: var(--bg-hover);
    border-color: var(--text-dim);
  }

  .btn-create {
    padding: 0.55rem 1.75rem;
    border: none;
    border-radius: 10px;
    background: var(--accent-gradient);
    color: var(--accent-text);
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 650;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 4px 14px rgba(134, 120, 191, 0.25);
  }

  .btn-create:hover {
    filter: brightness(1.1);
    box-shadow: 0 6px 22px rgba(134, 120, 191, 0.35);
    transform: translateY(-1px);
  }
</style>
