import { redactContext } from '../../server/src/logging/logger.js';
import { loadBackendEnv } from '../../server/src/config/env.js';
import { StructuredLogger } from '../../server/src/logging/logger.js';
import { createProductionLogger } from '../../server/src/services/headlessRuntime.js';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runLoggingTests(): void {
  const redacted = redactContext({
    deviceToken: 'secret-device',
    sessionToken: 'secret-session',
    route: '/v1/saves',
  });
  assert(redacted?.deviceToken === '[REDACTED]', 'device token redacted');
  assert(redacted?.sessionToken === '[REDACTED]', 'session token redacted');
  assert(redacted?.route === '/v1/saves', 'safe fields preserved');

  const env = loadBackendEnv({
    DATABASE_URL: 'postgres://localhost/test',
    TOKEN_HASH_SECRET: 'test-secret-123456',
    ENGINE_VERSION: 'p6b-headless',
    EVENT_CATALOG_VERSION: '1.0.0',
    NODE_ENV: 'production',
  });
  const logger = new StructuredLogger(env);
  logger.info('test', { databaseUrl: 'postgres://secret' });
  const prodHeadlessLogger = createProductionLogger(env);
  let debugCalled = false;
  const originalDebug = console.debug;
  console.debug = () => {
    debugCalled = true;
  };
  prodHeadlessLogger.debug('engine verbose');
  console.debug = originalDebug;
  assert(!debugCalled, 'production headless logger suppresses debug');
}
