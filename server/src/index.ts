import { createServer } from 'node:http';
import { loadBackendEnv } from './config/env.js';
import { closePool } from './db/pool.js';
import { runMigrations } from './db/migrate.js';
import { StructuredLogger } from './logging/logger.js';
import { createRouter, seedActiveCatalog } from './http/router.js';
import { handleCors } from './http/cors.js';

async function main(): Promise<void> {
  const env = loadBackendEnv();
  const logger = new StructuredLogger(env);
  await runMigrations(env.databaseUrl);
  await seedActiveCatalog(env);
  const router = createRouter(env, logger);
  const server = createServer((req, res) => {
    if (handleCors(req, res, env)) return;
    void router(req, res);
  });
  server.listen(env.httpPort, env.httpHost, () => {
    logger.info('P6B backend listening', { host: env.httpHost, port: env.httpPort });
  });

  const shutdown = async () => {
    server.close();
    await closePool();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
