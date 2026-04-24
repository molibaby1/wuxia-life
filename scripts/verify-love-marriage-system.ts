#!/usr/bin/env npx tsx

/**
 * 爱情 - 婚姻冲突系统验证脚本
 * 
 * 验证新增的爱情 - 婚姻冲突事件是否已正确集成
 */

import fs from 'fs';

console.log('💕 验证爱情 - 婚姻冲突系统...\n');

// 检查关键文件
const filesToCheck = [
  {
    path: 'src/data/lines/love-marriage-conflict.json',
    name: '爱情 - 婚姻冲突事件文件',
    expected: [
      'marriage_love_reality_choice',
      'marriage_old_lover_reunion',
      'marriage_affair_crisis',
      'marriage_family_pressure_child',
      'marriage_career_family_balance',
      'marriage_divorce_crisis'
    ]
  },
  {
    path: 'src/data/lines/family-life.json',
    name: '家庭生活事件文件（已修改）',
    expected: [
      'spouse_mingyue',
      'marriage_type_love',
      'marriage_quality_high'
    ]
  }
];

let successCount = 0;
const totalCount = filesToCheck.length;

for (const file of filesToCheck) {
  const fullPath = `/Users/zhouyun/code/wuxia-life/${file.path}`;
  
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    console.log(`📄 检查 ${file.name}:`);
    
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

console.log(`📈 验证结果: ${successCount}/${totalCount} 个文件配置完整\n`);

// 显示系统特性
console.log('✨ 爱情 - 婚姻冲突系统特性:\n');

const features = [
  {
    feature: '爱情与婚姻关联',
    description: '爱情线发展直接影响婚姻选择和配偶'
  },
  {
    feature: '婚姻质量系统',
    description: '引入隐藏的婚姻质量指标 (0-100)'
  },
  {
    feature: '婚前冲突事件',
    description: '爱情与现实的抉择，真爱 vs 利益'
  },
  {
    feature: '婚后冲突事件',
    description: '旧爱重逢、婚外情暴露等戏剧冲突'
  },
  {
    feature: '家庭责任冲突',
    description: '传宗接代压力、事业与家庭平衡'
  },
  {
    feature: '离婚机制',
    description: '婚姻破裂时的多种选择和后果'
  },
  {
    feature: '路径互斥',
    description: '与隐士、官员等路径的冲突检测'
  }
];

features.forEach((item, index) => {
  console.log(`   ${index + 1}. ${item.feature}`);
  console.log(`      ${item.description}`);
});

console.log('\n🎯 爱情 - 婚姻冲突系统验证完成！');
console.log('\n📋 核心冲突事件:');
console.log('   1. 爱情与现实的抉择 (22-30 岁)');
console.log('   2. 旧爱重逢 (25-45 岁)');
console.log('   3. 婚外情暴露危机 (26-50 岁)');
console.log('   4. 传宗接代的压力 (28-40 岁)');
console.log('   5. 事业与家庭的平衡 (30-50 岁)');
console.log('   6. 婚姻破裂 (30-55 岁)');

console.log('\n💡 系统设计理念:');
console.log('   • 关联性：爱情影响婚姻，婚姻约束爱情');
console.log('   • 冲突性：责任 vs 情感，道德 vs 欲望');
console.log('   • 动态性：婚姻质量随时间变化');
console.log('   • 后果性：每个选择都有长远影响');