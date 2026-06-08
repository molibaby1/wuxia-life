# 项目现状分析：配置驱动叙事目标的差距与后续推进方向

## 1. 这份文档的目的

这份文档用于记录当前项目在 `P8/P9` 之后的真实状态，并明确回答两个问题：

1. 当前项目离“剧情优化主要通过配置完成，而不是频繁修改逻辑代码”的目标还有多远。
2. 后续会话如果继续推进，应该优先补哪些差距，避免重复讨论和无效重构。

这不是新的 PRD，也不是实现计划本身，而是一份面向接力开发的现状分析与方向说明。

## 2. 长期目标

项目的长期目标不是只做一个武侠题材 demo，而是逐步形成：

- 一套通用的人生模拟 runtime
- 多套题材 world pack / narrative pack
- 一套用于验证体验质量的 playability gate

理想状态下：

- 代码层负责“怎么跑”
- 配置层负责“跑出什么人生”

也就是说，未来如果要把当前武侠人生切换成：

- 足球世界生涯
- 现代经商生涯
- 娱乐圈成长生涯

不应该重写核心逻辑，而应该主要替换：

- 主动行动目录
- 年龄阶段配置
- 路线定义
- 回响配置
- 摘要模板
- 事件内容包

## 3. 当前已经达到的状态

### 3.1 Playability gate 已经能判断结构性问题

`gate:playability` 已经不是空壳指标，而是能检查：

- agency
- causality
- achievement
- frustration
- replayability
- pacing
- narrative memory

这说明项目已经具备“用自动化验证剧情结构是否基本成立”的能力，而不是只能靠主观判断。

### 3.2 第一批叙事结构已经进入配置层

P9 之后，以下结构已经有明确配置入口：

- `stageConfig`
- `routeDefinitions`
- `echoHooks`
- `summaryTemplates`
- P9 remediation 事件内容包

这意味着当前已经不是“所有剧情结构都写死在逻辑里”的状态。

实际已经可以通过配置完成的调整包括：

- 调整某个年龄阶段的目的与最低反馈预期
- 调整路线的 entry / reinforcement / divergence / identity signals
- 调整某个 early action 对应的 later callback
- 调整 age-40 identity 的 summary 文案
- 调整第一波 remediation 事件包本身

### 3.3 P9 证明了“配置 + 少量 runtime 支持”可以改善内容结果

从门禁结果看，P9 已经证明：

- direct echoes 不再普遍为 0
- replayability 的近重复问题被明显压低
- pacing 的长空窗问题被压低
- 0-40 岁切片的 age-40 identity 更明确

这说明“通过配置驱动的叙事补强来改善内容结构”是可行的，不只是理论方向。

## 4. 当前还没有达到的目标

虽然已经进入配置化阶段，但离“剧情优化主要靠配置完成、未来可切换世界观”的目标还有明显差距。

### 4.1 配置还没有成为唯一真源

当前很多配置已经存在，但 runtime 仍然保留了明显的解释层硬编码。

典型表现：

- route identity 解析仍靠代码里的 flag 判断
- summary template 的选择规则仍靠代码里的条件分支
- echo summary 的汇总字段仍然部分写死
- 某些剧情结果仍依赖逻辑层对武侠语义的特殊理解

这意味着：

- 配置已经存在
- 但配置还不是完整的执行真源

### 4.2 路线系统仍然强武侠绑定

目前的 narrative config 虽然已经抽象出 `stage / route / echo / summary` 四类结构，但具体语义仍然明显偏武侠：

- route identity 的命名仍围绕武道、邪路、江湖、商路、游侠
- summary template 的语气和字段仍默认武侠人生
- route signal 的解释方式仍偏向武侠成长逻辑

这不是错误，但说明当前状态更接近：

- “武侠内容开始配置化”

而不是：

- “世界观无关的人生模拟引擎已经成熟”

### 4.3 行为策略还不够像真正的人生策略系统

当前 persona-driven active action 已经成立，但仍然比较单轴：

- martial 主要还是练功
- scholar 主要还是读书
- social 主要还是交游
- wealth 主要还是营商
- explorer 主要还是游历

这足以让门禁看到差异，但还不等于：

- persona 会根据阶段、风险、关系、身份变化而动态调整策略

如果未来要支持足球/经商/娱乐圈这类题材，主动行动系统需要更像通用策略系统，而不是当前这种“早期分流后沿单轴推进”的形态。

### 4.4 Summary 系统仍然是“模板化输出”，还不是“配置驱动叙事生成”

现在的 summary 已经比之前强，但本质还是：

- 固定三段式
- 配置模板
- 逻辑挑选模板并注入变量

它已经足够支持武侠 P9，但距离真正的 world-pack 级 narrative output 还有差距：

- 哪些事件构成转折点
- 哪些身份词汇优先出现
- 哪些回响应该进入总结
- 同一题材下不同子世界的表达差异

这些还没有完全交给配置决定。

## 5. 当前最关键的差距清单

下面这些差距，是后续会话应该围绕的核心问题。

### Gap 1：Route identity 解析仍然硬编码

现状：

- runtime 通过代码判断哪些 flags 代表哪条身份路线

问题：

- 新增路线时容易变成“新增配置 + 修改判断逻辑”
- 无法自然支持其他题材的 identity tracks

目标：

- route identity 解析规则应尽量配置化

### Gap 2：Summary template 的选择规则仍然硬编码

现状：

- runtime 仍然写着 merchant / martial / scholar / social 等条件分支

问题：

- 模板是配置化的，但模板选择逻辑不是
- 切换题材时仍要改代码

目标：

- 将 template selection rules 下沉到配置或声明式映射层

### Gap 3：Echo hook 的 summary 消费链不完整

现状：

- echo hook 已存在
- 但 summary 仍只拼固定几个 echo 字段

问题：

- 新增 echo 类型时可能仍需改逻辑
- 配置层不能完整定义“什么回响如何进入总结”

目标：

- 让 echo hook 自己声明是否进入 summary、进入哪个 slot、使用什么摘要片段

### Gap 4：Stage config 目前更像说明书，不像调度真源

现状：

- stageConfig 已定义阶段与反馈期待

问题：

- runtime 还没有深度依赖它来控制节奏与内容调度

目标：

- 逐步让阶段配置真正参与节奏判断、反馈要求与内容选择

### Gap 5：Route definitions 目前仍偏静态说明

现状：

- routeDefinitions 已定义 entry / reinforcement / divergence / identity

问题：

- 它还更像结构说明，而不是 runtime 的核心输入

目标：

- 让路线内容更多从 routeDefinitions 驱动，而不是只作为辅助映射存在

### Gap 6：World profile 还停留在边界说明，没有进入执行层

现状：

- P9 已写出 world profile boundary note

问题：

- 还没有形成真正可加载、可切换的 world profile schema

目标：

- 先让武侠 world profile 成为正式配置对象
- 再验证是否能支撑其他题材 pack

## 6. 当前状态的准确判断

如果把项目成熟度粗略分成三档：

### Level 1：剧情主要写死在逻辑里

- 调剧情就得改逻辑
- 换题材几乎等于重写

### Level 2：剧情结构开始配置化，但 runtime 仍有明显解释层硬编码

- 能通过配置改善很多剧情表现
- 但扩路线、扩题材仍经常要补逻辑

### Level 3：runtime 基本 world-agnostic，题材主要通过配置/pack 切换

- 行为、路线、回响、摘要、目标主要靠配置
- 切题材不需要重写核心逻辑

当前项目更接近：

## **Level 2 前中段**

这意味着：

- 已经走出“全靠改逻辑”的阶段
- 但还没进入“world pack 真正主导内容”的阶段

## 7. 推荐的后续推进方向

后续推进不应该直接跳到“大一统重构”，而应该继续按顺序推进。

### Phase 1：把已存在的 narrative config 变成更强的执行真源

优先做：

- route identity 解析配置化
- summary template selection 配置化
- echo summary 消费配置化

目标：

- 让新增路线、改路线、改摘要时，更多改配置，少改解释代码

### Phase 2：让 stage / route / echo 真正参与内容调度

优先做：

- 阶段配置参与 pacing 与内容最小反馈判断
- 路线定义参与 reinforcement / divergence 触发
- echo hook 参与更完整的 later callback 选择

目标：

- 让配置不仅是文档化结构，而是 runtime 行为输入

### Phase 3：把武侠 world profile 做成正式配置对象

优先做：

- 定义武侠 world profile schema
- 把 stats / resources / identity tracks / action families / summary signals 写成正式配置

目标：

- 让“武侠”成为一个明确的 world pack，而不是默认题材

### Phase 4：用第二题材做最小验证

不要直接做完整“足球世界”或“现代经商”项目，而是做：

- 一个最小 alternate world prototype

例如只验证：

- 不同的 action catalog
- 不同的 identity tracks
- 不同的 summary templates

目标：

- 检验当前 runtime 的抽象是否真的足够通用

## 8. 不建议现在做的事情

为了避免方向跑偏，后续会话不建议做这些事：

- 不要为了追求“抽象漂亮”提前重写全部 runtime
- 不要把 warning 清零误判成“配置化目标已经完成”
- 不要继续往武侠内容里堆大量系统来掩盖结构问题
- 不要直接承诺完整多题材切换已经可做
- 不要把 narrative config 当作纯文档，而不让 runtime 真正消费它

## 9. 面向接力会话的建议工作顺序

如果后续要让别的会话继续推进，我建议按下面顺序：

1. 抽查当前 narrative config 的消费点，列出仍然硬编码的解释逻辑
2. 优先把 route identity mapping 改成更声明式的配置消费
3. 把 summary template 选择规则从条件分支改成配置映射
4. 把 echo hook 到 summary 的消费链彻底配置化
5. 再评估 stage/route/world profile 是否进入下一轮 PRD

不要反过来先做“足球世界”或“现代经商”的大题材实验，否则很容易在抽象不稳定时把系统拉散。

## 10. 一句话结论

当前项目已经证明：

- 剧情结构优化不再只能靠改逻辑代码
- 一部分优化已经可以通过配置完成

但当前还没有达到：

- 剧情优化主要靠配置就能完成
- 更换世界观主要靠替换 world pack 就能完成

最准确的现状判断是：

**P9 已经把配置驱动叙事的方向做对了，但 runtime 仍保留了不少武侠专用解释逻辑，项目离“可切换世界观的配置驱动人生引擎”还有一轮明确的结构抽象工作。**
