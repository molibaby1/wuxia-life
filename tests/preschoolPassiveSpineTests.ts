import {
  getPreschoolPassiveEntries,
  preschoolPassiveSpineCatalog,
  selectPreschoolPassiveEntry,
} from '../src/data/preschoolPassiveSpine';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runPreschoolPassiveSpineTests(): void {
  assert(preschoolPassiveSpineCatalog.length >= 8, 'merged preschool catalog has density');

  for (const entry of preschoolPassiveSpineCatalog) {
    assert(Boolean(entry.id && entry.title && entry.text), `entry ${entry.id} has id/title/text`);
    assert(entry.ageMin >= 3 && entry.ageMax <= 7, `entry ${entry.id} in 3–7 band`);
    assert(entry.originTags.length >= 1, `entry ${entry.id} has originTags`);
  }

  const scholarAge3 = getPreschoolPassiveEntries(3, { origin_scholar_family: true }).filter(e =>
    e.originTags.includes('scholar'),
  );
  assert(scholarAge3.length >= 1, 'scholar age 3 has spine entry');

  const clever = preschoolPassiveSpineCatalog.find(e => e.id === 'preschool_scholar_clever_speech');
  assert(clever !== undefined, 'clever_speech equivalent in config');

  const picked = selectPreschoolPassiveEntry({
    player: { age: 5 },
    eventHistory: [],
  } as GameState);
  assert(picked.title.length > 0, 'selectPreschoolPassiveEntry returns narrative');

  for (const origin of ['scholar', 'martial', 'merchant', 'frontier'] as const) {
    const band = getPreschoolPassiveEntries(5).filter(e => e.originTags.includes(origin));
    assert(band.length >= 2, `origin ${origin} has ≥2 entries in 3–7 config`);
  }

  const scholarIds = new Set(
    preschoolPassiveSpineCatalog.filter(e => e.originTags.includes('scholar')).map(e => e.id),
  );
  const martialIds = new Set(
    preschoolPassiveSpineCatalog.filter(e => e.originTags.includes('martial')).map(e => e.id),
  );
  const merchantIds = new Set(
    preschoolPassiveSpineCatalog.filter(e => e.originTags.includes('merchant')).map(e => e.id),
  );
  const frontierIds = new Set(
    preschoolPassiveSpineCatalog.filter(e => e.originTags.includes('frontier')).map(e => e.id),
  );
  for (const id of merchantIds) {
    assert(!scholarIds.has(id) && !martialIds.has(id), `merchant id ${id} must not reuse scholar/martial`);
  }
  for (const id of frontierIds) {
    assert(!scholarIds.has(id) && !martialIds.has(id), `frontier id ${id} must not reuse scholar/martial`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPreschoolPassiveSpineTests();
  console.log('preschoolPassiveSpineTests: ok');
}
