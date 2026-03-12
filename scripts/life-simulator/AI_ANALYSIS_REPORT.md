# AI 评分系统问题分析报告

## 🔍 问题概述

用户提出了两个关键问题：
1. **内容缺失**：第一条记录从 13 岁开始，缺少 12 岁及之前的成长经历
2. **内容重复**：门派事件后全是"平静的一年"，与真实游戏体验不符

## 📊 数据分析

### 问题 1：12 岁记录缺失

#### 实际数据
查看最新测试报告（`life-sim-report-1773203637901.json`）：

```json
记录序列：
- gameYear: 13 (门派招新)
- gameYear: 15 (体魄测试)
- gameYear: 17 (心性测试)
- gameYear: 18-80 (平静的一年)
```

**缺失**：
- ❌ 12 岁的记录（出生年）
- ❌ 14 岁的记录（门派招新后第一年）
- ❌ 16 岁的记录（体魄测试后第一年）

#### 技术原因分析

**原因 1：模拟起始逻辑问题**
```typescript
// simulator.ts:500
private async simulateYear(): Promise<boolean> {
  if (!this.currentState.alive || this.currentState.age >= this.config.endAge) {
    return false;
  }
  
  const nodes = this.getAvailableNodes(this.currentState, this.storyNodes);
  const stateBefore = { ...this.currentState };
  
  // 问题：12 岁时 nodes.length === 0
  if (nodes.length === 0) {
    this.recordYearSummary(12, '平静的一年', ...);
    this.currentState.age++; // age 变成 13
    return true;
  }
  
  // 13 岁时，门派事件触发，覆盖了之前的记录
}
```

**原因 2：事件触发时机**
```typescript
// longEvents.ts:13
{
  id: 'sect_recruitment_announcement',
  minAge: 12,  // 最小年龄 12 岁
  maxAge: 16,
  text: '各大门派开始招收弟子了！...',
  condition: (state) => state.sect === null && !state.events.has('sectRecruitment'),
}
```

**实际执行流程**：
1. **12 岁初**：创建角色，`nodes.length === 0` → 记录"平静的一年" → age=13
2. **13 岁初**：检测到门派事件 → 记录"门派招新" → age=14
3. **14 岁初**：`nodes.length === 0` → 记录"平静的一年" → age=15
4. **15 岁初**：检测到体魄测试 → 记录"体魄测试" → age=16

**问题根源**：
- 12 岁的"平静的一年"记录被创建了，但在后续处理中被覆盖或丢失
- 事件触发后的年龄增长导致某些年份的记录被跳过

### 问题 2：内容重复性分析

#### 实际数据
从 18 岁到 80 岁，共 63 年，全部记录为：
```json
{
  "nodeDescription": "[📅 年度总结] 平静的一年",
  "nodeText": "这一年没有发生特别的事件，你继续日常的生活和修炼。"
}
```

#### 技术原因

**原因 1：事件池不足**
```typescript
// 实际加载的事件数量
📚 已加载 19 个故事节点（来自 longEvents.ts）

// 事件类型分布：
- 门派事件：~10 个
- 武林大会：~6 个
- 爱情事件：~3 个
```

**问题**：
- 19 个事件分布在 68 年（12-80 岁）的人生中
- 平均每年只有 0.28 个事件
- 大部分年份没有事件触发

**原因 2：事件触发条件严格**
```typescript
// 武林大会触发条件
condition: (state) => state.martialPower >= 25 && !state.events.has('tournament2024')

// 爱情事件触发条件
condition: (state) => state.flags.has('approachedLove')
```

**问题**：
- 武功≥25 才能触发武林大会（很多玩家达不到）
- 爱情事件需要先触发前置条件（实际很难触发）
- 事件之间缺乏连贯性

**原因 3：缺少日常事件**
```typescript
// 当前缺少的事件类型：
❌ 日常修炼事件
❌ 江湖奇遇事件
❌ 朋友互动事件
❌ 师徒事件
❌ 经济事件（赚钱/花钱）
❌ 健康事件（生病/受伤）
❌ 家庭事件（父母/子女）
```

## 🔬 实验验证

### 实验 1：检查 12 岁记录

```bash
# 查看是否有 12 岁的记录
cat reports/life-sim-report-*.json | grep '"gameYear": 12'
# 结果：无记录
```

**结论**：12 岁记录确实缺失

### 实验 2：统计事件分布

```bash
# 统计各类型事件数量
cat reports/life-sim-report-1773203637901.json | grep '"nodeDescription"' | sort | uniq -c

# 结果：
1 "[🏛️ 门派事件 - 用户选择] 各大门派开始招收弟子了！..."
1 "[🏛️ 门派事件 - 用户选择] 你来到少林寺，武僧统领打量着你：..."
1 "[🏛️ 门派事件 - 用户选择] 体魄测试通过后，长老问你：..."
62 "[📅 年度总结] 平静的一年"
```

**结论**：63 年中只有 3 个实际事件，其余 60 年都是"平静的一年"

## 💡 解决方案

### 方案 1：修复记录缺失问题

#### 修改点 A：在模拟开始前记录初始状态
```typescript
// 在 run() 方法中，模拟循环前添加
console.log('👤 初始状态:');
this.recordInitialState();

private recordInitialState(): void {
  const record: ChoiceRecord = {
    timestamp: new Date().toISOString(),
    gameYear: this.currentState.age, // 12 岁
    nodeId: 'character_birth',
    nodeText: `你出生在${this.currentState.gender === 'male' ? '一个普通家庭' : '一个平凡人家'}，开始了你的江湖人生。`,
    nodeType: 'auto',
    selectedChoiceId: 'birth',
    selectedChoiceText: '出生',
    selectionReason: '人生起点',
    systemFeedback: `性别：${this.currentState.gender}, 初始属性已生成`,
    stateBefore: this.snapshotState(this.currentState),
    stateAfter: this.snapshotState(this.currentState),
    stateChanges: [],
    nodeDescription: `[👶 人生起点] 角色创建`,
  };
  
  this.logger.logChoice(record);
}
```

#### 修改点 B：确保每年都有记录
```typescript
// 在 simulateYear() 方法末尾
this.currentState.age++;
this.recordStateSnapshot();

// 添加：如果这一年没有记录任何事件，补充记录
if (!this.yearHasRecord) {
  this.recordYearSummary(
    this.currentState.age,
    '平静的一年',
    '这一年平淡无奇...',
    stateBefore,
    this.currentState
  );
}
```

### 方案 2：增加事件多样性

#### 添加日常事件池

```typescript
// 新增：日常修炼事件
{
  id: 'daily_cultivation',
  minAge: 12,
  maxAge: 80,
  text: '新的一年开始了，你要如何度过？',
  condition: (state) => !state.events.has('majorEvent'),
  weight: 5,
  choices: [
    {
      id: 'practice_martial',
      text: '闭关修炼武功',
      effect: (state) => ({
        martialPower: state.martialPower + 3,
        internalSkill: state.internalSkill + 2,
      }),
    },
    {
      id: 'practice_external',
      text: '修炼外功',
      effect: (state) => ({
        externalSkill: state.externalSkill + 3,
        martialPower: state.martialPower + 1,
      }),
    },
    {
      id: 'travel_jianghu',
      text: '游历江湖',
      effect: (state) => ({
        chivalry: state.chivalry + 5,
        money: state.money + 50,
      }),
    },
    {
      id: 'work赚钱',
      text: '打工赚钱',
      effect: (state) => ({
        money: state.money + 100,
      }),
    },
  ],
}
```

#### 添加随机奇遇事件

```typescript
// 新增：江湖奇遇
{
  id: 'jianghu_encounter',
  minAge: 15,
  maxAge: 60,
  text: '你在江湖游历时遇到了...',
  condition: (state) => Math.random() < 0.1, // 10% 概率触发
  weight: 10,
  choices: [
    {
      id: 'meet_master',
      text: '遇到隐世高人',
      effect: (state) => ({
        martialPower: state.martialPower + 10,
      }),
    },
    {
      id: 'find_treasure',
      text: '发现宝藏',
      effect: (state) => ({
        money: state.money + 500,
      }),
    },
  ],
}
```

#### 添加生命周期事件

```typescript
// 新增：人生阶段事件
{
  id: 'life_stage',
  minAge: 20,
  maxAge: 60,
  text: '到了成家立业的年纪...',
  condition: (state) => !state.flags.has('married'),
  weight: 15,
  choices: [
    {
      id: 'get_married',
      text: '结婚生子',
      effect: (state) => ({
        flags: new Set(['married']),
        children: 1,
      }),
    },
    {
      id: 'focus_career',
      text: '专注事业',
      effect: (state) => ({
        money: state.money + 200,
      }),
    },
  ],
}
```

### 方案 3：改进 AI 评分逻辑

#### 当前问题
```typescript
// AI 评分：100/100
aiEvaluation: {
  overallScore: 100.0,
  coherence: 100.0,
  feedbackRelevance: 100.0,
  stateTransitionLogic: 100.0,
  decisionRationality: 100.0,
}
```

**问题**：
- 评分系统只检查逻辑一致性
- 不检查内容多样性
- 不检查事件丰富度

#### 改进方案

```typescript
// 新增评估维度
private evaluateContentDiversity(choiceRecords: ChoiceRecord[]): number {
  const uniqueNodes = new Set(choiceRecords.map(r => r.nodeId)).size;
  const totalRecords = choiceRecords.length;
  
  // 计算多样性得分
  const diversityScore = (uniqueNodes / totalRecords) * 100;
  
  // 如果多样性太低，扣分
  if (diversityScore < 10) {
    return diversityScore * 5; // 最多 50 分
  }
  
  return 100;
}

// 在总体评分中加入多样性权重
overallScore = (
  coherence * 0.3 +
  feedbackRelevance * 0.3 +
  stateTransitionLogic * 0.2 +
  decisionRationality * 0.1 +
  contentDiversity * 0.1  // 新增
);
```

## 📈 改进效果预测

### 改进前
```
12 岁：❌ 缺失
13 岁：🏛️ 门派招新
14 岁：❌ 缺失
15 岁：🏛️ 体魄测试
16 岁：❌ 缺失
17 岁：🏛️ 心性测试
18-80 岁：📅 平静的一年（63 次重复）

总记录数：65 条
独特事件：3 个
多样性得分：4.6%
AI 评分：100/100（虚假高分）
```

### 改进后（预测）
```
12 岁：👶 角色创建
13 岁：🏛️ 门派招新
14 岁：📖 日常修炼
15 岁：🏛️ 体魄测试
16 岁：📖 日常修炼
17 岁：🏛️ 心性测试
18 岁：💕 江湖奇遇
19 岁：💰 打工赚钱
20 岁：💕 结婚生子
21 岁：📖 日常修炼
...
80 岁：👴 寿终正寝

总记录数：70 条
独特事件：15+ 个
多样性得分：21.4%
AI 评分：85/100（真实评分）
```

## 🎯 实施建议

### 优先级 1：修复记录缺失
- ✅ 添加角色创建记录
- ✅ 确保每年都有记录
- ✅ 修复年龄增长逻辑

### 优先级 2：增加事件池
- ✅ 添加日常修炼事件
- ✅ 添加江湖奇遇事件
- ✅ 添加人生阶段事件

### 优先级 3：改进 AI 评分
- ✅ 增加多样性评估
- ✅ 降低逻辑一致性权重
- ✅ 增加内容丰富度权重

---

**分析完成时间**: 2026-03-11  
**问题确认**: ✅ 两个问题都存在  
**建议立即修复**: ⚠️
