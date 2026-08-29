import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  WUXIA_COMPOSITE_DESTINY_OUTCOMES,
  WUXIA_MIXED_DESTINY_OUTCOMES,
  WUXIA_PINNACLE_DESTINY_OUTCOMES,
} from '../src/narrative/profile/wuxiaOriginSurfaces';
import type { CompositeDestinyOutcome, DestinyDimension } from '../src/narrative/profile/types';
import { evaluateCompositeDestinyOutcome } from '../src/p16/compositeDestiny';
import { readDimensionValueForDestiny } from '../src/p16/originSurfaces';
import type { PlayerState } from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function allOutcomes(): CompositeDestinyOutcome[] {
  return [
    ...WUXIA_COMPOSITE_DESTINY_OUTCOMES,
    ...WUXIA_PINNACLE_DESTINY_OUTCOMES,
    ...WUXIA_MIXED_DESTINY_OUTCOMES,
  ];
}

function testDestinyDimensionHasNoExactBalanceResources(): void {
  const typeBlock = read('src/narrative/profile/types.ts').match(
    /export type DestinyDimension\s*=([\s\S]*?);/,
  )?.[0];
  assert(typeBlock);
  assert.equal(/\|\s*'resources'/.test(typeBlock!), false);

  for (const outcome of allOutcomes()) {
    for (const requirement of outcome.requirements) {
      assert.notEqual(
        requirement.dimension,
        'resources' as DestinyDimension,
        `${outcome.id} must not keep exact-balance resources requirement`,
      );
    }
  }
  assert.equal(read('src/narrative/profile/wuxiaOriginSurfaces.ts').includes("dimension: 'resources'"), false);
}

function testReadDimensionNoLongerReadsWalletBalances(): void {
  const source = read('src/p16/originSurfaces.ts');
  const fn = source.match(
    /export function readDimensionValueForDestiny\([\s\S]*?\n\}/,
  )?.[0];
  assert(fn);
  assert.equal(/case\s+'resources'/.test(fn!), false);
  assert.equal(/player\.money|'money'|\"money\"/.test(fn!), false);
  assert.equal(/player\.wealth|'wealth'|\"wealth\"/.test(fn!), false);

  const player = {
    martialPower: 10,
    connections: 20,
    reputation: 30,
    money: 999,
    wealth: 888,
  } as PlayerState;
  assert.equal(readDimensionValueForDestiny(player, {}, 'skill_growth'), 10);
  assert.equal(readDimensionValueForDestiny(player, {}, 'social_capital'), 20);
  assert.equal(readDimensionValueForDestiny(player, {}, 'reputation'), 30);
  assert.equal(readDimensionValueForDestiny(player, {}, 'resources'), 0);
}

function testNoWealthCapacityReplacementGate(): void {
  for (const outcome of allOutcomes()) {
    for (const requirement of outcome.requirements) {
      assert.notEqual(
        String(requirement.dimension),
        'wealthCapacity',
        `${outcome.id} must not replace resources with wealthCapacity`,
      );
    }
  }
  assert.equal(
    /wealthCapacity|wealth_capacity/.test(read('src/narrative/profile/wuxiaOriginSurfaces.ts').match(
      /WUXIA_COMPOSITE_DESTINY_OUTCOMES[\s\S]*WUXIA_RARE_EVENT_LINES/,
    )?.[0] ?? ''),
    false,
  );
}

function testCrossTrackIndicesRemainValid(): void {
  for (const outcome of allOutcomes()) {
    for (const group of outcome.crossTrackGroups ?? []) {
      for (const index of group.requirementIndices) {
        assert.equal(
          index >= 0 && index < outcome.requirements.length,
          true,
          `${outcome.id}.${group.trackId} index ${index} out of range`,
        );
      }
    }
  }

  const magnate = WUXIA_MIXED_DESTINY_OUTCOMES.find((outcome) => outcome.id === 'merchant_magnate')!;
  assert.deepEqual(
    magnate.crossTrackGroups?.find((group) => group.trackId === 'merchant_route')?.requirementIndices,
    [1, 2],
  );
  assert.deepEqual(
    magnate.crossTrackGroups?.find((group) => group.trackId === 'social_capital')?.requirementIndices,
    [0],
  );

  const patron = WUXIA_MIXED_DESTINY_OUTCOMES.find((outcome) => outcome.id === 'merchant_martial_patron')!;
  assert.deepEqual(
    patron.crossTrackGroups?.find((group) => group.trackId === 'merchant_track')?.requirementIndices,
    [1, 2],
  );
}

function testNonEconomicGatesPreserved(): void {
  const sect = WUXIA_COMPOSITE_DESTINY_OUTCOMES.find((outcome) => outcome.id === 'sect_leader_statesman')!;
  assert.equal(sect.requirements.some((req) => req.dimension === 'skill_growth'), true);
  assert.equal(sect.requirements.some((req) => req.dimension === 'social_capital'), true);
  assert.equal(sect.requirements.some((req) => req.dimension === 'key_choices'), true);

  const medical = WUXIA_COMPOSITE_DESTINY_OUTCOMES.find((outcome) => outcome.id === 'medical_sage_healer')!;
  assert.equal(medical.requirements.some((req) => req.dimension === 'reputation'), true);
  assert.equal(medical.requirements.filter((req) => req.dimension === 'key_choices').length >= 2, true);

  const patriarch = WUXIA_PINNACLE_DESTINY_OUTCOMES.find((outcome) => outcome.id === 'founding_patriarch')!;
  assert.equal(patriarch.requirements.some((req) => req.dimension === 'special_event'), true);
  assert.equal(patriarch.requirements.some((req) => req.gateKind === 'luck'), true);

  const magnate = WUXIA_MIXED_DESTINY_OUTCOMES.find((outcome) => outcome.id === 'merchant_magnate')!;
  const unlocked = evaluateCompositeDestinyOutcome(
    magnate,
    { age: 48, connections: 65, money: 0, reputation: 55 } as PlayerState,
    { route_merchant: true, merchant_empire: true },
  );
  assert.equal(unlocked.unlocked, true, 'merchant_magnate unlocks via social + key choices without wallet balance');

  const blocked = evaluateCompositeDestinyOutcome(
    magnate,
    { age: 48, connections: 65, money: 999, reputation: 55 } as PlayerState,
    { p8_route_wealth: true, merchant_empire: true },
  );
  assert.equal(blocked.unlocked, false, 'p8_route_wealth alone still does not unlock merchant_magnate');
}

function testUnrelatedResourcesMeaningsPreserved(): void {
  assert.equal(
    read('src/narrative/profile/wuxiaOriginSurfaces.ts').includes("altersOpportunityTags: ['business', 'resources']"),
    true,
  );
  assert.match(read('src/narrative/profile/types.ts'), /export type MaintenanceDimension[\s\S]*\|\s*'resources'/);
  assert.match(read('src/narrative/profile/types.ts'), /export type CultivationCostDimension[\s\S]*\|\s*'resources'/);
}

function main(): void {
  testDestinyDimensionHasNoExactBalanceResources();
  testReadDimensionNoLongerReadsWalletBalances();
  testNoWealthCapacityReplacementGate();
  testCrossTrackIndicesRemainValid();
  testNonEconomicGatesPreserved();
  testUnrelatedResourcesMeaningsPreserved();
  console.log('globalMoneyCompositeDestinyResourcesRetirement.test.ts: ok');
}

main();
