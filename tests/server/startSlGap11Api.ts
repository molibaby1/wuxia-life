import { createServer } from 'node:http';
import { EventCategory, EventPriority, EffectType, type EventDefinition } from '../../src/types/eventTypes.js';
import { ITEM_DEFINITIONS } from '../../src/types/item.js';
import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog.js';
import { loadBackendEnv } from '../../server/src/config/env.js';
import { closePool } from '../../server/src/db/pool.js';
import { runMigrations } from '../../server/src/db/migrate.js';
import { StructuredLogger } from '../../server/src/logging/logger.js';
import { createRouter, seedActiveCatalog } from '../../server/src/http/router.js';
import { handleCors } from '../../server/src/http/cors.js';

const item = ITEM_DEFINITIONS[0]!;

function makeItemEvent(
  id: string,
  title: string,
  choiceId: string,
  choiceText: string,
  condition: 'item_not_owned' | 'item_owned',
  effectType: typeof EffectType.ITEM_ADD | typeof EffectType.ITEM_REMOVE,
): EventDefinition {
  return {
    id,
    version: '1.0.0',
    category: EventCategory.SIDE_QUEST,
    priority: EventPriority.NORMAL,
    weight: 100,
    maxTriggers: 1,
    ageRange: { min: 0, max: 100 },
    triggers: [],
    storyLine: 'sl_gap_11_api_test_only',
    content: { title, text: 'SL-GAP-11 API/Web 端到端测试事件。' },
    eventType: 'choice',
    choices: [{
      id: choiceId,
      text: choiceText,
      condition: { type: condition, item: item.id },
      effects: [{ type: effectType, item: item.id }],
    }],
  };
}

const testEvents = [
  makeItemEvent(
    'sl_gap_11_api_item_acquire',
    '受控取得测试物品',
    'acquire_test_item',
    `取得${item.displayName}`,
    'item_not_owned',
    EffectType.ITEM_ADD,
  ),
  makeItemEvent(
    'sl_gap_11_api_item_lose',
    '受控失去测试物品',
    'lose_test_item',
    `交还${item.displayName}`,
    'item_owned',
    EffectType.ITEM_REMOVE,
  ),
];

const testRuntimeCatalog: RuntimeEventCatalog = {
  getAllEvents: () => testEvents,
  getEventsByAge: age => testEvents.filter(event =>
    age >= event.ageRange.min && (event.ageRange.max === undefined || age <= event.ageRange.max),
  ),
  getEventById: id => testEvents.find(event => event.id === id),
  getWeightForAge: event => event.weight,
};

function assertDedicatedDatabase(databaseUrl: string): void {
  const databaseName = new URL(databaseUrl).pathname.slice(1);
  if (!databaseName.startsWith('wuxia_sl_gap11_')) {
    throw new Error('SL-GAP-11 API harness requires a dedicated wuxia_sl_gap11_* database.');
  }
}

async function main(): Promise<void> {
  const env = loadBackendEnv();
  assertDedicatedDatabase(env.databaseUrl);
  const logger = new StructuredLogger(env);
  await runMigrations(env.databaseUrl);
  await seedActiveCatalog(env);

  const router = createRouter(env, logger, { runtimeCatalog: testRuntimeCatalog });
  const server = createServer((req, res) => {
    if (handleCors(req, res, env)) return;
    void router(req, res);
  });
  server.listen(env.httpPort, env.httpHost, () => {
    logger.info('SL-GAP-11 isolated test API listening', { host: env.httpHost, port: env.httpPort });
  });

  const shutdown = () => {
    server.close(() => {
      void closePool().then(() => process.exit(0));
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
