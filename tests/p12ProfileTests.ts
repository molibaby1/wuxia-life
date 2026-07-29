/**
 * P12 world profile formalization tests.
 */

import { getMinimumActions } from '../src/data/activeActionCatalog';
import {
  getWorldProfile,
  WUXIA_WORLD_PROFILE,
  PLAYABLE_PROFILE_SECTION_KEYS,
} from '../src/narrative/worldProfile';
import {
  resolveConfiguredAge40Identity,
  resolveConfiguredEchoSummaryVars,
  resolveEchoHookForFlags,
  getStagePurposeForAge,
} from '../src/narrative/NarrativeConfigLoader';
import { buildNarrativeSchedulingContextFromState } from '../src/p11/schedulingContext';
import {
  omitProfileSection,
  validateWorldProfileCrossReferences,
  validateWorldProfileForGate,
  validateWorldProfileSections,
} from '../src/p12/profileVerification';
import { assembleP12ProfileGateReport } from '../src/p12/reportBuilder';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testFormalProfileSchema(): void {
  assert(WUXIA_WORLD_PROFILE.id === 'wuxia', 'profile id');
  for (const key of PLAYABLE_PROFILE_SECTION_KEYS) {
    const section = WUXIA_WORLD_PROFILE[key];
    assert(Array.isArray(section) && section.length > 0, `profile section ${key} populated`);
  }
  assert(WUXIA_WORLD_PROFILE.stats.every(s => s.id && s.label && s.role), 'stat entries complete');
  assert(WUXIA_WORLD_PROFILE.resources.every(r => r.id && r.label && r.role), 'resource entries complete');
  assert(
    WUXIA_WORLD_PROFILE.actionFamilies.every(f => f.actionIds.length > 0),
    'action families link to catalog ids',
  );
}

function testProfileSmokeSupply(): void {
  const profile = getWorldProfile();
  assert(profile.stats.some(s => s.role === 'scheduling_relevant'), 'scheduling stats');
  assert(profile.resources.length >= 1, 'resources');
  assert(profile.resources.some(resource => resource.id === 'money'), 'money resource');
  assert(profile.identityTracks.length >= 8, 'identity tracks');
  assert(profile.actionFamilies.length >= 5, 'action families');
  assert(profile.summarySignals.some(s => s.variableName === 'echo_suffix'), 'echo summary signal');
  assert(profile.stageConfig.length >= 4, 'stage config');
  assert(profile.routeDefinitions.length >= 6, 'routes');
  assert(profile.echoHooks.length >= 4, 'echo hooks');
  assert(profile.summaryTemplates.length >= 3, 'summary templates');
}

function testNegativeMissingSection(): void {
  const incomplete = omitProfileSection(WUXIA_WORLD_PROFILE, 'stats');
  const result = validateWorldProfileSections(incomplete);
  assert(result.decision === 'fail', 'missing stats fails validation');
  assert(result.missingRequired.includes('stats'), 'stats in missingRequired');
  assert(
    result.messages.some(message => message.includes('stats')),
    'stable missing-section message',
  );
}

function testProfileFirstReaders(): void {
  const echoHook = resolveEchoHookForFlags({ p9_echo_training_hook: true });
  assert(echoHook?.id === 'echo_training_basic', 'echo hook via profile');

  const purpose = getStagePurposeForAge(15);
  assert(typeof purpose === 'string' && purpose.length > 0, 'stage purpose via profile');

  const identity = resolveConfiguredAge40Identity(
    { p9_route_identity_wanderer: 'wanderer_map_legend' },
    'wanderer',
    '寒门',
  );
  assert(identity.includes('寒门'), 'age40 identity via profile path');

  const echoVars = resolveConfiguredEchoSummaryVars({
    p9_echo_training_hook: true,
    p9_summary_echo_training: '幼年练功',
  });
  assert(echoVars.echo_suffix?.includes('幼年练功'), 'echo vars via profile');

  const minimumActions = getMinimumActions();
  assert(minimumActions.length === 5, `profile-driven minimum actions: ${minimumActions.length}`);
  assert(
    minimumActions.every(action =>
      WUXIA_WORLD_PROFILE.actionFamilies.some(f => f.actionIds.includes(action.id)),
    ),
    'minimum actions from profile families',
  );

  const state = {
    player: { age: 25, flags: { p9_echo_training_hook: true } },
    flags: {},
  } as GameState;
  const ctx = buildNarrativeSchedulingContextFromState(state);
  assert(ctx.stageId === 'stage_20_30', 'P11 scheduling context reads stage from World Profile');
  assert(ctx.expectedStageSignals.length > 0, 'P11 scheduling context reads expected stage signals');
}

function testCrossReferenceValidation(): void {
  const crossRefIssues = validateWorldProfileCrossReferences(WUXIA_WORLD_PROFILE);
  assert(crossRefIssues.length === 0, `wuxia profile cross-references: ${crossRefIssues.join('; ')}`);

  const gateResult = validateWorldProfileForGate(WUXIA_WORLD_PROFILE);
  assert(gateResult.decision === 'pass' || gateResult.decision === 'warning', `gate validation: ${gateResult.decision}`);

  const broken: typeof WUXIA_WORLD_PROFILE = {
    ...WUXIA_WORLD_PROFILE,
    actionFamilies: [
      {
        ...WUXIA_WORLD_PROFILE.actionFamilies[0],
        actionIds: ['action_missing_from_catalog'],
      },
    ],
  };
  const brokenResult = validateWorldProfileForGate(broken);
  assert(brokenResult.decision === 'fail', 'broken action family cross-reference fails gate');
  assert(
    brokenResult.messages.some(message => message.includes('actionFamilies -> activeActionCatalog')),
    'stable cross-reference failure message',
  );
}

function testP12GateReport(): void {
  const report = assembleP12ProfileGateReport(WUXIA_WORLD_PROFILE);
  assert(report.decision === 'pass' || report.decision === 'warning', `gate decision: ${report.decision}`);
  assert(report.readers.profileFirst.length >= 6, 'profile-first readers listed');
  assert(report.saveSchemaChanged === false, 'save schema unchanged');
  assert(Object.keys(report.sectionSummary).length === PLAYABLE_PROFILE_SECTION_KEYS.length, 'all sections summarized');
}

export function runP12ProfileTests(): void {
  testFormalProfileSchema();
  testProfileSmokeSupply();
  testNegativeMissingSection();
  testCrossReferenceValidation();
  testProfileFirstReaders();
  testP12GateReport();
  console.log('✔ p12ProfileTests passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP12ProfileTests();
}
