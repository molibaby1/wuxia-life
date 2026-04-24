# 属性与身份系统设计文档

## 一、新属性体系设计

### 1.1 现有属性分析

当前已有属性：
- `martialPower` - 武力值
- `externalSkill` - 外功
- `internalSkill` - 内功
- `qinggong` - 轻功
- `chivalry` - 侠义值
- `constitution` - 体质
- `comprehension` - 悟性
- `reputation` - 声望
- `money` - 金钱
- `connections` - 人脉

### 1.2 新增属性设计

```typescript
// 社会属性（扩展）
knowledge: number;        // 学识 (0-100) - 影响科举、仕途
charisma: number;         // 魅力 (0-100) - 影响人际关系、仕途
businessAcumen: number;   // 商业头脑 (0-100) - 影响商业活动
influence: number;        // 影响力 (0-100) - 江湖地位

// 特殊属性
martialHeritage: number;  // 武学传承 (0-100) - 武林世家背景加成
scholarlyHeritage: number; // 书香传承 (0-100) - 书香门第背景加成
merchantNetwork: number;   // 商脉 (0-100) - 商人身份专用
```

## 二、身份标签系统设计

### 2.1 身份类型

```typescript
type IdentityType = 
  | 'warrior'      // 武林人士
  | 'scholar'      // 文人墨客
  | 'merchant'     // 商贾
  | 'official'     // 官员
  | 'hermit'       // 隐士
  | 'beggar'       // 丐帮
  | 'sectLeader'   // 掌门
  | 'healer'       // 医者
  | 'assassin'     // 杀手
  | 'commoner'     // 普通百姓
  | 'frontier'     // 边关将士
  | 'bandit'       // 山贼
  | 'none';        // 无特定身份
```

### 2.2 身份存储结构

```typescript
interface PlayerIdentity {
  type: IdentityType | IdentityType[];  // 支持多身份
  title?: string;                       // 称号
  reputation?: number;                  // 身份相关声望
  achievements?: string[];              // 成就记录
}

// 使用 Set 存储多身份
identities: Set<IdentityType>;
```

## 三、基础剧情模块设计

### 3.1 平凡剧情模块 (commoner_year)

适用于无特定身份或普通百姓身份的角色

**分支类型：**
1. **劳作生活** - 耕种、经商、学徒
   - 收获季节 → 体质+
   - 生意兴隆 → 金钱+, 人脉+
   
2. **人际交往** - 邻里、红白喜事
   - 邻里和睦 → 魅力+
   - 热心助人 → 侠义值+
   
3. **意外机遇** - 偶遇贵人、发现商机
   - 商人赏识 → 商脉+, 商业头脑+
   - 武者指点 → 武力+

### 3.2 商人剧情模块 (merchant_year)

适用于商人身份

**分支类型：**
1. **商业活动** - 进货、销售、谈判
   - 成功交易 → 金钱+, 商誉+
   - 谈判破裂 → 人脉-
   
2. **商业危机** - 欺诈、竞争、灾难
   - 化解危机 → 商业头脑+, 商誉+
   - 损失惨重 → 金钱-
   
3. **扩展人脉** - 参加商会、结识权贵
   - 结识贵人 → 人脉+, 影响力+

### 3.3 江湖剧情模块 (jianghu_year)

适用于武林人士身份

**分支类型：**
1. **行侠仗义** - 除暴安良、护镖
   - 成功 → 侠义值+, 声望+
   
2. **江湖恩怨** - 复仇、寻仇
   - 解决恩怨 → 江湖声望+
   - 结下新仇 → 江湖声望-
   
3. **武学精进** - 闭关修炼、比武
   - 突破 → 武力+, 悟性+
   - 失败 → 武力-

## 四、属性提升规则

### 4.1 属性范围
- 所有属性范围：0-100
- 初始值：10-20（根据出身背景浮动）
- 成长系数：根据身份和活动类型

### 4.2 提升规则
```typescript
// 基础提升
attributeChange = baseValue * (1 + heritageBonus) * (1 + talentBonus)

// 背景加成
if (origin === 'scholar_family') scholarlyHeritage += 5;

// 身份加成
if (identities.has('merchant')) merchantNetwork += 3;

// 上限限制
Math.min(100, newValue);
```

---

## 实施计划

### Phase 1: 属性系统
- [ ] 在 PlayerState 中添加新属性
- [ ] 在初始状态中设置默认值
- [ ] 创建属性提升工具函数

### Phase 2: 身份系统
- [ ] 扩展 PlayerIdentity 类型
- [ ] 修改 GameState 存储结构
- [ ] 实现多身份管理方法

### Phase 3: 基础剧情
- [ ] 创建平凡剧情模块
- [ ] 创建商人剧情模块
- [ ] 创建江湖剧情模块

### Phase 4: 属性关联
- [ ] 为剧情添加属性效果
- [ ] 配置触发条件
- [ ] 测试验证
