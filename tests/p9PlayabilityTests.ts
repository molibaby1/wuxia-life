/**
 * P9 playability and narrative config regression tests.
 */

import { buildWarningTriageReport } from '../src/p9/warningTriage';
import { loadP8BaselineReport } from '../src/p9/loadP8Baseline';
import { eventLoader } from '../src/core/EventLoader';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { EventPriority } from '../src/types/eventTypes';
import type { P8PlayabilityReport } from '../src/p8/types';
import type { P9WarningTriageReport, WarningBucket } from '../src/p9/types';
import { getStageForAge, getAllStageConfigs } from '../src/narrative/config/stageConfig';
import { getRouteDefinition, getRouteIdentityFromFlags } from '../src/narrative/config/routeDefinitions';
import { getEchoHookByActionId, getAllEchoHooks } from '../src/narrative/config/echoHooks';
import { getActionById } from '../src/data/activeActionCatalog';
import { applySummaryTemplate, getSummaryTemplateForIdentity } from '../src/narrative/config/summaryTemplates';
import {
  getStageFeedbackExpectationForAge,
  resolveConfiguredAge40Identity,
  resolveConfiguredEchoSummaryVars,
  WUXIA_WORLD_PROFILE,
} from '../src/narrative/NarrativeConfigLoader';
import {
  collectCausalityMetrics,
  collectReplayMetrics,
  isPacingImpactRecord,
} from '../src/p8/collectPersonaMetrics';
import { assemblePlayabilityReport } from '../src/p8/playabilityGate';
import { P8_GATE_END_AGE } from '../src/p8/metricDefinitions';
import type { GameProcessRecord } from '../src/types/simulationRecordTypes';
import type { GameState } from '../src/types/eventTypes';
import { runAllPersonaSimulations, runPersonaSimulations } from '../src/p9/simulationRunner';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const P8_BASELINE_SOURCE = 'p8-playability-gate-latest.json';
const WARNING_BUCKETS: WarningBucket[] = ['replayability', 'pacing', 'causality', 'other'];

function assertBaselineReportShape(report: P8PlayabilityReport): void {
  assert(report.schemaVersion === 'p8-v1', 'baseline schemaVersion must be p8-v1');
  assert(typeof report.generatedAt === 'string' && report.generatedAt.length > 0, 'baseline generatedAt');
  assert(report.decision === 'pass' || report.decision === 'fail', 'baseline decision');
  assert(report.endAge === P8_GATE_END_AGE, `baseline endAge must be ${P8_GATE_END_AGE}`);
  assert(Array.isArray(report.personaRuns) && report.personaRuns.length > 0, 'baseline personaRuns');
  assert(report.replay !== undefined, 'baseline replay payload');
  assert(Array.isArray(report.replay.nearDuplicateWarnings), 'baseline nearDuplicateWarnings');
  assert(Array.isArray(report.warnings), 'baseline warnings array');
  assert(Array.isArray(report.verdicts), 'baseline verdicts array');
  assert(
    report.runtimePath === 'headless_server',
    'baseline runtimePath must be headless_server; re-run npm run gate:playability (not --mode local_direct)',
  );
}

function assertTriageReportShape(triage: P9WarningTriageReport, baseline: P8PlayabilityReport): void {
  assert(triage.schemaVersion === 'p9-triage-v1', 'triage schemaVersion must be p9-triage-v1');
  assert(typeof triage.generatedAt === 'string' && triage.generatedAt.length > 0, 'triage generatedAt');
  assert(triage.sourceReport === P8_BASELINE_SOURCE, 'triage sourceReport');
  assert(triage.baselineDecision === baseline.decision, 'triage baselineDecision matches baseline');
  assert(triage.totalWarnings === baseline.warnings.length, 'triage totalWarnings matches baseline');
  assert(triage.totalWarnings === triage.allWarnings.length, 'triage allWarnings length');
  for (const bucket of WARNING_BUCKETS) {
    assert(Array.isArray(triage.byBucket[bucket]), `triage bucket ${bucket} is array`);
  }
  const bucketTotal = WARNING_BUCKETS.reduce((sum, bucket) => sum + triage.byBucket[bucket].length, 0);
  assert(bucketTotal === triage.totalWarnings, 'triage bucket totals match totalWarnings');
  for (const entry of triage.allWarnings) {
    assert(WARNING_BUCKETS.includes(entry.bucket), `triage entry bucket valid: ${entry.bucket}`);
    assert(typeof entry.personaId === 'string', 'triage entry personaId');
    assert(typeof entry.detail === 'string', 'triage entry detail');
  }
}

function assertWarningCountMaintainsOrImproves(
  current: number,
  baseline: number,
  label: string,
): void {
  if (baseline > 0) {
    assert(
      current <= baseline,
      `${label} warnings should maintain or improve: ${current} vs baseline ${baseline}`,
    );
    return;
  }
  assert(current === 0, `${label} warnings should stay at zero when baseline is clean: got ${current}`);
}

function testStageConfigCoversZeroToForty(): void {
  const stages = getAllStageConfigs();
  assert(stages.length === 4, 'four stage bands expected');
  assert(getStageForAge(5)?.id === 'stage_0_10', 'age 5 in first stage');
  assert(getStageForAge(35)?.id === 'stage_30_40', 'age 35 in last stage');
  assert(getStageForAge(40)?.id === 'stage_30_40', 'gate end age 40 in last stage');
  assert(getStageFeedbackExpectationForAge(25)?.expectedSignals.includes('identity_signal') ?? false, 'stage helper exposes expected signals');
}

function testRouteDefinitionsExist(): void {
  assert(getRouteDefinition('route_wealth') !== undefined, 'wealth route defined');
  assert(getRouteDefinition('route_wanderer') !== undefined, 'wanderer route defined');
  const identity = getRouteIdentityFromFlags({ p9_route_identity_merchant_master: 'merchant_caravan_master' });
  assert(identity === 'merchant_caravan_master', 'route identity from flags');
  const fallbackIdentity = getRouteIdentityFromFlags({}, 'balanced');
  assert(fallbackIdentity === 'balanced_path', 'route identity fallback from route preference');
}

function testEchoHooksCoverMinimumActions(): void {
  const hooks = getAllEchoHooks();
  assert(hooks.length >= 5, 'all five minimum actions have echo hooks');
  assert(getEchoHookByActionId('action_training_basic') !== undefined, 'training hook');
  assert(getEchoHookByActionId('action_study_basic')?.callbackEventId === 'p9_study_echo_midlife', 'study hook');
  assert(getEchoHookByActionId('action_socializing_basic')?.callbackEventId === 'p9_social_echo_midlife', 'social hook');
  assert(
    getEchoHookByActionId('action_business_basic')?.callbackEventId === 'p9_merchant_midlife_caravan',
    'business hook callbacks merchant midlife divergence',
  );
  assert(
    getEchoHookByActionId('action_travel_basic')?.callbackEventId === 'p9_wanderer_midlife_discovery',
    'travel hook callbacks wanderer midlife divergence',
  );
  assert(
    getEchoHookByActionId('action_business_basic')?.summaryContribution?.enabled === true,
    'business hook contributes summary echo',
  );
  assert(
    getEchoHookByActionId('action_travel_basic')?.summaryContribution?.enabled === true,
    'travel hook contributes summary echo',
  );
  const balancedHarmony = eventLoader.getEventById('p9_balanced_midlife_harmony');
  assert(
    balancedHarmony?.autoEffects?.some(
      effect => effect.type === 'flag_set' && effect.target === 'p9_summary_echo_study',
    ) === true,
    'balanced midlife harmony preserves the early study echo',
  );
}

function testSummaryTemplateApply(): void {
  const tpl = getSummaryTemplateForIdentity('merchant_caravan_master', 'wealth');
  const text = applySummaryTemplate(tpl, {
    origin: '商户之家',
    route_identity: 'merchant_caravan_master',
    echo_suffix: '，幼年练功的习惯延续至今',
  });
  assert(text.includes('商户之家'), 'origin in summary');
  assert(text.includes('商路'), 'merchant route wording');
  const fallbackTemplate = getSummaryTemplateForIdentity(null, 'balanced');
  assert(fallbackTemplate.id === 'wuxia_identity_balanced', 'balanced summary template selected declaratively');
}

function testConfiguredIdentityResolver(): void {
  const text = resolveConfiguredAge40Identity(
    {
      p9_route_identity_wanderer: 'wanderer_map_legend',
      p9_echo_training_hook: true,
      p9_summary_echo_training: '幼年练功的习惯延续至今',
    },
    'wanderer',
    '寒门',
  );
  assert(text.includes('游侠'), 'wanderer template');
  assert(text.includes('寒门'), 'origin preserved');
  assert(text.includes('幼年练功的习惯延续至今'), 'configured summary contribution preserved');
}

function testWorldProfileAssembly(): void {
  assert(WUXIA_WORLD_PROFILE.id === 'wuxia', 'world profile id');
  assert(WUXIA_WORLD_PROFILE.stats.length >= 9, 'world profile carries stats metadata');
  assert(Array.isArray(WUXIA_WORLD_PROFILE.resources), 'world profile declares resources array');
  assert(!WUXIA_WORLD_PROFILE.resources.some(resource => resource.id === 'money'), 'retired wallet must not be profile resource');
  assert(!WUXIA_WORLD_PROFILE.stats.some(stat => stat.id === 'money'), 'retired wallet must not be profile stat');
  assert(WUXIA_WORLD_PROFILE.actionFamilies.length >= 5, 'world profile carries action families');
  assert(WUXIA_WORLD_PROFILE.routeDefinitions.length >= 6, 'world profile carries route definitions');
  assert(WUXIA_WORLD_PROFILE.echoHooks.some(h => h.summaryContribution?.enabled), 'world profile carries summary contributions');
}

function testEchoSummaryContributionResolver(): void {
  const vars = resolveConfiguredEchoSummaryVars({
    p9_echo_training_hook: true,
    p9_summary_echo_training: '幼年练功的习惯延续至今',
    p9_echo_study_hook: true,
    p9_summary_echo_study: '早年读书的底子成为今日名声',
  });
  assert(
    vars.echo_suffix === '，幼年练功的习惯延续至今，早年读书的底子成为今日名声',
    `configured echo suffix order stable: ${vars.echo_suffix}`,
  );
}

function testWarningTriageFromBaseline(): void {
  const report = loadP8BaselineReport();
  assertBaselineReportShape(report);

  const triage = buildWarningTriageReport(report, P8_BASELINE_SOURCE);
  assertTriageReportShape(triage, report);

  if (report.warnings.length === 0) {
    assert(triage.totalWarnings === 0, 'zero-warning baseline yields empty triage');
    for (const bucket of WARNING_BUCKETS) {
      assert(triage.byBucket[bucket].length === 0, `zero-warning baseline leaves ${bucket} bucket empty`);
    }
    return;
  }

  for (const warning of report.warnings) {
    const matched = triage.allWarnings.some(
      entry => entry.metric === warning.key && entry.detail === warning.detail,
    );
    assert(matched, `triage preserves baseline warning: ${warning.key} ${warning.detail}`);
  }
}

function testCausalityDetectsExplicitEchoFlag(): void {
  const records: GameProcessRecord[] = [
    {
      age: 2,
      eventId: 'x',
      eventTitle: '练功',
      eventType: 'auto',
      progressionKind: 'active_action',
      activeActionId: 'action_training_basic',
      gameState: { flags: { p9_echo_training_hook: true }, player: { age: 2, flags: {} } } as GameProcessRecord['gameState'],
      timestamp: '',
    },
    {
      age: 26,
      eventId: 'p9_training_echo_midlife',
      eventTitle: '功底显现',
      eventText: '你忽然想起幼年坚持 action_training_basic 练功打下的底子',
      eventType: 'auto',
      gameState: {
        flags: { p9_explicit_training_echo: true, p9_echo_training_hook: true },
        player: { age: 26, flags: {} },
      } as GameProcessRecord['gameState'],
      timestamp: '',
    },
  ];
  const metrics = collectCausalityMetrics(records);
  assert(metrics.directEchoCount >= 1, 'explicit echo detected');
}

function testCausalityIgnoresGenericStatOnly(): void {
  const records: GameProcessRecord[] = [
    {
      age: 10,
      eventId: 'x',
      eventTitle: '练功',
      eventType: 'auto',
      progressionKind: 'active_action',
      activeActionId: 'action_training_basic',
      outcomeText: '武功提升，功力增加',
      gameState: { flags: {}, player: { age: 10, flags: {} } } as GameProcessRecord['gameState'],
      timestamp: '',
    },
  ];
  const metrics = collectCausalityMetrics(records);
  assert(metrics.genericEchoCount >= 1, 'generic stat echo counted separately');
  assert(metrics.directEchoCount === 0, 'generic stat not direct echo');
}

async function testScholarAndSocialCausalityEchoes(): Promise<void> {
  const [scholar, social] = await runPersonaSimulations(['p8-scholar-su', 'p8-social-gu']);
  assert(
    scholar.metrics.agency.activeActionByCategory.study > 0,
    'scholar should execute study active actions',
  );
  assert(
    scholar.report.records.some(record => record.eventId === 'p9_study_echo_midlife'),
    'scholar should reach study callback event',
  );
  assert(
    social.metrics.agency.activeActionByCategory.socializing > 0,
    'social should execute socializing active actions',
  );
  assert(
    social.report.records.some(record => record.eventId === 'p9_social_echo_midlife'),
    'social should reach social callback event',
  );
}

async function testYouthTransitionContributesPacingEvidence(): Promise<void> {
  const [social] = await runPersonaSimulations(['p8-social-gu']);
  const youthTransition = social.report.records.find(record => record.eventId === 'youth_begins');
  if (!youthTransition) {
    throw new Error('executed youth_begins transition must be present in persona evidence');
  }
  assert(youthTransition.age === 13, `youth_begins evidence age: ${youthTransition.age}`);
  assert(youthTransition.eventType === 'auto', 'youth_begins evidence remains automatic');
  assert(isPacingImpactRecord(youthTransition), 'youth_begins transition contributes pacing impact');
}

async function testGatePacingWarningsReduced(): Promise<void> {
  const baseline = loadP8BaselineReport();
  const baselinePacing = baseline.warnings.filter(w => w.key === 'pacing').length;

  const bundles = await runAllPersonaSimulations();
  const replay = collectReplayMetrics(bundles.map(b => ({ personaId: b.personaId, report: b.report })));
  const report = assemblePlayabilityReport(
    bundles.map(b => b.metrics),
    replay,
    P8_GATE_END_AGE,
  );
  const pacingWarnings = report.warnings.filter(w => w.key === 'pacing').length;

  assertWarningCountMaintainsOrImproves(pacingWarnings, baselinePacing, 'pacing');
  for (const b of bundles) {
    const baselineRun = baseline.personaRuns.find(r => r.personaId === b.personaId);
    const baselineSpan = baselineRun?.pacing.longestLowImpactSpanYears ?? 5;
    assert(
      b.metrics.pacing.longestLowImpactSpanYears <= baselineSpan,
      `${b.personaId} pacing span ${b.metrics.pacing.longestLowImpactSpanYears}y > baseline ${baselineSpan}y`,
    );
  }
}

async function testMartialDeviantIdentityDiverged(): Promise<void> {
  const [martial, deviant] = await runPersonaSimulations(['p8-martial-lin', 'p8-deviant-ye']);
  const martialIdentity = martial.metrics.narrativeMemory.age40Identity;
  const deviantIdentity = deviant.metrics.narrativeMemory.age40Identity;
  assert(martialIdentity !== deviantIdentity, `martial vs deviant identity: ${martialIdentity} vs ${deviantIdentity}`);
  assert(
    deviantIdentity.includes('邪') || deviant.report.records.some(r =>
      r.gameState?.flags?.p9_route_identity_deviant,
    ),
    'deviant-ye has deviant route signal',
  );
}

async function testWealthPersonaBusinessProgression(): Promise<void> {
  const [wealth] = await runPersonaSimulations(['p8-wealth-shen']);
  const businessActions = wealth.metrics.agency.activeActionByCategory.business ?? 0;
  assert(businessActions > 0, `wealth persona should take business actions (got ${businessActions})`);
  const terminalIndex = wealth.report.records.findIndex(record => record.gameState?.player?.alive === false);
  const firstBusinessActionIndex = wealth.report.records.findIndex(
    record =>
      record.progressionKind === 'active_action' &&
      getActionById(record.activeActionId ?? '')?.category === 'business',
  );
  assert(firstBusinessActionIndex >= 0, 'wealth persona business action evidence is retained');
  assert(
    terminalIndex < 0 || firstBusinessActionIndex < terminalIndex,
    'wealth persona business action occurs before any valid terminal',
  );
}

async function testExplorerPersonaTravelEchoes(): Promise<void> {
  const [explorer] = await runPersonaSimulations(['p8-explorer-lu']);
  const travelActions = explorer.metrics.agency.activeActionByCategory.travel ?? 0;
  assert(travelActions > 0, `explorer persona should take travel actions (got ${travelActions})`);
  const terminalIndex = explorer.report.records.findIndex(record => record.gameState?.player?.alive === false);
  const firstTravelActionIndex = explorer.report.records.findIndex(
    record =>
      record.progressionKind === 'active_action' &&
      getActionById(record.activeActionId ?? '')?.category === 'travel',
  );
  assert(firstTravelActionIndex >= 0, 'explorer persona travel action evidence is retained');
  assert(
    terminalIndex < 0 || firstTravelActionIndex < terminalIndex,
    'explorer persona travel action occurs before any valid terminal',
  );
}

function makeP9RouteProofState(
  engine: GameEngineIntegration,
  flags: Record<string, unknown>,
): GameState {
  const state = engine.getGameState();
  state.player.age = 28;
  state.player.alive = true;
  state.flags = flags;
  state.player.flags = flags;
  return state;
}

async function testMerchantRouteReachabilityProof(): Promise<void> {
  const merchantEvent = eventLoader.getEventById('p9_merchant_midlife_caravan');
  assert(merchantEvent !== undefined, 'runtime catalog must load p9_merchant_midlife_caravan');
  assert(
    merchantEvent!.ageRange.min === 28 && merchantEvent!.ageRange.max === 28,
    'merchant route point is exact age 28',
  );
  assert(merchantEvent!.priority === EventPriority.CRITICAL, 'merchant route point remains critical');
  const tags = merchantEvent!.metadata?.tags ?? [];
  assert(tags.includes('mandatory') && tags.includes('mainline'), 'merchant route point remains mandatory mainline');

  const engine = new GameEngineIntegration();
  const state = makeP9RouteProofState(engine, {
    route_merchant: true,
    p9_early_business_focus: true,
  });
  const evaluator = new ConditionEvaluator();
  assert(state.player.age === 28 && state.player.alive === true, 'merchant proof state is alive at age 28');
  assert(
    (merchantEvent!.conditions ?? []).every(condition => evaluator.evaluate(condition, state)),
    'merchant route point conditions pass with canonical merchant evidence',
  );
  assert(
    engine.getAvailableEvents(28).some(event => event.id === merchantEvent!.id),
    'merchant route point appears in runtime available events',
  );

  const choiceOutcomes = new Map<string, Record<string, unknown>>();
  for (const choiceId of ['lead_caravan', 'hire_agent'] as const) {
    const choiceEngine = new GameEngineIntegration();
    const choiceState = makeP9RouteProofState(choiceEngine, {
      route_merchant: true,
      p9_early_business_focus: true,
    });
    const choice = merchantEvent!.choices?.find(candidate => candidate.id === choiceId);
    assert(choice !== undefined, `merchant event exposes ${choiceId}`);
    await choiceEngine.executeChoiceEffects(choice!.effects ?? [], merchantEvent!.id, choiceId);
    choiceOutcomes.set(choiceId, choiceState.flags);
  }

  assert(choiceOutcomes.get('lead_caravan')?.p9_merchant_midlife_path === true, 'lead_caravan establishes merchant path');
  assert(
    choiceOutcomes.get('lead_caravan')?.p9_route_identity_merchant_master === 'merchant_caravan_master',
    'lead_caravan establishes caravan-master identity',
  );
  assert(
    choiceOutcomes.get('lead_caravan')?.p9_summary_echo_business === '幼年帮工营商的习惯延续至今',
    'lead_caravan preserves business summary echo',
  );
  assert(choiceOutcomes.get('hire_agent')?.p9_merchant_midlife_path === true, 'hire_agent establishes merchant path');
  assert(
    choiceOutcomes.get('hire_agent')?.p9_route_identity_merchant_master === 'merchant_investor',
    'hire_agent establishes investor identity',
  );
  assert(
    choiceOutcomes.get('hire_agent')?.p9_summary_echo_business === '幼年帮工营商的习惯延续至今',
    'hire_agent preserves business summary echo',
  );
  assert(
    choiceOutcomes.get('lead_caravan')?.p9_route_identity_merchant_master !==
      choiceOutcomes.get('hire_agent')?.p9_route_identity_merchant_master,
    'merchant choices preserve identity divergence',
  );
}

async function testWandererRouteReachabilityProof(): Promise<void> {
  const wandererEvent = eventLoader.getEventById('p9_wanderer_midlife_discovery');
  assert(wandererEvent !== undefined, 'runtime catalog must load p9_wanderer_midlife_discovery');
  assert(
    wandererEvent!.ageRange.min === 28 && wandererEvent!.ageRange.max === 28,
    'wanderer route point is exact age 28',
  );
  assert(wandererEvent!.priority === EventPriority.CRITICAL, 'wanderer route point remains critical');
  const tags = wandererEvent!.metadata?.tags ?? [];
  assert(tags.includes('mandatory') && tags.includes('mainline'), 'wanderer route point remains mandatory mainline');

  const engine = new GameEngineIntegration();
  const state = makeP9RouteProofState(engine, {
    p9_echo_travel_hook: true,
    p8_route_wanderer: true,
  });
  const evaluator = new ConditionEvaluator();
  assert(state.player.age === 28 && state.player.alive === true, 'wanderer proof state is alive at age 28');
  assert(
    (wandererEvent!.conditions ?? []).every(condition => evaluator.evaluate(condition, state)),
    'wanderer route point conditions pass with canonical travel evidence',
  );
  assert(
    engine.getAvailableEvents(28).some(event => event.id === wandererEvent!.id),
    'wanderer route point appears in runtime available events',
  );

  const originalGetAvailableEvents = engine.getAvailableEvents.bind(engine);
  try {
    engine.getAvailableEvents = () => [wandererEvent!];
    assert(
      engine.selectEvent(28)?.id === wandererEvent!.id,
      'exact-age mandatory wanderer event remains protected in scheduler selection',
    );
  } finally {
    engine.getAvailableEvents = originalGetAvailableEvents;
  }

  const choiceOutcomes = new Map<string, Record<string, unknown>>();
  for (const choiceId of ['chart_routes', 'guard_caravan'] as const) {
    const choiceEngine = new GameEngineIntegration();
    const choiceState = makeP9RouteProofState(choiceEngine, {
      p9_echo_travel_hook: true,
      p8_route_wanderer: true,
    });
    const choice = wandererEvent!.choices?.find(candidate => candidate.id === choiceId);
    assert(choice !== undefined, `wanderer event exposes ${choiceId}`);
    await choiceEngine.executeChoiceEffects(choice!.effects ?? [], wandererEvent!.id, choiceId);
    choiceOutcomes.set(choiceId, choiceState.flags);
  }

  assert(choiceOutcomes.get('chart_routes')?.p9_wanderer_midlife_path === true, 'chart_routes establishes wanderer path');
  assert(
    choiceOutcomes.get('chart_routes')?.p9_route_identity_wanderer === 'wanderer_map_legend',
    'chart_routes establishes map-legend identity',
  );
  assert(
    choiceOutcomes.get('chart_routes')?.p9_summary_echo_travel === '幼年游历的习惯延续至今',
    'chart_routes preserves travel summary echo',
  );
  assert(choiceOutcomes.get('guard_caravan')?.p9_wanderer_midlife_path === true, 'guard_caravan establishes wanderer path');
  assert(
    choiceOutcomes.get('guard_caravan')?.p9_route_identity_wanderer === 'wanderer_guardian',
    'guard_caravan establishes guardian identity',
  );
  assert(
    choiceOutcomes.get('guard_caravan')?.p9_summary_echo_travel === '幼年游历的习惯延续至今',
    'guard_caravan preserves travel summary echo',
  );
  assert(
    choiceOutcomes.get('chart_routes')?.p9_route_identity_wanderer !==
      choiceOutcomes.get('guard_caravan')?.p9_route_identity_wanderer,
    'wanderer choices preserve identity divergence',
  );
}

async function runP9Tests(): Promise<void> {
  testStageConfigCoversZeroToForty();
  testRouteDefinitionsExist();
  testEchoHooksCoverMinimumActions();
  testSummaryTemplateApply();
  testConfiguredIdentityResolver();
  testWorldProfileAssembly();
  testEchoSummaryContributionResolver();
  testWarningTriageFromBaseline();
  testCausalityDetectsExplicitEchoFlag();
  testCausalityIgnoresGenericStatOnly();
  await testScholarAndSocialCausalityEchoes();
  await testYouthTransitionContributesPacingEvidence();
  await testGatePacingWarningsReduced();
  await testMartialDeviantIdentityDiverged();
  await testWealthPersonaBusinessProgression();
  await testExplorerPersonaTravelEchoes();
  await testMerchantRouteReachabilityProof();
  await testWandererRouteReachabilityProof();
  console.log('P9 tests passed');
}

runP9Tests().catch(err => {
  console.error(err);
  process.exit(1);
});
