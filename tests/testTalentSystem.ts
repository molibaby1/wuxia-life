/**
 * 天赋系统和属性成长测试
 * 
 * 测试内容：
 * 1. 天赋加载
 * 2. 天赋成长加成计算
 * 3. 属性上限计算
 * 4. 修炼成长计算
 */

import { talentSystem } from '../src/core/TalentSystem';
import { statGrowthSystem } from '../src/core/StatGrowthSystem';

async function runTests() {
  console.log('===== 天赋系统和属性成长测试 =====\n');
  
  // 测试 1: 加载天赋
  console.log('【测试 1】加载天赋定义...');
  await talentSystem.loadTalents();
  const allTalents = talentSystem.getAllTalents();
  console.log(`✓ 成功加载 ${allTalents.length} 个天赋`);
  console.log(`  传说：${talentSystem.getTalentsByRarity('legendary').length}个`);
  console.log(`  稀有：${talentSystem.getTalentsByRarity('rare').length}个`);
  console.log(`  优秀：${talentSystem.getTalentsByRarity('uncommon').length}个`);
  console.log(`  普通：${talentSystem.getTalentsByRarity('common').length}个\n`);
  
  // 测试 2: 随机天赋选择
  console.log('【测试 2】随机天赋选择（10 次）...');
  const talentCounts: { [key: string]: number } = {};
  for (let i = 0; i < 10; i++) {
    const talent = talentSystem.randomTalent();
    talentCounts[talent.rarity] = (talentCounts[talent.rarity] || 0) + 1;
    console.log(`  ${i + 1}. ${talent.name} (${talent.rarity})`);
  }
  console.log('  稀有度分布:', talentCounts, '\n');
  
  // 测试 3: 天赋成长加成
  console.log('【测试 3】天赋成长加成计算...');
  
  // 测试武学奇才
  const martialGeniusMultiplier = talentSystem.calculateGrowthBonus('martialPower', ['martial_genius']);
  console.log(`  武学奇才 - 功力成长加成：x${martialGeniusMultiplier.toFixed(2)} (期望：x1.50)`);
  
  // 测试天生神力
  const strengthMultiplier = talentSystem.calculateGrowthBonus('externalSkill', ['natural_strength']);
  console.log(`  天生神力 - 外功成长加成：x${strengthMultiplier.toFixed(2)} (期望：x1.40)`);
  
  // 测试多个天赋叠加
  const multiMultiplier = talentSystem.calculateGrowthBonus('martialPower', ['martial_genius', 'natural_strength']);
  console.log(`  双天赋叠加 - 功力成长加成：x${multiMultiplier.toFixed(2)} (期望：x1.70)\n`);
  
  // 测试 4: 属性上限
  console.log('【测试 4】属性上限计算...');
  const martialCap = talentSystem.calculateStatCap('martialPower', ['martial_genius']);
  console.log(`  武学奇才 - 功力上限：${martialCap} (期望：120)`);
  
  const externalCap = talentSystem.calculateStatCap('externalSkill', ['natural_strength']);
  console.log(`  天生神力 - 外功上限：${externalCap} (期望：115)\n`);
  
  // 测试 5: 初始属性加成
  console.log('【测试 5】初始属性加成...');
  const martialBonus = talentSystem.calculateInitialBonus('martialPower', ['martial_genius']);
  console.log(`  武学奇才 - 初始功力：+${martialBonus} (期望：+10)`);
  
  const externalBonus = talentSystem.calculateInitialBonus('externalSkill', ['natural_strength']);
  console.log(`  天生神力 - 初始外功：+${externalBonus} (期望：+15)\n`);
  
  // 测试 6: 修炼成长计算
  console.log('【测试 6】修炼成长计算...');
  
  // 外功修炼（训练强度 5，悟性 50，无天赋）
  const externalGrowth1 = statGrowthSystem.calculateExternalGrowth(5, 50, []);
  console.log(`  外功修炼 (强度 5, 悟性 50, 无天赋): ${externalGrowth1.toFixed(1)}`);
  
  // 外功修炼（有武学奇才天赋）
  const externalGrowth2 = statGrowthSystem.calculateExternalGrowth(5, 50, ['martial_genius']);
  console.log(`  外功修炼 (强度 5, 悟性 50, 武学奇才): ${externalGrowth2.toFixed(1)} (应为上面的 1.5 倍)`);
  
  // 内功修炼（打坐 30 分钟，悟性 60，无天赋）
  const internalGrowth1 = statGrowthSystem.calculateInternalGrowth(30, 60, []);
  console.log(`  内功修炼 (30 分钟，悟性 60, 无天赋): ${internalGrowth1.toFixed(1)}`);
  
  // 内功修炼（有经脉通灵天赋）
  const internalGrowth2 = statGrowthSystem.calculateInternalGrowth(30, 60, ['spiritual_meridians']);
  console.log(`  内功修炼 (30 分钟，悟性 60, 经脉通灵): ${internalGrowth2.toFixed(1)} (应为上面的 1.4 倍)`);
  
  // 轻功修炼（练习 2 小时，体魄 40，无天赋）
  const qinggongGrowth1 = statGrowthSystem.calculateQinggongGrowth(2, 40, []);
  console.log(`  轻功修炼 (2 小时，体魄 40, 无天赋): ${qinggongGrowth1.toFixed(1)}`);
  
  // 轻功修炼（有身轻如燕天赋）
  const qinggongGrowth2 = statGrowthSystem.calculateQinggongGrowth(2, 40, ['light_as_feather']);
  console.log(`  轻功修炼 (2 小时，体魄 40, 身轻如燕): ${qinggongGrowth2.toFixed(1)} (应为上面的 1.4 倍)\n`);
  
  // 测试 7: 属性上限检查
  console.log('【测试 7】属性上限检查...');
  const isOverCap1 = statGrowthSystem.isStatOverCap('martialPower', 100, ['martial_genius']);
  console.log(`  功力 100，武学奇才：${isOverCap1 ? '未超过' : '已超过'}上限 (期望：未超过，上限 120)`);
  
  const isOverCap2 = statGrowthSystem.isStatOverCap('martialPower', 125, ['martial_genius']);
  console.log(`  功力 125，武学奇才：${isOverCap2 ? '已超过' : '未超过'}上限 (期望：已超过，上限 120)\n`);
  
  // 测试 8: 批量成长计算
  console.log('【测试 8】批量成长计算...');
  const batchGrowths = statGrowthSystem.calculateBatchGrowth(
    {
      'externalSkill': 5,
      'internalSkill': 5,
      'qinggong': 4,
      'constitution': 3
    },
    ['martial_genius']
  );
  console.log('  武学奇才批量成长:', batchGrowths);
  console.log('  (期望：外功 7.5, 内功 7.5, 轻功 6.0, 体魄 3.9)\n');
  
  // 测试 9: 成长说明文本
  console.log('【测试 9】成长说明文本...');
  const growthDesc = statGrowthSystem.getGrowthDescription('externalSkill', 5, ['martial_genius']);
  console.log(`  ${growthDesc}\n`);
  
  console.log('===== 测试完成 =====');
}

// 运行测试
runTests().catch(console.error);
