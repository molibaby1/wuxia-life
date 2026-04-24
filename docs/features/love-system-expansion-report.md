# 多阶段爱情系统实现报告

**实现时间**: 2026-03-14  
**需求来源**: 用户反馈"爱情线年龄限制太窄，错过了就要终老一生不合理"  
**实现状态**: ✅ 已完成

---

## 📋 需求分析

### 原始问题
> "我还是觉得很多事件的年龄限制太窄，比如爱情线，当然是年轻的时候更容易触发，但是一旦错过了就要终老一生似乎也不太合理，是否可以增加其他可能性，比如比较大的年纪以后一样可以有适合他的爱情故事，后续甚至可以包含婚外情一类的情况."

### 核心诉求
1. ✅ **扩展年龄范围**：不只年轻人有爱情
2. ✅ **增加可能性**：错过初恋后还有其他机会
3. ✅ **中年爱情**：适合大龄玩家的情感线
4. ✅ **特殊情感**：包含婚外情等复杂情况

---

## 🎯 实现方案

### 方案 1: 扩展原有爱情线年龄范围

**修改文件**: `src/data/lines/love.json`

**修改内容**:
```json
{
  "id": "love_first_meet",
  "ageRange": { "min": 15, "max": 20 } → { "min": 15, "max": 35 },
  "triggers": [{"type": "age_reach", "value": 15}] → [
    {"type": "age_reach", "value": 15},
    {"type": "random", "value": 0.2}
  ],
  "conditions": ["!flags.has(\"love_started\") && player.charisma >= 12"] → [
    "!flags.has(\"love_started\") && !flags.has(\"love_mature_started\") && !flags.has(\"love_elderly_started\") && player.charisma >= 10"
  ]
}
```

**效果**:
- 初恋触发年龄从 15-20 岁扩展到 15-35 岁
- 魅力要求从 12 降低到 10，更容易触发
- 增加了随机触发机制（20% 概率）
- 添加了与其他爱情线的互斥检查

---

### 方案 2: 创建多阶段爱情系统

**新增文件**: `src/data/lines/love-mature.json`

**包含阶段**:

#### 1. 成熟之恋（30-45 岁）
- **事件数**: 2 个
- **触发条件**: 未婚，30 岁
- **特色**: 成熟的爱情更加稳重
- **属性加成**: 魅力 +5~13, 侠义 +3~8

#### 2. 再续前缘（35-55 岁）
- **事件数**: 1 个
- **触发条件**: 情史结束（flags.love_ended）
- **特色**: 爱情不会只来一次
- **属性加成**: 魅力 +6, 体质 +5

#### 3. 婚外情缘（35-60 岁）⭐
- **事件数**: 2 个
- **触发条件**: 已婚，魅力≥50
- **特色**: 道德困境，选择有代价
- **属性影响**:
  - 坚守底线：侠义 +15, 魅力 +5 ✅
  - 陷入情网：侠义 -20, 魅力 +8 ⚠️
  - 坦白：侠义 +5

#### 4. 黄昏情缘（55-75 岁）
- **事件数**: 2 个
- **触发条件**: 未婚，55 岁
- **特色**: 相濡以沫的感情
- **属性加成**: 魅力 +10~22, 健康 +20~45

#### 5. 重逢旧爱（45-70 岁）
- **事件数**: 1 个
- **触发条件**: 当年错过初恋（flags.love_first_meet_pass）
- **特色**: 弥补年轻时的遗憾
- **属性加成**: 魅力 +5~13, 侠义 +3~8

**总计**: 8 个事件，覆盖 30-80 岁年龄段

---

## 📊 技术实现

### Flag 系统设计

**新增 13 个 Flags**:

| Flag 名称 | 含义 | 触发事件 |
|----------|------|---------|
| `love_mature_started` | 成熟之恋开始 | love_mature_first |
| `love_mature_bonded` | 成熟之恋发展 | love_mature_bond |
| `love_second_chance` | 再续前缘 | love_second_chance |
| `love_affair` | 有婚外情 | love_affair_yield |
| `love_affair_resisted` | 拒绝婚外情 | love_affair_resist |
| `love_affair_confessed` | 坦白婚外情 | love_affair_confess |
| `love_affair_exposed` | 婚外情暴露 | love_affair_consequence |
| `love_divorced` | 离婚 | love_affair_divorce |
| `love_elderly_started` | 黄昏恋开始 | love_elderly_companion |
| `love_elderly_friend` | 老年知己 | love_elderly_friend |
| `love_elderly_memories` | 老年回忆 | love_elderly_memories |
| `love_reunion_old` | 重逢旧爱 | love_reunion_accept |
| `love_reunion_friend` | 重逢后做朋友 | love_reunion_friend |
| `love_reunion_ignored` | 重逢后相忘 | love_reunion_ignore |

### 条件检查机制

**互斥检查示例**:
```typescript
// 确保不会同时触发多条爱情线
"!flags.has(\"love_started\") && !flags.has(\"love_mature_started\") && !flags.has(\"love_elderly_started\")"
```

**前置条件示例**:
```typescript
// 婚外情需要已有伴侣
"(flags.has(\"love_started\") || flags.has(\"love_married\")) && player.charisma >= 50"

// 重逢旧爱需要当年错过
"flags.has(\"love_first_meet_pass\")"
```

### 后果系统

**婚外情后果链**:
```
love_affair_temptation (选择陷入情网)
  ↓
  flags.love_affair = true
  侠义 -20, 现任好感 -30, 情人好感 +25
  ↓
love_affair_consequence (36 岁自动触发)
  ↓
  选择 1: 结束婚外情 → 侠义 +5, 声望 -15, 情人好感 -50
  选择 2: 离婚 → 侠义 -15, 声望 -30, 金钱 -200, 离婚
```

---

## ✅ 验证结果

### 文件验证
```bash
✓ love-mature.json 验证通过
事件数量：8

新增爱情阶段:
 - love_mature_first (30-45 岁): 成熟之恋
 - love_mature_bond (31-50 岁): 相知相守
 - love_second_chance (35-55 岁): 再续前缘
 - love_affair_temptation (35-60 岁): 婚外情缘
 - love_affair_consequence (36-62 岁): 东窗事发
 - love_elderly_companion (55-75 岁): 黄昏情缘
 - love_elderly_memories (60-80 岁): 执子之手
 - love_reunion_old (45-70 岁): 重逢旧爱
```

### 游戏测试
- ✅ 事件加载成功
- ✅ 年龄范围正确
- ✅ 条件检查正常
- ✅ Flag 系统工作正常

---

## 🎯 设计亮点

### 1. 包容性强
- 不限制爱情发生的年龄（15-80 岁全覆盖）
- 不限制爱情的形式（初恋、成熟恋、黄昏恋）
- 尊重玩家的选择权（包括婚外情等复杂情况）

### 2. 真实性高
- 包含婚外情等真实情感困境
- 每个选择都有相应后果
- 符合人性的复杂性

### 3. 文案优美
- "成熟的爱情不需要轰轰烈烈，只需相知相守"
- "最浪漫的事，就是和你一起慢慢变老"
- "有些缘分，注定要等待"

### 4. 平衡性好
- 不同阶段的爱情有不同的属性加成
- 年轻时的爱情加成魅力，老年的爱情加成健康
- 婚外情虽然诱人，但代价巨大（侠义 -20，声望 -30）

### 5. 后果系统完善
- 婚外情会暴露
- 离婚会损失金钱和声望
- 坚守底线会获得侠义加成

---

## 📈 对比改进

### 改进前
- 爱情线年龄：15-20 岁
- 错过初恋：终老一生
- 中年爱情：❌ 不存在
- 老年爱情：❌ 不存在
- 婚外情：❌ 不存在
- 重逢旧爱：❌ 不存在

### 改进后
- 爱情线年龄：15-80 岁全覆盖
- 错过初恋：30 岁有成熟之恋，45 岁可重逢旧爱
- 中年爱情：✅ 成熟之恋（30-45 岁）
- 老年爱情：✅ 黄昏情缘（55-75 岁）
- 婚外情：✅ 包含，有完整后果链
- 重逢旧爱：✅ 包含，弥补遗憾

---

## 🎉 总结

**核心成果**:
- ✅ 成功实现了多阶段爱情系统
- ✅ 覆盖了 15-80 岁全年龄段
- ✅ 包含 8 个新的爱情事件
- ✅ 新增 13 个 Flags 用于追踪状态
- ✅ 完善了后果系统
- ✅ 显著提升了游戏的真实性和代入感

**设计理念**:
> **爱情不是年轻人的专利，每个年龄段都有属于自己的浪漫。**

**玩家体验提升**:
- 年轻时错过，不再是一生遗憾
- 中年时的爱情更加成熟稳重
- 老年时的相伴更加珍贵
- 每个选择都有意义，每段感情都值得珍惜

**后续建议**:
1. 扩展更多爱情线（师徒恋、异国恋等）
2. 增加互动事件（与恋人的日常互动、共同任务）
3. 完善后果系统（婚外情的子女关系影响等）
4. 添加成就系统（"白头偕老"、"情圣"等）

---

**文件位置**: 
- `src/data/lines/love-mature.json` (新增)
- `src/data/lines/love.json` (修改)
- `docs/features/multi-stage-love-system.md` (说明文档)

**事件数量**: 8 个  
**年龄覆盖**: 30-80 岁  
**测试状态**: ✅ 验证通过  
**实现状态**: ✅ 完成
