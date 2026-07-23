/**
 * Stage-9 US-002: 8-12 P16 agency guardrails matrix.
 */
import { getActionById } from '../src/data/activeActionCatalog';
import { getChildhoodActionById } from '../src/data/childhoodActionCatalog';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import type { GameStateSnapshot } from '../src/contracts/gameStateSnapshot';
import {
  ADULT_CHILDHOOD_BLOCKED_ACTIONS,
  LATE_CHILDHOOD_SUPPRESSED_CATEGORIES,
  MERCHANT_LATE_CHILDHOOD_BUSINESS_LITE_ID,
  resolveChildhoodActionPalette,
} from '../src/p16/childhoodAgency';
import type { PrimaryOriginFamilyFlag } from '../src/p16/primaryOriginFlag';
import type { PlayerState } from '../src/types/eventTypes';

const AGES = [8, 9, 10, 11, 12] as const;
const TICKS = 20;

const ORIGINS: Array<{
  name: string;
  flag: PrimaryOriginFamilyFlag;
  traitOrigin: string;
  personaId: string;
}> = [
  { name: 'scholar', flag: 'origin_scholar_family', traitOrigin: 'scholar_house', personaId: 'p8-scholar-su' },
  { name: 'martial', flag: 'origin_wuxia_family', traitOrigin: 'martial_house', personaId: 'p8-martial-lin' },
  { name: 'merchant', flag: 'origin_merchant_family', traitOrigin: 'merchant_house', personaId: 'p8-wealth-shen' },
  { name: 'frontier', flag: 'origin_frontier', traitOrigin: 'frontier_military', personaId: 'p8-explorer-lu' },
];

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function isSuppressedLateChildhoodActionId(
  actionId: string,
  age: number,
  traitOrigin?: string,
): boolean {
  if (age < 8 || age > 12) return ADULT_CHILDHOOD_BLOCKED_ACTIONS.has(actionId);
  if (ADULT_CHILDHOOD_BLOCKED_ACTIONS.has(actionId)) return true;
  if (
    traitOrigin === 'merchant_house'
    && actionId === MERCHANT_LATE_CHILDHOOD_BUSINESS_LITE_ID
  ) {
    return false;
  }
  const category =
    getActionById(actionId)?.category ?? getChildhoodActionById(actionId)?.category;
  return Boolean(category && LATE_CHILDHOOD_SUPPRESSED_CATEGORIES.has(category));
}

function snapshotForOrigin(
  origin: (typeof ORIGINS)[number],
  age: number,
  seed: number,
): GameStateSnapshot {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: 'Stage9Agency',
    gender: 'female',
    catalogVersion: '1.0.0',
    randomSeed: seed,
  });
  const snap = bootstrap.serialize();
  snap.state.player.age = age;
  snap.state.player.alive = true;
  snap.state.player.traits = [];
  snap.state.flags = {
    ...(snap.state.flags ?? {}),
    [origin.flag]: true,
    p8_persona_id: origin.personaId,
  };
  return snap;
}

function testPaletteMatrix(): void {
  for (const origin of ORIGINS) {
    for (const age of AGES) {
      for (let tick = 0; tick < TICKS; tick += 1) {
        const palette = resolveChildhoodActionPalette({
          age,
          player: { traits: [] } as PlayerState,
          flags: {
            [origin.flag]: true,
            p8_persona_id: origin.personaId,
            p8_matrix_tick: tick,
          },
        });
        for (const action of palette) {
          assert(
            !isSuppressedLateChildhoodActionId(action.id, age, origin.traitOrigin),
            `${origin.name} age ${age} tick ${tick}: suppressed action ${action.id}`,
          );
        }
        assert(
          palette.some(a => a.id === 'action_childhood_training' || a.id === 'action_study_lite'),
          `${origin.name} age ${age} tick ${tick}: missing allowlisted training/study`,
        );
      }
    }
  }
}

async function testHeadlessPlanningMatrix(): Promise<void> {
  for (const origin of ORIGINS) {
    for (const age of AGES) {
      for (let tick = 0; tick < TICKS; tick += 1) {
        const session = HeadlessEngineSessionImpl.create({
          playerName: 'Stage9Agency',
          gender: 'female',
          catalogVersion: '1.0.0',
          randomSeed: 91000 + tick,
        });
        await session.hydrate(snapshotForOrigin(origin, age, 91000 + tick));
        (session as unknown as { volatile: { storyGapPassiveServed: boolean } }).volatile.storyGapPassiveServed =
          true;
        assert(
          session.getSessionPhase() === 'active_planning',
          `${origin.name} age ${age} tick ${tick}: expected active_planning`,
        );
        const options = session.getPlanningOptions();
        assert(options.length >= 1, `${origin.name} age ${age} tick ${tick}: empty planning options`);
        for (const option of options) {
          assert(
            !isSuppressedLateChildhoodActionId(option.actionId, age, origin.traitOrigin),
            `${origin.name} age ${age} tick ${tick}: headless suppressed id ${option.actionId}`,
          );
        }
        assert(
          options.some(o => o.actionId === 'action_childhood_training' || o.actionId === 'action_study_lite'),
          `${origin.name} age ${age} tick ${tick}: headless missing allowlisted action`,
        );
      }
    }
  }
}

export async function runLateChildhoodAgencyStage9Tests(): Promise<void> {
  testPaletteMatrix();
  await testHeadlessPlanningMatrix();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runLateChildhoodAgencyStage9Tests()
    .then(() => console.log('lateChildhoodAgencyStage9Tests: ok'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
