/**
 * P8 playability gate regression tests.
 */

import { selectPersonaActiveAction } from '../src/p8/personaActionStrategy';
import { applyPersonaChoiceBias, rankChoiceScores } from '../src/p8/personaChoiceBias';
import { getP8GatePersonas, getP8PersonaById } from '../src/p8/personas';
import { collectAgencyMetrics } from '../src/p8/collectPersonaMetrics';
import { evaluateP8Gate, assemblePlayabilityReport } from '../src/p8/playabilityGate';
import { renderP8MarkdownReport } from '../src/p8/reportBuilder';
import type { GameProcessRecord } from './GameProcessSimulator';
import { P8_METRIC_DEFINITIONS } from '../src/p8/metricDefinitions';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testPersonaActionStrategyTraining(): void {
  const persona = getP8PersonaById('p8-martial-lin')!;
  const result = selectPersonaActiveAction({
    persona,
    availableActions: [
      { actionId: 'action_training_basic', category: 'training', name: '练功' },
      { actionId: 'action_study_basic', category: 'study', name: '读书' },
    ],
    age: 10,
    focusStreakCategory: null,
    focusStreakCount: 0,
  });
  assert(result.actionId === 'action_training_basic', 'martial persona should pick training');
  assert(result.reason.includes('persona_strategy'), 'reason should be recorded');
}

function testPersonaActionStrategyBusiness(): void {
  const persona = getP8PersonaById('p8-wealth-shen')!;
  const result = selectPersonaActiveAction({
    persona,
    availableActions: [
      { actionId: 'action_training_basic', category: 'training', name: '练功' },
      { actionId: 'action_business_basic', category: 'business', name: '营商' },
    ],
    age: 12,
    focusStreakCategory: null,
    focusStreakCount: 0,
  });
  assert(result.actionId === 'action_business_basic', 'wealth persona should pick business');
}

function testPersonaActionStrategyDegrade(): void {
  const persona = getP8PersonaById('p8-explorer-lu')!;
  const result = selectPersonaActiveAction({
    persona,
    availableActions: [{ actionId: 'action_study_basic', category: 'study', name: '读书' }],
    age: 8,
    focusStreakCategory: null,
    focusStreakCount: 0,
  });
  assert(result.actionId === 'action_study_basic', 'should degrade to available action');
  assert(result.reason.length > 0, 'selection reason recorded');
}

function testChoiceDiagnosticsRanking(): void {
  const ranked = rankChoiceScores([
    { choiceId: 'a', score: 10 },
    { choiceId: 'b', score: 7 },
  ]);
  assert(ranked.selectedChoiceId === 'a', 'top choice selected');
  assert(ranked.runnerUpChoiceId === 'b', 'runner up recorded');
  assert(ranked.runnerUpScore === 7, 'runner up score recorded');
}

function testPersonaChoiceBias(): void {
  const persona = getP8PersonaById('p8-wealth-shen')!;
  const biased = applyPersonaChoiceBias({
    persona,
    baseScore: 5,
    choiceId: 'earn_money',
    effects: [{ type: 'stat_modify', target: 'money', value: 20 }],
  });
  assert(biased > 5, 'wealth persona should boost money choices');
}

function testAgencyRepeatedStreak(): void {
  const records: GameProcessRecord[] = Array.from({ length: 5 }, (_, i) => ({
    age: i,
    eventId: 'active_action:action_training_basic',
    eventTitle: '练功',
    eventType: 'auto',
    progressionKind: 'active_action',
    activeActionId: 'action_training_basic',
    gameState: {} as GameProcessRecord['gameState'],
    timestamp: new Date().toISOString(),
  }));
  const agency = collectAgencyMetrics(records);
  assert(agency.repeatedSameActionStreakMax >= 4, 'should detect repeated streak');
}

function testMetricDefinitionsComplete(): void {
  assert(P8_METRIC_DEFINITIONS.length >= 7, 'seven core metrics defined');
  const keys = new Set(P8_METRIC_DEFINITIONS.map(d => d.key));
  assert(keys.has('agency') && keys.has('replayability'), 'expected keys present');
}

function testGateAssemblySmoke(): void {
  const personas = getP8GatePersonas().slice(0, 2);
  const personaRuns = personas.map(p => ({
    personaId: p.id,
    personaName: p.name,
    agency: {
      activeActionCount: 3,
      storyEventCount: 10,
      choiceEventCount: 4,
      forcedEventCount: 0,
      activeActionByCategory: { training: 2, study: 1 },
      repeatedSameActionStreakMax: 2,
      repeatedStreakExamples: [],
    },
    causality: { directEchoCount: 4, genericEchoCount: 1, strongestExamples: [], tooFewEchoes: false },
    achievement: { goals: [], achievedCount: 1, missedCount: 1, unavailableCount: 0 },
    frustration: { setbacks: [], opaqueCount: 0, opaqueRatio: 0, opaqueExamples: [] },
    pacing: { longestLowImpactSpanYears: 3, lowImpactSpanStartAge: 5, lowImpactSpanEndAge: 8 },
    narrativeMemory: {
      earlyLife: 'test',
      turningPoint: 'test',
      age40Identity: 'test',
      evidenceCitations: [{ age: 1, kind: 'choice', text: 'a' }, { age: 2, kind: 'action', text: 'b' }, { age: 3, kind: 'auto', text: 'c' }],
      missingTurningPoint: false,
      missingIdentity: false,
    },
    choiceDiagnostics: [],
    activeActionSelectionReasons: [{ age: 5, actionId: 'action_training_basic', reason: 'test' }],
  }));

  const replay = { pairwiseSimilarities: [], similarityClusters: [], nearDuplicateWarnings: [] };
  const report = assemblePlayabilityReport(personaRuns, replay, 40);
  assert(report.decision === 'pass', 'smoke gate should pass');
  const md = renderP8MarkdownReport(report, 'test.json');
  assert(md.includes('P8 Playability Gate Report'), 'markdown renders');
}

function runAll(): void {
  testPersonaActionStrategyTraining();
  testPersonaActionStrategyBusiness();
  testPersonaActionStrategyDegrade();
  testChoiceDiagnosticsRanking();
  testPersonaChoiceBias();
  testAgencyRepeatedStreak();
  testMetricDefinitionsComplete();
  testGateAssemblySmoke();
  console.log('✔ p8PlayabilityTests passed');
}

runAll();
