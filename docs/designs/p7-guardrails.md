# P7 Guardrails (US-005)

## Allowed P7 mechanisms

- Short-duration **active actions** (training, study, socializing minimum set)
- Action → state delta → optional **disturbance** (single random event modifier)
- Month/quarter/short-stage time advancement for ordinary progression
- Attribute visibility tiers + self-awareness fuzzy/precise display
- Choice lock UI + requirement explanations (no raw expressions)
- Condition cache hash covering all direct player properties
- Report fields for source kind, action distribution, annual jump diagnostics
- Type-only extension hooks for talents/items/worldbuilding (no full implementation)

## Prohibited P7 mechanisms

- Complete talent system, inventory, equipment, or open-world map
- Batch rewrite of all event JSON files
- Full visual redesign or new UI shell
- P6B backend / API / cloud save changes
- Default ordinary progression = +1 year fallback
- Random-only multi-year chains without returning to action loop
- Hardcoded route suggestions disconnected from active runtime content

## Random events role

Random/formal events become **disturbances and opportunities** triggered after or instead of idle stretches — not the primary life driver. Player-chosen actions carry planning intent.

## Ordinary progression rule

Default advancement unit is **month or quarter**. Full-year jumps require explicit milestone metadata (`duration.unit === 'year'` or event `priority === CRITICAL` with defined `time_advance`).

## Validation by wave

| Wave | Required validation |
| --- | --- |
| W0 | Baseline docs only; no business code |
| W1 | typecheck + action resolver tests |
| W2 | annual jump regression check + simulator same-year records |
| W3 | typecheck + condition cache drift tests |
| W4 | locked choice UI + tradeoff metadata on actions |
| W5 | report causal fields + distribution checks |
| W6 | closure simulation 0–30 with active action path |
