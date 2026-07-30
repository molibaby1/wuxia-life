import type { ChoiceScoreDiagnostic } from '../p8/types';
import type { EventChoice, GameState } from './eventTypes';
import type { DeathRiskTelemetry } from './deathRiskTelemetryTypes';
import type { RomanceFamilyArcReport } from './romanceFamilyArcTypes';

/**
 * Shared simulation replay record used by persona gates, P11 signal detection,
 * and headless parity harnesses. Kept in src/ so runtime modules do not depend on tests/.
 */
export interface SimulationProcessRecord {
  age: number;
  eventId: string;
  eventTitle: string;
  eventText?: string;
  eventType: 'auto' | 'choice' | 'ending';
  selectedChoice?: EventChoice;
  availableChoices?: EventChoice[];
  outcomeText?: string;
  gameState: GameState;
  timestamp: string;
  currentTime?: { year: number; month: number; day: number };
  /** P7: distinguishes catalog events from player-planned actions in replay. */
  progressionKind?: 'story_event' | 'active_action';
  /** P7: catalog action id when progressionKind is active_action. */
  activeActionId?: string;
  /** P8: why this active action was selected in simulation. */
  activeActionSelectionReason?: string;
  /** P8: choice scoring diagnostics for this choice event. */
  choiceScoreDiagnostic?: {
    selectedScore: number;
    runnerUpScore: number | null;
    runnerUpChoiceId: string | null;
  };
}

/** @deprecated Use SimulationProcessRecord — alias retained for existing imports. */
export type GameProcessRecord = SimulationProcessRecord;

export interface GameProcessConfig {
  playerName: string;
  gender: 'male' | 'female';
  simulateYears: number;
  runUntilDeath: boolean;
  ageRange?: {
    startAge: number;
    endAge: number;
  };
  seed?: number;
  maxEvents: number;
  enableAutoSave: boolean;
  enableManualSave: boolean;
  autoSaveMode: 'age' | 'event';
  saveAgeInterval: number;
  saveEventInterval: number;
  enableSaveRestore: boolean;
  maxRestoreCount: number;
  verbose: boolean;
  choiceTendency: 'balanced' | 'martial' | 'wealth' | 'relationship' | 'risk_averse';
  /** P8: fixed persona id for strategy-driven simulation */
  p8PersonaId?: string;
  /** 路线专项样本：偏向入线/完成对应路线 */
  routeTrack?: 'official' | 'beggars' | 'demonic' | 'sect' | 'wanderer';
  /** P3-EVAL sample id for death-risk telemetry cohort resolution. */
  sampleId?: string;
}

export interface GameProcessReport {
  id: string;
  timestamp: string;
  config: GameProcessConfig;
  randomSeed: number | null;
  runMode: 'complete_life' | 'age_range';
  ageRange: {
    startAge: number;
    endAge: number;
  } | null;
  totalYears: number;
  finalAge: number;
  isAlive: boolean;
  deathReason: string | null;
  /** P3 US-005: populated when simulation ends with death or forced ending. */
  deathRiskTelemetry?: DeathRiskTelemetry | null;
  /** P3 US-010: romance/family arc regression snapshot when sampleId is set. */
  romanceFamilyArcReport?: RomanceFamilyArcReport | null;
  totalEvents: number;
  totalChoices: number;
  totalSaves: number;
  totalLoads: number;
  persistenceConsistency: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    results: {
      saveId: string;
      age: number;
      passed: boolean;
      mismatchedFields: string[];
    }[];
  };
  records: GameProcessRecord[];
  /**
   * Authoritative post-run state for metrics.
   *
   * Replay records may intentionally contain pre-choice or pre-action snapshots
   * and must not be treated as the final simulation state.
   */
  finalGameState?: GameState;
  statistics: {
    childhoodEvents: number;
    youthEvents: number;
    adultEvents: number;
    elderlyEvents: number;
    autoEvents: number;
    choiceEvents: number;
    martialPowerGrowth: number;
    moneyGrowth: number;
    sectJoined: string | null;
    sectStatus?: string;
    spouse?: string;
    children?: number;
    origin?: string;
    coreTalent?: string;
    weakness?: string;
    temperament?: string;
    lifeStates?: Record<string, number>;
    dailyEventCount?: number;
    growthBiasSummary?: string[];
    endingSummary?: string;
    flags?: Record<string, unknown>;
  };
  /** P8: aggregated choice diagnostics for reports */
  p8ChoiceDiagnostics?: ChoiceScoreDiagnostic[];
  p8ActiveActionReasons?: Array<{ age: number; actionId: string; reason: string }>;
}
