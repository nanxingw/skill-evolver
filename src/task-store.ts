// Task store — manages persistent task definitions
// This module will be fully implemented alongside the task system.
// For now it provides the types and stubs needed by executor/scheduler/prompt.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import yaml from "js-yaml";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TaskSchedule {
  type: "cron" | "one-shot";
  cron?: string;       // 5-field cron expression (for type=cron)
  at?: string;         // ISO date string (for type=one-shot)
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  schedule?: TaskSchedule;
  status: "active" | "paused" | "completed" | "running";
  runCount: number;
  lastRun?: string;    // ISO date string
  createdAt: string;   // ISO date string
}

// ── Storage ──────────────────────────────────────────────────────────────────

const TASKS_DIR = join(homedir(), ".skill-evolver", "tasks");
const TASKS_FILE = join(TASKS_DIR, "tasks.yaml");

interface TasksFile {
  tasks: Task[];
}

async function ensureTasksDir(): Promise<void> {
  await mkdir(TASKS_DIR, { recursive: true });
}

async function readTasksFile(): Promise<TasksFile> {
  await ensureTasksDir();
  try {
    const raw = await readFile(TASKS_FILE, "utf-8");
    const parsed = yaml.load(raw) as TasksFile | null;
    return parsed ?? { tasks: [] };
  } catch {
    return { tasks: [] };
  }
}

async function writeTasksFile(data: TasksFile): Promise<void> {
  await ensureTasksDir();
  const raw = yaml.dump(data, { lineWidth: -1 });
  await writeFile(TASKS_FILE, raw, "utf-8");
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function listTasks(): Promise<Task[]> {
  const data = await readTasksFile();
  return data.tasks;
}

export async function getTask(id: string): Promise<Task | undefined> {
  const data = await readTasksFile();
  return data.tasks.find(t => t.id === id);
}

export async function createTask(task: Task): Promise<void> {
  const data = await readTasksFile();
  data.tasks.push(task);
  await writeTasksFile(data);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
  const data = await readTasksFile();
  const idx = data.tasks.findIndex(t => t.id === id);
  if (idx === -1) return undefined;
  data.tasks[idx] = { ...data.tasks[idx], ...updates };
  await writeTasksFile(data);
  return data.tasks[idx];
}

export async function deleteTask(id: string): Promise<boolean> {
  const data = await readTasksFile();
  const before = data.tasks.length;
  data.tasks = data.tasks.filter(t => t.id !== id);
  if (data.tasks.length === before) return false;
  await writeTasksFile(data);
  return true;
}

// ── Run history ──────────────────────────────────────────────────────────────

export interface RunInfo {
  filename: string;
  date: Date;
}

export async function listRuns(taskId: string): Promise<RunInfo[]> {
  const dir = join(TASKS_DIR, taskId, "reports");
  try {
    await mkdir(dir, { recursive: true });
    const { readdir: rd } = await import("node:fs/promises");
    const files = await rd(dir);
    return files
      .filter(f => f.endsWith("_report.md"))
      .map(filename => {
        const match = filename.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2})_report\.md$/);
        const date = match
          ? new Date(`${match[1]}T${match[2].replace("-", ":")}:00`)
          : new Date(0);
        return { filename, date };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch {
    return [];
  }
}

export async function readRun(taskId: string, filename: string): Promise<string> {
  return readFile(join(TASKS_DIR, taskId, "reports", filename), "utf-8");
}

// ── Artifacts ────────────────────────────────────────────────────────────────

export function getArtifactsDir(taskId: string): string {
  return join(TASKS_DIR, taskId, "artifacts");
}

export async function listArtifacts(taskId: string): Promise<string[]> {
  const dir = getArtifactsDir(taskId);
  try {
    await mkdir(dir, { recursive: true });
    const { readdir: rd } = await import("node:fs/promises");
    return await rd(dir);
  } catch {
    return [];
  }
}

export async function readArtifact(taskId: string, filename: string): Promise<string> {
  return readFile(join(getArtifactsDir(taskId), filename), "utf-8");
}

// ── Ideas / Rejected ─────────────────────────────────────────────────────────

const IDEAS_FILE = join(TASKS_DIR, "ideas.yaml");
const REJECTED_FILE = join(TASKS_DIR, "_rejected.yaml");

export async function listIdeas(): Promise<unknown[]> {
  try {
    const raw = await readFile(IDEAS_FILE, "utf-8");
    const parsed = yaml.load(raw) as { ideas?: unknown[] } | null;
    return parsed?.ideas ?? [];
  } catch {
    return [];
  }
}

export async function addRejected(entry: { idea: string; reason: string; date: string }): Promise<void> {
  await ensureTasksDir();
  let entries: unknown[] = [];
  try {
    const raw = await readFile(REJECTED_FILE, "utf-8");
    const parsed = yaml.load(raw) as { entries?: unknown[] } | null;
    entries = parsed?.entries ?? [];
  } catch { /* empty */ }
  entries.push(entry);
  const raw = yaml.dump({ entries }, { lineWidth: -1 });
  await writeFile(REJECTED_FILE, raw, "utf-8");
}
