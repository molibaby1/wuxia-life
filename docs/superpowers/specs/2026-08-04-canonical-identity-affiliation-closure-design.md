# Canonical Identity and Affiliation Closure Design

> 状态：产品语义已由用户批准。
> 设计日期：2026-08-04
> 权威依据：`docs/product/player-model.md`、`docs/governance/product-decisions.md#PD-041`

## 1. 问题

当前仓库同时存在：

```text
state.identity
lifePath.primaryIdentity
player.sect
flags.current_sect
player.title
IdentityInfo.title
ending name
route/profile identity labels
```

这些来源分别表达组织归属、职业方向、外界评价、人生路线和终局分类，却共同使用“身份”命名。结果是：

- `state.identity.primary` 由首次达到阈值的顺序决定；
- `lifePath.primaryIdentity` 长期为 `none`；
- 正式门派事件写 `current_sect`，而 UI/API 的 canonical 字段是 `player.sect`；
- EndingScreen 把 ending name 当作 `player.title`；
- 人生摘要只读取 `state.identity`，因而长期显示“暂无身份”；
- route、家庭状态和组织归属被 UI heuristic 混成身份标签。

## 2. 设计目标

建立以下单向语义：

```text
组织归属  → player.affiliation
正式称号  → player.title
人生方向  → 从现有 facts / flags / stats 确定性派生
重要经历  → Life Memory
最终归纳  → state.ending
```

取消通用 Life Identity，不再寻找一个 primary identity。

## 3. Canonical 数据模型

```ts
export type AffiliationId =
  | 'shaolin'
  | 'wudang'
  | 'beggars'
  | 'border'
  | 'shadow_sect';

export interface PlayerState {
  affiliation: AffiliationId | null;
  title: string | null;
}
```

删除：

```ts
PlayerState.sect
GameState.identity
IdentityInfo
IdentityCriteria
IdentityEffects
PlayerIdentity
LifePath.primaryIdentity
```

`LifePath` 的 faction、achievements、relationships 和 commitments 不因本阶段自动删除。

## 4. Affiliation Catalog

新增一个小型静态 catalog，唯一职责是稳定 ID 到玩家可见名称及组织分类的映射。

```ts
export interface AffiliationDefinition {
  id: AffiliationId;
  displayName: string;
  organizationClass: 'orthodox' | 'unconventional' | 'neutral';
}
```

当前条目：

| ID | 展示名 | 组织分类 |
| --- | --- | --- |
| `shaolin` | 少林寺 | orthodox |
| `wudang` | 武当派 | orthodox |
| `beggars` | 丐帮 | neutral |
| `border` | 边关守军 | neutral |
| `shadow_sect` | 幽影门 | unconventional |

`organizationClass` 是组织自身分类，不等于玩家当前的 `lifePath.faction` 或 `sect_faction`。

## 5. Event Contract

增加两个明确 effect：

```ts
{ type: 'affiliation_set', value: AffiliationId }
{ type: 'affiliation_clear' }
```

规则：

- `affiliation_set` 直接替换当前 Affiliation；
- 相同 ID 重复设置幂等；
- `affiliation_clear` 在已有或空值状态下均幂等；
- 不写 `current_sect`；
- 不自动写 route、sect_faction、title 或 lifePath.faction；
- 事件需要这些机械信号时继续显式写入原有 flags。

事件条件可读取 `player.affiliation`。不新增通用 organization query engine。

## 6. Generic Identity Removal

删除 `IdentitySystem` 的自动判定、记录、bonus、event 和 ending helper。

当前 production 中 Identity bonus helpers 没有正式调用者；相关测试保护的是退出模型，应删除或改为 canonical removal guard。

正式加载事件中的 identity 门槛迁移规则：

- 使用事件真正依赖的属性、flags、经历或成就；
- 可产生身份的原 criteria 作为保持既有可达性的基线；
- 不保留 first-primary 的历史优先级；
- 无 producer 的 identity 值按当前 runtime 的“永远不成立”处理；
- 若 required 集合因此为空，停止并报告；
- deferred identity 文件保持 deferred；
- 文件名、category 与 tag 中的 `identity` 可保留为内容分类。

## 7. Persistence

Snapshot：

```text
3.12.0 → 3.13.0
```

`3.13.0`：

- 要求 `player.affiliation`；
- 拒绝 `player.sect`；
- 拒绝顶层 `state.identity`；
- `lifePath` 若存在，拒绝 `primaryIdentity`；
- `title` 继续为 nullable string；
- 拒绝所有旧 schema；
- 不迁移或清洗旧存档。

Life Memory：

```text
2.0.0 → 3.0.0
```

删除：

```ts
identity?: { primary: string; all: string[] }
```

Life Memory 继续是 derived-only，不新增 affiliation 冗余状态；API 的当前玩家 DTO 直接暴露 Affiliation 与 Title。

## 8. Player-Facing Presentation

### Main Screen

```text
目标
所属
经历
风险
倾向
```

“所属”：

- 有 Affiliation：显示 catalog 名称；
- 无 Affiliation：显示“无固定所属”。

“倾向”继续使用现有确定性成长/路线摘要，不改称身份。

### Attribute Panel

分开展示：

- 所属；
- 正式称号；
- 现有机械状态或路线提示。

删除将婚姻、父母、退隐、正道、绿林等混成 `playerIdentities` 的 heuristic。

### Ending Screen

- 页面主标题和墓志铭使用 ending name；
- `player.title` 只在非空时作为“称号”单独展示；
- `player.affiliation` 只在非空时作为“所属”展示；
- 删除“身份摘要 / 暂无身份”；
- 分享文本使用 ending name，不使用伪造 title；
- API 不再把 ending name 写入临时 `title`。

## 9. Title 边界

本阶段不增加 title effect，也不为现有事件补称号。

保留字段是为了明确语义和已有持久化边界，不代表当前必须产生称号。

未来只有具体产品内容提出正式称号授予需求时，才增加专用 effect 和事件。

## 10. 非目标

- Occupation 模型；
- 多身份；
- Affiliation history；
- 多组织并存；
- route lifecycle；
- EndingSystem 重写；
- deferred identity 内容接线；
- 全仓字符串 `identity` 清零；
- 历史报告和分析 taxonomy 改名。
