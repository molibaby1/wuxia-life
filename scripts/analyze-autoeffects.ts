#!/usr/bin/env tsx
/**
 * 检查故事数据中 autoEffect 的使用情况
 */

import { readFileSync } from 'fs';

const filePath = process.argv[2] || 'src/data/storyData.ts';
const content = readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log('=== 检查 autoEffect 使用情况 ===\n');

let inAutoEffect = false;
let currentId = '';
let autoEffectStart = 0;
let autoEffectLines: string[] = [];
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // 检查是否是事件 ID
  const idMatch = line.match(/id:\s*'([^']+)'/);
  if (idMatch) {
    currentId = idMatch[1];
  }
  
  // 检查 autoEffect 开始
  if (line.includes('autoEffect:') && !line.trim().startsWith('//')) {
    inAutoEffect = true;
    autoEffectStart = lineNum;
    autoEffectLines = [line];
    braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    continue;
  }
  
  // 如果在 autoEffect 中
  if (inAutoEffect) {
    autoEffectLines.push(line);
    braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    
    // 检查 autoEffect 结束
    if (braceCount <= 0) {
      const autoEffectCode = autoEffectLines.join('\n');
      
      // 分析 autoEffect 返回的内容
      const returnsAge = autoEffectCode.includes('age:');
      const returnsFlags = autoEffectCode.includes('flags:');
      const returnsEvents = autoEffectCode.includes('events:');
      const returnsStats = autoEffectCode.match(/(martialPower|externalSkill|internalSkill|qinggong|chivalry|money):\s*state\./g);
      
      console.log(`${currentId} (行${autoEffectStart}):`);
      if (returnsAge && !returnsFlags && !returnsEvents && !returnsStats) {
        console.log(`  ⚠️  只返回 age: state.age + 1 - 可转换为 TIME_ADVANCE`);
      } else if (returnsFlags || returnsEvents) {
        console.log(`  ⚠️  返回 flags/events Set - 需要手动检查`);
      } else if (returnsStats) {
        console.log(`  ⚠️  返回属性修改 - 可转换为 STAT_MODIFY`);
      } else {
        console.log(`  ℹ️  复杂逻辑 - 需要手动转换`);
      }
      console.log('');
      
      inAutoEffect = false;
    }
  }
}

console.log('\n=== 统计 ===');
console.log('以上列出了所有使用 autoEffect 的事件');
console.log('建议：简单的 age+1 可以批量转换为 TIME_ADVANCE');
