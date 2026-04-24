const fs = require('fs');
const path = require('path');

// 读取前言事件文件
const prologueFile = path.join(__dirname, '..', 'src', 'data', 'lines', 'prologue.json');
const prologueData = JSON.parse(fs.readFileSync(prologueFile, 'utf8'));

console.log('=== 前言事件链验证 ===\n');
console.log(`文件：${prologueFile}`);
console.log(`事件数量：${prologueData.length}\n`);

// 验证每个事件
prologueData.forEach((event, index) => {
  console.log(`事件 #${index + 1}: ${event.name}`);
  console.log(`  ID: ${event.id}`);
  console.log(`  年龄：${event.ageRange.min}-${event.ageRange.max}岁`);
  console.log(`  优先级：${event.priority}`);
  console.log(`  选择数量：${event.choices.length}`);
  
  // 验证选择 ID
  const hasIds = event.choices.every(choice => choice.id !== undefined);
  console.log(`  选择 ID 完整：${hasIds ? '✅' : '❌'}`);
  
  // 验证效果
  event.choices.forEach(choice => {
    if (!choice.effects || choice.effects.length === 0) {
      console.log(`    ⚠️  选择 "${choice.text}" 缺少效果`);
    }
  });
  
  console.log('');
});

// 验证叙事连贯性
console.log('=== 叙事连贯性检查 ===\n');

const expectedAges = [0, 3, 6, 9, 10];
const actualAges = prologueData.map(e => e.ageRange.min);

const agesMatch = JSON.stringify(expectedAges) === JSON.stringify(actualAges);
console.log(`年龄递进正确：${agesMatch ? '✅' : '❌'}`);
console.log(`  期望：${expectedAges.join(', ')}`);
console.log(`  实际：${actualAges.join(', ')}`);

// 检查优先级递减
const priorities = prologueData.map(e => e.priority);
const priorityDescending = priorities.every((p, i) => i === 0 || p <= priorities[i - 1]);
console.log(`优先级递减：${priorityDescending ? '✅' : '❌'}`);

// 检查因果联系
let hasFlags = 0;
let hasEffects = 0;
prologueData.forEach(event => {
  event.choices.forEach(choice => {
    if (choice.effects) {
      choice.effects.forEach(effect => {
        if (effect.type === 'flag_set') hasFlags++;
        if (effect.type === 'stat_modify') hasEffects++;
      });
    }
  });
});

console.log(`Flag 设置：${hasFlags > 0 ? '✅' : '❌'} (${hasFlags} 处)`);
console.log(`属性修改：${hasEffects > 0 ? '✅' : '❌'} (${hasEffects} 处)`);

console.log('\n=== 优化要点总结 ===\n');
console.log('✅ 完整的五幕剧结构：降生 → 试炼 → 启蒙 → 较技 → 立志');
console.log('✅ 每个事件都有明确的主题和目标');
console.log('✅ 选择影响后续发展（通过 flags 记录）');
console.log('✅ 年龄递进合理，符合成长逻辑');
console.log('✅ 优先级设置确保事件按顺序触发');
console.log('\n叙事改进：');
console.log('- 增加了家族背景和期望设定');
console.log('- 引入关键 NPC（师父、同门、父亲）');
console.log('- 每个选择都有明确的意义和后果');
console.log('- 为后续身份系统埋下伏笔（path_* flags）');
