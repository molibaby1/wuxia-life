#!/usr/bin/env tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

const base = path.join(process.cwd(), '.tmp/late-life-active-action-baseline');
const files = ['observations-martial.json', 'observations-wealth.json', 'observations-balanced.json'];
const windows = files.flatMap(file => (JSON.parse(fs.readFileSync(path.join(base, file), 'utf8')) as { windows: unknown[] }).windows);
const observations = windows.flatMap(window => (window as { observations: unknown[] }).observations);
const cleaned = JSON.parse(JSON.stringify(observations)) as Array<Record<string, unknown>>;
for (const observation of cleaned) delete observation._repeatKey;
const output = { schemaVersion: 1, runtimePath: 'real-browser-api', windowCount: windows.length, decisionCount: cleaned.length, observations: cleaned };
fs.writeFileSync(path.join(base, 'observations.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`merged Browser observations: windows=${windows.length} decisions=${cleaned.length}`);

