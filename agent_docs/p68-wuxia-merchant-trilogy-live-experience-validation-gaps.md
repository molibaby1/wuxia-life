# P68 Discovery Gaps — Merchant Trilogy Live Experience Validation

> **Stage:** P68 Wuxia Merchant Trilogy Live Experience Validation
> **North Star Ref:** p25-lifetime-simulation-north-star.md §8
> **Discovery Mode:** post-run, pipeline-auto

---

## 1. Stage Gap Analysis

### P68 Stage Status: CLEAR

P68 的所有 8 个 user stories 均已完成并通过验证：

| Story | Title | Status |
|-------|-------|--------|
| P68-001 | Audit existing merchant trilogy validation assets | ✅ Pass |
| P68-002 | Lock P68 validation scope contract | ✅ Pass |
| P68-003 | Define merchant trilogy experience verdict contract | ✅ Pass |
| P68-004 | Produce a bounded merchant trilogy comparison readout | ✅ Pass |
| P68-005 | Run merchant trilogy human-readable playtest readout | ✅ Pass |
| P68-006 | Judge methodology transfer readiness | ✅ Pass |
| P68-007 | Add narrow validation reinforcement if needed | ✅ Pass |
| P68-008 | Produce P68 closure report | ✅ Pass |

**验证证据：**
- Closure report: `docs/test-reports/p68-merchant-trilogy-live-experience-closure-report.md`
- Verify result: `agent_docs/p68-wuxia-merchant-trilogy-live-experience-validation-verify-result.md`
- Typecheck: ✅ Pass
- guard:sample-lines-baseline: ✅ Pass
- Runtime code changes: 0（纯文档阶段）

**In-stage gaps: None.** P68 阶段目标已全部达成，无遗留缺口需要追加到当前 stage。

---

## 2. North Star §8 Gap Analysis

对照 `p25-lifetime-simulation-north-star.md` §8 Discovery 完成判定的 5 条标准：

### END-001: 主流、混合、巅峰三类成就均有可玩样本且规则文档化
**Status: OPEN**

**已达成：**
- 主流成就 Wave 1 中 P16 三条（`grandmaster_guardian`、`sect_leader_statesman`、`lone_sword_legend`）已有实现
- Merchant trilogy（ordinary→mixed）有三条可玩路线：apprentice / tavern / peasant → merchant

**缺口：**
- Wave 1 新增两条主流成就（`jianghu_renown_sage`、`medical_sage_healer`）尚未实现
- 巅峰成就（Wave 2）尚未开始
- 混合成就（Wave 3）除 merchant 外尚无其他样本
- `merchant_magnate`（巨贾行商）推迟至 Wave 3

**路由：** NEXT_STAGE（P69 开始选线，逐步扩展成就谱系）

---

### END-002: 平凡出身 ≥3 种产生与鲜明出身可区分的早期与中期轨迹
**Status: OPEN**

**已达成：**
- Merchant trilogy 有 3 条 ordinary origin 路线（apprentice / tavern / peasant）
- 三条路线在 merchant 终点有差异化表达

**缺口：**
- 这 3 条是「鲜明出身」（有明确职业标签），不是「平凡出身」
- Wave 4 的平凡出身光谱（普通农户、小镇学徒、跑堂伙计、书塾子弟）尚未开始
- 尚未验证平凡出身与鲜明出身在早期/中期轨迹的可区分性

**路由：** NEXT_STAGE（远期 Wave 4，当前优先级低于路线扩展）

---

### END-003: 主动 + 事件触发选择的后果链，在验收切片中零自相矛盾
**Status: OPEN**

**已达成：**
- Merchant trilogy 在表达层验证了后果一致性（cost-shape alignment）
- P16 三条主流成就有既定规则

**缺口：**
- P68 只验证了 merchant 线的表达层差异，未做全面后果链一致性审计
- 跨路线的后果链一致性（如不同路线的同名 flag 是否冲突）尚未系统验证
- 「零自相矛盾」需要更全面的验收切片覆盖

**路由：** NEXT_STAGE（随新路线扩展逐步加固，非当前优先级）

---

### END-004: 模拟门禁证明：巅峰成就需运气+选择；主流成就可单靠合理选择+时间达到中高档
**Status: OPEN**

**已达成：**
- P16 三条主流成就已有模拟基础
- Merchant trilogy 有 replay 基础设施

**缺口：**
- 巅峰成就尚未实现，无法验证运气+选择双门槛
- 主流成就的「合理选择+时间可达中高档」尚未通过模拟门禁正式证明
- 缺乏 P25 专用的模拟门禁报告体系

**路由：** NEXT_STAGE（随成就谱系扩展逐步建立门禁）

---

### END-005: gate:playability、gate:p20 及 P25 专用报告不退化
**Status: PARTIALLY VERIFIED**

**已达成：**
- guard:sample-lines-baseline 通过（spine + expression + replay）
- Typecheck 通过
- P68 零运行时代码改动，无退化风险

**缺口：**
- P25 专用报告体系尚未完全建立
- gate:p20（可重玩门禁）的 P25 专用版本未明确
- 跨阶段退化监控机制待完善

**路由：** NEXT_STAGE（随路线扩展逐步完善门禁体系）

---

## 3. Gap Routing Summary

| Gap ID | Description | Routing | Target Stage |
|--------|-------------|---------|--------------|
| END-001 | 成就谱系不完整（缺 Wave 1 新增两条、Wave 2 巅峰、Wave 3 混合） | NEXT_STAGE | P69 选线 → P70-P72 实施 → 后续 Wave |
| END-002 | 平凡出身光谱未建立 | NEXT_STAGE | Wave 4（远期） |
| END-003 | 全面后果链一致性未验证 | NEXT_STAGE | 随新路线逐步加固 |
| END-004 | 模拟门禁未正式建立 | NEXT_STAGE | 随成就谱系扩展逐步建立 |
| END-005 | P25 专用报告体系待完善 | NEXT_STAGE | 随路线扩展逐步完善 |

**In-stage gaps: 0** — P68 阶段目标已全部达成。

**All gaps routed to NEXT_STAGE.** P68 是验证阶段，不是实施阶段；North Star 的缺口需要通过后续阶段（P69+）逐步填补，而非追加到 P68。

---

## 4. Deferred Items from P68

P68 closure report 中列出的 6 项 deferred items（不属于 P68 scope，但值得后续关注）：

| Item | Priority | Notes |
|------|----------|-------|
| External user playtest | Medium | 内部评审已足够，外部用户测试非阻塞 |
| Playtest platformization | Low | 基础设施投入大，当前不需要 |
| Full lifetime comparative exhaust | Low | payoff-phase 比较已足够，边际效益递减 |
| Destiny sentence UI wiring | Medium-High | 功能存在但无展示入口，玩家实际看不到 |
| Mechanical cost differentiation | Low | 高成本高风险，expression-only 已验证有效 |
| Fourth merchant bridge | TBD | 取决于 P69+ 方向 |

这些 deferred items 不阻塞 P68 的 CLEAR 状态，也不阻塞进入 P69。

---

Generated: 2026-06-29
