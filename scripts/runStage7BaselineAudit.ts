/**
 * Stage-7 US-001 read-only baseline audit.
 * Usage: npm exec tsx scripts/runStage7BaselineAudit.ts
 */
import { eventLoader } from '../src/core/EventLoader';
import {
  inferEventExclusivePrimaryFlag,
  NEUTRAL_SPINE_EVENT_IDS,
} from '../src/p16/spineOriginIsolation';
import {
  getPreschoolPassiveEntries,
  isNeutralOnlyPreschoolEntry,
  selectPreschoolPassiveEntry,
} from '../src/data/preschoolPassiveSpine';
import type { GameState } from '../src/types/eventTypes';

const PRIMARY_LABEL: Record<string, string> = {
  origin_scholar_family: 'scholar',
  origin_wuxia_family: 'martial',
  origin_merchant_family: 'merchant',
  origin_frontier: 'frontier',
};

function classify812(event: ReturnType<typeof eventLoader.getAllEvents>[number]): string {
  if (NEUTRAL_SPINE_EVENT_IDS.has(event.id)) return 'neutral-whitelist';
  const exclusive = inferEventExclusivePrimaryFlag(event);
  if (exclusive) return PRIMARY_LABEL[exclusive] ?? exclusive;
  const text = JSON.stringify({
    conditions: event.conditions,
    thresholds: event.thresholds,
  });
  if (text.includes('origin_poor_family')) return 'trait-poor';
  if (text.includes('origin_streetborn')) return 'trait-street';
  return 'neutral';
}

function inventory812() {
  const all = eventLoader.getAllEvents();
  return all.filter(e => {
    const min = e.ageRange?.min ?? 0;
    const max = e.ageRange?.max ?? 99;
    return min <= 12 && max >= 8;
  });
}

function inventoryTraitLine() {
  const results: Array<{ id: string; min: number; max: number; flags: string[] }> = [];
  for (const event of eventLoader.getAllEvents()) {
    const text = JSON.stringify({
      conditions: event.conditions,
      thresholds: event.thresholds,
    });
    const flags: string[] = [];
    if (text.includes('origin_poor_family')) flags.push('origin_poor_family');
    if (text.includes('origin_streetborn')) flags.push('origin_streetborn');
    if (flags.length === 0) continue;
    results.push({
      id: event.id,
      min: event.ageRange?.min ?? 0,
      max: event.ageRange?.max ?? 99,
      flags,
    });
  }
  return results.sort((a, b) => a.id.localeCompare(b.id));
}

function samplePassiveRepetition(seed = 42) {
  let s = seed;
  const random = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  const origins = [
    { name: 'scholar', flags: { origin_scholar_family: true } },
    { name: 'martial', flags: { origin_wuxia_family: true } },
    { name: 'merchant', flags: { origin_merchant_family: true } },
    { name: 'frontier', flags: { origin_frontier: true } },
  ];

  const titleCounts: Record<string, number> = {};
  const perOrigin: Record<string, { maxConsecutive: number; top: [string, number][] }> = {};

  for (const origin of origins) {
    let lastTitle: string | null = null;
    let streak = 0;
    let maxConsecutive = 0;
    const counts: Record<string, number> = {};

    for (let age = 3; age <= 7; age++) {
      for (let i = 0; i < 30; i++) {
        const state = {
          player: { age, flags: { ...origin.flags } },
          flags: { ...origin.flags },
          eventHistory: [],
        } as GameState;
        const entry = selectPreschoolPassiveEntry(state, random);
        counts[entry.title] = (counts[entry.title] ?? 0) + 1;
        titleCounts[entry.title] = (titleCounts[entry.title] ?? 0) + 1;
        if (entry.title === lastTitle) {
          streak += 1;
          maxConsecutive = Math.max(maxConsecutive, streak + 1);
        } else {
          streak = 0;
        }
        lastTitle = entry.title;
      }
    }

    perOrigin[origin.name] = {
      maxConsecutive,
      top: Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5) as [string, number][],
    };
  }

  return {
    globalTop: Object.entries(titleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    perOrigin,
    neutralOnlyTitles: [...new Set(
      [3, 4, 5, 6, 7].flatMap(age =>
        getPreschoolPassiveEntries(age)
          .filter(isNeutralOnlyPreschoolEntry)
          .map(e => e.title),
      ),
    )],
  };
}

function main() {
  const band812 = inventory812();
  const groups: Record<string, typeof band812> = {};
  for (const event of band812) {
    const key = classify812(event);
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  }

  console.log('=== 8–12 spine inventory ===');
  console.log('Total:', band812.length);
  for (const key of Object.keys(groups).sort()) {
    console.log(`\n[${key}] (${groups[key].length})`);
    for (const e of groups[key].sort((a, b) => a.id.localeCompare(b.id))) {
      console.log(`  ${e.id} [${e.ageRange?.min}-${e.ageRange?.max}]`);
    }
  }

  console.log('\n=== trait-line inventory ===');
  for (const row of inventoryTraitLine()) {
    console.log(`  ${row.id} [${row.min}-${row.max}] flags=${row.flags.join(',')}`);
  }

  console.log('\n=== passive title repetition (seed=42) ===');
  const rep = samplePassiveRepetition();
  console.log('Neutral-only titles:', rep.neutralOnlyTitles.join(', ') || '(none)');
  console.log('Global top:');
  for (const [title, count] of rep.globalTop) {
    console.log(`  ${title}: ${count}`);
  }
  for (const [origin, stats] of Object.entries(rep.perOrigin)) {
    console.log(
      `  ${origin}: maxConsecutive=${stats.maxConsecutive}, top=${stats.top.map(([t, c]) => `${t}(${c})`).join(', ')}`,
    );
  }
}

main();
