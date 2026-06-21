import type { EventDefinition, GameState } from '../src/types/eventTypes';
import { gameEngine } from '../src/core/GameEngineIntegration';
import { eventLoader } from '../src/core/EventLoader';
import {
  inferTraitLineExclusiveFlag,
  isTraitLineSpineEligible,
} from '../src/p16/traitLineSpineEligibility';
import type { PrimaryOriginFamilyFlag } from '../src/p16/primaryOriginFlag';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function buildState(
  primary: PrimaryOriginFamilyFlag,
  age: number,
  extraFlags: Record<string, boolean> = {},
): GameState {
  const flags = { [primary]: true, ...extraFlags };
  return {
    player: { age, flags },
    flags,
  } as GameState;
}

function testStreetShapingClassifier(): void {
  const event = eventLoader.getEventById('p22_childhood_street_shaping');
  assert(event !== undefined, 'street shaping event must exist');
  assert(
    inferTraitLineExclusiveFlag(event!) === 'origin_streetborn',
    'street shaping must classify as street-line',
  );
}

function testScholarBlocksStreetShapingWithoutStreetborn(): void {
  const state = buildState('origin_scholar_family', 8, {
    origin_poor_family: true,
    p22_live_ops_active: true,
  });
  const event = eventLoader.getEventById('p22_childhood_street_shaping')!;
  assert(!isTraitLineSpineEligible(event, state), 'scholar+poor must not pass street-line gate');
  gameEngine.loadGameState(state);
  assert(
    !gameEngine.getAvailableEvents(8).some(e => e.id === 'p22_childhood_street_shaping'),
    'street shaping must not appear for scholar without streetborn',
  );
}

function testStreetbornAllowsStreetShaping(): void {
  const state = buildState('origin_scholar_family', 8, {
    origin_streetborn: true,
    p22_live_ops_active: true,
  });
  const event = eventLoader.getEventById('p22_childhood_street_shaping')!;
  assert(isTraitLineSpineEligible(event, state), 'scholar+streetborn may pass street-line gate');
}

function testFrontierOrphanShapingSuccessor(): void {
  const state = buildState('origin_frontier', 8, {
    p22_frontier_orphan_shaped: true,
    p22_live_ops_active: true,
  });
  const event = eventLoader.getEventById('p22_childhood_street_shaping')!;
  assert(
    isTraitLineSpineEligible(event, state),
    'frontier orphan successor may pass street shaping gate',
  );
}

function testCrossTraitBlocked(): void {
  const mockPoorEvent = {
    id: 'mock_poor_line',
    conditions: [{ type: 'expression' as const, expression: 'flags.has("origin_poor_family")' }],
  } as EventDefinition;
  const state = buildState('origin_martial_family' as PrimaryOriginFamilyFlag, 5, {
    origin_streetborn: true,
  });
  assert(!isTraitLineSpineEligible(mockPoorEvent, state), 'street trait must not unlock poor-line');
}

function testScholarPoorOrphanBlockRegression(): void {
  const state = buildState('origin_scholar_family', 2, {
    origin_poor_family: true,
    p22_live_ops_active: true,
  });
  gameEngine.loadGameState(state);
  assert(
    !gameEngine.getAvailableEvents(2).some(e => e.id === 'p22_origin_frontier_orphan'),
    'Stage-6 scholar+poor orphan block must still pass',
  );
}

const PRIMARYS: PrimaryOriginFamilyFlag[] = [
  'origin_scholar_family',
  'origin_wuxia_family',
  'origin_merchant_family',
  'origin_frontier',
];

function testFourMainCrossTraitMatrix(): void {
  const streetEvent = eventLoader.getEventById('p22_childhood_street_shaping')!;
  for (const primary of PRIMARYS) {
    for (const trait of ['none', 'poor', 'street'] as const) {
      const extra: Record<string, boolean> = { p22_live_ops_active: true };
      if (trait === 'poor') extra.origin_poor_family = true;
      if (trait === 'street') extra.origin_streetborn = true;
      const state = buildState(primary, 8, extra);
      const eligible = isTraitLineSpineEligible(streetEvent, state);
      if (trait === 'street') {
        assert(eligible, `${primary}+streetborn should allow street-line`);
      } else {
        assert(!eligible, `${primary}+${trait} must block street-line`);
      }
    }
  }
}

function main(): void {
  testStreetShapingClassifier();
  testScholarBlocksStreetShapingWithoutStreetborn();
  testStreetbornAllowsStreetShaping();
  testFrontierOrphanShapingSuccessor();
  testCrossTraitBlocked();
  testScholarPoorOrphanBlockRegression();
  testFourMainCrossTraitMatrix();
  console.log('✔ traitLineSpineEligibilityTests passed');
}

main();
