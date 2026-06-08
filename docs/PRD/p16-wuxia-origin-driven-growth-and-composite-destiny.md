# PRD: P16 Wuxia Origin-Driven Growth And Composite Destiny

## 1. Introduction

P10 到 P15 已经把叙事 runtime、world profile、多题材边界，以及“配置优先优化武侠体验”的工作流建立起来。下一阶段不再以抽象系统为主，而是要真正利用这些能力，提升武侠人生体验本身。

当前最明显的体验问题有 4 类：

- 幼年阶段的人生起点差异不足，出身对前期经历和性格塑形影响偏弱
- 幼年阶段的主动选择权过强，导致不符合年龄感的行为过早出现
- 高阶武侠成就过于单线，缺乏“多条件组合才能成立”的人物成型路径
- 人物结果更多像线性选择回报，较少体现“出身 + 选择 + 运气”共同作用的武侠小说感

P16 的目标是围绕这些问题，完成一轮 **Origin-Driven Growth + Composite Destiny** 优化：让出身成为幼年人生的重要真源，让年龄段 agency 更合理，让若干代表性高阶结果改为组合条件解锁，并把稀有事件线正式纳入人物成型逻辑。

本阶段允许少量 runtime 支撑改动和一整轮 0-40 武侠体验优化，但不做后代培养、不做 UI、不做大规模 runtime 重构。

## 2. Goals

- 让出身在 0-12 岁阶段对经历、资源、启蒙方向和性格塑形产生明显影响
- 降低幼年阶段不合理的主动路线选择，建立年龄合理的 agency 分配
- 为 3-5 个代表性高阶武侠结果建立组合条件解锁路径
- 将稀有事件线正式纳入“出身 + 选择 + 运气”共同成型框架
- 完成一整轮 0-40 武侠体验优化，并保持现有 narrative/profile/playability gates 不退化
- 尽量通过配置完成体验优化，只在必要处补最小 runtime 支撑

## 3. User Stories

### US-001: Origin Surface Audit
**Description:** As a maintainer, I want a read-only audit of current origin, childhood, and route-entry surfaces so that P16 changes target the highest-impact wuxia experience gaps first.

**Acceptance Criteria:**
- [ ] Audit the current sources of early-life variance across origin, family resources, early teaching, social exposure, and childhood event pools
- [ ] Identify which early-life surfaces are already config-driven, partially config-driven, or still runtime-bound
- [ ] Record the current points where childhood agency is too strong or age-inappropriate
- [ ] Save the audit under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: P16 Design Rules For Origin And Agency
**Description:** As a designer, I want explicit design rules for origin-driven childhood and age-appropriate agency so that later stories optimize toward a coherent wuxia-life model.

**Acceptance Criteria:**
- [ ] Define the target agency split for childhood, youth, and adult stages
- [ ] Define the principle that childhood should be shaped more by origin and circumstance than by direct route choice
- [ ] Define which kinds of actions are invalid or heavily restricted in early childhood
- [ ] Define how origin can influence hardship tolerance, discipline, family obligation, learning access, or early worldview
- [ ] Save the rules under `docs/designs/` or `docs/`

### US-003: Origin Schema And Config Surface
**Description:** As a developer, I want a clearer origin-related config surface so that upbringing differences can be tuned without embedding wuxia flavor directly into runtime logic.

**Acceptance Criteria:**
- [ ] Add or refine config structures for origin-related differences such as family resources, guidance quality, social capital, hardship exposure, or regional background
- [ ] Ensure field semantics are explicit enough for later config-only tuning
- [ ] Keep the schema compatible with current profile-first loading or provide a controlled migration path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-004: Origin-Driven Childhood Event Wiring
**Description:** As a player, I want childhood experiences to reflect where I came from so that early life feels more believable and varied.

**Acceptance Criteria:**
- [ ] Childhood event selection or weighting reads origin-related config inputs through the existing world-profile path
- [ ] At least 3 distinct origin patterns produce materially different early-life experiences
- [ ] The resulting early-life differences affect later tendencies, resources, traits, or signal accumulation in a traceable way
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-005: Age-Appropriate Childhood Agency Guardrails
**Description:** As a player, I want early childhood choices to remain age-appropriate so that the life simulation feels grounded instead of prematurely strategic.

**Acceptance Criteria:**
- [ ] Limit or replace age-inappropriate early actions such as direct commerce or mature route-entry behavior in childhood
- [ ] Preserve a small number of meaningful childhood choices where appropriate
- [ ] Ensure childhood outcomes are driven more by experience framing and environment than by explicit career-like decisions
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-006: Childhood Personality And Tendency Shaping
**Description:** As a designer, I want early hardships and upbringing to shape later personality tendencies so that childhood has visible downstream payoff.

**Acceptance Criteria:**
- [ ] Add or refine config-driven links between childhood experiences and later tendencies such as endurance, discipline, ambition, caution, empathy, or social ease
- [ ] At least 2 childhood shaping patterns can be observed in later-stage callbacks, route pressure, or summary output
- [ ] The shaping path is inspectable in test/report output without relying on manual log reading
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-007: Composite Destiny Rule Model
**Description:** As a designer, I want a general way to express multi-factor destiny requirements so that major wuxia outcomes are not unlocked by a single axis alone.

**Acceptance Criteria:**
- [ ] Define a configuration model for multi-factor outcome requirements
- [ ] Support conditions across at least skill growth, social capital, resources, reputation, key choices, and special-event progression
- [ ] Support partial progress or unmet-requirement reporting for debugging and balancing
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-008: Representative Composite Destiny Outcomes
**Description:** As a player, I want major wuxia achievements to require multiple strengths so that high-status outcomes feel earned and distinctive.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative high-level wuxia outcomes using the composite rule model
- [ ] At least one outcome must require more than martial strength alone
- [ ] At least one outcome must combine social or organizational requirements with personal cultivation
- [ ] At least one outcome must be blocked when a critical dimension is missing even if one axis is strong
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-009: Rare Event Line Integration
**Description:** As a player, I want luck and rare opportunities to matter so that lives can become memorable without becoming fully random.

**Acceptance Criteria:**
- [ ] Define how rare event lines are represented in config and linked to origin, stage, or prior choice conditions
- [ ] Ensure rare lines are possible but not guaranteed for otherwise similar lives
- [ ] Ensure rare lines can materially alter later opportunity space, not just add flavor text
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-010: Origin Plus Choice Plus Luck Validation Slice
**Description:** As a maintainer, I want a validation slice that demonstrates different destinies emerging from origin, choices, and luck so that P16 proves the intended wuxia-life pattern.

**Acceptance Criteria:**
- [ ] Add a validation slice or report that compares multiple lives with controlled differences in origin, choices, and rare-line outcomes
- [ ] Demonstrate at least 1 case where origin meaningfully changes the early life arc
- [ ] Demonstrate at least 1 case where a composite destiny unlock depends on both accumulated choices and a rare opportunity
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-011: Full 0-40 Wuxia Optimization Pass
**Description:** As a project owner, I want P16 to improve the whole 0-40 wuxia slice so that the new origin and destiny model does not stop at isolated samples.

**Acceptance Criteria:**
- [ ] Apply P16 tuning across childhood, youth, and adulthood portions of the wuxia slice
- [ ] Reduce clearly age-inappropriate early routing behavior in the full slice
- [ ] Increase visible differentiation between at least 3 life trajectories that begin from different origins
- [ ] Preserve or improve current route readability and summary coherence
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-012: P16 Experience Gate And Closure Report
**Description:** As a maintainer, I want a dedicated P16 report and closure summary so that the phase can be accepted based on evidence, not impressions.

**Acceptance Criteria:**
- [ ] Add or update a P16-specific gate or report covering origin variance, childhood agency sanity, composite destiny coverage, and rare-line observability
- [ ] Record before/after findings for the main early-life and destiny issues targeted by P16
- [ ] Confirm `gate:playability` and current profile/runtime gates do not regress
- [ ] Save the final closure report under `docs/test-reports/`
- [ ] Relevant tests pass

## 4. Functional Requirements

1. FR-1: The system must support explicit origin-related configuration that can influence childhood experiences, early resources, learning access, and social exposure.
2. FR-2: The runtime must read origin-related inputs through the existing profile-first configuration path rather than through new wuxia-hardcoded branches.
3. FR-3: The system must define age-appropriate action or experience boundaries for early childhood.
4. FR-4: The childhood stage must allow limited meaningful choice, but must not present obviously adult route actions as normal early options.
5. FR-5: Childhood experiences must be able to shape later personality tendencies, pressures, or downstream opportunity signals.
6. FR-6: The system must support multi-factor destiny requirements for selected high-level wuxia outcomes.
7. FR-7: Multi-factor destiny requirements must be able to combine at least personal growth, resources, reputation, relationships or social capital, and key story progression.
8. FR-8: The system must support rare event line configuration that can interact with origin and prior choices.
9. FR-9: Rare event lines must be able to alter later opportunity space, not only summary flavor.
10. FR-10: The system must provide testable evidence that different origins, choices, and luck patterns can produce materially different life outcomes.
11. FR-11: P16 changes must preserve compatibility with the current save/runtime model unless an explicitly bounded internal migration is documented.
12. FR-12: P16 must preserve or improve current playability, scheduling, profile, and multi-theme gate outcomes.

## 5. Non-Goals

- No descendant training, offspring bonding, or intergenerational gameplay
- No UI theme switching or frontend feature expansion
- No new second-theme feature work beyond keeping shared abstractions healthy
- No large-scale runtime rewrite of the scheduler or simulation core
- No attempt to build every possible wuxia archetype in this phase

## 6. Design Considerations

- Childhood should feel like being shaped by family, environment, and circumstance rather than immediately optimizing a build
- Origin differences should create recognizable but not fully deterministic early-life arcs
- Composite destiny outcomes should feel legible in hindsight without feeling mechanically obvious from age 1
- Rare event lines should feel like fortune, encounter, or timing advantages, not arbitrary randomness

## 7. Technical Considerations

- Prefer extending existing profile-first config surfaces before adding new runtime-owned special cases
- Keep field naming stable and authoring-friendly so future tuning can be done by config editors or LLMs with minimal code reading
- Any runtime support added for composite destiny or origin shaping should remain theme-neutral and avoid wuxia-specific naming in shared logic
- Validation should favor report artifacts and targeted tests over ad hoc manual inspection

## 8. Success Metrics

- Early-life slices show visibly different arcs for at least 3 origin patterns
- Age-inappropriate childhood route actions are significantly reduced or eliminated in validation slices
- 3-5 representative wuxia outcomes require multi-factor fulfillment rather than single-axis progression
- At least 1 validation report demonstrates a destiny difference caused by the interaction of origin, player choices, and rare opportunity
- Existing major gates remain passing after P16 changes

## 9. Open Questions

- Which 3-5 representative wuxia outcomes best capture the intended diversity of “major character destinies” for the first composite set?
- Should some origin traits remain partially hidden from players, or should all major upbringing factors be fully legible in reports and summaries?
- How much of childhood shaping should surface as explicit traits versus implicit downstream weighting changes?
- Should rare event lines be seeded evenly across stage bands, or intentionally concentrate in youth and early adulthood?
