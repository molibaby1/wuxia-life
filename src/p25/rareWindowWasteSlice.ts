import { evaluateCompositeDestinyOutcome } from '../p16/compositeDestiny';
import { getWorldProfile } from '../narrative/worldProfile';
import type { PlayerState } from '../types/eventTypes';
import { P25_PINNACLE_LIFE_PATHS } from './pinnacleSimulationBaselines';
import type { LifePathFixture } from './validationSlices';

export interface RareWindowWasteFinding {
  pathId: string;
  pinnacleOutcomeId: string;
  windowAvailable: boolean;
  windowTaken: boolean;
  grindAfterMiss: {
    statsMaxed: boolean;
    choicePresent: boolean;
    luckPresent: boolean;
    pinnacleUnlocked: boolean;
  };
  passed: boolean;
  pointer: string;
  detail: string;
}

export interface P25RareWindowWasteSliceResult {
  slice: 'p25_rare_window_waste';
  pathCount: number;
  findings: RareWindowWasteFinding[];
  wasteCasesDetected: number;
  passed: boolean;
}

const WINDOW_WASTE_PATHS = P25_PINNACLE_LIFE_PATHS.filter(p =>
  ['pinnacle_myth_grind_no_luck', 'pinnacle_patriarch_grind_no_luck'].includes(p.id),
);

const PATH_TO_PINNACLE: Record<string, string> = {
  pinnacle_myth_grind_no_luck: 'jianghu_myth_legend',
  pinnacle_patriarch_grind_no_luck: 'founding_patriarch',
};

function evaluateWindowWaste(path: LifePathFixture, worldId = 'wuxia'): RareWindowWasteFinding {
  const pinnacleOutcomeId = PATH_TO_PINNACLE[path.id] ?? 'jianghu_myth_legend';
  const outcome = getWorldProfile(worldId).pinnacleDestinyOutcomes?.find(o => o.id === pinnacleOutcomeId);
  const player = {
    name: 'waste-sim',
    age: path.player.age ?? 40,
    traitProfile: { origin: path.originId },
    ...path.player,
  } as PlayerState;
  const flags = { ...path.flags };

  const luckFlag =
    pinnacleOutcomeId === 'jianghu_myth_legend' ? 'p16_rare_master_encounter' : 'p16_scholar_mentor';
  const windowTaken = Boolean(flags[luckFlag]);
  const windowAvailable = true;
  if (!outcome) {
    return {
      pathId: path.id,
      pinnacleOutcomeId,
      windowAvailable: false,
      windowTaken,
      grindAfterMiss: {
        statsMaxed: false,
        choicePresent: false,
        luckPresent: Boolean(flags[luckFlag]),
        pinnacleUnlocked: false,
      },
      passed: false,
      pointer: `path:${path.id} → outcome:${pinnacleOutcomeId} flag:${luckFlag}`,
      detail: 'Pinnacle outcome config missing',
    };
  }
  const report = evaluateCompositeDestinyOutcome(outcome, player, flags);

  const statsMaxed = report.dimensions
    .filter(d => d.dimension !== 'special_event' && d.dimension !== 'key_choices')
    .every(d => d.status === 'satisfied');
  const choicePresent = !report.unmetGates?.choice;
  const luckPresent = Boolean(flags[luckFlag]);

  const passed =
    windowAvailable &&
    !windowTaken &&
    statsMaxed &&
    choicePresent &&
    !luckPresent &&
    !report.unlocked;

  return {
    pathId: path.id,
    pinnacleOutcomeId,
    windowAvailable,
    windowTaken,
    grindAfterMiss: {
      statsMaxed,
      choicePresent,
      luckPresent,
      pinnacleUnlocked: report.unlocked,
    },
    passed,
    pointer: `path:${path.id} → outcome:${pinnacleOutcomeId} flag:${luckFlag}`,
    detail: passed
      ? 'Rare window missed; post-grind stats + choice cannot substitute luck gate'
      : `Expected grind-non-substitutable lock; unlocked=${report.unlocked}`,
  };
}

export function runP25RareWindowWasteSlice(worldId = 'wuxia'): P25RareWindowWasteSliceResult {
  const findings = WINDOW_WASTE_PATHS.map(path => evaluateWindowWaste(path, worldId));
  const wasteCasesDetected = findings.filter(f => f.passed).length;
  return {
    slice: 'p25_rare_window_waste',
    pathCount: WINDOW_WASTE_PATHS.length,
    findings,
    wasteCasesDetected,
    passed: wasteCasesDetected >= 2 && findings.every(f => f.passed),
  };
}

export function formatRareWindowWasteMarkdown(result: P25RareWindowWasteSliceResult): string {
  const lines = [
    '# P25 Rare Window Waste Validation Slice (US-012)',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Paths covered: ${result.pathCount}`,
    `Waste cases detected: ${result.wasteCasesDetected}`,
    `Decision: **${result.passed ? 'PASS' : 'FAIL'}**`,
    '',
    '## Findings',
    '',
  ];
  for (const f of result.findings) {
    lines.push(
      `- \`${f.pathId}\` / \`${f.pinnacleOutcomeId}\`: ${f.passed ? 'PASS' : 'FAIL'} — ${f.detail} → \`${f.pointer}\``,
    );
  }
  return lines.join('\n');
}
