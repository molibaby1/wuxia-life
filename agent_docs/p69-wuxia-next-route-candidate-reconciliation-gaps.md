# P69 Gaps — Next Route Candidate Reconciliation

> **Stage:** p69-wuxia-next-route-candidate-reconciliation
> **Discovery mode:** post-run (pipeline-auto)
> **Date:** 2026-06-29

---

## Gap Routing Summary

| Gap Category | Route | Count |
|-------------|-------|-------|
| In-stage (P69) | 0 | P69 is documentation-only; all 8 stories pass |
| Next-stage (P70+) | 8 | All gaps are implementation-stage, deferred to P70–P72 and beyond |

---

## In-Stage Gaps (P69)

**None.** P69 is a bounded route-selection and candidate-comparison stage. All 8 user stories are complete:

- P69-001: Candidate inventory ✅
- P69-002: Scope contract ✅
- P69-003: Evidence strength comparison ✅
- P69-004: Methodology fit comparison ✅
- P69-005: Implementation risk comparison ✅
- P69-006: Route selection (jianghu_renown_sage selected) ✅
- P69-007: Narrow reinforcement assessment (none needed) ✅
- P69-008: Closure report ✅

Evidence: `docs/test-reports/p69-next-route-candidate-closure-report.md` confirms all deliverables, validation passes, and success criteria met.

---

## Next-Stage Gaps (Routed to P70 / P71 / P72 / Later Waves)

### NS-3.1: Wave 1 主流成就 — jianghu_renown_sage 未实现可玩桥接

- **North Star ref:** §3.1 Wave 1 新增两条（US-003 目标配置 — 待实现）
- **Gap:** `jianghu_renown_sage` 的 gate 配置存在，但没有从任何 ordinary origin 的可玩 bridge（事件驱动的"过桥"链条）
- **Evidence:** P69 inventory §2.4 — "Playable bridge: ❌ No ordinary-origin playable bridge"
- **Routed to:** **P70** (design-first contract) → **P71** (playable bridge implementation)
- **Status:** OPEN

### NS-3.1: Wave 1 主流成就 — medical_sage_healer 完全未启动

- **North Star ref:** §3.1 Wave 1 新增两条
- **Gap:** `medical_sage_healer` 尚未进入选线或设计阶段，没有 ordinary-origin bridge seed、没有 short-chain proof、没有实现规划
- **Evidence:** P69 inventory §4 — `healer_swordsman` 因 ordinary-origin wiring 不足被排除；medical 线甚至未作为独立候选进入 P69
- **Routed to:** Future wave (after jianghu_renown_sage replication completes)
- **Status:** OPEN — will need its own candidate-selection or design stage

### NS-3.2: Wave 2 巅峰成就 — 未启动

- **North Star ref:** §3.2 巅峰成就（Wave 2 — 运气 + 选择双门槛）
- **Gap:** 巅峰成就（武林神话、开派祖师等）完全未进入规划；没有配置、没有事件池、没有验证
- **Routed to:** Post-Wave 1 — after all 5 mainstream achievements are playable
- **Status:** OPEN

### NS-3.3: Wave 3 混合成就 — merchant_martial_patron 被 defer

- **North Star ref:** §3.3 混合成就（Wave 3 — 跨界组合）
- **Gap:** `merchant_martial_patron` 作为混合成就候选在 P69 被 defer，原因是缺少 ordinary-origin dual seed（merchant + martial）
- **Evidence:** P69 closure §3.2 — "No ordinary-origin bridge seed; higher complexity; better as second replication"
- **Routed to:** After jianghu_renown_sage replication reaches P71–P72 (bridge + entry differentiation complete)
- **Status:** OPEN — deferred, not rejected

### NS-3.4: Wave 4 平凡出身 — 仅部分完成

- **North Star ref:** §3.4 平凡出身下的可信人生（Wave 4 — 出身光谱）
- **Gap:** 现有 3 种 ordinary origins（tavern_hand / farm_peasant / town_apprentice），但：
  - 只有 merchant 线有完整可玩 bridge
  - renown 线仅有 fixture-level baseline，无可玩 bridge
  - 其他路线（medical、martial-pure 等）的 ordinary-origin 内容更薄
- **Routed to:** Progressive — each route replication adds ordinary-origin depth
- **Status:** OPEN

### NS-6: 重玩动机指标 — 新路线尚未贡献多样性

- **North Star ref:** §6 重玩动机
- **Gap:** 当前"不同出身 + 不同关键选择产生 ≥3 条 materially different 轨迹"的指标主要依赖 merchant trilogy 路线；新路线（renown、medical、patron）尚未可玩，尚未贡献轨迹多样性
- **Routed to:** P72+ — after entry differentiation, new routes will add replay diversity
- **Status:** OPEN

### NS-8.1: 三类成就均有可玩样本 — 远未完成

- **North Star ref:** §8 Discovery 完成判定
- **Gap:** 主流成就 5 条中仅 3 条（P16 三条）已实现、2 条（renown、medical）待实现；混合成就仅 merchant_magnate 完整；巅峰成就 0 条
- **Routed to:** Multi-wave — Wave 1 (mainstream) → Wave 2 (peak) → Wave 3 (mixed)
- **Status:** OPEN

### NS-8.2 ~ NS-8.5: 其余 Discovery 完成标准

- **North Star ref:** §8 全部 5 项标准
- **Gap:** 平凡出身 ≥3 种可区分轨迹（部分）、零自相矛盾（ongoing）、巅峰成就运气+选择门禁（未启动）、gate 不退化（ongoing）
- **Routed to:** Progressive — each wave improves coverage
- **Status:** OPEN

---

## Summary

P69 has **zero in-stage gaps** — the route-selection stage is fully complete with all 8 stories passing and all deliverables verified.

All identified gaps are **next-stage** and map to the already-queued pipeline:
- **P70** (design-first contract for jianghu_renown_sage bridge) — addresses NS-3.1 gap 1
- **P71** (playable bridge implementation) — addresses NS-3.1 gap 1 (runtime)
- **P72** (entry differentiation) — addresses NS-6 (replay diversity)

Further gaps (medical_sage_healer, peak achievements, merchant_martial_patron, Wave 4 ordinary depth) are queued for later waves and will spawn their own stages when reached.
