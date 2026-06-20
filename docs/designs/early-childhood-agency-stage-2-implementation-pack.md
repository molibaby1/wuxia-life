# 幼年开局体验优化 — Stage-2 实施拆解稿

**状态：** 待审批（体验治理用）  
**前置：** Stage-1 已完成（`early-childhood-agency-implementation-pack.md` v0.2）  
**真源：** `docs/designs/early-childhood-agency-and-opening-experience-optimization.md`  
**范围：** 0～7 岁开场收口；不含少年/成年/结局线  
**本阶段目标：** 门禁回归收口 → 3～4 岁 agency 实机验收 → 四出身 0～7 岁差异化实机验收

---

## 0. Stage-1 结论（审查摘要）

| 维度 | 判定 | 说明 |
| --- | --- | --- |
| 婴儿期被动化 | ✅ 机制已落地 | `DAILY_PLANNING_MIN_AGE=5`；0～4 岁 `resolveChildhoodActionPalette` 返回 `[]` |
| API phase | ✅ | `passive_progression` / `period_summary` / `passive_continue` |
| 数值 clamp | ✅ | `ageActionStatCaps.ts` + `ActionResultResolver` |
| 小结可见 | ✅ | `periodSummaryBuilder` + `GameScreen` 卡片 |
| 被动内容 | ⚠️ 初版 | `infantPassiveNarratives.ts` 有出身加权，但四链 quest spec 仍为策划稿 |
| 自动化门禁 | ⚠️ 待收口 | `gate:p16` pass；`p72SessionPhase` pass；全量 `npm run test -- p16OriginDestiny` 可能被 P9 near-duplicate baseline 卡住 |
| 浏览器实机 | ☐ 未更新 | implementation pack §6.2 复验表仍为「待测」 |

**Stage-2 原则：** 先让门禁与实机证据闭环，再扩写四出身 0～2 岁 quest 链内容。

---

## 1. Stage-2 Story 切片

### 依赖关系

```mermaid
flowchart LR
  S2A[S2-1 门禁收口] --> S2B[S2-2 3～4岁实机]
  S2A --> S2C[S2-3 四出身差异化]
  S2B --> S2C
```

| Story | 优先级 | 可与…并行 | 阻塞 |
| --- | --- | --- | --- |
| **S2-1** | P0 | — | S2-2、S2-3 的「可发布」判定 |
| **S2-2** | P1 | S2-1 后期 | S2-3 的 agency 结论 |
| **S2-3** | P1 | S2-2 | 四出身内容扩写决策 |

**建议顺序：** S2-1 → S2-2 → S2-3

---

## 2. Story 详情

### S2-1：回归门禁收口（P0）

**目标：** Stage-1 改动合入后，相关自动化链全绿，且 P9 警告不劣化。

#### 已知问题

- `npm run test -- p16OriginDestiny` 在链路末尾执行 `p9PlayabilityTests` 时可能失败：
  - `near-duplicate warnings should maintain or improve: 4 vs baseline 2`
- 根因待实施方确认：被动期增多是否导致早期叙事模板重复，或 baseline JSON 需按新节奏重标定。

#### 改动触点（候选）

| 层 | 路径 | 要点 |
| --- | --- | --- |
| 测试基线 | `docs/test-reports/p9-warning-triage-baseline.json` 或 P9 内嵌 baseline | 仅在确认「新行为合理」后更新；禁止为过关而盲目抬 baseline |
| 被动去重 | `src/data/infantPassiveNarratives.ts` | 检查 0～7 岁重复 title/text；增加 `eventHistory` 去重权重 |
| Playability runner | `src/headless/playability/headlessPersonaRunner.ts` | 确认 0～4 岁走 passive ack，非强行选行动 |
| 报告 | `docs/test-reports/p8-playability-gate-latest.md` | Early 叙事应体现 0～4 岁 passive，而非 0 岁三行动 |

#### 验收标准

| ID | Given | When | Then |
| --- | --- | --- | --- |
| S2-1-AC-1 | Stage-1 代码在工作区 | `npm run gate:p16` | decision = pass |
| S2-1-AC-2 | 同上 | `npm exec tsx tests/headless/p72SessionPhase.test.ts` | ok |
| S2-1-AC-3 | 同上 | `npm run test -- p16OriginDestiny` | 全链通过（含 p9） |
| S2-1-AC-4 | 同上 | `npm run gate:playability` | 0 blockers；near-duplicate ≤ baseline 或已文档化合理上调 |

#### 命令

```bash
npm run gate:p16
npm exec tsx tests/headless/p72SessionPhase.test.ts
npm run test -- p16OriginDestiny
npm run gate:playability
```

---

### S2-2：3～4 岁「被动为主 + 稀抉择」实机验收（P1）

**目标：** 验证 Stage-1 的 `DAILY_PLANNING_MIN_AGE=5` 与方案 §3 表一致——3～4 岁无日常规划，但 **4 岁「童年偏好」** 仍是第一个正式剧情抉择。

#### 检查清单（浏览器/API）

| # | 检查项 | 预期 |
| --- | --- | --- |
| R2-1 | 3 岁连续 5 期 | 0 次规划三选一；有被动叙事或 spine（如伶牙俐齿） |
| R2-2 | 4 岁 | 出现「童年偏好」类 **story_event 抉择**（2～3 选项） |
| R2-3 | 4 岁前 | 从未出现「安排日常行动」+ 三行动 UI |
| R2-4 | 每次点「继续」前 | `periodSummary` 或 `story_event.text` 非空 |
| R2-5 | 占位文案 | 3～4 岁不出现「本期暂无强求的江湖变故…」 |

#### 环境

```bash
npm run p6b:serve   # 终端 A
npm run dev         # 终端 B → http://localhost:5200
```

流程见 `docs/test-reports/api-browser-playtest-experience-2026-06-17.md` §9；出身建议：**书香门第**（与首测一致）。

#### 交付物

- 更新 `docs/test-reports/api-browser-playtest-experience-2026-06-17.md` 或新增 `api-browser-playtest-stage2-2026-06-18.md`
- 填写 implementation pack 复验表（见 §5）

#### 验收标准

| ID | Given | When | Then |
| --- | --- | --- | --- |
| S2-2-AC-1 | API 模式，书香门第 | 推进至 4 岁并完成偏好抉择 | 3～4 岁 `planningOptions.length===0`；4 岁至少 1 次正式抉择 |
| S2-2-AC-2 | 同上 | 35 步内统计 | 「暂无江湖变故」≤3 次；继续前空白 ≤1 次 |

---

### S2-3：四出身 0～7 岁差异化实机验收（P1）

**目标：** 验证 P2-2：换出身开局，前 7 年叙事 ID 重合度 <50%；并为是否实施四链 quest spec 提供数据。

#### 内容真源（策划稿，待接线）

| 文档 | 说明 |
| --- | --- |
| `docs/designs/childhood-origin-infant-passive-index.md` | 四链索引与横切 AC |
| `docs/designs/childhood-scholar-origin-0-2-quest-spec.md` | 书香 5 节点 |
| `docs/designs/childhood-martial-origin-0-2-quest-spec.md` | 武林 5 节点 |
| `docs/designs/childhood-merchant-origin-0-2-quest-spec.md` | 商贾 5 节点 |
| `docs/designs/childhood-frontier-origin-0-2-quest-spec.md` | 边疆 5 节点 |

当前 runtime 使用 `infantPassiveNarratives.ts` 加权随机，**尚未**按 quest 链顺序 dequeue。

#### 实机矩阵

| 出身 | 推进目标 | 记录字段 |
| --- | --- | --- |
| 书香门第 | 0→7 岁 | `eventHistory` / 被动 narrative id 列表 |
| 武林世家 | 0→7 岁 | 同上 |
| 商贾之家 | 0→7 岁 | 同上 |
| 边疆异族 | 0→7 岁 | 同上 |

两两对比 6 组（C(4,2)），叙事 ID 重合度均 <50%。

#### 可选自动化（实施方二选一）

1. **Headless 脚本**：四出身各跑至 age 7，导出 `eventId` 列表 diff  
2. **手工浏览器**：四局各 35 步，抄录被动标题/事件名

#### 验收标准

| ID | Given | When | Then |
| --- | --- | --- | --- |
| S2-3-AC-1 | 四出身各一局至 7 岁 | 两两对比叙事 ID | 6 组重合度均 <50% |
| S2-3-AC-2 | 四出身各 0～2 岁 10 期 | 检查 | 0 次规划三选一；侠义/内功无荒谬跳变 |
| S2-3-AC-3 | 若重合度 ≥50% | 决策 | 触发 Stage-3「四链 quest 接线」；本 Story 只出报告不硬改内容 |

#### 交付物

- `docs/test-reports/early-childhood-origin-divergence-stage2.md`（建议路径）

---

## 3. Stage-3 预告（本阶段不实施）

当 S2-3 显示重合度过高或实机仍单调时，进入 Stage-3：

| 项 | 内容 |
| --- | --- |
| **S3-1** | 四出身 0～2 岁 quest 链接线（顺序 dequeue + `*_chain_complete` flag） |
| **S3-2** | 5～7 岁「轻量 2 选」UI（非三行动规划） |
| **S3-3** | spine 密度：0～7 岁 story-gap 优先 passive/spine，非 filler 规划 |

---

## 4. 风险与回滚

| 风险 | 缓解 |
| --- | --- |
| 为过关盲目抬 P9 baseline | S2-1 须附「警告增减原因」一段文字 |
| 实机与 headless 结论不一致 | 以 API 浏览器为准写体验报告；headless 仅作回归 |
| 四链 quest 未接线却要求 <50% 重合 | S2-3 未达标则转 Stage-3，不在 S2 硬扩写 |

---

## 5. 复验记录表

| 日期 | Story | 执行人 | 结果 |
| --- | --- | --- | --- |
| — | S2-1 | — | ☐ gate:p16 ☐ p72 ☐ p16OriginDestiny ☐ gate:playability |
| — | S2-2 | — | ☐ R2-1～R2-5 |
| — | S2-3 | — | ☐ 四出身矩阵 ☐ 重合度 <50% |

---

## 6. 变更日志

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| 0.1 | 2026-06-18 | Stage-2 初稿：S2-1～S2-3 + Stage-3 预告 |
