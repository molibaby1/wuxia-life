import { WebApiClientError } from '../../src/adapters/api/webApiClient';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runWebApiClientTests(): void {
  const error = new WebApiClientError('conflict', 'STALE_SLOT_VERSION', 'stale', 409, {
    currentSlotVersion: 2,
  });
  assert(error.category === 'conflict', 'conflict category');
  assert(error.status === 409, 'status preserved');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWebApiClientTests();
  console.log('webApiClient tests passed');
}
