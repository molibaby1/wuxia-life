import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import { CatalogReadError } from '../../src/headless/catalog/EventCatalogReadService';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runCatalogVersionPinningTests(): void {
  const session = HeadlessEngineSessionImpl.create({
    playerName: '版本',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 11,
  });
  const snapshot = session.serialize();
  assert(snapshot.metadata.eventCatalogVersion === '1.0.0', 'snapshot preserves catalog version');

  let mismatch = false;
  try {
    HeadlessEngineSessionImpl.create({
      snapshot: {
        ...snapshot,
        metadata: { ...snapshot.metadata, eventCatalogVersion: '99.0.0' },
      },
    });
  } catch (error) {
    mismatch = error instanceof CatalogReadError;
  }
  assert(mismatch, 'unknown catalog version on hydrate');
}
