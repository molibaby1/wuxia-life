/** Controlled API → Web fixture; uses the two unmodified formal PD-138 events. */
import { createServer } from 'node:http';
import { createDefaultRuntimeEventCatalog } from '../../src/core/EventLoaderRuntimeCatalog.js';
import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog.js';
import { EffectType, EventCategory, EventPriority, type EventDefinition } from '../../src/types/eventTypes.js';
import { loadBackendEnv } from '../../server/src/config/env.js';
import { closePool } from '../../server/src/db/pool.js';
import { runMigrations } from '../../server/src/db/migrate.js';
import { StructuredLogger } from '../../server/src/logging/logger.js';
import { createRouter, seedActiveCatalog } from '../../server/src/http/router.js';
import { handleCors } from '../../server/src/http/cors.js';

const formalCatalog = createDefaultRuntimeEventCatalog();
const setup: EventDefinition = {
  id: 'pd138_web_test_adulthood',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.CRITICAL,
  weight: 100,
  ageRange: { min: 0, max: 1 },
  triggers: [],
  maxTriggers: 1,
  eventType: 'choice',
  content: { title: '受控 API/Web 验证', text: '仅用于验证的成年入口；其后的两项集市事件沿用正式目录原文与条件。' },
  choices: [{
    id: 'pd138_web_test_become_adult',
    text: '进入成年测试时间',
    effects: [{ type: EffectType.TIME_ADVANCE, target: 'age', value: 16, timeUnit: 'year' }],
  }],
};
const events = [setup, ...formalCatalog.getAllEvents().filter(event => event.isSetbackEvent), ...['p138_market_stall_invitation', 'p138_market_stall_supply'].map(id => {
  const event = formalCatalog.getEventById(id);
  if (!event) throw new Error(`Missing formal event: ${id}`);
  return event;
})];
const runtimeCatalog: RuntimeEventCatalog = {
  getAllEvents: () => events,
  getEventById: id => events.find(event => event.id === id),
  getEventsByAge: age => events.filter(event => age >= event.ageRange.min && age <= (event.ageRange.max ?? Infinity)),
  getWeightForAge: (event, age) => formalCatalog.getWeightForAge(event, age),
};

async function main(): Promise<void> {
  const env = loadBackendEnv();
  if (!new URL(env.databaseUrl).pathname.startsWith('/wuxia_pd138_web_')) {
    throw new Error('PD-138 Web harness requires a dedicated wuxia_pd138_web_* database.');
  }
  if (env.httpHost !== '127.0.0.1') throw new Error('PD-138 Web harness must bind to localhost.');
  await runMigrations(env.databaseUrl);
  await seedActiveCatalog(env);
  const router = createRouter(env, new StructuredLogger(env), { runtimeCatalog });
  const server = createServer((req, res) => {
    if (handleCors(req, res, env)) return;
    const path = req.url?.split('?')[0] ?? '';
    res.once('finish', () => console.log(JSON.stringify({ method: req.method, path, status: res.statusCode })));
    void router(req, res);
  });
  server.listen(env.httpPort, env.httpHost, () => console.log(`PD-138 controlled Web API on ${env.httpHost}:${env.httpPort}`));
  const shutdown = () => server.close(() => { void closePool().then(() => process.exit(0)); });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch(error => { console.error(error); process.exit(1); });
