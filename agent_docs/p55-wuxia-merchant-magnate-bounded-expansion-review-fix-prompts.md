# P55 Merchant Magnate Bounded Expansion — Review Fix Prompts

## FIX-001 [required] — 全量实现 P55 所有 10 个 stories

必读 `docs/PRD/p55-wuxia-merchant-magnate-bounded-expansion.md` 全文，按 prd.json 的 priority 顺序（P55-001 → P55-010）逐个实现。

**前置条件：**
1. 从 `codex/p54-wuxia-sample-lines-residual-polish`（或最新 main）创建分支 `codex/p55-wuxia-merchant-magnate-bounded-expansion`
2. 将 `docs/PRD/p55-wuxia-merchant-magnate-bounded-expansion.md` 和 `.prd.json` 加入仓库

**Story 实现清单：**

**P55-001（Read-only）:** 汇总 merchant_magnate 当前证据链。读取 P25 mixed identity slice（`src/p25/mixedIdentitySlice.ts`、`mixedSimulationBaselines.ts`、`achievementTraceability.ts`）、merchant route 相关配置（`src/data/lines/merchant.json`）、P54 carry-forward（`docs/test-reports/p54-sample-lines-residual-polish-closure-report.md`）。输出 `docs/test-reports/p55-merchant-magnate-gap-audit.md`，区分已证明层与缺失的 runtime/content/verification 层。不改运行行为。

**P55-002（Read-only）:** 锁定 scope contract。输出 `docs/test-reports/p55-merchant-magnate-scope-contract.md`，明确允许层（剧情配置、轻量展示、验证脚本）和禁止项（Wave 4、全量经济系统、sample-line 重开、平台化）。

**P55-003（Design）:** 定义 on-ramp contract。在 gap audit 附录或 PRD 中记录：至少 2 个前置条件组（如 merchant route + wealth capital / caravan / favor pressure），1 个 on-ramp milestone，1 个 midlife pressure milestone。不破坏现有 merchant-first / debt / expansion 语义。

**P55-004（Design）:** 定义 payoff contract。在 gap audit 附录或 PRD 中记录：1 个 magnate payoff 节点或 terminal summary，体现"财富规模 + 人情/风险/经营负担"，与 `merchant_martial_patron` 和 sample-line merchant 45 payoff 明确区分。

**P55-005（Config）:** 通过现有配置载体（`src/data/lines/merchant.json`、`sample-lines-spine.json` 等）实现 on-ramp / pressure / payoff 最小链。不引入新配置系统。路径在 benchmark / targeted sim 中可触发。

**P55-006（Expression）:** 在 `src/p50/sampleLineExpression.ts` 和/或 `src/core/deriveLifeMemorySummary.ts` 补至少 2 个 magnate-specific 可读信号。区分 magnate 与 sample-line merchant 的 midlife debt / 45 payoff 文案。不新增 UI 组件。

**P55-007（Sim）:** 新增 1 条 targeted sim / lifetime slice，断言 merchant_magnate terminal outcome 或等价证明成立。记录关键 age / flag / event evidence。

**P55-008（Test）:** 为 on-ramp / payoff / expression 各补至少 1 条窄断言测试。复用既有 test harness，不引入新框架。

**P55-009（Doc）:** 输出 1 份 magnate-specific replay / audit / trace artifact，可读展示关键 checkpoint、flags、recent events 或 terminal summary。与 P25 static slice、P39 bounded audit 证据可交叉引用。

**P55-010（Doc）:** 输出 `docs/test-reports/p55-merchant-magnate-closure-report.md`，汇总配置、表达、仿真、测试、文档证据，明确边界，列出 defer 项。

**验收标准：**
- 所有 10 个 story 的交付物均存在且符合 PRD acceptance criteria
- `npm run guard:sample-lines-baseline` 通过
- `npm run typecheck` 通过
- 与本阶段相关的 unit test 通过
- 既有 sample-line / P25 / P39 证据不退化

**不要动什么：**
- 不重开 sample-line 主线
- 不做 Wave 4 ordinary growth
- 不引入新的配置系统或运行时框架
- 不做 runtime 平台化或事件池批量激活
- 不改 gate:playability 或 guard:sample-lines-baseline 的已有逻辑

## FIX-002 [required] — 修正 prd.json 的 passes 状态

将 `docs/PRD/p55-wuxia-merchant-magnate-bounded-expansion.prd.json` 中所有 story 的 `passes` 重置为 `false`，待逐个 story 实现并通过验收后再改为 `true`。
