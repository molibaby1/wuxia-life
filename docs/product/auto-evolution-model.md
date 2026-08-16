# Wuxia-Life Auto Evolution 产品模型

> 状态：当前权威规范
>
> 日期：2026-08-14 Human Review 接受
>
> 发生冲突时，Auto Evolution 产品语义以本文件为准。历史 Auto Evolution 方案、Phase 路线图、Reviewer Calibration design / plan / handoff 不得指导新实现。
>
> 与 `docs/product/player-model.md` 同属第一层产品规范：player-model 负责人物模型；本文件负责 Auto Evolution 产品模型。
>
> 适用范围：Wuxia-Life 中所有借助真人、LLM 或其他外部系统获取体验反馈、设计建议、比较意见，并据此改进游戏的能力。
>
> 本规范定义产品方向，不授权任何具体实现、Phase 2、participant framework、Planner、Verifier 或正式配置修改。

---

## 1. 我们到底在做什么

Wuxia-Life 的目标是改进游戏本身。

自动演化系统的基本做法是：让一个或多个外部参与者接触游戏产生的信息，请他们从指定角度体验、观察或思考，然后把他们返回的意见作为改进游戏的输入。

最上层关系是：

```text
Wuxia-Life 产生一次游戏体验
        ↓
把参与者应该看到的信息交给外部参与者
        ↓
外部参与者以某个角色完成一项工作
        ↓
返回自己的观察、判断或建议
        ↓
Wuxia-Life 决定如何利用这些反馈
        ↓
只修改 Wuxia-Life 自己
        ↓
重新运行游戏，再获得新的外部反馈
```

系统的优化对象始终是 Wuxia-Life 自己，而不是外部参与者。

---

## 2. 核心概念

### 2.1 外部参与者（External Participant）

外部参与者是接收 Wuxia-Life 提供的信息并返回结果的外部实体。

它可以是：

- 一个 LLM；
- 一个真人；
- 一个由多人组成的评审者；
- 一个其他外部系统。

Wuxia-Life 核心产品语义不依赖参与者的内部实现。

核心系统不需要知道参与者：

- 使用哪个模型；
- 使用什么内部 prompt；
- 如何推理；
- 是真人还是机器；
- 为什么形成某个主观判断。

这些都属于参与者内部。

### 2.2 角色（Role）

角色表示“希望参与者完成什么工作”，而不是“某一种 AI”。

例如：

- 体验一段人生并描述哪里有趣、无聊、奇怪或难以理解；
- 阅读若干体验反馈并提出游戏修改建议；
- 比较两个游戏版本并说明自己更偏好哪一个以及原因。

同一个参与者可以承担不同角色；不同参与者也可以承担同一个角色。

因此：

```text
角色 = 工作
参与者 = 完成这项工作的外部实体
```

Reviewer、Planner、Verifier 等词如果未来继续使用，只能表示一种工作职责或任务语义，不得天然升级为需要认证、训练或优化的特殊 AI 类型。

### 2.3 输入材料（Participant Input）

输入材料是 Wuxia-Life 主动提供给外部参与者的信息。

系统必须决定：

- 参与者应该看到什么；
- 哪些信息不得看到；
- 信息是否来自真实、允许的产品表面；
- 是否包含实验身份、隐藏状态或 oracle 信息。

Phase 0 已建立的 player-observable information boundary 属于这一层的有效基础能力。

### 2.4 参与者回答（Participant Response）

参与者回答是外部参与者返回的结果。

结果可能包含：

- 主观体验；
- 观察；
- 偏好；
- 问题描述；
- 修改建议；
- 比较结论；
- 拒绝回答或表示信息不足。

参与者的主观回答首先表示“这个参与者就是这样认为的”。

Wuxia-Life 不为这种主观体验提供 gold answer。

### 2.5 产品决策（Product Decision）

参与者回答不是自动修改命令。

Wuxia-Life 可以：

- 接受某条建议；
- 拒绝某条建议；
- 综合多条意见；
- 只把它作为探索线索；
- 暂时不采取行动。

因此：

```text
参与者反馈
≠ 标准答案
≠ 自动修改命令
```

最终允许改变什么，由 Wuxia-Life 自己的产品边界、实验边界和修改权限决定。

---

## 3. 黑盒边界

外部参与者在产品模型中按黑盒处理。

Wuxia-Life 负责：

1. 定义任务；
2. 准备允许的输入；
3. 将输入交给参与者；
4. 接收回答；
5. 验证通信和行为边界；
6. 保存必要的来源与结果；
7. 决定如何使用反馈；
8. 只修改自身允许修改的部分。

Wuxia-Life 不负责：

- 让参与者变得更聪明；
- 训练第三方模型；
- 证明参与者具有“正确审美”；
- 调整参与者直到其意见符合 Wuxia-Life 预设答案；
- 建立一个统一标准判断参与者应该如何感受。

如果更换参与者后得到不同意见，这首先是外部反馈发生了变化，不自动意味着系统故障。

---

## 4. 可以验证什么

Wuxia-Life 可以确定性验证可由自身合同定义的事实。

例如：

- 返回格式是否符合约定；
- 必填字段是否存在；
- 引用的 transcript / event / record 是否真实存在；
- 输入是否泄漏了不允许的信息；
- 参与者是否请求了超出当前修改范围的操作；
- 输出是否违反明确的协议或安全边界。

这些属于通信、来源和操作合法性。

如果参与者对输入材料提出可核对的事实断言，例如“记录里发生过 X”，Wuxia-Life 也可以检查这项事实是否真的存在。这里验证的是事实一致性，不是参与者由这些事实产生的感受是否正确。

---

## 5. 不验证什么

Wuxia-Life 不对参与者的主观体验建立正确答案。

例如下面的回答本身不存在由 Wuxia-Life 判定的正确或错误：

> “这一段很无聊。”
>
> “我没理解为什么会发生这件事。”
>
> “我更喜欢版本 A。”
>
> “这个选择让我感觉没有意义。”

Wuxia-Life 可以验证回答引用的客观事实是否存在，但不得因为主观结论不符合预设标签，就把参与者判定为“不合格”。

长期原则是：

> **验证协议、来源和可观察事实；不考试参与者的主观感受。**

本条与 `docs/governance/product-decisions.md` 的 PD-055 一致；PD-055 是已完成裁决的决策账本条目，本文件是完整产品模型。

---

## 6. 反馈真实性与产品采纳是两回事

“不判断参与者感受对错”不意味着“参与者说什么就照做”。

例如：

> “我讨厌所有随机事件。”

这是一份合法的参与者反馈。

Wuxia-Life 可以仍然决定保留随机事件，因为产品还需要考虑其他反馈、产品目标、游戏规则和人工判断。

所以系统必须保持两层独立：

```text
第一层：参与者表达自己的体验
第二层：Wuxia-Life 决定怎样使用这个体验
```

不得把第二层的产品选择反向包装成“第一层参与者的感觉是错误的”。

---

## 7. 优化边界

Wuxia-Life 自动演化可以改变的对象，只能来自 Wuxia-Life 自己拥有并明确授权修改的范围。

例如未来可能包括：

- 游戏配置；
- 内容；
- 调度参数；
- 文案；
- 某些明确允许的规则。

具体允许范围必须由独立阶段授权定义。

外部参与者不属于优化对象。

因此下面的方向不属于产品主线：

- 优化 Reviewer 本身；
- 用 gold labels 训练 Reviewer 更符合预设意见；
- 把 Reviewer qualification 作为自动演化前置产品阶段；
- 把不同模型的主观一致率当作游戏正确性的证明。

---

## 8. 继续有效的既有能力

### 8.1 Player-observable information boundary

Phase 0 中已经建立的玩家可见信息边界继续有效。

它解决的问题是：

> 如果一个外部参与者被要求以玩家视角评价一次体验，他应该只看到真实玩家能够看到的材料。

即使外部参与者换成真人，这一能力仍成立。

因此它属于通用产品基础，而不是 Reviewer Calibration 的专属前置步骤。

### 8.2 Experiment isolation

实验配置与正式游戏配置必须隔离。

实验可以在独立实例中运行，但不得因为外部参与者提出建议，就自动污染或写回正式产品配置。

B1.0 已证明的实例级 candidate catalog / overlay 隔离能力继续作为有效工程基础存在。

### 8.3 Modification boundary

外部建议必须经过 Wuxia-Life 自己的允许范围。

参与者可以提出范围外建议，但系统不得因此自动扩大修改权限。

这里验证的是“这个操作是否被授权”，不是“这个建议是否聪明”。

---

## 9. 明确退休的旧方向

以下机制不属于当前 Auto Evolution 产品模型：

- 为参与者主观判断建立 gold answer；
- 用 precision / recall 衡量参与者是否和 gold answer 一致；
- 用 evidence-to-gold matching 判断体验意见正确性；
- 用重复调用一致性作为参与者是否有资格发表体验意见的前置考试；
- development / sealed-qualification 生命周期；
- Freeze Checkpoint；
- Reviewer qualification gate；
- 通过调 prompt / context 让参与者越来越接近预设主观答案；
- 证明某个模型像“正确玩家”一样思考。

这些内容可以保留在 Git 历史和已标记 retired 的历史文档中，但不得继续指导当前实现。

---

## 10. 暂时不设计的内容

本规范故意不回答：

- 使用 GPT、Claude 还是其他模型；
- 一次使用几个参与者；
- 是否需要真人参与；
- 如何聚合多个参与者的意见；
- 是否需要 Blind A/B；
- Planner 的具体实现；
- 自动修改哪些正式配置；
- candidate promotion；
- population evaluation；
- 通用 Participant SDK；
- provider registry；
- generic agent framework。

这些都只能在真实下一阶段需要时单独裁决。

不得因为本规范提出“外部参与者”概念，就立即建设一个通用 ExternalParticipant Framework。

本规范本身也不授权任何新的 Auto Evolution 实现。

---

## 11. 下一阶段的最小产品问题

旧 Reviewer Calibration 清理完成以后，下一阶段如果获得授权，应从一个最小闭环开始，而不是恢复完整自动演化路线图。

最小问题是：

> **Wuxia-Life 能否把一次真实的 player-observable 游戏体验交给一个外部参与者，保存这个参与者自己的反馈，并让这份反馈成为后续产品决策可使用的输入？**

这一步只需要证明：

```text
真实体验材料
→ 一个外部参与者
→ 一份参与者回答
→ 保存为可追溯的外部反馈
```

它不要求：

- 证明参与者可靠；
- 自动改游戏；
- Planner；
- 多模型投票；
- 自动 promotion；
- 完整飞轮。

后续是否进入“根据反馈提出修改建议”，必须再次独立裁决。

本节描述的是若获授权时的候选最小问题，不是当前 implementation authorization。

---

## 12. 与旧 Auto Evolution 文档的迁移关系

本规范生效后，旧 Auto Evolution 文档中的历史事实可以保留，但以下当前语义必须迁移。

### 12.1 必须替换的产品假设

旧语义：

```text
先证明 Reviewer 足够可靠
→ Reviewer 才能进入 Planner / candidate / verifier 飞轮
```

新语义：

```text
外部参与者直接提供自己的反馈
→ Wuxia-Life 决定如何使用反馈
```

参与者协议可以验证；参与者主观观点不进行资格考试。

### 12.2 Reviewer / Planner / Verifier 的解释

旧文档如果继续保留这些词，只能作为历史角色名称。

未来若重新使用，应解释为：

```text
Reviewer = 一类体验/观察任务
Planner = 一类提出改变建议的任务
Verifier = 一类比较或检查任务
```

它们不是必须分别由独立 AI Agent 实例承担的产品实体。

### 12.3 历史 Phase 0

Phase 0 的历史 accepted evidence 保留。

其长期意义只解释为：

> player-observable information boundary 已经存在且可复现。

不得再描述为“Reviewer Calibration 的必要前置资格”。

### 12.4 历史 Phase 1

Reviewer Calibration Phase 1 保留为 retired historical direction。

它已经实施又被清理这一事实可以记录，但：

- 不构成未来架构必须继承的资产；
- 不构成下一阶段继续 qualification 的授权；
- 不得从历史 plan 复活 calibration harness。

---

## 13. 权威关系

- 本文件是 Auto Evolution 的当前权威产品规范。
- 人物模型权威仍是 `docs/product/player-model.md`。
- PD-055 记录“主观判断不是金标准考题”的已完成裁决；不另建第二套规则。
- 当前工作授权以 `docs/governance/current-product-stage.md` 为准；本文件不自动授权实现。
- 旧 phased roadmap、Reviewer Calibration design / plan / handoff 已从 worktree 删除；转折说明见 `docs/history/2026-08-auto-evolution-direction-reset.md`。

---

## 14. 一句话原则

> **Wuxia-Life 通过让外部参与者体验、观察和思考游戏，收集他们各自的反馈和建议，再在受控范围内改变游戏自身，并通过新的体验反馈持续改进游戏。**

以及四条最小边界：

```text
角色 = 工作
参与者 = 完成工作的人或外部系统
参与者的主观反馈 = 该参与者给出的意见，不存在 Wuxia-Life 的标准答案
Wuxia-Life = 只决定怎样使用意见、怎样改变自己
```
