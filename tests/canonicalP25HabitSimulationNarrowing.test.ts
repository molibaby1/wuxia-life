import fs from 'node:fs';
import path from 'node:path';
import { activeActionCatalog } from '../src/data/activeActionCatalog';
import { childhoodActionCatalog } from '../src/data/childhoodActionCatalog';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import { applyDeclaredActionHabitEffects } from '../src/p25/declaredHabitActionSimulation';
import { runP33HabitZeroOnRampSlice } from '../src/p25/p33HabitZeroOnRampSlice';
import { runP34MedicalLifetimeBirthToDeathSlice } from '../src/p25/p34LifetimeBirthToDeathSlice';
import {
  runP35MixedHealerSwordsmanLifetimeSlice,
  runP35PinnacleMythLegendLifetimeSlice,
} from '../src/p25/p35MixedPinnacleLifetimeSlices';
import {
  runP37MixedMerchantPatronLifetimeSlice,
  runP37PinnacleFoundingPatriarchLifetimeSlice,
} from '../src/p25/p37AdditionalMixedPinnacleLifetimeSlices';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function findAction(actionId: string) {
  const action = [...activeActionCatalog, ...childhoodActionCatalog].find(item => item.id === actionId);
  if (!action) throw new Error(`action not found: ${actionId}`);
  return action;
}

function testDeclaredActionEffectsAndClamp(): void {
  const cases = [
    ['action_training_basic', 'trainingHabit'],
    ['action_study_basic', 'studyHabit'],
    ['action_business_basic', 'businessHabit'],
    ['action_childhood_training', 'trainingHabit'],
    ['action_study_lite', 'studyHabit'],
    ['action_household_apprentice', 'businessHabit'],
  ] as const;
  for (const [actionId, state] of cases) {
    const action = findAction(actionId);
    assert(action.habitEffects?.some(effect => effect.state === state) === true, `${actionId} declares ${state}`);
    const next = applyDeclaredActionHabitEffects(createDefaultPlayerLifeStates(), actionId);
    assert(next[state] === 1, `${actionId} applies only its declared Habit effect`);
  }

  const unchanged = createDefaultPlayerLifeStates({ trainingHabit: 2, studyHabit: 3, businessHabit: 4 });
  assert(
    JSON.stringify(applyDeclaredActionHabitEffects(unchanged, 'action_childhood_yard_play')) === JSON.stringify(unchanged),
    'an action without habitEffects does not change Habit',
  );
  const capped = applyDeclaredActionHabitEffects(
    createDefaultPlayerLifeStates({ trainingHabit: 5 }),
    'action_training_basic',
  );
  assert(capped.trainingHabit === 5, 'declared Habit effects clamp at 5');
  assert(
    applyDeclaredActionHabitEffects(createDefaultPlayerLifeStates(), 'action_household_errand').businessHabit === 0,
    'money and businessAcumen rewards do not imply businessHabit',
  );
  assert(
    applyDeclaredActionHabitEffects(createDefaultPlayerLifeStates(), 'action_travel_basic').studyHabit === 0,
    'knowledge rewards do not imply studyHabit',
  );
}

function testP25TracesUseActionIds(): void {
  const p33 = runP33HabitZeroOnRampSlice();
  assert(p33.onRampSequence.every(step => step.actionId && step.declaredHabitEffect?.state === 'studyHabit'), 'P33 uses declared study actions');
  assert(p33.onRampSequence.at(-1)?.studyHabitAfter === 2, 'P33 reaches threshold through two explicit actions');

  const p34 = runP34MedicalLifetimeBirthToDeathSlice();
  assert(p34.ageProgression.filter(step => step.phase === 'childhood' || step.phase === 'youth').every(step => step.actionId && step.declaredHabitEffect?.state === 'studyHabit'), 'P34 Habit steps identify declared study actions');

  const p35Mixed = runP35MixedHealerSwordsmanLifetimeSlice();
  const p35Pinnacle = runP35PinnacleMythLegendLifetimeSlice();
  assert(p35Mixed.ageProgression.some(step => step.actionId === 'action_childhood_training'), 'P35 mixed records childhood training action');
  assert(p35Mixed.ageProgression.some(step => step.actionId === 'action_study_basic'), 'P35 mixed records study action');
  assert(p35Pinnacle.ageProgression.filter(step => step.actionId).every(step => step.declaredHabitEffect?.state === 'trainingHabit'), 'P35 pinnacle training is explicit');
  assert(p35Mixed.terminalCheckpoint.unlocked && p35Pinnacle.terminalCheckpoint.unlocked, 'P35 terminal outcomes remain unlocked');

  const p37Mixed = runP37MixedMerchantPatronLifetimeSlice();
  const p37Pinnacle = runP37PinnacleFoundingPatriarchLifetimeSlice();
  assert(p37Mixed.ageProgression.some(step => step.actionId === 'action_household_apprentice'), 'P37 mixed records business practice');
  assert(p37Mixed.ageProgression.some(step => step.actionId === 'action_childhood_training'), 'P37 mixed records training practice');
  assert(p37Pinnacle.ageProgression.filter(step => step.actionId).every(step => step.declaredHabitEffect?.state === 'trainingHabit'), 'P37 pinnacle training is explicit');
  assert(p37Mixed.terminalCheckpoint.unlocked && p37Pinnacle.terminalCheckpoint.unlocked, 'P37 terminal outcomes remain unlocked');
}

function testNoGainDrivenHabitProjectionInP25(): void {
  const sourceFiles = [
    'src/p25/p33HabitZeroOnRampSlice.ts',
    'src/p25/p34LifetimeBirthToDeathSlice.ts',
    'src/p25/p35MixedPinnacleLifetimeSlices.ts',
    'src/p25/p37AdditionalMixedPinnacleLifetimeSlices.ts',
  ];
  for (const file of sourceFiles) {
    const source = fs.readFileSync(path.resolve(file), 'utf8');
    assert(!/increment(?:StudyHabitFromComprehension|TrainingHabitFromMartialGain|BusinessHabitFromGain)/.test(source), `${file} has no gain-driven Habit helper`);
    assert(!/(?:academicGain|martialGain|businessGain|moneyGain)\s*>=/.test(source), `${file} has no gain threshold`);
  }
}

testDeclaredActionEffectsAndClamp();
testP25TracesUseActionIds();
testNoGainDrivenHabitProjectionInP25();
console.log('canonicalP25HabitSimulationNarrowing: all passed');
