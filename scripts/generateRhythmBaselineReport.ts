import { mkdir, writeFile } from 'node:fs/promises';
import { computeMetrics, formatMetrics, simulateSample, toPct } from './reportRhythmMetrics';

interface AgeBand {
  label: string;
  min: number;
  max: number;
}

const DEFAULT_SEED = Number(process.env.RHYTHM_BASELINE_SEED || '1');
const DEFAULT_MAX_AGE = Number(process.env.RHYTHM_BASELINE_MAX_AGE || '80');
const OUTPUT_PATH = process.env.RHYTHM_BASELINE_OUTPUT || 'docs/test-reports/us-004-rhythm-baseline.md';

const AGE_BANDS: AgeBand[] = [
  { label: 'childhood', min: 0, max: 12 },
  { label: 'adolescence', min: 13, max: 18 },
  { label: 'young_adult', min: 19, max: 35 },
  { label: 'midlife', min: 36, max: 55 },
  { label: 'late_life', min: 56, max: 80 },
];

function buildAgeBandSummary(eventCountPerAge: Array<{ age: number; count: number }>) {
  return AGE_BANDS.map(band => {
    const rows = eventCountPerAge.filter(item => item.age >= band.min && item.age <= band.max);
    const totalEvents = rows.reduce((sum, item) => sum + item.count, 0);
    const emptyAges = rows.filter(item => item.count === 0).length;
    return {
      ...band,
      agesCovered: rows.length,
      totalEvents,
      avgEventsPerAge: rows.length > 0 ? totalEvents / rows.length : 0,
      emptyAges,
    };
  });
}

function buildMarkdownReport(params: {
  seed: number;
  maxAge: number;
  generatedAt: string;
  metricsText: string;
  ageBandSummary: ReturnType<typeof buildAgeBandSummary>;
}) {
  const { seed, maxAge, generatedAt, metricsText, ageBandSummary } = params;
  const tableRows = ageBandSummary
    .map(
      band =>
        `| ${band.label} | ${band.min}-${band.max} | ${band.agesCovered} | ${band.totalEvents} | ${band.avgEventsPerAge.toFixed(2)} | ${band.emptyAges} |`
    )
    .join('\n');

  return [
    '# US-004 Rhythm Baseline Report',
    '',
    '## Baseline Inputs',
    '',
    `- seed: \`${seed}\``,
    `- maxAge: \`${maxAge}\` (complete life sample)`,
    `- generatedAt: \`${generatedAt}\``,
    '',
    '## Local Regeneration Command',
    '',
    '```bash',
    `RHYTHM_BASELINE_SEED=${seed} RHYTHM_BASELINE_MAX_AGE=${maxAge} npm run report:rhythm-baseline`,
    '```',
    '',
    '## P1 Rhythm Metrics (Baseline Snapshot)',
    '',
    '```text',
    metricsText,
    '```',
    '',
    '## Representative Age Bands',
    '',
    '| band | age_range | ages | total_events | avg_events_per_age | empty_ages |',
    '|---|---:|---:|---:|---:|---:|',
    tableRows,
    '',
    '## Baseline Notes',
    '',
    '- This baseline is deterministic under fixed seed and max age.',
    '- Use the same command and inputs for before/after rhythm comparison in follow-up stories.',
    '- P1 metric definitions come from `npm run report:rhythm-metrics` output.',
  ].join('\n');
}

async function main() {
  const sample = await simulateSample(DEFAULT_SEED, DEFAULT_MAX_AGE);
  const metrics = computeMetrics(sample);
  const metricsText = formatMetrics(sample, metrics);
  const ageBandSummary = buildAgeBandSummary(metrics.eventCountPerAge);
  const report = buildMarkdownReport({
    seed: DEFAULT_SEED,
    maxAge: DEFAULT_MAX_AGE,
    generatedAt: new Date().toISOString(),
    metricsText,
    ageBandSummary,
  });

  await mkdir('docs/test-reports', { recursive: true });
  await writeFile(OUTPUT_PATH, report, 'utf-8');

  console.log('[US-004] baseline report generated');
  console.log(`output=${OUTPUT_PATH}`);
  console.log(`sample=${sample.sampleId}`);
  console.log(`emptyAges=${metrics.emptyAges.length}`);
  console.log(`formal=${toPct(metrics.formalEventRatio)} daily=${toPct(metrics.dailyEventRatio)} choice=${toPct(metrics.choiceEventRatio)}`);
}

main().catch(error => {
  console.error('[US-004] baseline generation failed:', error);
  process.exitCode = 1;
});
