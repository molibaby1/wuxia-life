/**
 * P37 additional mixed/pinnacle habit-led lifetime regression — isolated entry.
 * Runs independently: npm exec tsx tests/p37AdditionalMixedPinnacleParityTests.ts
 */
import { runP37AdditionalMixedPinnacleSimBaseline } from '../src/p25/p37HabitLedSimulationBaselines';
import {
  runP37MixedMerchantPatronLifetimeSlice,
  runP37PinnacleFoundingPatriarchLifetimeSlice,
} from '../src/p25/p37AdditionalMixedPinnacleLifetimeSlices';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testMixedMerchantPatronLifetimeUnlock(): void {
  const slice = runP37MixedMerchantPatronLifetimeSlice();
  assert(slice.seed.birthAge === 0, 'mixed starts from birth');
  assert(slice.seed.businessHabitStart === 0 && slice.seed.trainingHabitStart === 0, 'dual habit-zero seed');
  assert(slice.usedStaticResolver === false, 'no static resolver on mixed path');
  assert(slice.terminalCheckpoint.unlocked, 'mixed unlocks merchant_martial_patron');
  assert(slice.terminalCheckpoint.crossTrackGroupsSatisfied >= 2, '≥2 cross-track groups');
  assert(slice.resolvedBridgeFlags.includes('route_wealth_committed'), 'wealth route bridge');
  assert(slice.resolvedBridgeFlags.includes('merchant_invest_good'), 'sect investment bridge');
  assert(slice.ageProgression.some(s => s.phase === 'terminal'), 'mixed terminal checkpoint');
}

function testPinnacleFoundingPatriarchLifetimeUnlock(): void {
  const slice = runP37PinnacleFoundingPatriarchLifetimeSlice();
  assert(slice.usedStaticResolver === false, 'no static resolver on pinnacle path');
  assert(slice.luckWindow.triggered, 'scholar_mentor luck window triggered');
  assert(slice.luckWindow.unlocksFlags.includes('p16_scholar_mentor'), 'luck flag unlocked');
  assert(slice.terminalCheckpoint.unlocked, 'pinnacle unlocks founding_patriarch');
  assert(slice.terminalCheckpoint.choiceGateMet, 'choice gate satisfied');
  assert(slice.terminalCheckpoint.luckGateMet, 'luck gate satisfied');
  assert(slice.failureAttribution.grindOnlyLocked, 'grind-only control stays locked');
  assert(slice.failureAttribution.luckGateUnmet, 'grind-only reports luck gate unmet');
  assert(slice.resolvedBridgeFlags.includes('p16_alliance_brokered'), 'alliance brokered from faction continuation');
}

function testAdditionalMixedPinnacleBaselineAlignment(): void {
  const baseline = runP37AdditionalMixedPinnacleSimBaseline();
  assert(
    baseline.p37MixedLifetime.merchantMartialPatronUnlockRate === 1,
    'mixed patron lifetime 100% unlock',
  );
  assert(
    baseline.p37PinnacleLifetime.foundingPatriarchUnlockRate === 1,
    'founding patriarch lifetime 100% unlock',
  );
  assert(baseline.p25StaticMixed.mixedIdentitySlicePassed, 'P25 mixed identity slice still passes');
  assert(
    baseline.p37MixedLifetime.merchantMartialPatronUnlockRate >=
      baseline.p25StaticMixed.merchant_martial_patron_unlockRate,
    'mixed patron lifetime >= P25 static patron rate',
  );
  assert(
    baseline.p37PinnacleLifetime.foundingPatriarchUnlockRate >=
      baseline.p25StaticPinnacle.founding_patriarch_unlockRate,
    'founding patriarch lifetime >= P25 static patriarch rate',
  );
  assert(baseline.p35HabitLedLifetime.healerSwordsmanUnlockRate === 1, 'P35 mixed carry-forward');
  assert(baseline.p35HabitLedLifetime.jianghuMythLegendUnlockRate === 1, 'P35 pinnacle carry-forward');
}

function main(): void {
  testMixedMerchantPatronLifetimeUnlock();
  testPinnacleFoundingPatriarchLifetimeUnlock();
  testAdditionalMixedPinnacleBaselineAlignment();
  console.log('p37AdditionalMixedPinnacleParityTests: all passed');
}

main();
