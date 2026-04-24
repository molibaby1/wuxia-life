#!/usr/bin/env tsx
/**
 * 统一人生流程模拟器入口（兼容 scripts/life-simulator 调用方式）
 * 
 * 说明：
 * - 真实模拟逻辑由 tests/GameProcessSimulator.ts 执行
 * - 本文件仅做参数解析与转发，保持单一模拟系统
 */

import { GameProcessSimulator } from '../../tests/GameProcessSimulator';

type Args = {
  years?: number;
  quiet?: boolean;
  name?: string;
  gender?: 'male' | 'female';
};

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (const raw of argv) {
    if (raw.startsWith('--years=')) {
      const value = Number(raw.split('=')[1]);
      if (!Number.isNaN(value)) args.years = value;
    } else if (raw === '--quiet') {
      args.quiet = true;
    } else if (raw.startsWith('--name=')) {
      args.name = raw.split('=')[1] || undefined;
    } else if (raw.startsWith('--gender=')) {
      const value = raw.split('=')[1];
      if (value === 'male' || value === 'female') args.gender = value;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const simulator = new GameProcessSimulator({
    playerName: args.name || '测试玩家',
    gender: args.gender || 'male',
    simulateYears: args.years ?? 80,
    verbose: !args.quiet,
  });
  
  await simulator.simulate();
}

main().catch(error => {
  console.error('❌ 模拟器运行失败:', error);
  process.exit(1);
});
