/**
 * P9 playability and narrative config regression tests.
 */

import { buildWarningTriageReport } from '../src/p9/warningTriage';
import { loadP8BaselineReport } from '../src/p9/loadP8Baseline';
import { getStageForAge, getAllStageConfigs } from '../src/narrative/config/stageConfig';
import { getRouteDefinition, getRouteIdentityFromFlags } from '../src/narrative/config/routeDefinitions';
import { getEchoHookByActionId, getAllEchoHooks } from '../src/narrative/config/echoHooks';
import { applySummaryTemplate, getSummaryTemplateForIdentity } from '../src/narrative/config/summaryTemplates';
import { resolveConfiguredAge40Identity } from '../src/narrative/NarrativeConfigLoader';
import { collectCausalityMetrics, collectReplayMetrics } from '../src/p8/collectPersonaMetrics';
import { assemblePlayabilityReport } from '../src/p8/playabilityGate';
import { P8_GATE_END_AGE } from '../src/p8/metricDefinitions';
import type { GameProcessRecord } from './GameProcessSimulator';
import { runAllPersonaSimulations, runPersonaSimulations } from '../src/p9/simulationRunner';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testStageConfigCoversZeroToForty(): void {
  const stages = getAllStageConfigs();
  assert(stages.length === 4, 'four stage bands expected');
  assert(getStageForAge(5)?.id === 'stage_0_10', 'age 5 in first stage');
  assert(getStageForAge(35)?.id === 'stage_30_40', 'age 35 in last stage');
  assert(getStageForAge(40)?.id === 'stage_30_40', 'gate end age 40 in last stage');
}

function testRouteDefinitionsExist(): void {
  assert(getRouteDefinition('route_wealth') !== undefined, 'wealth route defined');
  assert(getRouteDefinition('route_wanderer') !== undefined, 'wanderer route defined');
  const identity = getRouteIdentityFromFlags({ p9_route_identity_merchant_master: 'merchant_caravan_master' });
  assert(identity === 'merchant_caravan_master', 'route identity from flags');
}

function testEchoHooksCoverMinimumActions(): void {
  const hooks = getAllEchoHooks();
  assert(hooks.length >= 5, 'all five minimum actions have echo hooks');
  assert(getEchoHookByActionId('action_training_basic') !== undefined, 'training hook');
  assert(getEchoHookByActionId('action_study_basic')?.callbackEventId === 'p9_study_echo_midlife', 'study hook');
  assert(getEchoHookByActionId('action_socializing_basic')?.callbackEventId === 'p9_social_echo_midlife', 'social hook');
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
}

function testConfiguredIdentityResolver(): void {
  const text = resolveConfiguredAge40Identity(
    { p9_route_identity_wanderer: 'wanderer_map_legend' },
    'wanderer',
    '寒门',
  );
  assert(text.includes('游侠'), 'wanderer template');
  assert(text.includes('寒门'), 'origin preserved');
}

function testWarningTriageFromBaseline(): void {
  const report = loadP8BaselineReport();
  const triage = buildWarningTriageReport(report, 'p8-playability-gate-latest.json');
  assert(triage.totalWarnings > 0, 'baseline has warnings');
  assert(triage.byBucket.causality.length > 0, 'causality bucket populated');
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

  assert(pacingWarnings < baselinePacing, `pacing warnings ${pacingWarnings} vs baseline ${baselinePacing}`);
  assert(nearDupes < baselineNearDupes, `near-duplicate pairs ${nearDupes} vs baseline ${baselineNearDupes}`);
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
  const baselineCausalityWarnings = baseline.warnings.filter(w => w.key === 'causality').length;
  assert(baselineCausalityWarnings > 0, 'baseline has causality warnings to regress against');

  const bundles = await runAllPersonaSimulations();
  const replay = collectReplayMetrics(bundles.map(b => ({ personaId: b.personaId, report: b.report })));
  const report = assemblePlayabilityReport(
    bundles.map(b => b.metrics),
    replay,
    P8_GATE_END_AGE,
  );
  const causalityWarnings = report.warnings.filter(w => w.key === 'causality').length;
  assert(
    causalityWarnings < baselineCausalityWarnings,
    `causality warnings should drop: ${causalityWarnings} vs baseline ${baselineCausalityWarnings}`,
  );
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
  testWarningTriageFromBaseline();
  testCausalityDetectsExplicitEchoFlag();
  testCausalityIgnoresGenericStatOnly();
  await testScholarAndSocialCausalityEchoes();
  await testGateCausalityWarningsReducedVsBaseline();
  await testGatePacingAndReplayWarningsReduced();
  await testMartialDeviantIdentityDiverged();
  await testRouteDivergencePair();
  console.log('P9 tests passed');
}

runP9Tests().catch(err => {
  console.error(err);
  process.exit(1);
});
