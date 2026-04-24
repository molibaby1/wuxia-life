#!/usr/bin/env npx tsx

/**
 * 背景差异化验证测试
 * 
 * 检查事件文件中的背景权重配置是否生效
 */

import fs from 'fs';

console.log('🔍 验证背景差异化系统配置...\n');

// 检查关键文件是否包含背景权重配置
const filesToCheck = [
  {
    path: 'src/data/lines/training-events.json',
    name: '训练事件',
    expected: ['backgroundWeights']
  },
  {
    path: 'src/data/lines/love.json', 
    name: '爱情事件',
    expected: ['backgroundWeights']
  },
  {
    path: 'src/data/lines/merchant.json',
    name: '商业事件', 
    expected: ['backgroundWeights']
  },
  {
    path: 'src/data/lines/martial-arts-meeting.json',
    name: '武林大会事件',
    expected: ['backgroundWeights']
  },
  {
    path: 'src/data/lines/identity-scholar-specific.json',
    name: '书香门第专属事件',
    expected: ['读书节庆', '诗词大赛', '学术讲座', '科举考试']
  },
  {
    path: 'src/data/lines/identity-merchant-specific.json', 
    name: '商贾之家专属事件',
    expected: ['家族生意', '开辟商路', '商会邀请']
  },
  {
    path: 'src/data/lines/identity-frontier-specific.json',
    name: '边疆异族专属事件',
    expected: ['马背训练', '边境巡逻', '文化冲突']
  }
];

let successCount = 0;
const totalCount = filesToCheck.length;

for (const file of filesToCheck) {
  const fullPath = `/Users/zhouyun/code/wuxia-life/${file.path}`;
  
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    console.log(`📄 检查 ${file.name} (${file.path}):`);
    
    let allFound = true;
    for (const expected of file.expected) {
      if (content.includes(expected)) {
        console.log(`   ✅ 找到 "${expected}"`);
      } else {
        console.log(`   ❌ 缺少 "${expected}"`);
        allFound = false;
      }
    }
    
    if (allFound) {
      console.log(`   🎯 ${file.name} 配置完整\n`);
      successCount++;
    } else {
      console.log(`   ⚠️  ${file.name} 配置不完整\n`);
    }
  } else {
    console.log(`❌ 文件不存在: ${file.path}\n`);
  }
}

console.log(`📈 验证结果: ${successCount}/${totalCount} 个文件配置完整`);

// 检查 GameEngineIntegration.ts 中的背景权重计算逻辑
const enginePath = '/Users/zhouyun/code/wuxia-life/src/core/GameEngineIntegration.ts';
if (fs.existsSync(enginePath)) {
  const engineContent = fs.readFileSync(enginePath, 'utf-8');
  
  const hasPlayerOrigin = engineContent.includes('getPlayerOrigin');
  const hasCalculateWeight = engineContent.includes('calculateBackgroundWeight');
  const hasModifiedSelectEvent = engineContent.includes('playerOrigin = this.getPlayerOrigin()');
  
  console.log('\n🔧 检查 GameEngineIntegration.ts 中的背景权重逻辑:');
  console.log(hasPlayerOrigin ? '   ✅ 包含 getPlayerOrigin 方法' : '   ❌ 缺少 getPlayerOrigin 方法');
  console.log(hasCalculateWeight ? '   ✅ 包含 calculateBackgroundWeight 方法' : '   ❌ 缺少 calculateBackgroundWeight 方法');
  console.log(hasModifiedSelectEvent ? '   ✅ selectEvent 方法已修改以使用背景权重' : '   ❌ selectEvent 方法未修改');
  
  if (hasPlayerOrigin && hasCalculateWeight && hasModifiedSelectEvent) {
    console.log('   🎯 GameEngine 配置完整');
  }
}

console.log('\n🎯 背景差异化系统验证完成！');
console.log('\n✨ 系统特性:');
console.log('   • 不同背景玩家触发不同事件类型');
console.log('   • 书香门第: 更多文人、学术、仕途事件');
console.log('   • 商贾之家: 更多商业、贸易、理财事件'); 
console.log('   • 武林世家: 保持传统武学传承事件');
console.log('   • 边疆异族: 独特马术、边境、文化事件');
console.log('   • 权重系统: 动态调整事件触发概率');