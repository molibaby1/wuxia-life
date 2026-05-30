# P3 Midlife Experience and Trust Hardening Application Execution Plan

本执行计划由 `docs/PRD/p3-midlife-experience-and-trust-hardening.md` 与 `docs/PRD/p3-midlife-experience-and-trust-hardening.prd.json` 拆分而来。P3 的目标不是扩散玩法规模，而是把当前“能过门禁但仍有明显 warning”的 0-30 体验推进为玩家可信的 0-50 人生模拟。

## Governing Scope

- 保持已完成的 0-30 golden life line，不回退既有黄金线体验。
- 将 deterministic 体验覆盖扩展到 0-50。
- 优先路线只覆盖 orthodox/sect、wandering hero、demonic path。
- 优先处理 death risk、romance/family、simulated payoff、route contradiction 四类信任问题。
- 新增 life memory 只做轻量数据层或最小可读视图，不做大型 UI 改版。
- 不启动前后端分离、数据库、账号、云同步、小程序、生产部署、0-80 全生命周期或商业化工作。

## Frozen Boundaries

- 不把 open questions 直接当成实现任务；需要在对应 define/audit story 内形成明确口径。
- 不批量激活所有 deferred event files。
- 不为兼容旧错误链路做兜底；先找根因。
- 不在业务实现 story 中顺手改相邻系统。
- 文档、报告与交付说明不得包含本地绝对路径。

## Execution Waves

| Wave | Stories | Theme | Depends On |
|---|---|---|---|
| P3-W0 | US-001, US-002 | Baseline and trust target freeze | Approved PRD |
| P3-W1 | US-003, US-004, US-005, US-006 | Death risk audit, rules, telemetry, tuning | P3-W0 |
| P3-W2 | US-007, US-008, US-009, US-010 | Romance/family reachability and regression sample | P3-W0 |
| P3-W3 | US-011, US-012, US-013, US-014 | Simulated key-choice payoff gaps and gate hardening | P3-W0 |
| P3-W4 | US-015, US-016 | Priority-route contradiction audit and fix | P3-W0 |
| P3-W5 | US-017, US-018, US-019, US-020, US-021, US-022, US-023, US-024 | 31-50 simulation, route arcs, and midlife gate | P3-W1, P3-W3, P3-W4 |
| P3-W6 | US-025, US-026, US-027, US-028 | Life memory model, data, UI, and tests | P3-W0; benefits from W1-W5 state fields |
| P3-W7 | US-029, US-030 | Final P3 gate update and closure report | All prior waves |

## Story Execution Rules

1. Execute stories in priority order unless a later audit-only story is explicitly split for parallel discovery.
2. Audit and define stories must not modify business code.
3. Implementation stories must reference the latest approved audit/definition artifact for their theme.
4. Gate-hardening stories must emit actionable failure details, not only pass/fail.
5. UI work in US-027 must stay minimal and browser-verified.
6. Closure in US-030 must compare before/after P3 warning metrics.

## Per-Story Plan

### US-001 Rebaseline P3 Warning Sources

Scope:
- Run current golden-line and experience gates.
- Classify warning sources as death risk, romance/family, payoff, route contradiction, or other.
- Produce a baseline report.

Do not:
- Modify business code.

Validation:
- `npm run gate:golden-line`
- `npm run gate:experience`
- `npm run typecheck`

Done:
- Baseline report summarizes command outputs and warning classification.

### US-002 Define P3 Trust Targets

Scope:
- Define target thresholds for death rate, romance/family achievement, simulated payoff rate, and route contradiction.
- Decide which warnings become blockers during P3 and which remain non-blocking.
- Document target state for 0-50 deterministic scenarios.

Validation:
- `npm run typecheck`

Done:
- Trust target document exists and downstream gates can reference the policy.

### US-003 Audit Death Sources

Scope:
- Inventory active and candidate death or sharp survival-reduction sources.
- Group by route and age range.
- Identify visible warning, avoidable choice, and mitigation coverage.

Do not:
- Modify business code.

Validation:
- `npm run typecheck`

Done:
- Death-source report identifies all before-age-50 sources relevant to P3.

### US-004 Define Death Risk Design Rules

Scope:
- Define early, midlife, and late-life risk rules.
- Define required warning signals and mitigation methods.
- Define unavoidable-death allowance and 0-50 death-rate target.

Validation:
- `npm run typecheck`

Done:
- Death-risk rules are ready for telemetry and tuning stories.

### US-005 Implement Death Risk Telemetry

Scope:
- Record death event id, age, route state, recent key choices, warning status, and mitigation status in simulation output.
- Summarize top death causes in reports.

Validation:
- `npm run typecheck`
- Tests covering death telemetry and report summary.

Done:
- Death-rate warnings can be traced to concrete event causes.

### US-006 Tune Early and Midlife Death Risk

Scope:
- Ensure deterministic 0-50 deaths do not occur without prior warning.
- Add or adjust player-facing risk feedback and mitigation branches for priority routes.
- Make death-rate warning target pass.

Validation:
- `npm run gate:experience`
- `npm run typecheck`
- Tests for changed risk paths.

Done:
- Death remains possible but readable and avoidable in 0-50 deterministic samples.

### US-007 Audit Romance and Family Availability

Scope:
- Inventory runtime-loaded romance/family events.
- Identify route, age, flag, relationship, and choice requirements.
- Find first missing or unlikely deterministic trigger.

Do not:
- Modify business code.

Validation:
- `npm run typecheck`

Done:
- Romance/family availability report identifies the actual chain break.

### US-008 Define Romance and Family Sample Arc

Scope:
- Define one sample romance/family arc before or during ages 31-50.
- Include meeting, trust growth, conflict, commitment or separation, and midlife consequence.
- Support route-specific variations across the three priority routes.

Validation:
- `npm run typecheck`

Done:
- Arc spec has at least 3 player choices and at least 2 later payoffs.

### US-009 Implement Reachable Romance Family Path

Scope:
- Make at least one romance/family path reachable in deterministic 0-50 play.
- Use existing relationship and choice feedback systems.
- Remove hidden impossible requirements found by audit.

Validation:
- `npm run typecheck`
- Tests for deterministic reachability.
- Gate/report confirms `romance_family_achievement_rate` meets target.

Done:
- Relationship content is reachable through normal deterministic play.

### US-010 Add Romance Family Simulation Sample

Scope:
- Add deterministic sample targeting the romance/family arc.
- Include relationship state, key choices, and final relationship/family outcome in output.
- Report completed, separated, or failed outcome.

Validation:
- `npm run typecheck`
- Tests for sample/report behavior.

Done:
- Romance/family regression is visible in deterministic output.

### US-011 Audit Simulated Key-Choice Payoff Gaps

Scope:
- Compare static payoff map expectations with actual 0-30 and 0-50 simulations.
- Identify state writes without simulated payoff.
- Identify payoff events blocked by age, route, condition, or priority.

Do not:
- Modify business code.

Validation:
- `npm run typecheck`

Done:
- Payoff gap report names missing choice/payoff relationships and likely block reasons.

### US-012 Define Payoff Timing Rules

Scope:
- Define maximum recommended age distance between key choice and first payoff.
- Define payoff categories.
- Define minimum simulated payoff rate and missed-payoff reporting format.

Validation:
- `npm run typecheck`

Done:
- Payoff timing rules are ready for hook implementation and gate hardening.

### US-013 Implement Missing Payoff Hooks

Scope:
- Add or adjust payoff hooks for choices with simulated gaps.
- Use existing state, flag, relationship, route, or feedback mechanisms.
- Avoid creating route contradiction.

Validation:
- `npm run typecheck`
- Tests for changed payoff hooks.
- Gate/report confirms simulated payoff target.

Done:
- Simulated key-choice payoff rate reaches P3 target.

### US-014 Harden Payoff Gate

Scope:
- Distinguish static payoff coverage from simulated payoff coverage.
- Fail or block when simulated payoff is below P3 target according to trust targets.
- List missing choice id, expected payoff id, sample id, and likely block reason when available.

Validation:
- `npm run typecheck`
- Tests for gate failure output.

Done:
- Static maps can no longer hide broken simulated player memory.

### US-015 Audit Priority Route Contradictions

Scope:
- Identify deterministic samples with route contradiction warnings.
- Trace exact events and effects that activate conflicting route states.
- Classify root cause as event data, route conflict rules, simulation choice strategy, or fallback behavior.

Do not:
- Modify business code.

Validation:
- `npm run typecheck`

Done:
- Route contradiction audit names concrete events and causes.

### US-016 Fix Priority Route Contradictions

Scope:
- Prevent strong-exclusion routes from being simultaneously active in deterministic 0-50 scenarios.
- Require explicit turn, corruption, redemption, exile, or betrayal events for route transitions.
- Record route state transition reason.

Validation:
- `npm run gate:golden-line`
- `npm run typecheck`
- Tests for route exclusion and transition history.

Done:
- Priority-route contradiction warnings are eliminated or promoted to blockers and fixed.

### US-017 Extend Simulation to Ages 31-50

Scope:
- Let existing deterministic samples run through age 50.
- Separate 0-30 and 31-50 metrics.
- Include event count, choice count, route state, relationship state, death status, and payoff status for 31-50.

Validation:
- `npm run typecheck`
- Tests for age-50 simulation output.

Done:
- Midlife content can be measured independently from youth content.

### US-018 Define Orthodox Sect Midlife Arc

Scope:
- Define ages 31-50 orthodox/sect beats: responsibility, internal pressure, moral compromise, reputation cost, and consequence.
- Include at least 3 event specs, 2 manual choices, and 2 callbacks.

Validation:
- `npm run typecheck`

Done:
- Orthodox/sect implementation story has a concrete midlife arc spec.

### US-019 Implement Orthodox Sect Midlife Arc

Scope:
- Implement at least 3 route-relevant orthodox/sect events between ages 31-50.
- Include at least 2 manual choices and at least 2 callbacks to earlier state.

Validation:
- `npm run typecheck`
- Tests or deterministic sample assertions for route event count, choices, and callbacks.

Done:
- Orthodox/sect deterministic scenario has meaningful midlife obligations and consequences.

### US-020 Define Wandering Hero Midlife Arc

Scope:
- Define ages 31-50 wandering hero beats: old case, public reputation, ally cost, moral dilemma, and consequence.
- Include at least 3 event specs, 2 manual choices, and 2 callbacks.

Validation:
- `npm run typecheck`

Done:
- Wandering hero implementation story has a concrete midlife arc spec.

### US-021 Implement Wandering Hero Midlife Arc

Scope:
- Implement at least 3 route-relevant wandering hero events between ages 31-50.
- Include at least 2 manual choices and at least 2 callbacks to earlier state.

Validation:
- `npm run typecheck`
- Tests or deterministic sample assertions for route event count, choices, and callbacks.

Done:
- Wandering hero deterministic scenario shows cost of freedom and reputation.

### US-022 Define Demonic Path Midlife Arc

Scope:
- Define ages 31-50 demonic path beats: power expansion, social cost, betrayal or temptation, redemption or escalation, and consequence.
- Include at least 3 event specs, 2 manual choices, and 2 callbacks.

Validation:
- `npm run typecheck`

Done:
- Demonic path implementation story has a concrete midlife arc spec.

### US-023 Implement Demonic Path Midlife Arc

Scope:
- Implement at least 3 route-relevant demonic path events between ages 31-50.
- Include at least 2 manual choices, at least 2 callbacks, and readable severe-risk mitigation.

Validation:
- `npm run typecheck`
- Tests or deterministic sample assertions for route event count, choices, callbacks, and risk readability.

Done:
- Demonic path deterministic scenario makes power costly but readable.

### US-024 Add 0-50 Midlife Gate

Scope:
- Gate all priority-route deterministic 0-50 samples.
- Check minimum route events, manual choices, death readability, and route contradiction.
- Output sample id, age, event id, and failed metric.

Validation:
- `npm run typecheck`
- Tests for gate checks and failure output.

Done:
- Midlife content cannot silently regress.

### US-025 Define Life Memory Model

Scope:
- Define categories: route status, key choices, relationships, unresolved debts, risks, and achievements.
- Map existing state fields to categories.
- Define player-facing labels and spoiler hiding rules.

Validation:
- `npm run typecheck`

Done:
- Life memory model is ready for data derivation.

### US-026 Implement Life Memory Summary Data

Scope:
- Add function or module deriving serializable life memory summary from current game state.
- Include available route status, key choices, relationships, unresolved debts, risks, and achievements.
- Avoid raw event ids in player-facing labels.

Validation:
- `npm run typecheck`
- Tests for summary derivation.

Done:
- UI and reports can consume a consistent life memory summary.

### US-027 Display Minimum Life Memory View

Scope:
- Expose a minimum gameplay UI section or panel for life memory.
- Show route status, key choices, relationships, unresolved debts, and risk signals when present.
- Keep layout readable on desktop and mobile without large redesign.

Validation:
- `npm run typecheck`
- Browser verification using the dev-browser workflow.

Done:
- Player can inspect current life summary in the gameplay UI.

### US-028 Add Life Memory Regression Coverage

Scope:
- Test route state, key choice, relationship, and unresolved risk or debt in memory summary.

Validation:
- `npm run typecheck`
- Full relevant test suite.

Done:
- Life memory summary cannot silently disappear from core cases.

### US-029 Update Experience Gates for P3 Completion

Scope:
- Include 0-50 deterministic samples, death readability target, romance/family target, simulated payoff target, and route contradiction target in P3 gate.

Validation:
- `npm run typecheck`
- Tests for final gate policy.

Done:
- Passing P3 gate means the trust standards are enforced.

### US-030 Produce P3 Closure Report

Scope:
- List completed P3 stories.
- Include verification commands and results.
- Compare warning metrics before and after.
- Include 0-50 scenario summaries, remaining risks, and next-phase recommendation.

Validation:
- `npm run typecheck`
- Closure report contains no local absolute paths.

Done:
- Project can decide whether to start frontend/backend separation planning afterward.

## Cross-Wave Risks

- Trust target definitions in US-002 may change whether later warnings block or only report.
- Romance/family implementation depends on whether US-008 chooses an existing named character or a minimal new recurring relationship.
- Route contradiction fixes may affect payoff hooks and midlife route arcs; US-013 and US-016 must coordinate through route state rules.
- Life memory labels depend on player-facing naming decisions and should not expose raw internal ids.
- Gate hardening can make existing warning-level behavior fail; failure output must remain diagnostic enough for future sessions.

