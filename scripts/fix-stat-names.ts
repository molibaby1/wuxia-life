/**
 * 修复事件中的属性名称
 * 将 wealth -> money, knowledge -> comprehension
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const files = [
  'src/data/lines/middle-age-career.json',
  'src/data/lines/family-life.json',
  'src/data/lines/jianghu-conflict.json',
  'src/data/lines/elderly-legacy.json'
];

// 属性名称映射
const statNameMap: Record<string, string> = {
  'wealth': 'money',
  'knowledge': 'comprehension'
};

function fixStatNames(filePath: string) {
  const fullPath = join(process.cwd(), filePath);
  console.log(`处理文件：${filePath}`);
  
  const content = readFileSync(fullPath, 'utf-8');
  const events = JSON.parse(content);
  
  let modified = false;
  
  events.forEach((event: any) => {
    // 处理 choices 中的 effects
    if (event.choices) {
      event.choices.forEach((choice: any) => {
        if (choice.effects) {
          choice.effects.forEach((effect: any) => {
            if (effect.target && statNameMap[effect.target]) {
              console.log(`  ✓ 事件 ${event.id}: ${effect.target} -> ${statNameMap[effect.target]}`);
              effect.target = statNameMap[effect.target];
              modified = true;
            }
          });
        }
      });
    }
    
    // 处理 autoEffects
    if (event.autoEffects) {
      event.autoEffects.forEach((effect: any) => {
        if (effect.target && statNameMap[effect.target]) {
          console.log(`  ✓ 事件 ${event.id}: ${effect.target} -> ${statNameMap[effect.target]}`);
          effect.target = statNameMap[effect.target];
          modified = true;
        }
      });
    }
    
    // 处理 triggerConditions 中的 stats
    if (event.triggerConditions?.stats) {
      const newStats: any = {};
      let hasChanges = false;
      
      for (const [stat, condition] of Object.entries(event.triggerConditions.stats)) {
        if (statNameMap[stat]) {
          console.log(`  ✓ 事件 ${event.id}: triggerConditions.stats.${stat} -> ${statNameMap[stat]}`);
          newStats[statNameMap[stat]] = condition;
          hasChanges = true;
          modified = true;
        } else {
          newStats[stat] = condition;
        }
      }
      
      if (hasChanges) {
        event.triggerConditions.stats = newStats;
      }
    }
  });
  
  if (modified) {
    const newContent = JSON.stringify(events, null, 2);
    writeFileSync(fullPath, newContent, 'utf-8');
    console.log(`  ✓ 文件已更新\n`);
  } else {
    console.log(`  - 无需修改\n`);
  }
}

// 执行修复
console.log('=== 修复属性名称 ===\n');
files.forEach(file => fixStatNames(file));
console.log('完成！');
