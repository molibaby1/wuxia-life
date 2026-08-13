# 03. 分阶段实施路线图：先校准观察者，再构建飞轮

> 状态：v2 候选路线图。阶段按“证明什么关键假设”排列，而不是按最终系统模块排列。

## 1. 总原则

每一阶段必须：

1. 只实现验证本阶段核心假设所需的最小能力；
2. 有可独立裁决的 `accepted / rejected / blocked / insufficient_evidence`；
3. 有明确失败含义；
4. 失败时允许停止整条路线，而不是自动加基础设施继续掩盖问题；
5. 不把“模型说看起来不错”当作验收；
6. 不因为最终想要自动飞轮，就提前实现所有 Agent。

## 2. 当前状态

### B0：已关闭

继承：

- source freeze；
- known-bad / control 校准思想；
- blind package；
- red-team veto；
- role isolation；
- human decision gate。

B0 不证明游戏好玩，也不承担体验 objective。

### B1.0：应收敛为已关闭的 Experiment Boundary Prototype

继承：

- `RuntimeEventCatalog` 注入；
- formal catalog parity；
- immutable weight overlay；
- deterministic scope validator；
- same-seed Headless baseline/candidate；
- artifact isolation；
- candidate 不自动发布。

B1.0 不证明：

- candidate 更好；
- Reviewer 可用；
- population-level 结论可靠；
- evidence chain 已成为完整 trust root。

### 原 B1.1：superseded，禁止直接续跑

原 B1.1 的部分基础思想迁移到后续阶段，但原 Task 9～14 不再作为当前实施授权。

---

# Phase 0：PlayerObservableTranscript + Reviewer Invocation Contract

## 要证明的假设

> 我们能否稳定构造“只包含玩家可观察信息”的 Reviewer 输入，并且保证 Reviewer 调用的信息边界可审计？

如果输入本身无法代表待判断体验，后面所有 Reviewer 校准都无意义。

## 最小实现

只构建：

```text
Headless run
→ PlayerObservableTranscript
→ sealed Reviewer input package
```

不要求 Reviewer 产生有效产品结论。

### Transcript 至少包含

- event title/body；
- 当时可见 choices；
- selected choice；
- visible outcome；
- visible state delta；
- visible milestone/phase/acknowledgement；
- 只包含玩家可观察人物/开局信息；seed、simulation persona、internal policy、arm/config identity 留在 `ExperimentEnvelope`，不得进入 Reviewer 的 `ObservablePayload`。

### Reviewer invocation 至少 seal

- model identifier/version；
- prompt hashes；
- context builder hash；
- input transcript hashes；
- schema version；
- sampling parameters；
- output hashes。

## 成功标准

- 人工 spot-check 能确认 transcript 与玩家可见信息一致；
- hidden effects / engine-only state 不泄漏；
- choice / feedback / visible delta 不缺失；
- prompt-injection fixture 只能作为数据出现；
- 同 run 可以稳定重建相同 transcript；
- 所有 source/input artifact 都有内容 hash，包括 untracked 实验源码。

## 失败意味着

- 如果无法从当前 Headless 可靠投影玩家可观察体验，应先修正 trace / simulation boundary，不能进入 Reviewer calibration。

## 允许进入下一阶段

只有 Transcript Contract 和 Reviewer invocation provenance 被接受后。

Phase 0 与 Phase 1 可以共用一份 successor design，但**执行状态必须分离**：Phase 0 未人工/治理接受时，Orchestrator 或执行者不得自动开始 Reviewer calibration。

---

# Phase 1：Reviewer 分类别可靠性校准

## 要证明的假设

> 在只看 PlayerObservableTranscript 的条件下，LLM Reviewer 是否能稳定发现我们关心的文本体验问题，并且知道什么时候不该下结论？

## 最小实现

```text
Frozen calibration corpus
→ isolated Reviewer calls
→ raw review + structured findings
→ deterministic calibration report
```

不生成 patch，不运行 candidate。

## Calibration Corpus

必须同时包含：

- historical real defects；
- synthetic-but-natural known-bad；
- healthy hard negatives；
- ambiguous cases；
- prompt-injection / instruction-like event text；
- 不同 persona / 阶段 / 长度。

人工只建立一个**小规模 calibration corpus**。建议至少两名独立标注者处理 gold labels，并对分歧样本做一次仲裁；这不是每轮进化成本。

该 corpus 必须至少拆成：

- `calibration-development`：可见，可用于调 prompt/context/schema presentation；
- `sealed-qualification`：在 qualification 前封存，只用于 Reviewer 资格判断。

qualification 结果一旦反馈并用于调优，该 sealed 集立即退休或降级为 development。样本量不足的类别必须报告不确定性，不得为了 `accepted` 强行下结论。

## 分类别测量

至少计算：

- evidence citation correctness；
- precision；
- recall；
- healthy-control false-positive rate；
- repeated-call consistency；
- abstain correctness；
- ambiguous-case overclaim rate；
- prompt-injection resistance。

### 阈值原则

正式 spec 必须在实施前冻结每一类的最低阈值；本 proposal 不凭空发明数字。

阈值应来自：

1. gold set 的人工一致性上限；
2. 当前基础模型的初始 benchmark；
3. 业务上可接受的 false-positive / false-negative 成本。

**没有冻结阈值，就不能宣称 Phase 1 accepted。**

## 失败意味着

如果 Reviewer 在核心类别上：

- evidence 引用不可靠；
- healthy controls 高误报；
- repeated calls 严重漂移；
- 经常把 hidden-player-knowledge 问题强行下结论；

则停止自动飞轮方向，或者把 Reviewer 限缩到已证明可靠的类别。

## 允许进入下一阶段

Reviewer 在明确类别上通过冻结阈值，并建立模型/prompt/context 变化后的 recalibration 规则。

Qualification 必须绑定具体的 `model + prompt + context builder + schema + sampling policy` 指纹，不能把一次通过外推成模型永久资格。

---

# Phase 2：Blind Pair + Branch Divergence 语义验证

## 要证明的假设

> 对合法分叉的人生，独立 Blind Verifier 能否在不知 arm identity 和 Planner rationale 的情况下识别体验差异，而不错误假设两条人生逐步对齐？

## 最小实现

candidate 可以由人工构造，优先使用 B1.0 已验证的 weight overlay。

```text
baseline + candidate
→ same persona/policy/seed
→ anonymous A/B transcripts
→ open regression scan
→ targeted comparison
```

## 必须新增

- first semantic divergence marker；
- prefix/local attribution window；
- anonymous arm packaging；
- arm map seal；
- open scan 先于目标 finding reveal；
- A/B 呈现顺序随机化；关键 fixture 进行镜像复评，用于检测 position bias。

## 成功标准

- known improvement / known regression pair 能被区分；
- arm identity 不泄漏；
- verifier 能输出 `indistinguishable / both_problematic / insufficient_evidence`；
- 分叉后不声称逐步单变量因果；
- pair findings 可以回溯到具体 transcript evidence。

## 失败意味着

same-seed pair 只能保留为可复现 replay 工具，不能作为体验验证核心证据；后续必须更依赖 population-level 方法。

---

# Phase 3：Population Aggregation / Sampling / Summary-Loss 验证

## 要证明的假设

> 系统能否在多 seed / persona / policy 上形成稳定的分布级证据，而不是被单局或摘要偏差误导？

**这一阶段必须早于完整自动闭环。**

## 最小实现

冻结一个分层 corpus，分别运行 baseline / candidate。

```text
per-trace findings
+ pair findings
→ deterministic stats
→ stratified evidence selection
→ Aggregate Reviewer
```

## EvaluationTarget bridge

Phase 3 前必须把待验证现象冻结为实验级、版本化的 `EvaluationTarget` rubric。开放式 finding 不能直接被程序按自然语言 summary 聚类计数。

每条 target assessment 至少输出：

```text
targetId
rubricVersion
assessment = present | absent | insufficient_evidence
evidenceRefs
severity
```

`targetId + rubricVersion` 在 candidate evaluation 前 seal。未冻结的新问题继续保存在 `exploratoryFindings`，不进入 incidence。

## 程序负责

- incidence；
- paired incidence delta；
- strata coverage；
- completeness；
- long-tail regression counts；
- uncertainty / interval；
- mechanical metrics。

## LLM 负责

- 解释结构化统计；
- 归纳典型模式；
- 检查 rare severe cases；
- 发现未定义的新副作用；
- 判断 summary-loss / evidence sufficiency。

## Sampling 验证

必须测试：

- common cases 是否被覆盖；
- rare severe regression 是否不会被平均掉；
- persona strata 是否失衡；
- 不同 evidence selection 策略是否导致结论剧烈漂移。

## 成功标准

- aggregate 结论可以回溯到统计与原始 evidence；
- known population shift 能被识别；
- healthy/no-change corpus 不会被模型强行解释成改善；
- 代表性抽样不会稳定漏掉已知 long-tail blocker；
- LLM 不承担确定性计数。

## 失败意味着

不能构建自动 iteration acceptance；系统最多只能做单样本/小样本诊断助手。

---

# Phase 4：Planner Actionability（第一 action space：weight-only）

## 要证明的假设

> sealed finding 能否被 Planner 转成合法、具体、可验证的配置干预，同时在无法修复时正确回答 `no_legal_action`？

## 最小 action space

继续只使用 B1.0 已验证的 event weight overlay。

weight 在这里是：

> **实验 actuator。**

不是长期主要优化对象。

## 流程

```text
sealed findings
→ Planner PatchIntent
→ deterministic Scope Controller
→ legal overlay | blocked | no_legal_action | capability_gap
```

## 成功标准

- rationale 只引用 finding/evidence；
- Planner 不读取 holdout / Verifier；
- 非法 target/delta 被机械阻断；
- `no_legal_action` 在 deliberately-unfixable fixture 上被接受；
- Planner 不能修改文件或扩大自己的 action schema。

## 失败意味着

Reviewer 仍可以作为自动诊断能力存在，但自动修改链路暂停。

---

# Phase 5：一次 Population-Validated 完整闭环

## 要证明的假设

> 在没有人工逐份分析日志的情况下，系统能否完成一次“发现问题 → 合法干预 → paired 验证 → population 证据 → 独立审计”的完整 iteration？

## 流程

```text
baseline corpus
→ Reviewer
→ Planner
→ Scope
→ candidate seal
→ paired candidate runs
→ Blind Pair Verifier
→ deterministic population stats
→ Aggregate Reviewer
→ Mechanical / Red Team
→ iteration decision
```

## 人工角色

允许人工：

- 启动本阶段；
- 审阅最终 sealed summary；
- 决定是否授权下一轮。

不要求人工逐份阅读 transcript。

## 成功标准

- 每一角色输入/输出可追溯；
- candidate seal 后不能根据 validation 结果原地改 patch；
- population-level evidence 支持目标 finding 改善；
- 无 high/critical 新 regression；
- red-team 无 veto；
- `accepted_iteration` 不写回 formal config。

## 失败意味着

根据失败环节回退到对应 Phase，不自动增加更多 Agent。

---

# Phase 6：有限多轮 + Holdout Rotation + Drift / Goodhart 检测

## 要证明的假设

> 连续多轮后，系统是否仍能发现真实问题，而不是振荡、过拟合固定 evaluator / holdout，或者通过牺牲多样性讨好 Reviewer？

## 新增能力

- iteration lineage；
- finding lineage；
- patch lineage；
- oscillation detection；
- evaluator drift checks；
- holdout exposure history；
- validation / promotion holdout rotation；
- diversity-collapse signals；
- max iteration / token / compute budget。

只有此时才考虑引入 Historian。

## 关键规则

- 新一轮 Reviewer 不看上轮 Planner 的预期结果；
- final promotion holdout 一旦结果反馈给飞轮即退休/轮换；
- model/prompt/context 变化先重跑 calibration；
- 相邻 patch 来回震荡必须 stop；
- Reviewer 越来越满意但 diversity / long-tail 明显恶化必须 stop。

## 成功标准

在有限轮数内：

- 不出现持续振荡；
- 不依赖同一 holdout 重复调参；
- calibration 没有明显漂移；
- 不出现系统性 diversity collapse；
- 每轮都允许 `no improvement / stop`。

## 失败意味着

系统保留单轮自动实验能力，不降低 Human Gate，也不宣称自驱动飞轮成立。

---

# Phase 7：逐步降低 Human Gate

## 要证明的假设

> 在已经长期通过校准、population 和多轮稳定性验证的低风险 action space 内，人工是否可以从逐轮裁决退到阶段升级和高风险 promotion？

可能自动化：

- 低风险 iteration 的继续/停止；
- 已授权 action space 内的 candidate 实验；
- evidence collection；
- regression veto。

继续人工授权：

- action space 扩大；
- structural capability gap；
- 高风险正式 promotion；
- evaluator 重大分歧；
- governance 变更。

正式配置写回 / 发布始终视为独立问题。

---

# Phase 8：独立产品化 / 抽离评估

只有至少满足：

1. 多轮飞轮在 Wuxia-Life 上稳定；
2. 至少两个不同 config slice 使用相同 Evolution contracts 成功实验；
3. Transcript / Simulation / Config Action 边界已经自然稳定；
4. Evolution 层没有大量依赖 Wuxia-Life 私有实现；
5. 抽离能够减少耦合，而不是制造适配复杂度；

才评估独立 package / Skill / 产品。

当前只要求同仓内边界清晰。

---

# 正交能力线：Configuration Action Space Expansion

Action Space **不是“到 Phase 7 才一次性扩大”的顺序阶段**。

每新增一种 operation，都必须单独完成：

```text
schema
→ whitelist
→ deterministic validator
→ immutable overlay
→ focused tests
→ rollback
→ authorization
```

然后才允许该 operation 进入当时已经通过的飞轮阶段。

可能顺序仅作候选：

1. event weight；
2. 低风险调度参数；
3. 已结构化 content variant；
4. 已结构化条件参数；
5. 其他明确纯配置字段。

涉及 PlayerState / Contract / Snapshot / 新运行逻辑 / 任意代码修改时，默认输出 `capability_gap` 并退出自动 action space。

---

# 进入实现前的文档门

如果 v2 再次评审通过，第一份正式 successor design 只覆盖：

> **Phase 0 + Phase 1：PlayerObservableTranscript & Reviewer Calibration。**

在写 implementation plan 前必须冻结：

- Transcript Contract；
- Reviewer input ACL；
- Reviewer output schema；
- calibration corpus 构成；
- gold-label 流程；
- 分类指标定义；
- acceptance threshold 的确定方法和最终数值；
- model/prompt/context fingerprint；
- evidence seal 最小要求；
- `no_material_finding / insufficient_evidence / requires_player_study` 语义；
- 明确 Phase 0/1 **不生成 candidate、不修改配置、不闭环**。

如果 Phase 1 不能证明 Reviewer 在至少一组核心类别上稳定可靠，就不应该进入 Planner 和自动飞轮。
