# Childhood Payoff Spine 7–13 — Content Contract

Theme-owned content contract for ages **7–13** golden-line childhood band (Slice C).

## Band Purpose

Fill the low-impact gap between early childhood agency (age 7 active_action) and youth route entry (age 13 `sect_path_choice`) with **identity/route/milestone** beats that:

1. Fire reliably in headless P8 progression (priority ≥ 1000, age_reach + once-flag)
2. Count as pacing impact (`choice` type and/or impact keywords in auto copy)
3. Support multi-route balance (martial vs scholar/social/business signals)

## Required Spine Anchors (post–Slice C)

| Age | Event ID | Type | Impact mechanism |
| --- | --- | --- | --- |
| 8 | `childhood_summary` / `martial_focus_payoff` | auto | allowlist / 回响 keyword |
| **9** | **`childhood_path_signal`** | **choice** | choice + 身份/路线 copy |
| 10 | `preteen_training` | auto | allowlist + 武道/里程碑 copy |
| **11** | **`pre_youth_milestone`** | **choice** | choice + 身份/里程碑 copy |
| 12 | `late_childhood_prep` | auto | 路线/身份 copy |
| 13 | `youth_begins` / `sect_path_choice` | auto + choice | 身份 copy + choice |

## Authoring Rules

- New band events: `category: main_story`, `metadata.tags` includes `payoff`, `milestone`, `golden_spine`
- Choice events: exactly 2 options, each writes durable flag, no narrow route-only gates
- Auto enrichments: title/text must include at least one of `路线`, `身份`, `里程碑`, `武道`
- Do not wire deferred `prologue.json` wholesale; adapt beats into `general.json` if needed

## Escalation

If new choice milestones fail to fire in audit: **runtime** spine-mandatory scheduling slice (not tuning).

Generated: 2026-06-23.
