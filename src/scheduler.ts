import { orchestrator } from "./orchestrator.js";

let timer: ReturnType<typeof setTimeout> | null = null;
let intervalMs: number = 0;
let nextRunTime: Date | null = null;
let active: boolean = false;

export function parseIntervalMs(interval: string): number {
  const match = interval.match(/^(\d+)(m|h)$/);
  if (!match) {
    throw new Error(`Invalid interval format: "${interval}". Use e.g. "30m", "1h", "2h".`);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (unit === "m") {
    if (value <= 0 || value > 59) throw new Error("Minute interval must be 1-59");
    return value * 60 * 1000;
  }
  // unit === "h"
  if (value <= 0 || value > 23) throw new Error("Hour interval must be 1-23");
  return value * 60 * 60 * 1000;
}

function scheduleNext(): void {
  if (!active || intervalMs <= 0) return;
  if (timer) clearTimeout(timer);

  nextRunTime = new Date(Date.now() + intervalMs);
  timer = setTimeout(async () => {
    timer = null;
    nextRunTime = null;
    if (orchestrator.state === "running") {
      // Already running (e.g. manual trigger in progress) — wait and retry
      timer = setTimeout(() => scheduleNext(), 60_000);
      return;
    }
    try {
      await orchestrator.runEvolutionCycle();
    } catch {
      // errors emitted via orchestrator events
    }
    // After cycle completes, schedule the next one
    scheduleNext();
  }, intervalMs);
}

export function startScheduler(interval: string): void {
  stopScheduler();
  intervalMs = parseIntervalMs(interval);
  active = true;
  scheduleNext();
}

export function reschedule(): void {
  // Reset the timer so next run is interval-after-now
  // Called after manual triggers or config changes
  if (active && intervalMs > 0) {
    scheduleNext();
  }
}

export function stopScheduler(): void {
  active = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  nextRunTime = null;
  intervalMs = 0;
}

export function isSchedulerRunning(): boolean {
  return active;
}

export function getNextRun(): Date | null {
  return nextRunTime;
}
