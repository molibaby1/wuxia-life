/**
 * P34 lifetime birth→death regression — isolated entry for lifetime slice asserts.
 * Runs independently: npm exec tsx tests/p34LifetimeParityTests.ts
 */
import { runP34LifetimeSimBaseline } from '../src/p25/p34HabitLedSimulationBaselines';
import { runP34MedicalLifetimeBirthToDeathSlice } from '../src/p25/p34LifetimeBirthToDeathSlice';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testLifetimeBirthToDeathUnlock(): void {
  const slice = runP34MedicalLifetimeBirthToDeathSlice();
  assert(slice.seed.birthAge === 0, 'starts from birth age');
  assert(slice.seed.studyHabitStart === 0, 'habit-zero seed');
  assert(slice.usedStaticResolver === false, 'no static resolver on lifetime path');
  assert(slice.terminalCheckpoint.unlocked, 'lifetime unlocks medical_sage_healer');
  assert(slice.terminalCheckpoint.keyChoicesMet, 'lifetime key_choices met');
  assert(slice.resolvedBridgeFlags.includes('medical_pure'), 'medical_pure from p27');
  assert(slice.resolvedBridgeFlags.includes('medical_divine_doctor_fame'), 'fame from p29');
  assert(slice.ageProgression.some(s => s.phase === 'terminal'), 'terminal age checkpoint present');
}

function testLifetimeBaselineAlignment(): void {
  const baseline = runP34LifetimeSimBaseline();
  assert(
    baseline.p34LifetimeBirthToDeath.medicalUnlockRate ===
      baseline.p31StaticBaseline.medical_sage_healer_unlockRate,
    'lifetime aligns with P31 static',
  );
  assert(
    baseline.p34LifetimeBirthToDeath.medicalUnlockRate ===
      baseline.p33MedicalShortChain.medicalUnlockRate,
    'lifetime aligns with P33 short-chain',
  );
  assert(baseline.p34LifetimeBirthToDeath.lifetime.terminalCheckpoint.unlocked, 'baseline lifetime path unlocks');
}

function main(): void {
  testLifetimeBirthToDeathUnlock();
  testLifetimeBaselineAlignment();
  console.log('p34LifetimeParityTests: all passed');
}

main();
