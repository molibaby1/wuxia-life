# Canonical Identity and Affiliation Closure

> 验收日期：2026-08-04

## 1. Executive Summary

本阶段已完成。正式 runtime 不再存在通用 `state.identity` / `IdentitySystem` 或 `lifePath.primaryIdentity`；门派与组织归属统一为 `player.affiliation`，称号仍是独立的 `player.title`。Snapshot 已切换到 `3.13.0`，Life Memory 已切换到 `3.0.0`，旧版本和旧字段拒绝。

本报告记录 TDD、正式事件门槛迁移、Contract、Local/API/Headless/Browser 展示和完整验证结果。没有命中阶段定义的结构性 blocker，完成后停止，不进入晚年行动、长期回响或其他候选阶段。

## 2. Scope and non-goals

### 已完成

- 删除通用 identity runtime 与 primary identity；
- 将 `player.sect` / `flags.current_sect` 切换为单一 `player.affiliation`；
- 新增闭集 Affiliation catalog 和 `affiliation_set` / `affiliation_clear` effects；
- 迁移正式事件中的 identity 门槛；
- 更新 Snapshot、Life Memory、Save/Load、Local/API/Headless/Browser 展示；
- 注册并运行 canonical closure suites。

### 明确未做

- Occupation、多身份、多组织并存、Affiliation history；
- 从 event ID、正文、Trace、persona、测试标签或 route flag 推导 Affiliation；
- 新增 title producer 或重写 EndingSystem；
- 修改 P8/P11、persona、oracle、晚年行动或长期回响内容。

## 3. Canonical semantic cutover

| 概念 | 当前 owner | 生命周期/持久化 | 玩家可见边界 |
| --- | --- | --- | --- |
| Affiliation | `player.affiliation: AffiliationId \| null` | 当前组织事实；进入 Snapshot | 所属、组织名称来自 catalog |
| Reputation title | `player.title: string \| null` | 明确事件授予后进入 Snapshot | 仅作为称号单独展示 |
| Occupation | 无通用 canonical state | 不持久化 | 由现有方向/经历叙述表达，不冒充身份 |
| Narrative route / direction | 现有 flags、stats、facts 的确定性摘要 | 不新增 identity 冗余 | 倾向/方向 |
| Life Memory | derived-only `3.0.0` | 从 canonical state 派生 | 经历/阶段摘要 |
| Ending classification | `state.ending` / EndingSystem | 终局持久化 | 结局名和结局解释 |

Affiliation catalog 当前包含：`shaolin`、`wudang`、`beggars`、`border`、`shadow_sect`。catalog 的组织分类不等于 route faction，也不自动同步 `sect_faction` 或 `lifePath.faction`。

## 4. TDD and test-gate evidence

先建立的回归保护：

- `tests/canonicalIdentityAffiliationClosure.test.ts`：canonical types/runtime、effect 幂等、正式事件门槛、Snapshot rejection、旧 source guard；
- `tests/playerRolePresentation.test.ts`：Local/API/Browser presentation 中 affiliation、title、experience、direction、ending 的分离；
- 两个 suite 均已注册到 `tests/runRealTestGate.ts`。

独立运行结果：

```text
canonicalIdentityAffiliationClosure.test.ts: exit 0
playerRolePresentation.test.ts: exit 0
quietFamilyLifeEndingExplanation.test.ts: exit 0
```

`npm test` 的真实日志包含：

```text
▶ Running canonicalIdentityAffiliationClosure (tests/canonicalIdentityAffiliationClosure.test.ts)
✔ canonicalIdentityAffiliationClosure passed
▶ Running playerRolePresentation (tests/playerRolePresentation.test.ts)
✔ playerRolePresentation passed
```

同时，既有 quiet-family suite 也被真实测试门执行并通过。整门退出码为 1，原因是既有 P8 `p8-scholar-su` opaque ratio `0.5`，触发 `p38FrustrationRemediationTests`、`p39ContentPoolConsistencyTests` 和 `p40ReplayPacingPolishTests`；本阶段专项断言全部通过，未修改该历史基线。

## 5. Formal event threshold migration

- 正式事件不再使用 identity runtime gate；
- 需要组织归属的事件使用 `player.affiliation` 条件；
- 归属变化使用 `affiliation_set` 或 `affiliation_clear`，不再写 `current_sect`；
- 需要 route、阵营或机械信号的事件继续显式写入已有 flags；
- 无正式 producer 的旧 identity 值按“永远不成立”迁移，不凭正文或事件文件名补造状态；
- deferred identity 文件继续 deferred，`identity` 作为文件名、分类或叙事文本时不等于 runtime identity。

## 6. Persistence and cross-surface boundary

Snapshot `3.13.0`：

- 要求 `player.affiliation`；
- 拒绝 `player.sect`；
- 拒绝顶层 `state.identity`；
- 拒绝 `lifePath.primaryIdentity`；
- 不迁移、不 fallback、不 silent cleanup。

Life Memory `3.0.0` 删除通用 identity projection。Save/Load 使用同一 canonical snapshot validator；API、Headless 和 Local 不另建身份投影或第二状态来源。

展示边界如下：

```text
所属     ← player.affiliation + affiliationCatalog
称号     ← player.title（仅非空）
经历     ← Life Memory
方向/倾向 ← 现有 facts、flags、stats 的确定性摘要
结局     ← state.ending
```

## 7. Browser acceptance

### 主界面真实页面

真实本地 Browser 新游戏页面已完成一次读屏与视觉核对：

- 人生摘要包含 `所属`；
- 空归属显示 `无固定所属`；
- `经历`、`风险`、`倾向` 与所属分开；
- 页面 console error/warn 为 0；
- 页面无本阶段相关布局异常。

### EndingScreen 真实证据

此前 Complete-Life Closure 的真实 Browser 记录覆盖 wealth 与 balanced 的 `quiet_family_life` EndingScreen：

| 断言 | wealth | balanced |
| --- | --- | --- |
| ending ID | `quiet_family_life` | `quiet_family_life` |
| 动态解释 | 生意和家业、经营能力、家庭锚点 | 练武、读书与营生、财富压力、家庭锚点 |
| 1500ms 不自动推进 | pass | pass |
| 点击继续只进入一次 EndingScreen | pass | pass |
| terminal 后无 GameScreen | pass | pass |
| 刷新/读档后解释保持 | pass | pass |
| Console 应用 error | 0 | 0 |
| 视口横向溢出 | 1280px/390px 均通过 | 390px 通过 |

`playerRolePresentation` 进一步验证 EndingScreen 不渲染“身份摘要”，不把 ending name 写成 title，且 affiliation/title 分别展示。当前 Browser 主界面的真实 evidence 与 EndingScreen 记录共同覆盖本阶段跨端展示边界。

## 8. Full verification matrix

| 命令 | 结果 | 备注 |
| --- | --- | --- |
| `npm exec -- tsx tests/canonicalIdentityAffiliationClosure.test.ts` | exit 0 | canonical closure |
| `npm exec -- tsx tests/playerRolePresentation.test.ts` | exit 0 | presentation |
| `npm exec -- tsx tests/quietFamilyLifeEndingExplanation.test.ts` | exit 0 | existing ending regression |
| `npm test` | exit 1 | new suites pass；P8 historical baseline fails |
| `npm run typecheck` | exit 0 | — |
| `npm run typecheck:p6b` | exit 0 | — |
| `npm run build` | exit 0 | — |
| `npm run test:contracts` | exit 0 | Snapshot 3.13.0 |
| `npm run test:headless` | exit 0 | — |
| `npm run test:headless:parity` | exit 0 | — |
| `npm run test:sample-lines-routes` | exit 0 | 15/15 |
| `npm run gate:p11-scheduling` | exit 0 | P11 pass |
| `npm run gate:playability` | exit 1 | same P8 baseline |
| `npm run validate:event-quality` | exit 1 | 425 events；blocker 9 / major 147 / minor 36 |
| `git diff --check` | exit 0 | — |

## 9. Known non-blockers and final decision

P8 与 event-quality 的历史基线失败不涉及本阶段 canonical owner、Contract、正式事件门槛或跨端展示；本阶段不修改它们。Browser 试玩中已知的 `family_reunion` 内容循环同样不属于身份/归属或 EndingScreen 边界，不在本次 closure 修复。

本阶段未命中结构性 blocker，canonical identity/affiliation closure 已完成。治理状态已更新；到此停止，不进入晚年行动、长期回响或其他候选阶段。
