/**
 * Stage-10 US-004: 13–20 P16 youth agency matrix.
 */
import { P7_MINIMUM_ACTION_IDS } from '../src/data/activeActionCatalog';
import { getActionById } from '../src/data/activeActionCatalog';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import type { GameStateSnapshot } from '../src/contracts/gameStateSnapshot';
import {
  LATE_CHILDHOOD_SUPPRESSED_CATEGORIES,
  resolveChildhoodActionPalette,
} from '../src/p16/childhoodAgency';
import type { PrimaryOriginFamilyFlag } from '../src/p16/primaryOriginFlag';
import type { PlayerState } from '../src/types/eventTypes';

const AGES = [13, 14, 15, 16, 17, 18, 19, 20] as const;
const TICKS = 20;
const BASIC_IDS = new Set<string>(P7_MINIMUM_ACTION_IDS);

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

const EXPANDED_CATEGORIES = new Set(['business', 'travel', 'socializing']);

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function paletteHasExpandedCategory(palette: Array<{ id: string; category?: string }>): boolean {
  return palette.some(action => {
    const category = action.category ?? getActionById(action.id)?.category;
    return category && EXPANDED_CATEGORIES.has(category);
  });
}

function allFiveBasicInPalette(ids: string[]): boolean {
  return [...BASIC_IDS].every(id => ids.includes(id));
}

function snapshotForOrigin(
  origin: (typeof ORIGINS)[number],
  age: number,
  seed: number,
): GameStateSnapshot {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: 'Stage10Youth',
    gender: 'female',
    catalogVersion: '1.0.0',
    randomSeed: seed,
  });
  const snap = bootstrap.serialize();
  snap.state.player.age = age;
  snap.state.player.alive = true;
  snap.state.player.traitProfile = { origin: origin.traitOrigin };
  snap.state.flags = {
    ...(snap.state.flags ?? {}),
    [origin.flag]: true,
    p8_persona_id: origin.personaId,
  };
  return snap;
}

function testPaletteMatrix(): void {
  const expandedSeen = new Map<string, boolean>();

  for (const origin of ORIGINS) {
    expandedSeen.set(origin.name, false);
    for (const age of AGES) {
      for (let tick = 0; tick < TICKS; tick += 1) {
        const palette = resolveChildhoodActionPalette({
          age,
          player: { traitProfile: { origin: origin.traitOrigin } } as PlayerState,
          flags: {
            [origin.flag]: true,
            p8_persona_id: origin.personaId,
            p8_matrix_tick: tick,
          },
        });
        const ids = palette.map(a => a.id);
        assert(
          !allFiveBasicInPalette(ids),
          `${origin.name} age ${age} tick ${tick}: all five action_*_basic in palette`,
        );
        if (palette.length > 0) {
          assert(
            palette.some(
              a =>
                a.category === 'training' ||
                a.category === 'study' ||
                a.id === 'action_childhood_training' ||
                a.id === 'action_study_lite' ||
                a.id === 'action_training_basic' ||
                a.id === 'action_study_basic',
            ),
            `${origin.name} age ${age} tick ${tick}: missing training/study`,
          );
        }
        if (paletteHasExpandedCategory(palette)) {
          expandedSeen.set(origin.name, true);
        }
      }
    }
    assert(
      expandedSeen.get(origin.name) === true,
      `${origin.name}: no cell exposed business/travel/socializing in ages 13–20`,
    );
  }
}

function testNo812SuppressedBleed(): void {
  for (const age of [8, 10, 12] as const) {
    for (const origin of ORIGINS) {
      const palette = resolveChildhoodActionPalette({
        age,
        player: { traitProfile: { origin: origin.traitOrigin } } as PlayerState,
        flags: { [origin.flag]: true, p8_persona_id: origin.personaId },
      });
      for (const action of palette) {
        const category = action.category ?? getActionById(action.id)?.category;
        assert(
          !category || !LATE_CHILDHOOD_SUPPRESSED_CATEGORIES.has(category),
          `${origin.name} age ${age}: 8–12 suppressed category ${category} in palette`,
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
          playerName: 'Stage10Youth',
          gender: 'female',
          catalogVersion: '1.0.0',
          randomSeed: 92000 + tick,
        });
        await session.hydrate(snapshotForOrigin(origin, age, 92000 + tick));
        (session as unknown as { volatile: { storyGapPassiveServed: boolean } }).volatile.storyGapPassiveServed =
          true;
        assert(
          session.getSessionPhase() === 'active_planning',
          `${origin.name} age ${age} tick ${tick}: expected active_planning`,
        );
        const options = session.getPlanningOptions();
        assert(options.length >= 1, `${origin.name} age ${age} tick ${tick}: empty planning options`);
        const ids = options.map(o => o.actionId);
        assert(
          !allFiveBasicInPalette(ids),
          `${origin.name} age ${age} tick ${tick}: headless all five basics`,
        );
      }
    }
  }
}

export async function runYouthAgencyStage10Tests(): Promise<void> {
  testPaletteMatrix();
  testNo812SuppressedBleed();
  await testHeadlessPlanningMatrix();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runYouthAgencyStage10Tests()
    .then(() => console.log('youthAgencyStage10Tests: ok'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
