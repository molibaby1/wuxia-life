/**
 * 事件触发条件测试脚本
 * 用于分析特定事件为何无法触发
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// 读取 storyData.ts 内容
const storyDataPath = join(process.cwd(), '../../src/data/storyData.ts');
const storyDataContent = readFileSync(storyDataPath, 'utf-8');

console.log('='.repeat(80));
console.log('特定事件触发条件分析报告');
console.log('='.repeat(80));
console.log('');

// 分析四个关键事件
const events = [
  {
    name: '恶棍欺人事件',
    id: 'age_8_to_12_bully',
    ageRange: '8-12 岁',
    conditions: [
      '!state.events.has("metBully") - 之前未遇到过恶棍'
    ],
    weight: 25,
    competingEvents: [
      { id: 'age_8_to_12_normal', weight: 50, text: '日复一日，你的武艺在逐渐进步' },
      { id: 'age_8_to_12_secret', weight: 15, text: '偶然发现一个神秘山洞' },
      { id: 'age_8_to_12_old_man', weight: 10, text: '遇到一位神秘老者' }
    ]
  },
  {
    name: '仇家寻仇事件',
    id: 'age_14_to_24_enemy',
    ageRange: '14-24 岁',
    conditions: [
      '!state.events.has("metEnemy") - 之前未遇到过仇家'
    ],
    weight: 20,
    competingEvents: [
      { id: 'age_14_to_24_normal', weight: 60, text: '你在师门中刻苦修炼，武艺突飞猛进' },
      { id: 'age_14_to_24_master', weight: 15, text: '遇到一位武林前辈' },
      { id: 'age_14_to_24_robber', weight: 20, text: '遇到山贼抢劫' },
      { id: 'age_14_to_24_sick', weight: 10, text: '突发重病' }
    ]
  },
  {
    name: '意中人事件',
    id: 'love_16_meet',
    ageRange: '16-18 岁',
    conditions: [
      '!state.events.has("metLove") - 之前未遇到过意中人'
    ],
    weight: 35,
    competingEvents: [
      { id: 'age_14_to_24_normal', weight: 60, text: '你在师门中刻苦修炼，武艺突飞猛进' },
      { id: 'fantasy_15_ancient_tomb', weight: 25, text: '探索古墓' },
      { id: 'fantasy_16_dragon', weight: 20, text: '遇到神龙' }
    ]
  },
  {
    name: '比武大会事件',
    id: 'tournament_announcement',
    ageRange: '18-35 岁',
    conditions: [
      'state.martialPower >= 25 - 武功≥25',
      '!state.events.has("tournament2024") - 之前未参加过武林大会'
    ],
    weight: 30,
    competingEvents: [
      { id: 'age_14_to_24_normal', weight: 60, text: '你在师门中刻苦修炼，武艺突飞猛进' },
      { id: 'age_21', weight: 100, text: '发现仙草' },
      { id: 'age_22_to_24_normal', weight: 50, text: '年复一年，你在江湖上的阅历越来越丰富' }
    ]
  }
];

events.forEach((event, index) => {
  console.log(`\n${index + 1}. ${event.name} (${event.id})`);
  console.log('─'.repeat(80));
  console.log(`   年龄范围：${event.ageRange}`);
  console.log(`   事件权重：${event.weight}`);
  console.log(`   触发条件:`);
  event.conditions.forEach(cond => {
    console.log(`     - ${cond}`);
  });
  
  console.log(`\n   竞争事件（同年龄段）:`);
  event.competingEvents.forEach(competitor => {
    const ratio = (competitor.weight / event.weight).toFixed(2);
    console.log(`     - [权重${competitor.weight}] ${competitor.text}`);
    console.log(`       → 是目标事件权重的 ${ratio} 倍`);
  });
  
  // 计算触发概率
  const totalWeight = event.weight + event.competingEvents.reduce((sum, e) => sum + e.weight, 0);
  const triggerProbability = (event.weight / totalWeight * 100).toFixed(2);
  
  console.log(`\n   ❌ 触发概率分析:`);
  console.log(`     总权重 = ${event.weight} + ${event.competingEvents.reduce((sum, e) => sum + e.weight, 0)} = ${totalWeight}`);
  console.log(`     触发概率 = ${event.weight} / ${totalWeight} = ${triggerProbability}%`);
  
  if (parseFloat(triggerProbability) < 20) {
    console.log(`     ⚠️  警告：触发概率过低（<20%）`);
  } else if (parseFloat(triggerProbability) < 30) {
    console.log(`     ⚠️  注意：触发概率较低（<30%）`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('根本原因分析');
console.log('='.repeat(80));
console.log(`
1. 权重配置不合理
   - 日常修炼事件（age_14_to_24_normal）权重=60，远高于其他事件
   - 在 14-24 岁年龄段，仇家事件（权重 20）只有 20/(60+20+...) ≈ 20% 的概率
   - 意中人事件（权重 35）在 16-18 岁也只有 35/(60+35+...) ≈ 35% 的概率

2. 年龄范围过窄
   - 意中人事件只能在 16-18 岁触发（仅 3 年窗口期）
   - 如果这 3 年内都被高权重事件覆盖，就永远无法触发

3. 自动节点跳过机制
   - 自动节点（autoNext=true）触发后直接 age+1
   - 可能导致跳过特定年龄的事件（如仙草事件只能在 21 岁触发）

4. 随机扰动的影响
   - 虽然添加了 0.8-1.2 的随机系数
   - 但权重差距过大时（如 60 vs 20），低权重事件仍难触发
     示例：60*0.8=48 vs 20*1.2=24，仍然差 2 倍
`);

console.log('\n' + '='.repeat(80));
console.log('解决方案建议');
console.log('='.repeat(80));
console.log(`
方案 1: 调整事件权重（推荐）
  - 降低日常修炼事件权重：60 → 30
  - 提高特殊事件权重：
    * 恶棍欺人：25 → 40
    * 仇家寻仇：20 → 35
    * 意中人：35 → 50
    * 比武大会：30 → 45

方案 2: 扩展年龄范围
  - 意中人事件：16-18 岁 → 16-25 岁
  - 仇家寻仇：14-24 岁 → 14-30 岁
  - 增加触发窗口期

方案 3: 添加保底机制
  - 如果某年龄段连续 N 年都触发日常事件，强制触发特殊事件
  - 或者在满足条件时，临时提升特殊事件权重

方案 4: 分类事件池
  - 将事件分为"日常事件池"和"特殊事件池"
  - 每年先从特殊事件池抽取（概率 p）
  - 如果特殊事件未触发，再从日常事件池抽取
  - 确保特殊事件有独立的触发机会
`);

console.log('\n' + '='.repeat(80));
