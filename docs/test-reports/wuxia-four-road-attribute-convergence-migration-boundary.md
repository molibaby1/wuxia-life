# Wuxia Life 四道路收敛迁移边界与残余风险

## 已验证边界

- 旧 `routeStates` 可以在明确的迁移入口转换为规范四道路承诺；迁移夹具覆盖 merchant → statecraft。
- merchant 的既有关键选择现在显式写入 statecraft commitment；开店成果写入 proof 并推进到 `locked_in`。
- merchant identity 与 statecraft road 分开记录；identity 变化不会覆盖道路阶段。
- 仅修改 reputation 不会推进道路阶段；money 与旧 merchant flags 不能单独解锁 `richest_man`。
- merchant visible growth、operating chain、native endgame、snapshot 与核心测试保持通过。

## 未迁移内容

- 其他旧路线 flag 仍保留，尚未批量转换为规范道路承诺。
- 旧事件文本与大部分 merchant 线仍使用历史 flag 作为事件条件。
- 组合道路终局未实现。
- 浏览器真实交互验收未在本轮执行；本轮使用现有 headless/UI model 与 merchant route gates。

## 残余风险

1. 新增道路生命周期 effect 目前只接入 merchant 垂直切片，其他道路仍需各自的窄切片。
2. 历史存档只有在明确经过 snapshot/load 迁移边界后，才能获得规范 road commitment；不能在每个事件条件中依赖双轨判断。
3. 旧路线 flag 与规范道路状态短期并存，后续扩展必须避免把 identity、flag 或普通属性重新当成道路真值。

## 本轮证据

- `tests/testRoadLifecycle.ts`
- `tests/testIdentityKarmaSystem.ts`
- `tests/testLifeMemorySummary.ts`
- `tests/testEndingSystem.ts`
- `tests/headless/snapshotAdapter.test.ts`
- `tests/testMerchantStatecraftVerticalSlice.ts`
- `tests/hvgMerchantVisibleGrowthLoopTests.ts`
- `tests/p100MerchantMagnateNativeEndgameTests.ts`
- `tests/AllTests.ts`
- `npm run typecheck`
