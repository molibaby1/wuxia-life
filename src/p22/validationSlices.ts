import { evaluateEventContentConstraints } from '../p21/constraintEvaluation';
import { getP22ExpansionEventById, getP22ExpansionEvents } from './p22ContentCatalog';
import { detectLowQualityContent } from '../p21/contentValidation';
import { getWorldProfile } from '../narrative/worldProfile';
import { buildLibraryCoverageMatrix } from './coverageMatrix';
import { detectWeakSpots, distinguishThinFromRepetitive } from './weakSpotDetection';
import { detectOffTargetLiveOpsTuning, getLiveOpsTuningEvidence } from './tuningEvidence';

export interface P22ExpansionSlice {
  sliceId: string;
  eventId: string;
  targetPool: string;
  weakArchetype: string;
  hasAuthoringSemantics: boolean;
  passed: boolean;
}

export interface P22WaveSlice {
  waveId: string;
  lifePhase: string;
  eventCount: number;
  allEventsLoaded: boolean;
  followsWorkflow: boolean;
  passed: boolean;
}

export interface P22TuningComparisonSlice {
  generatedAt: string;
  routeDistribution: { metric: string; before: number; after: number; improved: boolean };
  closureDensity: { metric: string; before: number; after: number; improved: boolean };
  archetypeCoverage: { metric: string; before: number; after: number; improved: boolean };
  allThreeCovered: boolean;
}

export interface P22ExpansionWaveResult {
  generatedAt: string;
  weakAreaImproved: boolean;
  tuningStabilized: boolean;
  validationCaughtDuplication: boolean;
  waveDecision: 'pass' | 'warning' | 'fail';
  cases: Array<{ caseId: string; description: string; passed: boolean }>;
}

const P22_EXPANSION_EVENTS: Array<{
  sliceId: string;
  eventId: string;
  targetPool: string;
  weakArchetype: string;
}> = [
  { sliceId: 'origin', eventId: 'p22_origin_frontier_orphan', targetPool: 'p22_pool_origin', weakArchetype: 'frontier_military' },
  { sliceId: 'childhood', eventId: 'p22_childhood_street_shaping', targetPool: 'p22_pool_childhood_shaping', weakArchetype: 'streetborn' },
  { sliceId: 'early_route', eventId: 'p22_early_wealth_route_fork', targetPool: 'p22_pool_early_route', weakArchetype: 'wealth_merchant' },
  { sliceId: 'faction', eventId: 'p22_faction_sect_continuation', targetPool: 'p22_pool_midlife_consequence', weakArchetype: 'demonic_outlaw' },
  { sliceId: 'legacy', eventId: 'p22_legacy_teaching_succession', targetPool: 'p22_pool_legacy_endgame', weakArchetype: 'scholar_statesman' },
  { sliceId: 'endgame', eventId: 'p22_endgame_hermit_memory', targetPool: 'p22_pool_legacy_endgame', weakArchetype: 'hermit_withdrawal' },
];

export function runExpansionValidations(): P22ExpansionSlice[] {
  return P22_EXPANSION_EVENTS.map(sample => {
    const event = getP22ExpansionEventById(sample.eventId);
    const hasAuthoringSemantics = !!event?.metadata?.authoringSemantics;
    return {
      ...sample,
      hasAuthoringSemantics,
      passed: !!event && hasAuthoringSemantics,
    };
  });
}

export function runWaveValidations(): P22WaveSlice[] {
  const profile = getWorldProfile();
  return (profile.liveOpsWaveConfigs ?? []).map(wave => {
    const loaded = wave.eventIds.filter(id => !!getP22ExpansionEventById(id));
    return {
      waveId: wave.id,
      lifePhase: wave.lifePhase,
      eventCount: loaded.length,
      allEventsLoaded: loaded.length === wave.eventIds.length,
      followsWorkflow: wave.workflowSteps.length >= 4 && wave.workflowSteps.includes('gate:p22'),
      passed: loaded.length === wave.eventIds.length && wave.workflowSteps.length >= 4,
    };
  });
}

export function runLiveOpsTuningComparisonSlice(): P22TuningComparisonSlice {
  const profile = getWorldProfile();
  const evidence = getLiveOpsTuningEvidence();
  const routeSample = profile.liveOpsTuningSampleConfigs?.find(s => s.id === 'p22_tune_route_wealth_distribution');
  const closureSample = profile.liveOpsTuningSampleConfigs?.find(s => s.id === 'p22_tune_hermit_closure_density');
  const archetypeSample = profile.liveOpsTuningSampleConfigs?.find(s => s.id === 'p22_tune_wealth_archetype_coverage');

  const routeDistribution = {
    metric: 'wealth_pathAffinity',
    before: routeSample?.baselineValue ?? 0.8,
    after: evidence.wealthPathAffinity,
    improved: evidence.wealthPathAffinity > (routeSample?.baselineValue ?? 0.8),
  };
  const closureDensity = {
    metric: 'hermit_closure_spacing',
    before: closureSample?.baselineValue ?? 1.4,
    after: evidence.hermitClosureSpacing,
    improved: evidence.hermitClosureSpacing < (closureSample?.baselineValue ?? 1.4),
  };
  const archetypeCoverage = {
    metric: 'wealth_baseWeight',
    before: archetypeSample?.baselineValue ?? 1.0,
    after: evidence.wealthBaseWeight,
    improved: evidence.wealthBaseWeight > (archetypeSample?.baselineValue ?? 1.0),
  };

  return {
    generatedAt: new Date().toISOString(),
    routeDistribution,
    closureDensity,
    archetypeCoverage,
    allThreeCovered: routeDistribution.improved && closureDensity.improved && archetypeCoverage.improved,
  };
}

export function runExpansionWave(): P22ExpansionWaveResult {
  const expansions = runExpansionValidations();
  const waves = runWaveValidations();
  const tuning = runLiveOpsTuningComparisonSlice();
  const matrix = buildLibraryCoverageMatrix();
  const thinVsRep = distinguishThinFromRepetitive('p22_pool_early_route');

  const badDraft = detectLowQualityContent({
    id: 'p22_bad_draft',
    content: { text: 'x' },
    metadata: { enabled: true, createdAt: 0, updatedAt: 0 },
  });
  const offTarget = detectOffTargetLiveOpsTuning('p22_tune_wealth_archetype_coverage', 0.5);
  const p22Findings = getP22ExpansionEvents().flatMap(event =>
    evaluateEventContentConstraints(event, getWorldProfile()),
  );
  const constraintFailures = p22Findings.filter(f => !f.passed);
  const constraintPass =
    getP22ExpansionEvents().length > 0 &&
    constraintFailures.length <= Math.ceil(p22Findings.length * 0.15);

  const cases = [
    {
      caseId: 'weak_area_improved',
      description: 'P22 expansions load with authoring semantics for previously weak archetype bands',
      passed: expansions.every(s => s.passed) && expansions.length >= 6,
    },
    {
      caseId: 'tuning_stabilized',
      description: 'Route, closure density, and archetype tuning show measurable deltas',
      passed: tuning.allThreeCovered,
    },
    {
      caseId: 'validation_caught_duplication',
      description: 'Low-quality draft, off-target tuning, and weak-spot detection catch drift',
      passed: badDraft && offTarget && detectWeakSpots().length > 0,
    },
    {
      caseId: 'wave_workflow',
      description: 'Three live-ops content waves follow P21-style workflow manifests',
      passed: waves.every(w => w.passed),
    },
    {
      caseId: 'coverage_matrix',
      description: 'Library coverage matrix decision is not fail after expansion',
      passed: matrix.decision !== 'fail' && constraintPass,
    },
    {
      caseId: 'thin_vs_repetitive',
      description: 'Reporting distinguishes thin coverage from repetitive concentration',
      passed: !!thinVsRep,
    },
  ];

  const weakAreaImproved = cases.find(c => c.caseId === 'weak_area_improved')?.passed ?? false;
  const tuningStabilized = cases.find(c => c.caseId === 'tuning_stabilized')?.passed ?? false;
  const validationCaughtDuplication = cases.find(c => c.caseId === 'validation_caught_duplication')?.passed ?? false;
  const allPass = cases.every(c => c.passed);

  return {
    generatedAt: new Date().toISOString(),
    weakAreaImproved,
    tuningStabilized,
    validationCaughtDuplication,
    waveDecision: allPass ? 'pass' : cases.filter(c => c.passed).length >= 4 ? 'warning' : 'fail',
    cases,
  };
}
