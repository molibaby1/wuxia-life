import { loadBackendEnv } from '../../server/src/config/env.js';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runEnvValidationTests(): void {
  try {
    loadBackendEnv({});
    throw new Error('expected missing env failure');
  } catch (error) {
    assert(
      (error as Error).message.includes('DATABASE_URL'),
      'should mention DATABASE_URL',
    );
  }

  const env = loadBackendEnv({
    DATABASE_URL: 'postgres://localhost/test',
    TOKEN_HASH_SECRET: 'test-secret-123456',
    ENGINE_VERSION: 'p6b-headless',
    EVENT_CATALOG_VERSION: '1.0.0',
    NODE_ENV: 'test',
  });
  assert(env.httpPort === 8787, 'default port');
}
