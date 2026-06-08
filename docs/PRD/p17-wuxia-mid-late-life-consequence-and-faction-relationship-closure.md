# PRD: P17 Wuxia Mid-Late-Life Consequence And Faction-Relationship Closure

## 1. Introduction

P16 已经把武侠人生前中期最关键的成型问题推进了一大步：出身开始真实影响幼年塑形，年龄段 agency 更合理，人物命运不再只由单线选择决定，而是逐步体现“出身 + 选择 + 运气”的共同作用。

但当人物能够成型之后，新的体验瓶颈通常会出现在中后期：角色已经成为某种人，却还没有充分承受“成为这种人”之后的持续后果。师门、亲族、盟友、仇家、门派、社会身份、高阶成就，很多时候仍然更像一次性标签、事件 flavor 或 summary 文案，而不是长期改变人生机会、风险、义务、资源和命运方向的持续系统。

P17 的目标因此不是直接进入后代培养，而是先完成一轮 **Mid/Late-Life Consequence Closure**：让关系网络、势力归属、社会身份和高阶成就真正进入中后期人生的长期反馈链，形成持续正负后果，并为未来的传承、弟子、后代系统打牢基础。

本阶段允许少量 runtime 支撑改动和一整轮中后期武侠体验优化，但不做后代培养、不做 UI、不做大规模 runtime 重构。

## 2. Goals

- 让关键关系在中后期持续影响机会、风险、资源和人生走向
- 让 3-5 类代表性势力/身份进入长期责任、约束、冲突和收益闭环
- 让高阶武侠成就从“达成即结束”改为“达成后仍有维护成本和后续压力”
- 建立关系与势力后果的持续正负反馈，而不是单向奖励
- 完成一整轮中后期武侠体验优化，并保持现有 narrative/profile/playability gates 不退化
- 尽量通过配置完成后果链优化，只在必要处补最小 runtime 支撑

## 3. User Stories

### US-001: Mid/Late-Life Consequence Surface Audit
**Description:** As a maintainer, I want a read-only audit of current mid/late-life relationship, faction, and identity consequence surfaces so that P17 targets the highest-impact closure gaps first.

**Acceptance Criteria:**
- [ ] Audit the current sources of sustained consequences across allies, enemies, mentors, kinship, faction ties, social identity, and major achievements
- [ ] Identify which consequence surfaces are already config-driven, partially config-driven, or still runtime-bound
- [ ] Record where mid/late-life identities currently collapse into one-off labels or summary-only outcomes
- [ ] Save the audit under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: P17 Design Rules For Consequence Closure
**Description:** As a designer, I want explicit design rules for relationship and faction consequences so that later stories converge on a coherent mid/late-life wuxia model.

**Acceptance Criteria:**
- [ ] Define how long-term positive and negative consequence loops should work for relationships
- [ ] Define how faction or identity membership should create both benefits and obligations
- [ ] Define how major achievements should introduce ongoing maintenance pressure rather than only static prestige
- [ ] Define which consequence types are in scope for P17 and which are deferred beyond it
- [ ] Save the rules under `docs/designs/` or `docs/`

### US-003: Relationship Consequence Schema And Config Surface
**Description:** As a developer, I want a clearer config surface for sustained relationship consequences so that mid/late-life relationship effects can be tuned without hidden wuxia-specific code coupling.

**Acceptance Criteria:**
- [ ] Add or refine config structures for ongoing relationship consequence types such as support, obligation, entanglement, feud, betrayal risk, or social shielding
- [ ] Ensure field semantics are explicit enough for later config-only tuning
- [ ] Keep the schema compatible with current profile-first loading or provide a controlled migration path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-004: Relationship Feedback Loop Wiring
**Description:** As a player, I want key relationships to keep affecting later life so that allies and enemies feel like lasting parts of my story.

**Acceptance Criteria:**
- [ ] Mid/late-life opportunity or risk selection reads relationship consequence inputs through the existing world-profile path
- [ ] Relationship state can produce both positive and negative downstream effects
- [ ] At least 3 relationship patterns produce materially different later-life opportunities, pressures, or setbacks
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-005: Faction And Identity Consequence Surface
**Description:** As a designer, I want faction and social-identity consequence structures exposed in config so that sustained role pressure can be tuned without scheduler rewrites.

**Acceptance Criteria:**
- [ ] Add or refine config structures for faction/identity benefits, duties, constraints, rivalries, and exposure
- [ ] Ensure the config can represent both organization-level and social-status-level consequences
- [ ] Keep the resulting schema profile-first and authoring-friendly
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-006: Representative Faction And Identity Outcome Set
**Description:** As a player, I want different mid/late-life identities to lead to different kinds of living pressure so that major status changes feel real.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative faction or identity patterns using the new consequence surface
- [ ] At least 1 pattern must emphasize opportunity and protection
- [ ] At least 1 pattern must emphasize duty, exposure, or political cost
- [ ] At least 1 pattern must create meaningful conflict pressure from rivals, enemies, or internal instability
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-007: Achievement Maintenance Cost Model
**Description:** As a designer, I want a general way to express post-achievement maintenance costs so that high-tier wuxia outcomes do not become consequence-free end states.

**Acceptance Criteria:**
- [ ] Define a configuration model for ongoing maintenance requirements after major achievements
- [ ] Support maintenance dimensions across reputation, followers, resources, alliances, internal stability, or external threat
- [ ] Support visible unmet-pressure reporting for debugging and balancing
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-008: High-Tier Achievement Consequence Samples
**Description:** As a player, I want major accomplishments to create new burdens and risks so that success changes my life instead of ending it.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative high-tier achievement follow-up patterns using the maintenance model
- [ ] At least 1 outcome must create long-term resource or leadership pressure
- [ ] At least 1 outcome must create social or factional responsibility beyond personal strength
- [ ] At least 1 outcome must create failure or decline risk when maintenance dimensions are neglected
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-009: Positive And Negative Consequence Balance Pass
**Description:** As a maintainer, I want relationship and faction consequence chains to include both upside and downside so that the system does not collapse into pure reward accumulation.

**Acceptance Criteria:**
- [ ] Ensure major relationship consequence paths can create both aid and burden
- [ ] Ensure major faction/identity paths can create both protection and constraint
- [ ] Ensure major achievement paths can create both prestige and upkeep pressure
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-010: Mid/Late-Life Validation Slice
**Description:** As a maintainer, I want a validation slice that demonstrates different later lives emerging from relationship, faction, and achievement consequences so that P17 proves the intended closure pattern.

**Acceptance Criteria:**
- [ ] Add a validation slice or report that compares multiple later-life trajectories with controlled differences in relationship networks, faction roles, or achievement maintenance
- [ ] Demonstrate at least 1 case where an ally or enemy materially changes later opportunity space
- [ ] Demonstrate at least 1 case where a faction or identity role adds ongoing duty or conflict rather than only reward
- [ ] Demonstrate at least 1 case where a high-tier achievement becomes fragile when maintenance pressure is ignored
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-011: Full Mid/Late-Life Wuxia Optimization Pass
**Description:** As a project owner, I want P17 to improve the full mid/late-life wuxia slice so that consequence closure is not limited to isolated showcase samples.

**Acceptance Criteria:**
- [ ] Apply P17 tuning across representative youth-late-adult and late-adult portions of the wuxia slice
- [ ] Increase visible differentiation between at least 3 later-life trajectories shaped by different relationship and faction states
- [ ] Reduce cases where major status changes collapse into low-impact summary-only outcomes
- [ ] Preserve or improve current route readability, consequence legibility, and summary coherence
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-012: P17 Experience Gate And Closure Report
**Description:** As a maintainer, I want a dedicated P17 report and closure summary so that the phase can be accepted based on evidence, not impressions.

**Acceptance Criteria:**
- [ ] Add or update a P17-specific gate or report covering relationship persistence, faction/identity consequence coverage, achievement maintenance visibility, and positive/negative balance
- [ ] Record before/after findings for the main mid/late-life closure issues targeted by P17
- [ ] Confirm `gate:playability` and current profile/runtime gates do not regress
- [ ] Save the final closure report under `docs/test-reports/`
- [ ] Relevant tests pass

## 4. Functional Requirements

1. FR-1: The system must support explicit configuration for long-term relationship consequences that can influence later-life opportunities, risks, protection, obligations, or entanglements.
2. FR-2: The runtime must read relationship consequence inputs through the existing profile-first configuration path rather than through new wuxia-hardcoded branches.
3. FR-3: The system must support explicit configuration for faction and social-identity consequences, including benefits, duties, rivalries, constraints, and exposure.
4. FR-4: Faction or identity consequence paths must be able to generate both positive and negative downstream effects.
5. FR-5: The system must support a post-achievement maintenance model for selected high-tier wuxia outcomes.
6. FR-6: Post-achievement maintenance must be able to combine at least reputation, resources, followers, alliances, internal stability, or external threat.
7. FR-7: Selected mid/late-life trajectories must reflect sustained effects from allies, enemies, kinship ties, faction roles, or social identity.
8. FR-8: Major status changes must alter later-life opportunity space or pressure space, not only summary text.
9. FR-9: The system must provide testable evidence that different relationship and faction states can produce materially different later-life outcomes.
10. FR-10: P17 changes must preserve compatibility with the current save/runtime model unless an explicitly bounded internal migration is documented.
11. FR-11: P17 must preserve or improve current playability, scheduling, profile, and multi-theme gate outcomes.

## 5. Non-Goals

- No descendant training, offspring bonding, or intergenerational gameplay
- No UI theme switching or frontend feature expansion
- No new second-theme feature work beyond keeping shared abstractions healthy
- No large-scale runtime rewrite of the scheduler or simulation core
- No attempt to build a full clan/legacy system in this phase

## 6. Design Considerations

- Strong relationships should continue to matter after the moment they are formed
- Faction and identity should feel like living inside a social position, not merely collecting a label
- Major success should create new burdens, not only new rewards
- Positive and negative consequence loops should remain legible enough for tuning and validation

## 7. Technical Considerations

- Prefer extending existing profile-first config surfaces before adding new runtime-owned special cases
- Keep field naming stable and authoring-friendly so later tuning can be done by config editors or LLMs with minimal code reading
- Any runtime support added for relationship, faction, or maintenance consequence logic should remain theme-neutral and avoid wuxia-specific naming in shared logic
- Validation should favor report artifacts and targeted tests over ad hoc manual inspection

## 8. Success Metrics

- Later-life slices show visibly different arcs for at least 3 relationship/faction patterns
- 3-5 representative faction or identity states create persistent benefits and costs
- 3-5 representative high-tier achievements create visible maintenance pressure after unlock
- At least 1 validation report demonstrates a later-life divergence caused by relationship state, faction role, and maintenance handling
- Existing major gates remain passing after P17 changes

## 9. Open Questions

- Which 3-5 representative faction or identity states best capture the intended diversity of mid/late-life wuxia pressure for the first closure set?
- Should some relationship consequences remain partially hidden from players, or should all major obligations and risks be fully legible in reports and summaries?
- How much of achievement maintenance should surface as explicit pressure versus implicit downstream weighting changes?
- Should kinship and sworn-brotherhood style ties be modeled in the same consequence layer, or kept partially separate in the first P17 pass?
