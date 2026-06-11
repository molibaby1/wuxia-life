/**
 * P9 playability and narrative config regression tests.
 */

import { buildWarningTriageReport } from '../src/p9/warningTriage';
import { loadP8BaselineReport } from '../src/p9/loadP8Baseline';
import type { P8PlayabilityReport } from '../src/p8/types';
import type { P9WarningTriageReport, WarningBucket } from '../src/p9/types';
import { getStageForAge, getAllStageConfigs } from '../src/narrative/config/stageConfig';
import { getRouteDefinition, getRouteIdentityFromFlags } from '../src/narrative/config/routeDefinitions';
import { getEchoHookByActionId, getAllEchoHooks } from '../src/narrative/config/echoHooks';
import { applySummaryTemplate, getSummaryTemplateForIdentity } from '../src/narrative/config/summaryTemplates';
import {
  getStageFeedbackExpectationForAge,
  resolveConfiguredAge40Identity,
  resolveConfiguredEchoSummaryVars,
  WUXIA_WORLD_PROFILE,
} from '../src/narrative/NarrativeConfigLoader';
import { collectCausalityMetrics, collectReplayMetrics } from '../src/p8/collectPersonaMetrics';
import { assemblePlayabilityReport } from '../src/p8/playabilityGate';
import { P8_GATE_END_AGE } from '../src/p8/metricDefinitions';
import type { GameProcessRecord } from './GameProcessSimulator';
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
  assert(WUXIA_WORLD_PROFILE.stats.length >= 10, 'world profile carries stats metadata');
  assert(WUXIA_WORLD_PROFILE.resources.length >= 2, 'world profile carries resources metadata');
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
  assert(scholar.metrics.causality.directEchoCount >= 3, `scholar direct echoes ${scholar.metrics.causality.directEchoCount}`);
  assert(social.metrics.causality.directEchoCount >= 3, `social direct echoes ${social.metrics.causality.directEchoCount}`);
  assert(!scholar.metrics.causality.tooFewEchoes, 'scholar passes causality threshold');
  assert(!social.metrics.causality.tooFewEchoes, 'social passes causality threshold');
}

async function testGatePacingAndReplayWarningsReduced(): Promise<void> {
  const baseline = loadP8BaselineReport();
  const baselinePacing = baseline.warnings.filter(w => w.key === 'pacing').length;
  const baselineNearDupes = baseline.replay.nearDuplicateWarnings.length;

  const bundles = await runAllPersonaSimulations();
  const replay = collectReplayMetrics(bundles.map(b => ({ personaId: b.personaId, report: b.report })));
  const report = assemblePlayabilityReport(
    bundles.map(b => b.metrics),
    replay,
    P8_GATE_END_AGE,
  );
  const pacingWarnings = report.warnings.filter(w => w.key === 'pacing').length;
  const nearDupes = replay.nearDuplicateWarnings.length;

  assertWarningCountMaintainsOrImproves(pacingWarnings, baselinePacing, 'pacing');
  assertWarningCountMaintainsOrImproves(nearDupes, baselineNearDupes, 'near-duplicate');
  const martialDeviantPair = replay.nearDuplicateWarnings.find(w =>
    w.includes('p8-martial-lin') && w.includes('p8-deviant-ye'),
  );
  assert(!martialDeviantPair, `martial-lin vs deviant-ye should not be near-duplicate: ${martialDeviantPair}`);
  for (const b of bundles) {
    assert(
      b.metrics.pacing.longestLowImpactSpanYears <= 5,
      `${b.personaId} pacing span ${b.metrics.pacing.longestLowImpactSpanYears}y`,
    );
  }
}

async function testGateCausalityWarningsReducedVsBaseline(): Promise<void> {
  const baseline = loadP8BaselineReport();
  assertBaselineReportShape(baseline);
  const baselineCausalityWarnings = baseline.warnings.filter(w => w.key === 'causality').length;

  const bundles = await runAllPersonaSimulations();
  const replay = collectReplayMetrics(bundles.map(b => ({ personaId: b.personaId, report: b.report })));
  const report = assemblePlayabilityReport(
    bundles.map(b => b.metrics),
    replay,
    P8_GATE_END_AGE,
  );
  const causalityWarnings = report.warnings.filter(w => w.key === 'causality').length;
  assertWarningCountMaintainsOrImproves(causalityWarnings, baselineCausalityWarnings, 'causality');
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
  assert(
    wealth.metrics.causality.directEchoCount >= 3,
    `wealth persona should meet direct echo threshold (got ${wealth.metrics.causality.directEchoCount})`,
  );
  assert(!wealth.metrics.causality.tooFewEchoes, 'wealth passes causality threshold');
  assert(
    wealth.report.records.some(record => record.eventId === 'p9_merchant_midlife_caravan'),
    'wealth persona should reach merchant midlife divergence',
  );
  assert(
    wealth.metrics.causality.strongestExamples.some(example => example.reference === 'p9_summary_echo_business'),
    'wealth persona should surface summary echo flag',
  );
}

async function testExplorerPersonaTravelEchoes(): Promise<void> {
  const [explorer] = await runPersonaSimulations(['p8-explorer-lu']);
  const travelActions = explorer.metrics.agency.activeActionByCategory.travel ?? 0;
  assert(travelActions > 0, `explorer persona should take travel actions (got ${travelActions})`);
  assert(
    explorer.metrics.causality.directEchoCount >= 3,
    `explorer persona should meet direct echo threshold (got ${explorer.metrics.causality.directEchoCount})`,
  );
  assert(!explorer.metrics.causality.tooFewEchoes, 'explorer passes causality threshold');
  assert(
    explorer.report.records.some(record => record.eventId === 'p9_wanderer_midlife_discovery'),
    'explorer persona should reach wanderer midlife divergence',
  );
  assert(
    explorer.metrics.causality.strongestExamples.some(example => example.reference === 'p9_summary_echo_travel'),
    'explorer persona should surface summary echo flag',
  );
}

async function testRouteDivergencePair(): Promise<void> {
  const [shen, lu] = await runPersonaSimulations(['p8-wealth-shen', 'p8-explorer-lu']);
  const shenIdentity = shen.metrics.narrativeMemory.age40Identity;
  const luIdentity = lu.metrics.narrativeMemory.age40Identity;
  assert(shenIdentity !== luIdentity, 'wealth vs explorer identity diverged');
  const shenRoute = shen.report.records[shen.report.records.length - 1]?.gameState?.flags?.p9_route_identity_merchant_master
    ?? shen.report.records[shen.report.records.length - 1]?.gameState?.flags?.p9_merchant_midlife_path;
  const luRoute = lu.report.records[lu.report.records.length - 1]?.gameState?.flags?.p9_route_identity_wanderer
    ?? lu.report.records[lu.report.records.length - 1]?.gameState?.flags?.p9_wanderer_midlife_path;
  assert(Boolean(shenRoute) || shenIdentity.includes('商'), 'shen has merchant signal');
  assert(Boolean(luRoute) || luIdentity.includes('游'), 'lu has wanderer signal');
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
  await testGateCausalityWarningsReducedVsBaseline();
  await testGatePacingAndReplayWarningsReduced();
  await testMartialDeviantIdentityDiverged();
  await testWealthPersonaBusinessProgression();
  await testExplorerPersonaTravelEchoes();
  await testRouteDivergencePair();
  console.log('P9 tests passed');
}

runP9Tests().catch(err => {
  console.error(err);
  process.exit(1);
});
