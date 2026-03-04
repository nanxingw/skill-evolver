# Skill Evolver — Runtime Guide

When you are assisting the user in a normal Claude Code session, use the stored technical experience to **avoid known pitfalls and apply proven patterns**. This guide explains how.

---

## 1. When to Consult Experience

- **Before trying a risky or unfamiliar approach** — check `tmp/failure_experience.yaml` to see if this approach has failed before.
- **When planning how to implement something** — check `tmp/success_experience.yaml` for proven patterns.
- **When stuck or looking for shortcuts** — check `tmp/useful_tips.yaml` for non-obvious techniques.
- **When working with a specific technology** — filter entries by `applicable_to` tags to find relevant experience.

---

## 2. How to Read the Data

All files are at `~/.claude/skills/skill-evolver/tmp/`.

### Success experience

```
tmp/success_experience.yaml
```

Each entry describes an approach that has worked well. Entries with higher `times_seen` and broader `applicable_to` are more reliable.

**How to apply**: When planning an approach, check if there's a matching success pattern. Prefer approaches that have been validated across multiple sessions.

### Failure experience

```
tmp/failure_experience.yaml
```

Each entry describes an approach that has failed or caused problems.

**How to apply**: Before trying an approach, scan failure entries for warnings. If a matching failure is found, avoid that approach or take explicit precautions. Mention the known risk to the user if relevant.

### Useful tips

```
tmp/useful_tips.yaml
```

Each entry is a non-obvious shortcut, workaround, or technique.

**How to apply**: When working in a relevant technology area, check tips for productivity gains. Apply them naturally without over-explaining — just use the better approach.

---

## 3. Using `applicable_to` Tags

Each entry has an `applicable_to` array (e.g., `["typescript"]`, `["git", "workflow"]`, `["general"]`).

- Filter by the technologies you're currently working with.
- `["general"]` entries apply broadly — always worth considering.
- If an entry's tags don't match your current work, skip it.

---

## 4. Checking Evolved Skills

The evolution process may have created standalone skills from accumulated experience. These are registered in:

```
reference/permitted_skills.md
```

Check this file to see what skills have been created. Those skills will have their own SKILL.md in `~/.claude/skills/<skill-name>/` with detailed, actionable instructions.

---

## 5. Important Rules

- **Do not modify** any tmp files or reference files during normal runtime. Modifications are only performed during evolution cycles.
- **Weight entries by evidence strength.** An entry with `times_seen: 5` across multiple dates is much more reliable than one with `times_seen: 1`.
- **Current user instructions always take priority.** If the user explicitly asks for an approach that contradicts a stored pattern, follow the user. The evolution cycle will handle any needed updates.
- **Don't over-cite experience.** Apply knowledge naturally. Don't say "according to my failure experience database..." — just avoid the bad approach and use the good one.
