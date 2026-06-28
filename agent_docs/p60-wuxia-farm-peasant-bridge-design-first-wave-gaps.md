# P60 Farm-Peasant Bridge Design-First Wave — Gaps

> **Stage:** p60-wuxia-farm-peasant-bridge-design-first-wave
> **Discovery date:** 2026-06-28
> **North Star ref:** docs/designs/p25-lifetime-simulation-north-star.md §8

---

## 1. Current Stage Gaps

### In-Stage Gaps (已闭合)

| Gap | Status | Closing Story | Evidence |
|-----|--------|---------------|----------|
| `farm_peasant` bridge direction ambiguity | ✅ Closed | P60-001, P60-003, P60-004 | Gap audit + candidate comparison + chosen direction (grain-merchant adjacent) |
| No implementation-ready bridge contract | ✅ Closed | P60-005 | Bridge contract with prerequisites, checkpoint, flag scope, expression changes |
| P61 scope undefined | ✅ Closed | P60-002, P60-006 | Scope contract + P61 validation shape with test matrix and success criteria |
| No closure evidence | ✅ Closed | P60-007 | Closure report with full deliverables inventory and handoff to P61 |

**结论：** 当前阶段（P60 design-first）所有目标已达成，无 in-stage 遗留 gap。

---

## 2. North Star §8 Gaps (End-State Open Items)

对照 `docs/designs/p25-lifetime-simulation-north-star.md` §8 Discovery 完成判定：

| §8 Item | Status | Gap Detail |
|---------|--------|------------|
| 1. 主流、混合、巅峰三类成就均有可玩样本且规则文档化 | ⚠️ Partial | 主流成就 5 条中部分待实现；巅峰成就（Wave 2）、混合成就（Wave 3）尚未完全落地 |
| 2. 平凡出身 ≥3 种产生与鲜明出身可区分的早期与中期轨迹 | ⚠️ Partial | 3 种平凡出身已有（P56），但 `farm_peasant` 的 playable bridge 尚未实现（P61 待实施）。已完成：`town_apprentice`（P58）、`tavern_hand`（P59）。未完成：`farm_peasant` playable bridge |
| 3. 主动 + 事件触发选择的后果链零自相矛盾 | ⚠️ Partial | 已实现部分持续验证中，需随内容扩充持续保持 |
| 4. 模拟门禁证明：巅峰需运气+选择；主流可单靠合理选择+时间达中高档 | ❌ Open | 完整模拟门禁证据待 Wave 1–3 完成后建立 |
| 5. `gate:playability`、`gate:p20` 及 P25 专用报告不退化 | ⚠️ Partial | 当前 gates 工作正常，需在每个 stage 后验证不退化 |

**关键开放项：**

- **END-001:** `farm_peasant` playable bridge 未实现 — 3 种平凡出身中仅 2 种有完整 bridge，`farm_peasant` 仅有 design contract，无 runtime playable proof
- **END-002:** 主流成就 5 条尚未全部实现（`jianghu_renown_sage`、`medical_sage_healer` 待 Wave 1 完成）
- **END-003:** 巅峰成就（Wave 2）与混合成就（Wave 3）尚待实施
- **END-004:** 完整模拟门禁证据待建立

---

## 3. Gap Routing

| Gap | Route | Rationale |
|-----|-------|-----------|
| END-001: `farm_peasant` playable bridge | **Next Stage (P61)** | P60 已产出 design contract，P61 已在队列中作为实现阶段，直接承接 |
| END-002 ~ END-004 | **Deferred (later waves)** | 超出 P60/P61 范围，属于 Wave 1 剩余项、Wave 2、Wave 3 的范畴，不在本 stage chain 内处理 |

---

## 4. Next Stage Confirmation

**下一阶段：** P61 Wuxia Farm Peasant Playable Bridge

- PRD: `docs/PRD/p61-wuxia-farm-peasant-playable-bridge.md` — ✅ 已存在
- PRD JSON: `docs/PRD/p61-wuxia-farm-peasant-playable-bridge.prd.json` — ✅ 已存在
- Stage slug: `p61-wuxia-farm-peasant-playable-bridge`
- Queued behind current: **true** — P61 明确承接 P60 design contract，位于 P60 之后

**P61 承接内容（来自 P60 closure）：**
1. 按 P60 bridge contract 实现最小 playable bridge
2. 接入 P55 magnate chain downstream gate
3. 添加 peasant bridge 表达（currentGoal / lifeMemory / summary）
4. 产出 targeted proof 和窄回归测试
5. 产出 closure report

---

## 5. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| P61 实施时偏离 P60 contract | Medium | P61-001 先做 formal intake，明确 scope contract |
| Peasant identity 在 bridge 后丢失 | Low | P60 contract 已明确 `detectOrdinaryOrigin()` 仍返回 `farm_peasant` |
| Scope creep 进入农业/迁移系统 | Low | P60/P61 scope contract 已明确禁止，closure report 已列出 deferred items |

---

Generated: 2026-06-28
