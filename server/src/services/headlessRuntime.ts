import { HeadlessEngineSessionImpl } from '../../../src/headless/session/HeadlessEngineSessionImpl.js';
import type { HeadlessEngineSession } from '../../../src/headless/session/HeadlessEngineSession.js';
import { createDefaultInMemoryCatalogAdapter } from '../../../src/headless/catalog/InMemoryEventCatalogAdapter.js';
import { defaultSnapshotConverter } from '../../../src/headless/snapshot/SnapshotConverter.js';
import type { GameStateSnapshot } from '../../../src/contracts/gameStateSnapshot.js';
import type {
  ChoiceExecutionRequest,
  ChoiceExecutionResponse,
} from '../../../src/contracts/choiceExecution.js';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../../src/contracts/choiceExecution.js';
import type { HeadlessLogger } from '../../../src/headless/dependencies/HeadlessSessionDependencies.js';
import { noopLogger } from '../../../src/headless/dependencies/HeadlessSessionDependencies.js';
import {
  createDefaultRandomSource,
  type RandomSource,
} from '../../../src/headless/adapters/randomSource.js';
import { progressUntilChoiceOrTerminal } from '../../../src/headless/progressionLoop.js';
import type { RuntimeEventCatalog } from '../../../src/core/RuntimeEventCatalog.js';
import type { BackendEnv } from '../config/env.js';
import { serverRandomSourceScope } from './randomSourceScope.js';

export { progressUntilChoiceOrTerminal };

function serverSessionDeps(
  logger?: HeadlessLogger,
  random: RandomSource = createDefaultRandomSource(),
  runtimeCatalog?: RuntimeEventCatalog,
) {
  return {
    catalog: createDefaultInMemoryCatalogAdapter(runtimeCatalog),
    runtimeCatalog,
    snapshot: defaultSnapshotConverter,
    logger: logger ?? noopLogger,
    random,
    randomSourceRunner: serverRandomSourceScope,
  };
}

export function createProductionLogger(env: BackendEnv): HeadlessLogger {
  if (env.nodeEnv === 'production') {
    return noopLogger;
  }
  return {
    debug: () => undefined,
    warn: (message, context) => console.warn(JSON.stringify({ level: 'warn', message, ...context })),
    error: (message, context) => console.error(JSON.stringify({ level: 'error', message, ...context })),
  };
}

export function createHeadlessSessionFromNewGame(params: {
  playerName: string;
  gender: 'male' | 'female';
  catalogVersion: string;
  randomSeed?: number;
  random?: RandomSource;
  logger?: HeadlessLogger;
  runtimeCatalog?: RuntimeEventCatalog;
}): HeadlessEngineSession {
  return HeadlessEngineSessionImpl.create(
    {
      playerName: params.playerName,
      gender: params.gender,
      catalogVersion: params.catalogVersion,
      ...(params.randomSeed !== undefined ? { randomSeed: params.randomSeed } : {}),
    },
    serverSessionDeps(params.logger, params.random, params.runtimeCatalog),
  );
}

export async function createHeadlessSessionFromSnapshot(params: {
  snapshot: GameStateSnapshot;
  catalogVersion: string;
  randomSeed?: number;
  random?: RandomSource;
  logger?: HeadlessLogger;
  runtimeCatalog?: RuntimeEventCatalog;
}): Promise<HeadlessEngineSession> {
  const session = HeadlessEngineSessionImpl.create(
    { snapshot: params.snapshot },
    serverSessionDeps(params.logger, params.random, params.runtimeCatalog),
  );
  await session.hydrate(params.snapshot);
  return session;
}

export async function deriveNextEvent(session: HeadlessEngineSession) {
  return session.getNextEvent();
}

export function buildChoiceRequest(params: {
  snapshot: GameStateSnapshot;
  snapshotId: string;
  eventId: string;
  choiceId: string;
}): ChoiceExecutionRequest {
  return {
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshotId: params.snapshotId, snapshot: params.snapshot },
    action: {
      eventId: params.eventId,
      choiceId: params.choiceId,
    },
    clientMetadata: { platform: 'api-server' },
  };
}

export async function executeChoiceOnSession(
  session: HeadlessEngineSession,
  request: ChoiceExecutionRequest,
): Promise<ChoiceExecutionResponse> {
  return session.executeChoice(request);
}

/** After auto progress, surface active_planning instead of null dead-end. */
export async function resolveSessionAfterAutoProgress(session: HeadlessEngineSession) {
  const phase = session.getSessionPhase();
  if (phase === 'terminal' || phase === 'action_summary' || phase === 'disturbance_narrative') {
    return { nextEvent: null, phase };
  }
  if (phase === 'active_planning' || phase === 'passive_progression' || phase === 'period_summary') {
    if (phase === 'passive_progression') {
      session.ensurePassivePresentation();
    }
    return { nextEvent: null, phase };
  }
  const pending = session.describePendingEvent();
  if (pending) {
    return { nextEvent: pending, phase };
  }
  const next = await session.getNextEvent();
  return { nextEvent: next, phase: session.getSessionPhase() };
}

/** Describe the persisted Session as-is; restore/read paths must not draw or advance time. */
export function describeSessionPresentation(session: HeadlessEngineSession) {
  const phase = session.getSessionPhase();
  return {
    nextEvent: phase === 'story_event' ? session.describePendingEvent() : null,
    phase,
  };
}
