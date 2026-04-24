# 事件系统重构实施方案

## 核心设计理念

### 从"平行宇宙主角"到"统一人生叙事"

**当前问题**：每个身份事件线都假设玩家是该身份的唯一主角，导致多重身份冲突。

**解决方案**：设计统一的人生叙事框架，所有事件服务于同一个核心故事。

---

## 第一部分：人生轨迹追踪系统

### 1.1 数据结构设计

```typescript
interface LifePath {
  // 核心身份（只能有一个）
  primaryIdentity: 'hero' | 'demon' | 'merchant' | 'scholar' | 'hermit' | 
                   'sect_leader' | 'assassin' | 'doctor' | 'beggar' | 'official';
  
  // 阵营立场（二选一）
  faction: 'orthodox' | 'demon' | 'neutral';
  
  // 人生阶段
  lifeStage: 'growth' | 'development' | 'achievement' | 'legacy';
  
  // 重大成就（影响后续事件）
  achievements: string[];
  
  // 重要关系
  relationships: {
    allies: string[];      // 盟友
    enemies: string[];     // 敌人
    mentors: string[];     // 师长
    disciples: string[];   // 弟子
  };
  
  // 承诺与约束（防止矛盾行为）
  commitments: {
    cannotJoin: string[];   // 不能加入的组织
    mustProtect: string[];  // 必须保护的对象
    swornEnemies: string[]; // 誓敌
  };
  
  // 专注度（限制多修）
  focus: {
    martial: number;   // 武学专注度 (0-100)
    business: number;  // 商业专注度 (0-100)
    academic: number;  // 学术专注度 (0-100)
    leadership: number; // 领导力专注度 (0-100)
  };
}
```

### 1.2 实现代码

```typescript
// src/core/LifePathSystem.ts

export class LifePathManager {
  /**
   * 初始化人生轨迹
   */
  static create(): LifePath {
    return {
      primaryIdentity: 'none',
      faction: 'neutral',
      lifeStage: 'growth',
      achievements: [],
      relationships: {
        allies: [],
        enemies: [],
        mentors: [],
        disciples: []
      },
      commitments: {
        cannotJoin: [],
        mustProtect: [],
        swornEnemies: []
      },
      focus: {
        martial: 0,
        business: 0,
        academic: 0,
        leadership: 0
      }
    };
  }
  
  /**
   * 设置核心身份
   */
  static setPrimaryIdentity(state: GameState, identity: string): GameState {
    if (!state.lifePath) {
      state.lifePath = this.create();
    }
    
    // 检查是否可以转换身份
    if (!this.canChangeIdentity(state.lifePath, identity)) {
      console.warn(`无法转换身份：${state.lifePath.primaryIdentity} → ${identity}`);
      return state;
    }
    
    state.lifePath.primaryIdentity = identity;
    return state;
  }
  
  /**
   * 检查身份转换是否合法
   */
  static canChangeIdentity(lifePath: LifePath, newIdentity: string): boolean {
    // 如果已有誓敌，不能转换为敌对阵营身份
    if (lifePath.commitments.swornEnemies.includes('mojiao')) {
      if (newIdentity === 'demon') return false;
    }
    
    // 如果已有必须保护的对象，不能转换为邪恶身份
    if (lifePath.commitments.mustProtect.includes('common_people')) {
      if (newIdentity === 'demon' || newIdentity === 'assassin') return false;
    }
    
    // 专注度检查：如果某项专注度已经很高，不能突然转换
    if (lifePath.focus.martial > 80 && ['merchant', 'scholar'].includes(newIdentity)) {
      return false; // 武学大师不能突然转行
    }
    
    return true;
  }
  
  /**
   * 记录重大成就
   */
  static recordAchievement(state: GameState, achievement: string): GameState {
    if (!state.lifePath) {
      state.lifePath = this.create();
    }
    
    state.lifePath.achievements.push(achievement);
    
    // 根据成就添加承诺
    if (achievement === 'defeated_demon_sect') {
      state.lifePath.commitments.swornEnemies.push('mojiao');
      state.lifePath.faction = 'orthodox';
    }
    
    if (achievement === 'saved_village') {
      state.lifePath.commitments.mustProtect.push('common_people');
    }
    
    return state;
  }
  
  /**
   * 增加专注度
   */
  static addFocus(
    state: GameState, 
    type: 'martial' | 'business' | 'academic' | 'leadership',
    amount: number
  ): GameState {
    if (!state.lifePath) {
      state.lifePath = this.create();
    }
    
    state.lifePath.focus[type] = Math.min(100, state.lifePath.focus[type] + amount);
    return state;
  }
  
  /**
   * 检查事件是否可以触发
   */
  static canTriggerEvent(state: GameState, eventConfig: any): boolean {
    if (!state.lifePath) return true;
    
    const { lifePath } = state;
    
    // 1. 检查阵营兼容性
    if (eventConfig.requirements?.faction) {
      if (lifePath.faction !== eventConfig.requirements.faction && 
          eventConfig.requirements.faction !== 'neutral') {
        return false;
      }
    }
    
    // 2. 检查身份兼容性
    if (eventConfig.requirements?.identity) {
      if (!this.isIdentityCompatible(lifePath.primaryIdentity, eventConfig.requirements.identity)) {
        return false;
      }
    }
    
    // 3. 检查承诺约束
    if (eventConfig.requirements?.cannotHaveCommitment) {
      if (lifePath.commitments.swornEnemies.includes(eventConfig.requirements.cannotHaveCommitment)) {
        return false;
      }
    }
    
    // 4. 检查专注度
    if (eventConfig.requirements?.minFocus) {
      const { type, value } = eventConfig.requirements.minFocus;
      if (lifePath.focus[type] < value) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 检查身份兼容性
   */
  private static isIdentityCompatible(current: string, required: string): boolean {
    const compatibility = {
      hero: ['scholar', 'hermit', 'sect_leader'],
      demon: ['assassin'],
      merchant: ['scholar', 'official', 'doctor'],
      scholar: ['hero', 'merchant', 'doctor', 'hermit'],
      hermit: ['hero', 'scholar', 'doctor'],
      sect_leader: ['hero'],
      assassin: ['demon'],
      doctor: ['scholar', 'merchant', 'hermit'],
      beggar: ['hero', 'hermit'],
      official: ['merchant', 'scholar']
    };
    
    if (current === required) return true;
    return compatibility[current]?.includes(required) || false;
  }
}
```

---

## 第二部分：身份互斥系统

### 2.1 身份兼容性矩阵

```typescript
// src/data/identity-compatibility.ts

export const IdentityCompatibility = {
  // 正道阵营
  hero: {
    compatible: ['scholar', 'hermit', 'sect_leader', 'doctor', 'beggar'],
    neutral: ['merchant', 'official'],
    incompatible: ['demon', 'assassin']
  },
  
  // 魔道阵营
  demon: {
    compatible: ['assassin'],
    neutral: [],
    incompatible: ['hero', 'scholar', 'hermit', 'doctor', 'beggar', 'sect_leader']
  },
  
  // 中立阵营
  merchant: {
    compatible: ['scholar', 'official', 'doctor'],
    neutral: ['hero', 'hermit'],
    incompatible: ['demon', 'assassin', 'beggar']
  },
  
  scholar: {
    compatible: ['hero', 'merchant', 'doctor', 'hermit'],
    neutral: ['official'],
    incompatible: ['demon', 'assassin', 'beggar']
  },
  
  // ... 其他身份
};

/**
 * 检查两个身份是否兼容
 */
export function areIdentitiesCompatible(id1: string, id2: string): boolean {
  const compat = IdentityCompatibility[id1];
  if (!compat) return true;
  
  return compat.compatible.includes(id2) || compat.neutral.includes(id2);
}

/**
 * 获取身份所属阵营
 */
export function getIdentityFaction(identity: string): 'orthodox' | 'demon' | 'neutral' {
  const factions = {
    hero: 'orthodox',
    sect_leader: 'orthodox',
    doctor: 'orthodox',
    beggar: 'orthodox',
    demon: 'demon',
    assassin: 'demon',
    merchant: 'neutral',
    scholar: 'neutral',
    hermit: 'neutral',
    official: 'neutral'
  };
  
  return factions[identity] || 'neutral';
}
```

---

## 第三部分：事件门槛系统

### 3.1 事件要求数据结构

```typescript
interface EventRequirements {
  // 基础属性要求
  attributes?: {
    martialPower?: number;
    externalSkill?: number;
    internalSkill?: number;
    qinggong?: number;
    chivalry?: number;
    reputation?: number;
    comprehension?: number;
    constitution?: number;
    money?: number;
    connections?: number;
  };
  
  // 身份要求
  identity?: string | string[];
  
  // 阵营要求
  faction?: 'orthodox' | 'demon' | 'neutral';
  
  // 年龄范围
  age?: {
    min: number;
    max: number;
  };
  
  // 人生阶段要求
  lifeStage?: 'growth' | 'development' | 'achievement' | 'legacy';
  
  // 专注度要求
  minFocus?: {
    type: 'martial' | 'business' | 'academic' | 'leadership';
    value: number;
  };
  
  // 成就要求（必须完成某些事件）
  requiredAchievements?: string[];
  
  // 承诺检查
  cannotHaveCommitment?: string;  // 不能有此承诺
  mustHaveCommitment?: string;    // 必须有此承诺
  
  // 关系检查
  mustHaveAlly?: string;
  mustHaveEnemy?: string;
  
  // 前置事件
  requiresEvent?: string;  // 必须先触发某事件
}
```

### 3.2 事件要求示例

```typescript
// 创建门派事件
{
  id: 'career_create_sect',
  name: '开宗立派',
  requirements: {
    attributes: {
      martialPower: 70,      // 一流高手
      reputation: 50,        // 有一定名望
      chivalry: 40,          // 侠义值（正道）
      money: 200,            // 资金支持
      connections: 30        // 人脉关系
    },
    identity: ['hero', 'sect_leader'],
    faction: 'orthodox',
    age: { min: 30, max: 50 },
    lifeStage: 'development',
    minFocus: {
      type: 'leadership',
      value: 50
    },
    requiredAchievements: ['defeated_rival', 'saved_disciple'],
    requiresEvent: 'hero_fight_evil'  // 必须先有行侠仗义的经历
  }
}

// 加入魔教事件
{
  id: 'demon_join_sect',
  name: '加入魔教',
  requirements: {
    attributes: {
      chivalry: -20,         // 侠义值为负
      martialPower: 30
    },
    identity: ['demon', 'assassin'],
    faction: 'demon',
    age: { min: 18, max: 35 },
    lifeStage: 'growth',
    cannotHaveCommitment: 'mojiao',  // 不能与魔教有仇
    mustHaveCommitment: 'power'      // 必须有追求力量的承诺
  }
}

// 剿灭魔教事件
{
  id: 'career_destroy_demon_sect',
  name: '剿灭魔教',
  requirements: {
    attributes: {
      martialPower: 80,      // 绝顶高手
      reputation: 70,        // 声望卓著
      chivalry: 60           // 侠义值高
    },
    identity: ['hero', 'sect_leader'],
    faction: 'orthodox',
    age: { min: 35, max: 60 },
    lifeStage: 'achievement',
    minFocus: {
      type: 'leadership',
      value: 70
    },
    mustHaveCommitment: 'mojiao',  // 必须与魔教有仇
    requiredAchievements: ['defeated_demon_elder']
  }
}
```

---

## 第四部分：事件线重构方案

### 4.1 核心原则

1. **一个主角，一条主线**
   - 每个玩家只有一个核心身份
   - 所有事件围绕核心身份展开
   - 副身份事件不能与主身份冲突

2. **渐进式成长**
   ```
   新手 (0-20 岁) → 高手 (21-35 岁) → 宗师 (36-55 岁) → 传奇 (56-80 岁)
   ```

3. **选择有代价**
   - 选择正道就不能加入魔教
   - 专注武学就会忽略商业
   - 每个选择都有机会成本

4. **事件有门槛**
   - 重大事件需要属性达标
   - 需要前置事件铺垫
   - 需要符合身份和阵营

### 4.2 重构步骤

#### 步骤 1：修改事件触发逻辑

```typescript
// src/core/EventTrigger.ts

export class EventTriggerManager {
  static canTrigger(
    event: EventDefinition,
    state: GameState
  ): boolean {
    // 1. 基础检查（年龄、触发器）
    if (!this.checkBasicRequirements(event, state)) {
      return false;
    }
    
    // 2. 人生轨迹检查（新增）
    if (state.lifePath && !LifePathManager.canTriggerEvent(state, event)) {
      return false;
    }
    
    // 3. 属性门槛检查（新增）
    if (event.requirements?.attributes) {
      if (!this.checkAttributes(event.requirements.attributes, state.player)) {
        return false;
      }
    }
    
    // 4. 身份兼容性检查（新增）
    if (event.requirements?.identity) {
      if (!this.checkIdentityCompatibility(event.requirements.identity, state)) {
        return false;
      }
    }
    
    // 5. 前置事件检查（新增）
    if (event.requirements?.requiresEvent) {
      if (!state.flags[event.requirements.requiresEvent]) {
        return false;
      }
    }
    
    return true;
  }
}
```

#### 步骤 2：重构身份事件线

为每个身份事件线添加：
- 明确的阵营标签
- 身份兼容性检查
- 属性门槛
- 前置事件依赖

示例（重构魔教事件线）：

```typescript
// src/data/lines/identity-demon.json (重构版)

[
  {
    "id": "demon_join_sect",
    "name": "加入魔教",
    "requirements": {
      "faction": "demon",
      "identity": ["demon", "assassin"],
      "attributes": {
        "chivalry": { "max": 0 }  // 侠义值必须 <= 0
      },
      "cannotHaveCommitment": "mojiao"
    },
    "effects": [
      {
        "type": "set_faction",
        "value": "demon"
      },
      {
        "type": "flag_set",
        "target": "joined_demon_sect",
        "value": true
      }
    ]
  },
  {
    "id": "demon_elder_promotion",
    "name": "成为长老",
    "requirements": {
      "faction": "demon",
      "flags": {
        "required": ["joined_demon_sect"]
      },
      "attributes": {
        "martialPower": 60
      }
    }
  }
]
```

#### 步骤 3：添加阵营系统

```typescript
// src/core/FactionSystem.ts

export class FactionManager {
  static setFaction(state: GameState, faction: 'orthodox' | 'demon' | 'neutral'): GameState {
    if (!state.lifePath) {
      state.lifePath = LifePathManager.create();
    }
    
    // 检查是否可以转换阵营
    if (state.lifePath.faction !== 'neutral' && state.lifePath.faction !== faction) {
      // 已经有阵营，不能随意转换
      if (state.lifePath.commitments.swornEnemies.length > 0) {
        throw new Error('已有誓敌，无法转换阵营');
      }
    }
    
    state.lifePath.faction = faction;
    return state;
  }
  
  static areFactionsCompatible(f1: string, f2: string): boolean {
    if (f1 === 'neutral' || f2 === 'neutral') return true;
    return f1 === f2;
  }
}
```

---

## 第五部分：实施计划

### 阶段 1：基础框架（1-2 天）

- [ ] 实现 `LifePathManager`
- [ ] 实现 `FactionManager`
- [ ] 实现身份兼容性检查
- [ ] 修改事件触发逻辑

### 阶段 2：重构事件线（3-4 天）

- [ ] 重构 identity-hero.json
- [ ] 重构 identity-demon.json
- [ ] 重构 career 事件线
- [ ] 添加属性门槛

### 阶段 3：测试验证（1-2 天）

- [ ] 运行模拟测试
- [ ] 检查逻辑矛盾
- [ ] 调整平衡性
- [ ] 编写测试报告

---

## 预期效果

### 重构前的问题

```
❌ 37 岁成为英雄
❌ 43 岁剿灭魔教
❌ 53 岁成为魔教长老 ← 矛盾！
```

### 重构后的效果

**正道线**：
```
✅ 18 岁：立志加入正道
✅ 25 岁：行侠仗义，初露锋芒
✅ 35 岁：创建门派，成为掌门
✅ 45 岁：率众剿灭魔教
✅ 55 岁：成为武林盟主
✅ 70 岁：功成身退，成为传奇
```

**魔道线**：
```
✅ 18 岁：加入魔教
✅ 25 岁：成为堂主
✅ 35 岁：成为长老
✅ 45 岁：争夺教主之位
✅ 55 岁：一统魔教
✅ 70 岁：魔道至尊
```

**中立线（商人）**：
```
✅ 18 岁：从商
✅ 25 岁：建立商队
✅ 35 岁：富甲一方
✅ 45 岁：商业帝国
✅ 55 岁：商会会长
✅ 70 岁：商道传奇
```

每条线都**逻辑连贯、身份一致、成长合理**！
