import type { GameState } from '../src/types/eventTypes';
import {
  BIRTH_BACKGROUND_TO_PRIMARY_FLAG,
  resolveBirthBackground,
} from '../src/p16/canonicalBirthBackground';
import {
  isForeignExclusivePreschoolEntry,
  selectPreschoolPassiveEntry,
} from '../src/data/preschoolPassiveSpine';
import { resolvePrimaryOriginFamilyFlag } from '../src/p16/primaryOriginFlag';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function buildState(age = 1): GameState {
  return {
    player: {
      age,
      flags: {},
      events: [],
    },
    facts: {},
    flags: {},
    eventHistory: [],
  } as GameState;
}

function testCanonicalResolutionProjectsOnlyOnePrimaryFlag(): void {
  const state = resolveBirthBackground(buildState(), { override: 'frontier_military' });
  assert(resolvePrimaryOriginFamilyFlag(state) === 'origin_frontier', 'canonical frontier must resolve to frontier flag');
  for (const [background, flag] of Object.entries(BIRTH_BACKGROUND_TO_PRIMARY_FLAG)) {
    assert(Boolean(state.flags[flag]) === (background === 'frontier_military'), `${flag} must be derived only for the selected background`);
  }
}

function testCanonicalFactWinsOverConflictingLegacyProjection(): void {
  const state = resolveBirthBackground(buildState(), { override: 'merchant_house' });
  state.flags.origin_frontier = true;
  state.player.flags.origin_frontier = true;
  assert(resolvePrimaryOriginFamilyFlag(state) === 'origin_merchant_family', 'canonical fact must win over stale legacy flags');
}

function testPreschoolPassiveUsesCanonicalFrontierBackground(): void {
  const state = resolveBirthBackground(buildState(4), { override: 'frontier_military' });
  let merchantForeign = 0;
  for (let i = 0; i < 30; i += 1) {
    const picked = selectPreschoolPassiveEntry(state, () => Math.random());
    if (isForeignExclusivePreschoolEntry(picked, 'frontier')) merchantForeign += 1;
  }
  assert(merchantForeign === 0, `frontier background must not pick foreign passives, got ${merchantForeign} hits`);
}

export async function runPrimaryOriginFlagTests(): Promise<void> {
  testCanonicalResolutionProjectsOnlyOnePrimaryFlag();
  testCanonicalFactWinsOverConflictingLegacyProjection();
  testPreschoolPassiveUsesCanonicalFrontierBackground();
}

async function main(): Promise<void> {
  await runPrimaryOriginFlagTests();
  console.log('✔ primaryOriginFlagTests passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
