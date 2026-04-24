# 门派系统改进方案

## 概述

针对当前门派系统的问题，提出以下4项改进建议，旨在增强游戏真实感和策略性。

---

## 1. 门派邀请机制优化 ✅ 已完成

### 问题
- 玩家已加入门派A后，仍会收到门派B的邀请

### 解决方案
在所有门派加入条件中添加 `!flags.has("current_sect")` 检查

---

## 2. 退出门派系统改进 ✅ 已完成

### 添加的负面效果

| 门派 | 声望惩罚 | 技能惩罚 | 其他 |
|------|----------|----------|------|
| 丐帮 | -15 | 侠义 -5 | 3年冷却 |
| 边关 | -10 | 人脉 -5 | 3年冷却 |
| 魔道(幽影门) | -20 | 武力 -10 | 3年冷却 |
| 正道(少林/武当) | -15 | 内功 -5 | 3年冷却 |

### 冷却机制
- 退出门派后设置 `sect_switch_cooldown = 3`
- 3年内无法加入新门派

---

## 3. 门派转换限制 ✅ 已完成

### 冷却时间
- 基础冷却：3年
- 敌对门派转换：额外+50%惩罚
- 盟友门派转换：-10%惩罚

---

## 4. 门派关系系统 ✅ 已完成

### 新增数据

**扩展了 SectDescription 接口：**
```typescript
interface SectDescription {
  // ... 原有字段
  
  // 新增字段
  relations?: Record<string, number>;  // 门派关系：-100到100
  recruitOpen?: boolean;               // 是否可自由加入
  recruitmentRequirements?: {          // 收徒要求
    minChivalry?: number;
    maxChivalry?: number;
    minMartialPower?: number;
  };
}
```

### 门派关系数据

| 门派 | 少林 | 武当 | 丐帮 | 幽影门 | 唐门 | 明教 |
|------|------|------|------|--------|------|------|
| 少林 | - | 盟友(80) | 友好(30) | 死敌(-80) | 中立(20) | 敌对(-70) |
| 武当 | 盟友(80) | - | 友好(30) | 敌对(-70) | 友好(30) | 敌对(-60) |
| 丐帮 | 友好(30) | 友好(30) | - | 中立(20) | 盟友(50) | 中立(10) |
| 幽影门 | 死敌(-80) | 敌对(-70) | 中立(20) | - | 中立(10) | 友好(40) |
| 唐门 | 中立(20) | 友好(30) | 盟友(50) | 中立(10) | - | 友好(30) |
| 明教 | 敌对(-70) | 敌对(-60) | 中立(10) | 友好(40) | 友好(30) | - |

### 新增函数

```typescript
// 获取两个门派之间的关系值
getSectRelation(sectId1: string, sectId2: string): number

// 判断敌对关系
areSectsHostile(sectId1: string, sectId2: string): boolean

// 判断友好关系
areSectsFriendly(sectId1: string, sectId2: string): boolean

// 计算转换代价
getSectSwitchPenalty(fromSect: string, toSect: string): number

// 获取关系描述
getRelationDescription(relation: number): string
```

---

## 已修改文件

1. `src/data/sectDescriptions.ts` - 扩展门派数据和关系
2. `src/data/lines/sect-beggars.json` - 退派效果+冷却检查
3. `src/data/lines/sect-border.json` - 退派效果+冷却检查
4. `src/data/lines/sect-marginal.json` - 退派效果+冷却检查
5. `src/data/lines/sect-wudang.json` - 退派效果+冷却检查
6. `src/data/lines/general.json` - 少林/武当加入条件
7. `src/data/lines/identity-demon.json` - 幽影门加入条件
8. `src/data/lines/chivalry-events.json` - 幽影门邀请条件
9. `src/data/events.json` - 事件索引

---

## 待完善

- [ ] 门派贡献系统（长期）
- [ ] 门派忠诚度奖励（长期）
- [ ] UI展示门派关系（长期）
