<script lang="ts">
  import { onMount } from "svelte";
  import { t, getLanguage, subscribe } from "../lib/i18n";
  import { fetchWorks, type WorkSummary } from "../lib/api";

  let {
    onOpenStudio,
    onCreateNew,
  }: {
    onOpenStudio: (workId: string) => void;
    onCreateNew: () => void;
  } = $props();

  let lang = $state(getLanguage());
  function tt(key: string): string { void lang; return t(key); }

  let works: WorkSummary[] = $state([]);
  let loading = $state(true);
  let filter: "all" | "creating" | "ready" = $state("all");

  let filteredWorks = $derived.by(() => {
    if (filter === "all") return works;
    if (filter === "creating") return works.filter(w => w.status === "creating" || w.status === "draft");
    return works.filter(w => w.status === "ready");
  });

  async function loadWorks() {
    loading = true;
    try {
      works = await fetchWorks();
    } catch {
      works = [];
    } finally {
      loading = false;
    }
  }

  function statusLabel(status: string): string {
    const map: Record<string, string> = {
      draft: "workDraft",
      creating: "workCreating",
      ready: "workReady",
      failed: "workFailed",
    };
    return tt(map[status] ?? "workDraft");
  }

  function statusClass(status: string): string {
    if (status === "ready") return "status-ready";
    if (status === "creating") return "status-creating";
    if (status === "failed") return "status-failed";
    return "status-draft";
  }

  function typeLabel(type: string): string {
    if (type === "short-video") return tt("shortVideo");
    if (type === "image-text") return tt("imageText");
    return type;
  }

  function platformLabel(p: string): string {
    if (p === "douyin") return tt("douyin");
    if (p === "xiaohongshu") return tt("xiaohongshu");
    return p;
  }

  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  ];

  function cardGradient(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  }

  onMount(() => {
    const unsub = subscribe(() => { lang = getLanguage(); });
    loadWorks();
    return unsub;
  });
</script>

<div class="works-page">
  <!-- Top bar -->
  <div class="top-bar">
    <h1 class="page-title">{tt("myWorks")}</h1>
    <div class="top-actions">
      <div class="filter-chips">
        <button class="chip" class:active={filter === "all"} onclick={() => filter = "all"}>
          {tt("filterAll")}
        </button>
        <button class="chip" class:active={filter === "creating"} onclick={() => filter = "creating"}>
          {tt("filterCreating")}
        </button>
        <button class="chip" class:active={filter === "ready"} onclick={() => filter = "ready"}>
          {tt("filterReady")}
        </button>
      </div>
      <button class="new-work-btn" onclick={onCreateNew}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {tt("newWork")}
      </button>
    </div>
  </div>

  <!-- Loading -->
  {#if loading}
    <div class="loading-state">
      <div class="loader"></div>
      <p>{tt("loading")}</p>
    </div>
  <!-- Empty state -->
  {:else if filteredWorks.length === 0 && works.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      </div>
      <h3>{tt("createFirstWork")}</h3>
      <p>{tt("noWorks")}</p>
      <button class="cta-btn" onclick={onCreateNew}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {tt("newWork")}
      </button>
    </div>
  {:else if filteredWorks.length === 0}
    <div class="empty-state">
      <p class="empty-filter-text">{tt("noWorks")}</p>
    </div>
  {:else}
    <!-- Gallery grid -->
    <div class="gallery-grid">
      {#each filteredWorks as w}
        <button class="work-card" onclick={() => onOpenStudio(w.id)}>
          <!-- Cover -->
          <div class="card-cover">
            {#if w.coverImage}
              <img src={w.coverImage} alt={w.title} />
            {:else}
              <div class="cover-gradient" style="background: {cardGradient(w.id)};">
                <span class="cover-icon">
                  {#if w.type === "short-video"}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  {:else}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {/if}
                </span>
              </div>
            {/if}
            <span class="status-badge {statusClass(w.status)}">{statusLabel(w.status)}</span>
          </div>

          <!-- Info -->
          <div class="card-body">
            <h3 class="card-title">{w.title}</h3>
            <div class="card-meta">
              <span class="type-badge">{typeLabel(w.type)}</span>
              {#if w.platforms?.length}
                {#each w.platforms as p}
                  <span class="platform-badge">{platformLabel(p)}</span>
                {/each}
              {/if}
            </div>
            <span class="card-date">{new Date(w.updatedAt).toLocaleDateString()}</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .works-page {
    max-width: 1100px;
    margin: 0 auto;
  }

  /* ── Top Bar ──────────────────────────────────────────── */
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .page-title {
    font-size: 1.5rem;
    font-weight: 750;
    letter-spacing: -0.03em;
    color: var(--text);
  }

  .top-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .filter-chips {
    display: flex;
    gap: 0.3rem;
    background: var(--bg-surface);
    border-radius: 12px;
    padding: 0.25rem;
    border: 1px solid var(--border);
  }

  .chip {
    padding: 0.4rem 0.9rem;
    border-radius: 9px;
    border: none;
    background: none;
    color: var(--text-muted);
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 550;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }

  .chip:hover {
    color: var(--text);
    background: var(--bg-hover);
  }

  .chip.active {
    color: var(--accent);
    background: var(--card-bg);
    box-shadow: var(--shadow-sm);
  }

  .new-work-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--accent-gradient);
    color: var(--accent-text);
    border: none;
    padding: 0.55rem 1.25rem;
    border-radius: 12px;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 650;
    cursor: pointer;
    transition: all var(--transition-fast);
    box-shadow: 0 4px 14px rgba(134, 120, 191, 0.25);
    white-space: nowrap;
  }

  .new-work-btn:hover {
    box-shadow: 0 6px 22px rgba(134, 120, 191, 0.35);
    transform: translateY(-1px);
    filter: brightness(1.1);
  }

  /* ── Loading ──────────────────────────────────────────── */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 5rem 0;
    color: var(--text-dim);
  }

  .loader {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Empty State ──────────────────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 5rem 1rem;
    text-align: center;
  }

  .empty-icon {
    color: var(--text-dim);
    opacity: 0.4;
    margin-bottom: 0.5rem;
  }

  .empty-state h3 {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .empty-state p {
    font-size: 0.88rem;
    color: var(--text-muted);
    max-width: 320px;
  }

  .empty-filter-text {
    font-size: 0.88rem;
    color: var(--text-dim);
  }

  .cta-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--accent-gradient);
    color: var(--accent-text);
    border: none;
    padding: 0.65rem 1.5rem;
    border-radius: 12px;
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 650;
    cursor: pointer;
    transition: all var(--transition-fast);
    box-shadow: 0 4px 14px rgba(134, 120, 191, 0.25);
    margin-top: 0.5rem;
  }

  .cta-btn:hover {
    box-shadow: 0 6px 22px rgba(134, 120, 191, 0.35);
    transform: translateY(-1px);
    filter: brightness(1.1);
  }

  /* ── Gallery Grid ─────────────────────────────────────── */
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }

  @media (max-width: 900px) {
    .gallery-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 520px) {
    .gallery-grid { grid-template-columns: 1fr; }
  }

  /* ── Work Card ────────────────────────────────────────── */
  .work-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
    overflow: hidden;
    cursor: pointer;
    transition: all var(--transition-normal);
    text-align: left;
    color: var(--text);
    font-family: inherit;
    padding: 0;
    box-shadow: var(--shadow-sm);
    backdrop-filter: var(--card-blur);
    -webkit-backdrop-filter: var(--card-blur);
  }

  .work-card:hover {
    border-color: rgba(134, 120, 191, 0.3);
    box-shadow: var(--shadow-md), var(--glow);
    transform: translateY(-6px) scale(1.015);
  }

  .work-card:active {
    transform: translateY(-2px) scale(1.005);
    transition-duration: 0.1s;
  }

  /* Cover */
  .card-cover {
    aspect-ratio: 16 / 10;
    position: relative;
    overflow: hidden;
  }

  .card-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform var(--transition-normal);
  }

  .work-card:hover .card-cover img {
    transform: scale(1.05);
  }

  .cover-gradient {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    transition: opacity var(--transition-normal);
  }

  .work-card:hover .cover-gradient {
    opacity: 0.85;
  }

  .cover-icon {
    color: rgba(255, 255, 255, 0.8);
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  }

  .status-badge {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    font-size: 0.62rem;
    font-weight: 700;
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    letter-spacing: 0.04em;
  }

  .status-ready { background: rgba(52, 211, 153, 0.2); color: #34d399; }
  .status-creating { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
  .status-failed { background: rgba(251, 113, 133, 0.2); color: #fb7185; }
  .status-draft { background: rgba(0, 0, 0, 0.55); color: #fff; }

  /* Body */
  .card-body {
    padding: 0.875rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .card-title {
    font-size: 0.9rem;
    font-weight: 650;
    letter-spacing: -0.01em;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.15rem;
  }

  .type-badge,
  .platform-badge {
    font-size: 0.65rem;
    font-weight: 650;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    background: var(--bg-surface);
    color: var(--text-muted);
    border: 1px solid var(--border);
  }

  .type-badge {
    color: var(--accent);
    background: var(--accent-soft);
    border-color: transparent;
  }

  .card-date {
    font-size: 0.72rem;
    color: var(--text-dim);
    font-weight: 500;
    margin-top: 0.1rem;
  }

  @media (max-width: 640px) {
    .top-bar { flex-direction: column; align-items: flex-start; }
    .top-actions { width: 100%; }
  }
</style>
