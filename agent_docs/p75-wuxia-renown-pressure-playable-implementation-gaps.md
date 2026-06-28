# P75 Wuxia Renown Pressure Playable Implementation — Gaps

## In-Stage Gaps (None)

P75 阶段所有 7 个 user stories 均已通过，无 in-stage gaps。

| # | Gap | Route to Close |
|---|-----|----------------|
| — | None — all stories passed | N/A |

## Next-Stage Gaps (→ P76)

### NS-001: Renown Payoff Stage Missing
- **Severity:** High
- **North Star ref:** §3.1 Wave 1 主流成就 — `jianghu_renown_sage` 完整可玩样本
- **Description:** Renown 路线目前有 bridge → entry → on-ramp → pressure，但缺 payoff 阶段。Pressure 提出了问题（人情债怎么还？），但没有给出答案。按照 merchant trilogy 方法论，每条路线应该有完整的 rise → cost → resolution 弧线。
- **Evidence:** P75 closure report §7 明确 GO recommendation for payoff stage；P75-004 已预留 payoff flag 接口
- **Routing:** next-stage → P76 renown payoff（建议 design-first）

### NS-002: Age-40 Identity Deepening Missing
- **Severity:** Medium
- **North Star ref:** §3.1 Wave 1 主流成就 — 可玩样本应有完整身份感
- **Description:** Renown 路线在 40 岁后应有的身份深化（如"江湖名宿"的具体形态、日常状态、终局画像）尚未实现。P75-004 已预留 `renown_age40_identity_done` flag 接口。
- **Evidence:** P75 closure report §6 deferred items；sampleLineExpression.ts 中 renownAge40Identity TODO
- **Routing:** next-stage → P76+ payoff 阶段一并考虑

### NS-003: Choice-Based Payoff Not Explored
- **Severity:** Medium
- **North Star ref:** §4.2 事件触发选择 — 选项必须对当前状态合理
- **Description:** Merchant payoff 是 auto event，但 renown payoff 可以差异化——人情债怎么还？硬扛到底 / 索性撕破脸 / 找到平衡？choice-based payoff 能提升 renown 路线的独特性。
- **Evidence:** P75 closure report §7.2 推荐 explore choice-based payoff
- **Routing:** next-stage → P76 design-first 阶段评估

## Far-Future Gaps (→ Post-P76 Cycles)

### NS-004: Medical Sage Healer Second Achievement Line
- **Severity:** High
- **North Star ref:** §3.1 Wave 1 主流成就 — 5 条主流成就
- **Description:** Wave 1 第二条新成就线 `medical_sage_healer`（一代名医）完全未启动。
- **Routing:** future cycle

### NS-005: Mentor-Bond Renown Seed
- **Severity:** Medium
- **North Star ref:** §3.1 `jianghu_renown_sage` — mentor_bond 或 ally_network 至少其一
- **Description:** Renown 路线目前只有 ally_network seed，mentor-bond seed（第二条 renown 路线）未启动。
- **Routing:** future cycle

### NS-006: Other Origins Renown Bridges
- **Severity:** Medium
- **North Star ref:** §3.4 平凡出身 — 多种出身应有可区分轨迹
- **Description:** Renown 路线目前仅覆盖 tavern_hand 出身，farm_peasant / town_apprentice 等其他出身的 renown bridge 未实现。
- **Routing:** future cycle

### NS-007: Wave 2 Peak Achievements
- **Severity:** High
- **North Star ref:** §3.2 巅峰成就（Wave 2）
- **Description:** 巅峰成就（运气 + 选择双门槛）完全未启动。
- **Routing:** far future

### NS-008: Wave 3 Mixed Achievements
- **Severity:** High
- **North Star ref:** §3.3 混合成就（Wave 3）
- **Description:** 混合成就（跨界组合）完全未启动。
- **Routing:** far future

### NS-009: Wave 4 Ordinary Origins
- **Severity:** Medium
- **North Star ref:** §3.4 平凡出身（Wave 4）
- **Description:** 平凡出身扩展（普通农户、小镇学徒等）和机会结构差异化未完成。
- **Routing:** far future
