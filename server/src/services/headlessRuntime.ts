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
import { SeededRandomSource } from '../../../src/headless/adapters/randomSource.js';
import type { BackendEnv } from '../config/env.js';

function serverSessionDeps(logger?: HeadlessLogger, seed = 1) {
  return {
    catalog: createDefaultInMemoryCatalogAdapter(),
    snapshot: defaultSnapshotConverter,
    logger: logger ?? noopLogger,
    random: new SeededRandomSource(seed),
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
  logger?: HeadlessLogger;
}): HeadlessEngineSession {
  return HeadlessEngineSessionImpl.create(
    {
      playerName: params.playerName,
      gender: params.gender,
      catalogVersion: params.catalogVersion,
      randomSeed: params.randomSeed ?? Date.now(),
    },
    serverSessionDeps(params.logger, params.randomSeed ?? 1),
  );
}

export async function createHeadlessSessionFromSnapshot(params: {
  snapshot: GameStateSnapshot;
  catalogVersion: string;
  randomSeed?: number;
  logger?: HeadlessLogger;
}): Promise<HeadlessEngineSession> {
  const session = HeadlessEngineSessionImpl.create(
    { snapshot: params.snapshot },
    serverSessionDeps(params.logger, params.randomSeed ?? 1),
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

export async function progressUntilChoiceOrTerminal(
  session: HeadlessEngineSession,
): Promise<void> {
  let guard = 0;
  while (guard < 32) {
    guard += 1;
    const next = await session.getNextEvent();
    if (!next) break;
    if (!next.isAutomatic) break;
    const progress = await session.progressAutomatic({ maxSteps: 8 });
    if (progress.stoppedReason === 'terminal') break;
    if (progress.stepsExecuted === 0) break;
  }
}
