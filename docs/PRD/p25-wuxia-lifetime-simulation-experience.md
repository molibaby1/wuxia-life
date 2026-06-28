# PRD: P25 Wuxia Lifetime Simulation Experience

## 1. Introduction

P16–P24 已建立武侠人生的系统闭环：出身驱动成长、组合命运、关系与势力后果、传承与终局回响、可重玩性与试玩校准。当前缺口不再是「缺某一系统层」，而是这些层**尚未组合成玩家可感知的「模拟一生」体验**。

玩家仍难以稳定获得以下感受：

- 这一生有**明确可追的目标**，且努力与结果之间有清晰因果
- **随机与意外**会改变人生，但不会让最高成就变成纯抽奖
- **重开**是因为想试新选择、新出身、新策略，而不是因为首局看不懂
- **选择后果**足够丰富、显著、合理，终局与中途叙事不自相矛盾

P25 的目标是启动一轮 **Lifetime Simulation Experience** 优化：以「模拟一个人在当前武侠世界观中度过一生」为北极星，分波次交付主流成就、运气门槛、混合成就与平凡出身，并用 simulation-driven optimization + Discovery 外层环持续对齐目标与现实。

**North Star 详述：** 见 `docs/designs/p25-lifetime-simulation-north-star.md`。

**优化工作流：** 每个体验 slice 必须遵守 `docs/designs/simulation-driven-optimization-workflow.md`（先分类层 → 最小表面 → before/after 证据）。

## 2. Ultimate North Star Goals（最终目标 — Discovery 对照基准）

以下 Goals 描述**完整愿景**。首波实施（Wave 1）只交付子集；未达成项由 `--discovery` 自动提议后续 Story，**不得**在首波 silently 扩 scope。

1. **一生可玩叙事弧** — 从出生到终局，玩家能体验一条连贯、有阶段起伏、可复述的武侠人生。
2. **主流成就可追可达成** — 至少 5 个主流成就可被玩家识别、规划，并在合理选择下**中概率**达成（不依赖极端运气）。
3. **巅峰成就双门槛** — 最高档成就必须同时满足「关键选择合理」与「稀有机遇/运气窗口」；纯 grind 或单轴堆叠不得稳定达成。
4. **混合成就跨轨组合** — 至少 3 个混合成就要求跨身份轨道或跨维度组合，终局摘要能体现复合人生。
5. **平凡出身可信可玩** — 至少 3 种相对平凡出身产生与「天才/名门」可区分的早期轨迹，且仍能追求中档成就。
6. **选择双通道** — 主动选择与事件触发选择均产生**即时反馈 + 显著中期后果 + 可追踪远期影响**。
7. **后果一致性** — 验收切片中不得出现因果断裂、状态幽灵、窗口矛盾、反馈缺失类缺陷（定义见 North Star §4.3）。
8. **重玩动机** — 多 seed 模拟中，不同出身/关键选择产生 ≥3 条 materially different 全生命周期轨迹；巅峰成就失败案例 ≥80% 可归因到运气或关键选择。
9. **门禁不退化** — `gate:playability`、`gate:p20` 及 P25 专用模拟报告在优化过程中保持通过或改善。

## 3. Phased Delivery（分波实施 — 供 Discovery 引用）

| Wave | 主题 | 对应 North Star | 预期 Discovery 行为 |
| --- | --- | --- | --- |
| **Wave 1**（本 PRD 初始 backlog） | 主流成就 + 选择后果基线 + 模拟验收 | Goals 2, 6, 7（部分）, 9 | 首波 ralph-run 目标 |
| **Wave 2** | 随机/意外 + 巅峰成就运气门槛 | Goals 3, 8 | Discovery auto-apply |
| **Wave 3** | 混合成就 | Goal 4 | Discovery auto-apply |
| **Wave 4** | 平凡出身扩展 | Goal 5 | Discovery auto-apply |
| **Wave 5+** | 整局 pacing / 重玩 polish | Goals 1, 8 | 按 gaps 报告追加 |

Wave 2–4 **不在**初始 `prd.json` 中；由 `--discovery` 在 Wave 1 完成且 Goals 未达标时自动追加。

## 4. Goals（Wave 1 可验收目标）

- 建立 P25 一生模拟的**设计规则与现状审计**（主流成就、选择类型、后果一致性）
- 巩固 **冻结的 5 个主流成就**（P16 三条 + `jianghu_renown_sage` + `medical_sage_healer`）的组合解锁路径，并可被模拟与报告观测
- 建立**主动 + 事件触发**选择的后果反馈标准，并修复验收切片中的高优先级矛盾
- 建立 P25 **模拟验收基线**（多 seed、多出身、多关键选择对比）
- 产出 Wave 1  closure 报告，并标明 Wave 2 应优先补足的 gaps
- 保持现有 playability / P20 gates 不退化

## 5. User Stories（Wave 1 初始 backlog）

### US-001: Lifetime Simulation Baseline Audit
**Description:** As a maintainer, I want a read-only audit of current lifetime simulation surfaces so that P25 targets real experience gaps instead of rebuilding existing systems.

**Acceptance Criteria:**
- [ ] Audit mainstream achievements, composite destiny, rare lines, origin surfaces, choice/outcome wiring, and endgame summary paths
- [ ] Map each Ultimate North Star Goal to existing assets: supported / partial / missing
- [ ] Record top contradiction risks (causal breaks, ghost flags, missing feedback) with file/event pointers
- [ ] Save the audit under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: P25 Lifetime Simulation Design Rules
**Description:** As a designer, I want explicit rules for mainstream achievements, choice channels, and consequence consistency so that later waves converge on one lifetime simulation model.

**Acceptance Criteria:**
- [ ] Define mainstream vs pinnacle vs mixed achievement tiers and what each tier requires
- [ ] Define active vs event-triggered choice expectations and minimum feedback layers
- [ ] Define consequence consistency rules and forbidden contradiction patterns (align with North Star §4.3)
- [ ] Define which Wave 2–4 topics are explicitly deferred in Wave 1
- [ ] Save the rules under `docs/designs/`

### US-003: Mainstream Achievement Coverage And Traceability
**Description:** As a player, I want the five frozen mainstream wuxia achievements to feel pursuable and earned through multiple strengths so that a full life has clear high-level goals.

**Acceptance Criteria:**
- [ ] Preserve and trace P16 outcomes: `grandmaster_guardian`, `sect_leader_statesman`, `lone_sword_legend`
- [ ] Add and wire `jianghu_renown_sage` (江湖名宿) and `medical_sage_healer` (一代名医) per §12 Frozen Decisions
- [ ] All 5 achievements use composite multi-factor requirements; at least 1 non-martial mainstream (`medical_sage_healer`) and at least 1 reputation/social-led mainstream (`jianghu_renown_sage`)
- [ ] At least 1 achievement blocks on a missing critical dimension even if one axis is strong (existing P16 cases count)
- [ ] Each achievement has inspectable partial-progress or unmet-requirement reporting in test/sim output
- [ ] Link each achievement to at least 1 active or event-triggered choice flag and 1 mid-life consequence surface
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-004: Choice Consequence Feedback Standard
**Description:** As a player, I want both my plans and event choices to show what changed and what it means later so that the life simulation feels consequential.

**Acceptance Criteria:**
- [ ] Document and apply required feedback layers: immediate narrative, visible impact, future implication
- [ ] Cover both active planning actions and event-triggered choices on the golden/spine path
- [ ] Key choices write long-term state readable by later events or summary signals
- [ ] Remove or fix cases where key choices only modify hidden values without player-facing explanation
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-005: Consequence Consistency Validation Slice
**Description:** As a maintainer, I want a validation slice that detects narrative/state contradictions so that P25 does not ship logically broken life paths.

**Acceptance Criteria:**
- [ ] Add a validation slice or report covering at least 3 representative life paths (different routes/origins)
- [ ] Check for causal breaks, ghost flags, and mutually exclusive state coexisting at summary time
- [ ] Record pass/fail with concrete event/flag/summary pointers for each failure
- [ ] Save report under `docs/test-reports/`
- [ ] Relevant tests pass

### US-006: P25 Simulation Acceptance Baseline
**Description:** As a maintainer, I want a simulation baseline for lifetime goals so that later tuning uses before/after evidence instead of impressions.

**Acceptance Criteria:**
- [ ] Define commands, sample count, seed range, and metrics for mainstream achievement reachability and path divergence
- [ ] Run baseline and save JSON under `docs/test-reports/`
- [ ] Include at least: achievement unlock rates, path divergence proxy, high-severity contradiction count
- [ ] Document acceptance direction for Wave 1 (not final North Star thresholds for pinnacle/mixed/ordinary origins)
- [ ] Do not modify gameplay behavior beyond adding reporting if needed

### US-007: Wave 1 Experience Rebalance Pass
**Description:** As a player, I want Wave 1 improvements applied across the full life arc so that mainstream goals and choice consequences are felt in play, not only in reports.

**Acceptance Criteria:**
- [ ] Apply bounded content/config changes so mainstream achievements are pursuable without requiring extreme luck
- [ ] Fix top contradiction failures identified in US-005
- [ ] Improve at least 1 measurable baseline metric from US-006 without regressing gates
- [ ] Stay within tuning_config / world profile unless audit proves runtime is required (document layer choice)
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-008: P25 Wave 1 Closure Report
**Description:** As a maintainer, I want a Wave 1 closure report so that Discovery can propose Wave 2 stories against explicit remaining gaps.

**Acceptance Criteria:**
- [ ] Summarize Wave 1 before/after metrics and gate results
- [ ] Map each Ultimate North Star Goal to met / partial / missing with evidence paths
- [ ] List recommended Wave 2 priorities (pinnacle luck gates, randomness, mixed achievements, ordinary origins)
- [ ] Confirm `gate:playability` and `gate:p20` do not regress
- [ ] Save under `docs/test-reports/`

## 6. Functional Requirements

1. FR-1: Wave 1 must reuse P16 composite destiny, rare lines, and origin surfaces before adding new runtime semantics.
2. FR-2: Achievement tiers (mainstream / pinnacle / mixed) must be expressible in profile-first config.
3. FR-3: Choice feedback must satisfy the three-layer standard for both active and event-triggered choices on priority paths.
4. FR-4: Validation must include contradiction detection with actionable pointers, not manual log reading only.
5. FR-5: Simulation metrics must be reproducible (fixed commands, seeds, sample counts) and stored under `docs/test-reports/`.
6. FR-6: Each optimization slice must declare allowed layer (`tuning_config` / world profile / runtime) per simulation-driven workflow.
7. FR-7: Discovery `--pipeline-auto` may append Wave 2+ stories only when gaps trace to Ultimate North Star Goals §2; scope expansions require PRD amendment and BLOCKED status.

## 7. Non-Goals（Wave 1）

- 不在 Wave 1 一次性实现全部巅峰运气门槛、混合成就、平凡出身（属 Wave 2–4）
- 不做 UI 主题切换或大规模前端改版
- 不做新题材 / 新 world profile 主题
- 不做大规模 scheduler / simulation core 重写
- 不替代 P24 真人试玩流程；P25 以模拟验收 + 内部 gate 为主，试玩对齐可后续追加

## 8. Design Considerations

- 主流成就是「可追目标」；巅峰成就是「人生高光 + 运气」；混合成就是「重玩探索奖励」
- 平凡出身不是数值 debuff，而是不同的机会图
- 随机事件必须可复盘；玩家应理解「差一步」的原因
- 与 P20 可重玩性协同：减少无意义重复，保留主题回响

## 9. Technical Considerations

- 优先 `tuning_config` 与 world profile 内容结构；runtime 仅当 config 无法表达时升级
- 指标与 slice 模板沿用 `simulation-driven-optimization-workflow.md`
- `prd.json` 仅为 Wave 1 执行索引；Discovery 增量追加不得修改已 `passes: true` 的 Story

## 10. Success Metrics（Wave 1）

- Ultimate North Star Goals 对照表完成，Wave 1 相关项至少达到 **partial** 以上
- ≥5  mainstream achievements 具备组合条件且模拟可观测
- 一致性 validation slice **零 critical** 矛盾（或已全部修复）
- 模拟 baseline 建立且 Wave 1 rebalance 至少 1 项指标改善
- `gate:playability`、`gate:p20` 保持通过

## 11. Open Questions

- ~~Wave 1 的 5 个主流成就是否沿用 P16 三条并扩展两条，还是重新定义代表集？~~ → **已冻结，见 §12**
- 巅峰成就的目标达成率上限（模拟）是否设为 &lt;5% 待 Wave 2 校准？
- 平凡出身是否优先扩展现有 origin surfaces，还是新增独立 origin pool？

## 12. Frozen Decisions（冻结决策 — 后续会话不得重议）

| 决策项 | 冻结值 | 理由 |
| --- | --- | --- |
| Wave 1 主流成就代表集 | **P16 三条 + `jianghu_renown_sage` + `medical_sage_healer`** | 保留已验证组合命运；补声望/医术非武路线；避免 Wave 1 重定义 |
| 巨贾行商 | **推迟至 Wave 3**（混合成就） | 商路内容薄于医术/声望线；与 mixed 跨界目标更契合 |
| P16 三条 | **保留 ID 与既有门槛**；Wave 1 只做可追溯性与内容/consistency 加固 | 不改动已 closure 的 P16 语义 |
| 新增 `jianghu_renown_sage` | 武学 ≥45；声望 ≥65；社会资本 ≥55；关键 flag `mentor_bond` 或 `ally_network` | 非纯武堆叠；复用已有师徒/人脉线 |
| 新增 `medical_sage_healer` | 声望 ≥55；资源 ≥30；关键 flag `medical_divine_doctor_fame` 或 `medical_imperial`；医德辅助 `medical_plague_hero` 或 `medical_pure`；与 `medical_poison_path` 互斥 | 对齐 `medical.json` 现有医术链；非 martial 单轴 |
| 配置落点 | `WUXIA_COMPOSITE_DESTINY_OUTCOMES`（`wuxiaOriginSurfaces.ts`）+ 必要 event/flag 接线 | 与 P16 profile-first 路径一致 |

详述与组合条件表见 `docs/designs/p25-lifetime-simulation-north-star.md` §3.1。

## 13. Pipeline Bootstrap

启动 Discovery 外层环：

```text
/prd-pipeline-orchestrator --discovery docs/PRD/p25-wuxia-lifetime-simulation-experience.md:docs/PRD/p25-wuxia-lifetime-simulation-experience.prd.json
```

Discovery CLEAR 条件见 `docs/designs/p25-lifetime-simulation-north-star.md` §8。
