/**
 * 剧情流程测试脚本
 * 
 * 用于自动化测试多阶段长事件的完整流程
 * 可以模拟玩家选择，验证剧情是否正确衔接
 */

import type { PlayerState, StoryNode, StoryChoice } from '../types';
import { getAvailableNodes, checkNodeCondition } from './storyData';
import { evaluateCondition, applyEffects } from './storyInterpreter';

// 测试状态接口
interface TestState {
  player: PlayerState;
  history: string[];
  currentNode: StoryNode | null;
  step: number;
}

// 测试用例接口
interface TestCase {
  name: string;
  description: string;
  initialAge: number;
  initialGender: 'male' | 'female';
  initialSect: string | null;
  choices: string[]; // 按顺序选择的选项 ID
  expectedNodes: string[]; // 期望出现的节点 ID 序列
  expectedEvents: string[]; // 期望设置的 events
  expectedFlags: string[]; // 期望的 flags（最终状态）
}

/**
 * 创建初始玩家状态
 */
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

/**
 * 应用效果到玩家状态
 */
function applyTestEffects(state: PlayerState, effects: any): PlayerState {
  if (!effects) return state;
  
  const newState = { ...state };
  
  // 处理普通属性更新
  Object.keys(effects).forEach(key => {
    if (key !== 'flags' && key !== 'events') {
      (newState as any)[key] = effects[key];
    }
  });
  
  // 处理 flags
  if (effects.flags !== undefined) {
    newState.flags = new Set(effects.flags);
  }
  
  // 处理 events
  if (effects.events !== undefined) {
    newState.events = new Set([...state.events, ...effects.events]);
  }
  
  return newState;
}

/**
 * 执行一个测试用例
 */
function runTestCase(testCase: TestCase): TestResult {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试：${testCase.name}`);
  console.log(`描述：${testCase.description}`);
  console.log(`${'='.repeat(60)}`);
  
  const testState: TestState = {
    player: createTestPlayer('测试角色', testCase.initialGender, testCase.initialAge, testCase.initialSect),
    history: [],
    currentNode: null,
    step: 0,
  };
  
  const result: TestResult = {
    name: testCase.name,
    passed: true,
    steps: [],
    errors: [],
  };
  
  // 执行每个选择步骤
  for (let i = 0; i < testCase.choices.length; i++) {
    const choiceId = testCase.choices[i];
    console.log(`\n步骤 ${i + 1}: 选择 "${choiceId}"`);
    
    // 获取可用节点
    const availableNodes = getAvailableNodes(testState.player);
    
    if (availableNodes.length === 0) {
      const error = `步骤 ${i + 1}: 没有可用节点`;
      console.error(`❌ ${error}`);
      result.errors.push(error);
      result.passed = false;
      break;
    }
    
    console.log(`  可用节点：${availableNodes.map(n => n.id).join(', ')}`);
    
    // 查找包含目标选择的节点
    let targetNode: StoryNode | undefined;
    let targetChoice: StoryChoice | undefined;
    
    for (const node of availableNodes) {
      if (node.choices) {
        const choice = node.choices.find(c => c.id === choiceId);
        if (choice) {
          targetNode = node;
          targetChoice = choice;
          break;
        }
      }
    }
    
    if (!targetNode || !targetChoice) {
      const error = `步骤 ${i + 1}: 未找到选择 "${choiceId}"`;
      console.error(`❌ ${error}`);
      result.errors.push(error);
      result.passed = false;
      break;
    }
    
    console.log(`  ✓ 找到节点：${targetNode.id}`);
    console.log(`  剧情：${targetNode.text.substring(0, 50)}...`);
    
    // 检查条件
    if (targetChoice.condition && !evaluateCondition(targetChoice.condition, testState.player)) {
      const error = `步骤 ${i + 1}: 选择 "${choiceId}" 的条件不满足`;
      console.error(`❌ ${error}`);
      result.errors.push(error);
      result.passed = false;
      break;
    }
    
    // 应用效果
    if (targetChoice.effect) {
      const effects = targetChoice.effect(testState.player);
      testState.player = applyTestEffects(testState.player, effects);
    }
    
    // 记录历史
    testState.history.push(targetNode.text);
    testState.currentNode = targetNode;
    testState.step = i + 1;
    
    console.log(`  属性变化：年龄=${testState.player.age},  sect=${testState.player.sect}`);
    console.log(`  Events: ${Array.from(testState.player.events).join(', ')}`);
    console.log(`  Flags: ${Array.from(testState.player.flags).join(', ')}`);
    
    // 记录步骤结果
    result.steps.push({
      step: i + 1,
      nodeId: targetNode.id,
      nodeText: targetNode.text,
      choiceId,
      playerState: { ...testState.player },
    });
  }
  
  // 验证最终状态
  console.log(`\n${'-'.repeat(60)}`);
  console.log('验证最终状态:');
  
  // 验证 events
  for (const expectedEvent of testCase.expectedEvents) {
    if (!testState.player.events.has(expectedEvent)) {
      const error = `缺少期望的 event: ${expectedEvent}`;
      console.error(`❌ ${error}`);
      result.errors.push(error);
      result.passed = false;
    } else {
      console.log(`  ✓ Event "${expectedEvent}" 已设置`);
    }
  }
  
  // 验证 flags
  for (const expectedFlag of testCase.expectedFlags) {
    if (!testState.player.flags.has(expectedFlag)) {
      const error = `缺少期望的 flag: ${expectedFlag}`;
      console.error(`❌ ${error}`);
      result.errors.push(error);
      result.passed = false;
    } else {
      console.log(`  ✓ Flag "${expectedFlag}" 已设置`);
    }
  }
  
  // 验证节点序列
  if (testCase.expectedNodes.length > 0) {
    const actualNodes = result.steps.map(s => s.nodeId);
    const nodesMatch = JSON.stringify(actualNodes) === JSON.stringify(testCase.expectedNodes);
    
    if (!nodesMatch) {
      const error = `节点序列不匹配\n  期望：${testCase.expectedNodes.join(' → ')}\n  实际：${actualNodes.join(' → ')}`;
      console.error(`❌ ${error}`);
      result.errors.push(error);
      result.passed = false;
    } else {
      console.log(`  ✓ 节点序列匹配：${testCase.expectedNodes.join(' → ')}`);
    }
  }
  
  // 最终结果
  console.log(`\n${'='.repeat(60)}`);
  if (result.passed) {
    console.log(`✅ 测试通过：${testCase.name}`);
  } else {
    console.log(`❌ 测试失败：${testCase.name}`);
    console.log(`错误数：${result.errors.length}`);
    result.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }
  console.log(`${'='.repeat(60)}\n`);
  
  return result;
}

/**
 * 测试结果接口
 */
interface TestResult {
  name: string;
  passed: boolean;
  steps: Array<{
    step: number;
    nodeId: string;
    nodeText: string;
    choiceId: string;
    playerState: PlayerState;
  }>;
  errors: string[];
}

/**
 * 运行所有测试
 */
export function runAllTests(): void {
  console.log('\n' + '🎮 '.repeat(30));
  console.log('开始运行剧情流程测试...');
  console.log('🎮 '.repeat(30) + '\n');
  
  const testCases: TestCase[] = [
    {
      name: '少林派入门流程测试',
      description: '测试男性角色加入少林派的完整流程',
      initialAge: 12,
      initialGender: 'male',
      initialSect: null,
      choices: ['apply_shaolin', 'lift_easily', 'answer_virtue'],
      expectedNodes: [
        'sect_recruitment_announcement',
        'shaolin_physical_test',
        'sect_mental_test',
      ],
      expectedEvents: ['sectRecruitment', 'physicalTest', 'mentalTest', 'joinedShaolin'],
      expectedFlags: [],
    },
    {
      name: '武当派入门流程测试',
      description: '测试角色加入武当派的完整流程',
      initialAge: 12,
      initialGender: 'male',
      initialSect: null,
      choices: ['apply_wudang', 'taichi_perfect', 'answer_persistence'],
      expectedNodes: [
        'sect_recruitment_announcement',
        'wudang_physical_test',
        'sect_mental_test',
      ],
      expectedEvents: ['sectRecruitment', 'physicalTest', 'mentalTest', 'joinedWudang'],
      expectedFlags: [],
    },
    {
      name: '峨眉派入门流程测试',
      description: '测试女性角色加入峨眉派的完整流程',
      initialAge: 12,
      initialGender: 'female',
      initialSect: null,
      choices: ['apply_emei', 'sword_perfect', 'answer_diligence'],
      expectedNodes: [
        'sect_recruitment_announcement',
        'emei_physical_test',
        'sect_mental_test',
      ],
      expectedEvents: ['sectRecruitment', 'physicalTest', 'mentalTest', 'joinedEmei'],
      expectedFlags: [],
    },
    {
      name: '爱情线 - 主动搭话流程',
      description: '测试爱情线中主动搭话的完整流程',
      initialAge: 16,
      initialGender: 'male',
      initialSect: null,
      choices: ['approach_bravely', 'help_investigate', 'travel_together'],
      expectedNodes: [
        'love_first_meeting',
        'love_second_encounter',
        'love_develop_relationship',
      ],
      expectedEvents: ['metLove', 'secondMeeting', 'travelTogether'],
      expectedFlags: ['approachedLove', 'helpedLove', 'travelingTogether'],
    },
    {
      name: '爱情线 - 提供线索流程',
      description: '测试爱情线中提供线索的完整流程（修复后）',
      initialAge: 16,
      initialGender: 'male',
      initialSect: null,
      choices: ['watch_silently', 'give_tips', 'travel_together'],
      expectedNodes: [
        'love_first_meeting',
        'love_second_encounter',
        'love_develop_relationship',
      ],
      expectedEvents: ['metLove', 'secondMeeting', 'travelTogether'],
      expectedFlags: ['helpedLove', 'travelingTogether'],
    },
    {
      name: '武林大会 - 参赛流程',
      description: '测试参加武林大会的完整流程',
      initialAge: 18,
      initialGender: 'male',
      initialSect: null,
      choices: ['join_tournament', 'fight_careful', 'use_qinggong', 'final_all_out'],
      expectedNodes: [
        'tournament_announcement',
        'tournament_preliminary',
        'tournament_semifinal',
        'tournament_final',
      ],
      expectedEvents: ['tournament2024'],
      expectedFlags: ['joinedTournament', 'preliminaryWin', 'semifinalWin'],
    },
  ];
  
  const results: TestResult[] = [];
  
  // 运行所有测试
  for (const testCase of testCases) {
    const result = runTestCase(testCase);
    results.push(result);
  }
  
  // 汇总报告
  console.log('\n' + '🏆 '.repeat(30));
  console.log('测试汇总报告');
  console.log('🏆 '.repeat(30) + '\n');
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  console.log(`总测试数：${totalCount}`);
  console.log(`通过：${passedCount}`);
  console.log(`失败：${totalCount - passedCount}`);
  console.log(`通过率：${((passedCount / totalCount) * 100).toFixed(2)}%\n`);
  
  if (passedCount === totalCount) {
    console.log('🎉 所有测试通过！剧情流程正常！\n');
  } else {
    console.log('⚠️  部分测试失败，请检查错误信息：\n');
    results.filter(r => !r.passed).forEach(result => {
      console.log(`❌ ${result.name}`);
      result.errors.forEach(err => console.log(`   - ${err}`));
    });
    console.log('');
  }
}

// 导出测试函数
export { runTestCase, createTestPlayer };
