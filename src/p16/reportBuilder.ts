import type { WorldProfile } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import {
  ADULT_CHILDHOOD_BLOCKED_ACTIONS,
  CHILDHOOD_MAX_AGE,
  isActionSuppressedForAge,
  resolveChildhoodActionPalette,
} from './childhoodAgency';
import { evaluateAllCompositeDestinies, formatCompositeDestinyReport } from './compositeDestiny';
import { summarizeOriginResourceContrast } from './originSurfaces';
import type { PlayerState } from '../types/eventTypes';

export interface P16GateReport {
  generatedAt: string;
  decision: 'pass' | 'warning' | 'fail';
  originVariance: {
    contrasts: ReturnType<typeof summarizeOriginResourceContrast>[];
    surfaceCount: number;
  };
  childhoodAgency: {
    suppressedAtAge5: string[];
    allowlistAtAge10: string[];
    scholarPaletteAtAge6: string[];
  };
  compositeDestiny: {
    outcomeCount: number;
    sampleReports: string[];
  };
  rareEventLines: {
    lineCount: number;
    lineIds: string[];
  };
  messages: string[];
  warnings: string[];
}

export function assembleP16GateReport(
  profile: WorldProfile = getWorldProfile(),
  samplePlayer?: PlayerState,
  sampleFlags: Record<string, unknown> = {},
): P16GateReport {
  const messages: string[] = [];
  const warnings: string[] = [];

  const surfaces = profile.originSurfaces ?? [];
  if (surfaces.length < 3) {
    warnings.push(`originSurfaces count ${surfaces.length} < 3`);
  }

  const contrasts = [
    summarizeOriginResourceContrast('merchant_house', 'poor_family'),
    summarizeOriginResourceContrast('scholar_house', 'frontier_military'),
    summarizeOriginResourceContrast('martial_family', 'streetborn'),
  ];

  const suppressedAtAge5 = [...ADULT_CHILDHOOD_BLOCKED_ACTIONS];
  const scholarPaletteAge6 = resolveChildhoodActionPalette({
    age: 6,
    player: { traitProfile: { origin: 'scholar_house' } } as PlayerState,
    flags: { p8_persona_id: 'p8-scholar-su' },
  }).map(action => action.id);

  const outcomes = profile.compositeDestinyOutcomes ?? [];
  const rareLines = profile.rareEventLines ?? [];

  const compositeReports = evaluateAllCompositeDestinies(samplePlayer, sampleFlags).map(
    formatCompositeDestinyReport,
  );

  if (outcomes.length < 3) {
    warnings.push(`compositeDestinyOutcomes count ${outcomes.length} < 3`);
  }
  if (rareLines.length < 1) {
    warnings.push('no rareEventLines configured');
  }
  if (suppressedAtAge5.length < 3) {
    warnings.push('childhood agency adult-action block list too short');
  }
  if (!scholarPaletteAge6.includes('action_study_lite')) {
    warnings.push('scholar childhood palette missing study-lite');
  }

  const decision =
    surfaces.length >= 3 && outcomes.length >= 3 && rareLines.length >= 1
      ? warnings.length > 0
        ? 'warning'
        : 'pass'
      : 'fail';

  messages.push(`origin surfaces: ${surfaces.length}`);
  messages.push(`composite outcomes: ${outcomes.length}`);
  messages.push(`rare lines: ${rareLines.length}`);
  messages.push(`age-5 suppressed actions: ${suppressedAtAge5.join(', ')}`);

  return {
    generatedAt: new Date().toISOString(),
    decision,
    originVariance: { contrasts, surfaceCount: surfaces.length },
    childhoodAgency: {
      suppressedAtAge5,
      allowlistAtAge10: resolveChildhoodActionPalette({
        age: 10,
        player: { traitProfile: { origin: 'merchant_house' } } as PlayerState,
        flags: { p8_persona_id: 'p8-wealth-shen' },
      }).map(action => action.id),
      scholarPaletteAtAge6: scholarPaletteAge6,
    },
    compositeDestiny: {
      outcomeCount: outcomes.length,
      sampleReports: compositeReports,
    },
    rareEventLines: {
      lineCount: rareLines.length,
      lineIds: rareLines.map(line => line.id),
    },
    messages,
    warnings,
  };
}

export function formatP16GateMarkdown(report: P16GateReport): string {
  const lines = [
    '# P16 Experience Gate Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Decision: **${report.decision}**`,
    '',
    '## Origin variance',
    `- Surfaces: ${report.originVariance.surfaceCount}`,
    ...report.originVariance.contrasts.map(
      c =>
        `- ${c.originA} vs ${c.originB}: materialΔ=${c.materialDelta.toFixed(2)} guidanceΔ=${c.guidanceDelta.toFixed(2)} different=${c.materiallyDifferent}`,
    ),
    '',
    '## Childhood agency',
    `- Suppressed at age 5: ${report.childhoodAgency.suppressedAtAge5.join(', ')}`,
    `- Merchant/business palette at age 10: ${report.childhoodAgency.allowlistAtAge10.join(', ')}`,
    `- Scholar palette at age 6: ${report.childhoodAgency.scholarPaletteAtAge6.join(', ')}`,
    `- Childhood max age: ${CHILDHOOD_MAX_AGE}`,
    '',
    '## Composite destiny',
    `- Outcomes: ${report.compositeDestiny.outcomeCount}`,
    ...report.compositeDestiny.sampleReports.map(r => `- ${r}`),
    '',
    '## Rare event lines',
    `- Lines: ${report.rareEventLines.lineCount} (${report.rareEventLines.lineIds.join(', ')})`,
    '',
  ];
  if (report.warnings.length > 0) {
    lines.push('## Warnings', ...report.warnings.map(w => `- ${w}`), '');
  }
  return lines.join('\n');
}
