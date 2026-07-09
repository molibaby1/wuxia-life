#!/usr/bin/env tsx
/**
 * Flat sample-lines route regression — no nested execSync inside stage tests.
 * Run stage suites once each, in dependency order.
 */
import { execSync } from 'node:child_process';

type Suite = { name: string; cmd: string };

const SUITES: Suite[] = [
  { name: 'P100 magnate native endgame', cmd: 'npm exec tsx tests/p100MerchantMagnateNativeEndgameTests.ts' },
  { name: 'P101 magnate bridge-origin endgame', cmd: 'npm exec tsx tests/p101MerchantMagnateBridgeOriginEndgameTests.ts' },
  { name: 'P102 patron bridge', cmd: 'npm exec tsx tests/p102MerchantMartialPatronBridgeTests.ts' },
  { name: 'P103 patron bridge-origin', cmd: 'npm exec tsx tests/p103MerchantMartialPatronBridgeOriginTests.ts' },
  { name: 'P104 patron bridge-origin peasant', cmd: 'npm exec tsx tests/p104MerchantMartialPatronBridgeOriginPeasantTests.ts' },
  { name: 'P106 patron pressure', cmd: 'npm exec tsx tests/p106MerchantMartialPatronPressureTests.ts' },
  { name: 'P108 patron payoff', cmd: 'npm exec tsx tests/p108MerchantMartialPatronPayoffTests.ts' },
  { name: 'P110 patron late-life', cmd: 'npm exec tsx tests/p110MerchantMartialPatronLateLifeTests.ts' },
  { name: 'P112 patron endgame', cmd: 'npm exec tsx tests/p112MerchantMartialPatronEndgameTests.ts' },
  { name: 'P113 founding patriarch bridge', cmd: 'npm exec tsx tests/p113FoundingPatriarchBridgeTests.ts' },
  { name: 'P115 founding patriarch pressure', cmd: 'npm exec tsx tests/p115FoundingPatriarchMidlifePressureTests.ts' },
  { name: 'P117 founding patriarch late-life', cmd: 'npm exec tsx tests/p117FoundingPatriarchLateLifeTests.ts' },
  { name: 'P119 founding patriarch endgame', cmd: 'npm exec tsx tests/p119FoundingPatriarchEndgameTests.ts' },
  { name: 'P37 mixed/pinnacle parity', cmd: 'npm exec tsx tests/p37AdditionalMixedPinnacleParityTests.ts' },
  { name: 'guard:sample-lines-baseline', cmd: 'npm run guard:sample-lines-baseline' },
];

function main(): void {
  console.log('=== Sample-lines route regression (flat) ===\n');
  let passed = 0;
  for (const suite of SUITES) {
    console.log(`--- ${suite.name} ---`);
    execSync(suite.cmd, { stdio: 'inherit' });
    passed += 1;
    console.log(`✓ ${suite.name}\n`);
  }
  console.log(`${passed}/${SUITES.length} suites passed`);
}

main();
