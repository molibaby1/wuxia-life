import type { GameState } from '../src/types/eventTypes';
import { EventExecutor } from '../src/core/EventExecutor';
import { eventLoader } from '../src/core/EventLoader';
import {
  isForeignExclusivePreschoolEntry,
  selectPreschoolPassiveEntry,
} from '../src/data/preschoolPassiveSpine';
import {
  PRIMARY_ORIGIN_FAMILY_FLAGS,
  resolvePrimaryOriginFamilyFlag,
} from '../src/p16/primaryOriginFlag';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function buildMerchantTraitState(age = 1): GameState {
  return {
    player: {
      age,
      flags: { origin_merchant_family: true },
      traitProfile: { origin: 'merchant_house' },
    },
    flags: { origin_merchant_family: true },
    eventHistory: [],
  } as GameState;
}

async function testOriginBackgroundClearsConflictingTraitPrimaryFlag(): Promise<void> {
  const event = eventLoader.getEventById('origin_background');
  assert(event !== undefined, 'origin_background event must exist');
  const choice = event!.choices?.find(c => c.id === 'origin_frontier');
  assert(choice !== undefined, 'origin_frontier choice must exist');

  const executor = new EventExecutor();
  const next = await executor.executeEffects(choice!.effects ?? [], buildMerchantTraitState());

  assert(
    resolvePrimaryOriginFamilyFlag(next) === 'origin_frontier',
    'merchant trait + origin_frontier choice must resolve to origin_frontier',
  );
  assert(!next.flags?.origin_merchant_family, 'origin_merchant_family must be cleared');
  assert(!next.player?.flags?.origin_merchant_family, 'player.origin_merchant_family must be cleared');
  assert(next.flags?.origin_frontier === true, 'origin_frontier must be set');
}

function testResolverPrefersOriginBackgroundRecordWhenFlagsConflict(): void {
  const state = {
    player: {
      age: 4,
      flags: { origin_merchant_family: true, origin_frontier: true },
      events: [{ eventId: 'origin_frontier', age: 1 }],
    },
    flags: { origin_merchant_family: true, origin_frontier: true },
  } as GameState;

  assert(
    resolvePrimaryOriginFamilyFlag(state) === 'origin_frontier',
    'legacy dual-flag state must prefer origin_background event_record',
  );
}

async function testPreschoolPassiveUsesFrontierAfterTraitConflictResolved(): Promise<void> {
  const event = eventLoader.getEventById('origin_background');
  const choice = event!.choices!.find(c => c.id === 'origin_frontier')!;
  const executor = new EventExecutor();
  const state = await executor.executeEffects(choice.effects ?? [], buildMerchantTraitState(4));

  let merchantForeign = 0;
  for (let i = 0; i < 30; i += 1) {
    const picked = selectPreschoolPassiveEntry(state, () => Math.random());
    if (isForeignExclusivePreschoolEntry(picked, 'frontier')) {
      merchantForeign += 1;
    }
  }
  assert(
    merchantForeign === 0,
    `frontier primary at age 4 must not pick foreign passives, got ${merchantForeign} hits`,
  );
}

async function testEachOriginBackgroundChoiceClearsOtherPrimaryFlags(): Promise<void> {
  const event = eventLoader.getEventById('origin_background');
  assert(event !== undefined, 'origin_background event must exist');
  const executor = new EventExecutor();

  for (const flag of PRIMARY_ORIGIN_FAMILY_FLAGS) {
    const others = PRIMARY_ORIGIN_FAMILY_FLAGS.filter(other => other !== flag);
    const conflictFlags = Object.fromEntries(others.map(other => [other, true]));
    const base = {
      player: { age: 1, flags: { ...conflictFlags } },
      flags: { ...conflictFlags },
      eventHistory: [],
    } as GameState;

    const choice = event!.choices!.find(c => c.id === flag);
    assert(choice !== undefined, `${flag} choice must exist`);
    const next = await executor.executeEffects(choice!.effects ?? [], base);

    assert(
      resolvePrimaryOriginFamilyFlag(next) === flag,
      `choice ${flag} must become sole primary`,
    );
    for (const other of others) {
      assert(!next.flags?.[other], `${flag} choice must clear ${other}`);
      assert(!next.player?.flags?.[other], `${flag} choice must clear player.${other}`);
    }
  }
}

async function runPrimaryOriginFlagTests(): Promise<void> {
  await testOriginBackgroundClearsConflictingTraitPrimaryFlag();
  testResolverPrefersOriginBackgroundRecordWhenFlagsConflict();
  await testPreschoolPassiveUsesFrontierAfterTraitConflictResolved();
  await testEachOriginBackgroundChoiceClearsOtherPrimaryFlags();
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

export { runPrimaryOriginFlagTests };
