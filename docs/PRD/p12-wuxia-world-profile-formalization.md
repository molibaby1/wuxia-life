# PRD: P12 Wuxia World Profile Formalization

## 1. Introduction

P10 已经把 `route identity / summary template / echo summary` 的主要解释层硬编码收掉，P11 又让 `stage` 与 `route` 真正进入了 runtime 调度，并通过专用 scheduling gate 验证了它们已经不是纯文档化结构。

但按照最初的差距分析文档，项目当前还没有真正完成“武侠题材成为显式 world pack”这一步。现有 `WUXIA_WORLD_PROFILE` 已经出现，但它更接近 narrative config 的装配壳，而不是一个完整、可执行、可验证的题材配置对象。`stats`、`resources`、`identity tracks`、`action families`、`summary signals` 等仍然大量散落在现有实现中，runtime 也还没有形成“主要通过 world profile 读取武侠题材结构”的执行形态。

P12 的目标是把武侠题材正式收敛成一个完整的、可加载的、可验证的 `WorldProfile` 执行对象，并新增 P12 profile gate/report 证明 profile 装配完整性。这个阶段不做第二题材、不做 UI、不改存档协议；重点是把“武侠是默认题材”推进成“武侠是正式 world pack”。

## 2. Goals

- 将武侠题材收敛为完整的 `WorldProfile` schema 与运行时装配入口
- 将 `stats`、`resources`、`identity tracks`、`action families`、`summary signals` 从散点实现推进为 profile 内的正式定义
- 让 runtime 的 narrative/config 读取主要通过 world profile 入口完成，而不是继续散读单文件
- 为后续第二题材最小验证建立稳定边界，但本阶段不实现第二题材
- 提供一个 P12 profile gate/report，验证武侠 world profile 的装配完整性与执行接线完整性
- 保持现有 `gate:playability`、`gate:p11-scheduling`、P9/P10/P11 回归与存档协议不退化

## 3. User Stories

### US-001: Wuxia Profile Boundary Inventory
**Description:** As a maintainer, I want a read-only inventory of all current wuxia-specific runtime surfaces so that P12 starts from exact migration targets rather than assumptions.

**Acceptance Criteria:**
- [ ] Inventory current wuxia-specific definitions for stats, resources, identity tracks, action families, summary signals, and narrative config entrypoints
- [ ] For each category, record the current source files and whether the source is already profile-like or still scattered
- [ ] Record which runtime readers currently bypass `WUXIA_WORLD_PROFILE`
- [ ] Save the inventory under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay logic in this story

### US-002: Formal World Profile Schema
**Description:** As a developer, I want a formal `WorldProfile` schema that covers executable theme structure so that wuxia becomes a complete runtime profile rather than a partial narrative wrapper.

**Acceptance Criteria:**
- [ ] Define profile fields for stats, resources, identity tracks, action families, summary signals, stage config, route definitions, echo hooks, and summary templates
- [ ] Each field has explicit runtime-oriented types rather than loose `Record<string, unknown>` placeholders
- [ ] The schema documents which fields are required for a playable profile
- [ ] Typecheck passes

### US-003: Wuxia Stats Profile Definition
**Description:** As a developer, I want wuxia player stats expressed inside the world profile so that stat meaning stops being implied only by core state structures.

**Acceptance Criteria:**
- [ ] Define wuxia stat entries inside the profile for currently player-facing and scheduling-relevant stats
- [ ] Each stat declares id, label, and role or usage category
- [ ] Existing stat consumers continue to work after the profile definition is introduced
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-004: Wuxia Resources Profile Definition
**Description:** As a developer, I want wuxia spendable or accumulable resources expressed inside the world profile so that resource structure is no longer scattered across gameplay assumptions.

**Acceptance Criteria:**
- [ ] Define wuxia resource entries inside the profile for currently used resource-like values such as money, energy, connections, or equivalent project-native resources
- [ ] Each resource declares id, label, and usage role
- [ ] Existing resource consumers continue to work after the profile definition is introduced
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-005: Wuxia Identity Track Definition
**Description:** As a designer, I want wuxia identity tracks fully declared inside the profile so that route identity is represented as first-class world-pack data.

**Acceptance Criteria:**
- [ ] Define profile identity tracks for martial, scholar, social, wealth, wanderer, deviant, cautious, and balanced paths or their current project-native equivalents
- [ ] Each identity track links to relevant route ids or identity signals
- [ ] Existing route identity resolution remains compatible with the declared tracks
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-006: Wuxia Action Family Definition
**Description:** As a developer, I want active action families referenced from the world profile so that action-direction structure is part of the theme definition rather than hidden in unrelated files.

**Acceptance Criteria:**
- [ ] Define profile action family entries for the current wuxia action directions used in the 0-40 slice
- [ ] Each action family links to the current action catalog or action ids through explicit profile metadata
- [ ] Existing active action selection continues to work after the profile definition is introduced
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-007: Wuxia Summary Signal Definition
**Description:** As a developer, I want summary signal structure declared inside the world profile so that summary assembly depends on theme config instead of scattered knowledge.

**Acceptance Criteria:**
- [ ] Define profile summary signals for route identity, origin, echo-derived summary parts, and other currently used age-40 summary inputs
- [ ] Each summary signal declares slot, variable or source role, and intended use in summary assembly
- [ ] Existing configured summary output remains functionally compatible
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-008: Profile-First Config Loader
**Description:** As a developer, I want the runtime config loader to read wuxia narrative config through the world profile first so that scattered single-file reads stop being the default path.

**Acceptance Criteria:**
- [ ] `NarrativeConfigLoader` or equivalent runtime entrypoint reads stage, route, echo, and summary structures from `WUXIA_WORLD_PROFILE`
- [ ] Existing helper APIs remain callable, but internally resolve from the profile-first path
- [ ] No duplicate authoritative config source is introduced
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-009: Profile-First Runtime Consumers
**Description:** As a developer, I want the main P10/P11 runtime consumers to read from the world profile path so that the profile becomes a real execution source, not an optional wrapper.

**Acceptance Criteria:**
- [ ] P10 identity or summary resolution reads through the profile-first path
- [ ] P11 stage or route scheduling readers read through the profile-first path
- [ ] At least one active-action or related gameplay-facing reader consumes profile-declared action family metadata
- [ ] Runtime behavior remains compatible with current wuxia execution
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-010: Config Directory Reorganization
**Description:** As a maintainer, I want the wuxia config layout reorganized around the world profile so that future sessions can find theme-owned structures without chasing scattered files.

**Acceptance Criteria:**
- [ ] Reorganize config files as needed so the world profile is the obvious root for wuxia-owned config
- [ ] Update imports so the new structure builds cleanly
- [ ] Do not introduce a second parallel config tree that keeps the old layout authoritative
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-011: Wuxia Profile Smoke Verification
**Description:** As a maintainer, I want a smoke verification that the wuxia profile can be loaded and used as a coherent executable object so that P12 proves more than type completeness.

**Acceptance Criteria:**
- [ ] Add a focused verification path that loads the profile and checks required sections are present
- [ ] Verify the profile can supply stats, resources, identity tracks, action families, summary signals, and narrative config to runtime readers
- [ ] Save the smoke output under `docs/test-reports/`
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-012: P12 World Profile Gate Or Report
**Description:** As a project owner, I want a dedicated P12 profile gate or report so that world-profile completeness can be verified independently of playability and scheduling gates.

**Acceptance Criteria:**
- [ ] Add one stable command or scripted report for P12 world profile verification
- [ ] The output reports presence and completeness of stats, resources, identity tracks, action families, summary signals, and narrative config sections
- [ ] The output reports whether key runtime readers use the profile-first path
- [ ] The output clearly marks pass, warning, or fail
- [ ] Save machine-readable and human-readable output under stable paths
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-013: P12 Regression And Closure Report
**Description:** As a maintainer, I want a closure report comparing pre-P12 and post-P12 world-profile execution state so that the next decision about alternate-theme validation starts from verified evidence.

**Acceptance Criteria:**
- [ ] Run `npm run gate:playability` after P12 changes
- [ ] Run `npm run gate:p11-scheduling` after P12 changes
- [ ] Run the P12 profile gate or report after P12 changes
- [ ] Summarize which runtime readers are now profile-first and which, if any, remain deferred
- [ ] Confirm that no save schema or backend/API boundary changed in P12
- [ ] Save the closure report under `docs/test-reports/`

## 4. Functional Requirements

- FR-1: The system must define a formal `WorldProfile` schema that includes stats, resources, identity tracks, action families, summary signals, stage config, route definitions, echo hooks, and summary templates.
- FR-2: The system must provide a complete `WUXIA_WORLD_PROFILE` instance that satisfies the required profile schema.
- FR-3: Runtime config readers must prefer the world profile path over direct single-file reads.
- FR-4: The system must expose profile-declared stat and resource definitions to runtime consumers without changing existing save data shape.
- FR-5: The system must expose profile-declared identity tracks and action family metadata to runtime consumers without breaking current wuxia execution.
- FR-6: The system must expose profile-declared summary signal structure to summary-related readers.
- FR-7: The project may reorganize config files or directories, but the resulting layout must keep the world profile as the clear authoritative root.
- FR-8: The project must provide a dedicated P12 verification command or report with stable output paths.
- FR-9: P12 must not introduce second-theme execution, UI changes, or save schema changes.
- FR-10: P12 changes must preserve `gate:playability`, `gate:p11-scheduling`, and existing narrative regression coverage.

## 5. Non-Goals

- No second-theme or alternate world pack implementation
- No UI redesign, selector, or world-switching interface
- No save schema, migration, or storage format changes
- No backend or API boundary expansion
- No new gameplay systems added just to “fill” the profile
- No commitment that full multi-theme switching is already production-ready after P12

## 6. Design Considerations

- Prefer explicit schema and load-path clarity over elegant but implicit abstractions.
- Allow substantial config reorganization if it makes the profile root clearer, but do not leave two competing authoritative layouts behind.
- Keep the profile readable by future sessions; it should be obvious how wuxia is assembled without tracing many unrelated files.
- Preserve the current wuxia visual and gameplay behavior unless a change is necessary for profile formalization.

## 7. Technical Considerations

- P10 and P11 already introduced world-profile-adjacent loaders and scheduling readers; P12 should consolidate them, not replace them with a new parallel abstraction.
- Existing `GameState`, save/load contracts, and backend boundaries must remain unchanged.
- Some current data may live in core state or action catalog files that were not originally profile-owned; P12 may wrap or reference them through profile definitions rather than fully rewriting them, so long as the profile becomes the authoritative runtime entrypoint.
- The P12 profile gate should validate both schema completeness and execution-path completeness.
- Tests should cover both successful profile loading and negative cases where required sections are missing or bypassed.

## 8. Success Metrics

- A dedicated P12 profile gate or report passes and shows complete wuxia profile coverage for all required sections.
- Core runtime readers for narrative config and at least one gameplay-facing action-family path are profile-first after P12.
- `gate:playability` and `gate:p11-scheduling` remain green after the formalization work.
- Follow-up sessions can identify the full wuxia world-pack structure by starting from `WUXIA_WORLD_PROFILE` rather than hunting scattered files.
- The project is ready for a future “second-theme minimal prototype” PRD without first needing another structural cleanup pass.

## 9. Open Questions

- Should stats and resources be fully re-declared as profile-owned metadata, or is a profile reference layer to existing canonical definitions sufficient for P12?
- Which gameplay-facing reader beyond narrative config should be treated as the required proof that action-family metadata is genuinely profile-first?
- Should the P12 profile gate fail immediately on any non-profile-first reader, or only warn for explicitly deferred readers listed in the closure report?
