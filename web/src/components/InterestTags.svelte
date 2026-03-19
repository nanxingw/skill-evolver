<script lang="ts">
  let {
    interests = $bindable([]),
    onUpdate,
  }: {
    interests: string[];
    onUpdate: (interests: string[]) => void;
  } = $props();

  const PRESET_TOPICS = [
    "美食", "科技", "穿搭", "美妆", "生活",
    "情感", "职场", "健身", "旅行", "宠物",
    "教育", "游戏", "音乐", "家居", "育儿",
  ];

  let editMode = $state(false);
  let inputValue = $state("");
  let showSuggestions = $state(false);
  let inputEl: HTMLInputElement | undefined = $state(undefined);

  let suggestions = $derived(
    inputValue.trim().length > 0
      ? PRESET_TOPICS.filter(
          (t) =>
            t.includes(inputValue.trim()) &&
            !interests.includes(t)
        )
      : PRESET_TOPICS.filter((t) => !interests.includes(t))
  );

  function toggleEdit() {
    editMode = !editMode;
    if (!editMode) {
      inputValue = "";
      showSuggestions = false;
    } else {
      // focus input after toggle
      setTimeout(() => inputEl?.focus(), 50);
    }
  }

  function removeTag(tag: string) {
    const next = interests.filter((t) => t !== tag);
    interests = next;
    onUpdate(next);
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || interests.includes(trimmed)) return;
    const next = [...interests, trimmed];
    interests = next;
    onUpdate(next);
    inputValue = "";
    showSuggestions = false;
    inputEl?.focus();
  }

  function handleInputKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) addTag(inputValue);
    } else if (e.key === "Escape") {
      showSuggestions = false;
      inputValue = "";
    } else if (e.key === "Backspace" && inputValue === "" && interests.length > 0) {
      removeTag(interests[interests.length - 1]);
    }
  }

  function handleInputFocus() {
    showSuggestions = true;
  }

  function handleInputBlur() {
    // Delay so suggestion clicks register first
    setTimeout(() => { showSuggestions = false; }, 150);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="interest-bar">
  <div class="bar-header">
    <!-- Compass icon + label -->
    <span class="bar-label">
      <svg class="label-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
      </svg>
      我的关注领域
    </span>
    <button class="edit-btn" class:active={editMode} onclick={toggleEdit}>
      {editMode ? "完成" : "编辑"}
    </button>
  </div>

  <div class="tag-row">
    {#if interests.length === 0 && !editMode}
      <span class="empty-hint">点击编辑添加关注领域，获取更精准的趋势推荐</span>
    {/if}

    {#each interests as tag}
      <span class="tag">
        {tag}
        {#if editMode}
          <button class="tag-remove" onclick={() => removeTag(tag)} aria-label="删除 {tag}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        {/if}
      </span>
    {/each}

    {#if editMode}
      <div class="input-wrap">
        <input
          bind:this={inputEl}
          bind:value={inputValue}
          class="tag-input"
          type="text"
          placeholder="添加标签..."
          onkeydown={handleInputKeydown}
          onfocus={handleInputFocus}
          onblur={handleInputBlur}
        />

        {#if showSuggestions && suggestions.length > 0}
          <div class="suggestions">
            {#each suggestions as s}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <button class="suggestion-item" onmousedown={() => addTag(s)}>
                {s}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .interest-bar {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 0.65rem 0.9rem;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid var(--card-border, rgba(255, 255, 255, 0.07));
    border-radius: 12px;
    transition: border-color 0.2s ease;
  }

  .interest-bar:has(.tag-input:focus) {
    border-color: rgba(134, 120, 191, 0.3);
  }

  /* Header row */
  .bar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .bar-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.72rem;
    font-weight: 650;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  .label-icon {
    opacity: 0.6;
    flex-shrink: 0;
  }

  .edit-btn {
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    background: none;
    color: var(--text-dim);
    font-size: 0.72rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .edit-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(134, 120, 191, 0.08);
  }

  .edit-btn.active {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(134, 120, 191, 0.1);
  }

  /* Tag row */
  .tag-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    min-height: 1.75rem;
  }

  .empty-hint {
    font-size: 0.78rem;
    color: var(--text-muted, rgba(255, 255, 255, 0.28));
    font-style: italic;
    line-height: 1.4;
  }

  /* Tags */
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    background: rgba(134, 120, 191, 0.12);
    border: 1px solid rgba(134, 120, 191, 0.2);
    color: var(--accent, #8678bf);
    font-size: 0.78rem;
    font-weight: 580;
    transition: background 0.15s ease, border-color 0.15s ease;
    white-space: nowrap;
  }

  .tag:has(.tag-remove) {
    padding-right: 0.4rem;
  }

  .tag-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: none;
    background: rgba(134, 120, 191, 0.15);
    color: var(--accent, #8678bf);
    cursor: pointer;
    padding: 0;
    transition: background 0.15s ease;
    flex-shrink: 0;
  }

  .tag-remove:hover {
    background: rgba(251, 113, 133, 0.25);
    color: #fb7185;
  }

  /* Inline input */
  .input-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .tag-input {
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font-size: 0.78rem;
    font-family: inherit;
    font-weight: 500;
    width: 90px;
    min-width: 60px;
    padding: 0.2rem 0.2rem;
    transition: width 0.2s ease;
  }

  .tag-input::placeholder {
    color: var(--text-muted, rgba(255, 255, 255, 0.25));
  }

  .tag-input:focus {
    width: 120px;
  }

  /* Suggestions dropdown */
  .suggestions {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 100;
    background: var(--card-bg, rgba(18, 16, 30, 0.92));
    border: 1px solid var(--card-border, rgba(255, 255, 255, 0.08));
    border-radius: 10px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    padding: 0.55rem 0.6rem;
    min-width: 200px;
    max-width: 280px;
    animation: dropIn 0.15s ease;
  }

  @keyframes dropIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .suggestion-item {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.55rem;
    border-radius: 9999px;
    border: 1px solid rgba(134, 120, 191, 0.18);
    background: rgba(134, 120, 191, 0.07);
    color: var(--text-secondary, rgba(255, 255, 255, 0.65));
    font-size: 0.75rem;
    font-weight: 550;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.12s ease;
    white-space: nowrap;
  }

  .suggestion-item:hover {
    background: rgba(134, 120, 191, 0.2);
    border-color: rgba(134, 120, 191, 0.4);
    color: var(--accent, #8678bf);
  }
</style>
