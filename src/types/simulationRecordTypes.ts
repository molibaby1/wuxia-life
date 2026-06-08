import type { EventChoice, GameState } from './eventTypes';

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
