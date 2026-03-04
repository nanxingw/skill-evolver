<script lang="ts">
  import { onMount } from "svelte";
  import { fetchConfig, updateConfig } from "../lib/api";

  let interval: string = $state("1h");
  let model: string = $state("sonnet");
  let autoRun: boolean = $state(false);
  let port: number = $state(3271);
  let saving: boolean = $state(false);
  let message: string = $state("");
  let messageType: "success" | "error" = $state("success");

  onMount(async () => {
    try {
      const c = await fetchConfig();
      interval = c.interval;
      model = c.model;
      autoRun = c.autoRun;
      port = c.port;
    } catch {
      // use defaults
    }
  });

  async function handleSave() {
    saving = true;
    message = "";
    try {
      await updateConfig({ interval, model, autoRun, port });
      message = "Settings saved.";
      messageType = "success";
    } catch {
      message = "Failed to save settings.";
      messageType = "error";
    } finally {
      saving = false;
    }
  }
</script>

<div class="settings">
  <h2>Settings</h2>

  <div class="form">
    <label>
      <span>Interval</span>
      <input type="text" bind:value={interval} placeholder="e.g. 1h, 30m" />
    </label>

    <label>
      <span>Model</span>
      <select bind:value={model}>
        <option value="sonnet">Sonnet</option>
        <option value="opus">Opus</option>
        <option value="haiku">Haiku</option>
      </select>
    </label>

    <label class="toggle-row">
      <span>Auto Run</span>
      <input type="checkbox" bind:checked={autoRun} />
    </label>

    <label>
      <span>Port</span>
      <input type="number" bind:value={port} />
    </label>

    <button class="save-btn" onclick={handleSave} disabled={saving}>
      {saving ? "Saving..." : "Save"}
    </button>

    {#if message}
      <p class="message" class:error={messageType === "error"}>{message}</p>
    {/if}
  </div>
</div>

<style>
  .settings h2 {
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 1rem;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 400px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  label span {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 0.03em;
  }

  input[type="text"],
  input[type="number"],
  select {
    background: var(--bg-surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 0.625rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--accent);
  }

  .toggle-row {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
  }

  .toggle-row input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--accent);
  }

  .save-btn {
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

  .save-btn:hover {
    background: var(--accent-hover);
  }

  .save-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .message {
    font-size: 0.85rem;
    color: var(--accent);
  }

  .message.error {
    color: var(--error);
  }
</style>
