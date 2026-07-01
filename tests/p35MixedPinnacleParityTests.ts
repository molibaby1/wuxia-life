/**
 * P35 mixed/pinnacle habit-led lifetime regression — isolated entry.
 * Runs independently: npm exec tsx tests/p35MixedPinnacleParityTests.ts
 */
import { runP35MixedPinnacleSimBaseline } from '../src/p25/p35HabitLedSimulationBaselines';
import {
  runP35MixedHealerSwordsmanLifetimeSlice,
  runP35PinnacleMythLegendLifetimeSlice,
} from '../src/p25/p35MixedPinnacleLifetimeSlices';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testMixedHealerSwordsmanLifetimeUnlock(): void {
  const slice = runP35MixedHealerSwordsmanLifetimeSlice();
  assert(slice.seed.birthAge === 0, 'mixed starts from birth');
  assert(slice.seed.trainingHabitStart === 0 && slice.seed.studyHabitStart === 0, 'dual habit-zero seed');
  assert(slice.usedStaticResolver === false, 'no static resolver on mixed path');
  assert(slice.terminalCheckpoint.unlocked, 'mixed unlocks healer_swordsman');
  assert(slice.terminalCheckpoint.crossTrackGroupsSatisfied >= 2, '≥2 cross-track groups');
  assert(slice.resolvedBridgeFlags.includes('medical_divine_doctor_fame'), 'medical fame bridge');
  assert(slice.resolvedBridgeFlags.includes('p9_early_training_focus'), 'martial track from childhood training');
  assert(slice.ageProgression.some(s => s.phase === 'terminal'), 'mixed terminal checkpoint');
}

function testPinnacleMythLegendLifetimeUnlock(): void {
  const slice = runP35PinnacleMythLegendLifetimeSlice();
  assert(slice.usedStaticResolver === false, 'no static resolver on pinnacle path');
  assert(slice.luckWindow.triggered, 'hidden_master luck window triggered');
  assert(slice.luckWindow.unlocksFlags.includes('p16_rare_master_encounter'), 'luck flag unlocked');
  assert(slice.terminalCheckpoint.unlocked, 'pinnacle unlocks jianghu_myth_legend');
  assert(slice.terminalCheckpoint.choiceGateMet, 'choice gate satisfied');
  assert(slice.terminalCheckpoint.luckGateMet, 'luck gate satisfied');
  assert(slice.failureAttribution.grindOnlyLocked, 'grind-only control stays locked');
  assert(slice.failureAttribution.luckGateUnmet, 'grind-only reports luck gate unmet');
  assert(slice.resolvedBridgeFlags.includes('p16_guardian_oath'), 'guardian oath from orthodox trial');
}

function testMixedPinnacleBaselineAlignment(): void {
  const baseline = runP35MixedPinnacleSimBaseline();
  assert(baseline.p35MixedLifetime.healerSwordsmanUnlockRate === 1, 'mixed lifetime 100% unlock');
  assert(baseline.p35PinnacleLifetime.jianghuMythLegendUnlockRate === 1, 'pinnacle lifetime 100% unlock');
  assert(baseline.p25StaticMixed.mixedIdentitySlicePassed, 'P25 mixed identity slice still passes');
  assert(
    baseline.p35MixedLifetime.healerSwordsmanUnlockRate >=
      baseline.p25StaticMixed.healer_swordsman_unlockRate,
    'mixed lifetime >= P25 static healer rate',
  );
  assert(
    baseline.p35PinnacleLifetime.jianghuMythLegendUnlockRate >=
      baseline.p25StaticPinnacle.jianghu_myth_legend_unlockRate,
    'pinnacle lifetime >= P25 static myth rate',
  );
}

function main(): void {
  testMixedHealerSwordsmanLifetimeUnlock();
  testPinnacleMythLegendLifetimeUnlock();
  testMixedPinnacleBaselineAlignment();
  console.log('p35MixedPinnacleParityTests: all passed');
}

main();
