# P80 Renown Endgame Design-First — Gaps Report

> **Stage:** P80 Wuxia Renown Endgame Design-First Contract
> **Discovery mode:** post-run (pipeline-auto)
> **Date:** 2026-06-29

---

## 1. Stage Gaps (In-Stage)

### Gap-S01: [NONE] P80 所有 story 已完成

**Status:** No gap

**Evidence:**
- P80-001 ~ P80-007 全部 7 个 user stories 标记为 `passes: true`
- Closure report 已产出：`docs/test-reports/p80-renown-endgame-closure-report.md`
- Verify result: PASS（3 个 optional fix，不影响核心交付）
- Endgame contract 已 LOCKED：`docs/PRD/p80-renown-endgame-contract.md`
- P81 validation shape 已定义：`docs/test-reports/p80-p81-validation-shape.md`

**Verdict:** P80 stage 无未完成 gap，stage_status: CLEAR

---

## 2. North Star Gaps (End-State)

### Gap-NS1: jianghu_renown_sage 缺 endgame runtime 实现

**Severity:** High — renown 路线最后一环
**Route:** In-stage → **Next-stage (P81)**

**Description:**
P80 已完成 endgame design-first contract，但 runtime 实现（事件 wiring + expression updates）还没做。renown 路线当前完整度：bridge → entry → on-ramp → pressure → payoff → late-life → endgame-design，缺 endgame-implementation。

**Evidence:**
- `docs/PRD/p80-renown-endgame-contract.md` — contract LOCKED，等待实现
- `docs/test-reports/p80-renown-endgame-closure-report.md` — CONDITIONAL_GO for P81
- 代码库中无 `renown_endgame_echo` 事件配置
- 代码库中无 endgame expression 更新

**North Star mapping:** §3.1 Wave 1 主流成就 — jianghu_renown_sage 生命周期完整性

**Fix:** P81 renown endgame playable implementation（lightweight: 1 echo event + expression updates）

---

### Gap-NS2: medical_sage_healer 第二条成就线缺完整路线架构

**Severity:** High — Wave 1 5 条主流成就之一
**Route:** Next-cycle（P81 之后）

**Description:**
North Star §3.1 定义了 5 条 Wave 1 主流成就，其中 medical_sage_healer（一代名医）只有 P34 lifetime slice，缺完整路线架构（bridge → entry → on-ramp → pressure → payoff → late-life → endgame）。

**Evidence:**
- `docs/designs/p25-lifetime-simulation-north-star.md` §3.1 — medical_sage_healer 是 Wave 1 新增两条之一
- P34 只有 lifetime slice，不是完整路线
- 当前只有 jianghu_renown_sage 一条完整生命周期路线

**North Star mapping:** §3.1 Wave 1 主流成就；§6 重玩动机（≥3 条 materially different 轨迹）

**Fix:** 未来阶段启动 medical_sage_healer 路线（需要先做 design-first，再 implementation）

---

### Gap-NS3: 巅峰成就（Wave 2）仅 1 个 proven outcome

**Severity:** Medium — Wave 2
**Route:** Deferred（Wave 2+）

**Description:**
North Star §3.2 定义了巅峰成就（运气 + 选择双门槛），当前仅 jianghu_myth_legend 有 lifetime trace，其他巅峰成就未定义。

**North Star mapping:** §3.2 Wave 2 巅峰成就

**Fix:** Wave 2 阶段处理

---

### Gap-NS4: 混合成就（Wave 3）仅 1 个 proven outcome

**Severity:** Medium — Wave 3
**Route:** Deferred（Wave 3+）

**Description:**
North Star §3.3 定义了混合成就（跨界组合），当前仅 healer_swordsman 有 lifetime trace，其他混合成就未定义。

**North Star mapping:** §3.3 Wave 3 混合成就

**Fix:** Wave 3 阶段处理

---

### Gap-NS5: renown 路线仅覆盖 tavern_hand 出身

**Severity:** Low — Wave 4 / 扩展
**Route:** Deferred（远 future）

**Description:**
jianghu_renown_sage 路线当前仅覆盖 tavern_hand 出身 + ally_network seed，其他出身（farm_peasant、town_apprentice 等）没有 renown bridge。

**North Star mapping:** §3.4 Wave 4 平凡出身光谱

**Fix:** 远未来扩展阶段

---

### Gap-NS6: full content pool 未穷尽审计

**Severity:** Low
**Route:** Deferred

**Description:**
验收切片已验证零矛盾，但 full content pool 未穷尽审计。

**North Star mapping:** §8.3 后果链零自相矛盾

**Fix:** 未来审计阶段

---

## 3. Gap Routing Summary

| Gap | Severity | Route | Action |
|-----|----------|-------|--------|
| Gap-NS1: renown endgame runtime | High | Next-stage (P81) | **Spawn P81 PRD** |
| Gap-NS2: medical_sage_healer 路线 | High | Next-cycle | Defer (renown 先闭合) |
| Gap-NS3: 巅峰成就 Wave 2 | Medium | Wave 2+ | Defer |
| Gap-NS4: 混合成就 Wave 3 | Medium | Wave 3+ | Defer |
| Gap-NS5: renown 其他出身 | Low | Far future | Defer |
| Gap-NS6: full pool 审计 | Low | Deferred | Defer |

**In-stage gaps count: 0**
**Next-stage gaps count: 1** (endgame implementation)
**Deferred gaps count: 5**

---

## 4. Verification

- [x] P80 所有 7 个 user stories 通过
- [x] Closure report 已产出
- [x] Endgame contract 已 LOCKED
- [x] P81 validation shape 已定义
- [x] Verify result: PASS
- [x] 无 in-stage gap 需要补充 story
- [x] Next-stage gap (endgame implementation) 需 spawn P81
