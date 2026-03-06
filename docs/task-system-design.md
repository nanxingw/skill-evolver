# Task System Design

> skill-evolver 的第三大核心能力：基于记忆的主动任务调度系统

## 1. 动机

skill-evolver 目前有两个能力维度：
- **user-context** — 知道用户是谁（偏好、目标、认知）
- **skill-evolver** — 知道什么有效什么无效（成功/失败经验）

缺少的第三维度：**主动行动**。系统拥有关于用户的丰富记忆，但只能被动等待用户发起请求。Task 系统让 agent 能够基于积累的记忆，主动为用户安排和执行任务。

## 2. Task 模型

### 2.1 核心数据结构

```yaml
# ~/.claude/skills/task-planner/tasks/{id}.yaml
id: "t_20260306_1530_abc"       # 时间戳 + 随机后缀
name: "每日AI新闻收集"            # 人类可读的短名称，用于 dashboard/report 显示
description: "收集今天最新的AI领域新闻，整理成简报发送到指定位置"

# 调度
type: "recurring"                # recurring | one-shot
schedule: "0 8 * * *"           # cron 表达式 (recurring)
# scheduled_at: "2026-03-07T08:00:00+08:00"  # ISO 时间 (one-shot)

# 执行
prompt: |
  你是一个新闻收集助手。请收集今天最新的AI领域重要新闻...
model: "sonnet"                  # 可覆盖全局 model，默认继承 config.model

# 来源与审批
source: "agent"                  # user | agent
status: "pending"                # pending | active | paused | completed | failed | expired
approved: true                   # 默认自动批准（taskAutoApprove: true）

# 元数据
created_at: "2026-03-06T15:30:00+08:00"
last_run: null
next_run: "2026-03-07T08:00:00+08:00"
run_count: 0
max_runs: null                   # null = 无限 (recurring), 1 (one-shot 自动设为1)
tags: ["news", "daily"]

# 关联记忆（agent 创建时记录推理依据）
memory_ref: "objective: User is building OMNE — AI agent memory evaluation framework"
```

### 2.2 Task 状态机

```
[agent/user 创建]
       |
       v (autoApprove=true)          (autoApprove=false, agent only)
   ┌────────┐                    ┌─────────┐
   │ active │<───── approve ─────│ pending  │
   └────┬───┘      + edit        └─────┬───┘
        |                              |
        |  ┌──── user edit ────┐       | user reject
        |  │  (修改 name,      │       v
        |  │   prompt, cron,   │  ┌─────────┐
        |  │   model 等,       │  │ expired │
        |  │   未执行时可改)    │  └─────────┘
        |  └───────────────────┘
        |
   scheduler picks up
        |
   ┌────┴───┐
   │running │ (执行中，非持久状态，在内存中)
   └────┬───┘
        |
   ┌────┼────────┐
   v    v        v
 [ok] [fail]  [timeout]
   |    |        |
   v    v        v
  ┌──────────┐  ┌──────────┐
  │completed │  │  failed  │
  │(one-shot)│  │(可重试)   │
  └──────────┘  └──────────┘
        |
  (recurring? → 重新计算 next_run → active)
```

**编辑规则：**
- `pending` 和 `active` 状态的任务均可编辑（name, description, prompt, schedule, model, tags）
- `running` 状态的任务不可编辑（正在执行中）
- `completed` / `failed` 的 one-shot 任务不可编辑（已终态），但可复制为新任务
- 编辑 `active` 的 recurring 任务会立即重新计算 `next_run`

**审批：** 默认 `taskAutoApprove: true`，所有任务直接进入 `active`。用户可关闭此选项，使 agent 提议的任务进入 `pending`，支持先编辑再审批。

### 2.3 执行结果

每次执行产出一份 report，交付物存放在 task 级别的共享目录中：

```
~/.claude/skills/task-planner/
  tasks/
    t_20260306_1530_abc.yaml              # 任务定义
    t_20260306_1530_abc/
      artifacts/                          # task 级共享交付物目录
        ai_news_2026-03-07.md             #   各次 run 共享，可累积
        ai_news_2026-03-08.md
        src/                              #   follow-up run 可以继续在此修改
      runs/                               # 每次执行的报告（纯 .md）
        2026-03-07_08-00.md
        2026-03-08_09-00.md
```

**设计要点：**
- `artifacts/` 在 task 级别共享，不按 run 隔离。follow-up task 执行时可以直接访问和增量修改前次产出，保持连续性。
- `runs/` 只存 report（纯 .md 文件），不嵌套目录。每次执行一定会产出一份 report，但不一定有新 artifact（如纯代码修改类任务只需 report 记录做了什么）。
- 单个任务最多保留 **20 份** report，FIFO 淘汰。artifacts 不自动清理（由 agent 或用户管理）。

Report 格式：
```markdown
# 每日AI新闻收集 — 2026-03-07 08:00

**Duration:** 122s | **Status:** success | **Model:** sonnet

## What was done
收集了5条AI领域重要新闻，整理为简报。

## Artifacts changed
- `ai_news_2026-03-07.md` — 新增：今日AI新闻汇总
- `summary.txt` — 更新：追加今日摘要

## Notes
明天可以关注 Google I/O 的 AI 相关发布。
```

对于无额外交付物的任务（如代码修改），report 本身就是唯一产出：
```markdown
# OMNE test coverage 修复 — 2026-03-07 10:30

**Duration:** 245s | **Status:** success | **Model:** opus

## What was done
在 task/t_xxx 分支上修复了 3 个失败的测试用例。

## Branch
`task/t_20260306_1530_abc` — 3 commits, ready for review

## Notes
建议用户 review 后合并到 main。
```

### 2.4 交付物访问

Dashboard 通过后端 API 提供交付物的浏览和打开能力：

```
GET  /api/tasks/:id/artifacts              # 列出 task 的所有交付物
GET  /api/tasks/:id/artifacts/:path        # 读取单个文件内容
POST /api/tasks/:id/artifacts/open         # 在 Finder 中打开 artifacts 目录
GET  /api/tasks/:id/runs                   # 列出所有 report
GET  /api/tasks/:id/runs/:filename         # 读取单份 report
```

`/open` 端点在服务端执行 `open <artifacts_path>`（macOS），直接在 Finder 中打开对应文件夹。

```
┌─ 每日AI新闻收集 ──────────────────────────────────────┐
│                                                        │
│  Artifacts (3 files)              [Open Folder]        │
│  ├── ai_news_2026-03-07.md                             │
│  ├── ai_news_2026-03-08.md                             │
│  └── summary.txt                                       │
│                                                        │
│  Recent Runs                                           │
│  ├── 2026-03-08 09:00 — success (98s)  [View Report]  │
│  └── 2026-03-07 08:00 — success (122s) [View Report]  │
└────────────────────────────────────────────────────────┘
```

## 3. 调度器架构

### 3.1 Evolution-Task 反馈闭环

这是整个系统的核心编排逻辑。Evolution 和 Task 不是独立运行的两个子系统，而是形成一个**紧密耦合的反馈闭环**：

```
┌─────────────────────────────────────────────────────────────┐
│                  Evolution-Task Feedback Loop                │
│                                                             │
│  ┌─────────────┐                                            │
│  │  Evolution   │── 1. 回顾 session logs, 更新记忆          │
│  │   Cycle      │── 2. 审查已完成 task 的产出和效果         │
│  │              │── 3. 从 idea buffer 中毕业成熟的想法为 task│
│  │              │── 4. 向 idea buffer 添加新想法             │
│  │              │── 5. 规划 ≤1 个 one-shot task              │
│  │              │      (scheduled before next cycle)         │
│  └──────┬──────┘                                            │
│         │                                                   │
│         │ agent-planned task 在本 cycle 到下一 cycle 间执行  │
│         v                                                   │
│  ┌─────────────┐                                            │
│  │    Task      │── 独立 Claude 实例执行                     │
│  │  Execution   │── 产出 artifacts + report                 │
│  └──────┬──────┘                                            │
│         │                                                   │
│         │ task 完成后立即触发                                │
│         v                                                   │
│  ┌─────────────┐                                            │
│  │  Post-Task   │── 精简 cycle: 聚焦 task 结果审查          │
│  │   Cycle      │── 更新记忆 (成功/失败经验)                │
│  │              │── 判断是否需要 follow-up task              │
│  │              │── 重置 evolution interval timer            │
│  └──────┬──────┘                                            │
│         │                                                   │
│         v                                                   │
│  [等待下一个 scheduled cycle 或 cron task]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**关键规则：**

1. **Agent-planned task 的时间约束**：evolution cycle 中 agent 规划的 one-shot task 的 `scheduled_at` 必须在当前时刻到下一个 evolution cycle 之间。这确保了 task 产出能在下一个 cycle 中被审查。

2. **Task 完成触发 post-task cycle**：任何 task 执行完毕后，立即触发一个 post-task evolution cycle。这个 cycle 带有额外上下文（刚完成的 task report + artifacts 摘要），让 agent 能立即评估结果、更新经验。

3. **防级联（debounce）**：如果距离上一个 cycle 完成不足 **5 分钟**，则不触发 post-task cycle，而是将待审查的 task 结果排队，留给下一个 scheduled cycle 处理。这防止 "cycle → plan task → task completes → cycle → plan task → ..." 的无限循环。

4. **Interval timer 重置**：每次 cycle（无论是 scheduled 还是 post-task）完成后，evolution interval timer 重新开始计时。

### 3.2 统一调度器

```
┌──────────────────────────────────────────┐
│           Unified Scheduler              │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │       Priority Queue              │  │
│  │    (sorted by next_run ASC)       │  │
│  │                                   │  │
│  │  1. task_abc       08:00  (cron)  │  │
│  │  2. task_agent_x   08:25  (once)  │  │
│  │  3. evolution      09:00  (int.)  │  │
│  │  4. task_def       10:00  (cron)  │  │
│  └────────────────────────────────────┘  │
│               │                          │
│          tick (每30s)                    │
│               │                          │
│               v                          │
│  ┌────────────────────────────────────┐  │
│  │       Execution Pool              │  │
│  │    (parallel, max 3 concurrent)   │  │
│  │                                   │  │
│  │  slot 1: [evolution cycle]        │  │
│  │  slot 2: [task_abc running]       │  │
│  │  slot 3: [idle]                   │  │
│  └────────────────────────────────────┘  │
│               │                          │
│          on task_end                     │
│               │                          │
│               v                          │
│  ┌────────────────────────────────────┐  │
│  │     Post-Task Trigger             │  │
│  │  (debounce 5min, queue if busy)   │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

**关键设计决策：**

- **适度并行**：允许同时运行多个 Claude 实例（默认 max 3），充分利用 agent 能力
- **优先级**：`user 手动触发 > post-task cycle > scheduled task > evolution cycle`
- **Tick 间隔**：每 30 秒检查一次队列，判断是否有到期任务
- **无人为限制**：不设 timeout 和 max_turns，信任 Claude Code 自行判断任务完成度
- **Post-task 触发**：task 完成后自动插入一个高优先级的 post-task evolution cycle

### 3.3 Cron 解析

引入轻量 cron 解析（不引入新依赖，自行实现 5 字段 cron 子集）：

```
┌───────── 分 (0-59)
│ ┌─────── 时 (0-23)
│ │ ┌───── 日 (1-31)
│ │ │ ┌─── 月 (1-12)
│ │ │ │ ┌─ 周几 (0-6, 0=Sun)
│ │ │ │ │
* * * * *
```

支持的语法子集：
- 精确值：`30 8 * * *`（每天 8:30）
- 逗号列表：`0 8,20 * * *`（每天 8:00 和 20:00）
- 间隔：`*/30 * * * *`（每 30 分钟）
- 通配符：`*`

不支持（过于复杂，暂不需要）：
- 范围 `1-5`
- `L`, `W`, `#` 等扩展语法

### 3.4 Scheduled Item 类型

```typescript
interface ScheduledItem {
  id: string;
  type: "evolution" | "post-task" | "task";
  priority: number;      // 0=手动触发, 1=post-task, 2=scheduled task, 3=evolution
  next_run: Date;
  taskId?: string;       // task / post-task 类型持有
  taskReport?: string;   // post-task 类型持有：刚完成的 task report 路径
}
```

现有的 `startScheduler(interval)` 改为 `scheduler.start()`，内部同时管理 evolution interval、所有 active task 的 cron/one-shot 计划、以及 post-task 触发。

### 3.5 文件变更

```
src/
  scheduler.ts        → 重写：统一调度器 + post-task trigger + debounce
  orchestrator.ts     → 重命名为 executor.ts，泛化为通用 Claude 执行器
  task-store.ts       → 新增：Task CRUD，YAML 读写，runs 管理
  cron.ts             → 新增：cron 解析器
  prompt.ts           → 扩展：buildTaskPrompt() + buildPostTaskPrompt()
  config.ts           → 扩展：新增 task 相关配置
  cli.ts              → 扩展：新增 task 子命令
  server/api.ts       → 扩展：新增 /api/tasks/* 路由
  server/ws.ts        → 扩展：新增 task 相关事件
```

## 4. task-planner Skill 设计

### 4.1 定位

第三个 meta-skill，安装在 `~/.claude/skills/task-planner/`。

**三重用途：**
- **Runtime（日常会话）** — 用户讨论计划或需求时，agent 可调用此 skill 帮用户创建结构化任务
- **Evolution（后台演化）** — 演化 agent 在每次 cycle 中执行任务规划，从 idea buffer 毕业想法、规划 task
- **Post-Task（任务审查）** — task 完成后的 cycle 中，审查产出质量，决定是否需要 follow-up

### 4.2 文件结构

```
~/.claude/skills/
  task-planner/
    SKILL.md                        # Router: 描述 + metadata
    reference/
      runtime_guide.md              # 日常会话中如何规划任务
      evolution_guide.md            # 演化周期中如何提议任务
      task_schema.md                # Task YAML 格式规范
    buffer/                         # Idea Buffer — 想法孵化池
      ideas.yaml                    # 积累中的任务想法
    tasks/                          # 实际任务数据
      _rejected.yaml                # 被拒绝的提议记录
      t_xxx.yaml                    # 任务定义
      t_xxx/runs/                   # 运行记录
```

### 4.3 SKILL.md 设计

```markdown
---
name: task-planner
description: >
  Task planning intelligence with idea incubation. Maintains an idea
  buffer for accumulating potential task candidates, graduates mature
  ideas into executable tasks, and reviews completed task outputs.
  Use this skill when planning recurring workflows, scheduling
  automated tasks, when the evolution agent needs to suggest
  proactive tasks, or when reviewing task execution results.
triggers:
  - user discusses scheduling, automation, or recurring tasks
  - user asks "help me plan" or "what should I do next"
  - evolution cycle reaches task-planning phase
  - post-task cycle needs to review completed task output
  - user wants to create a background task
---
```

### 4.4 Idea Buffer — 备忘便签

轻量级的想法记录，仅作为 agent 的上下文备忘，避免跨 cycle 遗忘曾经想到过什么。不设毕业规则，agent 自行判断什么时候值得把一个想法变成 task。

```yaml
# ~/.claude/skills/task-planner/buffer/ideas.yaml
entries:
  - idea: "每周自动生成 OMNE 评测进度报告"
    reason: "用户频繁手动检查评测状态"
    added: "2026-03-06"

  - idea: "每天早上收集 AI 领域新闻"
    reason: "用户关注 AI memory 领域的最新进展"
    added: "2026-03-05"

  - idea: "定期清理 ~/.claude/projects 中过大的 session 日志"
    reason: "用户重视磁盘效率"
    added: "2026-03-06"
```

**使用方式：**
- Agent 每次 cycle 读取此文件作为上下文，回忆之前考虑过什么
- 随时可以添加新想法、删除过时的、或直接把某个想法变成 task
- 没有严格的规则，完全交由 agent 判断

### 4.5 Evolution Guide 核心逻辑

演化 agent 在每次 cycle 中执行以下任务规划流程：

```
1. 读取 buffer/ideas.yaml — 回忆之前想到过什么
2. 读取 tasks/ 下现有 tasks — 避免重复
3. 读取 _rejected.yaml — 避免重复提议
4. 结合本次 session 分析和用户记忆，自由判断：
   - 有新想法？→ 添加到 buffer
   - 某个 buffer 中的想法值得做了？→ 创建 task，从 buffer 移除
   - 某个想法过时了？→ 从 buffer 移除
   - 不需要规划？→ 跳过，完全没问题
5. 如果创建了 one-shot task:
   scheduled_at 应在当前到下一个 cycle 之间
   （确保产出能在 post-task cycle 中被审查）
6. 在 evolution report 中简要记录 task 相关的决策
```

**原则：**
- 不设硬性配额，agent 自行判断是否值得创建 task
- 不重复提议已被拒绝的类似任务（30 天内）
- 提议附带 `memory_ref` 说明推理来源

### 4.6 Post-Task Cycle Guide

task 完成后触发的 post-task cycle 中，agent 额外执行：

```
1. 读取刚完成的 task report + artifacts 摘要
   （由 prompt 自动注入，无需手动查找）

2. 评估 task 完成质量：
   - 是否成功完成了预期目标？
   - artifacts 是否有用？
   - 有哪些经验可以记录？

3. 更新 skill-evolver 经验：
   - 成功 → success_experience 新增信号
   - 失败 → failure_experience 新增信号
   - 有用技巧 → useful_tips 新增信号

4. 判断是否需要 follow-up：
   - 任务部分完成？→ 可以规划一个补充 task
   - 发现新问题？→ 添加到 idea buffer
   - 完美完成？→ 无需行动

5. 在 report 中记录审查结论
```

### 4.7 Runtime Guide 核心逻辑

日常会话中，当用户讨论计划性内容时：

```
1. 读取 task_schema.md 了解任务格式
2. 与用户确认任务细节：
   - 名称和描述
   - 一次性还是重复？
   - 如果重复，频率是什么？（转换为 cron）
   - 具体要做什么？（生成 prompt）
   - 用什么 model？
3. 生成 task YAML
4. 调用 skill-evolver CLI 或直接写入文件：
   skill-evolver task create --file <path>
   或直接写入 ~/.claude/skills/task-planner/tasks/
5. 告知用户任务已创建，可在 dashboard 查看
```

## 5. 执行器改造

### 5.1 Executor（原 Orchestrator）

将 `orchestrator.ts` 泛化，使其既能执行 evolution cycle，也能执行 task：

```typescript
interface ExecutionJob {
  type: "evolution" | "post-task" | "task";
  prompt: string;
  model: string;
  // task / post-task 特有
  taskId?: string;
  taskName?: string;
  taskReport?: string;  // post-task: 刚完成的 task report 内容
}

class Executor extends EventEmitter {
  running: Map<string, ExecutionJob> = new Map();  // 支持并行

  async run(job: ExecutionJob): Promise<ExecutionResult> {
    // 与现有 runEvolutionCycle 逻辑相同
    // 参数化 prompt, model
    // 不设 timeout/maxTurns，信任 Claude 自行完成
    // 事件: job_start, job_progress, job_end, job_error
    // job_end 时如果 type=task，通知 scheduler 触发 post-task cycle
  }

  get activeCount(): number { return this.running.size; }
}
```

### 5.2 Task Prompt 构建

```typescript
function buildTaskPrompt(task: Task, artifactsDir: string, reportPath: string): string {
  return `You are executing a scheduled task for the user.

Task: ${task.name}
Description: ${task.description}

${task.prompt}

## Output Requirements
- Artifacts directory (shared across runs): ${artifactsDir}
  Previous artifacts from earlier runs may already exist here — you can read, modify, or build upon them.
- Write your execution report to: ${reportPath}
  The report is ALWAYS required. Use the format: task name, duration, status, what was done, artifacts changed, notes.
- If this task has no file deliverables (e.g. code changes), the report alone is sufficient.
- Take as much time as needed to produce high-quality results.

## Source File Safety
- NEVER directly modify the user's source files or source code in-place
- If the task requires code changes, create a new git branch first (e.g. task/${task.id}), make changes there
- If the task requires modifying non-code files, create a copy in the artifacts directory first
- The user's working tree and main branch must remain untouched`;
}
```

### 5.3 Post-Task Prompt 构建

```typescript
function buildPostTaskPrompt(
  task: Task,
  taskReport: string,
  recentReports: string[]
): string {
  return `You are running a POST-TASK evolution cycle.
A scheduled task just completed. Your primary job is to review its output,
update your experience, and determine if follow-up action is needed.

## Completed Task
Name: ${task.name}
Description: ${task.description}
Task ID: ${task.id}

## Task Report
${taskReport}

## Your Task
1. **Review task output** — Evaluate quality and completeness of the task results
2. **Update experience** — Record success/failure signals in skill-evolver tmp/
3. **Check follow-up** — If the task was partially completed or revealed new needs,
   add ideas to task-planner buffer or plan a one-shot follow-up task
4. **Update memory** — If the task result reveals new user context signals, record them
5. **Write report** — Summarize your review to the reports directory

${recentReports.length > 0 ? "## Recent Reports for context\n" + recentReports.join("\n\n") : ""}`;
}
```

## 6. API 与 Dashboard

### 6.1 新增 API

```
GET    /api/tasks                    # 列出所有任务（支持 ?status=active 过滤）
GET    /api/tasks/:id                # 获取单个任务详情
POST   /api/tasks                    # 创建任务
PUT    /api/tasks/:id                # 更新任务（编辑、暂停、恢复）
DELETE /api/tasks/:id                # 删除任务
POST   /api/tasks/:id/approve        # 审批 agent 提议的任务
POST   /api/tasks/:id/reject         # 拒绝 agent 提议的任务
POST   /api/tasks/:id/trigger        # 立即执行一次
GET    /api/tasks/:id/runs                    # 获取 report 列表
GET    /api/tasks/:id/runs/:filename           # 读取单份 report
GET    /api/tasks/:id/artifacts                # 列出 task 级交付物
GET    /api/tasks/:id/artifacts/:path          # 读取单个交付物
POST   /api/tasks/:id/artifacts/open           # Finder 打开 artifacts 目录
```

### 6.2 WebSocket 事件

```
task_created       — 新任务创建（含 agent 提议 / buffer 毕业）
task_start         — 任务开始执行
task_progress      — 任务执行进度
task_end           — 任务执行完成
task_error         — 任务执行失败
task_pending       — 新的待审批任务（dashboard 可显示通知）
post_task_trigger  — task 完成后触发 post-task cycle
idea_graduated     — idea 从 buffer 毕业为 task
```

### 6.3 Dashboard 新页面：Tasks

```
┌─────────────────────────────────────────────────────┐
│  Tasks                                    [+ New]   │
│                                                     │
│  ┌─ Pending Approval (1) ─────────────────────────┐ │
│  │ [Agent提议] 每周OMNE评测结果汇总              │ │
│  │ 基于: objective "building OMNE"                │ │
│  │ Schedule: 每周一 09:00                         │ │
│  │                    [Approve] [Reject] [Edit]   │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ Active (2) ───────────────────────────────────┐ │
│  │                                                │ │
│  │  每日AI新闻收集          recurring  08:00      │ │
│  │  Last: 2h ago (success)  Next: tomorrow 08:00  │ │
│  │                          [Pause] [Run] [Edit]  │ │
│  │                                                │ │
│  │  Git仓库周清理            recurring  Sun 10:00 │ │
│  │  Last: 5d ago (success)  Next: Sun 10:00       │ │
│  │                          [Pause] [Run] [Edit]  │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ Recent Runs ──────────────────────────────────┐ │
│  │  [08:02] 每日AI新闻收集 — success (122s)       │ │
│  │  [07:41] Evolution Cycle — success (245s)      │ │
│  │  [Sun]  Git仓库周清理 — success (89s)          │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**创建任务表单：**

```
┌─ Create Task ──────────────────────────────────┐
│                                                │
│  Name:     [                              ]    │
│  Type:     ( ) One-shot   (x) Recurring        │
│  Schedule: [0 8 * * *    ] (cron)              │
│            helper: 每天 08:00                   │
│  Model:    [config default ▼]                  │
│                                                │
│  Prompt:                                       │
│  ┌────────────────────────────────────────┐    │
│  │ 收集今天最新的AI领域新闻...            │    │
│  │                                        │    │
│  └────────────────────────────────────────┘    │
│                                                │
│  Tags:     [news, daily                   ]    │
│                                                │
│                        [Cancel]  [Create]       │
└────────────────────────────────────────────────┘
```

## 7. 演化周期整合

### 7.1 三种 Cycle 类型

| Cycle 类型 | 触发方式 | 核心职责 | Prompt |
|-----------|---------|---------|--------|
| **Regular Evolution** | 定时 interval / 手动触发 | 完整演化：logs 回顾 + 记忆更新 + idea buffer + task 规划 | `buildPrompt()` + task planning 追加 |
| **Post-Task** | task 完成后自动触发 | 聚焦审查：task 结果评估 + 经验更新 + follow-up 判断 | `buildPostTaskPrompt()` |
| **Manual** | 用户 dashboard/CLI 触发 | 同 Regular Evolution | 同上 |

### 7.2 扩展后的 Evolution Prompt

在现有 evolution prompt 末尾追加两个步骤：

```
5. **Task Planning** — Read the task-planner skill.
   - Read ~/.claude/skills/task-planner/buffer/ideas.yaml to recall previous thoughts
   - Read existing tasks and _rejected.yaml to avoid duplicates
   - Based on your analysis, freely decide:
     * Add new ideas to buffer, remove stale ones
     * Turn a buffer idea into an actual task if it feels right
     * Plan a new one-shot task directly if there's clear value
       (schedule it before the next evolution cycle)
   - No strict quotas — use your judgment
   - Record what you did in the evolution report
```

### 7.3 Post-Task Cycle 时序

```
  task completes at T
         │
         │  check: last cycle ended < 5min ago?
         │
    ┌────┴─────┐
    │          │
   YES         NO
    │          │
    v          v
  queue for   trigger post-task
  next cycle  cycle immediately
              │
              v
         post-task cycle runs
         (review task output, update experience)
              │
              v
         reset evolution interval timer
         next regular cycle = T + cycle_duration + interval
```

### 7.4 Rejected Tasks 记录

```yaml
# ~/.claude/skills/task-planner/tasks/_rejected.yaml
entries:
  - name: "每日新闻收集"
    rejected_at: "2026-03-06T16:00:00+08:00"
    reason: "user_reject"              # user_reject | expired
    similarity_keywords: ["news", "daily", "收集"]
```

Agent 提议前先读取此文件，避免重复提议相似任务。30 天后自动清理。

## 8. Config 扩展

```yaml
# ~/.skill-evolver/config.yaml
interval: "1h"
model: "opus"
autoRun: true
port: 3271
maxReports: 50
reportsToFeed: 5

# Task 相关 (新增)
taskAutoApprove: true          # agent 提议的任务默认自动批准
taskMaxConcurrent: 3           # 最大并行 Claude 实例数（含 evolution）
taskMaxRunsPerTask: 20         # 每个任务最多保留的运行报告数
postTaskDebounce: 300          # post-task cycle 防级联冷却时间（秒），默认 5 分钟
```

## 9. CLI 扩展

```bash
# 任务管理
skill-evolver task list                    # 列出所有任务
skill-evolver task list --status active    # 按状态过滤
skill-evolver task create                  # 交互式创建任务
skill-evolver task create --file task.yaml # 从文件创建
skill-evolver task run <id>                # 立即执行
skill-evolver task pause <id>              # 暂停
skill-evolver task resume <id>             # 恢复
skill-evolver task delete <id>             # 删除（需确认）
skill-evolver task approve <id>            # 审批
skill-evolver task reject <id>             # 拒绝
```

## 10. 文件结构总览

```
~/.skill-evolver/
  config.yaml
  daemon.pid
  daemon.log
  reports/                          # evolution 报告（不变）

~/.claude/skills/
  user-context/      (不变)
  skill-evolver/     (不变)
  task-planner/      (新增)
    SKILL.md
    reference/
      runtime_guide.md
      evolution_guide.md
      task_schema.md
    buffer/                         # Idea Buffer — 想法孵化池
      ideas.yaml                    # 积累中的任务想法
    tasks/                          # 任务数据（task-planner 自管理）
      _rejected.yaml                # 被拒绝的提议记录
      t_20260306_1530_abc.yaml      # 任务定义
      t_20260306_1530_abc/
        artifacts/                  # task 级共享交付物
        runs/                       # 每次执行的 report (.md)
          2026-03-07_08-00.md

src/                                # 项目源码变更
  scheduler.ts       → 重写：统一调度器
  executor.ts        → 重命名自 orchestrator.ts，泛化
  orchestrator.ts    → 删除（被 executor.ts 替代）
  task-store.ts      → 新增
  cron.ts            → 新增：cron 解析器
  prompt.ts          → 扩展
  config.ts          → 扩展
  cli.ts             → 扩展
  server/api.ts      → 扩展
  server/ws.ts       → 扩展

web/src/
  pages/Tasks.svelte → 新增
  App.svelte         → 新增导航项
```

## 11. 实现顺序

分 4 个阶段，每阶段可独立验证：

### Phase 1: 基础设施
1. 实现 `cron.ts` — cron 解析与 next-run 计算
2. 实现 `task-store.ts` — Task CRUD + runs/artifacts 管理
3. 重构 `orchestrator.ts` → `executor.ts` — 泛化执行器（支持 evolution/post-task/task 三种 job）
4. 重写 `scheduler.ts` — 统一调度 + post-task trigger + debounce
5. 扩展 `config.ts` — 新增 task 配置字段

### Phase 2: API + CLI
1. 扩展 `server/api.ts` — 全部 task API + artifacts API + open endpoint
2. 扩展 `server/ws.ts` — task + post-task 事件广播
3. 扩展 `cli.ts` — task 子命令
4. 扩展 `prompt.ts` — buildTaskPrompt() + buildPostTaskPrompt()

### Phase 3: Dashboard
1. 新建 `Tasks.svelte` — 任务列表 + 创建 + 编辑 + 审批 + artifacts 浏览 + Open Folder
2. 更新 `App.svelte` — 导航
3. 更新 `Dashboard.svelte` — 显示 pending tasks 通知 + idea buffer 概览

### Phase 4: task-planner Skill + 反馈闭环
1. 编写 `SKILL.md` + `reference/` 下的三个 guide
2. 初始化 `buffer/ideas.yaml`
3. 扩展 evolution prompt — 追加 idea buffer 管理 + task planning
4. 实现 post-task prompt — task 结果审查
5. 实现 `_rejected.yaml` 管理逻辑
6. 将 skill 加入 `postinstall.ts` 自动安装

## 12. 边界与约束

- **安全**：task prompt 由用户或 agent 生成，执行时使用 `--dangerously-skip-permissions`，与 evolution 相同的信任模型
- **充分信任**：不设 timeout 和 max_turns，让 Claude Code 用尽可能长的时间高质量完成任务；适度并行（默认 max 3）
- **存储**：每个任务最多 20 份 run 目录，FIFO 淘汰；rejected 记录 30 天过期
- **agent 提议**：agent 自行判断，idea buffer 仅作备忘上下文，默认自动批准
- **源文件安全**：task 执行时禁止直接修改用户源文件/源代码，需创建 git 分支或副本
- **反馈闭环**：task 完成 → post-task cycle（5 分钟 debounce 防级联）→ 审查结果 → 更新经验 → 可能的 follow-up
- **向后兼容**：现有的 evolution-only 用户不受影响，task + buffer 功能完全增量添加
- **向后兼容**：现有的 evolution-only 用户不受影响，task 功能完全增量添加
