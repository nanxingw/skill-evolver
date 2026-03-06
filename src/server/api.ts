import { Hono } from "hono";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import yaml from "js-yaml";
import { executor, runEvolutionCycle } from "../executor.js";
import { isSchedulerRunning, getNextRun, reschedule } from "../scheduler.js";
import { listReports, readReport, getReportsDir } from "../reports.js";
import { loadConfig, saveConfig, type Config } from "../config.js";
import {
  listTasks, getTask, createTask as storeCreateTask, updateTask as storeUpdateTask,
  deleteTask as storeDeleteTask, listRuns, readRun, listArtifacts, readArtifact,
  getArtifactsDir, getRunsDir, addRejected, listIdeas,
  type Task,
} from "../task-store.js";
import { buildTaskPrompt } from "../prompt.js";

export const apiRoutes = new Hono();

// GET /api/status
apiRoutes.get("/api/status", (c) => {
  const nextRun = getNextRun();
  return c.json({
    state: executor.state,
    lastRun: executor.lastRun?.toISOString() ?? null,
    nextRun: nextRun?.toISOString() ?? null,
    isSchedulerActive: isSchedulerRunning(),
  });
});

// POST /api/trigger
apiRoutes.post("/api/trigger", (c) => {
  runEvolutionCycle().catch(() => {
    // errors emitted via executor events
  }).finally(() => {
    // Reschedule so next auto-run is interval-after-this-run
    reschedule();
  });
  return c.json({ triggered: true });
});

// GET /api/reports
apiRoutes.get("/api/reports", async (c) => {
  try {
    const reports = await listReports();
    return c.json({
      reports: reports.map((r) => ({
        filename: r.filename,
        date: r.date.toISOString(),
      })),
    });
  } catch {
    return c.json({ reports: [] });
  }
});

// GET /api/reports/:filename
apiRoutes.get("/api/reports/:filename", async (c) => {
  const filename = c.req.param("filename");
  try {
    const content = await readReport(filename);
    return c.json({ filename, content });
  } catch {
    return c.json({ error: "Report not found" }, 404);
  }
});

// GET /api/context/:pillar
apiRoutes.get("/api/context/:pillar", async (c) => {
  const pillar = c.req.param("pillar");
  const home = homedir();
  const userContextBase = join(home, ".claude", "skills", "user-context");
  const skillEvolverBase = join(home, ".claude", "skills", "skill-evolver");

  const pillarMap: Record<string, { context?: string; tmp?: string }> = {
    preference: {
      context: join(userContextBase, "context", "preference.yaml"),
      tmp: join(userContextBase, "tmp", "preference_tmp.yaml"),
    },
    objective: {
      context: join(userContextBase, "context", "objective.yaml"),
      tmp: join(userContextBase, "tmp", "objective_tmp.yaml"),
    },
    cognition: {
      context: join(userContextBase, "context", "cognition.yaml"),
      tmp: join(userContextBase, "tmp", "cognition_tmp.yaml"),
    },
    success_experience: {
      tmp: join(skillEvolverBase, "tmp", "success_experience.yaml"),
    },
    failure_experience: {
      tmp: join(skillEvolverBase, "tmp", "failure_experience.yaml"),
    },
    useful_tips: {
      tmp: join(skillEvolverBase, "tmp", "useful_tips.yaml"),
    },
  };

  const paths = pillarMap[pillar];
  if (!paths) {
    return c.json({ error: "Unknown pillar" }, 404);
  }

  async function loadYaml(filePath: string): Promise<unknown[]> {
    try {
      const raw = await readFile(filePath, "utf-8");
      const parsed = yaml.load(raw) as { entries?: unknown[] } | null;
      return parsed?.entries ?? [];
    } catch {
      return [];
    }
  }

  const context = paths.context ? await loadYaml(paths.context) : [];
  const tmp = paths.tmp ? await loadYaml(paths.tmp) : [];

  return c.json({ context, tmp });
});

// GET /api/skills
apiRoutes.get("/api/skills", async (c) => {
  const home = homedir();
  const permittedPath = join(
    home,
    ".claude",
    "skills",
    "skill-evolver",
    "reference",
    "permitted_skills.md",
  );
  const skillsBase = join(home, ".claude", "skills");

  try {
    const raw = await readFile(permittedPath, "utf-8");
    const skillNames = raw
      .split("\n")
      .filter((line) => /^[-*]\s+\S/.test(line))
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter((name) => name.length > 0 && !name.startsWith("("));

    const skills = await Promise.all(
      skillNames.map(async (name) => {
        const skillMdPath = join(skillsBase, name, "SKILL.md");
        let exists = false;
        try {
          await readFile(skillMdPath, "utf-8");
          exists = true;
        } catch {
          exists = false;
        }
        return { name, exists };
      }),
    );

    return c.json({ skills });
  } catch {
    return c.json({ skills: [] });
  }
});

// GET /api/config
apiRoutes.get("/api/config", async (c) => {
  const config = await loadConfig();
  return c.json(config);
});

// PUT /api/config
apiRoutes.put("/api/config", async (c) => {
  const body = await c.req.json<Partial<Config>>();
  const current = await loadConfig();
  const updated: Config = { ...current, ...body };
  await saveConfig(updated);
  return c.json(updated);
});

// ---------------------------------------------------------------------------
// Task API
// ---------------------------------------------------------------------------

// GET /api/tasks
apiRoutes.get("/api/tasks", async (c) => {
  const status = c.req.query("status");
  try {
    const tasks = await listTasks(status ? { status } : undefined);
    return c.json({ tasks });
  } catch {
    return c.json({ tasks: [] });
  }
});

// GET /api/tasks/:id
apiRoutes.get("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const task = await getTask(id);
    return c.json(task);
  } catch {
    return c.json({ error: "Task not found" }, 404);
  }
});

// POST /api/tasks
apiRoutes.post("/api/tasks", async (c) => {
  try {
    const body = await c.req.json();
    const task = await storeCreateTask(body);
    return c.json(task, 201);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Failed to create task" }, 400);
  }
});

// PUT /api/tasks/:id
apiRoutes.put("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const body = await c.req.json();
    const task = await storeUpdateTask(id, body);
    return c.json(task);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Task not found" }, 404);
  }
});

// DELETE /api/tasks/:id
apiRoutes.delete("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  try {
    await storeDeleteTask(id);
    return c.json({ deleted: true });
  } catch {
    return c.json({ error: "Task not found" }, 404);
  }
});

// POST /api/tasks/:id/approve
apiRoutes.post("/api/tasks/:id/approve", async (c) => {
  const id = c.req.param("id");
  try {
    const task = await storeUpdateTask(id, { status: "active", approved: true });
    return c.json(task);
  } catch {
    return c.json({ error: "Task not found" }, 404);
  }
});

// POST /api/tasks/:id/reject
apiRoutes.post("/api/tasks/:id/reject", async (c) => {
  const id = c.req.param("id");
  try {
    const task = await getTask(id);
    await addRejected({
      name: task.name,
      reason: "Rejected by user via dashboard",
      similarity_keywords: task.tags ?? [],
    });
    await storeUpdateTask(id, { status: "expired" as Task["status"] });
    return c.json({ rejected: true });
  } catch {
    return c.json({ error: "Task not found" }, 404);
  }
});

// POST /api/tasks/:id/trigger
apiRoutes.post("/api/tasks/:id/trigger", async (c) => {
  const id = c.req.param("id");
  try {
    const task = await getTask(id);
    const config = await loadConfig();
    const artifactsDir = await getArtifactsDir(id);
    const runsDir = await getRunsDir(id);
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
    const reportPath = join(runsDir, `${ts}.md`);
    const prompt = buildTaskPrompt(task, artifactsDir, reportPath);
    const job = {
      id: `task-${id}-${Date.now()}`,
      type: "task" as const,
      prompt,
      model: task.model || config.model,
      taskId: id,
      taskName: task.name,
    };
    // Run asynchronously
    executor.run(job).catch(() => { /* errors emitted via events */ });
    return c.json({ triggered: true });
  } catch {
    return c.json({ error: "Task not found" }, 404);
  }
});

// GET /api/tasks/:id/runs
apiRoutes.get("/api/tasks/:id/runs", async (c) => {
  const id = c.req.param("id");
  try {
    const runs = await listRuns(id);
    return c.json({
      runs: runs.map((r) => ({
        filename: r.filename,
        date: r.date.toISOString(),
      })),
    });
  } catch {
    return c.json({ runs: [] });
  }
});

// GET /api/tasks/:id/runs/:filename
apiRoutes.get("/api/tasks/:id/runs/:filename", async (c) => {
  const id = c.req.param("id");
  const filename = c.req.param("filename");
  try {
    const content = await readRun(id, filename);
    return c.json({ filename, content });
  } catch {
    return c.json({ error: "Run not found" }, 404);
  }
});

// GET /api/tasks/:id/artifacts
apiRoutes.get("/api/tasks/:id/artifacts", async (c) => {
  const id = c.req.param("id");
  try {
    const artifacts = await listArtifacts(id);
    return c.json({ artifacts });
  } catch {
    return c.json({ artifacts: [] });
  }
});

// POST /api/tasks/:id/artifacts/open
apiRoutes.post("/api/tasks/:id/artifacts/open", async (c) => {
  const id = c.req.param("id");
  try {
    const dir = await getArtifactsDir(id);
    const { exec: execCb } = await import("node:child_process");
    execCb(`open "${dir}"`);
    return c.json({ opened: true });
  } catch {
    return c.json({ error: "Failed to open artifacts" }, 500);
  }
});

// GET /api/ideas
apiRoutes.get("/api/ideas", async (c) => {
  try {
    const ideas = await listIdeas();
    return c.json({ ideas });
  } catch {
    return c.json({ ideas: [] });
  }
});
