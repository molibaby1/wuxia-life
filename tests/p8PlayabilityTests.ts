/**
 * P8 playability gate regression tests.
 */

import { selectPersonaActiveAction } from '../src/p8/personaActionStrategy';
import { resolvePersonaYouthRouteSeeds } from '../src/p8/personaYouthRouteSeeds';
import { applyPersonaChoiceBias, rankChoiceScores } from '../src/p8/personaChoiceBias';
import { getP8GatePersonas, getP8PersonaById } from '../src/p8/personas';
import { collectAgencyMetrics } from '../src/p8/collectPersonaMetrics';
import { evaluateP8Gate, assemblePlayabilityReport } from '../src/p8/playabilityGate';
import { renderP8MarkdownReport } from '../src/p8/reportBuilder';
import { runHeadlessPersona } from '../src/headless/playability/headlessPersonaRunner';
import type { GameProcessRecord } from '../src/types/simulationRecordTypes';
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

function testDeviantYouthRouteSeeds(): void {
  const deviant = getP8PersonaById('p8-deviant-ye')!;
  const martial = getP8PersonaById('p8-martial-lin')!;
  const deviantSeeds = resolvePersonaYouthRouteSeeds(deviant);
  const martialSeeds = resolvePersonaYouthRouteSeeds(martial);
  assert(deviantSeeds.p8_route_demonic === true, 'deviant gets demonic route flag');
  assert(martialSeeds.p9_early_training_focus === true, 'martial keeps training focus');
  assert(deviantSeeds.p9_early_training_focus !== true, 'deviant should not mirror martial training focus');
}

function testDeviantActionStrategyStudyMix(): void {
  const persona = getP8PersonaById('p8-deviant-ye')!;
  const childhoodStudy = selectPersonaActiveAction({
    persona,
    availableActions: [
      { actionId: 'action_training_basic', category: 'training', name: '练功' },
      { actionId: 'action_study_basic', category: 'study', name: '读书' },
    ],
    age: 5,
    focusStreakCategory: null,
    focusStreakCount: 0,
  });
  assert(childhoodStudy.actionId === 'action_study_basic', 'deviant should study-spike at age 5');
  assert(childhoodStudy.reason.includes('demonic_childhood_study_spike'), 'deviant childhood study reason');

  const shadowTrade = selectPersonaActiveAction({
    persona,
    availableActions: [
      { actionId: 'action_training_basic', category: 'training', name: '练功' },
      { actionId: 'action_business_basic', category: 'business', name: '营商' },
    ],
    age: 9,
    focusStreakCategory: null,
    focusStreakCount: 0,
  });
  assert(shadowTrade.actionId === 'action_business_basic', 'deviant should shadow-trade at age 9');
  assert(shadowTrade.reason.includes('demonic_childhood_shadow_trade'), 'deviant shadow trade reason');

  const adultStudyMix = selectPersonaActiveAction({
    persona,
    availableActions: [
      { actionId: 'action_training_basic', category: 'training', name: '练功' },
      { actionId: 'action_study_basic', category: 'study', name: '读书' },
    ],
    age: 16,
    focusStreakCategory: null,
    focusStreakCount: 0,
  });
  assert(adultStudyMix.actionId === 'action_study_basic', 'deviant should study-mix at age 16');
  assert(adultStudyMix.reason.includes('demonic_study_mix'), 'deviant adult study reason');
}

function testLowRiskPersonaBreaksFocusStreak(): void {
  const persona = getP8PersonaById('p8-scholar-su')!;
  assert(persona.riskPreference === 'low', 'scholar fixture is low risk');
  const result = selectPersonaActiveAction({
    persona,
    availableActions: [
      { actionId: 'action_study_basic', category: 'study', name: '读书' },
      { actionId: 'action_training_basic', category: 'training', name: '练功' },
    ],
    age: 16,
    focusStreakCategory: 'study',
    focusStreakCount: 4,
  });
  assert(result.actionId === 'action_training_basic', 'low-risk persona should break study streak at 4');
  assert(result.reason.includes('broke_focus_streak'), 'streak break reason recorded');
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

function testBalancedChoiceBias(): void {
  const persona = getP8PersonaById('p8-balanced-wei')!;
  const childhoodBalanced = applyPersonaChoiceBias({
    persona,
    baseScore: 5,
    choiceId: 'balance_both',
    eventId: 'childhood_preference',
  });
  const childhoodStudy = applyPersonaChoiceBias({
    persona,
    baseScore: 5,
    choiceId: 'focus_on_study',
    eventId: 'childhood_preference',
  });
  assert(
    childhoodBalanced > childhoodStudy,
    `balanced persona should prefer balance_both over focus_on_study, got ${childhoodBalanced} <= ${childhoodStudy}`,
  );

  const balanced = applyPersonaChoiceBias({
    persona,
    baseScore: 5,
    choiceId: 'balanced_start',
    eventId: 'martial_arts_enlightenment',
  });
  const martial = applyPersonaChoiceBias({
    persona,
    baseScore: 5,
    choiceId: 'external_focus',
    eventId: 'martial_arts_enlightenment',
  });
  assert(balanced > martial, `balanced persona should prefer balanced_start over martial fork, got ${balanced} <= ${martial}`);
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
  const causality = P8_METRIC_DEFINITIONS.find(d => d.key === 'causality')!;
  const replayability = P8_METRIC_DEFINITIONS.find(d => d.key === 'replayability')!;
  assert(causality.severity === 'info', 'causality is diagnostic-only');
  assert(causality.nonBlocking === true, 'causality is non-blocking');
  assert(!('thresholdMin' in causality), 'causality has no formal thresholdMin');
  assert(replayability.severity === 'info', 'replayability is diagnostic-only');
  assert(replayability.nonBlocking === true, 'replayability is non-blocking');
  assert(!('thresholdMax' in replayability), 'replayability has no formal thresholdMax');
}

function testLegacyDiagnosticsDoNotProduceGateVerdicts(): void {
  const personaRuns = [
    {
      personaId: 'diagnostic-only',
      personaName: 'Diagnostic only',
      agency: {
        activeActionCount: 3,
        storyEventCount: 10,
        choiceEventCount: 4,
        forcedEventCount: 0,
        activeActionByCategory: { training: 2, study: 1 },
        repeatedSameActionStreakMax: 2,
        repeatedStreakExamples: [],
      },
      causality: { directEchoCount: 0, genericEchoCount: 1, strongestExamples: [], tooFewEchoes: true },
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
      activeActionSelectionReasons: [],
    },
  ];
  const replay = { pairwiseSimilarities: [], similarityClusters: [], nearDuplicateWarnings: ['diagnostic-only ~ another-persona'] };
  const report = assemblePlayabilityReport(personaRuns, replay, 40);
  const formalKeys = new Set(report.verdicts.map(v => v.key));
  const warningKeys = new Set(report.warnings.map(v => v.key));
  assert(report.decision === 'pass', 'legacy diagnostics do not fail the gate');
  assert(!formalKeys.has('causality'), 'causality has no formal verdict');
  assert(!formalKeys.has('replayability'), 'replayability has no formal verdict');
  assert(!warningKeys.has('causality'), 'causality has no formal warning');
  assert(!warningKeys.has('replayability'), 'replayability has no formal warning');
  assert(report.personaRuns[0].causality.directEchoCount === 0, 'causality diagnostic payload is retained');
  assert(report.replay.nearDuplicateWarnings.length === 1, 'replay diagnostic payload is retained');
  const markdown = renderP8MarkdownReport(report, 'test.json');
  assert(markdown.includes('Causality (legacy diagnostic)'), 'causality report section is diagnostic-only');
  assert(markdown.includes('Replay Similarity (legacy diagnostic)'), 'replay report section is diagnostic-only');
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

async function testHeadlessGateReportRuntimePath(): Promise<void> {
  const report = assemblePlayabilityReport([], { pairwiseSimilarities: [], similarityClusters: [], nearDuplicateWarnings: [] }, 40, {
    runtimePath: 'headless_server',
    catalogVersion: '1.0.0',
    engineVersion: 'test',
  });
  assert(report.runtimePath === 'headless_server', 'runtimePath should be headless_server');
  const md = renderP8MarkdownReport(report, 'test.json');
  assert(md.includes('headless_server'), 'markdown includes runtimePath');
}

async function testHeadlessRunnerSmokeOnePersona(): Promise<void> {
  const persona = getP8PersonaById('p8-martial-lin')!;
  const result = await runHeadlessPersona({
    persona,
    endAge: 15,
    catalogVersion: '1.0.0',
    maxSteps: 300,
  });
  assert(result.finalAge >= 15, 'headless smoke reaches target age');
  assert(result.totalActiveActions >= 1, 'headless smoke records active actions');
}

async function runAll(): Promise<void> {
  testPersonaActionStrategyTraining();
  testDeviantYouthRouteSeeds();
  testDeviantActionStrategyStudyMix();
  testPersonaActionStrategyBusiness();
  testLowRiskPersonaBreaksFocusStreak();
  testPersonaActionStrategyDegrade();
  testChoiceDiagnosticsRanking();
  testPersonaChoiceBias();
  testBalancedChoiceBias();
  testAgencyRepeatedStreak();
  testMetricDefinitionsComplete();
  testLegacyDiagnosticsDoNotProduceGateVerdicts();
  testGateAssemblySmoke();
  await testHeadlessGateReportRuntimePath();
  await testHeadlessRunnerSmokeOnePersona();
  console.log('✔ p8PlayabilityTests passed');
}

runAll().catch(err => {
  console.error(err);
  process.exit(1);
});
