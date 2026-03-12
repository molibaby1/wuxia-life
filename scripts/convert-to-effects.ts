#!/usr/bin/env tsx
/**
 * 批量转换简单的 autoEffect 为 effects
 * 
 * 支持的转换模式：
 * 1. autoEffect: (state) => ({ age: state.age + 1 }) 
 *    → effects: [{ type: 'TIME_ADVANCE', unit: 'year', value: 1 }]
 * 
 * 2. autoEffect: (state) => ({ age: state.age + 1, externalSkill: state.externalSkill + 2 })
 *    → effects: [TIME_ADVANCE, STAT_MODIFY, ...]
 */

import { readFileSync, writeFileSync } from 'fs';

const filePath = process.argv[2] || 'src/data/storyData.ts';
let content = readFileSync(filePath, 'utf-8');

console.log('=== 批量转换 autoEffect 为 effects ===\n');

let replaceCount = 0;

// 模式 1：简单的 age+1
// autoEffect: (state) => ({ age: state.age + 1 }),
const pattern1 = /autoEffect:\s*\(state\)\s*=>\s*\(\s*{\s*age:\s*state\.age\s*\+\s*1\s*}\s*\)\s*,/g;
const replacement1 = `effects: [
      { type: 'TIME_ADVANCE', unit: 'year', value: 1 },
    ],`;

const matches1 = content.match(pattern1);
if (matches1) {
  console.log(`模式 1 (简单 age+1): ${matches1.length} 处`);
  content = content.replace(pattern1, replacement1);
  replaceCount += matches1.length;
}

// 模式 2: age+1 和属性修改
// autoEffect: (state) => ({ age: state.age + 1, externalSkill: state.externalSkill + 2 }),
const pattern2 = /autoEffect:\s*\(state\)\s*=>\s*\(\s*{\s*age:\s*state\.age\s*\+\s*1,\s*(\w+):\s*state\.(\w+)\s*\+\s*(\d+)\s*}\s*\)\s*,/g;

let match;
while ((match = pattern2.exec(content)) !== null) {
  const [full, statName, stateStat, value] = match;
  console.log(`模式 2 (age+1 + ${statName}): 转换中...`);
  
  const replacement = `effects: [
      { type: 'TIME_ADVANCE', unit: 'year', value: 1 },
      { type: 'STAT_MODIFY', stat: '${statName}', value: ${value}, operator: 'add' },
    ],`;
  
  content = content.replace(full, replacement);
  replaceCount++;
  
  // 重置 regex
  pattern2.lastIndex = 0;
}

// 模式 3：多个属性修改 + age
// autoEffect: (state) => ({ age: state.age + 1, externalSkill: state.externalSkill + 2, internalSkill: state.internalSkill + 3 })
const pattern3 = /autoEffect:\s*\(state\)\s*=>\s*\(\s*{\s*age:\s*state\.age\s*\+\s*1,\s*(\w+):\s*state\.(\w+)\s*\+\s*(\d+),\s*(\w+):\s*state\.(\w+)\s*\+\s*(\d+)(?:,\s*(\w+):\s*state\.(\w+)\s*\+\s*(\d+))?\s*}\s*\)\s*,/g;

while ((match = pattern3.exec(content)) !== null) {
  const [full, stat1, _, val1, stat2, __, val2, stat3, ___, val3] = match;
  console.log(`模式 3 (多属性): 转换中...`);
  
  let replacement = `effects: [
      { type: 'TIME_ADVANCE', unit: 'year', value: 1 },
      { type: 'STAT_MODIFY', stat: '${stat1}', value: ${val1}, operator: 'add' },
      { type: 'STAT_MODIFY', stat: '${stat2}', value: ${val2}, operator: 'add' },`;
  
  if (stat3) {
    replacement += `
      { type: 'STAT_MODIFY', stat: '${stat3}', value: ${val3}, operator: 'add' },`;
  }
  
  replacement += `
    ],`;
  
  content = content.replace(full, replacement);
  replaceCount++;
  
  pattern3.lastIndex = 0;
}

// 写入文件
writeFileSync(filePath, content, 'utf-8');

console.log(`\n=== 转换完成 ===`);
console.log(`共转换：${replaceCount} 处`);
console.log(`文件已保存：${filePath}`);
