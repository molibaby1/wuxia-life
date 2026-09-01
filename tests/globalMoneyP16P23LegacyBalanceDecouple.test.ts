import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runMidLateLifeValidationSlice } from '../src/p17/validationSlices';
import {
  runContinuityComparisonSlice,
  runInheritedBurdenComparisonSlice,
  runUnderinvestmentComparisonSlice,
} from '../src/p18/validationSlices';
import {
  runEndgameCategoryComparisonSlice,
  runHistoricalMemoryComparisonSlice,
  runPreEndgameClosureComparisonSlice,
} from '../src/p19/validationSlices';
import {
  runArchetypeDifferentiationSlice,
  runArchetypeRegressionMatrix,
  runPacingDifferentiationSlice,
  runReplaySliceValidations,
} from '../src/p20/validationSlices';
import { runP20HabitTrajectorySlice } from '../src/p20/habitTrajectorySlice';
import { scoreSliceExperience } from '../src/p23/sliceFixtures';
import { getWorldProfile } from '../src/narrative/worldProfile';

const P16_P23_ROOTS = ['p16', 'p17', 'p18', 'p19', 'p20', 'p21', 'p22', 'p23'] as const;

function listTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTsFiles(full));
    } else if (entry.name.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

function relativeSrc(filePath: string): string {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
}

function testCompiledSlicesOmitLegacyBalanceFixtures(): void {
  const offenders: string[] = [];
  for (const phase of P16_P23_ROOTS) {
    const dir = path.join('src', phase);
    for (const file of listTsFiles(dir)) {
      const source = fs.readFileSync(file, 'utf8');
      const rel = relativeSrc(file);
      if (/\bmoney\s*:/.test(source)) offenders.push(`${rel}: money fixture field`);
      if (/\.money\s*=/.test(source)) offenders.push(`${rel}: money mutation`);
      if (/\bwealth\s*:\s*\d/.test(source)) offenders.push(`${rel}: numeric wealth fixture`);
      if (/player\.wealth\b/.test(source)) offenders.push(`${rel}: player.wealth access`);
    }
  }
  assert.equal(
    offenders.length,
    0,
    `P16–P23 compiled slices must not fixture or mutate legacy balances:\n${offenders.join('\n')}`,
  );
}

function testValidationSlicesRemainMateriallyDistinct(): void {
  const p17 = runMidLateLifeValidationSlice();
  assert(p17.allyChangesOpportunity, 'P17 concrete ally must still shift opportunity');
  assert(p17.factionAddsDuty, 'P17 orthodox duty must still add burden');
  assert(p17.achievementFragileWhenNeglected, 'P17 neglected hero must still show fragility');

  const continuity = runContinuityComparisonSlice();
  assert(continuity.cultivationChangesStability, 'P18 cultivation must still change stability');

  const burden = runInheritedBurdenComparisonSlice();
  assert(burden.burdenAltersOutcomeSpace, 'P18 inherited burden must still alter outcomes');

  const underinvest = runUnderinvestmentComparisonSlice();
  assert(
    underinvest.underinvestmentWeakerThanAchievementSuggests,
    'P18 underinvestment must still trail strong cultivation',
  );

  const endgame = runEndgameCategoryComparisonSlice();
  assert(endgame.categoryChangesBeyondAge, 'P19 endgame categories must still diverge');

  const memory = runHistoricalMemoryComparisonSlice();
  assert(memory.memoryDiffersFromSelfUnderstanding, 'P19 historical memory must still diverge');

  const closure = runPreEndgameClosureComparisonSlice();
  assert(closure.closureMateriallyChangesSummary, 'P19 closure must still change summary');

  const archetypes = runArchetypeDifferentiationSlice();
  assert(archetypes.atLeastThreeDistinct, 'P20 archetypes must remain distinct');
  assert(archetypes.beyondRouteLabel, 'P20 archetypes must stay beyond route label');

  const pacing = runPacingDifferentiationSlice();
  assert(pacing.pacingMeaningfullyDiffers, 'P20 pacing must still differ');

  const replaySlices = runReplaySliceValidations();
  assert(replaySlices.every(s => s.passed), 'P20 replay slice validations must pass');

  const matrix = runArchetypeRegressionMatrix();
  assert(matrix.allRepresentativeEmerge, 'P20 archetype regression matrix must pass');

  const habits = runP20HabitTrajectorySlice();
  assert(habits.passed, 'P20 habit trajectory slice must pass');

  const sliceIds = getWorldProfile().replaySliceConfigs?.map(s => s.id) ?? [];
  assert(sliceIds.length > 0, 'P23 replay slice configs must exist');
  for (const sliceId of sliceIds) {
    const score = scoreSliceExperience(sliceId);
    assert(Number.isFinite(score) && score >= 0, `P23 slice ${sliceId} must score without legacy balances`);
  }
}

function main(): void {
  testCompiledSlicesOmitLegacyBalanceFixtures();
  testValidationSlicesRemainMateriallyDistinct();
  console.log('globalMoneyP16P23LegacyBalanceDecouple.test.ts: all passed');
}

main();
