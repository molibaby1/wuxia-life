# 属性系统改进方案 - 简化版

## 核心思路

✅ **轻量级设计**: 不添加繁琐的日常开销系统
✅ **事件驱动**: 通过事件触发和选项消耗来体现属性价值
✅ **门槛机制**: 特定事件需要属性达到一定值才能触发
✅ **选择代价**: 高级选项需要消耗金钱/侠义等资源

---

## 高优先级实施方案

### 一、侠义值系统（简化版）

#### 1. 侠义等级与 NPC 态度

```typescript
// 5 级侠义等级
const ChivalryLevel = {
  VILLAIN: -50,      // 恶人 - 正道敌视，魔道欢迎
  ANTIHERO: -20,     // 亦正亦邪
  NORMAL: 20,        // 普通人 - 中立
  HERO: 60,          // 侠士 - 正道友好
  GRANDHERO: 90,     // 大侠 - 万人敬仰
}
```

#### 2. 侠义值的实际应用

**A. 事件触发门槛**
```typescript
// 高侠义专属事件
{
  id: "righteous_alliance_invite",
  condition: (state) => state.chivalry >= 80,
  text: "正道联盟注意到你的侠义之名，邀请你加入...",
}

// 低侠义专属事件
{
  id: "demonic_recruitment",
  condition: (state) => state.chivalry <= -50,
  text: "魔教使者找到你，欣赏你的行事风格...",
}

// 侠义值影响事件分支
{
  id: "villager_help_request",
  choices: [
    {
      text: "无偿帮助（侠义 +10）",
      condition: (state) => state.chivalry >= 0,
      effect: { chivalry: +10, reputation: +5 }
    },
    {
      text: "收费帮助（金钱 +50，侠义 -5）",
      effect: { money: +50, chivalry: -5 }
    },
    {
      text: "趁火打劫（金钱 +30，侠义 -20）",
      condition: (state) => state.chivalry <= -30,
      effect: { money: +30, chivalry: -20 }
    }
  ]
}
```

**B. 商店价格折扣**
```typescript
// 简单的价格乘数
function getPriceMultiplier(chivalry):
  if chivalry >= 90: return 0.7    // 7 折（大侠）
  if chivalry >= 60: return 0.85   // 85 折（侠士）
  if chivalry >= 0:  return 1.0    // 原价（普通人）
  if chivalry >= -20: return 1.2   // 加价 20%（亦正亦邪）
  return 1.5                        // 加价 50%（恶人）
```

**C. 特殊武功学习**
```typescript
// 正道绝学（需要高侠义）
{
  id: "learn_taiji_sword",
  condition: (state) => state.chivalry >= 80 && state.martialPower >= 100,
  text: "武当掌门见你侠义双全，愿传授太极剑法",
  effect: { martialPower: +30, externalSkill: +25 }
}

// 邪派武功（需要低侠义）
{
  id: "learn_suck_internal",
  condition: (state) => state.chivalry <= -50 && state.martialPower >= 90,
  text: "魔教长老见你心性狠辣，传授吸星大法",
  effect: { martialPower: +35, internalSkill: +20, chivalry: -10 }
}
```

---

### 二、金钱系统（简化版）

#### 1. 金钱获取（保持现有）

```typescript
// 现有获取方式保持不变
- 事件奖励：完成事件获得金钱
- 打工：部分事件提供赚钱选项
- 战斗：击败敌人获得战利品
```

#### 2. 金钱消耗 - 事件门槛模式

**A. 事件触发需要金钱**
```typescript
// 需要金钱门槛才能触发的事件
{
  id: "treasure_auction",
  condition: (state) => state.money >= 500,
  text: "拍卖会即将举行，据说有绝世秘籍拍卖...",
  // 入场需要 500 两
}

{
  id: "sect_donation_event",
  condition: (state) => state.money >= 200,
  text: "门派资金紧张，询问你是否愿意捐赠...",
  // 需要 200 两才能触发捐赠选项
}

{
  id: "black_market_access",
  condition: (state) => state.money >= 1000,
  text: "神秘商人只接待有钱人，你获得了进入资格",
  // 需要 1000 两才能进入黑市
}
```

**B. 事件选项需要消耗金钱**
```typescript
{
  id: "learn_expensive_manual",
  text: "你发现一本绝世秘籍，但价格不菲",
  choices: [
    {
      text: "购买秘籍（金钱 -500，武力 +20）",
      cost: { money: 500 },
      condition: (state) => state.money >= 500,
      effect: { martialPower: +20 }
    },
    {
      text: "放弃购买",
      effect: {}
    },
    {
      text: "强行抢夺（金钱 +100，侠义 -30，声望 -50）",
      condition: (state) => state.chivalry <= -20,
      effect: { money: +100, chivalry: -30, reputation: -50 }
    }
  ]
}

{
  id: "heal_injury",
  text: "你身受重伤，需要治疗",
  choices: [
    {
      text: "购买名贵药材（金钱 -100，健康完全恢复）",
      cost: { money: 100 },
      condition: (state) => state.money >= 100,
      effect: { health: 100, constitution: +5 }
    },
    {
      text: "普通治疗（金钱 -20，恢复部分健康）",
      cost: { money: 20 },
      condition: (state) => state.money >= 20,
      effect: { health: +50 }
    },
    {
      text: "硬扛（健康 -20，体质 -5）",
      effect: { health: -20, constitution: -5 }
    }
  ]
}

{
  id: "build_reputation",
  text: "你想在江湖上建立名声",
  choices: [
    {
      text: "大摆宴席（金钱 -200，声望 +30）",
      cost: { money: 200 },
      condition: (state) => state.money >= 200,
      effect: { reputation: +30, charisma: +5 }
    },
    {
      text: "小聚亲友（金钱 -50，声望 +10）",
      cost: { money: 50 },
      condition: (state) => state.money >= 50,
      effect: { reputation: +10 }
    },
    {
      text: "默默修行",
      effect: { martialPower: +5 }
    }
  ]
}
```

**C. 金钱影响事件走向**
```typescript
{
  id: "deal_with_bandits",
  text: "你遇到一伙山贼拦路",
  choices: [
    {
      text: "破财消灾（金钱 -100，无战斗）",
      cost: { money: 100 },
      condition: (state) => state.money >= 100,
      effect: { money: -100, reputation: -5 }
    },
    {
      text: "武力解决（需武力≥60）",
      condition: (state) => state.martialPower >= 60,
      effect: { martialPower: +8, money: +50 } // 战利品
    },
    {
      text: "逃跑",
      effect: { qinggong: +3 }
    }
  ]
}
```

#### 3. 金钱购买特殊服务

```typescript
// 医馆
{
  id: "medical_service",
  text: "医馆大夫询问你需要什么服务",
  choices: [
    {
      text: "全面调理（金钱 -150，全属性 +5）",
      cost: { money: 150 },
      effect: { 
        martialPower: +5,
        internalSkill: +5,
        externalSkill: +5,
        constitution: +5
      }
    },
    {
      text: "治疗内伤（金钱 -80，内功 +10）",
      cost: { money: 80 },
      effect: { internalSkill: +10, health: +30 }
    },
    {
      text: "离开",
      effect: {}
    }
  ]
}

// 武馆
{
  id: "martial_gym",
  text: "武馆提供多种训练服务",
  choices: [
    {
      text: "高级训练（金钱 -200，武力 +15）",
      cost: { money: 200 },
      condition: (state) => state.money >= 200,
      effect: { martialPower: +15, externalSkill: +10 }
    },
    {
      text: "基础训练（金钱 -50，武力 +5）",
      cost: { money: 50 },
      effect: { martialPower: +5 }
    },
    {
      text: "免费练习",
      effect: { martialPower: +2 }
    }
  ]
}

// 茶馆（情报）
{
  id: "tea_house_intel",
  text: "茶馆里有人贩卖江湖情报",
  choices: [
    {
      text: "购买高级情报（金钱 -100，获得秘境位置）",
      cost: { money: 100 },
      condition: (state) => state.money >= 100,
      effect: { 
        money: -100,
        flags: { secret_cave_location: true }
      }
    },
    {
      text: "购买普通情报（金钱 -30，声望 +5）",
      cost: { money: 30 },
      effect: { reputation: +5 }
    },
    {
      text: "只听免费消息",
      effect: {}
    }
  ]
}
```

---

### 三、声望系统（简化版）

#### 1. 声望等级（保持简单）

```typescript
const ReputationLevel = {
  UNKNOWN: 0,       // 无名小卒
  LOCAL: 100,       // 本地知名
  REGIONAL: 300,    // 一方名人
  FAMOUS: 600,      // 闻名遐迩
  RENOWNED: 1000,   // 名震一方
  LEGENDARY: 2000,  // 传奇人物
}
```

#### 2. 声望的实际应用

**A. 事件触发门槛**
```typescript
// 高声望专属事件
{
  id: "alliance_meeting_invite",
  condition: (state) => state.reputation >= 600,
  text: "武林大会主办方发来邀请函，请你作为嘉宾出席...",
}

{
  id: "sect_master_recruit",
  condition: (state) => state.reputation >= 300,
  text: "某门派掌门想邀请你担任长老...",
}

// 低声望事件
{
  id: "prove_yourself",
  condition: (state) => state.reputation < 50,
  text: "没人知道你是谁，你需要证明自己...",
}
```

**B. 声望解锁功能**
```typescript
// 解锁收徒功能
{
  id: "accept_disciple",
  condition: (state) => state.reputation >= 200 && state.martialPower >= 80,
  text: "有年轻人仰慕你的名声，前来拜师",
  effect: {
    flags: { has_disciple: true },
    reputation: +10
  }
}

// 解锁开宗立派
{
  id: "establish_sect",
  condition: (state) => state.reputation >= 500 && state.martialPower >= 100,
  text: "你已名震一方，可以开宗立派了",
  effect: {
    flags: { sect_master: true },
    reputation: +50
  }
}

// 解锁武林盟主竞选
{
  id: "alliance_master_election",
  condition: (state) => state.reputation >= 1000 && state.chivalry >= 80,
  text: "武林盟主退位，开始新一届竞选",
  choices: [
    {
      text: "参加竞选（需武力≥150）",
      effect: { /* 竞选逻辑 */ }
    }
  ]
}
```

**C. 声望影响 NPC 态度**
```typescript
// 简单的态度判断
function getNpcAttitude(reputation):
  if reputation >= 1000:
    return "敬畏"  // 称呼"大侠/前辈"，主动帮助
  if reputation >= 500:
    return "友好"  // 称呼"少侠"，正常交流
  if reputation >= 100:
    return "礼貌"  // 正常态度
  return "忽视"    // 爱答不理
```

---

## 实施示例

### 完整事件示例 1：侠义值影响

```json
{
  "id": "village_bandits_attack",
  "version": "1.0",
  "category": "random",
  "ageRange": {"min": 20, "max": 50},
  "triggers": [
    {"type": "age_reach", "value": 20},
    {"type": "random", "value": 0.15}
  ],
  "conditions": [],
  "content": {
    "title": "山贼劫村",
    "text": "你路过一个村庄，发现山贼正在抢劫村民。村民们向你投来求助的目光。",
    "description": "路见不平"
  },
  "eventType": "choice",
  "choices": [
    {
      "text": "挺身而出，击退山贼（需武力≥50）",
      "conditions": [
        {"type": "expression", "expression": "martialPower >= 50"}
      ],
      "effects": [
        {"type": "stat_modify", "stat": "chivalry", "value": 15},
        {"type": "stat_modify", "stat": "reputation", "value": 20},
        {"type": "stat_modify", "stat": "martialPower", "value": 5}
      ]
    },
    {
      "text": "视而不见，继续赶路",
      "effects": [
        {"type": "stat_modify", "stat": "chivalry", "value": -5}
      ]
    },
    {
      "text": "趁火打劫，与山贼分赃（侠义≤-20）",
      "conditions": [
        {"type": "expression", "expression": "chivalry <= -20"}
      ],
      "effects": [
        {"type": "stat_modify", "stat": "money", "value": 100},
        {"type": "stat_modify", "stat": "chivalry", "value": -30},
        {"type": "stat_modify", "stat": "reputation", "value": -30}
      ]
    }
  ]
}
```

### 完整事件示例 2：金钱门槛

```json
{
  "id": "mysterious_merchant",
  "version": "1.0",
  "category": "special",
  "ageRange": {"min": 25, "max": 55},
  "triggers": [
    {"type": "age_reach", "value": 25},
    {"type": "random", "value": 0.08}
  ],
  "conditions": [
    {"type": "expression", "expression": "money >= 500"}
  ],
  "content": {
    "title": "神秘商人",
    "text": "一个神秘商人拦住你，说他只与有钱人做生意。他拿出几件稀世珍宝。",
    "description": "黑市交易"
  },
  "eventType": "choice",
  "choices": [
    {
      "text": "购买武林秘籍（金钱 -500，武力 +25）",
      "conditions": [
        {"type": "expression", "expression": "money >= 500"}
      ],
      "effects": [
        {"type": "stat_modify", "stat": "money", "value": -500},
        {"type": "stat_modify", "stat": "martialPower", "value": 25}
      ]
    },
    {
      "text": "购买灵丹妙药（金钱 -300，体质 +10）",
      "conditions": [
        {"type": "expression", "expression": "money >= 300"}
      ],
      "effects": [
        {"type": "stat_modify", "stat": "money", "value": -300},
        {"type": "stat_modify", "stat": "constitution", "value": 10}
      ]
    },
    {
      "text": "随便看看（金钱 -50，获得情报）",
      "conditions": [
        {"type": "expression", "expression": "money >= 50"}
      ],
      "effects": [
        {"type": "stat_modify", "stat": "money", "value": -50},
        {"type": "stat_modify", "stat": "reputation", "value": 5}
      ]
    },
    {
      "text": "离开",
      "effects": []
    }
  ]
}
```

### 完整事件示例 3：声望解锁

```json
{
  "id": "famous_disciple_request",
  "version": "1.0",
  "category": "social",
  "ageRange": {"min": 30, "max": 60},
  "triggers": [
    {"type": "age_reach", "value": 30},
    {"type": "random", "value": 0.1}
  ],
  "conditions": [
    {"type": "expression", "expression": "reputation >= 200 && martialPower >= 80"}
  ],
  "content": {
    "title": "求师学艺",
    "text": "一位年轻人慕名而来，跪在你面前请求拜师学艺。他说仰慕你的名声已久。",
    "description": "收徒事件"
  },
  "eventType": "choice",
  "choices": [
    {
      "text": "收为弟子（声望 +15，获得追随者）",
      "effects": [
        {"type": "stat_modify", "stat": "reputation", "value": 15},
        {"type": "flag_set", "flag": "has_disciple", "value": true}
      ]
    },
    {
      "text": "拒绝，专心修炼",
      "effects": [
        {"type": "stat_modify", "stat": "martialPower", "value": 3}
      ]
    },
    {
      "text": "推荐给其他门派（声望 +10，侠义 +5）",
      "effects": [
        {"type": "stat_modify", "stat": "reputation", "value": 10},
        {"type": "stat_modify", "stat": "chivalry", "value": 5}
      ]
    }
  ]
}
```

---

## 属性价值体现总结

### 侠义值的价值
✅ **触发专属事件**: 高侠义触发正道事件，低侠义触发魔道事件  
✅ **影响事件分支**: 同一事件不同选择（帮助/收费/打劫）  
✅ **商店折扣**: 7 折 vs 加价 50%  
✅ **学习武功**: 正道绝学需要侠义≥80，邪派武功需要侠义≤-50  

### 金钱的价值
✅ **事件门槛**: 没钱触发不了某些事件（拍卖会、黑市）  
✅ **高级选项**: 有钱才能选择更好的选项（买秘籍、买药）  
✅ **购买服务**: 医馆、武馆、茶馆的付费服务  
✅ **改变走向**: 破财消灾 vs 武力解决  

### 声望的价值
✅ **事件触发**: 低声望无法触发高级事件  
✅ **功能解锁**: 收徒、立派、竞选盟主  
✅ **NPC 态度**: 敬畏/友好/礼貌/忽视  
✅ **称号系统**: 获得特殊称号和尊重  

---

## 优势分析

### 相比繁琐的生活开销系统

| 方面 | 繁琐系统 | 简化系统 |
|------|---------|---------|
| **游戏节奏** | ❌ 每月计算开销，拖慢节奏 | ✅ 事件驱动，自然流畅 |
| **玩家体验** | ❌ 像记账，压力大 | ✅ 自主选择，策略性强 |
| **实现复杂度** | ❌ 需要完整的经济系统 | ✅ 只需修改事件条件 |
| **属性价值** | ❌ 被动消耗 | ✅ 主动选择，价值明显 |

### 核心优势
1. ✅ **轻量级**: 不改变现有游戏框架
2. ✅ **事件驱动**: 符合现有系统设计
3. ✅ **自主选择**: 玩家决定何时消耗资源
4. ✅ **价值明显**: 属性直接影响游戏体验

---

## 实施步骤

### 第一步：修改现有事件（1-2 天）
- 为现有事件添加侠义值条件
- 为部分事件添加金钱消耗选项
- 添加声望门槛

### 第二步：创建新事件（2-3 天）
- 创建侠义专属事件（高/低各 5 个）
- 创建金钱消耗事件（10-15 个）
- 创建声望解锁事件（5-8 个）

### 第三步：测试调整（1 天）
- 测试属性门槛是否合理
- 调整金钱消耗数值
- 验证侠义分支平衡性

---

**文档生成时间**: 2026-03-13  
**优先级**: 高  
**预计工作量**: 4-6 天  
**核心理念**: 轻量级、事件驱动、自主选择
