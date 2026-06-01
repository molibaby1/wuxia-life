import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import type { ChoiceExecutionRequest } from '../../src/contracts/choiceExecution';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export async function runHeadlessSessionTests(): Promise<void> {
  const session = HeadlessEngineSessionImpl.create({
    playerName: '无头侠客',
    gender: 'male',
    randomSeed: 101,
    catalogVersion: '1.0.0',
  });

  const next = await session.getNextEvent();
  assert(next !== null, 'should select first event');

  if (next?.isAutomatic) {
    const progress = await session.progressAutomatic({ maxSteps: 5 });
    assert(progress.stepsExecuted >= 1, 'automatic progression');
  }

  const snapshot = session.serialize();
  assert(snapshot.metadata.eventCatalogVersion === '1.0.0', 'serialize catalog version');

  const hydrated = HeadlessEngineSessionImpl.create({ snapshot });
  const memory = hydrated.getLifeMemory();
  assert(memory.schemaVersion.length > 0, 'life memory read');

  await session.restart({ playerName: '重启', gender: 'female', randomSeed: 202 });
  assert(session.getTerminalState() === null || session.getTerminalState() !== null, 'terminal read callable');

  if (next?.requiresChoice && next.raw.choices?.[0]) {
    const choiceId = next.raw.choices[0]!.id;
    const request: ChoiceExecutionRequest = {
      requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
      snapshotRef: { snapshot: session.serialize() },
      action: { eventId: next.eventId, choiceId },
    };
    const response = await session.executeChoice(request);
    assert(response.status === 'success', 'choice execution success');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHeadlessSessionTests()
    .then(() => console.log('headlessSession.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
