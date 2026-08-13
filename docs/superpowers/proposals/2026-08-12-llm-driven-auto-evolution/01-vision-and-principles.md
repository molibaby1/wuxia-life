# 01. 愿景与原则：LLM 驱动的受约束自我进化

> 状态：v2 候选方案。用于固定方法论与能力边界，不自动授权实现。

## 1. 核心愿景

Wuxia-Life 的长期目标仍然是做好游戏。

自动进化系统的目标是利用 LLM 对文本叙事的感性分析能力，让系统能够：

```text
观察大量模拟人生
→ 发现体验问题
→ 引用证据
→ 形成可检验的问题描述
→ 提出受控配置干预
→ 运行隔离实验
→ 独立验证
→ 在多样本上判断现象是否稳定改变
→ 接受、拒绝、停止或进入下一轮
```

长期理想状态可以接近自驱动飞轮，但早期目标不是“自治程度”，而是逐阶段证明每个判断环节值得信任。

如果未来这套方法被证明稳定、可复用，它可以从 Wuxia-Life 抽离为独立工具、Skill、方法论或产品。当前不为这个未来目标提前通用化。

## 2. 为什么 Wuxia-Life 特别适合 LLM 评审

Wuxia-Life 的核心产物高度文本化：事件、选择、反馈、阶段变化和最终人生故事都可以被记录。

因此 LLM 特别适合分析：

- 事实和叙事前后是否矛盾；
- 人生是否存在明显不合常理的跳跃；
- 某类事件是否机械重复；
- 节奏是否长期停滞或异常拥挤；
- 玩家选择是否产生可见后果；
- 转折是否有铺垫、反馈与 acknowledgement；
- 不同人生是否高度同质；
- 某种配置是否制造低信息噪音；
- 已知 taxonomy 之外是否存在新的体验问题。

传统程序很难完整提前定义这些判断，而 LLM 可以从文本证据中形成开放式语义判断。

## 3. 关键限制：日志不是天然等于玩家体验

只有**玩家实际能够观察到的信息**才能被用于评价“玩家感知到的因果、反馈和人生体验”。

因此必须区分：

### Player-observable evidence

可以用于体验 Reviewer：

- 当时玩家看到的事件文本；
- 可见选项；
- 玩家实际选择；
- 选择后的可见结果反馈；
- 对玩家公开的数值变化；
- 可见 milestone / 阶段总结 / acknowledgement；
- 已经对玩家揭示的历史事实。

### Hidden / oracle evidence

不能直接提供给 Experience Reviewer：

- hidden effects；
- 未揭示状态；
- engine internals；
- RNG 细节；
- candidate identity；
- Planner rationale；
- 只有测试 oracle 才知道的最优选择信息。

Hidden evidence 可以供 deterministic auditor 或专门的工程诊断使用，但不能混入“玩家是否感受到”的体验判断。

## 4. Headless policy 不是玩家本身

自动 simulation 必须有 persona / policy 才能做选择，但需要明确：

> 一个使用 hidden state 或 oracle 选择策略的 Headless agent，不能被当作真实玩家体验的直接代理。

因此每个实验必须记录：

- persona version；
- policy version；
- policy 可见信息边界；
- policy 是否使用任何玩家不可见信息。

如果一个问题依赖“真人是否理解规则、是否犹豫、是否注意到 UI 信息”，纯 Headless 日志不能证明该体验结论，应输出 `evidence_limit` 或转交 Browser / 真人验证。

## 5. Reviewer 是传感器，不是裁判

Experience Reviewer 的职责是：

> **发现问题、引用证据、描述为什么值得关注。**

Reviewer 不应该：

- 给整个游戏一个最终好玩分；
- 自己提出配置修改方案；
- 读取 Planner 方案后证明方案正确；
- 把置信度当作客观概率；
- 在证据不足时强行下结论。

Reviewer 必须允许：

```text
no_material_finding
insufficient_evidence
out_of_scope
requires_player_study
```

“没有结论”是合法输出。

## 6. 自动进化的基本单位是 evidence-grounded finding

Reviewer 的最小结构化 finding 应接近：

```json
{
  "findingId": "...",
  "dimension": "coherence | pacing | repetition | causality | progression | diversity | feedback | plausibility | other",
  "severity": "low | medium | high | critical",
  "confidence": 0.0,
  "summary": "...",
  "evidence": [
    {
      "transcriptRef": "...",
      "location": "...",
      "observation": "..."
    }
  ],
  "whyItMatters": "...",
  "evidenceLimit": "none | partial | requires_player_study"
}
```

**不包含 `changeHypothesis`。**

修改假设属于 Planner。这样可以避免 Reviewer 在观察阶段就被自己的解决方案锚定。

为了减少结构化 schema 对“感性判断”的压缩，建议同时保存：

1. 原始自然语言 review artifact；
2. 由同一次调用生成的最小结构化 finding；
3. model / prompt / context-builder / input artifact hash。

下游 Agent 默认消费结构化 finding；必要时可以通过 `evidenceRef` 回到原始评审与原始 transcript。

## 7. Reviewer 本身必须先经过校准

不能因为模型“看起来聪明”就把 Reviewer 设为事实裁决者。

Reviewer calibration corpus 应包含：

- 历史真实缺陷；
- 人工注入、但自然可读的 known-bad；
- healthy hard negatives；
- 合理存在争议的 ambiguous cases；
- instruction-like event text / prompt-injection fixtures；
- 不同长度、不同人生阶段和不同 persona 的样本。

校准按问题类别分别测量：

- evidence citation correctness；
- precision；
- recall；
- healthy control false-positive rate；
- repeated-call consistency；
- abstain / insufficient_evidence 是否合理；
- 与冻结人工 gold labels 的一致性；
- 模型、prompt、context builder 变更后的 drift。

人工标注只用于建立和维护**小规模 calibration corpus**，不是每轮进化的持续人工成本。

### 7.1 Calibration development 与 sealed qualification 必须分离

同一批题目不能既用于调 Reviewer，又用于证明 Reviewer 已经合格。校准数据至少分为两层：

#### `calibration-development`

- 对 Reviewer 开发者可见；
- 可以用于调整 prompt、context builder、schema presentation 和调用参数；
- 可以反复运行；
- 其结果只用于开发诊断，不能单独作为 Phase 1 资格通过证据。

#### `sealed-qualification`

- 在 qualification run 前保持封存；
- 不用于 prompt/context 调优；
- 只用于判断某个冻结的 `model + prompt + context builder + schema + sampling policy` 组合是否获得 Reviewer 资格；
- qualification 结果一旦被反馈给开发流程并用于后续调优，该集合立即退休，或明确降级为 `calibration-development`，不得继续冒充未见 qualification。

如果某一问题类别的 sealed 样本量太小，系统必须报告该类别的证据不足或高不确定性，而不是为了获得 `accepted` 强行给出稳定性结论。

### 7.2 Reviewer 资格绑定具体调用配置

Reviewer qualification 不是对“某个模型品牌”的永久认证，而是绑定一个可追溯组合：

```text
model/provider/version
+ system/review prompt hash
+ context-builder hash
+ schema version
+ sampling policy
```

任何会实质影响判断行为的变更，都必须按预先定义的 drift / recalibration 规则重新验证。

## 8. 指标与护栏的正确定位

机械 metrics 适合：

- hard invariant；
- 越界检测；
- schema 完整性；
- baseline failure；
- 严重重复和 coverage 等已知坏模式；
- population incidence / coverage / uncertainty；
- Reviewer 结论的辅助证据。

机械 metrics 不应该默认：

- 代表好玩程度；
- 成为唯一 objective；
- 因为容易测量就获得更高产品权重。

正确关系：

```text
Deterministic facts / Guardrails
        +
Calibrated qualitative review
        +
Independent verification
        +
Population evidence
        ↓
Iteration decision
```

没有任何一个 LLM 角色单独是真理来源。

## 9. 配置驱动是默认行动边界

自动进化默认只能在授权 configuration action space 内提出修改。

```text
Findings
→ Planner PatchIntent
→ Deterministic Scope Controller
→ immutable overlay
→ isolated experiment
```

Controller，而不是 LLM，决定什么可以改。

如果一个 finding 无法通过当前 action space 合法修复，Planner 应输出：

```text
no_legal_action / capability_gap
```

这是正确答案，不是失败。

需要修改 PlayerState、Contract、Snapshot、核心运行逻辑或其他代码时，应退出自动飞轮，形成单独人工工程任务。

## 10. 多 Agent 的意义是可控信息边界

系统采用多个逻辑角色，是为了降低：

- confirmation bias；
- self-justification；
- evaluator contamination；
- holdout leak；
- arm identity bias；
- 一个上下文里“自己出题、自己答题、自己证明”的假隔离。

但多 Agent 不能消除同模型、同训练分布带来的相关盲点。

因此长期 acceptance 必须依赖多类证据，而不是“另一个 LLM 同意了”。

## 11. 玩家随机性与实验可复现性

玩家视角可以是随机的；实验视角必须可复现。

相同：

```text
source/config
persona
policy
seed
endAge
RNG implementation/version
```

应该重放相同 baseline。

candidate 改变调度后可以合法分叉。same seed 的作用是形成 common-random-number 对照，而不是保证整个人生逐事件一一对齐。

## 12. 防止 Goodhart：Reviewer 不能成为唯一被讨好的对象

自动飞轮天然存在：

> 配置越来越符合固定 Reviewer 的偏好，但世界越来越模板化、保守或失去意外性。

因此必须长期保留：

- 轮换 / 退休的 promotion holdout；
- healthy / adversarial canaries；
- diversity / long-tail observation；
- prompt / model drift 检查；
- independent blind verification；
- 必要的人类抽样；
- `insufficient_evidence` 和 stop semantics。

系统的目标不是最大化 Reviewer 满意度，而是通过多个受约束证据来源发现并减少真实体验问题。

## 13. 人在系统里的正确位置

人不应该逐份阅读大量人生。

人工主要用于：

- 建立初始 calibration gold set；
- 授权 action space；
- 授权阶段升级；
- 处理结构性 capability gap；
- 高风险正式 promotion；
- 周期性抽样检查 evaluator drift；
- 模型之间出现不可解释重大分歧时裁决。

随着系统被验证，人工频率可以下降，但正式生产写回 / 发布仍是独立授权问题。

## 14. 当前明确不追求

- 不追求“AI 自己证明游戏变好”；
- 不追求万能体验总分；
- 不追求 Reviewer 自动给出修复方案；
- 不追求一次实现完整 Agent 团队；
- 不追求 LLM 修改逻辑代码；
- 不追求永久复用同一个 holdout；
- 不追求把所有体验问题都塞进固定 taxonomy；
- 不为了未来抽离提前构建通用平台；
- 不用自动化程度代替被验证的可靠性。
