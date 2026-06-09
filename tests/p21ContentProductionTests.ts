/**
 * P21 content production and tuning closure tests.
 */

import { EventLoader } from '../src/core/EventLoader';
import { getAllEchoHooks } from '../src/narrative/config/echoHooks';
import { EVENT_AUTHORING_FIELD_GUIDE } from '../src/narrative/config/authoringSchema';
import {
  WUXIA_CONTENT_STYLE_CONSTRAINTS,
  WUXIA_LLM_CONTENT_CONTRACT,
  WUXIA_TUNING_SAMPLE_CONFIGS,
} from '../src/narrative/profile/wuxiaContentProductionSurfaces';
import { getWorldProfile, WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import {
  evaluateContentConstraints,
  evaluateEventContentConstraints,
} from '../src/p21/constraintEvaluation';
import {
  detectLowQualityContent,
  evaluateLlmContentDraft,
} from '../src/p21/contentValidation';
import {
  validateLlmContentInputs,
  validateLlmContentOutputShape,
} from '../src/p21/llmContentContract';
import { fieldPathAllowed, validateLlmTuningInputs } from '../src/p21/llmTuningContract';
import { buildProductionValidationMatrix } from '../src/p21/productionMatrix';
import { assembleP21GateReport, profileHasP21Sections } from '../src/p21/reportBuilder';
import {
  detectOffTargetTuning,
  getScholarTuningEvidence,
  validateTuningOutput,
} from '../src/p21/tuningValidation';
import {
  runContentSampleValidations,
  runEchoWiringValidation,
  runOptimizationWave,
  runTuningComparisonSlice,
} from '../src/p21/validationSlices';
import { EventCategory, type EventDefinition } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testProfileSections(): void {
  assert(profileHasP21Sections(WUXIA_WORLD_PROFILE), 'P21 profile sections must be present');
  assert(WUXIA_CONTENT_STYLE_CONSTRAINTS.length >= 3, 'style constraints');
  assert(WUXIA_LLM_CONTENT_CONTRACT.requiredInputs.length >= 4, 'LLM content contract inputs');
  assert(WUXIA_TUNING_SAMPLE_CONFIGS.length >= 3, 'tuning samples');
}

function testAuthoringSchema(): void {
  assert(!!EVENT_AUTHORING_FIELD_GUIDE['metadata.authoringSemantics'], 'authoring field guide');
  const hooks = getAllEchoHooks().filter(h => h.id === 'echo_study_basic');
  assert(hooks.length === 1, 'study echo hook exists');
  assert(!!hooks[0].authoringContract, 'study echo has P21 authoring contract');
}

function testContentSamplesLoaded(): void {
  const loader = EventLoader.getInstance();
  assert(!!loader.getEventById('p21_scholar_route_reinforcement'), 'route sample');
  assert(!!loader.getEventById('p21_study_echo_callback'), 'callback sample');
  assert(!!loader.getEventById('p21_archetype_legacy_closure'), 'archetype sample');
  const slices = runContentSampleValidations();
  assert(slices.every(s => s.passed), `content samples: ${JSON.stringify(slices)}`);
}

function testConstraintEvaluation(): void {
  const report = evaluateContentConstraints(getWorldProfile());
  assert(report.eventCount >= 3, 'evaluated P21 events');
  assert(report.stylePassRate >= 0.5, `style pass rate ${report.stylePassRate}`);
}

function testDuplicateConstraintLogic(): void {
  const profile = getWorldProfile();
  const exactRepeatDraft = {
    id: 'p21_exact_repeat_draft',
    version: '1.0.0',
    category: EventCategory.MAIN_STORY,
    priority: 1,
    weight: 50,
    ageRange: { min: 20, max: 25 },
    content: { text: '你在江湖行走，门派恩怨未了，修身养性。' },
    eventType: 'auto' as const,
    metadata: {
      createdAt: 0,
      updatedAt: 0,
      enabled: true,
      authoringSemantics: {
        contentRole: 'general' as const,
        duplicateRiskClass: 'exact_repeat',
        toneMarkers: ['江湖'],
      },
    },
  } satisfies EventDefinition;

  const findings = evaluateEventContentConstraints(exactRepeatDraft, profile);
  const exactGuard = findings.find(f => f.constraintId === 'p21_exact_repeat_guard');
  assert(!!exactGuard, 'exact repeat guard evaluated');
  assert(exactGuard?.passed === false, 'exact_repeat risk must fail exact_repeat guard');

  const echoDraft = {
    ...exactRepeatDraft,
    id: 'p21_echo_draft',
    metadata: {
      ...exactRepeatDraft.metadata,
      authoringSemantics: {
        contentRole: 'callback_sensitive' as const,
        duplicateRiskClass: 'echo_callback',
        toneMarkers: ['江湖'],
      },
    },
  } satisfies EventDefinition;
  const echoFindings = evaluateEventContentConstraints(echoDraft, profile);
  const echoGuard = echoFindings.find(f => f.constraintId === 'p21_exact_repeat_guard');
  assert(echoGuard?.passed === true, 'echo_callback should not trigger exact_repeat guard');
}

function testLlmDraftConstraintEvaluation(): void {
  const input = {
    contentRole: 'route_sensitive',
    targetRouteOrStage: 'scholarly',
    toneMarkers: ['江湖'],
    duplicateRiskClass: 'exact_repeat',
    referenceEventId: 'p21_scholar_route_reinforcement',
  };
  const event: Partial<EventDefinition> = {
    id: 'p21_unloaded_draft',
    ageRange: { min: 20, max: 25 },
    content: { text: '你在江湖中行走，听闻门派恩怨，心中思量修身之道。' },
    metadata: {
      enabled: true,
      createdAt: 0,
      updatedAt: 0,
      authoringSemantics: {
        contentRole: 'route_sensitive',
        routeFit: ['scholarly'],
        toneMarkers: ['江湖'],
        duplicateRiskClass: 'exact_repeat',
      },
    },
  };
  const result = evaluateLlmContentDraft(input, event);
  assert(result.decision === 'fail', 'unloaded draft with exact_repeat must fail validation');
  assert(result.constraintFindings.length > 0, 'draft constraints evaluated in memory');
}

function testProductionMatrix(): void {
  const matrix = buildProductionValidationMatrix();
  assert(matrix.rows.length === 3, 'matrix rows');
  assert(matrix.summary.coherentCount >= 2, 'coherent samples');
  assert(matrix.decision !== 'fail', 'matrix decision');
}

function testLlmContentContract(): void {
  const input = {
    contentRole: 'route_sensitive',
    targetRouteOrStage: 'scholarly',
    toneMarkers: ['江湖'],
    duplicateRiskClass: 'route_reinforcement',
    referenceEventId: 'p11_relationship_shift_midlife',
  };
  const inputCheck = validateLlmContentInputs(input);
  assert(inputCheck.valid, `input valid: ${inputCheck.missing.join(',')}`);

  const event: Partial<EventDefinition> = {
    id: 'p21_test_event',
    ageRange: { min: 20, max: 25 },
    content: { text: '你在江湖中行走，听闻门派恩怨，心中思量修身之道。' },
    metadata: {
      enabled: true,
      createdAt: 0,
      updatedAt: 0,
      pathAffinity: { scholarly: 1.0 },
      narrativeScheduling: { stageSignals: ['scholarly_identity'], routePoints: [] },
      authoringSemantics: {
        contentRole: 'route_sensitive',
        routeFit: ['scholarly'],
        stageFit: ['scholarly_identity'],
        toneMarkers: ['江湖'],
        duplicateRiskClass: 'route_reinforcement',
      },
    },
  };
  const shapeCheck = validateLlmContentOutputShape(event);
  assert(shapeCheck.valid, `output shape: ${shapeCheck.missingFields.join(',')}`);
  const evalResult = evaluateLlmContentDraft(input, event);
  assert(evalResult.decision !== 'fail', `LLM content eval: ${JSON.stringify(evalResult.constraintFindings.filter(f => !f.passed))}`);
  assert(detectLowQualityContent({ content: { text: 'x' } }), 'detect bad draft');
}

function testLlmTuningContract(): void {
  const input = {
    tuningClass: 'route_distribution',
    targetFieldPath: 'events.p21_scholar_route_reinforcement.metadata.pathAffinity.scholarly',
    baselineReportId: 'p21-gate-latest',
    desiredMetricDelta: 'increase',
    proposedValue: 1.0,
  };
  const inputCheck = validateLlmTuningInputs(input);
  assert(inputCheck.valid, `tuning input: ${inputCheck.missing.join(',')}`);
  assert(fieldPathAllowed(input.targetFieldPath), 'field path allowed');
  const validation = validateTuningOutput(input, 1.0);
  assert(validation.valid, validation.detail);
  const evidence = getScholarTuningEvidence();
  assert(evidence.baseWeight > 1, 'scholar baseWeight tuned');
  assert(detectOffTargetTuning('p21_tune_archetype_scholar_coverage', 0.5), 'off-target detected');
}

function testTuningComparison(): void {
  const slice = runTuningComparisonSlice();
  assert(slice.allThreeCovered, 'all three tuning dimensions covered');
  assert(slice.routeDistribution.improved, 'route improved');
  assert(slice.stagePacing.improved, 'pacing improved');
  assert(slice.archetypeCoverage.improved, 'archetype improved');
}

function testOptimizationWave(): void {
  const wave = runOptimizationWave();
  assert(wave.configOnlyContentAdded, 'config-only content');
  assert(wave.tuningImprovedMetric, 'tuning improved');
  assert(wave.validationCaughtDrift, 'validation caught drift');
  assert(wave.waveDecision !== 'fail', 'wave decision');
}

function testEchoWiring(): void {
  const wiring = runEchoWiringValidation();
  assert(wiring.length >= 1, 'echo wiring entries');
  assert(wiring.every(w => w.callbackExists && w.hasContract), 'echo wiring pass');
}

function testGateReport(): void {
  const report = assembleP21GateReport();
  assert(report.validation.contentSamplesPass, 'gate content samples');
  assert(report.validation.productionMatrixPass, 'gate matrix');
  assert(report.decision !== 'fail', `gate decision ${report.decision}`);
}

function main(): void {
  testProfileSections();
  testAuthoringSchema();
  testContentSamplesLoaded();
  testConstraintEvaluation();
  testDuplicateConstraintLogic();
  testLlmDraftConstraintEvaluation();
  testProductionMatrix();
  testLlmContentContract();
  testLlmTuningContract();
  testTuningComparison();
  testOptimizationWave();
  testEchoWiring();
  testGateReport();
  console.log('✔ p21ContentProductionTests passed');
}

main();
