import {
  getPreschoolPassiveEntries,
  preschoolPassiveSpineCatalog,
  selectPreschoolPassiveEntry,
} from '../src/data/preschoolPassiveSpine';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function scholarState(age: number): GameState {
  return {
    player: {
      age,
      flags: { origin_scholar_family: true },
    },
    flags: { origin_scholar_family: true },
    eventHistory: [],
  } as GameState;
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

  const picked = selectPreschoolPassiveEntry(scholarState(5));
  assert(picked.title.length > 0, 'selectPreschoolPassiveEntry returns narrative');

  for (const origin of ['scholar', 'martial', 'merchant', 'frontier'] as const) {
    const band = getPreschoolPassiveEntries(5).filter(e => e.originTags.includes(origin));
    assert(band.length >= 2, `origin ${origin} has ≥2 entries in 3–7 config`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPreschoolPassiveSpineTests();
  console.log('preschoolPassiveSpineTests: ok');
}
