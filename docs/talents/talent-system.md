# 天赋系统设计文档

**版本**: 1.0.0  
**创建时间**: 2026-03-14  
**文档类型**: 核心系统设计

---

## 🌟 天赋系统概述

### 设计理念

天赋系统是角色养成的核心机制之一，旨在：
1. **提供差异化体验** - 每个角色都有独特的成长方向
2. **增加重玩价值** - 不同天赋带来不同的游戏策略
3. **平衡发展路径** - 多种天赋支持多种玩法
4. **保持可见性** - 初期天赋可见，后期可用文案包装

### 天赋定义

**天赋** = 出生时确定的成长潜能，影响：
- 属性成长速度（百分比加成）
- 属性上限（突破 100 限制）
- 初始属性值

---

## 📊 天赋分类

### 按类型分类

#### 1. 战斗型天赋 (Combat)
影响战斗属性成长

**代表天赋**:
- 武学奇才 (legendary)
- 天生神力 (rare)
- 经脉通灵 (rare)
- 身轻如燕 (uncommon)
- 铜皮铁骨 (uncommon)
- 资质均衡 (common)

#### 2. 学习型天赋 (Learning)
影响知识和技能学习

**代表天赋**:
- 过目不忘 (rare)
- 悟性过人 (uncommon)

#### 3. 社交型天赋 (Social)
影响社交属性成长

**代表天赋**:
- 八面玲珑 (rare)
- 魅力非凡 (uncommon)
- 商贾之才 (uncommon)

#### 4. 特殊型天赋 (Special)
独特效果，可能有利有弊

**代表天赋**:
- 侠骨仁心 (uncommon)
- 天煞孤星 (rare)
- 紫微帝星 (legendary)
- 体弱多病 (common)

---

### 按稀有度分类

#### Legendary (传说级)
- **数量**: 2 个
- **特点**: 极强的成长加成，影响多个属性
- **代表**: 武学奇才、紫微帝星

#### Rare (稀有)
- **数量**: 6 个
- **特点**: 显著的单项属性加成
- **代表**: 天生神力、经脉通灵、过目不忘

#### Uncommon (优秀)
- **数量**: 6 个
- **特点**: 中等程度的加成
- **代表**: 身轻如燕、八面玲珑、悟性过人

#### Common (普通)
- **数量**: 2 个
- **特点**: 小幅加成或带有负面效果
- **代表**: 资质平平、体弱多病

---

## 🎯 天赋详细数据

### 战斗型天赋

#### 武学奇才 ⭐⭐⭐⭐⭐
```json
{
  "id": "martial_genius",
  "name": "武学奇才",
  "rarity": "legendary",
  "growthBonus": {
    "martialPower": 0.5,      // +50% 功力成长
    "externalSkill": 0.5,     // +50% 外功成长
    "internalSkill": 0.5,     // +50% 内功成长
    "qinggong": 0.5,          // +50% 轻功成长
    "constitution": 0.3       // +30% 体魄成长
  },
  "statCapBonus": {
    "martialPower": 20,       // 功力上限 +20
    "externalSkill": 20,      // 外功上限 +20
    "internalSkill": 20       // 内功上限 +20
  },
  "initialBonus": {
    "martialPower": 10,       // 初始功力 +10
    "externalSkill": 5,       // 初始外功 +5
    "internalSkill": 5        // 初始内功 +5
  }
}
```

**效果说明**:
- 所有战斗属性成长 +50%（体魄 +30%）
- 功力、外功、内功上限突破到 120
- 初始就有较高的武功基础

**适合玩法**: 纯武道路线，追求武力巅峰

---

#### 天生神力 ⭐⭐⭐⭐
```json
{
  "id": "natural_strength",
  "name": "天生神力",
  "rarity": "rare",
  "growthBonus": {
    "externalSkill": 0.4,     // +40% 外功成长
    "constitution": 0.3,      // +30% 体魄成长
    "martialPower": 0.2       // +20% 功力成长
  },
  "statCapBonus": {
    "externalSkill": 15,      // 外功上限 +15
    "constitution": 10        // 体魄上限 +10
  },
  "initialBonus": {
    "externalSkill": 15,      // 初始外功 +15
    "constitution": 10        // 初始体魄 +10
  }
}
```

**效果说明**:
- 外功成长 +40%，体魄成长 +30%
- 偏向物理攻击路线
- 初始外功和体魄较高

**适合玩法**: 外功流，硬刚路线

---

#### 经脉通灵 ⭐⭐⭐⭐
```json
{
  "id": "spiritual_meridians",
  "name": "经脉通灵",
  "rarity": "rare",
  "growthBonus": {
    "internalSkill": 0.4,     // +40% 内功成长
    "martialPower": 0.2,      // +20% 功力成长
    "constitution": 0.1       // +10% 体魄成长
  },
  "statCapBonus": {
    "internalSkill": 15       // 内功上限 +15
  },
  "initialBonus": {
    "internalSkill": 15       // 初始内功 +15
  }
}
```

**效果说明**:
- 内功成长 +40%
- 适合修炼内功心法
- 内力储备更充足

**适合玩法**: 内功流，以气御剑

---

### 社交型天赋

#### 八面玲珑 ⭐⭐⭐⭐
```json
{
  "id": "social_butterfly",
  "name": "八面玲珑",
  "rarity": "rare",
  "growthBonus": {
    "charisma": 0.4,          // +40% 魅力成长
    "connections": 0.4,       // +40% 人脉成长
    "reputation": 0.2         // +20% 声望成长
  },
  "statCapBonus": {
    "charisma": 15,           // 魅力上限 +15
    "connections": 15         // 人脉上限 +15
  },
  "initialBonus": {
    "charisma": 10,           // 初始魅力 +10
    "connections": 8          // 初始人脉 +8
  }
}
```

**效果说明**:
- 魅力和人脉成长 +40%
- 更容易获得 NPC 好感
- 信息来源更广

**适合玩法**: 社交流，人脉流

---

### 特殊型天赋

#### 天煞孤星 ⭐⭐⭐⭐
```json
{
  "id": "lone_wolf",
  "name": "天煞孤星",
  "rarity": "rare",
  "growthBonus": {
    "martialPower": 0.3,      // +30% 功力成长
    "comprehension": 0.2      // +20% 悟性成长
  },
  "penalties": {
    "charisma": -0.2,         // -20% 魅力成长
    "connections": -0.3       // -30% 人脉成长
  },
  "initialBonus": {
    "martialPower": 8,        // 初始功力 +8
    "charisma": -5            // 初始魅力 -5
  }
}
```

**效果说明**:
- **利弊共存**：武道更强，社交更弱
- 适合独行侠玩法
- 牺牲社交换取武力

**适合玩法**: 孤独高手，不喜社交

---

#### 紫微帝星 ⭐⭐⭐⭐⭐
```json
{
  "id": "emperor_star",
  "name": "紫微帝星",
  "rarity": "legendary",
  "growthBonus": {
    "connections": 0.4,       // +40% 人脉成长
    "reputation": 0.3,        // +30% 声望成长
    "charisma": 0.3           // +30% 魅力成长
  },
  "statCapBonus": {
    "reputation": 200         // 声望上限 +200
  },
  "initialBonus": {
    "charisma": 15,           // 初始魅力 +15
    "connections": 10         // 初始人脉 +10
  }
}
```

**效果说明**:
- 领导才能出众
- 容易建立势力
- 声望上限大幅提升

**适合玩法**: 势力流，盟主流

---

## 🔧 天赋实现机制

### 天赋选择流程

```typescript
// 1. 游戏开始时随机分配或玩家选择
function assignTalents(): string[] {
  // 方案 1: 随机分配 1-2 个天赋
  const talentCount = Math.random() > 0.7 ? 2 : 1;
  const talents = [];
  
  for (let i = 0; i < talentCount; i++) {
    const talent = randomTalentByRarity();
    talents.push(talent.id);
  }
  
  return talents;
}

// 方案 2: 玩家从 3 个随机天赋中选择 1 个
function chooseTalent(): string {
  const options = [randomTalent(), randomTalent(), randomTalent()];
  return playerSelect(options);
}
```

### 天赋效果应用

```typescript
// 属性成长计算
function calculateStatGrowth(
  baseGrowth: number,
  statName: string,
  talents: string[]
): number {
  let multiplier = 1.0;
  
  // 累加所有天赋的加成
  talents.forEach(talentId => {
    const talent = getTalentDefinition(talentId);
    if (talent.growthBonus && talent.growthBonus[statName]) {
      multiplier += talent.growthBonus[statName];
    }
    if (talent.penalties && talent.penalties[statName]) {
      multiplier += talent.penalties[statName]; // 负值
    }
  });
  
  return baseGrowth * multiplier;
}

// 属性上限计算
function getStatCap(statName: string, talents: string[]): number {
  let cap = 100; // 基础上限
  
  talents.forEach(talentId => {
    const talent = getTalentDefinition(talentId);
    if (talent.statCapBonus && talent.statCapBonus[statName]) {
      cap += talent.statCapBonus[statName];
    }
  });
  
  return cap;
}

// 初始属性计算
function getInitialStat(statName: string, talents: string[]): number {
  let bonus = 0;
  
  talents.forEach(talentId => {
    const talent = getTalentDefinition(talentId);
    if (talent.initialBonus && talent.initialBonus[statName]) {
      bonus += talent.initialBonus[statName];
    }
  });
  
  return bonus;
}
```

---

## 📈 天赋平衡性

### 成长加成对比

| 稀有度 | 主属性成长 | 次属性成长 | 上限提升 | 初始加成 |
|--------|-----------|-----------|---------|---------|
| Legendary | +50% | +30% | +20 | +10~15 |
| Rare | +40% | +20% | +15 | +10~15 |
| Uncommon | +30% | +10% | +10 | +8~12 |
| Common | +5~15% | - | - | 0~5 |

### 平衡原则

1. **稀有度与强度正相关** - 越稀有的天赋越强
2. **利弊共存** - 强力天赋可能有负面效果
3. **多样化** - 不同天赋支持不同玩法
4. **可替代性** - 没有绝对最优解

---

## 🎮 天赋使用策略

### 天赋与玩法搭配

#### 武道巅峰流
**推荐天赋**: 武学奇才、天生神力、经脉通灵
**核心属性**: 功力、外功、内功
**目标**: 功力 100+，成为武林第一

#### 社交达人流
**推荐天赋**: 八面玲珑、魅力非凡、紫微帝星
**核心属性**: 魅力、人脉、声望
**目标**: 建立庞大势力网

#### 学者智囊流
**推荐天赋**: 过目不忘、悟性过人
**核心属性**: 学识、悟性
**目标**: 以智取胜，自创武学

#### 孤独高手流
**推荐天赋**: 天煞孤星、武学奇才
**核心属性**: 功力、悟性
**目标**: 个人武力极致

---

## 🎨 文案包装（后期优化）

### 当前状态：可见
```
你的天赋：
- 武学奇才：战斗属性成长 +50%
- 天生神力：外功成长 +40%
```

### 后期优化：隐藏 + 文案
```
出生时：
"你生来就展现出非凡的武学天赋，父母为你取名为'天才'。"
(实际效果：武学奇才天赋)

成长中：
"你的力量远超同龄人，一拳就能打断大树。"
(实际效果：天生神力天赋生效)

NPC 对话：
"少侠天赋异禀，将来必成大器！"
(暗示玩家有特殊天赋)
```

---

## 📝 开发指南

### 在事件中使用天赋

```json
{
  "id": "talent_discovery",
  "conditions": [
    {
      "type": "expression",
      "expression": "talents.includes('martial_genius') && age >= 15"
    }
  ],
  "content": {
    "title": "武学奇才",
    "text": "你展现出惊人的武学天赋，一招一式都能迅速领悟。"
  },
  "effects": [
    {
      "type": "stat_modify",
      "target": "martialPower",
      "value": 5,
      "operator": "add"
    }
  ]
}
```

### 天赋发现事件

```typescript
// 通过行为触发天赋认知
if (player.trainCount > 10 && player.hasTalent('martial_genius')) {
  triggerEvent('talent_martial_genius_discovery');
}
```

---

## 🎯 后续扩展

### 可添加的天赋

**战斗类**:
- 剑道天才（剑法专精）
- 刀道至尊（刀法专精）
- 暗器高手（暗器专精）

**社交类**:
- 谈判专家（交易优惠）
- 情报大王（信息获取）

**特殊类**:
- 穿越者（知晓部分剧情）
- 重生者（第二次机会）

### 天赋升级系统

```typescript
// 天赋可以随着使用而"觉醒"或"升级"
if (talentUsage > threshold) {
  talentLevel++;
  // 解锁更强的效果
}
```

---

**文档状态**: ✅ 完成  
**天赋数量**: 16 个  
**下次更新**: 根据测试反馈调整
