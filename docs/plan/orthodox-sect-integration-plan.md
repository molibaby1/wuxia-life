# 正邪阵营与门派系统整合优化计划

## 一、现状问题分析

### 1.1 核心问题
当前系统存在以下设计缺陷：

1. **阵营与门派分离**
   - 玩家可以先加入「正派」门派（如少林、武当），之后又被邀请加入「幽影门」（魔教）
   - `flags.orthodox_member` 和 `flags.demonic_member` 是两套独立的Flag，未建立互斥关系
   - 玩家可能在同一存档中同时触发「正派事件」和「邪派事件」

2. **正邪概念简单化**
   - 「正派」被塑造为道德高尚的代表
   - 「邪派/魔教」被塑造为「邪恶」的代名词
   - 缺乏对「正邪划分」本身的批判性反思

3. **叙事缺乏复杂性**
   - 幽影门（魔教）事件中包含大量「血腥」「残忍」「背信弃义」的描述
   - 没有展现「正派」门派的阴暗面（如少林/武当的历史争议）
   - 「正邪大战」呈现为简单的善恶对立

### 1.2 相关代码位置
- 类型定义: `src/types/eventTypes.ts` (FactionType, sect_choice)
- 身份系统: `src/core/IdentitySystem.ts` (demon/hero 身份)
- 正邪Flag: `flags.orthodox_member`, `flags.demonic_member`, `flags.demonic_corrupted`
- 关键事件文件: `demonic.json`, `orthodox.json`, `good-evil-war.json`, `sect-marginal.json`

---

## 二、修改目标

### 2.1 短期目标（核心机制修改）
1. 建立「门派=阵营」的绑定关系
   - 加入某个门派后，自动获得该门派的「阵营标签」
   - 不同阵营之间互斥，无法同时属于正邪两派

2. 重构阵营Flag系统
   - 用单一的 `player.faction` 或 `flags.sect_faction` 替代分离的Flag
   - 移除 `demonic_member` Flag，改用更中性的标签

### 2.2 中期目标（叙事重构）
3. 重新定义阵营内涵
   - 从「正/邪」改为更中性的标签：如「传统派」「革新派」「中立派」或「庙堂派」「江湖派」
   - 或者保留「正邪」外壳，但重新定义其含义：正派=获得朝廷认可，邪派=未获认可

4. 增加「舆论批判」事件
   - 设计特定事件，让玩家发现「正派」门派的阴暗面（如历史屠杀、内部腐败）
   - 设计事件展现「邪派」门派的合理性（如收留边缘人群、提供社会保障）

### 2.3 长期目标（系统完善）
5. 增加阵营转换成本
   - 退出/转换阵营需要付出代价（如声望下降、属性损失）
   - 但不将其定义为「邪恶」，而是一种「背叛原有立场」

6. 创建门派描述系统
   - 为每个门派创建独立的描述模块
   - 包含：历史背景、核心教义、行为准则、江湖评价

---

## 三、详细实施步骤

### 3.1 阶段一：核心机制重构（第1-2天）

#### 3.1.1 修改类型定义
**文件**: `src/types/eventTypes.ts`

```typescript
// 修改前
export type FactionType = 'orthodox' | 'demon' | 'neutral';

// 修改后 - 两种方案可选

// 方案A：保留正邪但重构
export type FactionType = 'orthodox' | 'unconventional' | 'neutral';
// orthodox: 传统名门正派（少林、武当等）
// unconventional: 非传统门派（幽影门等被定义为"邪"的门派）
// neutral: 不属于任何阵营

// 方案B：完全中性化
export type FactionType = 'traditional' | 'reformist' | 'independent' | 'neutral';
```

#### 3.1.2 修改阵营Flag机制
**文件**: `src/core/EventExecutor.ts` 及相关事件文件

- 移除 `flags.demonic_member` 的独立设置
- 改为：当玩家加入幽影门时，自动设置 `flags.sect_faction = 'unconventional'`
- 添加互斥逻辑：加入新阵营时，自动清除旧阵营Flag

#### 3.1.3 修改正邪大战事件
**文件**: `src/data/lines/good-evil-war.json`

- 重新定义事件触发条件：基于「阵营」而非「是否修炼邪功」
- 文本中增加「反思」元素：让玩家可以选择质疑这场战争的必要性

### 3.2 阶段二：叙事内容修改（第3-5天）

#### 3.2.1 修改幽影门（魔教）相关事件
**文件**: `src/data/lines/demonic.json`, `src/data/lines/identity-demon.json`, `src/data/lines/sect-marginal.json`

**核心修改思路**：

1. **移除「邪恶」标签，改用「非常规」或「非主流」**
   - 「幽影门」保留，但去除「血腥」「残忍」的刻板描述
   - 强调其「不拘泥于传统」「追求实效」的特点

2. **增加内部叙事视角**
   - 幽影门成员如何看待自己？
   - 他们为什么选择这条道路？
   - 他们的「恶」是否是被主流社会逼出来的？

3. **示例修改**：

```json
// 修改前
{
  "title": "加入魔教",
  "text": "你堕入魔道，成为人人得而诛之的魔教弟子..."
}

// 修改后（方案A：保留魔教但增加复杂性）
{
  "title": "加入幽影门",
  "text": "幽影门弟子告诉你：'所谓正邪，不过是庙堂之人书写的历史。我们不求流芳百世，只求问心无愧。江湖传言我们残忍嗜杀，却不知我们收留的尽是被正派逼上绝路的孤儿遗孀。'"
}

// 修改后（方案B：完全重构为非主流门派）
{
  "title": "加入幽影门",
  "text": "幽影门并非外界所言的魔教。百年前，他们原是少林叛徒所创，只因不满少林墨守成规、与官府勾结。他们的武学另辟蹊径，不为统治江湖，只为保持独立。"
}
```

#### 3.2.2 修改正派门派事件
**文件**: `src/data/lines/orthodox.json`, `src/data/lines/sect-shaolin.json`, `src/data/lines/sect-wudang.json`

**增加「发现正派阴暗面」的事件**：

1. **少林寺历史事件**
   - 发现少林历史上曾参与政治清洗
   - 发现少林与朝廷的隐秘交易

2. **武当派事件**
   - 发现武当内部派系斗争
   - 发现武当对弟子的严苛规训

**示例**：

```json
{
  "id": "discover_shaolin_dark_history",
  "title": "少林旧档",
  "text": "你在少林藏经阁偶然发现一份陈旧档案。档案记载，百年前少林曾奉命围剿一支「山贼」，却发现那只是一群逃难的饥民。少林方丈曾下令封口...你开始怀疑，所谓的「正派」，究竟是正，还是只是权力的附庸？",
  "choices": [
    {
      "text": "公开档案，揭露真相",
      "effects": [
        {"type": "stat_modify", "stat": "reputation", "value": -30},
        {"type": "stat_modify", "stat": "chivalry", "value": 10}
      ]
    },
    {
      "text": "保持沉默",
      "effects": [
        {"type": "stat_modify", "stat": "reputation", "value": 10}
      ]
    }
  ]
}
```

### 3.3 阶段三：系统完善（第6-7天）

#### 3.3.1 增加阵营互斥机制
在 `src/core/EventExecutor.ts` 或游戏引擎中添加：

```typescript
// 伪代码
function handleJoinSect(sectId: string) {
  const sectFaction = getSectFaction(sectId); // 获取门派的阵营属性

  // 如果已有阵营，且新阵营不同
  if (player.faction && player.faction !== sectFaction) {
    // 触发阵营转换事件
    triggerEvent('faction_change', {
      oldFaction: player.faction,
      newFaction: sectFaction
    });
  }

  player.faction = sectFaction;
  player.sect = sectId;
}
```

#### 3.3.2 创建门派描述模块
**文件**: 新建 `src/data/sects/sectDescriptions.ts` 或类似结构

```typescript
interface SectDescription {
  id: string;
  name: string;
  faction: FactionType;  // 关联阵营

  // 描述内容
  history: string;           // 历史背景
  doctrine: string;          // 核心教义
  conduct: string;          // 行为准则
  externalView: string;      // 外界评价（可能是负面的）
  internalView: string;      // 内部视角（自我认知）
}

export const sectDescriptions: Record<string, SectDescription> = {
  'shaolin': {
    id: 'shaolin',
    name: '少林寺',
    faction: 'orthodox',
    history: '...',
    doctrine: '...',
    conduct: '...',
    externalView: '武林正宗，武林泰斗',
    internalView: '守护少林千年基业'
  },
  'youting': {  // 幽影门
    id: 'youting',
    name: '幽影门',
    faction: 'unconventional',
    history: '...',
    doctrine: '...',
    conduct: '...',
    externalView: '魔教余孽，江湖大患',
    internalView: '追求武学极致，不屑虚伪正道'
  }
};
```

#### 3.3.3 更新前端显示
**文件**: `src/components/GameScreen.vue`, `src/components/AttributePanel.vue`

- 在玩家属性面板显示当前阵营
- 在门派加入时弹出该门派的描述卡片
- 允许玩家查看各门派的描述（作为游戏内可收集的信息）

---

## 四、风险评估与应对

### 4.1 风险一：现有存档兼容
**风险**：修改阵营Flag可能导致旧存档状态异常

**应对**：
- 设计数据迁移逻辑：自动将旧的 `orthodox_member=true` 映射为 `faction='orthodox'`
- 在游戏启动时检测并提示用户

### 4.2 风险二：事件链断裂
**风险**：修改后的条件判断可能导致某些事件永远无法触发

**应对**：
- 全面审查使用 `demonic_member`、`chivalry` 条件的事件
- 逐一修改为新的阵营判断逻辑

### 4.3 风险三：叙事冲突
**风险**：新增的「反思」事件可能与现有事件产生逻辑矛盾

**应对**：
- 在事件中添加 `flags.ideology_explored` 检查，确保玩家主动探索过后再触发
- 保持核心事件链的完整性

---

## 五、验收标准

### 5.1 功能验收
- [ ] 玩家加入一个门后，自动获得该门派的阵营属性
- [ ] 无法同时拥有正派和邪派身份
- [ ] 切换阵营有明确的代价和事件反馈
- [ ] 门派描述页面可正常显示

### 5.2 叙事验收
- [ ] 幽影门事件中不再包含「魔教」「邪恶」等单一维度的标签
- [ ] 存在让玩家发现「正派阴暗面」的事件
- [ ] 「正邪大战」事件中玩家可以选择质疑战争本身
- [ ] 至少一个门派有两种视角的叙事（外界vs内部）

### 5.3 体验验收
- [ ] 新玩家能理解阵营与门派的关系
- [ ] 阵营选择被视为「人生道路选择」而非「道德审判」
- [ ] 多周目体验有足够差异

---

## 六、优先实施建议

考虑到开发效率，建议按以下优先级实施：

1. **最高优先级**：修复核心Bug（门派-阵营绑定）
2. **高优先级**：幽影门叙事重构 + 新增「发现正派阴暗面」事件
3. **中优先级**：创建门派描述模块
4. **低优先级**：完整重构正邪概念（方案B）

---

*计划版本: 1.0*
*创建日期: 2026-03-17*
