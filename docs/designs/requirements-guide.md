# 事件 Requirements 添加指南

## 已完成的事件

### ✅ 英雄事件线（部分完成）

#### hero_first_case（初出茅庐）
```json
{
  "requirements": {
    "faction": "orthodox",
    "identity": ["hero"],
    "attributes": {
      "chivalry": { "min": 10 },
      "martialPower": { "min": 20 }
    },
    "lifeStage": "growth"
  }
}
```

**设计思路**：
- 必须是正道阵营
- 侠义值至少 10（有正义感）
- 武力至少 20（有一定实力）
- 人生阶段为成长期（0-20 岁）

#### hero_save_village（拯救村庄）
```json
{
  "requirements": {
    "faction": "orthodox",
    "identity": ["hero"],
    "attributes": {
      "chivalry": { "min": 20 },
      "martialPower": { "min": 30 }
    },
    "lifeStage": "development",
    "requiredAchievements": ["hero_first_case"]
  }
}
```

**设计思路**：
- 需要前置事件（hero_first_case）
- 侠义值提升到 20
- 武力提升到 30（能够对抗马贼）
- 人生阶段为发展期（21-35 岁）

---

## 待添加的事件模板

### 魔教事件线 requirements 模板

#### demon_join_sect（加入魔教）
```json
{
  "requirements": {
    "faction": "demon",
    "identity": ["demon", "assassin"],
    "attributes": {
      "chivalry": { "max": 0 },
      "martialPower": { "min": 20 }
    },
    "lifeStage": "growth",
    "cannotHaveCommitment": "mojiao"
  }
}
```

**效果**：
- 只有魔道阵营可以触发
- 侠义值必须 <= 0（没有正义感）
- 不能与魔教有仇

#### demon_elder_promotion（成为长老）
```json
{
  "requirements": {
    "faction": "demon",
    "identity": ["demon"],
    "attributes": {
      "martialPower": { "min": 60 },
      "chivalry": { "max": -10 }
    },
    "lifeStage": "development",
    "requiredAchievements": ["joined_demon_sect"],
    "minFocus": {
      "type": "martial",
      "value": 50
    }
  }
}
```

**效果**：
- 必须已经加入魔教
- 武力达到 60（一流高手）
- 侠义值为负（心狠手辣）
- 武学专注度达到 50

---

### 事业事件线 requirements 模板

#### career_create_sect（创建门派）
```json
{
  "requirements": {
    "faction": "orthodox",
    "identity": ["hero", "sect_leader"],
    "attributes": {
      "martialPower": { "min": 70 },
      "reputation": { "min": 50 },
      "chivalry": { "min": 40 },
      "money": { "min": 200 },
      "connections": { "min": 30 }
    },
    "lifeStage": "development",
    "minFocus": {
      "type": "leadership",
      "value": 50
    },
    "requiredAchievements": ["defeated_rival", "saved_disciple"]
  }
}
```

**设计思路**：
- 必须是正道
- 武力 70（一流高手才能开宗立派）
- 声望 50（有一定名望）
- 资金 200（建设门派需要钱）
- 人脉 30（需要有人支持）
- 领导力专注度 50
- 前置成就：击败对手、救过弟子

#### career_destroy_demon_sect（剿灭魔教）
```json
{
  "requirements": {
    "faction": "orthodox",
    "identity": ["hero", "sect_leader"],
    "attributes": {
      "martialPower": { "min": 80 },
      "reputation": { "min": 70 },
      "chivalry": { "min": 60 }
    },
    "lifeStage": "achievement",
    "minFocus": {
      "type": "leadership",
      "value": 70
    },
    "mustHaveCommitment": "mojiao",
    "requiredAchievements": ["defeated_demon_elder"]
  }
}
```

**设计思路**：
- 必须是正道领袖
- 武力 80（绝顶高手）
- 声望 70（武林盟主级别）
- 必须与魔教有仇
- 前置成就：击败过魔教长老

---

### 学者事件线 requirements 模板

#### scholar_write_book（著书立说）
```json
{
  "requirements": {
    "identity": ["scholar", "hero", "hermit"],
    "attributes": {
      "comprehension": { "min": 60 },
      "reputation": { "min": 30 }
    },
    "lifeStage": "development",
    "minFocus": {
      "type": "academic",
      "value": 50
    }
  }
}
```

#### scholar_master_work（传世之作）
```json
{
  "requirements": {
    "identity": ["scholar"],
    "attributes": {
      "comprehension": { "min": 80 },
      "reputation": { "min": 60 }
    },
    "lifeStage": "achievement",
    "minFocus": {
      "type": "academic",
      "value": 80
    },
    "requiredAchievements": ["write_book"]
  }
}
```

---

### 商人事件线 requirements 模板

#### merchant_start_business（开始从商）
```json
{
  "requirements": {
    "identity": ["merchant"],
    "attributes": {
      "money": { "min": 50 },
      "connections": { "min": 20 }
    },
    "lifeStage": "growth",
    "minFocus": {
      "type": "business",
      "value": 30
    }
  }
}
```

#### merchant_empire（商业帝国）
```json
{
  "requirements": {
    "identity": ["merchant"],
    "attributes": {
      "money": { "min": 500 },
      "connections": { "min": 80 },
      "reputation": { "min": 60 }
    },
    "lifeStage": "achievement",
    "minFocus": {
      "type": "business",
      "value": 80
    }
  }
}
```

---

## Requirements 字段说明

### faction（阵营要求）
- `"orthodox"` - 正道
- `"demon"` - 魔道
- `"neutral"` - 中立（或不限制）

### identity（身份要求）
```json
"identity": "hero"           // 单一身份
"identity": ["hero", "scholar"]  // 多个身份之一
```

### attributes（属性要求）
```json
"attributes": {
  "chivalry": { "min": 20, "max": 50 },  // 范围
  "martialPower": { "min": 30 },          // 最小值
  "money": 100                            // 简写形式（>= 100）
}
```

### lifeStage（人生阶段）
- `"growth"` - 成长期（0-20 岁）
- `"development"` - 发展期（21-35 岁）
- `"achievement"` - 成就期（36-55 岁）
- `"legacy"` - 传承期（56-80 岁）

### minFocus（最小专注度）
```json
"minFocus": {
  "type": "martial",      // martial/business/academic/leadership
  "value": 50
}
```

### requiredAchievements（前置成就）
```json
"requiredAchievements": ["hero_first_case", "save_village"]
```

### cannotHaveCommitment（不能有此承诺）
```json
"cannotHaveCommitment": "mojiao"  // 不能与魔教有仇
```

### mustHaveCommitment（必须有此承诺）
```json
"mustHaveCommitment": "mojiao"  // 必须与魔教有仇
```

---

## 添加 Requirements 的步骤

### 步骤 1：分析事件内容
- 确定事件的阵营倾向
- 确定需要的身份
- 估算需要的属性水平
- 确定人生阶段
- 确定是否需要前置事件

### 步骤 2：编写 requirements
```json
"requirements": {
  "faction": "orthodox",
  "identity": ["hero"],
  "attributes": {
    "chivalry": { "min": 20 },
    "martialPower": { "min": 30 }
  },
  "lifeStage": "development"
}
```

### 步骤 3：添加选择 ID 和 lifepath 效果
```json
"choices": [
  {
    "id": "fight_alone",
    "effects": [
      { "type": "stat_modify", ... },
      { 
        "type": "lifepath_add_focus",
        "focusType": "martial",
        "value": 10
      }
    ]
  }
]
```

### 步骤 4：测试验证
```bash
npx tsx scripts/life-simulator/simulator.ts --years=80
node scripts/analyze-identity-karma.cjs
```

---

## 优先级列表

### 高优先级（必须添加）
1. ✅ hero_first_case
2. ✅ hero_save_village
3. ⏳ hero_fight_evil
4. ⏳ demon_join_sect
5. ⏳ demon_elder_promotion
6. ⏳ career_good_evil_war

### 中优先级（建议添加）
7. ⏳ career_create_sect
8. ⏳ career_destroy_demon_sect
9. ⏳ scholar_write_book
10. ⏳ merchant_start_business

### 低优先级（可以后加）
11. ⏳ 家庭事件
12. ⏳ 老年事件
13. ⏳ 通用事件

---

## 注意事项

1. **不要设置过高的门槛**
   - 确保玩家能够在合理年龄达到
   - 避免"永远无法触发"的事件

2. **保持一致性**
   - 同类事件的门槛应该相近
   - 成长曲线应该平滑

3. **考虑多周目**
   - 不同的选择应该导致不同的事件线
   - 避免"最优解"

4. **测试验证**
   - 每次添加 requirements 后都要测试
   - 确保不会意外阻止事件触发

---

## 总结

通过为事件添加 requirements，我们可以：
- ✅ 消除逻辑矛盾
- ✅ 建立成长阶梯
- ✅ 确保叙事连贯
- ✅ 提升玩家体验

这是事件系统重构的关键一步！
