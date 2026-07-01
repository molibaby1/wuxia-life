/**
 * P32 runtime parity regression — isolated entry for parity + short-chain asserts.
 * Runs independently: npm exec tsx tests/p32RuntimeParityTests.ts
 */
import { runP32RuntimeSimBaseline } from '../src/p25/p32HabitLedSimulationBaselines';
import { runP32RenownShortChainSlice } from '../src/p25/p32HabitLedShortChainSlice';
import {
  compareJsonResolverBridgeParity,
  comparePoisonMutexParity,
  P31_BRIDGE_EVENT_SPECS,
  playerAtHabitThreshold,
} from '../src/p25/p32BridgeParity';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testParityAllBridges(): void {
  for (const spec of P31_BRIDGE_EVENT_SPECS) {
    const seed =
      spec.bridgeFlag === 'medical_divine_doctor_fame' ? { p27_study_healer_path: true } : {};
    const atThreshold = compareJsonResolverBridgeParity(
      playerAtHabitThreshold(spec, spec.threshold),
      seed,
      spec,
    );
    assert(atThreshold.aligned, `${spec.bridgeFlag} parity at threshold`);
  }
}

function testShortChainUnlock(): void {
  const slice = runP32RenownShortChainSlice();
  assert(slice.unlocked, 'renown short-chain unlock');
  assert(!slice.usedStaticResolver, 'no static resolver');
}

function testBaselineAlignment(): void {
  const baseline = runP32RuntimeSimBaseline();
  assert(
    baseline.p32RuntimeShortChain.renownUnlockRate === baseline.p31StaticBaseline.jianghu_renown_sage_unlockRate,
    'runtime vs static renown alignment',
  );
}

function testPoisonMutex(): void {
  for (const spec of P31_BRIDGE_EVENT_SPECS) {
    const poison = comparePoisonMutexParity(spec);
    assert(!poison.jsonSetsBridge, `${spec.bridgeFlag} JSON runtime poison block`);
    assert(!poison.resolverSetsBridge, `${spec.bridgeFlag} resolver poison block`);
    assert(poison.aligned, `${spec.bridgeFlag} poison mutex aligned`);
  }
}

function main(): void {
  testParityAllBridges();
  testShortChainUnlock();
  testBaselineAlignment();
  testPoisonMutex();
  console.log('p32RuntimeParityTests: all passed');
}

main();
