/** P3 US-010 romance/family arc regression telemetry shapes. */

export const ARC_RF_MINGYUE_ID = 'arc_rf_mingyue' as const;

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
