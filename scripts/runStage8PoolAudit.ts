/**
 * Stage-8 US-001 read-only pool audit.
 * Usage: npm exec tsx scripts/runStage8PoolAudit.ts
 */
import { eventLoader } from '../src/core/EventLoader';
import { inferTraitLineExclusiveFlag } from '../src/p16/traitLineSpineEligibility';
import {
  getPreschoolPassiveEntries,
  isPreschoolPassiveEligible,
  isNeutralOnlyPreschoolEntry,
  PRESCHOOL_EXCLUSIVE_ORIGIN_TAGS,
} from '../src/data/preschoolPassiveSpine';

const AGES = [3, 4, 5, 6, 7];

function poolDepthTable(): string {
  const lines: string[] = [];
  lines.push('| Origin | Age 3 | Age 4 | Age 5 | Age 6 | Age 7 |');
  lines.push('| --- | --- | --- | --- | --- | --- |');

  for (const tag of PRESCHOOL_EXCLUSIVE_ORIGIN_TAGS) {
    const tags = new Set<string>(['neutral', tag]);
    const cells: string[] = [];
    for (const age of AGES) {
      const entries = getPreschoolPassiveEntries(age);
      const eligible = entries.filter(e => isPreschoolPassiveEligible(e, tags));
      const exclusive = eligible.filter(e => !isNeutralOnlyPreschoolEntry(e));
      const neutral = eligible.filter(e => isNeutralOnlyPreschoolEntry(e));
      cells.push(`${eligible.length} (${exclusive.length}e+${neutral.length}n)`);
    }
    lines.push(`| ${tag} | ${cells.join(' | ')} |`);
  }
  return lines.join('\n');
}

function traitLineSpine37(): string {
  const rows: string[] = [];
  for (const event of eventLoader.getAllEvents()) {
    const min = event.ageRange?.min ?? 0;
    const max = event.ageRange?.max ?? 99;
    if (max < 3 || min > 7) continue;
    const trait = inferTraitLineExclusiveFlag(event);
    if (!trait) continue;
    rows.push(`- \`${event.id}\` (${min}–${max}) → **${trait}**`);
  }
  return rows.length > 0 ? rows.join('\n') : '_None._';
}

console.log('## Pool depth (eligible entries: total, exclusive e, neutral n)\n');
console.log(poolDepthTable());
console.log('\n## Trait-line spine events age 3–7\n');
console.log(traitLineSpine37());
