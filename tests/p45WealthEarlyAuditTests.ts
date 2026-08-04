import { summarizeWealthEarlyAudit } from '../src/p45/wealthEarlyAudit';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import type { GameProcessRecord, GameProcessReport } from '../src/types/simulationRecordTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function makeRecord(
  age: number,
  eventId: string,
  title: string,
  extra: Partial<GameProcessRecord> = {},
): GameProcessRecord {
  return {
    age,
    eventId,
    eventTitle: title,
    eventType: 'auto',
    gameState: {
      player: {
        age,
        name: 'shen',
        gender: 'male',
        martialPower: age >= 20 ? 20 : 10,
        chivalry: 10,
        constitution: 50,
        comprehension: 12,
        affiliation: null,
        title: null,
        reputation: age >= 18 ? 8 : 2,
        money: age >= 18 ? 180 : 80,
        knowledge: 12,
        charisma: 10,
        businessAcumen: age >= 18 ? 8 : 2,
        influence: 5,
        connections: 6,
        martialHeritage: 0,
        scholarlyHeritage: 0,
        merchantNetwork: 0,
        children: 0,
        spouse: null,
        alive: true,
        lifeStates: createDefaultPlayerLifeStates({
          trainingHabit: age >= 20 ? 1 : 0,
          businessHabit: age >= 20 ? 2 : age >= 15 ? 1 : 0,
        }),
        flags: {},
      },
      flags: age >= 19 ? { route_demonic: true, p8_persona_id: 'p8-wealth-shen' } : { p8_persona_id: 'p8-wealth-shen' },
      relations: {},
      achievements: [],
      eventHistory: [],
    } as GameProcessRecord['gameState'],
    timestamp: new Date(`2026-01-${String(Math.min(age + 1, 28)).padStart(2, '0')}T00:00:00.000Z`).toISOString(),
    ...extra,
  };
}

function buildFixture(): GameProcessReport {
  const records: GameProcessRecord[] = [
    makeRecord(8, 'daily_copybook_practice_pos_1', '临帖抄书'),
    makeRecord(12, 'daily_take_odd_job_pos_1', '接点零活'),
    makeRecord(13, 'active_action_business', '营商', {
      progressionKind: 'active_action',
      activeActionId: 'action_business_basic',
    }),
    makeRecord(15, 'daily_small_trade_pos_1', '小本生意'),
    makeRecord(17, 'active_action_business_2', '营商', {
      progressionKind: 'active_action',
      activeActionId: 'action_business_basic',
    }),
    makeRecord(19, 'demonic_path_intro', '幽影门之路'),
    makeRecord(20, 'childhood_summary', '童年总结'),
  ];

  return {
    records,
    config: { p8PersonaId: 'p8-wealth-shen' },
    statistics: {
      sectJoined: null,
      growthBiasSummary: ['growth=merchant'],
    },
  } as GameProcessReport;
}

function main(): void {
  const audit = summarizeWealthEarlyAudit(buildFixture());
  assert(audit.personaId === 'p8-wealth-shen', 'persona id');
  assert(audit.activeActionCounts.business === 2, `business actions expected 2, got ${audit.activeActionCounts.business}`);
  assert(audit.dailyGroupCounts.livelihood === 2, `livelihood daily expected 2, got ${audit.dailyGroupCounts.livelihood}`);
  assert(audit.checkpoints.length === 4, `expected 4 checkpoints, got ${audit.checkpoints.length}`);
  assert(audit.checkpoints[3]?.lifeStates.businessHabit === 2, 'age20 businessHabit should be 2');
  assert(audit.routeSignalAges.some(entry => entry.signal === 'route_demonic' && entry.age === 19), 'route_demonic age');
  console.log('p45WealthEarlyAuditTests: all passed');
}

main();
