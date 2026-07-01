# P53 Sample Lines 40+ Payoff — Gap Audit

> **Date:** 2026-06-26  
> **Stage:** P53 bounded 40+ payoff expansion  
> **Baseline:** P52 closure (`docs/test-reports/p52-baseline-hardening-closure-report.md`, branch `codex/p52-wuxia-sample-lines-baseline-hardening-and-cross-tester-validation`)

## 1. Purpose

盘点三线 benchmark seed（301/303/804）在 age-40 identity 收束之后的现有内容与缺失 payoff 节点，避免 P53 发明与 spine 无关的新主线。

## 2. P52 baseline（0–40）— 不在 P53 重开

| Layer | 状态 | 证据 |
| --- | --- | --- |
| Age-40 identity spine | **Closed** | `sample-lines-spine.json` `*_age40_identity_summary` + `*_age40_identity_done` |
| Age-25 goal guards G-04/05/02 | **Closed** | `p50SampleLineSpineTests` |
| Cross-line cost distinct G-07 | **Closed** | `p50SampleLineExpressionTests` |
| Replay determinism G-08 | **Closed** | `p49SampleLineReplayTests` |
| Cheap guard runner | **Closed** | `npm run guard:sample-lines-baseline` |

P52 guard contract §5 明确 **40+ content expansion** 为 out-of-scope — P53 在此之上增量延伸。

## 3. Post-age-40 inventory by line

### 3.1 Orthodox (seed 301)

| Surface | Age 40 之后现状 | Gap |
| --- | --- | --- |
| Sample spine | 止于 `orthodox_age40_identity_summary`（age 38–42） | **缺** 40+ 专用 payoff 节点与 flag |
| Player expression | `orthodoxCurrentGoal` 在 `orthodox_age40_identity_done` 后固定为「回望正道身份…」 | **缺** 45+ 阶段目标刷新 |
| Event pool | `sect-wudang.json` 有 `sect_midlife_ledger`（age 45–50）等，但依赖 `route_orthodox` + 长链 midlife flag，**非** sample-line spine 绑定 | 需 spine 桥接节点，保证 benchmark seed 可触发 |
| Replay / guard | `P49_CHECKPOINT_AGES` 止于 40；无 G-40+ 断言 | **缺** 45/50 checkpoint 与 guard |

### 3.2 Demonic (seed 303)

| Surface | Age 40 之后现状 | Gap |
| --- | --- | --- |
| Sample spine | 止于 `demonic_age40_identity_summary` | **缺** 40+ payoff 节点 |
| Player expression | age40 后固定「邪路身份已定…」 | **缺** 45+ 地盘巩固/反噬延续表达 |
| Event pool | `identity-demon.json` 有 `demonic_midlife_consequence`（age 45–50），需 `demonic_midlife_fork_done` 长链 | 需 spine 续链 `demonic_age40_identity_done` → 45 payoff |
| Replay / guard | 同 orthodox | **缺** |

### 3.3 Merchant (seed 804)

| Surface | Age 40 之后现状 | Gap |
| --- | --- | --- |
| Sample spine | 止于 `merchant_age40_identity_summary`；`merchant_midlife_debt_milestone` 在 age 32–38 | **缺** 40+ 扩张/债分岔 payoff |
| Player expression | age40 后固定「财富带来选择，也带来债」 | **缺** 45+ 经营延续钩子 |
| Event pool | `identity-merchant.json` `merchant_mentor`（age 45+）需 identity 系统，非 benchmark spine 保证 | 需 spine 桥接 |
| Replay / guard | 同 orthodox | **缺** |

## 4. P52 monitor-only residuals（P53 不升级为 blocking）

| ID | 描述 | P53 处理 |
| --- | --- | --- |
| M-orthodox-gray | Seed 301 gray mission 分支未稳定触发 | **Out of scope** — 不在 P53 强制 gray 链；40+ payoff 走 stewardship/legacy 主题 |
| M-merchant-debt | Seed 804 midlife 债务/人情信号偏轻 | **Optional polish** — merchant 45 payoff 可加强 debt/loyalty 文案，不升级为 blocking |

## 5. Gap summary

| 类别 | 条目 | P53 目标 |
| --- | --- | --- |
| **Spine** | 三线无 age-40 后续 bounded payoff | 每线 1 节点（age 44–48），续链 `*_age40_identity_done` |
| **Expression** | currentGoal 在 age40 后停滞 | 45+ checkpoint 可读阶段目标 |
| **Replay** | checkpoint 止于 40 | 延伸至 45/50 |
| **Guard** | 无 G-40+ | 每线至少 1 窄断言 |
| **Out of scope** | 第四条线、full lifetime sim、大 UI、gate:playability 替代 | 不变 |

## 6. Verdict

P52 0–40 baseline **完整且 guarded**。P53 真实缺口为：**sample-line spine 40+ payoff 节点、表达刷新、replay/guard 延伸** — 非重开 P46–P52 blocker。
