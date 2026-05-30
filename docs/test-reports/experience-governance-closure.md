# 体验治理 Closure（包 A–D）

生成时间：2026-05-30T04:42:33.635Z

## 1. 摘要

- 样本数：6（含 3 条路线专项）
- 门禁决策：**PASS**
- 警告项失败（不阻断）：true

## 2. 包 A–C 能力收口

| 包 | 能力 |
|----|------|
| A | 统一 eventHistory；复读脚本走引擎；flags 门禁 |
| B | main_story 退出 critical；候选池 cap=12 |
| C | 路线加载一致；completion flag；路线保底槽 + 专项样本 |
| D | 体验健康门禁 `gate:experience`；复读三项 blocker 且 nonWaivable；已接入 validate/CI |

## 3. 包 D 复读门禁（已生效）

以下三项在 `experienceHealthMetricDefinitions.ts` 中为 **blocker** 且 **nonWaivable**，超标即阻断 `npm run validate` / `npm run gate:experience`：

- `adjacent_same_event_rate`（max 0.08）
- `adjacent_same_class_rate`（max 0.35）
- `short_window_same_class_rate`（max 0.45）

## 4. 指标对照

| metric | severity | status | actual | detail |
|--------|----------|--------|--------|--------|
| choice_rate | blocker | pass | 0.5023 | actual=0.5023, min=0.2, max=0.75 |
| route_breakage_rate | blocker | pass | 0.0000 | actual=0.0000, min=0, max=0.4 |
| adjacent_same_event_rate | blocker | pass | 0.0000 | actual=0.0000, max=0.08 |
| adjacent_same_class_rate | blocker | pass | 0.0000 | actual=0.0000, max=0.35 |
| short_window_same_class_rate | blocker | pass | 0.1667 | actual=0.1667, max=0.45 |
| route_load_parity | blocker | pass | 1.0000 | actual=1.0000, min=1, max=1 |
| auto_event_rate | warning | pass | 0.4977 | actual=0.4977, min=0.25, max=0.8 |
| route_completion_rate | warning | pass | 0.4286 | actual=0.4286, min=0.1, max=0.6 |
| death_rate | warning | fail | 1.0000 | actual=1.0000, min=0.15, max=0.9 (above max) |
| formal_event_ratio | warning | pass | 0.8325 | actual=0.8325, min=0.5, max=0.9 |
| daily_event_ratio | warning | pass | 0.1675 | actual=0.1675, min=0.1, max=0.5 |
| top_event_concentration | warning | pass | 0.0588 | actual=0.0588, max=0.35 |
| ending_distribution | info | pass | 0.6667 | actual=0.6667 |
| romance_family_achievement_rate | info | warning | 0.0000 | actual=0.0000, min=0.05, max=0.7 (below min) |
| save_count | info | pass | 0.0000 | actual=0.0000, min=0, max=12 |
| family_event_share | info | pass | 0.1483 | actual=0.1483, max=0.45 |
| route_stuck_active_rate | info | pass | 0.5714 | actual=0.5714, max=0.7 |

## 5. 验证命令

```bash
npm run typecheck
npm test
npm run gate:experience
npm run simulate:gameplay:samples -- --gate
npm run repro:event-repetition
npm run report:rhythm-metrics
npm run report:experience-governance-closure
```

`gate:experience` 已接入 `npm run validate` 与 `.github/workflows/ci.yml`，无需再单独纳入 CI。

## 6. 残余风险

- `death_rate` 仍为 warning 级别 fail（当前样本 actual=1.0，高于 max=0.9），不阻断门禁决策
- `romance_family_achievement_rate` 仍为 info 级别 warning/fail（样本内未达 min=0.05），不阻断门禁决策
- 路线专项样本依赖 fixture bootstrap，与纯随机游玩口径不同，结论外推需谨慎

## 7. 后续建议

- 持续观察 `death_rate` / `romance_family_achievement_rate` 是否需调阈值或升 severity
- 扩展路线专项样本覆盖，或降低 fixture bootstrap 对路线指标的影响
- 复读 blocker 已生效；后续重点转向 P2 warning/info 指标与样本代表性
