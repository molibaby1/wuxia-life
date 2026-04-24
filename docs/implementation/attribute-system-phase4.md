# 属性系统优化实施报告 - 阶段四

**实施时间**: 2026-03-14  
**实施阶段**: 阶段四（非战斗属性扩展）  
**状态**: ✅ 完成

---

## 📋 阶段四目标

扩展非战斗属性体系，实现多元化发展路径：
1. 学识、人脉、声望等非战斗属性事件
2. 仕途线（读书入仕）
3. 商业线（经商致富）
4. 隐士线（江湖隐士）
5. 属性与剧情分支的关联

---

## ✅ 完成内容

### 任务 1: 非战斗属性事件

**文件**: `src/data/lines/non-combat.json`

**事件列表** (6 个):

#### 1. 读书学习（10-60 岁，20% 概率）
```json
{
  "id": "noncombat_reading",
  "eventType": "choice",
  "choices": [
    {"text": "阅读经典（学识 +4~6，悟性 +2~3）"},
    {"text": "研读史书（学识 +3~5，人脉 +1~2）"},
    {"text": "吟诗作对（学识 +3~5，魅力 +2~3）"}
  ]
}
```

**设计特点**:
- 使用浮动数值（variable: true）
- 三种读书类型各有侧重
- 推进时间 1 个月

---

#### 2. 社交活动（15-65 岁，18% 概率）
```json
{
  "id": "noncombat_socialize",
  "eventType": "choice",
  "choices": [
    {
      "text": "慷慨解囊（金钱 -50，人脉 +5~8，声望 +3~5）",
      "condition": {"expression": "money >= 50"}
    },
    {
      "text": "展现魅力（魅力 +3~5，人脉 +3~5）",
      "condition": {"expression": "charisma >= 30"}
    },
    {"text": "随便聊聊（人脉 +2~3）"}
  ]
}
```

**设计特点**:
- 三种社交方式成本收益不同
- 有属性门槛检查
- 花钱/展示魅力/普通社交

---

#### 3. 行侠仗义（12-70 岁，15% 概率）
```json
{
  "id": "noncombat_good_deed",
  "eventType": "choice",
  "choices": [
    {
      "text": "挺身而出（侠义 +5~8，声望 +3~5，30% 概率树敌）"
    },
    {"text": "多一事不如少一事（侠义 -2~3）"}
  ]
}
```

**设计特点**:
- 道德抉择
- 使用 chance 属性实现概率触发
- 高风险高回报 vs 保守选择

**实现**:
```typescript
effects: [
  {
    "type": "flag_set",
    "flag": "made_enemy",
    "chance": 0.3
  }
]
```

---

#### 4. 名声传播（18-60 岁，12% 概率）
```json
{
  "id": "noncombat_reputation_boost",
  "eventType": "auto",
  "conditions": [{"expression": "reputation >= 100"}]
}
```

**效果**:
- 声望 +6~10
- 魅力 +2
- 推进 3 个月
- 自动触发

---

#### 5. 人脉运作（20-55 岁，10% 概率）
```json
{
  "id": "noncombat_networking",
  "conditions": [{"expression": "connections >= 30"}]
}
```

**选择**:
- 投资关系（金钱 -100，人脉 +10~15）
- 帮助他人（人脉 +6~10，侠义 +3~5）
- 维持现状（人脉 +2~3）

---

#### 6. 科举考试（18-40 岁，8% 概率）
```json
{
  "id": "noncombat_academic_exam",
  "conditions": [{"expression": "knowledge >= 50 && charisma >= 40"}]
}
```

**选择**:
- 参加科举（需学识≥60，80% 成功率：声望 +20~30）
- 再准备准备（学识 +5~8）
- 放弃科举

**实现**:
```typescript
effects: [
  {
    "type": "stat_modify",
    "target": "reputation",
    "value": 25,
    "operator": "add",
    "variable": true,
    "minValue": 20,
    "maxValue": 30,
    "successRate": 0.8
  },
  {
    "type": "stat_modify",
    "target": "reputation",
    "value": -5,
    "operator": "add",
    "onFailure": true
  }
]
```

---

### 任务 2-4: 职业发展路径

**文件**: `src/data/lines/career-paths.json`

**事件列表** (7 个):

#### 1. 人生抉择（20-35 岁，30% 概率）
```json
{
  "id": "career_path_choice",
  "eventType": "choice",
  "choices": [
    {
      "text": "入仕为官（需求：学识≥60，魅力≥50，人脉≥40）"
    },
    {
      "text": "经商致富（需求：财富≥500，魅力≥40，人脉≥30）"
    },
    {
      "text": "江湖隐士（需求：侠义≥60，学识≥40）"
    },
    {"text": "再考虑考虑"}
  ]
}
```

**设计特点**:
- 三条职业路径同时呈现
- 每条路径有不同的属性需求
- 设置 career_chosen flag 防止重复选择

---

#### 2. 官场升迁（仕途线，25-55 岁，15% 概率）
```json
{
  "id": "career_official_promotion",
  "conditions": [
    {"expression": "flags.has(\"career_official_chosen\") && knowledge >= 70 && charisma >= 60"}
  ]
}
```

**选择**:
- 接受提拔（声望 +15~25，人脉 +10~15，金钱 +100）
- 婉拒（侠义 +5，声望 -5）

**设置 flag**: `official_promoted`

---

#### 3. 商业机会（商业线，22-50 岁，12% 概率）
```json
{
  "id": "career_merchant_opportunity",
  "conditions": [
    {"expression": "flags.has(\"career_merchant_chosen\") && wealth >= 600"}
  ]
}
```

**选择**:
- 大笔投资（金钱 -300，财富 +200~400，30% 失败率）
- 小额投资（金钱 -100，财富 +50~120）
- 拒绝投资

**实现**:
```typescript
effects: [
  {
    "type": "stat_modify",
    "target": "wealth",
    "value": 300,
    "operator": "add",
    "variable": true,
    "minValue": 200,
    "maxValue": 400,
    "successRate": 0.7
  },
  {
    "type": "stat_modify",
    "target": "money",
    "value": -200,
    "operator": "add",
    "onFailure": true
  }
]
```

---

#### 4. 隐居修炼（隐士线，25-60 岁，10% 概率）
```json
{
  "id": "career_hermit_cultivation",
  "conditions": [
    {"expression": "flags.has(\"career_hermit_chosen\") && chivalry >= 70"}
  ],
  "eventType": "auto"
}
```

**效果**:
- 内功 +6~10
- 悟性 +4~6
- 侠义 +3
- 健康 +15
- 推进 1 年

---

#### 5-7. 三个圆满结局

##### 一代名臣（仕途结局）
```json
{
  "id": "career_official_ending",
  "conditions": [
    {"expression": "flags.has(\"career_official_chosen\") && flags.has(\"official_promoted\") && reputation >= 300"}
  ],
  "endingType": "career_success",
  "endingTitle": "一代名臣"
}
```

**效果**: 声望 +100

---

##### 首富一方（商业结局）
```json
{
  "id": "career_merchant_ending",
  "conditions": [
    {"expression": "flags.has(\"career_merchant_chosen\") && wealth >= 3000"}
  ],
  "endingType": "career_success",
  "endingTitle": "首富一方"
}
```

**效果**: 声望 +50，人脉 +50

---

##### 世外高人（隐士结局）
```json
{
  "id": "career_hermit_ending",
  "conditions": [
    {"expression": "flags.has(\"career_hermit_chosen\") && chivalry >= 80 && internalSkill >= 70"}
  ],
  "endingType": "career_success",
  "endingTitle": "世外高人"
}
```

**效果**: 声望 +80，内功 +20

---

## 🎯 设计亮点

### 1. 多元化发展路径

**三条职业路径**:

| 路径 | 需求属性 | 核心玩法 | 结局条件 |
|------|---------|---------|---------|
| **仕途** | 学识≥60<br>魅力≥50<br>人脉≥40 | 读书→科举→升迁 | 声望≥300<br>已升迁 |
| **商业** | 财富≥500<br>魅力≥40<br>人脉≥30 | 投资→赚钱→扩张 | 财富≥3000 |
| **隐士** | 侠义≥60<br>学识≥40 | 修炼→行侠→隐居 | 侠义≥80<br>内功≥70 |

**设计理念**:
- 不同路径有不同的属性侧重
- 每条路径都有独特的事件链
- 最终都能达成圆满结局

---

### 2. 属性与剧情深度关联

**关联方式**:

#### 属性门槛
```typescript
// 科举考试需要学识和魅力
"conditions": [
  {"expression": "knowledge >= 50 && charisma >= 40"}
]

// 参加科举需要学识≥60
"choices": [
  {
    "text": "参加科举（需学识≥60）",
    "condition": {"expression": "knowledge >= 60"}
  }
]
```

#### 属性影响结果
```typescript
// 80% 成功率
"effects": [
  {
    "successRate": 0.8,
    "onFailure": true
  }
]
```

#### 属性决定结局
```typescript
// 一代名臣结局
"conditions": [
  {"expression": "reputation >= 300"}
]
```

---

### 3. 风险回报机制

**商业投资**:
```
大笔投资:
  - 70% 成功：财富 +200~400
  - 30% 失败：金钱 -200（额外损失）

小额投资:
  - 100% 成功：财富 +50~120
  - 无失败风险
```

**科举考试**:
```
参加科举:
  - 80% 成功：声望 +20~30
  - 20% 失败：声望 -5
```

**行侠仗义**:
```
挺身而出:
  - 侠义 +5~8，声望 +3~5
  - 30% 概率树敌（可能触发复仇事件）
```

---

### 4. 浮动数值系统

**广泛应用**:
```typescript
// 读书学习
"effects": [
  {
    "type": "stat_modify",
    "target": "knowledge",
    "value": 5,
    "variable": true,
    "minValue": 4,
    "maxValue": 6
  }
]
```

**优势**:
- 增加随机性和重玩价值
- 避免数值过于机械
- 更贴近真实成长

---

## 📊 属性需求对比

### 仕途线路径
```
20 岁：人生抉择
  ├─ 学识≥60 ✓
  ├─ 魅力≥50 ✓
  └─ 人脉≥40 ✓
  ↓
25 岁：官场升迁
  ├─ 学识≥70 ✓
  └─ 魅力≥60 ✓
  ↓
55 岁：一代名臣结局
  └─ 声望≥300 ✓
```

### 商业线路径
```
20 岁：人生抉择
  ├─ 财富≥500 ✓
  ├─ 魅力≥40 ✓
  └─ 人脉≥30 ✓
  ↓
22 岁：商业机会
  ├─ 选择大笔投资（金钱 -300）
  └─ 70% 成功（财富 +200~400）
  ↓
55 岁：首富一方结局
  └─ 财富≥3000 ✓
```

### 隐士线路径
```
20 岁：人生抉择
  ├─ 侠义≥60 ✓
  └─ 学识≥40 ✓
  ↓
25 岁：隐居修炼
  ├─ 侠义≥70 ✓
  └─ 自动提升内功/悟性
  ↓
55 岁：世外高人结局
  ├─ 侠义≥80 ✓
  └─ 内功≥70 ✓
```

---

## 📈 统计数据

### 事件分布

| 类别 | 事件数 | 年龄段 | 触发概率 |
|------|--------|--------|---------|
| **非战斗** | 6 | 10-70 岁 | 8-20% |
| - 读书学习 | 1 | 10-60 岁 | 20% |
| - 社交活动 | 1 | 15-65 岁 | 18% |
| - 行侠仗义 | 1 | 12-70 岁 | 15% |
| - 名声传播 | 1 | 18-60 岁 | 12% |
| - 人脉运作 | 1 | 20-55 岁 | 10% |
| - 科举考试 | 1 | 18-40 岁 | 8% |
| **职业** | 7 | 20-70 岁 | - |
| - 人生抉择 | 1 | 20-35 岁 | 30% |
| - 官场升迁 | 1 | 25-55 岁 | 15% |
| - 商业机会 | 1 | 22-50 岁 | 12% |
| - 隐居修炼 | 1 | 25-60 岁 | 10% |
| - 三个结局 | 3 | 55-70 岁 | 20% |

### 属性需求统计

| 属性 | 仕途需求 | 商业需求 | 隐士需求 |
|------|---------|---------|---------|
| 学识 | 60-70 | - | 40 |
| 魅力 | 50-60 | 40 | - |
| 人脉 | 40 | 30 | - |
| 财富 | - | 500-3000 | - |
| 侠义 | - | - | 60-80 |
| 内功 | - | - | 70 |
| 声望 | 300 (结局) | 50 (结局) | 80 (结局) |

---

## 🎉 总结

### 核心成果

1. ✅ **非战斗属性事件** - 6 个事件覆盖学识/人脉/声望/侠义
2. ✅ **三条职业路径** - 仕途/商业/隐士各有特色
3. ✅ **属性与剧情关联** - 属性值决定剧情分支和结局
4. ✅ **多元化结局** - 3 个圆满结局对应不同玩法

### 设计特点

- **多样性**: 不同路径有不同的属性侧重和玩法
- **平衡性**: 三条路径难度相当，都能达成圆满结局
- **策略性**: 玩家需要根据当前属性选择发展路径
- **代入感**: 通过属性成长体验完整的人生历程

### 属性系统完整性

**战斗属性** (5 项):
- 功力、外功、内功、轻功、体魄
- ✅ 已实现完整的成长和修炼系统

**非战斗属性** (7 项):
- 魅力、悟性、侠义、声望、人脉、学识、财富
- ✅ 已实现完整的事件和发展路径

**天赋系统** (16 个):
- 战斗型、学习型、社交型、特殊型
- ✅ 已实现天赋选择、发现和成长加成

---

## 📋 下一步计划

根据实施计划，接下来应该实施**阶段五**：

#### 阶段五：可视化与引导（2-3 天）

**需要**:
1. 属性面板组件开发
   - 显示所有属性值
   - 显示天赋和成长加成
   - 显示发展建议

2. 属性引导教程
   - 10-15 岁逐步触发
   - 介绍各属性作用
   - 引导玩家理解系统

3. 天赋可视化
   - 显示已发现天赋
   - 用文案包装天赋效果

**文件**:
- `src/components/AttributePanel.vue` - 属性面板
- `src/data/lines/tutorial.json` - 教程事件
- 修改 `src/components/GameScreen.vue` - 集成属性面板

---

**实施状态**: ✅ 阶段四完成  
**累计进度**: 4/7 阶段（57%）  
**下一步**: 等待审批阶段五实施计划
