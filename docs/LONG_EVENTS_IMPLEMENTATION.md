# 多阶段长事件实现完成

## 问题修复

### 1. ✅ 长事件从未触发
**原因**: JSON 文件只是数据，没有被集成到游戏中  
**解决**: 创建了独立的 TypeScript 文件 `longEvents.ts`，直接导出为 StoryNode 数组

### 2. ✅ 门派剧情混乱
**原因**: 之前的剧情没有正确区分门派  
**解决**: 
- 少林派：体魄测试（举石锁），方丈接见，传易经经
- 武当派：体魄测试（太极拳），道长接见，传太极心法
- 峨眉派：体魄测试（剑法），灭绝师太接见，传峨眉剑法

### 3. ✅ 独立实现
所有长事件都已独立实现为 TypeScript 代码，可以直接运行

## 已实现的长事件

### 1. 门派入门事件 (11 个节点)
**触发条件**: 12-16 岁，未加入任何门派

**流程**:
1. 门派招新公告 → 选择门派
2. 体魄测试（根据门派不同测试内容不同）
   - 少林：举石锁（外功）
   - 武当：打太极（内力）
   - 峨眉：舞剑法（外功）
3. 心性测试（通用）→ 回答问题
4. 录取/失败结果
   - 成功：加入对应门派，获得门派加成
   - 失败：转为自学成才路线

**关键 flag**:
- `appliedShaolin` / `appliedWudang` / `appliedEmei`: 申请的门派
- `physicalPass` / `physicalFail`: 体魄测试结果
- `mentalPass`: 心性测试通过
- `selfTaught`: 自学成才

---

### 2. 武林大会事件 (8 个节点)
**触发条件**: 18-35 岁，武功≥25

**流程**:
1. 大会公告 → 选择参加/旁观/不感兴趣
2. 初赛 → 对战彪形大汉
   - 谨慎应战（需要武功 30+）
   - 主动进攻（高风险高回报）
3. 半决赛 → 对战峨眉女侠
   - 轻功取胜（轻功 20+）
   - 力量取胜（武功 45+）
   - 技巧取胜（外功 30+）
4. 决赛 → 对战盟主之子
   - 全力以赴（武功 60+）
   - 防守反击（内力 50+）
5. 结果
   - 🥇 冠军：获得「武林新秀」称号
   - 🥈 亚军：虽败犹荣
   - 😔 淘汰：学到经验

**关键 flag**:
- `joinedTournament`: 参加大会
- `preliminaryWin` / `preliminaryLose`: 初赛结果
- `semifinalWin`: 半决赛胜利
- `tournamentChampion` / `tournamentRunnerUp`: 最终名次

---

### 3. 爱情线事件 (8 个节点)
**触发条件**: 16-22 岁，未遇到过爱人

**流程**:
1. 初次相遇（桃花树下）→ 选择搭话/注视/离开
2. 再次相遇（查案）→ 选择帮忙/提供线索/假装不认识
3. 感情发展（游历江湖）→ 选择一起游历/谢绝
4. 表白（中秋之夜）→ 选择表白/犹豫
5. 求婚 → 选择求婚（需要 100 两）/专注武道
6. 结果
   - 💕 结婚：举行婚礼，获得孩子
   - 🧘 单身：专注武道，属性提升

**关键 flag**:
- `metLove`: 遇到爱人
- `approachedLove`: 主动接近
- `helpedLove`: 帮忙查案
- `travelingTogether`: 一起游历
- `inLove`: 确立关系
- `married`: 结婚

---

## 使用方法

这些长事件已经通过展开运算符集成到主剧情数组中：

```typescript
// storyData.ts
import { sectJoinEvents, tournamentEvents, loveStoryEvents } from './longEvents';

export const storyNodes: StoryNode[] = [
  // ... 原有剧情 ...
  
  // ========== 长事件集合 ==========
  ...sectJoinEvents,
  ...tournamentEvents,
  ...loveStoryEvents,
];
```

## 设计特点

### 1. 阶段连接
使用 `flag` 和 `event` 来连接各个阶段：
```typescript
// 阶段 1 设置 flag
effect: (state) => ({
  flags: new Set(['appliedShaolin']),
  events: new Set(['sectRecruitment']),
})

// 阶段 2 检查 flag
condition: (state) => state.flags.has('appliedShaolin')
```

### 2. 门派区分
每个门派有独立的测试和剧情：
```typescript
// 少林
condition: (state) => state.flags.has('appliedShaolin')
text: '方丈亲自接见你...'
effect: (state) => ({ sect: '少林派', ... })

// 武当
condition: (state) => state.flags.has('appliedWudang')
text: '掌门微笑点头...'
effect: (state) => ({ sect: '武当派', ... })
```

### 3. 多重结局
每个事件都有多个可能的结局：
- 成功结局（冠军/结婚/加入门派）
- 失败结局（淘汰/单身/自学）
- 部分成功结局（亚军）

### 4. 属性依赖
不同的选择需要不同的属性门槛：
- 武功（martialPower）
- 外功（externalSkill）
- 内力（internalSkill）
- 轻功（qinggong）
- 侠义（chivalry）
- 金钱（money）

## 测试建议

### 门派入门测试
1. 创建男性角色 → 应该可以选少林/武当
2. 创建女性角色 → 应该可以选武当/峨眉
3. 外功≥10 → 应该轻松通过体魄测试
4. 外功<5 → 应该失败，转为自学

### 武林大会测试
1. 武功≥25 → 18 岁时应该触发大会公告
2. 武功≥70 → 应该获得冠军
3. 武功 35-70 → 应该获得亚军或淘汰

### 爱情线测试
1. 侠义≥15 → 应该可以主动搭话
2. 帮忙查案 → 应该进入感情发展线
3. 金钱≥100 → 应该可以求婚

## 下一步扩展

可以添加更多长事件：
- 寻宝事件（寻找上古秘籍）
- 师徒事件（拜师学艺）
- 江湖恩怨事件（仇家报复）
- 经商事件（开店赚钱）
- 子女教育事件（培养下一代）
