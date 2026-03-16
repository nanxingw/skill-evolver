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

  const contentTypes = [
    { value: "short-video", emoji: "🎬", labelKey: "shortVideo" },
    { value: "image-text", emoji: "📷", labelKey: "imageText" },
    { value: "long-video", emoji: "🎥", labelKey: "longVideo" },
    { value: "livestream", emoji: "📡", labelKey: "livestream" },
  ];

  const platformOptions = [
    { value: "xiaohongshu", labelKey: "xiaohongshu" },
    { value: "douyin", labelKey: "douyin" },
  ];

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
    // Reset form
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

      <!-- Content Type -->
      <div class="form-section">
        <label class="form-label">{tt("selectType")}</label>
        <div class="type-grid">
          {#each contentTypes as ct}
            <button
              class="type-card"
              class:selected={selectedType === ct.value}
              onclick={() => selectedType = ct.value}
            >
              <span class="type-emoji">{ct.emoji}</span>
              <span class="type-name">{tt(ct.labelKey)}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Platforms -->
      <div class="form-section">
        <label class="form-label">{tt("selectPlatforms")}</label>
        <div class="platform-row">
          {#each platformOptions as po}
            <button
              class="platform-chip"
              class:selected={selectedPlatforms.includes(po.value)}
              onclick={() => togglePlatform(po.value)}
            >
              {tt(po.labelKey)}
            </button>
          {/each}
        </div>
      </div>

      <!-- Title -->
      <div class="form-section">
        <label class="form-label">{tt("resultTitle")}</label>
        <input
          type="text"
          class="form-input"
          bind:value={title}
          placeholder={lang === "zh" ? "可选，不填则AI自动生成" : "Optional — AI will generate if empty"}
        />
      </div>

      <!-- Topic Hint -->
      <div class="form-section">
        <label class="form-label">{tt("topicHint")}</label>
        <textarea
          class="form-textarea"
          bind:value={topicHint}
          placeholder={lang === "zh" ? "告诉AI你想做什么方向的内容..." : "Tell AI what direction you want..."}
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
  }

  .modal-title {
    font-size: 1.1rem;
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

  .type-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .type-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 0.75rem 0.5rem;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    background: var(--bg-surface);
    color: var(--text);
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .type-card:hover {
    border-color: var(--text-dim);
    background: var(--bg-hover);
  }

  .type-card.selected {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  .type-emoji {
    font-size: 1.5rem;
  }

  .type-name {
    font-size: 0.72rem;
    font-weight: 600;
  }

  .platform-row {
    display: flex;
    gap: 0.5rem;
  }

  .platform-chip {
    padding: 0.45rem 1rem;
    border: 1.5px solid var(--border);
    border-radius: 9999px;
    background: var(--bg-surface);
    color: var(--text);
    font-family: inherit;
    font-size: 0.82rem;
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
    margin-top: 0.5rem;
  }

  .btn-cancel {
    padding: 0.5rem 1.25rem;
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
    padding: 0.5rem 1.5rem;
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

  @media (max-width: 480px) {
    .type-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
