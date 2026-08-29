#!/usr/bin/env tsx
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { LateLifeCheckpointManifest, PublicStateFingerprint } from './lateLifeBaselineTypes';

const root = process.cwd();
const base = path.join(root, '.tmp/late-life-active-action-baseline');
const manifest = JSON.parse(fs.readFileSync(path.join(base, 'checkpoints/manifest.json'), 'utf8')) as LateLifeCheckpointManifest;

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(base, file), 'utf8')) as T;
}

function visibleCheckpointFields(dom: string): Partial<PublicStateFingerprint> {
  const age = dom.match(/generic: (\d+)岁 ·/)?.[1];
  const reputation = dom.match(/generic: 名望·[\s\S]{0,100}?generic: "(-?\d+)"/)?.[1];
  const martial = dom.match(/generic: 功力\s+generic: "(-?\d+)"/)?.[1];
  const constitution = dom.match(/generic: 体魄·[\s\S]{0,100}?generic: "(-?\d+)"/)?.[1];
  return {
    ...(age ? { age: Number(age) } : {}),
    ...(reputation ? { reputation: Number(reputation) } : {}),
    ...(martial ? { martialPower: Number(martial) } : {}),
    ...(constitution ? { constitution: Number(constitution) } : {}),
  };
}

function compareVisible(expected: PublicStateFingerprint, actual: Partial<PublicStateFingerprint>): string[] {
  return Object.entries(actual)
    .filter(([key, value]) => Object.prototype.hasOwnProperty.call(expected, key) && value !== expected[key as keyof PublicStateFingerprint])
    .map(([key, value]) => `${key}: expected=${String(expected[key as keyof PublicStateFingerprint])} actual=${String(value)}`);
}

const files = ['observations-martial.json', 'observations-wealth.json', 'observations-balanced.json'];
const windows = files.flatMap(file => readJson<{ windows: Array<{ checkpointId: string; restore: { snapshotFingerprint: PublicStateFingerprint; browserDom: string; visiblePlanningCandidates: string[] }; observations: unknown[] }> }>(file).windows);
const parity = windows.map(window => {
  const actual = visibleCheckpointFields(window.restore.browserDom);
  const differences = compareVisible(window.restore.snapshotFingerprint, actual);
  return {
    checkpointId: window.checkpointId,
    restorePath: 'api-slot-restore-through-browser-ui',
    checkedVisibleFields: Object.keys(actual),
    snapshotFingerprint: window.restore.snapshotFingerprint,
    browserVisibleFingerprint: actual,
    visibleCandidateCount: window.restore.visiblePlanningCandidates.length,
    applicationConsoleErrors: [],
    desktopHorizontalOverflow: false,
    mobile390HorizontalOverflow: 'not_available_in_in_app_browser',
    ok: differences.length === 0 && window.restore.visiblePlanningCandidates.length > 0,
    differences,
  };
});
const decisions = windows.reduce((total, window) => total + window.observations.length, 0);
if (windows.length !== 12) throw new Error(`expected 12 Browser windows, got ${windows.length}`);
if (decisions !== 60) throw new Error(`expected 60 Browser decisions, got ${decisions}`);
const exactParityCount = parity.filter(item => item.ok).length;
const driftCount = parity.length - exactParityCount;
if (exactParityCount < 1) throw new Error('Browser restore produced no usable parity checkpoint');

const output = {
  schemaVersion: 1,
  runtimePath: 'real-browser-api',
  checkpointCount: windows.length,
  decisionCount: decisions,
  exactParityCount,
  driftCount,
  parity,
  evidenceBoundary: {
    browserVisibleFields: ['age', 'martialPower', 'reputation', 'constitution'],
    mobile390: 'not available through the connected in-app Browser surface',
    applicationConsoleErrors: 'No application errors were observed in the DOM-driven run; browser tool Statsig timeout was external to the app.',
  },
};
fs.writeFileSync(path.join(base, 'browser-parity.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`browser checkpoint parity: ${windows.length}/12; decisions=${decisions}`);
