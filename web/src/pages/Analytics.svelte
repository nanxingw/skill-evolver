<script lang="ts">
  import { onMount } from "svelte";
  import { fetchWorks, type WorkSummary } from "../lib/api";

  let loading = $state(true);
  let works: WorkSummary[] = $state([]);
  let styleProfile: string[] = $state([]);

  // Derived stats
  let totalWorks = $derived(works.length);
  let videoCount = $derived(works.filter(w => w.type === "short-video" || w.type === "long-video").length);
  let imageTextCount = $derived(works.filter(w => w.type === "image-text").length);
  let recentWorks = $derived(
    [...works]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
  );

  // Count by platform - we don't have platform info on WorkSummary, so just show type breakdown
  let draftCount = $derived(works.filter(w => w.status === "draft").length);
  let publishedCount = $derived(works.filter(w => w.status === "published").length);

  const statusLabels: Record<string, string> = {
    draft: "草稿",
    creating: "创建中",
    ready: "待发布",
    publishing: "发布中",
    published: "已发布",
    failed: "失败",
  };

  const statusColors: Record<string, string> = {
    draft: "var(--text-dim)",
    creating: "var(--accent)",
    ready: "#34d399",
    publishing: "#fbbf24",
    published: "#34d399",
    failed: "#fb7185",
  };

  const typeLabels: Record<string, string> = {
    "short-video": "短视频",
    "image-text": "图文",
    "long-video": "长视频",
    livestream: "直播",
  };

  function dispatchOpenStudio(workId: string) {
    const event = new CustomEvent("openStudio", {
      bubbles: true,
      detail: { workId },
    });
    document.dispatchEvent(event);
  }

  async function loadData() {
    loading = true;
    try {
      const [worksData, profileRes] = await Promise.all([
        fetchWorks().catch(() => [] as WorkSummary[]),
        fetch("/api/memory/profile").then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      works = worksData;
      if (profileRes) {
        styleProfile = profileRes.style ?? profileRes.tags ?? [];
      }
    } catch {
      // silently fail
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="analytics">
  <!-- Stats Overview -->
  <div class="stats-row">
    <div class="stat-card">
      <span class="stat-num">{loading ? "—" : totalWorks}</span>
      <span class="stat-label">作品总数</span>
    </div>
    <div class="stat-card">
      <span class="stat-num">{loading ? "—" : videoCount}</span>
      <span class="stat-label">短视频</span>
    </div>
    <div class="stat-card">
      <span class="stat-num">{loading ? "—" : imageTextCount}</span>
      <span class="stat-label">图文</span>
    </div>
    <div class="stat-card">
      <span class="stat-num">{loading ? "—" : draftCount}</span>
      <span class="stat-label">草稿</span>
    </div>
    <div class="stat-card accent">
      <span class="stat-num">{loading ? "—" : publishedCount}</span>
      <span class="stat-label">已发布</span>
    </div>
  </div>

  <!-- Recent Works -->
  <div class="section glass-card">
    <h3 class="sec-title">近期作品</h3>
    {#if loading}
      <div class="loading-inline">
        <div class="loader-sm"></div>
        <span>加载中...</span>
      </div>
    {:else if recentWorks.length === 0}
      <p class="empty-msg">暂无作品。前往工作台创建你的第一个作品。</p>
    {:else}
      <div class="works-grid">
        {#each recentWorks as work, i}
          <button
            class="work-card"
            onclick={() => dispatchOpenStudio(work.id)}
            style="animation-delay: {i * 0.04}s"
          >
            <div class="work-cover">
              <span class="work-type-icon">
                {#if work.type === "short-video" || work.type === "long-video"}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                {:else}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                {/if}
              </span>
            </div>
            <div class="work-info">
              <span class="work-title">{work.title || "未命名作品"}</span>
              <div class="work-meta">
                <span class="work-type-label">{typeLabels[work.type] ?? work.type}</span>
                <span class="work-status" style="color: {statusColors[work.status] ?? 'var(--text-dim)'}">
                  {statusLabels[work.status] ?? work.status}
                </span>
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Memory / Style Profile -->
  {#if styleProfile.length > 0}
    <div class="section glass-card">
      <h3 class="sec-title">风格画像</h3>
      <div class="style-chips">
        {#each styleProfile as tag, i}
          <span class="style-chip" class:primary={i === 0}>{tag}</span>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .analytics {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* ── Stats Row ───────────────────────────────────────────────── */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    .stats-row {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 480px) {
    .stats-row {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .stat-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius, 14px);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    text-align: center;
    backdrop-filter: var(--card-blur);
    -webkit-backdrop-filter: var(--card-blur);
    transition: border-color 0.2s ease, transform 0.2s ease;
  }

  .stat-card:hover {
    border-color: var(--border);
    transform: translateY(-1px);
  }

  .stat-card.accent {
    border-color: rgba(134, 120, 191, 0.25);
  }

  .stat-num {
    font-size: 1.65rem;
    font-weight: 750;
    color: var(--accent);
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
  }

  .stat-label {
    font-size: 0.68rem;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 550;
  }

  /* ── Glass card section ──────────────────────────────────────── */
  .section {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius, 14px);
    padding: 1.25rem 1.375rem;
    box-shadow: var(--shadow-sm);
    backdrop-filter: var(--card-blur);
    -webkit-backdrop-filter: var(--card-blur);
  }

  .sec-title {
    font-size: 0.92rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    letter-spacing: -0.015em;
    color: var(--text);
  }

  .empty-msg {
    font-size: 0.82rem;
    color: var(--text-dim);
    font-weight: 500;
    line-height: 1.6;
    padding: 1rem 0;
    margin: 0;
  }

  .loading-inline {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 1rem 0;
    font-size: 0.82rem;
    color: var(--text-dim);
  }

  .loader-sm {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(134, 120, 191, 0.15);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* ── Works Grid ──────────────────────────────────────────────── */
  .works-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    .works-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .work-card {
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid var(--border-subtle, var(--border));
    border-radius: 12px;
    background: var(--bg-inset, rgba(255, 255, 255, 0.02));
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    padding: 0;
    overflow: hidden;
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    animation: fadeIn 0.3s ease both;
  }

  .work-card:hover {
    border-color: rgba(134, 120, 191, 0.35);
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .work-cover {
    height: 80px;
    background: linear-gradient(135deg, rgba(134, 120, 191, 0.08), rgba(134, 120, 191, 0.02));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .work-type-icon {
    color: var(--text-dim);
    opacity: 0.5;
  }

  .work-info {
    padding: 0.65rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .work-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
  }

  .work-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .work-type-label {
    font-size: 0.68rem;
    color: var(--text-dim);
    font-weight: 550;
  }

  .work-status {
    font-size: 0.68rem;
    font-weight: 650;
  }

  /* ── Style chips ─────────────────────────────────────────────── */
  .style-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .style-chip {
    font-size: 0.82rem;
    font-weight: 550;
    padding: 0.4rem 0.9rem;
    border-radius: 9999px;
    background: rgba(134, 120, 191, 0.1);
    color: var(--accent);
    border: 1px solid transparent;
    transition: all 0.2s ease;
    cursor: default;
  }

  .style-chip:hover {
    background: var(--accent);
    color: var(--accent-text);
  }

  .style-chip.primary {
    background: var(--accent-gradient);
    color: var(--accent-text);
    font-weight: 650;
    box-shadow: 0 4px 14px rgba(134, 120, 191, 0.25);
  }
</style>
