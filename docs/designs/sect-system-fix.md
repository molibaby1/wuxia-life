# 门派系统逻辑问题分析

## 问题描述

用户反馈：
> "幽影门是个什么门派？为什么我接受他的邀请后，后面还要我选择要不要加入名门正派或者魔教，似乎这 2 个路线和我们选的门派没关系？"

## 当前问题分析

### 问题 1：门派系统混乱

**当前设定**：
- **幽影门**：魔教邪派（来自 demonic.json）
- **少林/武当/峨眉**：名门正派（来自 general.json 的 sect_choice）
- **丐帮/边地/佛门**：其他路线（来自 sect-*.json）

**问题**：
1. 幽影门是**具体门派**，但被当作**魔道路线**使用
2. sect_choice 事件让玩家选择少林/武当/峨眉，但这只是**名门正派**的几个选项
3. 玩家可能先触发幽影门事件（魔教），后来又触发 sect_choice（正派），导致逻辑矛盾

### 问题 2：缺少统一的门派系统

**当前代码**：
```json
// general.json - sect_choice 事件
"conditions": [
  {
    "expression": "!flags.has(\"route_beggars\") && !flags.has(\"route_border\") && ... && !flags.has(\"sect_shaolin\")"
  }
]
```

**问题**：
- 检查了很多 flags，但没有检查是否已经加入幽影门
- 没有区分"门派"和"路线"的概念
- 没有阵营（orthodox/demon）的统一管理

### 问题 3：事件触发顺序混乱

**可能的触发顺序**：
```
12 岁：触发幽影门邀请（因为修炼邪功）
  ↓ 选择加入幽影门（设置 sect_demonic = true）
14 岁：触发 sect_choice 事件
  ↓ 又让玩家选择少林/武当/峨眉
  ↓ 逻辑矛盾：已经加入魔教的人怎么能拜入正派？
```

## 解决方案设计

### 方案 1：建立统一的门派系统

**核心思路**：将所有门派纳入统一框架

```typescript
// 门派数据结构
interface Sect {
  name: string;           // 门派名称
  faction: 'orthodox' | 'demon' | 'neutral';  // 阵营
  type: 'martial' | 'weapon' | 'internal' | 'special';  // 类型
  location: string;       // 地理位置
  description: string;    // 描述
}

// 门派列表
const SECTS = {
  // 正道
  shaolin: { name: '少林', faction: 'orthodox', type: 'martial' },
  wudang: { name: '武当', faction: 'orthodox', type: 'internal' },
  emei: { name: '峨眉', faction: 'orthodox', type: 'weapon' },
  
  // 魔道
  youying: { name: '幽影门', faction: 'demon', type: 'special' },
  heavenly_demon: { name: '天魔教', faction: 'demon', type: 'internal' },
  
  // 中立
  beggars: { name: '丐帮', faction: 'neutral', type: 'special' },
  ...
};
```

### 方案 2：重构事件触发逻辑

**步骤 1：14 岁的门派选择事件**

```json
{
  "id": "sect_choice",
  "requirements": {
    "notFlag": ["has_sect"]  // 还没有门派
  },
  "choices": [
    {
      "id": "join_orthodox",
      "text": "加入名门正派",
      "effects": [
        { "type": "set_faction", "value": "orthodox" },
        { "type": "show_sub_menu", "menu": "orthodox_sects" }
      ]
    },
    {
      "id": "join_demon",
      "text": "加入魔教（需要侠义 <= 0）",
      "condition": { "chivalry": { "max": 0 } },
      "effects": [
        { "type": "set_faction", "value": "demon" },
        { "type": "show_sub_menu", "menu": "demon_sects" }
      ]
    },
    {
      "id": "no_sect",
      "text": "不加入门派，自由发展",
      "effects": [
        { "type": "flag_set", "target": "free_jianghu", "value": true }
      ]
    }
  ]
}
```

**步骤 2：子菜单选择具体门派**

```json
// 正道子菜单
{
  "id": "orthodox_sects",
  "choices": [
    {
      "id": "join_shaolin",
      "text": "少林派（刚猛外功）",
      "requirements": { "externalSkill": { "min": 15 } },
      "effects": [
        { "type": "flag_set", "target": "sect_shaolin", "value": true },
        { "type": "flag_set", "target": "has_sect", "value": true }
      ]
    },
    {
      "id": "join_wudang",
      "text": "武当派（柔韧内功）",
      "requirements": { "internalSkill": { "min": 15 } },
      "effects": [...]
    }
  ]
}

// 魔道子菜单
{
  "id": "demon_sects",
  "choices": [
    {
      "id": "join_youying",
      "text": "幽影门（邪功暗杀）",
      "effects": [
        { "type": "flag_set", "target": "sect_youying", "value": true },
        { "type": "flag_set", "target": "has_sect", "value": true }
      ]
    },
    {
      "id": "join_heavenly_demon",
      "text": "天魔教（魔功内力）",
      "effects": [...]
    }
  ]
}
```

### 方案 3：添加阵营检查

**修改 sect_choice 事件条件**：

```json
{
  "id": "sect_choice",
  "conditions": [
    {
      "expression": "!flags.has(\"has_sect\")"  // 还没有门派
    },
    {
      "expression": "player.faction !== 'demon'"  // 不是魔道阵营
    }
  ]
}
```

**修改幽影门事件条件**：

```json
{
  "id": "demonic_invite",
  "conditions": [
    {
      "expression": "!flags.has(\"has_sect\")"  // 还没有门派
    },
    {
      "expression": "player.chivalry <= 0"  // 侠义值为负
    }
  ],
  "effects": [
    { "type": "set_faction", "value": "demon" },
    { "type": "flag_set", "target": "sect_youying", "value": true },
    { "type": "flag_set", "target": "has_sect", "value": true }
  ]
}
```

## 实施步骤

### 第一阶段：添加阵营系统（已完成）
- ✅ LifePathManager 已实现
- ✅ FactionManager 已实现
- ✅ 身份兼容性系统已实现

### 第二阶段：统一门派 flags（待实施）
1. 定义统一的门派 flags
2. 添加 `has_sect` 总 flag
3. 修改所有门派相关事件

### 第三阶段：重构 sect_choice 事件（待实施）
1. 添加阵营检查
2. 添加子菜单系统
3. 添加 requirements

### 第四阶段：修改幽影门事件（待实施）
1. 添加阵营设置
2. 添加与 sect_choice 的互斥检查
3. 添加前置条件

## 预期效果

### 重构前（混乱）
```
12 岁：幽影门邀请 → 加入
14 岁：sect_choice → 又让选少林/武当 ← 矛盾！
20 岁：可能又触发其他门派事件
```

### 重构后（清晰）
```
0-10 岁：成长阶段
  ↓
12 岁：如果侠义<=0，可能触发幽影门邀请
  ↓ 选择加入 → 设置 has_sect=true, faction=demon
  ↓ 选择拒绝 → 继续等待
  ↓
14 岁：sect_choice 事件
  ↓ 检查 has_sect，如果已有门派则跳过
  ↓ 如果没有门派，让玩家选择阵营和具体门派
  ↓
20 岁+：根据门派触发相应事件线
```

## 幽影门设定

**门派信息**：
- **名称**：幽影门（Shadow Sect）
- **阵营**：魔道（demon）
- **特点**：邪功、暗杀、吞噬内力
- **位置**：西南边陲
- **掌门**：幽冥教主
- **镇派绝学**：《幽影魔功》

**加入条件**：
- 侠义值 <= 0（心术不正）
- 或者主动修炼邪功
- 或者被感知到"心魔"

**门派事件线**：
1. 幽影门邀请（12-16 岁）
2. 血祭试炼（入门）
3. 吞噬内力（修炼）
4. 魔道内斗（派系斗争）
5. 成为护法（晋升）
6. 夺位之夜（篡位）
7. 魔道至尊（结局）

## 总结

**核心问题**：缺少统一的门派和阵营管理系统

**解决方案**：
1. 使用 LifePathManager 统一管理阵营
2. 添加 `has_sect` flag 标记是否已有门派
3. 重构 sect_choice 事件，添加阵营检查
4. 修改幽影门事件，设置正确的阵营和门派 flag

这样才能确保：
- ✅ 玩家只能加入一个门派
- ✅ 正邪不两立（加入魔教后不能拜入正派）
- ✅ 事件触发逻辑清晰
- ✅ 叙事连贯一致
