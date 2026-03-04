const BASE = "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchStatus() {
  return request<{
    state: string;
    lastRun: string | null;
    nextRun: string | null;
    isSchedulerActive: boolean;
  }>("/api/status");
}

export async function triggerEvolution() {
  return request<{ triggered: boolean }>("/api/trigger", { method: "POST" });
}

export async function fetchReports() {
  const data = await request<{ reports: { filename: string; date: string }[] }>("/api/reports");
  return data.reports;
}

export async function fetchReport(filename: string) {
  return request<{ filename: string; content: string }>(
    `/api/reports/${encodeURIComponent(filename)}`
  );
}

export async function fetchContext(pillar: string) {
  return request<{
    context: unknown[];
    tmp: unknown[];
  }>(`/api/context/${encodeURIComponent(pillar)}`);
}

export async function fetchSkills() {
  const data = await request<{ skills: { name: string; exists: boolean }[] }>("/api/skills");
  return data.skills;
}

export async function fetchConfig() {
  return request<{
    interval: string;
    model: string;
    autoRun: boolean;
    port: number;
    maxReports: number;
    reportsToFeed: number;
  }>("/api/config");
}

export async function updateConfig(config: Record<string, unknown>) {
  return request<Record<string, unknown>>("/api/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
}
