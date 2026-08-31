import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { eventLoader } from '../src/core/EventLoader';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { personArchetypeCatalog } from '../src/data/personArchetypeCatalog';
import type { EventDefinition, GameState } from '../src/types/eventTypes';

const QUARANTINED_EVENT_IDS = [
  'relationship_master_disciple',
  'relationship_master_betrayal',
  'relationship_master_legacy',
  'relationship_blood_brotherhood',
  'relationship_sworn_help',
  'relationship_mentor_encounter',
  'relationship_enemy_create',
  'relationship_revenge',
  'p22_relationship_mentor_obligation',
] as const;

const RETAINED_EVENT_IDS = [
  'relationship_life_saving',
  'relationship_debt_return',
  'p28_social_momentum_network_fork',
  'p28_social_reputation_reinforcement',
  'p29_social_momentum_patron_obligation',
  'p42_social_momentum_youth_introduction',
  'p42_social_momentum_later_testimonial',
] as const;

const RELATIONSHIP_SOURCE = path.resolve('src/data/lines/relationship.json');
const P22_SOURCE = path.resolve('src/data/lines/p22-content-expansions.json');
const DEFERRED_SOURCE = path.resolve('src/data/lines/relationship-person-legacy-deferred.json');
const EVENTS_INDEX_SOURCE = path.resolve('src/data/events.json');
const PERSON_ARCHETYPE_SOURCE = path.resolve('src/data/personArchetypeCatalog.ts');
const SNAPSHOT_CONTRACT_SOURCE = path.resolve('src/contracts/gameStateSnapshot.ts');
const EVENT_TYPES_SOURCE = path.resolve('src/types/eventTypes.ts');

const FORBIDDEN_REPLACEMENT_FLAGS = [
  'has_enemy',
  'enemy_bond',
  'enemy_person',
  'has_concrete_master',
  'has_real_sworn_brother',
  'mentor_person_exists',
  'relationship_person_known',
] as const;

function readEventArray(filePath: string): EventDefinition[] {
  if (!fs.existsSync(filePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as EventDefinition[] | { events?: EventDefinition[] };
  return Array.isArray(parsed) ? parsed : parsed.events ?? [];
}

function freshState(): GameState {
  const state = new GameEngineIntegration().getGameState();
  state.flags = {};
  state.relations = {};
  state.player.flags = {};
  state.player.relationships = [];
  state.player.spouse = null;
  state.player.children = 0;
  return state;
}

function assertNoFabricatedRelationship(state: GameState, forbiddenNames: string[]): void {
  const relationships = deriveLifeMemorySummary(state).relationships ?? [];
  assert.equal(
    relationships.some((entry) => forbiddenNames.includes(entry.name)),
    false,
    `generic relationship flags must not fabricate ${forbiddenNames.join('/')}`,
  );
  assert.equal(
    relationships.some((entry) => entry.diagnostic?.affinity !== undefined && forbiddenNames.includes(entry.name)),
    false,
    'fabricated generic relationship entries must not carry synthetic affinity',
  );
}

function assertRuntimeMembership(): void {
  const runtimeIds = new Set(eventLoader.getAllEvents().map((event) => event.id));
  for (const id of QUARANTINED_EVENT_IDS) {
    assert.equal(runtimeIds.has(id), false, `${id} must leave active runtime`);
  }
  for (const id of RETAINED_EVENT_IDS) {
    assert.equal(runtimeIds.has(id), true, `${id} must remain active`);
  }

  // 391 is the accepted 400-event baseline minus exactly the nine PD-104 events.
  assert.equal(JSON.parse(fs.readFileSync(EVENTS_INDEX_SOURCE, 'utf8')).imports.length, 28);
  assert.equal(eventLoader.getAllEvents().length, 391);
}

function assertDeferredMembership(): void {
  const deferredIds = readEventArray(DEFERRED_SOURCE).map((event) => event.id);
  assert.equal(deferredIds.length, QUARANTINED_EVENT_IDS.length, 'deferred source must contain exactly nine events');
  assert.deepEqual(new Set(deferredIds), new Set(QUARANTINED_EVENT_IDS));
  assert.equal(new Set(deferredIds).size, deferredIds.length, 'deferred event IDs must be unique');
  assert.equal(fs.readFileSync(EVENTS_INDEX_SOURCE, 'utf8').includes('relationship-person-legacy-deferred'), false);
}

function assertActiveSourceCounts(): void {
  const relationshipIds = readEventArray(RELATIONSHIP_SOURCE).map((event) => event.id);
  assert.equal(relationshipIds.length, 7);
  assert.equal(relationshipIds.includes('relationship_life_saving'), true);
  assert.equal(relationshipIds.includes('relationship_debt_return'), true);
  assert.equal(relationshipIds.some((id) => QUARANTINED_EVENT_IDS.includes(id as (typeof QUARANTINED_EVENT_IDS)[number])), false);

  const p22Ids = readEventArray(P22_SOURCE).map((event) => event.id);
  assert.equal(p22Ids.includes('p22_relationship_mentor_obligation'), false);
}

function assertLifeMemoryClosure(): void {
  const masterOnly = freshState();
  masterOnly.flags.has_master = true;
  assertNoFabricatedRelationship(masterOnly, ['恩师']);

  const swornOnly = freshState();
  swornOnly.flags.has_sworn_siblings = true;
  assertNoFabricatedRelationship(swornOnly, ['义兄弟', '义兄弟姐妹']);

  const allyNetworkOnly = freshState();
  allyNetworkOnly.flags.ally_network = true;
  assertNoFabricatedRelationship(allyNetworkOnly, ['恩师', '师父']);

  const mentorOnly = freshState();
  mentorOnly.flags.mentor_bond = true;
  assertNoFabricatedRelationship(mentorOnly, ['恩师', '师父']);
}

function assertNoScopeExpansion(): void {
  const activeSources = JSON.stringify([
    ...readEventArray(RELATIONSHIP_SOURCE),
    ...readEventArray(P22_SOURCE),
  ]);
  for (const flag of FORBIDDEN_REPLACEMENT_FLAGS) {
    assert.equal(activeSources.includes(flag), false, `PD-104 must not add replacement flag ${flag}`);
  }

  assert.deepEqual(Object.keys(personArchetypeCatalog), ['merchant_introduced_partner_v1']);
  const archetypeSource = fs.readFileSync(PERSON_ARCHETYPE_SOURCE, 'utf8');
  for (const term of ['master', 'sworn', 'mentor', 'enemy']) {
    assert.equal(archetypeSource.includes(`'${term}_`), false, `PD-104 must not add a ${term} archetype`);
  }

  const snapshotSource = fs.readFileSync(SNAPSHOT_CONTRACT_SOURCE, 'utf8');
  assert.equal(/\bPersonRegistry\b|\bpersonRegistry\b/.test(snapshotSource), false);
  const eventTypesSource = fs.readFileSync(EVENT_TYPES_SOURCE, 'utf8');
  assert.equal(/\bPersonRegistry\b|\bpersonRegistry\b/.test(eventTypesSource), false);
}

function runGenericRelationshipLegacyQuarantineTests(): void {
  assertRuntimeMembership();
  assertDeferredMembership();
  assertActiveSourceCounts();
  assertLifeMemoryClosure();
  assertNoScopeExpansion();
  console.log('genericRelationshipLegacyQuarantine.test.ts: ok');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runGenericRelationshipLegacyQuarantineTests();
}
