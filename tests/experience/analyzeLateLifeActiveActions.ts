#!/usr/bin/env tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

export function jaccard<T>(left: T[], right: T[]): number {
  const a = new Set(left); const b = new Set(right);
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 1;
  return [...a].filter(value => b.has(value)).length / union.size;
}

export function normalizeTemplate(value: string): string {
  return value.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
}

export function extractResult(value: string): string {
  const start = value.indexOf('heading "本期小结"');
  const end = value.indexOf('button "继续"', start);
  return value.slice(start >= 0 ? start : 0, end >= 0 ? end : undefined);
}

const base = path.join(process.cwd(), '.tmp/late-life-active-action-baseline');
const observations = JSON.parse(fs.readFileSync(path.join(base, 'observations.json'), 'utf8')) as { observations: Array<any> };
const parity = JSON.parse(fs.readFileSync(path.join(base, 'browser-parity.json'), 'utf8')) as { exactParityCount: number; driftCount: number; parity: Array<any> };
const oracle = JSON.parse(fs.readFileSync(path.join(base, 'oracle-comparison.json'), 'utf8')) as { results: Array<any>; divergenceCount: number; divergenceRate: number };
const manifest = JSON.parse(fs.readFileSync(path.join(base, 'checkpoints/manifest.json'), 'utf8')) as { checkpoints: Array<any> };

const windowIds = [...new Set(observations.observations.map(item => item.checkpointId))];
const actionSetByWindow = Object.fromEntries(windowIds.map(id => [id, [...new Set(observations.observations.filter(item => item.checkpointId === id).map(item => item.selectedActionId))]]));
const actionSetSimilarity = windowIds.slice(1).map((id, index) => ({ from: windowIds[index], to: id, jaccard: jaccard(actionSetByWindow[windowIds[index]], actionSetByWindow[id]), completeSetSame: JSON.stringify([...actionSetByWindow[windowIds[index]]].sort()) === JSON.stringify([...actionSetByWindow[id]].sort()) }));
const resultKeys = observations.observations.map(item => extractResult(item.result.actionSummary));
const templateKeys = resultKeys.map(normalizeTemplate);
const countBy = (values: string[]) => values.reduce<Record<string, number>>((result, value) => { result[value] = (result[value] ?? 0) + 1; return result; }, {});
const repetition = {
  exactRepeatObservations: resultKeys.length - Object.keys(countBy(resultKeys)).length,
  templateRepeatObservations: templateKeys.length - Object.keys(countBy(templateKeys)).length,
  semanticReviewQueue: [],
};
const readability = countBy(observations.observations.map(item => item.presentation.readable));
const echo = countBy(observations.observations.map(item => item.presentation.longTermEcho));
const selectedActions = countBy(observations.observations.map(item => item.selectedActionId));
const oracleReasons = countBy(oracle.results.filter(item => !item.same).map(item => item.reason));
const perPersona = Object.fromEntries(['martial', 'wealth', 'balanced'].map(key => {
  const values = observations.observations.filter(item => item.personaKey === key);
  return [key, { decisions: values.length, selectedActions: countBy(values.map(item => item.selectedActionId)), readable: countBy(values.map(item => item.presentation.readable)), echo: countBy(values.map(item => item.presentation.longTermEcho)) }];
}));

const output = {
  schemaVersion: 1,
  decisionCount: observations.observations.length,
  checkpointCount: manifest.checkpoints.length,
  actionSetByWindow,
  actionSetSimilarity,
  repetition,
  readability,
  echo,
  selectedActions,
  perPersona,
  browserOracle: { divergenceCount: oracle.divergenceCount, divergenceRate: oracle.divergenceRate, reasonCounts: oracleReasons },
  parity: { exact: parity.exactParityCount, drift: parity.driftCount, driftCheckpoints: parity.parity.filter(item => !item.ok).map(item => ({ checkpointId: item.checkpointId, differences: item.differences })) },
  evidenceNotes: [
    'semantic repeat is an explicit manual-review queue and is not auto-classified',
    'long-term echo labels use the visible action-summary long-term-impact section plus state/event evidence recorded after the choice',
    'the Browser driver used public candidate text and public cost/risk only before each choice',
  ],
};
fs.writeFileSync(path.join(base, 'analysis.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`late-life analysis: decisions=${output.decisionCount}, exactRepeats=${repetition.exactRepeatObservations}, templateRepeats=${repetition.templateRepeatObservations}, oracleDivergence=${oracle.divergenceRate}`);

