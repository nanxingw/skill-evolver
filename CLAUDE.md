本项目为 **AutoCode** (npm 包名: skill-evolver)，一个为 Claude Code 提供自进化智能的后台系统。

## 项目概览

AutoCode 通过三个并行 Agent（Context Agent / Skill Agent / Task Agent）周期性回顾用户的 Claude Code 对话历史，积累长期记忆、创建技能、调度自主任务。详细架构见 @README.md 和 docs/system-architecture.md。

## 开发规范

- 参考项目: https://github.com/pandazki/pneuma-skills （Claude Code CLI 控制和 skill 部署）
- 前端设计使用 .claude/skills/ui-ux-pro-max/SKILL.md
- 所有测试脚本写在 scripts/ 目录
- npm 发布 access token 在 logs/access_token.txt
- 端到端测试可使用 chrome 浏览器能力
- 版本发布规则：任何小版本发布（0.x.x）都需要口头询问用户意见

## 核心架构

### 三大 Meta-Skill（安装后位于 ~/.claude/skills/）

1. **user-context** — 用户画像：偏好(preference)、目标(objective)、认知(cognition)
   - context/ 存储已确认数据，tmp/ 存储积累中的信号
   - 毕业条件：3+ 信号，跨 2+ 天，无矛盾

2. **skill-evolver** — 技术经验 + 需求驱动技能创建
   - tmp/ 存储 success/failure/tips 经验和 skill_needs.yaml（task→skill 桥梁）
   - 使用 skill-creator 方法论创建技能（eval, description 优化）
   - reference/permitted_skills.md 管理可修改的技能权限

3. **task-planner** — 自主任务调度
   - 任务存储在 ~/.skill-evolver/tasks/tasks.yaml
   - 支持 skill-building task（目的是创建 skill 的任务）
   - relatedSkills / skillTarget 实现 task-skill 协同进化

### 执行引擎

- 通过 child_process.spawn() 调用 claude CLI，bypassPermissions
- 6 种 JobType: evolution, evo-context, evo-skill, evo-task, task, post-task
- stream-json 实时解析输出，事件系统驱动 WebSocket 更新

### Task-Skill 协同进化

Task 执行失败 → post-task review 写入 skill_needs.yaml → Skill Agent 优先处理 → 创建技能 → 未来 Task 引用 relatedSkills → 执行增强。Task Agent 也可直接创建 skill-building task。

## 文件布局

```
src/           — 后端源码 (TypeScript)
web/           — 前端 (Svelte + Vite)
skills/        — meta-skill 源模板（postinstall 复制到 ~/.claude/skills/）
scripts/       — 测试脚本
docs/          — 架构和设计文档（中文）
```

## 设计原则

- 从简设计，YAML 字段优雅精炼
- 证据驱动，积累-毕业制防止冲动修改
- Agent 写权限严格隔离，共享只读访问
- npm 一键安装，包括所有 skill 和 skill-creator
