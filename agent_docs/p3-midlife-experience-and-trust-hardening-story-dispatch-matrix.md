# P3 Midlife Experience and Trust Hardening Story Dispatch Matrix

本矩阵用于按 `docs/PRD/p3-midlife-experience-and-trust-hardening.prd.json` 分发 P3 story。每个 story 应单独领取、先只读分析、提交计划、获批后实施。

## Dispatch Rules

- 默认按 priority 从 US-001 到 US-030 执行。
- Audit 与 define story 的交付物是报告或规则文档，不得修改业务代码。
- Implementation 与 gate story 必须引用前置 audit/define 产物。
- 每个 story 完成后记录验证证据，供 US-030 closure 使用。
- 如果发现必须跨 story 扩范围，停止并写入 handoff，不自行扩大实现。

## Matrix

| Story | Priority | Type | Depends On | Main Touchpoints | Required Validation | Done State |
|---|---:|---|---|---|---|---|
| US-001 Rebaseline P3 Warning Sources | 1 | Audit | PRD approval | Gate outputs, baseline report | `npm run gate:golden-line`; `npm run gate:experience`; `npm run typecheck` | Current warnings are classified by trust category |
| US-002 Define P3 Trust Targets | 2 | Definition | US-001 | Trust target policy doc | `npm run typecheck` | Death, romance/family, payoff, and route contradiction targets are explicit |
| US-003 Audit Death Sources | 3 | Audit | US-001 | Event data, simulation reports, death-source report | `npm run typecheck` | Before-age-50 death sources are inventoried by route and age |
| US-004 Define Death Risk Design Rules | 4 | Definition | US-003, US-002 | Death-risk rule doc | `npm run typecheck` | Risk warning, mitigation, unavoidable death, and target rules are defined |
| US-005 Implement Death Risk Telemetry | 5 | Implementation | US-003, US-004 | Simulation output, reports, tests | `npm run typecheck`; tests | Death reports include cause, age, route, choices, warning, and mitigation |
| US-006 Tune Early and Midlife Death Risk | 6 | Implementation | US-004, US-005 | Event branches, feedback text, mitigation paths | `npm run gate:experience`; `npm run typecheck`; tests | 0-50 deterministic deaths are readable and death-rate target passes |
| US-007 Audit Romance and Family Availability | 7 | Audit | US-001 | Runtime events, relationship requirements, report | `npm run typecheck` | First missing or unlikely romance/family trigger is identified |
| US-008 Define Romance and Family Sample Arc | 8 | Definition | US-007, US-002 | Arc spec, route variations | `npm run typecheck` | Sample arc has meeting, growth, conflict, outcome, choices, and payoffs |
| US-009 Implement Reachable Romance Family Path | 9 | Implementation | US-007, US-008 | Relationship events, choice feedback, deterministic sample path | `npm run typecheck`; tests | At least one romance/family path is reachable and meets rate target |
| US-010 Add Romance Family Simulation Sample | 10 | Implementation | US-009 | Deterministic sample, report output | `npm run typecheck`; tests | Gate/report shows completed, separated, or failed relationship outcome |
| US-011 Audit Simulated Key-Choice Payoff Gaps | 11 | Audit | US-001, US-017 if already available | Static payoff map, 0-30/0-50 simulations, report | `npm run typecheck` | Missing simulated payoff causes are listed with block reasons |
| US-012 Define Payoff Timing Rules | 12 | Definition | US-011, US-002 | Payoff rule doc | `npm run typecheck` | Payoff timing, categories, target rate, and reporting format are defined |
| US-013 Implement Missing Payoff Hooks | 13 | Implementation | US-011, US-012, US-016 if route rules changed | Events, state, flags, relationship, route feedback | `npm run typecheck`; tests | Simulated payoff rate reaches P3 target without route contradiction |
| US-014 Harden Payoff Gate | 14 | Gate | US-012, US-013 | Gate scripts, reports, tests | `npm run typecheck`; tests | Static and simulated payoff coverage are separated and actionable |
| US-015 Audit Priority Route Contradictions | 15 | Audit | US-001 | Deterministic samples, route effects, report | `npm run typecheck` | Contradictory samples and exact causes are identified |
| US-016 Fix Priority Route Contradictions | 16 | Implementation | US-015, US-002 | Route rules, event effects, route history, tests | `npm run gate:golden-line`; `npm run typecheck`; tests | Strong-exclusion route contradictions are eliminated or blocked and fixed |
| US-017 Extend Simulation to Ages 31-50 | 17 | Implementation | US-002; coordinate with US-005, US-014, US-016 | Simulation samples, metrics, reports | `npm run typecheck`; tests | Samples run to age 50 with separate 0-30 and 31-50 metrics |
| US-018 Define Orthodox Sect Midlife Arc | 18 | Definition | US-017, US-016 | Route arc spec | `npm run typecheck` | Orthodox/sect arc has 3 specs, 2 choices, and 2 callbacks |
| US-019 Implement Orthodox Sect Midlife Arc | 19 | Implementation | US-018, US-017 | Orthodox/sect events, deterministic sample assertions | `npm run typecheck`; tests | Orthodox/sect sample reaches required midlife events, choices, and callbacks |
| US-020 Define Wandering Hero Midlife Arc | 20 | Definition | US-017, US-016 | Route arc spec | `npm run typecheck` | Wandering hero arc has 3 specs, 2 choices, and 2 callbacks |
| US-021 Implement Wandering Hero Midlife Arc | 21 | Implementation | US-020, US-017 | Wandering hero events, deterministic sample assertions | `npm run typecheck`; tests | Wandering hero sample reaches required midlife events, choices, and callbacks |
| US-022 Define Demonic Path Midlife Arc | 22 | Definition | US-017, US-016, US-004 | Route arc spec | `npm run typecheck` | Demonic path arc has 3 specs, 2 choices, and 2 callbacks |
| US-023 Implement Demonic Path Midlife Arc | 23 | Implementation | US-022, US-017, US-004 | Demonic path events, risk feedback, deterministic sample assertions | `npm run typecheck`; tests | Demonic sample reaches required midlife events and readable severe-risk branches |
| US-024 Add 0-50 Midlife Gate | 24 | Gate | US-017, US-019, US-021, US-023, US-016 | Gate scripts, deterministic samples, reports | `npm run typecheck`; tests | Gate checks priority-route 0-50 samples and prints actionable failures |
| US-025 Define Life Memory Model | 25 | Definition | US-002; benefits from US-016 and US-017 | Memory model spec, player-facing label rules | `npm run typecheck` | Categories, state sources, labels, and spoiler rules are defined |
| US-026 Implement Life Memory Summary Data | 26 | Implementation | US-025 | Summary derivation module/function, tests | `npm run typecheck`; tests | Serializable summary derives route, choices, relationships, debts, risks, achievements |
| US-027 Display Minimum Life Memory View | 27 | UI | US-026 | Gameplay UI, responsive layout | `npm run typecheck`; browser verification | Minimum memory panel/section is readable on desktop and mobile |
| US-028 Add Life Memory Regression Coverage | 28 | Tests | US-026, US-027 if UI state is involved | Unit/integration tests | `npm run typecheck`; tests | Route, key choice, relationship, and risk/debt coverage exists |
| US-029 Update Experience Gates for P3 Completion | 29 | Gate | US-024, US-010, US-014, US-016, US-028 | Final P3 gate policy and scripts | `npm run typecheck`; tests | Final gate enforces 0-50, death, romance/family, payoff, and contradiction targets |
| US-030 Produce P3 Closure Report | 30 | Closure | US-001 through US-029 | Closure report, verification evidence | `npm run typecheck` | Report lists completed stories, before/after metrics, scenario summaries, risks, and recommendation |

## Parallelization Notes

- US-003, US-007, US-011, and US-015 are separate audits and can be prepared in parallel after US-001, but their implementation follow-ups should wait for US-002 trust targets.
- US-018, US-020, and US-022 are route arc definition stories and can be drafted in parallel after US-017 and US-016 establish simulation and route coherence boundaries.
- US-019, US-021, and US-023 may be implemented in parallel only if they do not modify shared route rules or shared gate policy in conflicting ways.
- US-025 and US-026 can begin after state-field boundaries are clear, but US-027 should wait until the data summary shape is stable.

## Handoff Evidence Required Per Story

- Story id and title.
- Files changed or report files produced.
- Validation commands and results.
- Any PRD acceptance criteria not completed.
- Any blocked decision from PRD open questions.
- Any residual risk that US-030 should include.

