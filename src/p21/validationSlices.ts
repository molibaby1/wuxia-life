import { EventLoader } from '../core/EventLoader';
import { getAllEchoHooks } from '../narrative/config/echoHooks';
import { P20_SCHOLAR_STATESMAN } from '../narrative/profile/wuxiaReplayabilitySurfaces';
import { getWorldProfile } from '../narrative/worldProfile';
import { detectLowQualityContent } from './contentValidation';
import { detectOffTargetTuning, getScholarTuningEvidence } from './tuningValidation';

export interface P21ContentSampleSlice {
  sliceId: string;
  eventId: string;
  contentRole: string;
  hasAuthoringSemantics: boolean;
  hasNarrativeScheduling: boolean;
  passed: boolean;
}

export interface P21TuningComparisonSlice {
  generatedAt: string;
  routeDistribution: { metric: string; before: number; after: number; improved: boolean };
  stagePacing: { metric: string; before: number; after: number; improved: boolean };
  archetypeCoverage: { metric: string; before: number; after: number; improved: boolean };
  allThreeCovered: boolean;
}

export interface P21OptimizationWaveResult {
  generatedAt: string;
  configOnlyContentAdded: boolean;
  tuningImprovedMetric: boolean;
  validationCaughtDrift: boolean;
  waveDecision: 'pass' | 'warning' | 'fail';
  cases: Array<{ caseId: string; description: string; passed: boolean }>;
}

export function runContentSampleValidations(): P21ContentSampleSlice[] {
  const loader = EventLoader.getInstance();
  const samples = [
    { sliceId: 'route_sensitive', eventId: 'p21_scholar_route_reinforcement', contentRole: 'route_sensitive' },
    { sliceId: 'callback_sensitive', eventId: 'p21_study_echo_callback', contentRole: 'callback_sensitive' },
    { sliceId: 'archetype_sensitive', eventId: 'p21_archetype_legacy_closure', contentRole: 'archetype_sensitive' },
  ];

  return samples.map(sample => {
    const event = loader.getEventById(sample.eventId);
    const hasAuthoringSemantics = !!event?.metadata?.authoringSemantics;
    const hasNarrativeScheduling = !!event?.metadata?.narrativeScheduling?.stageSignals?.length;
    const roleMatch = event?.metadata?.authoringSemantics?.contentRole === sample.contentRole;
    return {
      ...sample,
      hasAuthoringSemantics,
      hasNarrativeScheduling,
      passed: !!event && hasAuthoringSemantics && roleMatch,
    };
  });
}

export function runEchoWiringValidation(): { hookId: string; callbackExists: boolean; hasContract: boolean }[] {
  const loader = EventLoader.getInstance();
  const p21Callback = loader.getEventById('p21_study_echo_callback');
  return getAllEchoHooks()
    .filter(h => h.id === 'echo_study_basic')
    .map(hook => ({
      hookId: hook.id,
      callbackExists: !!loader.getEventById(hook.callbackEventId) && !!p21Callback,
      hasContract: !!hook.authoringContract,
    }));
}

export function runTuningComparisonSlice(): P21TuningComparisonSlice {
  const evidence = getScholarTuningEvidence();
  const routeSample = getWorldProfile().tuningSampleConfigs?.find(
    s => s.id === 'p21_tune_route_scholar_distribution',
  );
  const pacingSample = getWorldProfile().tuningSampleConfigs?.find(
    s => s.id === 'p21_tune_stage_payoff_spacing',
  );
  const archetypeSample = getWorldProfile().tuningSampleConfigs?.find(
    s => s.id === 'p21_tune_archetype_scholar_coverage',
  );

  const routeDistribution = {
    metric: 'scholar_pathAffinity',
    before: routeSample?.baselineValue ?? 0.85,
    after: evidence.pathAffinityTuned,
    improved: evidence.pathAffinityTuned > (routeSample?.baselineValue ?? 0.85),
  };
  const stagePacing = {
    metric: 'scholar_payoff_spacing_stage_20_30',
    before: pacingSample?.baselineValue ?? 1.25,
    after: evidence.payoffSpacingStage2030,
    improved: evidence.payoffSpacingStage2030 < (pacingSample?.baselineValue ?? 1.25),
  };
  const archetypeCoverage = {
    metric: 'scholar_baseWeight',
    before: archetypeSample?.baselineValue ?? 1.0,
    after: evidence.baseWeight,
    improved: evidence.baseWeight > (archetypeSample?.baselineValue ?? 1.0),
  };

  return {
    generatedAt: new Date().toISOString(),
    routeDistribution,
    stagePacing,
    archetypeCoverage,
    allThreeCovered:
      routeDistribution.improved && stagePacing.improved && archetypeCoverage.improved,
  };
}

export function runOptimizationWave(): P21OptimizationWaveResult {
  const contentSlices = runContentSampleValidations();
  const tuningSlice = runTuningComparisonSlice();
  const echoWiring = runEchoWiringValidation();

  const badDraft = detectLowQualityContent({
    id: 'p21_bad_draft',
    content: { text: 'short' },
    metadata: { enabled: true, createdAt: 0, updatedAt: 0 },
  });
  const offTarget = detectOffTargetTuning('p21_tune_archetype_scholar_coverage', 0.5);

  const cases = [
    {
      caseId: 'config_only_content',
      description: 'P21 content samples added via JSON without runtime edits',
      passed: contentSlices.every(s => s.passed),
    },
    {
      caseId: 'tuning_improved_metric',
      description: 'Scholar route/pacing/archetype tuning shows measurable deltas',
      passed: tuningSlice.allThreeCovered,
    },
    {
      caseId: 'validation_caught_drift',
      description: 'Low-quality draft and off-target tuning detected by validation path',
      passed: badDraft && offTarget,
    },
    {
      caseId: 'echo_wiring',
      description: 'P21 echo hook has authoring contract and callback event',
      passed: echoWiring.every(e => e.callbackExists && e.hasContract),
    },
  ];

  const configOnlyContentAdded = cases.find(c => c.caseId === 'config_only_content')?.passed ?? false;
  const tuningImprovedMetric = cases.find(c => c.caseId === 'tuning_improved_metric')?.passed ?? false;
  const validationCaughtDrift = cases.find(c => c.caseId === 'validation_caught_drift')?.passed ?? false;
  const allPass = cases.every(c => c.passed);

  return {
    generatedAt: new Date().toISOString(),
    configOnlyContentAdded,
    tuningImprovedMetric,
    validationCaughtDrift,
    waveDecision: allPass ? 'pass' : cases.filter(c => c.passed).length >= 3 ? 'warning' : 'fail',
    cases,
  };
}

export function scholarArchetypeConfigPresent(): boolean {
  const profile = getWorldProfile();
  return !!profile.archetypeFamilyConfigs?.find(f => f.id === P20_SCHOLAR_STATESMAN.id);
}
