# 0～2 岁出身被动链对接说明（Integration）

**状态：** 设计对接文档（用于实施协同）  
**目标：** 将四份 quest-spec 与现有 runtime/测试流程对齐，形成稳定的“内容 -> 实现 -> 验收”闭环。  
**范围：** 仅覆盖 0～2 岁出身被动链；不含 8 岁以上玩法与全生命周期重构。

---

## 1. 文档分层与职责

当前幼年体验治理建议按以下分层协作：

| 分层 | 文档 | 作用 |
| --- | --- | --- |
| 治理层 | `docs/designs/early-childhood-agency-and-opening-experience-optimization.md` | 定义问题、目标态、P0/P1/P2 优先级 |
| 实施层 | `docs/designs/early-childhood-agency-implementation-pack.md` | 定义 Story、代码触点、验收与回滚 |
| 内容层 | `docs/designs/childhood-*-origin-0-2-quest-spec.md` | 给出每个出身的节点叙事、flag、数值预算 |
| 索引层 | `docs/designs/childhood-origin-infant-passive-index.md` | 统一四链约束、横切 AC、实施顺序 |

本文件用于把上述分层连接成一套可执行流程，避免“只写了策划稿但实现没有统一入口”。

---

## 2. 真源与冻结决策

以下决策在本阶段视为冻结，不在实施会话中重议：

1. **0～2 岁仅被动推进**：不出现日常主动规划三选一。
2. **四出身链互斥**：每局只进入一种 `origin_*` 对应被动链。
3. **每链 5 节点有序触发**：N1/N2 @0 岁，N3/N4 @1 岁，N5 @2 岁收官。
4. **数值常识约束**：单节点仅允许微弱变化（Δ<=1），禁止侠义/内功/功力/银两突变。
5. **先修循环再扩内容**：先保证 `passive_progression` 与反馈可见，再扩写更多文本。

---

## 3. 代码落点映射（建议）

### 3.1 内容配置入口

建议将四链 quest-spec 收敛为统一配置源：

- `src/data/lines/origin-infant-passives.json`（建议新增）

建议字段（最小可用）：

| 字段 | 说明 |
| --- | --- |
| `questId` | 如 `quest_martial_infant_passive_0_2` |
| `originFlag` | 如 `origin_wuxia_family` |
| `completeFlag` | 如 `martial_infant_chain_complete` |
| `nodes[]` | 有序节点数组（id、ageMin/ageMax、title、text、flags、statDeltas） |
| `sharedFillers[]` | 链外公共被动叙事（如 `infant_crawl_home`） |

### 3.2 运行时选择器

建议在被动叙事选择逻辑中引入“有序 dequeue”而非纯随机：

1. 根据 `origin_*` 定位链。
2. 读取已完成节点 flags，得到“下一节点”。
3. 若链未完成且年龄匹配，优先返回下一节点。
4. 链完成后再回落到 `sharedFillers`。

### 3.3 与现有实现的关系

- `src/data/infantPassiveNarratives.ts` 可保留为过渡层。
- 现有 `infant_swaddle_*` 建议并入四链 N2 节点，避免重复触发与双结算。
- `HeadlessEngineSessionImpl` 的 `passive_progression` 路径应作为权威推进入口。

---

## 4. 与 spine 事件的调度优先级

为避免同年龄段重复叙事或双结算，建议采用以下优先级：

1. 年龄锚点主线事件（birth/origin/toddler 等）
2. 出身被动链下一节点（N1..N5）
3. 公共 filler（中立叙事）
4. 占位文案（0～2 岁应为 0 次）

实现要求：

- 同一推进窗口只消费一个主叙事源。
- 若同年龄有 spine 与链节点冲突，优先主线，链节点顺延到下一可用窗口。

---

## 5. 验收对接（以索引 AC 为准）

以 `childhood-origin-infant-passive-index.md` 的横切验收为主：

| 验收 | 对接目标 |
| --- | --- |
| AC-X-1 互斥 | 仅触发当前出身链 ID 前缀 |
| AC-X-2 Agency | 0～2 岁无三选一规划、无占位句 |
| AC-X-3 差异化 | 任意两出身叙事 ID 重合度 <50% |
| AC-X-4 实机回归 | 无首回合荒谬跳变；继续前叙事非空 |

建议同步保留以下工程门禁：

- `gate:p16`
- `gate:playability`（需确认 0～2 岁期望行为已更新）
- API 浏览器复验（按现有 test-report 流程）

---

## 6. 推荐派工方式（多会话）

### Session A：内容配置化

- 输入：四份 quest-spec + 索引文档  
- 输出：`origin-infant-passives.json` 首版（含四链与 filler）

### Session B：运行时接入

- 输入：Session A 配置 + implementation-pack Story-1/5  
- 输出：选择器升级为有序链触发，完善链完成门控

### Session C：测试与回归

- 输入：A/B 分支结果  
- 输出：AC-X 对照报告 + API 实机复验记录

---

## 7. 常见偏差与纠偏

| 偏差 | 风险 | 纠偏 |
| --- | --- | --- |
| 只改文案不改调度 | 看起来有新内容，实际仍随机乱序 | 必须接入有序节点选择 |
| 只改 UI 隐藏规划 | 服务端仍处于主动规划相位 | 以 session phase 为真源，不做“假隐藏” |
| 四链节点无完成标记 | 重复刷同一节点 | 强制 `*_chain_complete` 与节点 flag 门控 |
| 为了“好玩”放开幼年大数值 | 常识崩坏，重复历史问题 | 严守幼年数值上限与禁改字段 |

---

## 8. 本文档的使用方式

1. 新会话开始时先读本文件 + `implementation-pack` + 对应 quest-spec。  
2. 先确认本轮是“内容配置化”还是“runtime 接入”还是“验收回归”。  
3. 每次只推进一个 Story 批次，避免跨层并行导致冲突。  
4. 交付时必须附 AC 对照结果，不仅给“已完成”结论。

---

## 9. 结论

四份 0～2 岁出身 quest-spec 已具备高质量内容基础。当前关键不是继续扩写，而是把它们稳定接入到统一配置与有序调度路径中，并以 AC-X 做闭环验收。  
只要坚持“冻结决策 + 单入口调度 + 横切验收”，这批文档可以直接转化为可持续迭代的幼年体验生产线。

