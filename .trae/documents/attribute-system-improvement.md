# 属性系统改进方案

## 现状分析

### 当前属性列表

| 属性 | 当前作用 | 问题 |
|------|---------|------|
| **侠义值 (chivalry)** | 事件触发条件、少量增减 | ❌ 缺乏实际影响<br>❌ 不影响 NPC 态度<br>❌ 不改变剧情走向 |
| **金钱 (money)** | 购买物品、少量消耗 | ❌ 用途单一<br>❌ 获取容易<br>❌ 缺乏消费场景 |
| **声望 (reputation)** | 事件触发条件 | ❌ 不影响 NPC 行为<br>❌ 不改变对话内容<br>❌ 缺乏等级系统 |
| **武力/内功/外功** | 战斗、事件条件 | ✅ 作用明确 |
| **悟性/体魄** | 修炼效率、事件条件 | ⚠️ 作用有限 |

---

## 核心问题

### 1. 侠义值 - 缺乏道德系统深度
**现状**: 
- 只作为事件触发门槛（如 `chivalry >= 20`）
- 增减随意，无长期影响
- 正邪选择无实质区别

**问题**:
- ❌ 侠义值高低不影响 NPC 态度
- ❌ 不影响商店价格
- ❌ 不改变任务类型
- ❌ 不触发特殊剧情

### 2. 金钱 - 缺乏经济系统
**现状**:
- 只用于简单购买
- 缺乏投资、消费场景
- 数值膨胀无控制

**问题**:
- ❌ 缺乏消费场景（买房、娶妻、收徒）
- ❌ 缺乏投资系统（店铺、田产）
- ❌ 缺乏维护费用（门派开支、家庭开销）
- ❌ 缺乏通货膨胀

### 3. 声望 - 缺乏影响力系统
**现状**:
- 只作为事件条件
- 无等级划分
- 不影响游戏体验

**问题**:
- ❌ 声望高低不影响 NPC 行为
- ❌ 不改变称呼/待遇
- ❌ 不解锁特殊功能
- ❌ 不吸引徒弟/追随者

---

## 改进方案

### 方案一：侠义值系统重构

#### 1. 侠义等级系统

```typescript
enum ChivalryLevel {
  DEMON = -100,        // 魔头
  VILLAIN = -50,       // 恶人
  ANTIHERO = -20,      // 亦正亦邪
  NORMAL = 0,          // 普通人
  HERO = 50,           // 侠士
  GRANDHERO = 80,      // 大侠
  LEGEND = 100         // 传奇
}
```

#### 2. 侠义值的实际影响

**A. NPC 态度系统**
```typescript
// 根据侠义值，NPC 表现不同
function getNpcAttitude(playerChivalry, npcType):
  - 正道 NPC:
    - chivalry >= 80: 尊敬，打折，主动帮助
    - chivalry >= 50: 友好，正常价格
    - chivalry >= 0: 中立
    - chivalry < 0: 警惕，加价，拒绝服务
    - chivalry <= -50: 敌视，攻击

  - 魔道 NPC:
    - chivalry <= -80: 尊敬，打折
    - chivalry <= -50: 友好
    - chivalry >= 50: 敌视，攻击
```

**B. 商店价格系统**
```typescript
function getPriceMultiplier(chivalry, shopType):
  - 正道商店（药铺、武器）:
    - chivalry >= 80: 0.7 倍（7 折）
    - chivalry >= 50: 0.85 倍
    - chivalry >= 0: 1.0 倍
    - chivalry < 0: 1.5 倍（加价 50%）
    - chivalry <= -50: 拒绝交易

  - 黑市（魔道）:
    - chivalry <= -50: 0.7 倍
    - chivalry <= 0: 1.0 倍
    - chivalry > 0: 1.5 倍
```

**C. 任务类型系统**
```typescript
function getAvailableQuests(chivalry):
  - chivalry >= 80:
    - 护送商队
    - 剿灭土匪
    - 保护村民
    - 正道门派任务
    奖励：声望 +，金钱 ++
  
  - chivalry <= -50:
    - 暗杀目标
    - 掠夺商队
    - 灭门任务
    - 魔教任务
    奖励：金钱 +++，恶名 +
  
  - 0 <= chivalry <= 50:
    - 混合任务
    - 中立任务
```

**D. 特殊剧情触发**
```typescript
// 高侠义专属剧情
if (chivalry >= 80):
  - 被邀请加入正道联盟
  - 获得武林盟主认可
  - 可学习正道绝学（如太极剑法）
  - NPC 主动求助事件增加

// 低侠义专属剧情
if (chivalry <= -50):
  - 被邀请加入魔教
  - 获得魔头赏识
  - 可学习邪派武功（如吸星大法）
  - 遭遇正道追杀事件

// 极端侠义触发特殊事件
if (chivalry >= 100):
  - "武林传奇"称号
  - 开创武林新时代
  - 立雕像纪念

if (chivalry <= -100):
  - "武林公敌"称号
  - 正道联合围剿
  - 历史留名（反面）
```

---

### 方案二：金钱系统重构

#### 1. 金钱获取多样化

```typescript
// 基础收入
incomeSources = {
  // 劳动收入
  working: {
    farming: 10-30/月，
    hunting: 20-50/月，
    mining: 30-60/月，
  },
  
  // 商业收入
  business: {
    shop_profit: 50-200/月，
    caravan_trade: 100-500/次，
    intelligence: 30-100/次，
  },
  
  // 武力收入
  martial: {
    bounty_hunter: 100-1000/次，
    bodyguard: 50-200/次，
    sect_salary: 30-100/月，
  },
  
  // 特殊收入
  special: {
    treasure_hunt: 100-1000/次，
    medical_practice: 20-100/月，
    teaching: 30-80/月，
  }
}
```

#### 2. 金钱消耗场景

```typescript
// 生活开销
livingExpenses = {
  // 基本开销
  food: 10-50/月，
  clothing: 5-20/月，
  housing: 20-100/月，
  
  // 家庭开销
  family: {
    spouse: 20-50/月，
    children: 10-30/人/月，
    parents: 15-40/月，
  },
  
  // 修炼开销
  cultivation: {
    medicine: 50-500/次，
    weapon: 100-1000/次，
    manual: 200-2000/本，
  },
  
  // 社交开销
  social: {
    gift: 20-200/次，
    banquet: 50-500/次，
    donation: 100-1000/次，
  },
  
  // 事业开销
  career: {
    shop_rent: 100-500/月，
    sect_fee: 50-200/月，
    subordinate_salary: 30-100/人/月，
  },
}
```

#### 3. 投资系统

```typescript
// 不动产投资
realEstate = {
  house: {
    price: 1000-5000,
    monthly_value: 50-200,
    effect: "提供住所，减少租房费用",
  },
  shop: {
    price: 5000-20000,
    monthly_profit: 200-800,
    effect: "每月产生利润",
  },
  farmland: {
    price: 1000-3000,
    monthly_profit: 50-150,
    effect: "稳定收入",
  },
}

// 事业投资
businessInvest = {
  caravan: {
    cost: 2000-5000,
    risk: "中",
    profit: 500-2000/年，
  },
  restaurant: {
    cost: 3000-8000,
    risk: "低",
    profit: 300-1000/年，
  },
  weapon_shop: {
    cost: 5000-10000,
    risk: "中",
    profit: 500-1500/年，
  },
}

// 人脉投资
connectionInvest = {
  official_bribe: {
    cost: 1000-5000,
    effect: "获得官府保护，减少麻烦",
  },
  sect_donation: {
    cost: 500-2000,
    effect: "提升门派地位，学习高级武功",
  },
  jianghu_help: {
    cost: 200-1000,
    effect: "提升声望，获得情报",
  },
}
```

#### 4. 经济平衡机制

```typescript
// 通货膨胀控制
function adjustPrices(playerWealth, avgWealth):
  if (playerWealth > avgWealth * 10):
    priceMultiplier = 1.5  // 物价上涨 50%
  else if (playerWealth > avgWealth * 5):
    priceMultiplier = 1.2
  else:
    priceMultiplier = 1.0

// 贫富差距事件
if (player.money < 10):
  triggerEvent("贫困事件"):
    - 买不起食物（健康下降）
    - 被嘲笑（声望下降）
    - 被迫打工
    
if (player.money > 10000):
  triggerEvent("富人事件"):
    - 被借钱
    - 被勒索
    - 被盗贼盯上
```

---

### 方案三：声望系统重构

#### 1. 声望等级系统

```typescript
enum ReputationLevel {
  UNKNOWN = 0,           // 无名小卒
  LOCAL = 100,           // 本地知名
  REGIONAL = 300,        // 一方名人
  FAMOUS = 600,          // 闻名遐迩
  RENOWNED = 1000,       // 名震一方
  LEGENDARY = 2000,      // 传奇人物
  MYTHICAL = 5000,       // 神话传说
}
```

#### 2. 声望的实际影响

**A. NPC 行为改变**
```typescript
function getNpcBehavior(playerReputation):
  - reputation >= 2000:
    - 主动索要签名
    - 免费提供服务
    - 主动告知情报
    - 请求合影（立雕像）
  
  - reputation >= 1000:
    - 恭敬称呼（大侠/前辈）
    - 打折（9 折）
    - 优先服务
  
  - reputation >= 300:
    - 友好态度
    - 正常价格
  
  - reputation < 100:
    - 忽视
    - 爱答不理
  
  - reputation < 0:
    - 警惕
    - 拒绝服务
    - 报告官府
```

**B. 称号系统**
```typescript
titleSystem = {
  // 根据声望和侠义获得称号
  "无名小卒": {req: {rep: 0, chi: 0}, effect: "无"},
  "后起之秀": {req: {rep: 100, chi: 20}, effect: "魅力 +5"},
  "青年才俊": {req: {rep: 300, chi: 40}, effect: "魅力 +10"},
  "一方豪杰": {req: {rep: 600, chi: 60}, effect: "魅力 +15，威慑 +10"},
  "武林大侠": {req: {rep: 1000, chi: 80}, effect: "魅力 +20，威慑 +20"},
  "武林盟主": {req: {rep: 2000, chi: 100}, effect: "魅力 +30，威慑 +30，号令正道"},
  "武林传奇": {req: {rep: 3000, chi: 120}, effect: "全属性 +10，万人敬仰"},
  
  // 恶名称号
  "江湖败类": {req: {rep: -100, chi: -50}, effect: "威慑 +20，正道敌视"},
  "魔头": {req: {rep: -500, chi: -80}, effect: "威慑 +30，正道追杀"},
  "武林公敌": {req: {rep: -1000, chi: -100}, effect: "全江湖追杀"},
}
```

**C. 特殊功能解锁**
```typescript
function unlockFeatures(reputation):
  - rep >= 100:
    - 可以收徒
    - 可以加入门派
  
  - rep >= 300:
    - 可以开宗立派
    - 可以参加武林大会
  
  - rep >= 600:
    - 可以建立势力
    - 可以邀请 NPC 加入
  
  - rep >= 1000:
    - 可以竞选武林盟主
    - 可以发布江湖令
  
  - rep >= 2000:
    - 可以立雕像
    - 可以著书立说（永久传承）
```

**D. 追随者系统**
```typescript
function calculateFollowers(reputation, chivalry):
  - rep >= 500 && chi >= 50:
    - 吸引正道弟子（2-5 人）
    - 提供情报
    - 协助战斗
  
  - rep >= 1000 && chi >= 80:
    - 吸引江湖豪杰（5-10 人）
    - 提供保护
    - 执行任务
  
  - rep >= 2000 && chi >= 100:
    - 吸引武林高手（10-20 人）
    - 建立门派
    - 形成势力
```

---

### 方案四：属性联动系统

#### 1. 综合评判系统

```typescript
// NPC 对玩家的综合评价
function calculateNpcEvaluation(player):
  score = 0
  
  // 武力分（30%）
  martialScore = (martialPower + externalSkill + internalSkill) / 3
  score += martialScore * 0.3
  
  // 品德分（30%）
  moralScore = chivalry
  score += moralScore * 0.3
  
  // 声望分（25%）
  reputationScore = reputation / 10
  score += reputationScore * 0.25
  
  // 财富分（15%）
  wealthScore = money / 100
  score += wealthScore * 0.15
  
  return score

// 根据评分决定 NPC 态度
if (score >= 80):
  attitude = "崇拜"
  priceMultiplier = 0.7
  helpProbability = 0.9
else if (score >= 60):
  attitude = "尊敬"
  priceMultiplier = 0.85
  helpProbability = 0.7
else if (score >= 40):
  attitude = "友好"
  priceMultiplier = 1.0
  helpProbability = 0.5
else if (score >= 20):
  attitude = "中立"
  priceMultiplier = 1.0
  helpProbability = 0.3
else:
  attitude = "轻视"
  priceMultiplier = 1.5
  helpProbability = 0.1
```

#### 2. 属性互补系统

```typescript
// 某些事件需要多种属性配合
eventRequirements = {
  "竞选武林盟主": {
    martialPower: >= 150,
    chivalry: >= 80,
    reputation: >= 1000,
    money: >= 5000,  // 竞选经费
    charisma: >= 60,  // 演讲能力
  },
  
  "开宗立派": {
    martialPower: >= 100,
    reputation: >= 500,
    money: >= 3000,  // 建设资金
    charisma: >= 50,  // 吸引弟子
  },
  
  "学习绝世武功": {
    martialPower: >= 120,
    comprehension: >= 70,
    chivalry: >= 60,  // 正道武功
    reputation: >= 300,
  },
  
  "建立商业帝国": {
    money: >= 10000,
    charisma: >= 70,
    reputation: >= 400,
    intelligence: >= 60,
  },
}
```

---

## 实施建议

### 阶段一：基础系统（高优先级）

1. **侠义值影响 NPC 态度**
   - 修改 NPC 对话内容
   - 添加价格乘数
   - 实现任务过滤

2. **金钱系统扩展**
   - 添加生活开销
   - 实现投资系统
   - 添加消费场景

3. **声望等级系统**
   - 实现声望等级
   - 添加称号系统
   - 解锁特殊功能

### 阶段二：进阶系统（中优先级）

4. **属性联动系统**
   - 综合评判算法
   - 多属性要求事件
   - 属性互补机制

5. **追随者系统**
   - NPC 招募
   - 势力建设
   - 门派管理

### 阶段三：深度系统（低优先级）

6. **动态世界反应**
   - 根据属性改变世界状态
   - NPC 记忆系统
   - 历史事件记录

7. **传承系统**
   - 多代游玩
   - 祖先属性影响后代
   - 家族声望传承

---

## 预期效果

### 改进前 vs 改进后

| 属性 | 改进前 | 改进后 |
|------|--------|--------|
| **侠义值** | ❌ 仅触发条件 | ✅ 影响 NPC 态度、商店价格、任务类型、剧情走向 |
| **金钱** | ❌ 简单购买 | ✅ 投资、开销、事业、社交、传承 |
| **声望** | ❌ 仅触发条件 | ✅ 称号、功能解锁、追随者、历史地位 |
| **综合体验** | ❌ 属性孤立 | ✅ 属性联动、综合评判、动态世界 |

### 游戏体验提升

1. **代入感增强**: 属性真正影响游戏世界
2. **策略性提升**: 需要平衡发展各项属性
3. **重玩价值**: 不同属性路线完全不同体验
4. **成就感**: 属性提升带来实质性回报

---

## 技术实现

### 数据结构修改

```typescript
interface PlayerState {
  // 基础属性
  martialPower: number;
  externalSkill: number;
  internalSkill: number;
  qinggong: number;
  chivalry: number;
  constitution: number;
  comprehension: number;
  
  // 社会属性
  reputation: number;
  money: number;
  title: string | null;
  
  // 新增属性
  charisma: number;        // 魅力
  fame: number;            // 名望（正负分开）
  infamy: number;          // 恶名
  
  // 关系属性
  followers: number;       // 追随者数量
  allies: string[];        // 盟友列表
  enemies: string[];       // 敌人列表
  
  // 资产
  properties: Property[];  // 房产
  businesses: Business[];  // 产业
}

interface Property {
  type: 'house' | 'shop' | 'farmland';
  location: string;
  value: number;
  monthlyIncome: number;
}

interface Business {
  type: 'caravan' | 'restaurant' | 'weapon_shop';
  investment: number;
  monthlyProfit: number;
  risk: 'low' | 'medium' | 'high';
}
```

---

## 总结

通过这套改进方案，属性系统将：

✅ **侠义值**: 从数字变成真正的道德标杆，影响整个世界对玩家的态度
✅ **金钱**: 从简单数字变成经济系统核心，支持投资、消费、传承
✅ **声望**: 从触发条件变成社会地位象征，解锁功能、吸引追随者
✅ **综合体验**: 属性不再是孤立的数字，而是相互关联、影响游戏世界的核心系统

这将大大提升游戏的深度和可玩性！

---
**文档生成时间**: 2026-03-13  
**优先级**: 高  
**预计工作量**: 2-3 周
