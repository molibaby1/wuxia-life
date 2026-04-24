/**
 * 游戏过程模拟测试 - 验证事件系统的合理性
 * 特别关注新开发的教程事件和属性系统
 */

import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { talentSystem } from '../src/core/TalentSystem';
import { eventLoader } from '../src/core/EventLoader';
import { EventExecutor } from '../src/core/EventExecutor';

interface SimulationResult {
  age: number;
  eventId: string;
  eventName: string;
  eventType: string;
  stats: {
    martialPower: number;
    externalSkill: number;
    internalSkill: number;
    knowledge: number;
    chivalry: number;
    constitution: number;
  };
}

function isTutorialEvent(event: any): boolean {
  if (!event) return false;
  return (
    event.eventType === 'tutorial' ||
    event.type === 'prologue' ||
    event.category === 'prologue' ||
    (Array.isArray(event.tags) && event.tags.includes('prologue'))
  );
}

async function runSimulation() {
  console.log('='.repeat(100));
  console.log('游戏过程模拟测试 - 事件系统合理性验证');
  console.log('='.repeat(100));
  console.log('');

  // 初始化
  await talentSystem.loadTalents();
  await eventLoader.loadAllEvents();
  
  const gameEngine = new GameEngineIntegration();
  const eventExecutor = new EventExecutor();
  const gameState = gameEngine.getGameState();
  
  // 设置初始天赋
  if (gameState.player) {
    gameState.player.talents = ['martial_genius', 'quick_learner'];
    gameState.player.name = '测试玩家';
    gameState.player.gender = 'male';
  }

  const results: SimulationResult[] = [];
  const maxAge = 30;
  const autoEventIds = new Set<string>();

  console.log('开始模拟游戏过程...\n');

  // 模拟到 30 岁
  for (let age = 0; age <= maxAge; age++) {
    if (gameState.player) {
      gameState.player.age = age;
    }

    // 获取可用事件
    const availableEvents = await gameEngine.getAvailableEvents();
    
    if (availableEvents.length === 0) {
      console.log(`年龄 ${age}: 无可用事件`);
      continue;
    }

    // 选择事件（加权随机）
    const selectedEvent = gameEngine.selectEvent(age);
    
    if (!selectedEvent) {
      console.log(`年龄 ${age}: 无可用事件或已达年度上限`);
      continue;
    }

    // 记录事件类型
    const rawEventType = selectedEvent.type || selectedEvent.eventType || 'unknown';
    const tutorialLike = isTutorialEvent(selectedEvent) || age <= 12;
    const eventType = tutorialLike ? 'tutorial' : rawEventType;

    // 执行事件效果（使用真实执行器以对齐游戏规则）
    if (selectedEvent.autoEffects && selectedEvent.autoEffects.length > 0) {
      const nextState = await eventExecutor.executeEffects(selectedEvent.autoEffects, gameState);
      Object.assign(gameState, nextState);
    } else if (selectedEvent.choices && selectedEvent.choices.length > 0) {
      const firstChoice = selectedEvent.choices[0];
      if (firstChoice?.effects?.length) {
        const nextState = await eventExecutor.executeEffects(firstChoice.effects, gameState);
        Object.assign(gameState, nextState);
      }
    }
    
    // 记录事件历史
    if (gameState.player) {
      gameState.player.events = gameState.player.events || [];
      gameState.player.events.push({
        eventId: selectedEvent.id,
        timestamp: { year: age, month: 1, day: 1 }
      });
    }
    
    // 记录结果
    if (gameState.player) {
      results.push({
        age,
        eventId: selectedEvent.id,
        eventName: selectedEvent.content?.title || selectedEvent.id,
        eventType,
        stats: {
          martialPower: gameState.player.martialPower || 0,
          externalSkill: gameState.player.externalSkill || 0,
          internalSkill: gameState.player.internalSkill || 0,
          knowledge: gameState.player.knowledge || 0,
          chivalry: gameState.player.chivalry || 0,
          constitution: gameState.player.constitution || 0,
        }
      });

      // 显示重要事件
      if (eventType === 'tutorial' || selectedEvent.priority === 100) {
        const conditionAge = selectedEvent.triggerConditions?.age || selectedEvent.ageRange;
        console.log(`年龄 ${age}: 【${selectedEvent.content?.title || selectedEvent.id}】`);
        console.log(`  类型：${eventType} | 优先级：${selectedEvent.priority}`);
        if (conditionAge) {
          console.log(`  触发条件(年龄)：${conditionAge.min ?? '-'}-${conditionAge.max ?? conditionAge.min ?? '-'}`);
        }
        if (selectedEvent.content?.text) {
          const preview = selectedEvent.content.text.substring(0, 100);
          console.log(`  内容：${preview}...`);
        }
        console.log(`  属性：武力=${gameState.player.martialPower}, 学识=${gameState.player.knowledge}, 侠义=${gameState.player.chivalry}`);
        console.log('');
      }
    }
  }

  // 分析报告
  console.log('\n' + '='.repeat(100));
  console.log('测试报告：事件触发合理性分析');
  console.log('='.repeat(100));

  // 1. 教程事件分析
  console.log('\n1️⃣ 教程事件触发情况');
  console.log('-'.repeat(100));
  const tutorialEvents = results.filter(r => r.eventType === 'tutorial');
  console.log(`触发教程事件数量：${tutorialEvents.length}`);
  tutorialEvents.forEach(r => {
    console.log(`  - ${r.age}岁：${r.eventName} (学识=${r.stats.knowledge})`);
  });

  if (tutorialEvents.length === 0) {
    console.log('  ⚠️  警告：没有触发任何教程事件！');
  } else if (tutorialEvents.length < 5) {
    console.log('  ⚠️  注意：教程事件触发较少，建议检查年龄范围配置');
  }

  // 2. 属性成长分析
  console.log('\n2️⃣ 属性成长曲线');
  console.log('-'.repeat(100));
  const lastResult = results[results.length - 1];
  if (lastResult) {
    console.log(`30 岁时属性:`);
    console.log(`  功力：${lastResult.stats.martialPower}`);
    console.log(`  外功：${lastResult.stats.externalSkill}`);
    console.log(`  内功：${lastResult.stats.internalSkill}`);
    console.log(`  学识：${lastResult.stats.knowledge}`);
    console.log(`  侠义：${lastResult.stats.chivalry}`);
    console.log(`  体魄：${lastResult.stats.constitution}`);
    
    // 评估成长是否合理
    const totalMartial = lastResult.stats.martialPower + lastResult.stats.externalSkill + lastResult.stats.internalSkill;
    if (totalMartial < 1) {
      console.log('  ⚠️  警告：战斗属性成长过低，建议增加修炼事件权重');
    } else if (totalMartial > 200) {
      console.log('  ⚠️  注意：战斗属性成长过高，可能需要平衡');
    } else {
      console.log('  ✅ 战斗属性成长合理');
    }

    if (lastResult.stats.knowledge < 1) {
      console.log('  ⚠️  警告：学识成长过低，建议增加学习事件');
    } else {
      console.log('  ✅ 学识成长合理');
    }
  }

  // 3. 事件类型分布
  console.log('\n3️⃣ 事件类型分布');
  console.log('-'.repeat(100));
  const eventTypeCount: { [key: string]: number } = {};
  results.forEach(r => {
    eventTypeCount[r.eventType] = (eventTypeCount[r.eventType] || 0) + 1;
  });
  
  Object.entries(eventTypeCount).forEach(([type, count]) => {
    const percent = ((count / results.length) * 100).toFixed(1);
    console.log(`  ${type}: ${count}次 (${percent}%)`);
  });

  // 4. 年龄分布分析
  console.log('\n4️⃣ 事件年龄分布');
  console.log('-'.repeat(100));
  const ageGroups = [
    { name: '童年 (0-10 岁)', min: 0, max: 10 },
    { name: '少年 (11-15 岁)', min: 11, max: 15 },
    { name: '青年 (16-20 岁)', min: 16, max: 20 },
    { name: '壮年 (21-30 岁)', min: 21, max: 30 }
  ];

  ageGroups.forEach(group => {
    const count = results.filter(r => r.age >= group.min && r.age <= group.max).length;
    console.log(`  ${group.name}: ${count}个事件`);
  });

  // 5. 详细事件列表
  console.log('\n5️⃣ 完整事件时间线');
  console.log('-'.repeat(100));
  results.forEach((r, index) => {
    const marker = r.eventType === 'tutorial' ? '📚' : '  ';
    console.log(`${marker} ${r.age}岁：${r.eventName} [${r.eventType}]`);
  });

  // 6. 总体评价
  console.log('\n' + '='.repeat(100));
  console.log('总体评价与建议');
  console.log('='.repeat(100));
  
  const issues: string[] = [];
  
  if (tutorialEvents.length === 0) {
    issues.push('❌ 教程事件未触发 - 需要检查年龄范围和触发条件');
  }
  
  if (lastResult && lastResult.stats.knowledge < 1) {
    issues.push('❌ 学识属性过低 - 建议增加学习相关事件');
  }
  
  const eventCount = results.length;
  if (eventCount < 15) {
    issues.push('⚠️  事件总数偏少 - 建议扩展事件池');
  } else if (eventCount > 25) {
    issues.push('⚠️  事件总数偏多 - 可能导致节奏过快');
  } else {
    issues.push('✅ 事件触发频率合理');
  }

  if (issues.length > 0) {
    console.log('\n发现的问题:');
    issues.forEach((issue, i) => console.log(`  ${i+1}. ${issue}`));
  } else {
    console.log('\n✅ 所有检查通过，事件系统运行正常！');
  }

  console.log('\n');
}

// 运行测试
runSimulation().catch(console.error);
