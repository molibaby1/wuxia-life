/**
 * P3 US-010: Romance/family arc regression telemetry for deterministic samples.
 * Aligns with docs/test-reports/p3-midlife-romance-family-sample-arc.md (arc_rf_mingyue).
 */
import type { GameProcessReport, GameProcessRecord } from '../tests/GameProcessSimulator';

export const ARC_RF_MINGYUE_ID = 'arc_rf_mingyue';

export const GOLDEN_ROMANCE_FAMILY_SAMPLE_ID = 'golden-romance-family';

export type RomanceArcOutcome = 'completed' | 'separated' | 'skipped' | 'failed';

export type RomanceKeyChoiceId = 'KC-1' | 'KC-2' | 'KC-3';

export type RomanceKeyChoiceRecord = {
  id: RomanceKeyChoiceId;
  eventId: string;
  expectedChoiceIds: string[];
  triggered: boolean;
  choiceId?: string;
  age?: number;
};

export type RomancePayoffRecord = {
  id: 'PO-1' | 'PO-2' | 'PO-3';
  eventId: string;
  hit: boolean;
  age?: number;
};

export type RomanceFamilyArcReport = {
  sampleId: string;
  arcId: typeof ARC_RF_MINGYUE_ID;
  arcOutcome: RomanceArcOutcome;
  achievement: boolean;
  primarySamplePass: boolean;
  finalAge: number;
  isAlive: boolean;
  relationship: {
    loveStarted: boolean;
    loverMingyueAffection: number | null;
    flags: string[];
  };
  familyOutcome: {
    spouse: string | null;
    children: number;
    married: boolean;
    spouseMingyue: boolean;
    separated: boolean;
  };
  keyChoices: RomanceKeyChoiceRecord[];
  payoffsHit: RomancePayoffRecord[];
};

const KEY_CHOICE_SPECS: ReadonlyArray<{
  id: RomanceKeyChoiceId;
  eventId: string;
  expectedChoiceIds: string[];
  preferredChoiceIds: string[];
}> = [
  {
    id: 'KC-1',
    eventId: 'love_first_meet',
    expectedChoiceIds: ['love_greet', 'love_charm', 'love_pass'],
    preferredChoiceIds: ['love_greet', 'love_charm'],
  },
  {
    id: 'KC-2',
    eventId: 'love_family_obstacle',
    expectedChoiceIds: ['love_prove', 'love_avoid'],
    preferredChoiceIds: ['love_prove'],
  },
  {
    id: 'KC-3',
    eventId: 'family_marriage',
    expectedChoiceIds: ['marry_mingyue', 'marry_arranged', 'marry_free_love'],
    preferredChoiceIds: ['marry_mingyue'],
  },
];

const PAYOFF_SPECS: ReadonlyArray<{ id: 'PO-1' | 'PO-2' | 'PO-3'; eventId: string }> = [
  { id: 'PO-1', eventId: 'family_child_born' },
  { id: 'PO-2', eventId: 'family_crisis' },
  { id: 'PO-3', eventId: 'spouse_mingyue_daily' },
];

function findChoiceRecord(
  records: GameProcessRecord[],
  eventId: string,
): GameProcessRecord | undefined {
  return records.find(
    record => record.eventId === eventId && record.eventType === 'choice' && record.selectedChoice,
  );
}

function readFinalFlags(report: GameProcessReport): Record<string, boolean> {
  const final = report.records[report.records.length - 1]?.gameState;
  return (final?.player?.flags ?? {}) as Record<string, boolean>;
}

function readLoverMingyueAffection(report: GameProcessReport): number | null {
  const final = report.records[report.records.length - 1]?.gameState;
  const affection = final?.relations?.lover_mingyue;
  return typeof affection === 'number' ? affection : null;
}

function buildKeyChoices(records: GameProcessRecord[]): RomanceKeyChoiceRecord[] {
  return KEY_CHOICE_SPECS.map(spec => {
    const hit = findChoiceRecord(records, spec.eventId);
    return {
      id: spec.id,
      eventId: spec.eventId,
      expectedChoiceIds: [...spec.expectedChoiceIds],
      triggered: Boolean(hit),
      choiceId: hit?.selectedChoice?.id,
      age: hit?.age,
    };
  });
}

function buildPayoffs(records: GameProcessRecord[]): RomancePayoffRecord[] {
  return PAYOFF_SPECS.map(spec => {
    const hit = records.find(record => record.eventId === spec.eventId);
    return {
      id: spec.id,
      eventId: spec.eventId,
      hit: Boolean(hit),
      age: hit?.age,
    };
  });
}

function hasAchievement(report: GameProcessReport): boolean {
  return Boolean(report.statistics.spouse) || (report.statistics.children ?? 0) > 0;
}

function isSeparated(flags: Record<string, boolean>): boolean {
  return (
    flags.love_separation === true ||
    flags.mingyue_married_other === true ||
    (flags.spouse_arranged === true && flags.spouse_mingyue !== true)
  );
}

export function resolveRomanceArcOutcome(
  report: GameProcessReport,
  targetEndAge: number,
): RomanceArcOutcome {
  const flags = readFinalFlags(report);

  if (!report.isAlive || report.finalAge < targetEndAge) {
    return 'failed';
  }

  if (!flags.love_started) {
    return 'skipped';
  }

  if (isSeparated(flags)) {
    return 'separated';
  }

  if (hasAchievement(report) && flags.spouse_mingyue && flags.married) {
    return 'completed';
  }

  if (hasAchievement(report)) {
    return 'completed';
  }

  return 'failed';
}

export function buildRomanceFamilyArcReport(
  report: GameProcessReport,
  sampleId: string,
  targetEndAge = 50,
): RomanceFamilyArcReport {
  const flags = readFinalFlags(report);
  const achievement = hasAchievement(report);
  const arcOutcome = resolveRomanceArcOutcome(report, targetEndAge);
  const primarySamplePass =
    sampleId === GOLDEN_ROMANCE_FAMILY_SAMPLE_ID &&
    arcOutcome === 'completed' &&
    achievement &&
    report.isAlive &&
    report.finalAge >= targetEndAge;

  const activeFlags = Object.keys(flags).filter(key => flags[key]);

  return {
    sampleId,
    arcId: ARC_RF_MINGYUE_ID,
    arcOutcome,
    achievement,
    primarySamplePass,
    finalAge: report.finalAge,
    isAlive: report.isAlive,
    relationship: {
      loveStarted: flags.love_started === true,
      loverMingyueAffection: readLoverMingyueAffection(report),
      flags: activeFlags.filter(
        flag =>
          flag.startsWith('love_') ||
          flag.startsWith('lover_') ||
          flag === 'married' ||
          flag.startsWith('spouse_'),
      ),
    },
    familyOutcome: {
      spouse: report.statistics.spouse ?? null,
      children: report.statistics.children ?? 0,
      married: flags.married === true,
      spouseMingyue: flags.spouse_mingyue === true,
      separated: isSeparated(flags),
    },
    keyChoices: buildKeyChoices(report.records),
    payoffsHit: buildPayoffs(report.records),
  };
}

export function formatRomanceFamilyArcReportLines(report: RomanceFamilyArcReport): string[] {
  const kc = report.keyChoices
    .map(
      choice =>
        `${choice.id}@${choice.eventId}=${choice.triggered ? choice.choiceId ?? '?' : 'miss'}`,
    )
    .join(', ');
  const po = report.payoffsHit.map(p => `${p.id}=${p.hit}`).join(', ');
  return [
    `arc_id=${report.arcId} outcome=${report.arcOutcome} achievement=${report.achievement} primary_pass=${report.primarySamplePass}`,
    `relationship: love_started=${report.relationship.loveStarted} affection=${report.relationship.loverMingyueAffection ?? 'n/a'}`,
    `family: spouse=${report.familyOutcome.spouse ?? 'none'} children=${report.familyOutcome.children}`,
    `key_choices: ${kc}`,
    `payoffs: ${po}`,
  ];
}

export function evaluateP3RomanceFamilyAchievementRate(
  entries: { report: GameProcessReport }[],
): number | null {
  if (entries.length === 0) {
    return null;
  }
  const achieved = entries.filter(entry => hasAchievement(entry.report)).length;
  return achieved / entries.length;
}
