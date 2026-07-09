# PRD: P116 Wuxia Founding Patriarch Late-Life Design-First Contract

> **Derived from:** `docs/test-reports/p115-founding-patriarch-midlife-pressure-closure-report.md`, `docs/PRD/p114-founding-patriarch-pressure-contract.md`, `agent_docs/p115-wuxia-founding-patriarch-midlife-pressure-playable-implementation-discovery-result.md`
> **Stage slug:** `p116-wuxia-founding-patriarch-late-life-design-first`
> **Gaps addressed:** GAP-P115-N01, GAP-P115-N02
> **Stage type:** bounded design-first contract stage for founding_patriarch late-life

## 1. Introduction

P115 has closed the midlife pressure playable segment for `founding_patriarch` and verified bounded regressions. Discovery still marks end-state as OPEN under North Star §8, so the next minimal stage is to lock late-life direction before implementation.

P116 is design-first only: define late-life contract, branch semantics, gating interfaces, and P117 validation shape. No runtime wiring in this stage.

## 2. Goals

- Define a bounded late-life design-first contract for `founding_patriarch`
- Specify late-life event direction and branch semantics based on pressure outcomes
- Lock checkpoint/flag interfaces and payoff-to-late-life continuity constraints
- Define player-facing late-life expression update boundaries
- Produce a clear P117 playable-implementation validation shape
- Output GO/NO-GO for P117

## 3. Non-Goals

- No runtime event implementation
- No rewrites to P113/P115 existing runtime behavior
- No endgame implementation (defer to next stage)
- No new systems, UI, or platform changes

## 4. User Stories

### US-001: Audit founding-patriarch late-life prerequisites

- [ ] Audit existing prerequisites from P113 and P115 (flags, gates, branch markers, expressions)
- [ ] Clarify reusable surfaces vs missing late-life surfaces
- [ ] Output prerequisite audit report
- [ ] Typecheck passes

### US-002: Lock P116 scope contract

- [ ] Define allowed work as design docs/contracts/validation-shape only
- [ ] Define forbidden work as runtime wiring and unrelated route rewrites
- [ ] Output scope contract report
- [ ] Typecheck passes

### US-003: Design late-life branch directions

- [ ] Define at least 2 late-life branch directions from pressure markers (`rule_first` / `alliance_first`)
- [ ] Ensure branches are meaningfully differentiated and route-consistent
- [ ] Clarify single-event vs multi-event recommendation (bounded default: single late-life event with branch variants)
- [ ] Output direction comparison report
- [ ] Typecheck passes

### US-004: Define P116 late-life contract

- [ ] Define late-life checkpoint and gate contract
- [ ] Define event structure, branch keys, and expression signals
- [ ] Define continuity constraints from pressure to late-life and late-life to future endgame
- [ ] Output `p116` contract file in `docs/PRD/`
- [ ] Typecheck passes

### US-005: Define P117 validation shape

- [ ] Define targeted proof chain for pressure -> late-life -> expression continuity
- [ ] Define minimum regression boundary set
- [ ] Define closure criteria and pass threshold
- [ ] Output validation-shape report
- [ ] Typecheck passes

### US-006: Produce P116 closure report

- [ ] Summarize audit/scope/direction/contract/validation-shape
- [ ] State GO/NO-GO for P117 with rationale
- [ ] List deferred boundaries
- [ ] Typecheck passes

## 5. Success Criteria

- P116 outputs a complete late-life design-first contract for `founding_patriarch`
- P117 implementation can proceed without directional ambiguity
- Stage remains bounded and does not rewrite existing runtime

## 6. Dependencies / Context

- P113 closure: `docs/test-reports/p113-founding-patriarch-bridge-closure-report.md`
- P115 closure: `docs/test-reports/p115-founding-patriarch-midlife-pressure-closure-report.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §8

## 7. Open Questions

- Default late-life age window for founding-patriarch
- Whether late-life should include explicit sect inheritance handoff markers in this contract stage
