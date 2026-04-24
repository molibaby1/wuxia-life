/**
 * 事件格式统一化脚本
 * 
 * 将所有事件的 effects 从 content.choices[].effects 移动到顶层 choices[].effects
 * 将 autoEffects 保持在顶层
 * 将 add_stats 类型转换为 stat_modify 类型
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const files = [
  'src/data/lines/family-life.json',
  'src/data/lines/jianghu-conflict.json',
  'src/data/lines/elderly-legacy.json',
  'src/data/lines/tutorial.json'
];

/**
 * 将 add_stats 效果转换为 stat_modify 格式
 * add_stats: { type: 'add_stats', stats: { wealth: 50, connections: 20 } }
 * stat_modify: { type: 'stat_modify', target: 'money', value: 50, operator: 'add' }
 */
function convertAddStatsToStatModify(effect: any): any[] {
  if (effect.type === 'add_stats' && effect.stats) {
    const convertedEffects = [];
    // 属性名称映射：旧名称 -> 新名称
    const statNameMap: Record<string, string> = {
      'wealth': 'money',
      'connections': 'connections',
      'chivalry': 'chivalry',
      'reputation': 'reputation',
      'martialPower': 'martialPower',
      'internalSkill': 'internalSkill',
      'externalSkill': 'externalSkill',
      'qinggong': 'qinggong',
      'constitution': 'constitution',
      'comprehension': 'comprehension',
      'charisma': 'charisma',
      'knowledge': 'comprehension'  // 学识映射到悟性
    };
    
    for (const [stat, value] of Object.entries(effect.stats)) {
      const mappedStat = statNameMap[stat] || stat;
      convertedEffects.push({
        type: 'stat_modify',
        target: mappedStat,
        value: value as number,
        operator: 'add'
      });
    }
    return convertedEffects;
  }
  return [effect];
}

function normalizeEventFormat(filePath: string) {
  const fullPath = join(process.cwd(), filePath);
  console.log(`处理文件：${filePath}`);
  
  const content = readFileSync(fullPath, 'utf-8');
  const events = JSON.parse(content);
  
  let modified = false;
  
  events.forEach((event: any) => {
    // 处理选择事件：将 content.choices 移动到顶层 choices
    if (event.eventType === 'choice' && event.content?.choices && !event.choices) {
      event.choices = event.content.choices;
      delete event.content.choices;
      modified = true;
      console.log(`  ✓ 事件 ${event.id}: 移动 choices 到顶层`);
    }
    
    // 确保 effects 格式正确
    if (event.choices) {
      event.choices.forEach((choice: any) => {
        if (choice.effects) {
          const newEffects = [];
          for (const effect of choice.effects) {
            // 转换 add_stats 为 stat_modify
            if (effect.type === 'add_stats' || (!effect.type && effect.stats)) {
              const converted = convertAddStatsToStatModify(effect);
              newEffects.push(...converted);
              modified = true;
              console.log(`  ✓ 事件 ${event.id}: 转换 add_stats 为 stat_modify`);
            } else if (effect.type === 'set_flag') {
              // 转换 set_flag 为 flag_set
              effect.type = 'flag_set';
              newEffects.push(effect);
              modified = true;
              console.log(`  ✓ 事件 ${event.id}: 转换 set_flag 为 flag_set`);
            } else if (effect.type === 'random_outcome') {
              // 转换 random_outcome 为 random
              effect.type = 'random';
              newEffects.push(effect);
              modified = true;
              console.log(`  ✓ 事件 ${event.id}: 转换 random_outcome 为 random`);
            } else if (effect.type === 'end_game') {
              // 转换 end_game 为 special
              effect.type = 'special';
              if (!effect.target) effect.target = 'end_game';
              newEffects.push(effect);
              modified = true;
              console.log(`  ✓ 事件 ${event.id}: 转换 end_game 为 special`);
            } else {
              // 确保其他效果有 type 字段
              if (!effect.type && effect.target) {
                effect.type = 'stat_modify';
                if (!effect.operator) effect.operator = 'add';
              }
              newEffects.push(effect);
            }
          }
          choice.effects = newEffects;
        }
      });
    }
    
    // 处理自动事件的 autoEffects
    if (event.eventType === 'auto' && event.autoEffects) {
      const newEffects = [];
      for (const effect of event.autoEffects) {
        // 转换 add_stats 为 stat_modify
        if (effect.type === 'add_stats' || (!effect.type && effect.stats)) {
          const converted = convertAddStatsToStatModify(effect);
          newEffects.push(...converted);
          modified = true;
          console.log(`  ✓ 事件 ${event.id}: 转换 add_stats 为 stat_modify`);
        } else if (effect.type === 'set_flag') {
          // 转换 set_flag 为 flag_set
          effect.type = 'flag_set';
          newEffects.push(effect);
          modified = true;
          console.log(`  ✓ 事件 ${event.id}: 转换 set_flag 为 flag_set`);
        } else if (effect.type === 'random_outcome') {
          // 转换 random_outcome 为 random
          effect.type = 'random';
          newEffects.push(effect);
          modified = true;
          console.log(`  ✓ 事件 ${event.id}: 转换 random_outcome 为 random`);
        } else if (effect.type === 'end_game') {
          // 转换 end_game 为 special
          effect.type = 'special';
          if (!effect.target) effect.target = 'end_game';
          newEffects.push(effect);
          modified = true;
          console.log(`  ✓ 事件 ${event.id}: 转换 end_game 为 special`);
        } else {
          // 确保其他效果有 type 字段
          if (!effect.type && effect.target) {
            effect.type = 'stat_modify';
            if (!effect.operator) effect.operator = 'add';
          }
          newEffects.push(effect);
        }
      }
      event.autoEffects = newEffects;
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

// 执行格式化
console.log('=== 事件格式统一化 ===\n');
files.forEach(file => normalizeEventFormat(file));
console.log('完成！');
