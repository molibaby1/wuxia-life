/**
 * 剧情流程测试脚本 - Node.js 版本
 * 
 * 使用方法:
 * npx tsx scripts/runStoryTests.ts
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// 模拟类型定义
interface PlayerState {
  age: number;
  gender: 'male' | 'female';
  name: string;
  sect: string | null;
  martialPower: number;
  externalSkill: number;
  internalSkill: number;
  qinggong: number;
  chivalry: number;
  money: number;
  flags: Set<string>;
  events: Set<string>;
  children: number;
  alive: boolean;
  deathReason: string | null;
  title: string | null;
  timeUnit: 'year' | 'month' | 'day';
  monthProgress: number;
  dayProgress: number;
}

interface StoryChoice {
  id: string;
  text: string;
  condition?: any;
  effect?: (state: PlayerState) => any;
}

interface StoryNode {
  id: string;
  minAge: number;
  maxAge?: number;
  text: string;
  choices?: StoryChoice[];
  autoEffect?: (state: PlayerState) => any;
  autoNext?: boolean;
  condition?: any;
  weight?: number;
}

// 简化的条件评估（实际应该导入 storyInterpreter）
function evaluateCondition(condition: any, state: PlayerState): boolean {
  if (!condition) return true;
  
  // 处理 flag 检查
  if (condition.op === 'hasFlag' && condition.field === 'flags') {
    return state.flags.has(condition.value);
  }
  
  // 处理 event 检查
  if (condition.op === 'hasEvent' && condition.field === 'events') {
    return state.events.has(condition.value);
  }
  
  // 处理 sect 检查
  if (condition.op === 'eq' && condition.field === 'sect') {
    return state.sect === condition.value;
  }
  
  // 处理数值比较
  if (['gte', 'gt', 'lte', 'lt', 'eq', 'ne'].includes(condition.op)) {
    const value = (state as any)[condition.field];
    switch (condition.op) {
      case 'gte': return value >= condition.value;
      case 'gt': return value > condition.value;
      case 'lte': return value <= condition.value;
      case 'lt': return value < condition.value;
      case 'eq': return value === condition.value;
      case 'ne': return value !== condition.value;
    }
  }
  
  // 处理逻辑运算
  if (condition.op === 'and' && condition.conditions) {
    return condition.conditions.every((c: any) => evaluateCondition(c, state));
  }
  
  if (condition.op === 'or' && condition.conditions) {
    return condition.conditions.some((c: any) => evaluateCondition(c, state));
  }
  
  if (condition.op === 'not' && condition.condition) {
    return !evaluateCondition(condition.condition, state);
  }
  
  return true;
}

// 创建测试玩家
function createTestPlayer(name: string, gender: 'male' | 'female', age: number, sect: string | null = null): PlayerState {
  return {
    age,
    gender,
    name,
    sect,
    martialPower: 30,
    externalSkill: 30,
    internalSkill: 30,
    qinggong: 30,
    chivalry: 30,
    money: 200,
    flags: new Set(),
    events: new Set(),
    children: 0,
    alive: true,
    deathReason: null,
    title: null,
    timeUnit: 'year',
    monthProgress: 0,
    dayProgress: 1,
  };
}

// 模拟故事节点数据（简化版）
const mockStoryNodes: StoryNode[] = [
  // 门派入门
  {
    id: 'sect_recruitment_announcement',
    minAge: 12,
    maxAge: 16,
    text: '各大门派开始招收弟子了！',
    condition: (state: PlayerState) => state.sect === null && !state.events.has('sectRecruitment'),
    weight: 1000,
    choices: [
      {
        id: 'apply_shaolin',
        text: '报名少林派',
        condition: (state: PlayerState) => state.gender === 'male',
        effect: (state: PlayerState) => ({
          age: state.age + 1,
          flags: new Set(['appliedShaolin']),
          events: new Set(['sectRecruitment']),
        }),
      },
      {
        id: 'apply_wudang',
        text: '报名武当派',
        effect: (state: PlayerState) => ({
          age: state.age + 1,
          flags: new Set(['appliedWudang']),
          events: new Set(['sectRecruitment']),
        }),
      },
      {
        id: 'apply_emei',
        text: '报名峨眉派',
        condition: (state: PlayerState) => state.gender === 'female',
        effect: (state: PlayerState) => ({
          age: state.age + 1,
          flags: new Set(['appliedEmei']),
          events: new Set(['sectRecruitment']),
        }),
      },
    ],
  },
  {
    id: 'shaolin_physical_test',
    minAge: 12,
    maxAge: 17,
    text: '你来到少林寺，试试举起石锁。',
    condition: (state: PlayerState) => state.flags.has('appliedShaolin') && !state.events.has('physicalTest'),
    weight: 1000,
    choices: [
      {
        id: 'lift_easily',
        text: '轻松举起',
        condition: (state: PlayerState) => state.externalSkill >= 10,
        effect: (state: PlayerState) => ({
          age: state.age + 1,
          flags: new Set(['appliedShaolin', 'physicalPass']), // 保留 appliedShaolin
          events: new Set(['physicalTest']),
        }),
      },
    ],
  },
  {
    id: 'wudang_physical_test',
    minAge: 12,
    maxAge: 17,
    text: '你来到武当山，打一套太极拳。',
    condition: (state: PlayerState) => state.flags.has('appliedWudang') && !state.events.has('physicalTest'),
    weight: 1000,
    choices: [
      {
        id: 'taichi_perfect',
        text: '打出完美拳法',
        condition: (state: PlayerState) => state.internalSkill >= 10,
        effect: (state: PlayerState) => ({
          age: state.age + 1,
          flags: new Set(['appliedWudang', 'physicalPass']), // 保留 appliedWudang
          events: new Set(['physicalTest']),
        }),
      },
    ],
  },
  {
    id: 'sect_mental_test',
    minAge: 12,
    maxAge: 17,
    text: '长老问你：习武之人最重要的是什么？',
    condition: (state: PlayerState) => state.flags.has('physicalPass') && !state.events.has('mentalTest'),
    weight: 1000,
    choices: [
      {
        id: 'answer_virtue',
        text: '武德',
        effect: (state: PlayerState) => ({
          age: state.age + 1,
          flags: new Set(['mentalPass']),
          events: new Set(['mentalTest']),
        }),
      },
    ],
  },
  {
    id: 'shaolin_accepted',
    minAge: 13,
    maxAge: 17,
    text: '方丈接见你，你成为少林弟子。',
    condition: (state: PlayerState) => state.flags.has('appliedShaolin') && state.flags.has('mentalPass'),
    autoNext: true,
    weight: 1000,
    autoEffect: (state: PlayerState) => ({
      age: state.age + 1,
      sect: '少林派',
      events: new Set(['joinedShaolin']),
      flags: new Set(),
    }),
  },
  // 爱情线
  {
    id: 'love_first_meeting',
    minAge: 16,
    maxAge: 22,
    text: '桃花树下遇到心动的人。',
    condition: (state: PlayerState) => !state.events.has('metLove'),
    weight: 40,
    choices: [
      {
        id: 'approach_bravely',
        text: '勇敢上前搭话',
        effect: (state: PlayerState) => ({
          age: state.age + 1,
          flags: new Set(['approachedLove']),
          events: new Set(['metLove']),
        }),
      },
      {
        id: 'watch_silently',
        text: '默默注视',
        effect: (state: PlayerState) => ({
          age: state.age + 1,
          events: new Set(['metLove']),
        }),
      },
    ],
  },
  {
    id: 'love_second_encounter',
    minAge: 17,
    maxAge: 23,
    text: '再次相遇，Ta 在查案。',
    condition: (state: PlayerState) => state.events.has('metLove') && !state.events.has('secondMeeting'),
    weight: 1000,
    choices: [
      {
        id: 'help_investigate',
        text: '主动帮忙',
        effect: (state: PlayerState) => ({
          age: state.age + 1,
          flags: new Set(['helpedLove']),
          events: new Set(['secondMeeting']),
        }),
      },
      {
        id: 'give_tips',
        text: '提供线索',
        effect: (state: PlayerState) => ({
          age: state.age + 1,
          flags: new Set(['helpedLove']),
          events: new Set(['secondMeeting']),
        }),
      },
    ],
  },
];

// 获取可用节点
function getAvailableNodes(state: PlayerState): StoryNode[] {
  // 优先匹配有 flag 的节点（长事件）
  if (state.flags.size > 0) {
    const longEventNodes = mockStoryNodes.filter(
      node => node.minAge !== undefined &&
              node.minAge <= state.age &&
              (!node.condition || evaluateCondition(node.condition, state)) &&
              (node.id.includes('physical_test') || 
               node.id.includes('mental_test') ||
               node.id.includes('accepted') ||
               node.id.includes('result'))
    );
    
    if (longEventNodes.length > 0) {
      return [longEventNodes[0]];
    }
  }
  
  // 匹配普通节点
  return mockStoryNodes.filter(
    node => node.minAge !== undefined &&
            node.minAge <= state.age &&
            (!node.maxAge || node.maxAge >= state.age) &&
            (!node.condition || evaluateCondition(node.condition, state))
  );
}

// 测试用例接口
interface TestCase {
  name: string;
  description: string;
  initialAge: number;
  initialGender: 'male' | 'female';
  initialSect: string | null;
  choices: string[];
  expectedNodes: string[];
  expectedEvents: string[];
  expectedFlags: string[];
}

// 运行测试
function runTestCase(testCase: TestCase): boolean {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试：${testCase.name}`);
  console.log(`描述：${testCase.description}`);
  console.log(`${'='.repeat(60)}`);
  
  const player = createTestPlayer('测试', testCase.initialGender, testCase.initialAge, testCase.initialSect);
  let passed = true;
  
  for (let i = 0; i < testCase.choices.length; i++) {
    const choiceId = testCase.choices[i];
    console.log(`\n步骤 ${i + 1}: 选择 "${choiceId}"`);
    
    const nodes = getAvailableNodes(player);
    console.log(`  可用节点：${nodes.map(n => n.id).join(', ')}`);
    
    if (nodes.length === 0) {
      console.error(`  ❌ 没有可用节点`);
      passed = false;
      break;
    }
    
    // 查找目标选择
    let found = false;
    for (const node of nodes) {
      if (node.choices) {
        const choice = node.choices.find(c => c.id === choiceId);
        if (choice) {
          console.log(`  ✓ 节点：${node.id}`);
          console.log(`  剧情：${node.text}`);
          
          // 检查条件
          if (choice.condition && !evaluateCondition(choice.condition, player)) {
            console.error(`  ❌ 条件不满足`);
            passed = false;
            break;
          }
          
          // 应用效果
          if (choice.effect) {
            const effects = choice.effect(player);
            Object.keys(effects).forEach(key => {
              if (key !== 'flags' && key !== 'events') {
                (player as any)[key] = effects[key];
              }
            });
            if (effects.flags) player.flags = effects.flags;
            if (effects.events) player.events = new Set([...player.events, ...effects.events]);
          }
          
          console.log(`  年龄：${player.age}, sect: ${player.sect}`);
          console.log(`  Events: ${Array.from(player.events).join(', ')}`);
          console.log(`  Flags: ${Array.from(player.flags).join(', ')}`);
          
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      console.error(`  ❌ 未找到选择 "${choiceId}"`);
      passed = false;
      break;
    }
  }
  
  // 验证最终状态
  console.log(`\n${'-'.repeat(60)}`);
  console.log('验证:');
  
  for (const event of testCase.expectedEvents) {
    if (player.events.has(event)) {
      console.log(`  ✓ Event: ${event}`);
    } else {
      console.error(`  ❌ 缺少 Event: ${event}`);
      passed = false;
    }
  }
  
  for (const flag of testCase.expectedFlags) {
    if (player.flags.has(flag)) {
      console.log(`  ✓ Flag: ${flag}`);
    } else {
      console.error(`  ❌ 缺少 Flag: ${flag}`);
      passed = false;
    }
  }
  
  console.log(`\n${passed ? '✅ 测试通过' : '❌ 测试失败'}`);
  
  return passed;
}

// 主函数
function main() {
  console.log('\n🎮 剧情流程测试开始 🎮\n');
  
  const tests: TestCase[] = [
    {
      name: '少林派入门',
      description: '男性角色加入少林派',
      initialAge: 12,
      initialGender: 'male',
      initialSect: null,
      choices: ['apply_shaolin', 'lift_easily', 'answer_virtue'],
      expectedEvents: ['sectRecruitment', 'physicalTest', 'mentalTest', 'joinedShaolin'],
      expectedFlags: [],
    },
    {
      name: '武当派入门',
      description: '角色加入武当派',
      initialAge: 12,
      initialGender: 'male',
      initialSect: null,
      choices: ['apply_wudang', 'taichi_perfect', 'answer_virtue'],
      expectedEvents: ['sectRecruitment', 'physicalTest', 'mentalTest', 'joinedWudang'],
      expectedFlags: [],
    },
    {
      name: '爱情线 - 主动搭话',
      description: '主动搭话发展感情',
      initialAge: 16,
      initialGender: 'male',
      initialSect: null,
      choices: ['approach_bravely', 'help_investigate'],
      expectedEvents: ['metLove', 'secondMeeting'],
      expectedFlags: ['approachedLove', 'helpedLove'],
    },
    {
      name: '爱情线 - 提供线索（修复测试）',
      description: '提供线索也能发展感情（验证修复）',
      initialAge: 16,
      initialGender: 'male',
      initialSect: null,
      choices: ['watch_silently', 'give_tips'],
      expectedEvents: ['metLove', 'secondMeeting'],
      expectedFlags: ['helpedLove'],
    },
  ];
  
  let passedCount = 0;
  
  for (const test of tests) {
    const passed = runTestCase(test);
    if (passed) passedCount++;
  }
  
  // 汇总
  console.log('\n' + '🏆 '.repeat(30));
  console.log('测试汇总');
  console.log('🏆 '.repeat(30));
  console.log(`总测试：${tests.length}`);
  console.log(`通过：${passedCount}`);
  console.log(`失败：${tests.length - passedCount}`);
  console.log(`通过率：${((passedCount / tests.length) * 100).toFixed(2)}%`);
  
  if (passedCount === tests.length) {
    console.log('\n🎉 所有测试通过！\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分测试失败\n');
    process.exit(1);
  }
}

// 运行
main();
