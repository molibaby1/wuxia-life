import { buildOriginTrajectorySignature, getOrdinaryEarlyLifeChoices } from './ordinaryOriginEarlyLife';
import {
  ORDINARY_VIVID_CONTROL_BY_ID,
  P25_ORDINARY_LIFE_PATHS,
  trajectorySignatureOverlap,
} from './ordinarySimulationBaselines';

export interface OrdinaryTrajectoryFinding {
  pathId: string;
  ordinaryOriginId: string;
  vividControlOriginId: string;
  ordinaryEarlyMidFlags: string[];
  vividEarlyMidFlags: string[];
  overlapRatio: number;
  materiallyDistinguishable: boolean;
  passed: boolean;
  pointer: string;
  detail: string;
}

export interface P25OrdinaryOriginSliceResult {
  slice: 'p25_ordinary_origin_trajectory';
  pathCount: number;
  findings: OrdinaryTrajectoryFinding[];
  passed: boolean;
}

const ORDINARY_SLICE_PATHS = P25_ORDINARY_LIFE_PATHS.filter(p =>
  ['ordinary_peasant_renown_path', 'ordinary_apprentice_merchant_path', 'ordinary_tavern_renown_path'].includes(
    p.id,
  ),
);

function evaluateOrdinaryTrajectory(path: (typeof P25_ORDINARY_LIFE_PATHS)[number]): OrdinaryTrajectoryFinding {
  const vividControlOriginId = ORDINARY_VIVID_CONTROL_BY_ID[path.originId] ?? 'scholar_house';
  const choice = getOrdinaryEarlyLifeChoices().find(c => c.originId === path.originId);
  const selectedOption = choice?.options.find(o =>
    Object.keys(path.flags).some(f => o.flags.includes(f)),
  );
  const ordinaryEarlyMidFlags = buildOriginTrajectorySignature(
    path.originId,
    selectedOption?.id,
  );
  const vividEarlyMidFlags = buildOriginTrajectorySignature(vividControlOriginId);
  const overlapRatio = trajectorySignatureOverlap(ordinaryEarlyMidFlags, vividEarlyMidFlags);
  const materiallyDistinguishable = overlapRatio < 0.85;
  const passed = materiallyDistinguishable && ordinaryEarlyMidFlags.some(f => f.startsWith('flag:'));

  return {
    pathId: path.id,
    ordinaryOriginId: path.originId,
    vividControlOriginId,
    ordinaryEarlyMidFlags,
    vividEarlyMidFlags,
    overlapRatio,
    materiallyDistinguishable,
    passed,
    pointer: `path:${path.id} origin:${path.originId} vs ${vividControlOriginId} overlap=${overlapRatio.toFixed(2)}`,
    detail: passed
      ? 'Early/mid trajectory flags differ from vivid control'
      : `Trajectory overlap too high (${overlapRatio.toFixed(2)}) or missing choice flags`,
  };
}

export function runP25OrdinaryOriginSlice(): P25OrdinaryOriginSliceResult {
  const findings = ORDINARY_SLICE_PATHS.map(evaluateOrdinaryTrajectory);
  return {
    slice: 'p25_ordinary_origin_trajectory',
    pathCount: ORDINARY_SLICE_PATHS.length,
    findings,
    passed: findings.length >= 3 && findings.every(f => f.passed),
  };
}

export function formatOrdinaryOriginSliceMarkdown(result: P25OrdinaryOriginSliceResult): string {
  const lines = [
    '# P25 Ordinary Origin Trajectory Validation Slice (US-020)',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Paths covered: ${result.pathCount}`,
    `Decision: **${result.passed ? 'PASS' : 'FAIL'}**`,
    '',
    '## Findings',
    '',
  ];
  for (const f of result.findings) {
    lines.push(
      `- \`${f.pathId}\` (${f.ordinaryOriginId} vs ${f.vividControlOriginId}): ${f.passed ? 'PASS' : 'FAIL'} — ${f.detail} → \`${f.pointer}\``,
    );
    lines.push(`  - ordinary: ${f.ordinaryEarlyMidFlags.join(', ')}`);
    lines.push(`  - vivid: ${f.vividEarlyMidFlags.join(', ')}`);
  }
  return lines.join('\n');
}
