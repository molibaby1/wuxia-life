import type { WorldProfile } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import {
  runArchetypeDifferentiationSlice,
  runArchetypeRegressionMatrix,
  runPacingDifferentiationSlice,
  runReplaySliceValidations,
  runReplayabilityValidationComparison,
  runRepetitionOverlapSlice,
} from './validationSlices';

export interface P20GateReport {
  generatedAt: string;
  decision: 'pass' | 'warning' | 'fail';
  archetypeCoverage: {
    familyCount: number;
    familyKinds: string[];
    pacingProfileCount: number;
    replaySliceCount: number;
  };
  repetitionPressure: {
    configCount: number;
    hasThematicFloor: boolean;
    hasNoveltyPreference: boolean;
  };
  wholeLifePacing: {
    profileCount: number;
    closureRhythms: string[];
  };
  validation: {
    archetypeDifferentiation: boolean;
    repetitionReduced: boolean;
    pacingDiffers: boolean;
    replaySlicesPass: boolean;
    regressionMatrixPass: boolean;
  };
  messages: string[];
  warnings: string[];
}

export function profileHasP20Sections(profile: WorldProfile): boolean {
  return (
    (profile.archetypeFamilyConfigs?.length ?? 0) >= 5 &&
    (profile.repetitionPressureConfigs?.length ?? 0) >= 3 &&
    (profile.archetypePacingProfiles?.length ?? 0) >= 5 &&
    (profile.replaySliceConfigs?.length ?? 0) >= 3
  );
}

export function assembleP20GateReport(profile: WorldProfile = getWorldProfile()): P20GateReport {
  const messages: string[] = [];
  const warnings: string[] = [];

  const families = profile.archetypeFamilyConfigs ?? [];
  const repetition = profile.repetitionPressureConfigs ?? [];
  const pacing = profile.archetypePacingProfiles ?? [];
  const slices = profile.replaySliceConfigs ?? [];

  if (!profileHasP20Sections(profile)) {
    warnings.push('P20 profile sections incomplete');
  }

  const archetypeSlice = runArchetypeDifferentiationSlice();
  const repetitionSlice = runRepetitionOverlapSlice();
  const pacingSlice = runPacingDifferentiationSlice();
  const replaySlices = runReplaySliceValidations();
  const regression = runArchetypeRegressionMatrix();

  if (!archetypeSlice.atLeastThreeDistinct) {
    warnings.push('Fewer than 3 distinct archetype families in differentiation slice');
  }
  if (!archetypeSlice.beyondRouteLabel) {
    warnings.push('Archetype emergence may still reduce to route labels');
  }
  if (!repetitionSlice.overlapMateriallyReduced) {
    warnings.push('Repetition overlap slice did not show material reduction');
  }
  if (!pacingSlice.pacingMeaningfullyDiffers) {
    warnings.push('Pacing differentiation below threshold');
  }

  const replaySlicesPass = replaySlices.every(entry => entry.passed);
  if (!replaySlicesPass) {
    warnings.push(`Replay slices failed: ${replaySlices.filter(s => !s.passed).map(s => s.sliceId).join(', ')}`);
  }
  if (!regression.allRepresentativeEmerge) {
    warnings.push('Archetype regression matrix: not all families emerge');
  }

  messages.push(`Archetype families: ${families.length}`);
  messages.push(`Repetition configs: ${repetition.length}`);
  messages.push(`Pacing profiles: ${pacing.length}`);
  messages.push(`Replay slices: ${slices.length}`);

  let decision: P20GateReport['decision'] = 'pass';
  if (warnings.length > 0) {
    decision = warnings.length >= 3 ? 'fail' : 'warning';
  }
  if (!profileHasP20Sections(profile) || !archetypeSlice.atLeastThreeDistinct || !replaySlicesPass) {
    decision = 'fail';
  }

  return {
    generatedAt: new Date().toISOString(),
    decision,
    archetypeCoverage: {
      familyCount: families.length,
      familyKinds: families.map(f => f.familyKind),
      pacingProfileCount: pacing.length,
      replaySliceCount: slices.length,
    },
    repetitionPressure: {
      configCount: repetition.length,
      hasThematicFloor: repetition.every(c => c.thematicContinuityFloor > 0),
      hasNoveltyPreference: repetition.every(c => c.noveltyPreference > 0),
    },
    wholeLifePacing: {
      profileCount: pacing.length,
      closureRhythms: [...new Set(pacing.map(p => p.endgameClosureRhythm))],
    },
    validation: {
      archetypeDifferentiation: archetypeSlice.atLeastThreeDistinct && archetypeSlice.beyondRouteLabel,
      repetitionReduced: repetitionSlice.overlapMateriallyReduced,
      pacingDiffers: pacingSlice.pacingMeaningfullyDiffers,
      replaySlicesPass,
      regressionMatrixPass: regression.allRepresentativeEmerge,
    },
    messages,
    warnings,
  };
}

export function formatP20GateMarkdown(report: P20GateReport): string {
  const lines = [
    '# P20 Replayability Gate (latest)',
    '',
    `**Decision:** ${report.decision}`,
    `**Generated:** ${report.generatedAt}`,
    '',
    '## Coverage',
    `- Archetype families: ${report.archetypeCoverage.familyCount}`,
    `- Pacing profiles: ${report.archetypeCoverage.pacingProfileCount}`,
    `- Replay slices: ${report.archetypeCoverage.replaySliceCount}`,
    '',
    '## Validation',
    `- Archetype differentiation: ${report.validation.archetypeDifferentiation ? 'pass' : 'fail'}`,
    `- Repetition reduced: ${report.validation.repetitionReduced ? 'pass' : 'fail'}`,
    `- Pacing differs: ${report.validation.pacingDiffers ? 'pass' : 'fail'}`,
    `- Replay slices: ${report.validation.replaySlicesPass ? 'pass' : 'fail'}`,
    `- Regression matrix: ${report.validation.regressionMatrixPass ? 'pass' : 'fail'}`,
  ];
  if (report.warnings.length) {
    lines.push('', '## Warnings', ...report.warnings.map(w => `- ${w}`));
  }
  return lines.join('\n');
}

export function assembleP20ClosurePayload() {
  const gate = assembleP20GateReport();
  const comparison = runReplayabilityValidationComparison();
  const regression = runArchetypeRegressionMatrix();
  return { gate, comparison, regression };
}
