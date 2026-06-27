# P56 Ordinary-Origin Growth Scope Contract (US-002)

Generated: 2026-06-27

## Stage Definition

P56 is a **growth wave** for the three already-proven ordinary origins. It is NOT a remediation stage — P25 Wave 4 minimum acceptance is already Met.

## In Scope

### Origins Handled
1. `farm_peasant` — rural hardship, constitution-focused
2. `town_apprentice` — craft/trade, comprehension-focused
3. `tavern_hand` — social/network, charisma-focused

### Allowed Layers

| Layer | Description | Examples |
|-------|-------------|----------|
| **Story Configuration** | Add midlife fork events to existing config files | `ordinary-origin-early-life.json` extensions, spine entries |
| **Light Presentation** | Add readable signals on existing surfaces | `currentGoal` branches, `life-memory` labels, summary text |
| **Validation Scripts** | Narrow regression tests and verification artifacts | `tests/p56OrdinaryOriginGrowthTests.ts`, verification slice docs |

### Configuration Additions
- 2+ midlife signals per origin (minimum 1 fork per origin)
- 1+ player-facing expression per origin (currentGoal/life-memory/summary)
- 1+ regression test per origin
- 1 verification artifact covering all three origins

## Out of Scope (Forbidden)

| Forbidden Item | Rationale |
|----------------|-----------|
| Fourth ordinary origin | P56 explicitly limits to three existing origins |
| Sample-line work | PRD §3 Non-Goals: "不重开 sample-line 轨" |
| Full ordinary-life system | PRD §3: "不扩成全量平民社会 / 地图 / 职业系统" |
| Bulk deferred event wiring | PRD §3: "不做平台化、调度器重写或全量 deferred 事件接线" |
| New origin framework | PRD §4 US-006: "不引入新的 origin framework" |
| UI component additions | PRD §4 US-007: "不新增 UI 组件" |
| Runtime platform changes | PRD §3: "不做 runtime 平台化或事件池批量激活" |
| gate:playability / guard:sample-lines-baseline logic changes | Explicit constraint |

## Boundary Constraints

1. **P25 Wave 4 minimum remains valid and unchanged** — P56 adds depth, does not replace or weaken existing acceptance
2. **Ordinary ↔ vivid boundary preserved** — Do not rewrite ordinary origins into vivid origins (e.g., peasant → martial family)
3. **Reuse existing harness** — All tests reuse P25/origin/simulation infrastructure
4. **No cross-stage contamination** — P56 does not modify merchant_magnate, sample-line, or other stage artifacts

## Acceptance Criteria

- [ ] All three origins have 2+ midlife signals/forks defined
- [ ] All three origins have 1+ player-facing expression
- [ ] Configuration is in existing files under `src/data/lines/`
- [ ] Tests are in new file `tests/p56OrdinaryOriginGrowthTests.ts`
- [ ] `npm run guard:sample-lines-baseline` passes
- [ ] `npm run typecheck` passes
- [ ] No existing P25 regression evidence is degraded
