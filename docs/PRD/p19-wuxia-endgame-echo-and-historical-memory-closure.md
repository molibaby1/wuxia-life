# PRD: P19 Wuxia Endgame Echo And Historical Memory Closure

## 1. Introduction

P16 让人物真正成型，P17 让关系、势力与成就带来持续后果，P18 让这些后果进一步进入传承、弟子与后代培养层。到了这个阶段，武侠人生已经不只是“活过一生”，而是能够影响周围的人、组织与未来。

但如果终局阶段仍然只是简单收尾，那么前面的人生厚度很容易在最后被压扁成几句总结。真正有余味的武侠人生，不只是看这个人最后死于何处或活到几岁，而是看他如何收束未竟之事、如何面对关系与传承的回响，以及江湖与后世最终如何记住他。

P19 的目标因此是完成一轮 **Endgame / Historical Memory Closure**：让终局类型真正分化，让终局前的人际、仇怨、势力、弟子、后代与传承内容得到综合回收，并让人物在历史中的位置、后世评价与余韵结果形成可配置、可验证的闭环。

本阶段允许少量 runtime 支撑改动和一整轮终局武侠体验优化，但不做 UI、不做新题材、不做大规模 runtime 重构。

## 2. Goals

- 让武侠人生具备 3-5 类代表性的终局形态，而非单一收尾
- 让终局前阶段能够综合回收关系、仇怨、势力、弟子、后代与传承问题
- 让后世评价与历史定位成为终局层的重要结果，而不是只停留在 summary 修辞
- 让人物终局既体现个人结局，也体现其对江湖与后世的影响
- 完成一整轮终局武侠体验优化，并保持现有 narrative/profile/playability gates 不退化
- 尽量通过配置完成终局与历史回响优化，只在必要处补最小 runtime 支撑

## 3. User Stories

### US-001: Endgame Surface Audit
**Description:** As a maintainer, I want a read-only audit of current endgame, epilogue, and historical-memory surfaces so that P19 targets the highest-impact closure gaps first.

**Acceptance Criteria:**
- [ ] Audit the current sources of endgame outcome, late-life callback recovery, epilogue summary, and posthumous reputation signals
- [ ] Identify which endgame surfaces are already config-driven, partially config-driven, or still runtime-bound
- [ ] Record where current runs end without adequately resolving major relationships, faction consequences, legacy lines, or public memory
- [ ] Save the audit under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: P19 Design Rules For Endgame And Historical Memory
**Description:** As a designer, I want explicit design rules for endgame differentiation and posthumous memory so that later stories converge on a coherent wuxia endgame model.

**Acceptance Criteria:**
- [ ] Define the representative endgame categories in scope for P19
- [ ] Define how endgame recovery should combine unresolved relationships, faction status, achievement maintenance, legacy continuity, and public consequence
- [ ] Define how historical reputation can differ from lived personal reality
- [ ] Define which kinds of endgame or posthumous effects are deferred beyond P19
- [ ] Save the rules under `docs/designs/` or `docs/`

### US-003: Endgame Schema And Config Surface
**Description:** As a developer, I want a clearer config surface for endgame and epilogue logic so that final-life differentiation can be tuned without hidden wuxia-specific code coupling.

**Acceptance Criteria:**
- [ ] Add or refine config structures for endgame categories, final-life recovery slots, and historical memory outputs
- [ ] Ensure field semantics are explicit enough for later config-only tuning
- [ ] Keep the schema compatible with current profile-first loading or provide a controlled migration path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-004: Endgame Category Wiring
**Description:** As a player, I want different life trajectories to resolve into different endgame types so that the end of a run reflects how I lived.

**Acceptance Criteria:**
- [ ] Endgame selection or weighting reads configured endgame inputs through the existing world-profile path
- [ ] At least 3-5 representative endgame types can be reached through materially different life trajectories
- [ ] Endgame outcome is influenced by more than age or a single route label
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-005: Pre-Endgame Recovery Surface
**Description:** As a designer, I want explicit config for endgame recovery of relationships, enmities, faction ties, legacy lines, and unfinished burdens so that final-life closure can be tuned without rewriting the scheduler.

**Acceptance Criteria:**
- [ ] Add or refine config structures for pre-endgame callback recovery across relationship, faction, inheritance, vendetta, and obligation dimensions
- [ ] Ensure the config can represent both reconciliation/reward recovery and collapse/retribution recovery
- [ ] Keep the resulting schema profile-first and authoring-friendly
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-006: Representative Pre-Endgame Closure Set
**Description:** As a player, I want the final phase of life to actively resolve what I built and broke so that the ending feels earned rather than appended.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative pre-endgame closure patterns using the new recovery surface
- [ ] At least 1 pattern must emphasize relationship or vendetta resolution
- [ ] At least 1 pattern must emphasize faction, organization, or social-position consequence recovery
- [ ] At least 1 pattern must emphasize legacy, disciple, heir, or succession recovery
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-007: Historical Memory Model
**Description:** As a designer, I want a general way to express posthumous evaluation so that different lives can be remembered in different ways by the world.

**Acceptance Criteria:**
- [ ] Define a configuration model for historical memory or posthumous reputation outcomes
- [ ] Support evaluation dimensions across local memory, Jianghu reputation, faction memory, disciple/heir testimony, moral ambiguity, and distorted legacy
- [ ] Support visible reasoning or classification output for debugging and balancing
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-008: Representative Historical Reputation Outcomes
**Description:** As a player, I want the world to remember different people differently so that the final result reflects more than personal self-image.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative historical-memory patterns using the new model
- [ ] At least 1 outcome must emphasize admired or exemplary remembrance
- [ ] At least 1 outcome must emphasize feared, disputed, or morally mixed remembrance
- [ ] At least 1 outcome must show a difference between lived reality and posthumous reputation
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-009: Endgame Summary Upgrade
**Description:** As a player, I want the final summary to resolve my fate, legacy, and public memory together so that the end of the run feels conclusive and resonant.

**Acceptance Criteria:**
- [ ] Upgrade the endgame summary path to include final personal fate, unresolved or resolved consequence lines, legacy continuation, and historical memory signals
- [ ] Ensure the upgraded summary is composed from profile-first configuration rather than ad hoc wuxia-only branches
- [ ] Preserve readability while making distinct endgame outcomes visibly different
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-010: Endgame And Historical Memory Validation Slice
**Description:** As a maintainer, I want a validation slice that demonstrates different endgame and historical-memory outcomes so that P19 proves the intended closure pattern.

**Acceptance Criteria:**
- [ ] Add a validation slice or report that compares multiple final-life trajectories with controlled differences in endgame type, unresolved burden recovery, and historical reputation
- [ ] Demonstrate at least 1 case where endgame type changes because of relationship/faction/legacy state rather than only age
- [ ] Demonstrate at least 1 case where historical memory differs from the protagonist's lived self-understanding
- [ ] Demonstrate at least 1 case where pre-endgame closure materially changes the final summary
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-011: Full Endgame Wuxia Optimization Pass
**Description:** As a project owner, I want P19 to improve the full endgame wuxia slice so that final-life closure is not limited to isolated showcase samples.

**Acceptance Criteria:**
- [ ] Apply P19 tuning across representative late-life, end-of-life, and final-summary portions of the wuxia slice
- [ ] Increase visible differentiation between at least 3 endgame trajectories shaped by different consequence and legacy states
- [ ] Reduce cases where major lifetime arcs end without meaningful closure, reputation consequence, or historical positioning
- [ ] Preserve or improve current route readability, consequence legibility, and summary coherence
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-012: P19 Experience Gate And Closure Report
**Description:** As a maintainer, I want a dedicated P19 report and closure summary so that the phase can be accepted based on evidence, not impressions.

**Acceptance Criteria:**
- [ ] Add or update a P19-specific gate or report covering endgame category coverage, pre-endgame closure recovery, historical-memory differentiation, and final-summary quality
- [ ] Record before/after findings for the main endgame closure issues targeted by P19
- [ ] Confirm `gate:playability` and current profile/runtime gates do not regress
- [ ] Save the final closure report under `docs/test-reports/`
- [ ] Relevant tests pass

## 4. Functional Requirements

1. FR-1: The system must support explicit configuration for differentiated endgame categories within late-life gameplay.
2. FR-2: The runtime must read endgame and historical-memory inputs through the existing profile-first configuration path rather than through new wuxia-hardcoded branches.
3. FR-3: The system must support explicit configuration for pre-endgame recovery of relationships, enmities, faction ties, inheritance lines, and unfinished obligations.
4. FR-4: Pre-endgame recovery paths must be able to generate both reconciliatory and destructive closure outcomes.
5. FR-5: The system must support a historical-memory or posthumous-evaluation model for selected endgame trajectories.
6. FR-6: Historical memory must be able to combine at least local remembrance, Jianghu reputation, faction memory, legacy testimony, and moral ambiguity.
7. FR-7: Selected endgame trajectories must reflect sustained effects from relationship state, faction consequence, achievement maintenance, and legacy continuity.
8. FR-8: Major lifetime achievements and failures must be able to influence posthumous outcome space rather than ending only as personal summary text.
9. FR-9: The system must provide testable evidence that different endgame and historical-memory states can produce materially different final outcomes.
10. FR-10: P19 changes must preserve compatibility with the current save/runtime model unless an explicitly bounded internal migration is documented.
11. FR-11: P19 must preserve or improve current playability, scheduling, profile, and multi-theme gate outcomes.

## 5. Non-Goals

- No UI theme switching or frontend feature expansion
- No new second-theme feature work beyond keeping shared abstractions healthy
- No large-scale runtime rewrite of the scheduler or simulation core
- No attempt to build a full historiography simulator or world chronicle system in this phase
- No attempt to solve every possible posthumous lineage or era-progression mechanic in the first P19 pass

## 6. Design Considerations

- Endings should feel like the culmination of a life, not a detached epilogue overlay
- Historical memory should be allowed to differ from personal intent or self-image
- Final-life closure should reward earlier consequence-building without becoming mechanically predictable
- Endgame differentiation should remain legible enough for tuning and validation

## 7. Technical Considerations

- Prefer extending existing profile-first config surfaces before adding new runtime-owned special cases
- Keep field naming stable and authoring-friendly so later tuning can be done by config editors or LLMs with minimal code reading
- Any runtime support added for endgame, historical memory, or epilogue logic should remain theme-neutral and avoid wuxia-specific naming in shared logic
- Validation should favor report artifacts and targeted tests over ad hoc manual inspection

## 8. Success Metrics

- Endgame slices show visibly different arcs for at least 3 endgame and historical-memory patterns
- 3-5 representative endgame states create distinct closure paths rather than superficial text variation
- 3-5 representative historical-memory outcomes create visible differentiation in how the world remembers similar-strength protagonists
- At least 1 validation report demonstrates a final outcome difference caused by pre-endgame closure handling, legacy state, and historical interpretation
- Existing major gates remain passing after P19 changes

## 9. Open Questions

- Which 3-5 representative endgame types best capture the intended diversity of wuxia fate for the first closure set?
- Should historical memory be driven primarily by public outcomes, or should hidden inner-life factors also distort remembrance in the first pass?
- How much of posthumous evaluation should surface as explicit summary text versus implicit classification or report output?
- Should some endgame closure patterns remain intentionally ambiguous, or should P19 prioritize strongly legible fate resolution first?
