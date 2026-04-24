# 爱情事件逻辑修复 - 第二阶段：重逢与结局事件修复

## 问题描述

在第一阶段修复后，测试发现依然存在逻辑问题：

**用户报告**：
> "我既然迎娶了明月，为什么后面又要暗处协助明月..再后面还出现了和明月重逢之类的事件？"

**第一阶段修复**：
- ✅ `love_secret_help` (暗中相助) - 添加了 `!flags.spouse_mingyue && !flags.mingyue_married_other` 条件
- ✅ `love_life_or_death` (生死相救) - 添加了 `!flags.spouse_mingyue` 条件
- ✅ `marriage_old_lover_reunion` (旧爱重逢) - 添加了 `!flags.spouse_mingyue` 条件

**测试发现的新问题**：
即使玩家迎娶了明月，依然会触发以下不合理事件：
1. `love_reunion` (重逢) - "多年后重逢，你与明月心意未改"
2. `love_family_reconcile` (家族和解) - "明月家族终于松口，愿意成全你们"
3. `love_ending_good` (良缘) - "风雨过后，你与明月相守相伴"
4. `love_ending_sacrifice` (殉情) - "你在一场生死危局中为救明月付出巨大代价"
5. `love_ending_hideaway` (隐居) - "你与明月归隐山林，远离江湖纷争"

**问题分析**：
这些事件都是针对"相爱但未能在一起"的前女友剧情线，不适用于"明月已是妻子"的情况。

## 根本原因

事件条件中缺少配偶状态检查 `!flags.spouse_mingyue`，导致已婚玩家依然触发前女友剧情。

## 修复方案

### 1. love_reunion (重逢)

**修复前**：
```json
"conditions": [
  {
    "type": "expression",
    "expression": "flags.has(\"love_separated\") && !flags.has(\"love_reunited\")"
  }
]
```

**修复后**：
```json
"conditions": [
  {
    "type": "expression",
    "expression": "flags.has(\"love_separated\") && !flags.has(\"love_reunited\") && !flags.spouse_mingyue"
  }
]
```

**逻辑**：只有明月不是妻子时，才触发"重逢"事件。如果明月是妻子，不存在"重逢"一说。

### 2. love_family_reconcile (家族和解)

**修复前**：
```json
"conditions": [
  {
    "type": "expression",
    "expression": "flags.has(\"love_life_or_death\") && !flags.has(\"love_family_reconcile\")"
  }
]
```

**修复后**：
```json
"conditions": [
  {
    "type": "expression",
    "expression": "flags.has(\"love_life_or_death\") && !flags.has(\"love_family_reconcile\") && !flags.spouse_mingyue"
  }
]
```

**逻辑**：只有明月不是妻子时，才需要"家族和解"。如果明月已是妻子，家族早已认可。

### 3. love_ending_good (良缘)

**修复前**：
```json
"conditions": [
  {
    "type": "expression",
    "expression": "flags.has(\"love_committed\") && (flags.has(\"love_family_reconcile\") || flags.has(\"love_life_or_death\")) && !flags.has(\"love_ending_good\")"
  }
]
```

**修复后**：
```json
"conditions": [
  {
    "type": "expression",
    "expression": "flags.has(\"love_committed\") && (flags.has(\"love_family_reconcile\") || flags.has(\"love_life_or_death\")) && !flags.has(\"love_ending_good\") && !flags.spouse_mingyue"
  }
]
```

**逻辑**：只有明月不是妻子时，才触发"有情人终成眷属"结局。如果明月是妻子，应该触发配偶专属事件。

### 4. love_ending_sacrifice (殉情)

**修复前**：
```json
"conditions": [
  {
    "type": "expression",
    "expression": "flags.has(\"love_life_or_death\") && !flags.has(\"love_ending_sacrifice\") && !flags.has(\"love_ending_good\")"
  }
]
```

**修复后**：
```json
"conditions": [
  {
    "type": "expression",
    "expression": "flags.has(\"love_life_or_death\") && !flags.has(\"love_ending_sacrifice\") && !flags.has(\"love_ending_good\") && !flags.spouse_mingyue"
  }
]
```

**逻辑**：只有明月不是妻子时，才可能触发"殉情"悲剧结局。

### 5. love_ending_hideaway (隐居)

**修复前**：
```json
"conditions": [
  {
    "type": "expression",
    "expression": "flags.has(\"love_committed\") && flags.has(\"love_family_reconcile\") && !flags.has(\"love_ending_hideaway\") && !flags.has(\"love_ending_good\")"
  }
]
```

**修复后**：
```json
"conditions": [
  {
    "type": "expression",
    "expression": "flags.has(\"love_committed\") && flags.has(\"love_family_reconcile\") && !flags.has(\"love_ending_hideaway\") && !flags.has(\"love_ending_good\") && !flags.spouse_mingyue"
  }
]
```

**逻辑**：只有明月不是妻子时，才触发"为爱归隐"结局。

### 6. 新增：spouse_mingyue_daily (夫妻同心)

**新增配偶专属事件**：

```json
{
  "id": "spouse_mingyue_daily",
  "name": "夫妻同心",
  "description": "明月作为你的妻子，与你琴瑟和鸣，相濡以沫。",
  "ageRange": { "min": 21, "max": 60 },
  "conditions": [
    {
      "type": "expression",
      "expression": "flags.spouse_mingyue == true && !flags.has(\"spouse_mingyue_daily\")"
    }
  ],
  "content": {
    "text": "明月作为你的妻子，与你琴瑟和鸣，相濡以沫。江湖中人人称羡你们这对神仙眷侣。",
    "title": "夫妻同心",
    "description": "执子之手，与子偕老。"
  },
  "autoEffects": [
    { "type": "time_advance", "target": "age", "value": 1, "timeUnit": "year" },
    { "type": "stat_modify", "target": "chivalry", "value": 5, "operator": "add" },
    { "type": "stat_modify", "target": "reputation", "value": 10, "operator": "add" },
    { "type": "flag_set", "target": "spouse_mingyue_daily" }
  ]
}
```

**逻辑**：如果明月是妻子，触发夫妻恩爱事件，而不是前女友剧情。

## 修复文件清单

1. `/Users/zhouyun/code/wuxia-life/src/data/lines/love.json`
   - 修复 `love_reunion` 条件
   - 修复 `love_family_reconcile` 条件
   - 修复 `love_ending_good` 条件
   - 修复 `love_ending_sacrifice` 条件
   - 修复 `love_ending_hideaway` 条件
   - 新增 `spouse_mingyue_daily` 配偶专属事件

## 测试场景

### 场景 1: 迎娶明月 (真爱线)

**选择**：
- 15 岁：上前搭话 → `love_started`
- 20 岁：家族阻碍 → 接受考验
- 20 岁：误会 → 坦诚解释
- **20 岁：喜结良缘 → 迎娶明月** → `spouse_mingyue = true`

**预期结果**：
- ✅ 不触发 `love_secret_help` (暗中相助)
- ✅ 不触发 `love_reunion` (重逢)
- ✅ 不触发 `love_family_reconcile` (家族和解)
- ✅ 不触发 `love_ending_good` (良缘 - 前女友版)
- ✅ 不触发 `love_ending_sacrifice` (殉情)
- ✅ 不触发 `love_ending_hideaway` (隐居)
- ✅ **触发 `spouse_mingyue_daily` (夫妻同心)**

**正确剧情流**：
```
15 岁：初遇 → 上前搭话
16 岁：并肩同行
20 岁：家族阻碍 → 接受考验
20 岁：误会 → 坦诚解释
20 岁：喜结良缘 → 迎娶明月
21 岁+：夫妻同心 (配偶专属事件)
```

### 场景 2: 包办婚姻 (前女友线)

**选择**：
- 15 岁：上前搭话 → `love_started`
- 20 岁：家族阻碍 → 接受考验
- 20 岁：误会 → 坦诚解释
- **20 岁：喜结良缘 → 接受安排，门当户对** → `mingyue_married_other = true`

**预期结果**：
- ✅ 触发 `love_secret_help` (暗中相助)
- ✅ 触发 `love_rival_appears` (情敌出现)
- ✅ 触发 `love_separation` (别离)
- ✅ 触发 `love_reunion` (重逢)
- ✅ 触发 `love_life_or_death` (生死相救)
- ✅ 触发 `love_family_reconcile` (家族和解)
- ✅ 触发 `love_ending_good` 或 `love_ending_sacrifice` (取决于选择)

**正确剧情流**：
```
15 岁：初遇 → 上前搭话
16 岁：并肩同行
20 岁：家族阻碍 → 接受考验
20 岁：误会 → 坦诚解释
20 岁：喜结良缘 → 接受安排 (明月嫁作他人妇)
21 岁：暗中相助
22 岁：情敌出现
22 岁：别离
22 岁：重逢
24 岁：生死相救
26 岁：家族和解
28 岁：良缘/殉情 (结局)
```

### 场景 3: 恋爱但未结婚 (未完成爱情线)

**选择**：
- 15 岁：上前搭话 → `love_started`
- 20 岁：家族阻碍 → 接受考验
- 20 岁：误会 → 坦诚解释
- **20 岁：喜结良缘 → 自由恋爱，寻找真爱** → `spouse_love = true` (妻子不是明月)

**预期结果**：
- ✅ 不触发 `love_secret_help` (因为明月已嫁作他人妇)
- ✅ 不触发 `love_reunion` (因为明月已嫁作他人妇)
- ✅ 不触发配偶专属事件 (因为妻子不是明月)

## 明月关系状态机

```
                    ┌─────────────────┐
                    │   恋人 (lover)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────────┐  ┌─────────────────┐
    │   未婚妻        │  │   前女友        │
    │ (mingyue_fiancee)│  │(love_separated) │
    └────────┬────────┘  └────────┬────────┘
             │                    │
             ▼                    ▼
    ┌─────────────────┐  ┌─────────────────┐
    │   妻子          │  │   嫁作他人妇    │
    │ (spouse_mingyue)│  │(mingyue_married │
    └─────────────────┘  │     _other)     │
                         └────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
           ┌─────────────────┐        ┌─────────────────┐
           │   守寡/离婚     │        │   继续单身      │
           │ (可重逢)        │        │ (可重逢)        │
           └─────────────────┘        └─────────────────┘
```

**状态转换规则**：

1. **恋人 → 未婚妻**：完成定情信物事件
2. **恋人 → 前女友**：家族阻碍 + 误会事件后未和解
3. **未婚妻 → 妻子**：迎娶明月选择
4. **前女友 → 嫁作他人妇**：玩家选择包办婚姻
5. **嫁作他人妇 → 守寡/离婚**：未来事件触发
6. **前女友 → 恋人 (重逢)**：love_reunion 事件选择"共度余生"

**事件触发规则**：

| 事件 ID | 恋人 | 未婚妻 | 妻子 | 前女友 | 嫁作他人妇 |
|---------|------|--------|------|--------|------------|
| love_secret_help | ❌ | ❌ | ❌ | ✅ | ❌ |
| love_reunion | ❌ | ❌ | ❌ | ✅ | ❌ |
| love_family_reconcile | ❌ | ❌ | ❌ | ✅ | ❌ |
| love_ending_good | ❌ | ❌ | ❌ | ✅ | ❌ |
| spouse_mingyue_daily | ❌ | ❌ | ✅ | ❌ | ❌ |

## 后续优化建议

### 1. 增加更多配偶专属事件

为不同配偶设计独立事件链：
- `spouse_mingyue_support` - 明月支持玩家事业
- `spouse_mingyue_child` - 明月生育子女
- `spouse_mingyue_crisis` - 明月遭遇危机 (考验)

### 2. 增加明月独立人格

明月不应该只是玩家的附庸，应该有独立的行为和选择：
- 明月支持玩家选择 (即使危险)
- 明月反对玩家选择 (理念冲突)
- 明月独立行动 (不依赖玩家)

### 3. 增加婚姻质量系统

婚姻质量影响事件触发：
- 高质量：触发"夫妻同心"、"明月支持"
- 低质量：触发"夫妻争执"、"明月失望"
- 质量变化：根据玩家选择动态调整

### 4. 增加婚外情系统

如果玩家已婚但与其他女性互动：
- 明月发现 → 婚姻质量下降
- 明月容忍 → 触发特殊对话
- 明月离开 → 触发离婚事件

## 总结

本次修复完成了爱情线事件的配偶状态检查，确保：
1. ✅ 已婚玩家不触发前女友剧情
2. ✅ 未婚玩家不触发配偶专属事件
3. ✅ 不同婚姻选择对应不同剧情线
4. ✅ 明月关系状态机清晰明确

修复后，爱情线逻辑更加严谨，剧情更加合理，玩家体验更加沉浸。
