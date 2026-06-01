/**
 * P4 US-013: Replay log contract tests.
 */

import { assert, assertDeepEqual } from '../GameTestFramework';
import { REPLAY_LOG_VERSION, type ReplayLogEntry } from '../../src/contracts/replayLog';
import {
  replayLogAge50,
  serializeReplayLogAge50Fixture,
} from '../../src/contracts/fixtures/replayLogAge50';
import { validateReplayLog as validateReplayLogWithContractValidator } from '../../src/contracts/validation/contractValidation';

const REQUIRED_METADATA_KEYS = [
  'replayVersion',
  'engineVersion',
  'eventCatalogVersion',
  'initialSeed',
  'startSnapshotHash',
  'platform',
  'createdAt',
] as const;

const REQUIRED_ENTRY_KEYS = [
  'sequence',
  'actionType',
  'age',
  'timestamp',
  'snapshotHashBefore',
  'snapshotHashAfter',
] as const;

function validateEntryShape(entry: ReplayLogEntry): string[] {
  const errors: string[] = [];
  for (const key of REQUIRED_ENTRY_KEYS) {
    if (entry[key as keyof ReplayLogEntry] === undefined) {
      errors.push(`missing ${key}`);
    }
  }
  if (entry.actionType === 'choice' || entry.actionType === 'auto_event') {
    if (!entry.eventId) errors.push('missing eventId');
  }
  if (entry.actionType === 'choice' && !entry.choiceId) {
    errors.push('missing choiceId');
  }
  return errors;
}

function validateReplayLogShape(log: typeof replayLogAge50): string[] {
  const errors: string[] = [];
  for (const key of REQUIRED_METADATA_KEYS) {
    if (log.metadata[key] === undefined || log.metadata[key] === '') {
      errors.push(`metadata.${key}`);
    }
  }
  log.entries.forEach((entry, i) => {
    const entryErrors = validateEntryShape(entry);
    entryErrors.forEach((e) => errors.push(`entries[${i}].${e}`));
  });
  return errors;
}

console.log('=== P4 US-013: Replay Contract Tests ===\n');

{
  const serialized = serializeReplayLogAge50Fixture();
  const parsed = JSON.parse(serialized);
  assertDeepEqual(parsed, replayLogAge50, 'replay log fixture round-trips');

  const choiceEntries = replayLogAge50.entries.filter((e) => e.actionType === 'choice');
  assert(choiceEntries.length >= 2, 'fixture has multiple choice entries');

  const hasRouteOrRelationshipChange = replayLogAge50.entries.some(
    (e) =>
      e.eventId === 'hero_origin_01' ||
      e.eventId === 'marriage_lin_waner_01' ||
      e.eventId === 'youth_sect_choice_01',
  );
  assert(hasRouteOrRelationshipChange, 'fixture includes route or relationship change events');

  console.log('✓ replay log fixture parses and validates');
}

{
  assert(replayLogAge50.metadata.replayVersion === REPLAY_LOG_VERSION, 'replay version matches');
  const missing = validateReplayLogShape(replayLogAge50);
  assert(missing.length === 0, `required metadata/entries present: ${missing.join(', ')}`);
  console.log('✓ required replay metadata present');
}

{
  replayLogAge50.entries.forEach((entry) => {
    assert(entry.eventId === undefined || entry.eventId.length > 0, 'eventId non-empty when set');
    assert(typeof entry.snapshotHashBefore === 'string', 'snapshotHashBefore is string');
    assert(typeof entry.snapshotHashAfter === 'string', 'snapshotHashAfter is string');
  });
  console.log('✓ replay entries contain required hash and event fields');
}

{
  assert(
    replayLogAge50.entries[0].snapshotHashBefore === replayLogAge50.metadata.startSnapshotHash,
    'first entry hash must match metadata.startSnapshotHash',
  );

  for (let i = 1; i < replayLogAge50.entries.length; i += 1) {
    assert(
      replayLogAge50.entries[i].snapshotHashBefore === replayLogAge50.entries[i - 1].snapshotHashAfter,
      `entry ${i} hash chain must link to previous entry`,
    );
  }

  let lastRandomDrawIndex: number | null = null;
  for (const entry of replayLogAge50.entries) {
    if (entry.randomDrawIndex !== undefined) {
      if (lastRandomDrawIndex !== null) {
        assert(
          entry.randomDrawIndex > lastRandomDrawIndex,
          'randomDrawIndex must be strictly increasing when present',
        );
      }
      lastRandomDrawIndex = entry.randomDrawIndex;
    }
  }

  const terminalIndices = replayLogAge50.entries
    .map((entry, index) => (entry.actionType === 'terminal' ? index : -1))
    .filter((index) => index >= 0);
  assert(terminalIndices.length === 1, 'replay fixture must contain exactly one terminal entry');
  assert(
    terminalIndices[0] === replayLogAge50.entries.length - 1,
    'terminal entry must be the last entry',
  );
  console.log('✓ replay integrity checks: start hash, chain, random monotonic, terminal tail');
}

{
  const malformed = JSON.parse(serializeReplayLogAge50Fixture()) as typeof replayLogAge50;
  const badEntry = { ...malformed.entries[0] };
  delete (badEntry as Partial<ReplayLogEntry>).choiceId;
  badEntry.actionType = 'choice';
  const errors = validateEntryShape(badEntry as ReplayLogEntry);
  assert(errors.includes('missing choiceId'), 'malformed choice entry reported');

  const badMeta = { ...malformed.metadata };
  delete (badMeta as Record<string, unknown>).initialSeed;
  assert(!badMeta.initialSeed, 'malformed metadata detectable');

  const badStartHash = JSON.parse(serializeReplayLogAge50Fixture()) as typeof replayLogAge50;
  badStartHash.entries[0].snapshotHashBefore = 'sha256:wrong_start_hash';
  const badStartHashResult = validateReplayLogWithContractValidator(badStartHash);
  assert(!badStartHashResult.ok, 'validator rejects startSnapshotHash mismatch');
  if (!badStartHashResult.ok) {
    assert(
      badStartHashResult.errors.some((e) => e.includes('must match metadata.startSnapshotHash')),
      'startSnapshotHash mismatch error is reported',
    );
  }

  const badHashChain = JSON.parse(serializeReplayLogAge50Fixture()) as typeof replayLogAge50;
  badHashChain.entries[3].snapshotHashBefore = 'sha256:broken_chain';
  const badHashChainResult = validateReplayLogWithContractValidator(badHashChain);
  assert(!badHashChainResult.ok, 'validator rejects hash chain break');
  if (!badHashChainResult.ok) {
    assert(
      badHashChainResult.errors.some((e) => e.includes('must match previous snapshotHashAfter')),
      'hash chain break error is reported',
    );
  }

  const badRandomDraw = JSON.parse(serializeReplayLogAge50Fixture()) as typeof replayLogAge50;
  badRandomDraw.entries[4].randomDrawIndex = 2;
  const badRandomDrawResult = validateReplayLogWithContractValidator(badRandomDraw);
  assert(!badRandomDrawResult.ok, 'validator rejects non-monotonic randomDrawIndex');
  if (!badRandomDrawResult.ok) {
    assert(
      badRandomDrawResult.errors.some((e) => e.includes('randomDrawIndex must be strictly increasing')),
      'randomDrawIndex monotonicity error is reported',
    );
  }

  const badPostTerminal = JSON.parse(serializeReplayLogAge50Fixture()) as typeof replayLogAge50;
  const lastEntry = badPostTerminal.entries[badPostTerminal.entries.length - 1];
  badPostTerminal.entries.push({
    ...badPostTerminal.entries[0],
    sequence: 9,
    actionType: 'choice',
    eventId: 'after_terminal_invalid',
    choiceId: 'choice_after_terminal',
    snapshotHashBefore: lastEntry.snapshotHashAfter,
    snapshotHashAfter: 'sha256:after_terminal_invalid',
  });
  const badPostTerminalResult = validateReplayLogWithContractValidator(badPostTerminal);
  assert(!badPostTerminalResult.ok, 'validator rejects entries appended after terminal');
  if (!badPostTerminalResult.ok) {
    assert(
      badPostTerminalResult.errors.some((e) => e.includes('must not exist after terminal entry')),
      'post-terminal append error is reported',
    );
  }
  console.log('✓ malformed replay entries rejected or reported');
}

console.log('\n✅ All replay contract tests passed');
