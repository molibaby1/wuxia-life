/**
 * P33 runtime parity regression — isolated entry for medical short-chain + habit-zero asserts.
 * Runs independently: npm exec tsx tests/p33RuntimeParityTests.ts
 */
import { runP33RuntimeSimBaseline } from '../src/p25/p33HabitLedSimulationBaselines';
import { runP33MedicalShortChainSlice } from '../src/p25/p32HabitLedShortChainSlice';
import { runP33HabitZeroOnRampSlice } from '../src/p25/p33HabitZeroOnRampSlice';
import { comparePoisonMutexParity, P31_BRIDGE_EVENT_SPECS } from '../src/p25/p32BridgeParity';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testMedicalShortChainUnlock(): void {
  const slice = runP33MedicalShortChainSlice();
  assert(slice.unlocked, 'medical short-chain unlocks medical_sage_healer');
  assert(!slice.usedStaticResolver, 'no static resolver on medical path');
  assert(slice.resolvedBridgeFlags.includes('medical_pure'), 'medical_pure from p27');
  assert(slice.resolvedBridgeFlags.includes('medical_divine_doctor_fame'), 'fame from p29');
}

function testHabitZeroOnRamp(): void {
  const slice = runP33HabitZeroOnRampSlice();
  assert(slice.seed.studyHabitStart === 0, 'habit-zero start');
  assert(slice.thresholdReached, 'threshold reached');
  assert(slice.bridgeEventEligibleAtThreshold, 'p27 eligible at threshold');
}

function testMedicalBaselineAlignment(): void {
  const baseline = runP33RuntimeSimBaseline();
  assert(
    baseline.p33MedicalRuntimeShortChain.medicalUnlockRate ===
      baseline.p31StaticBaseline.medical_sage_healer_unlockRate,
    'medical runtime aligns with P31 static',
  );
  assert(baseline.p33MedicalRuntimeShortChain.medical.unlocked, 'baseline medical path unlocks');
}

function testPoisonMutexGate(): void {
  for (const spec of P31_BRIDGE_EVENT_SPECS) {
    const poison = comparePoisonMutexParity(spec);
    assert(poison.aligned, `${spec.bridgeFlag} poison mutex gated`);
  }
}

function main(): void {
  testMedicalShortChainUnlock();
  testHabitZeroOnRamp();
  testMedicalBaselineAlignment();
  testPoisonMutexGate();
  console.log('p33RuntimeParityTests: all passed');
}

main();
