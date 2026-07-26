/**
 * P4 engine contract types — transport/persistence shapes only.
 * Does not replace runtime types in src/types/.
 */

export {
  GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
  type GameStateSnapshot,
  type GameStateSnapshotMetadata,
  type GameStateSnapshotState,
  type RouteCategory,
  type RouteLifecycle,
  type SnapshotCurrentTime,
  type SnapshotEventRecord,
  type SnapshotPlayerState,
  type SnapshotRouteHistoryEntry,
  type SnapshotRouteState,
  type SourcePlatform,
} from './gameStateSnapshot';

export {
  CHOICE_EXECUTION_REQUEST_VERSION,
  CHOICE_EXECUTION_RESPONSE_VERSION,
  type ChoiceAction,
  type ChoiceExecutionDiagnostics,
  type ChoiceExecutionError,
  type ChoiceExecutionFailureResponse,
  type ChoiceExecutionRequest,
  type ChoiceExecutionResponse,
  type ChoiceExecutionSuccessResponse,
  type ChoicePlayerInput,
  type ClientMetadata,
  type ExecutionAppend,
  type ExecutionDeltas,
  type ExecutionWarning,
  type NextEventHints,
  type RandomContext,
  type SnapshotReference,
} from './choiceExecution';

export {
  REPLAY_LOG_VERSION,
  type ReplayActionType,
  type ReplayAutoEventEntry,
  type ReplayChoiceEntry,
  type ReplayLog,
  type ReplayLogEntry,
  type ReplayLogMetadata,
  type ReplaySaveLoadEntry,
  type ReplayTerminalEntry,
} from './replayLog';

export {
  EVENT_CATALOG_CONTRACT_VERSION,
  type EventBundleRequest,
  type EventBundleResponse,
  type EventCatalogEntrySummary,
  type EventCatalogMetadata,
  type EventCatalogStatus,
  type EventCatalogValidationSummary,
  type EventValidationState,
} from './eventCatalog';

export {
  gameStateSnapshotAge50,
  serializeGameStateSnapshotAge50Fixture,
} from './fixtures/gameStateSnapshotAge50';

export {
  choiceExecutionFailureResponseValidation,
  choiceExecutionRequestValid,
  choiceExecutionSuccessResponseValid,
  serializeChoiceExecutionFixtures,
} from './fixtures/choiceExecutionFixtures';

export { replayLogAge50, serializeReplayLogAge50Fixture } from './fixtures/replayLogAge50';

export {
  eventCatalogBundleFixture,
  eventCatalogSummaryFixture,
  serializeEventCatalogFixtures,
} from './fixtures/eventCatalogFixtures';

export {
  type SessionPhase,
  type PlanningOptionDto,
  type StoryEventDto,
  type ActiveActionRequest,
  type ProgressionAckKind,
  type ProgressionAckRequest,
  type SessionProgressionPayload,
  type HeadlessTerminalDto,
} from './sessionProgression';

export {
  validateChoiceExecutionRequest,
  validateChoiceExecutionResponse,
  validateEventCatalogBundle,
  validateEventCatalogSummary,
  validateGameStateSnapshot,
  validateHealthStatusEffect,
  validateReplayLog,
  validateStatusCondition,
  type ValidationFailure,
  type ValidationResult,
  type ValidationSuccess,
} from './validation/contractValidation';
