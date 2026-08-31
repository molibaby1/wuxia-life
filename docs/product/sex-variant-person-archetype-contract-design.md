# Sex-Variant Person Archetype Contract v1

> 状态：Human-accepted design；repository authority closure pending
>
> Human accepted：2026-08-31
>
> 本文位于 `docs/product/player-model.md` 与 `docs/product/character-relationship-product-contract-design.md` 之下，定义一个极窄的人物原型性别变体能力。本文不授权 Generic Person Instantiation、NPC Generator、Person Registry、开放式人物属性系统或多维 procedural character generation。
>
> 第一实现样本为当前 introduced-marriage 纵切中的商贾家庭介绍人物：现有固定女性人物“沈清禾”将作为 `merchant_introduced_partner_v1` 的 female variant；新增 male variant “沈知衡”，用于女性玩家的同一人物原型内容。

## 1. 产品目标

本能力只解决两个产品问题：

1. 当一个有婚姻可能的人物，其核心人物语义并不依赖自身性别时，不要求为了覆盖不同玩家性别而复制一套全新人物和剧情；
2. 当一个没有婚姻关系的人物，其性别对故事语义没有实际影响时，不要求 authoring 永久把人物性别写死。

本能力不是为了证明人物实例化“不可替代”，也不是为了随机生成更多人格。其价值是：

> **允许一个已经完整 authored 的 Person Archetype 在不改变人物核心语义的前提下，绑定到有限、明确 authored 的 male / female identity variant。**

核心边界：

```text
可变：sex variant identity presentation
固定：这个人物为什么进入人生、是谁、在乎什么、如何行动、承担哪些事件责任
```

如果为了共享一个 archetype 而开始增加明显复杂度，默认动作是 **BLOCK / split archetype**，不是扩大实例化系统。

## 2. 与 Character / Relationship Contract 的关系

`Character / Relationship Product Contract v1` 继续负责：

- Person-first；
- Person Access；
- Character Anchors；
- Core Concern；
- Event Responsibilities；
- relationship formation；
- fact-first relationship；
- Romance / Marriage separation；
- shared-vs-character-specific promotion boundary。

本 Contract 只负责：

> 一个已经满足 Person Definition Contract 的合法 Person Archetype，如何拥有有限的 sex variants，并在 Runtime 中稳定选择、保存和引用其中一个 concrete variant。

Sex Variant 不得替代 Person Definition，也不得用代码复用理由把本质不同的两个人物强行合并成同一个 archetype。

## 3. Person Archetype 与 Sex Variant Policy

正式模型：

```text
Person Archetype
│
├─ Fixed Semantic Core
│  ├─ Access
│  ├─ Character Anchors
│  ├─ Core Concern
│  ├─ Event Responsibilities
│  ├─ Relationship Possibilities
│  └─ Long-term Hooks
│
└─ Sex Variant Policy
   ├─ fixed
   │  └─ male / female
   │
   └─ variable
      ├─ male variant bundle
      └─ female variant bundle
```

### 3.1 Fixed Semantic Core

同一 archetype 的 male / female variant 必须共享：

- 相同的 Access；
- 相同的 Character Anchors；
- 相同的 Core Concern；
- 相同的主要 Event Responsibilities；
- 相同的 Relationship Possibilities；
- 相同的主要 causal chain；
- 相同的 canonical choice semantics 与 effects。

如果改变 sex 后需要大面积改变上述内容，则不再属于同一个 archetype。

### 3.2 v1 Variant Bundle

v1 只允许以下 identity-bearing / presentation fields：

```text
sex
displayName
pronoun / address forms
```

`portraitId` 只有在真实视觉 consumer 出现后才允许独立讨论；当前 v1 不要求实现。

`displayName` 不是第二个随机维度，而是 sex variant bundle 的组成部分。

禁止开放：

```text
attributes
traits
personality
background
socialClass
familyTrade
variantMetadata
Record<string, any>
```

或任何等价的通用扩展槽。

## 4. Fixed 与 Variable 人物并存

不是所有人物都必须采用 Sex Variant。

以下两种人物同时合法：

```text
fixed person
→ 明月、赛音等作者身份本身具有明确意义的人物

sex-variable archetype
→ 性别变化不改变人物核心语义的人物
```

不得因为 v1 能力存在而批量迁移 fixed characters。

## 5. 婚姻人物的 variant selection

本 Contract 不建设 global orientation system，也不规定所有婚姻必须异性。

每个 archetype 自己声明当前 authored content 支持的 player/person pairing。

第一样本：

```text
merchant_introduced_partner_v1

player male
→ female_qinghe

player female
→ male_zhiheng
```

这只表示该 archetype v1 当前 authored 的两种 content pair，不构成全局性取向、婚姻资格或配对规则。

## 6. Event Authoring 默认规则

Sex Variant 的默认用途是 presentation。

同一 archetype 的 variant 默认必须保持相同：

```text
eligibility
choice structure
canonical effects
causal chain
```

Event 可以读取一个封闭的人物表现 context，例如：

```text
{{person.name}}
{{person.pronoun}}
{{person.address}}
```

不得提供任意 `person.*` property path。

### 6.1 Sex-specific eligibility 是例外

某个具体产品语境未来可能证明 sex 确实影响事件是否成立，但这属于 exception。

v1 implementation authority **不包含** `person_sex_is` 或任何 Person attribute condition。

如果未来真实内容需要 sex-gated event，必须重新进入 bounded design / review；一个 archetype 出现第 2 个核心 sex-gated event 时强制触发 Complexity Review。

## 7. Runtime Boundary

v1 不建立 Person object 或 NPC registry。

推荐 Runtime 模型：

```text
Static Person Archetype Catalog
        │
        │ first event materialization
        ▼
facts["person_variant:<archetypeId>"] = <variantId>
        │
        ├─ closed text rendering context
        └─ dedicated person consumer
```

### 7.1 Persisted binding

每个真正 materialize 过的 variable archetype，最多保存一个字符串 binding：

```text
facts["person_variant:merchant_introduced_partner_v1"]
= "female_qinghe"
```

或：

```text
= "male_zhiheng"
```

不分别保存：

- sex；
- displayName；
- pronoun；
- relationship state；
- affinity；
- Person object；
- generic attributes map。

`facts` 是当前 canonical Snapshot 的持久字段，并允许 string fact；因此该 binding 不要求新增 Snapshot 顶层字段。

### 7.2 Static catalog

Runtime catalog 只保存执行真正需要的信息，不复制完整 Product Person Definition。

概念结构：

```text
merchant_introduced_partner_v1

selectionPolicy:
  playerGenderMap:
    male   -> female_qinghe
    female -> male_zhiheng

variants:
  female_qinghe:
    sex: female
    displayName: 沈清禾
    pronoun: 她
    address: 姑娘

  male_zhiheng:
    sex: male
    displayName: 沈知衡
    pronoun: 他
    address: 公子
```

不得添加开放式 metadata / attributes 容器。

## 8. Instance creation timing

一个 archetype 只有在首个声明 `create` 该 archetype 的事件**真正被选中准备呈现给玩家**时才 materialize。

禁止：

- 开局预实例化所有人物；
- EventLoader load 时实例化；
- 仅因 eligibility 成立就实例化；
- 后续 `require` 事件发现不存在时偷偷创建。

概念 authoring interface：

```text
personBinding:
  archetypeId: merchant_introduced_partner_v1
  mode: create
```

或：

```text
personBinding:
  archetypeId: merchant_introduced_partner_v1
  mode: require
```

`create`：不存在时按 selection policy 绑定，已存在时复用。

`require`：只有 binding 已存在时才能 materialize；不得自动补建。

Person existence 与 Relationship existence 分离：介绍事件已经提及 concrete person 时，instance 可以存在；只有玩家真正见面后，具体 relationship history 才成立。

## 9. Dedicated person consumer，不开放 Effect templating

当前 introduced-marriage marriage effect 需要把 concrete variant 的 `displayName` 写入 `player.spouse`。

v1 允许新增一个专用 consumer，概念上：

```text
set_spouse_from_person
archetypeId: merchant_introduced_partner_v1
```

它解析当前 persisted variant，并设置：

```text
player.spouse = variant.displayName
```

禁止因为该需求把所有 Event Effect `value` 扩展成任意 Person templating。

未来如果第二种 production effect 也需要消费 Person instance，应单独 review，而不是提前建立 generic dynamic effect system。

## 10. Save / Load 与 compatibility boundary

当前 repository Save Schema Policy 明确：

- Snapshot `3.16.0` 是唯一可读 schema；
- runtime 不实现 migration；
- 不做 fallback、history reconstruction 或 silent cleanup；
- `facts` 是 canonical persisted state。

因此新的 variant binding 可以通过现有 `facts` 自然 round-trip，而不需要新增 Snapshot 顶层字段或 Person registry。

同一 run 必须保证：

```text
第一次 materialize
→ 选择 variant
→ persist variantId
→ save
→ load
→ 解析到同一个 variant
```

不得重新 roll。

### 10.1 Development-stage destructive compatibility policy

Human 已明确确认：当前项目仍处于破坏性开发阶段，尚未进入“一边长期运行、一边保证既有游戏存档持续兼容”的阶段。

因此，PD-103 / v1 **不保证** pre-PD-103 沈清禾中途存档继续沿人物纵切运行，即使这些存档本身仍满足 Snapshot `3.16.0` 的结构校验。旧/current saves 可能没有新的 `person_variant:*` fact；这种 content-state discontinuity 在当前开发阶段是接受的。

v1 authority 仍然 **不授权**：

- load-time compatibility inference；
- 根据 `spouse = "沈清禾"` 自动补 fact；
- 根据历史事件自动 reconstruction；
- schema migration framework；
- `require` event 缺 binding 时偷偷 `create`；
- 为 pre-PD-103 content state 增加 fallback / alias。

实现应直接采用新的 canonical binding 语义。旧沈清禾中途存档若因缺少 binding 无法继续 person-bound 后续事件，不构成本阶段 blocker，也不得为此引入 compatibility layer。

Snapshot schema 仍保持 `3.16.0`；本决策是 development-stage content compatibility policy，不是 schema migration。

### 10.2 Catalog identity stability

已发布的 `variantId` 是 identity-bearing binding。

同一 catalog compatibility line 内，不得把：

```text
female_qinghe
```

静默重定义为另一个姓名 / sex identity。

需要改变 identity-bearing fields 时必须按 content/catalog compatibility change 单独治理。

## 11. 第一实现样本：merchant_introduced_partner_v1

当前固定人物“沈清禾”纵切已经存在：

```text
shen_qinghe_introduction
→ shen_qinghe_shared_matter
→ shen_qinghe_marriage_decision
```

v1 不重新设计这条纵切，只做 semantic-preserving variant migration。

### 11.1 Variants

```text
female_qinghe
  sex: female
  displayName: 沈清禾
  pronoun: 她
  address: 姑娘

male_zhiheng
  sex: male
  displayName: 沈知衡
  pronoun: 他
  address: 公子
```

### 11.2 Fixed Semantic Core

两个 variant 都必须保持：

- 来自与玩家家中长期有商业往来的沈家；
- 实际参与自家账目与货物流转；
- 重视承诺和账目；
- 不把商业合作直接等同婚姻；
- 如果成婚，希望继续参与自己的家业；
- 同一个介绍 → 共同事务 → 婚姻决定 causal chain。

不得为了男性版本改变社会职责、Character Anchors、Core Concern 或主要事件结构。

### 11.3 Current event text adaptation

三个现有事件只需要使用有限的 person presentation tokens；第一样本不需要 sex-specific plot branch，也不需要 sex-specific eligibility。

当前：

```text
player.gender == "male"
```

作为 introduction 的 first-sample coverage guard，在 archetype 支持 male/female player pair 后退出。

selection policy 负责：

```text
male player   -> female_qinghe
female player -> male_zhiheng
```

### 11.4 Marriage

现有：

```text
set_spouse = "沈清禾"
```

迁移为 dedicated person consumer。

最终：

```text
male player
→ spouse = 沈清禾

female player
→ spouse = 沈知衡
```

`married = true`、choice semantics、honor / renegotiate history、no-marriage semantics 完全一致。

### 11.5 Legacy technical IDs

现有：

```text
shen_qinghe_introduction
shen_qinghe_met
shen_qinghe_shared_matter
shen_qinghe_matter_honor_terms
shen_qinghe_matter_renegotiate
shen_qinghe_marriage_decision
```

v1 不要求同步做 event/history ID migration。

这些可暂时视为 legacy technical identifiers，不再代表 concrete variant identity；人物 identity 只来自 `archetypeId + persisted variantId`。

后续是否迁移为 archetype-neutral IDs 属于独立 compatibility decision。

## 12. 第一实现测试矩阵

第一实现至少验证：

| 维度 | Male player | Female player | 要求 |
| --- | --- | --- | --- |
| selected variant | `female_qinghe` | `male_zhiheng` | 不同 |
| displayName | 沈清禾 | 沈知衡 | 不同 |
| introduction eligibility | 可达 | 可达 | 相同 |
| shared matter | 同一 event | 同一 event | 相同 |
| honor / renegotiate | 相同 choices | 相同 choices | 相同 |
| marriage eligibility | 相同 | 相同 | 相同 |
| canonical marriage state | `married=true` | `married=true` | 相同 |
| spouse | 沈清禾 | 沈知衡 | instance-derived |
| no-marriage semantics | 相同 | 相同 | 相同 |
| save/load identity | 稳定 | 稳定 | 不重新选择 |
| romance / affinity | 无 | 无 | 相同 |
| Parenthood | 不因此扩展 | 不因此扩展 | 相同 boundary |

Architecture regressions 必须证明：

- 不存在 generic `person.attributes`；
- 不存在 Person / NPC registry；
- Snapshot 没有新增 `personInstances` 顶层字段；
- Relationship schema 未改变；
- 没有 generic effect templating；
- 没有 generic `person.*` expression path；
- 没有 `person_sex_is` condition；
- existing male-player 沈清禾行为保持 semantic-preserving。

## 13. Complexity Review / Mandatory BLOCK

以下任一情况出现时，不能由 implementation 自行泛化，默认 verdict 为 `BLOCKED`：

1. 想增加 sex 之外的第二个独立 semantic instantiation dimension；
2. 出现 `sex × 属性A × 属性B` 的组合；
3. 同一 archetype 出现第 2 个核心 sex-gated event；
4. male / female variant 需要不同 Character Anchors；
5. male / female variant 需要不同 Core Concern；
6. 核心 choice structure 或 canonical effects 开始因 sex 大量分叉；
7. 需要复制大段 male / female 专属事件链；
8. Runtime 想增加 generic `person.attributes`、任意 property access 或 generic effect templating；
9. 一个 event 想同时绑定多个 instantiated persons；
10. persistence 想从一个 `variantId` 扩成 Person object / registry；
11. 测试开始需要枚举多维属性笛卡尔积；
12. 需要 generic personality / background / social-class generator；
13. 无法用一句话明确解释为什么两个 variant 仍然是同一个人物 archetype。

触发后的合法下一步只有：

```text
缩回 v1 范围
或
split archetype
或
Human re-design / re-authorization
```

不得以“未来可能需要”为理由提前建设通用能力。

## 14. 明确不做

v1 不做：

- Generic Person Instantiation；
- NPC Generator；
- random name generator；
- random sex for the first sample；
- personality variation；
- family/background variation；
- social-class variation；
- multi-dimensional Person attributes；
- Person registry / world person database；
- generic relationship compatibility engine；
- global orientation model；
- generic Person condition language；
- generic Effect templating；
- multiple instantiated persons per event；
- Mingyue / Saiyin sex migration；
- Parenthood generalization；
- relationship affinity / stage / quality system。

## 15. Authority relationship

Repository authority closure 应包括：

1. 本文进入 `docs/product/`；
2. `docs/product/player-model.md` 增加一句 delegation；
3. `docs/governance/product-decisions.md` 新增 PD-103；
4. `docs/README.md` 增加 accepted product contract 索引并更新 governance index；
5. PD-101 中“人物实例化尚未设计 / 需要重新讨论”的旧表述应最小更新为：Generic Person Instantiation 仍未授权；有限 Sex-Variant Person Archetype 由 PD-103 独立治理。

Authority closure 本身不修改 Runtime、Event Schema、PlayerState、Snapshot、merchant events 或 tests。

## 16. 重新讨论条件

以下情况必须重新进入 Human design：

- 真实内容需要 sex 之外的 semantic variable；
- 需要 sex-gated core event；
- 需要第二个以上核心 sex-specific branch；
- 需要多个 concrete instantiated persons 同时参与一个 event；
- 需要 Person object / registry；
- 需要 random name / appearance system；
- 需要 generic person-aware expression / effect system；
- 需要改变 Save Schema Policy 才能保持 supported saves；
- 需要把 fixed characters 批量迁移为 variable；
- 第一实现证明 `variantId fact + static catalog + closed presentation context` 无法支撑稳定身份与同一事件链。

## 17. 核心结论

Sex-Variant Person Archetype v1 的产品定义为：

> **只有当 sex 变化不改变“这个人物是谁”时，male / female identity variants 才允许共享同一个 Person Archetype；Runtime 只稳定绑定一个明确 authored variant，不生成开放式人物属性。任何向多维 procedural character generation、generic person state 或组合式剧情分叉发展的压力，都是 mandatory design block。**
