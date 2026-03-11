# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-03-09

### Added
- Multi-agent parallel evolution architecture (Context Agent, Skill Agent, Task Agent)
- Proactive task scheduling system with cron and one-shot task support
- Bidirectional skill-task linkage: tasks emit skill_needs signals, skills enhance task execution
- skill-creator integration: Skill Agent now uses skill-creator methodology for all skill work
- External skill search via SkillHub (skillhub.club) before creating new skills
- AutoCode Dashboard: renamed from Skill-Evolver Dashboard

### Changed
- Renamed project from skill-evolver to AutoCode
- npm package: skill-evolver → @nanxingw/autocode-cli (autocode-cli was taken by unrelated project)
- CLI command: skill-evolver → autocode (old command preserved as alias)

### Fixed
- postinstall no longer overwrites runtime-updated permitted_skills.md
- task-planner runtime_guide.md: corrected task file path (centralized tasks.yaml)

## [0.1.7] - 2026-03-04

### Added
- Initial skill-evolver release with single-agent evolution cycle
- user-context, skill-evolver, task-planner core skills
- WebSocket dashboard for real-time monitoring
