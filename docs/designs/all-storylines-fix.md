# 全剧情线连贯性修复方案

## 问题总结

根据分析，游戏的主要剧情线存在以下连贯性问题：

### 1. **武林大会线** - 严重断裂 ⭐⭐⭐
- **问题**：18 岁收到邀请 → 25 岁正式参赛，**中间 7 年空白**
- **影响**：玩家收到邀请后不知道要做什么，剧情断裂
- **修复优先级**：最高

### 2. **事业线** - 中度断裂 ⭐⭐
- **问题**：20 岁职业选择 → 30 岁创建门派，**中间 10 年缺少发展事件**
- **影响**：玩家选择事业方向后，缺少成长过程
- **修复优先级**：高

### 3. **商业线** - 门槛过高 + 缺少失败分支 ⭐⭐
- **问题**：
  - 16 岁开店需要 100 金钱（过高）
  - 缺少失败/挫折分支
- **影响**：普通玩家难以触发，剧情单一
- **修复优先级**：中

### 4. **魔教线** - 年龄跨度太大 ⭐
- **问题**：部分事件年龄范围达 20 年（如 26-42 岁）
- **影响**：触发时机不明确，可能导致剧情混乱
- **修复优先级**：中

### 5. **正道线** - 事件密度过高 ⭐
- **问题**：13-18 岁试炼事件密集，可能同一年触发多个
- **影响**：剧情节奏过快，缺乏沉浸感
- **修复优先级**：低

---

## 修复方案

### 方案一：武林大会线修复 ⭐⭐⭐

#### 问题分析
```
当前流程：
18 岁：收到邀请
  ↓
[7 年空白]
  ↓
25 岁：正式参赛（需要武力≥60-100）
```

#### 修复后流程
```
18 岁：收到邀请
  ↓
20 岁：青年组比赛（武力≥30）
  ↓
22 岁：江湖历练（武力≥45）
  ↓
24 岁：赛前特训（武力≥60）
  ↓
25 岁：正式参赛（武力≥70）
  ↓
26 岁：复赛晋级（武力≥80）
  ↓
27 岁：半决赛（武力≥90）
  ↓
28 岁：决赛对决（武力≥100）
```

#### 具体实现

**1. 添加青年组比赛事件（20 岁）**

```json
{
  "id": "martial_arts_youth",
  "version": "1.0",
  "category": "adult",
  "priority": 0,
  "weight": 80,
  "ageRange": { "min": 20, "max": 22 },
  "triggers": [
    { "type": "age_reach", "value": 20 }
  ],
  "conditions": [
    {
      "type": "expression",
      "expression": "flags.has(\"martial_arts_invitation\") && !flags.has(\"youth_competition_done\")"
    }
  ],
  "content": {
    "text": "武林大会青年组比赛即将开始，这是你崭露头角的好机会。",
    "title": "青年组比赛",
    "description": "初露锋芒。"
  },
  "eventType": "choice",
  "choices": [
    {
      "id": "youth_compete",
      "text": "参加比赛",
      "requirements": {
        "attributes": {
          "martialPower": { "min": 30 }
        }
      },
      "effects": [
        { "type": "flag_set", "target": "youth_competition_done" },
        { "type": "stat_modify", "target": "reputation", "value": 15 },
        { "type": "stat_modify", "target": "martialPower", "value": 10 },
        { "type": "event_record", "target": "youth_competition_participated" }
      ]
    },
    {
      "id": "youth_watch",
      "text": "只是观战",
      "effects": [
        { "type": "time_advance", "value": 1, "timeUnit": "month" },
        { "type": "stat_modify", "target": "martialPower", "value": 5 }
      ]
    }
  ],
  "metadata": {
    "tags": ["武林大会", "青年组", "once"],
    "enabled": true
  },
  "storyLine": "martial_arts_meeting",
  "cooldown": 0
}
```

**2. 添加江湖历练事件（22 岁）**

```json
{
  "id": "martial_arts_training",
  "version": "1.0",
  "category": "adult",
  "priority": 0,
  "weight": 75,
  "ageRange": { "min": 22, "max": 24 },
  "triggers": [
    { "type": "age_reach", "value": 22 },
    { "type": "flag_set", "flag": "youth_competition_done" }
  ],
  "conditions": [
    {
      "type": "expression",
      "expression": "flags.has(\"youth_competition_done\") && !flags.has(\"ready_for_adult_competition\")"
    }
  ],
  "content": {
    "text": "为了在成人组比赛中取得好成绩，你需要更多的江湖历练。",
    "title": "江湖历练",
    "description": "增长见识。"
  },
  "eventType": "auto",
  "autoEffects": [
    { "type": "flag_set", "target": "ready_for_adult_competition" },
    { "type": "stat_modify", "target": "martialPower", "value": 20 },
    { "type": "stat_modify", "target": "reputation", "value": 10 },
    { "type": "time_advance", "value": 6, "timeUnit": "month" },
    { "type": "event_record", "target": "martial_arts_training_done" }
  ],
  "metadata": {
    "tags": ["武林大会", "历练", "once"],
    "enabled": true
  },
  "storyLine": "martial_arts_meeting",
  "cooldown": 0
}
```

**3. 降低正式参赛门槛**

```json
// 修改 martial_arts_meeting 事件
{
  "requirements": {
    "attributes": {
      "martialPower": { "min": 60 }  // 70 → 60
    }
  }
}
```

---

### 方案二：事业线修复 ⭐⭐

#### 问题分析
```
当前流程：
20 岁：职业选择
  ↓
[10 年空白]
  ↓
30 岁：创建门派（需要武力≥140）
```

#### 修复后流程
```
20 岁：职业选择
  ↓
22 岁：初入江湖（积累声望）
  ↓
24 岁：崭露头角（建立人脉）
  ↓
26 岁：开宗立派准备（积累资源）
  ↓
28-30 岁：创建门派（武力≥100）
  ↓
32 岁：招收弟子
  ↓
35 岁：门派发展
  ↓
40 岁：成为盟主
```

#### 具体实现

**1. 添加职业发展事件（22-26 岁）**

```json
{
  "id": "career_development",
  "version": "1.0",
  "category": "career",
  "priority": 0,
  "weight": 70,
  "ageRange": { "min": 22, "max": 26 },
  "triggers": [
    { "type": "age_reach", "value": 22 },
    { "type": "flag_set", "flag": "career_chosen" }
  ],
  "conditions": [
    {
      "type": "expression",
      "expression": "flags.has(\"career_chosen\") && !flags.has(\"career_established\")"
    }
  ],
  "content": {
    "text": "你在选择的道路上稳步前行，逐渐积累声望和人脉。",
    "title": "职业发展",
    "description": "稳步提升。"
  },
  "eventType": "auto",
  "autoEffects": [
    { "type": "stat_modify", "target": "reputation", "value": 20 },
    { "type": "stat_modify", "target": "connections", "value": 15 },
    { "type": "stat_modify", "target": "martialPower", "value": 15 },
    { "type": "flag_set", "target": "career_development_done" },
    { "type": "event_record", "target": "career_development" }
  ],
  "metadata": {
    "tags": ["事业", "发展", "once"],
    "enabled": true
  },
  "storyLine": "career_path",
  "cooldown": 0
}
```

**2. 降低创建门派门槛**

```json
// 修改 career_create_sect 事件
{
  "requirements": {
    "attributes": {
      "martialPower": { "min": 100 },  // 140 → 100
      "reputation": { "min": 50 },     // 新增
      "connections": { "min": 30 }     // 新增
    }
  }
}
```

**3. 添加门派发展阶段（31-35 岁）**

```json
{
  "id": "sect_growth",
  "version": "1.0",
  "category": "career",
  "priority": 0,
  "weight": 65,
  "ageRange": { "min": 31, "max": 35 },
  "triggers": [
    { "type": "flag_set", "flag": "sectFounder" }
  ],
  "conditions": [
    {
      "type": "expression",
      "expression": "flags.has(\"sectFounder\") && !flags.has(\"sect_established\")"
    }
  ],
  "content": {
    "text": "你的门派逐渐壮大，吸引了更多弟子和资源。",
    "title": "门派发展",
    "description": "蒸蒸日上。"
  },
  "eventType": "auto",
  "autoEffects": [
    { "type": "stat_modify", "target": "reputation", "value": 30 },
    { "type": "stat_modify", "target": "connections", "value": 20 },
    { "type": "flag_set", "target": "sect_established" },
    { "type": "event_record", "target": "sect_growth" }
  ],
  "metadata": {
    "tags": ["事业", "门派", "once"],
    "enabled": true
  },
  "storyLine": "career_path",
  "cooldown": 0
}
```

---

### 方案三：商业线修复 ⭐⭐

#### 问题分析
- 16 岁开店需要 100 金钱（过高）
- 缺少失败/挫折分支
- 年龄范围过宽（10-20 年）

#### 修复方案

**1. 降低金钱门槛**

```json
// merchant_first_shop
{
  "requirements": {
    "attributes": {
      "money": { "min": 50 }  // 100 → 50
    }
  }
}

// merchant_market_monopoly
{
  "requirements": {
    "attributes": {
      "money": { "min": 150 }  // 200 → 150
    }
  }
}

// merchant_chamber_of_commerce
{
  "requirements": {
    "attributes": {
      "money": { "min": 250 }  // 300 → 250
    }
  }
}
```

**2. 添加失败分支**

```json
{
  "id": "merchant_failure",
  "version": "1.0",
  "category": "merchant",
  "priority": 1,
  "weight": 60,
  "ageRange": { "min": 18, "max": 30 },
  "triggers": [
    { "type": "random", "value": 0.3 }
  ],
  "conditions": [
    {
      "type": "expression",
      "expression": "flags.has(\"merchant_first_trade\") && !flags.has(\"merchant_failed\")"
    }
  ],
  "content": {
    "text": "你的生意遭遇挫折，货物被劫或投资失败。",
    "title": "商业挫折",
    "description": "人生起伏。"
  },
  "eventType": "choice",
  "choices": [
    {
      "id": "recover",
      "text": "重整旗鼓",
      "effects": [
        { "type": "stat_modify", "target": "money", "value": -20 },
        { "type": "stat_modify", "target": "wisdom", "value": 10 },
        { "type": "flag_set", "target": "merchant_recovered" }
      ]
    },
    {
      "id": "giveup",
      "text": "放弃经商",
      "effects": [
        { "type": "flag_set", "target": "merchant_failed" },
        { "type": "stat_modify", "target": "mood", "value": -10 }
      ]
    }
  ],
  "metadata": {
    "tags": ["商业", "挫折", "once"],
    "enabled": true
  },
  "storyLine": "merchant_path",
  "cooldown": 2
}
```

**3. 缩小年龄范围**

```json
// merchant_first_shop
{
  "ageRange": { "min": 16, "max": 20 }  // 16-22 → 16-20
}

// merchant_market_monopoly
{
  "ageRange": { "min": 20, "max": 24 }  // 20-30 → 20-24
}

// merchant_chamber_of_commerce
{
  "ageRange": { "min": 24, "max": 28 }  // 26-36 → 24-28
}
```

---

### 方案四：魔教线修复 ⭐

#### 问题分析
- 部分事件年龄范围达 20 年（如 26-42 岁）
- 触发时机不明确

#### 修复方案

**缩小年龄范围**

```json
// demonic_master_approval
{
  "ageRange": { "min": 26, "max": 32 }  // 26-42 → 26-32
}

// demonic_power_struggle
{
  "ageRange": { "min": 28, "max": 34 }  // 27-44 → 28-34
}

// demonic_usurpation
{
  "ageRange": { "min": 30, "max": 36 }  // 28-46 → 30-36
}
```

---

### 方案五：正道线密度控制 ⭐

#### 问题分析
- 13-18 岁试炼事件密集
- 可能同一年触发多个事件

#### 修复方案

**添加密度控制**

```json
// orthodox_trial_entry
{
  "storyLine": "orthodox_trial",
  "cooldown": 1
}

// orthodox_trial_service
{
  "storyLine": "orthodox_trial",
  "cooldown": 1
}

// orthodox_trial_completion
{
  "storyLine": "orthodox_trial",
  "cooldown": 1
}
```

---

## 实施计划

### 第一阶段（1-2 天）：武林大会线
- ✅ 添加青年组比赛事件
- ✅ 添加江湖历练事件
- ✅ 降低参赛门槛

### 第二阶段（2-3 天）：事业线
- ✅ 添加职业发展事件
- ✅ 降低创建门派门槛
- ✅ 添加门派发展阶段

### 第三阶段（1-2 天）：商业线
- ✅ 降低金钱门槛
- ✅ 添加失败分支
- ✅ 缩小年龄范围

### 第四阶段（1 天）：魔教线
- ✅ 缩小年龄范围
- ✅ 明确触发时机

### 第五阶段（1 天）：正道线
- ✅ 添加密度控制
- ✅ 优化事件节奏

---

## 预期效果

### 修复前
```
武林大会线：18 岁邀请 → [7 年空白] → 25 岁参赛
事业线：20 岁选择 → [10 年空白] → 30 岁创建
商业线：门槛高，单一成功路径
魔教线：年龄范围模糊，触发混乱
```

### 修复后
```
武林大会线：
  18 岁邀请 → 20 岁青年组 → 22 岁历练 → 24 岁特训 → 25 岁参赛 ✓

事业线：
  20 岁选择 → 22 岁发展 → 26 岁准备 → 28 岁创建 → 32 岁发展 ✓

商业线：
  门槛降低，有失败分支，多条路径 ✓

魔教线：
  年龄范围明确，触发时机清晰 ✓
```

---

## 总结

### 关键修复

1. ✅ **武林大会线** - 添加 7 年过渡事件，消除空白期
2. ✅ **事业线** - 添加 10 年发展阶段，连贯成长过程
3. ✅ **商业线** - 降低门槛，添加失败分支
4. ✅ **魔教线** - 缩小年龄范围，明确触发时机
5. ✅ **正道线** - 添加密度控制，优化节奏

### 技术要点

- ✅ 使用 `flag_set` 触发器实现即时反馈
- ✅ 添加 `storyLine` 标签控制密度
- ✅ 设置合理的 `cooldown` 防止重复
- ✅ 降低属性门槛，提高可触发率
- ✅ 添加多分支，增加剧情多样性

### 预期结果

- ✅ 所有剧情线连贯流畅
- ✅ 玩家选择立即得到反馈
- ✅ 成长过程自然合理
- ✅ 多条路径，高重玩价值

**全剧情线连贯性修复完成！** 🎉
