# Product Experience Governance Dispatch Index

本索引用于分发 `product-experience-governance` PRD。它替代本次 PRD 范围内的临时口头拆分，但不自动废弃历史体验治理文档；旧文档只可作为背景参考，执行范围以本索引和对应 execution pack 为准。

## Required Reading

每个新会话先读取：

1. `AGENTS.md`
2. `docs/PRD/product-experience-governance.md`
3. `docs/PRD/product-experience-governance.prd.json`
4. `agent_docs/product-experience-governance-execution-pack.md`
5. 本索引
6. 对应包的 session prompt

## Recommended Order

1. PXG0: Scope Freeze and Architecture Guardrails
2. PXG1: Event Asset and State Field Audit
3. PXG2: Golden Line Spine, Feedback, and Payoff
4. PXG3: Priority Route Lifecycle
5. PXG4: Simulation and Experience Gates
6. PXG5: Minimum Playable UI and Closure

PXG2 与 PXG3 可在 PXG1 完成后并行，但必须共享 active event classification、route-like field audit 和 key choice 口径。

## Dispatch Matrix

| Pack | Stories | Primary Deliverables | Verification | Status |
|---|---|---|---|---|
| PXG0 | US-001, US-022 | [`product-experience-governance-scope-and-guardrails.md`](../docs/PRD/product-experience-governance-scope-and-guardrails.md) | `npm run typecheck` | **complete** |
| PXG1 | US-002, US-003, US-004, US-014 | event inventory、asset classification、admission rules、state field audit | `npm run report:event-asset-inventory` | **complete** |
| PXG2 | US-005, US-006, US-007, US-008 | golden timeline、feedback standard、feedback cleanup、payoff map | `npm run typecheck`，`npm run report:golden-line-feedback` | **complete** |
| PXG3 | US-009, US-010, US-011, US-012, US-013 | route lifecycle、three route specs、conflict table | `npm run typecheck`，route verification | **complete** |
| PXG4 | US-015, US-016, US-017, US-018, US-019 | deterministic simulation、continuity/feedback/route gates、active issue reclassification | `npm run gate:golden-line`, `npm run gate:experience` | **complete** |
| PXG5 | US-020, US-021, US-023, US-024 | minimum playable layout、debug intrusion cleanup、doc updates、closure report | browser verification 和 closure report | **complete** |

## Parallelism

- PXG0 不并行，先冻结范围。
- PXG1 内部 inventory、classification、field audit 可以分子任务并行，但最终需要一个统一报告。
- PXG2 的 feedback standard 与 payoff map 可先文档化，再进入事件内容修正。
- PXG3 的三条路线可拆分并行，但 conflict table 必须统一收口。
- PXG4 的 gate 实现应串行推进，避免多个会话同时改同一门禁脚本。
- PXG5 的 UI 与文档可并行，但 closure report 必须最后生成。

## Blocker Rules

遇到以下情况必须停止并交接，不得顺手扩大范围：

- 需要引入数据库、后端 API、账号系统、云同步或小程序 runtime。
- 需要把 full 0-80 完整体验纳入本阶段。
- 需要把 deferred event 批量迁入 active。
- 需要重构全局事件引擎或身份系统。
- 发现 PRD 与 runtime 事实冲突，且无法通过只读报告说明。

## Common Verification Commands

按包选择，不要求每个包都全部运行：

```bash
npm run typecheck
npm run build
npm test
npm run validate:event-quality
npm run simulate:gameplay
npm run simulate:gameplay:samples -- --diagnostics
npm run gate:experience
npm run report:experience-governance-closure
```

UI 相关包还需要浏览器验证 desktop 和 mobile。若浏览器验证不可用，最终交付必须说明原因和残余风险。

## Handoff Requirements

每个包完成后必须交付：

- story 覆盖范围
- 修改文件
- 验证命令与结果
- 可复核证据
- before/after 指标，若适用
- 残余风险
- 对后续包的影响

## Story Coverage Check

- PXG0 covers US-001, US-022.
- PXG1 covers US-002, US-003, US-004, US-014.
- PXG2 covers US-005, US-006, US-007, US-008.
- PXG3 covers US-009, US-010, US-011, US-012, US-013.
- PXG4 covers US-015, US-016, US-017, US-018, US-019.
- PXG5 covers US-020, US-021, US-023, US-024.
