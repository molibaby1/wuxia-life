import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import type { LifeMemorySummary } from '../src/types/lifeMemory';

const repoRoot = resolve(fileURLToPath(import.meta.url), '../..');
const read = (relativePath: string): string => readFileSync(resolve(repoRoot, relativePath), 'utf8');

console.log('=== Player Role Presentation Tests ===');

const mainSummarySource = read('src/components/MainScreenLifeSummary.vue');
assert(mainSummarySource.includes('所属'), 'main screen must label affiliation as 所属');
assert(!mainSummarySource.includes('暂无身份'), 'main screen must not use generic identity empty copy');

const mainModel = buildMainScreenModel(
  {
    name: '沈孤舟',
    age: 30,
    martialPower: 42,
    chivalry: 13,
    constitution: 18,
    reputation: 10,
    connections: 4,
    knowledge: 20,
    businessAcumen: 10,
    influence: 0,
    charisma: 10,
    affiliation: 'wudang',
    title: null,
    alive: true,
    currentYear: 30,
    currentMonth: 1,
    currentDay: 1,
    lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 0 },
  } as any,
  {
    schemaVersion: '3.0.0',
    derivedAtAge: 30,
  } as LifeMemorySummary,
);
assert.equal((mainModel as any).affiliationSummary, '武当派');
assert.equal((mainModel as any).titleSummary, '暂无正式称号');

const attributeSource = read('src/components/AttributePanel.vue');
assert(!attributeSource.includes('playerIdentities'), 'AttributePanel must remove identity heuristic list');
assert(!attributeSource.includes('identityNameMap'), 'AttributePanel must remove identity name map');
assert(attributeSource.includes('affiliation'), 'AttributePanel must render canonical affiliation');

const endingSource = read('src/components/EndingScreen.vue');
assert(!endingSource.includes('身份摘要'), 'EndingScreen must remove generic identity summary');
assert(!endingSource.includes('lifeMemory?.identity'), 'EndingScreen must not consume Life Memory identity projection');
assert(endingSource.includes('player?.title'), 'EndingScreen must render explicit title separately');
assert(endingSource.includes('player?.affiliation'), 'EndingScreen must render affiliation separately');

const appSource = read('src/App.vue');
assert(!appSource.includes('title: terminal.ending?.name'), 'API App must not synthesize player title from ending name');

const mapperSource = read('server/src/services/sessionProgressionMapper.ts');
assert(mapperSource.includes('affiliation: player?.affiliation'), 'API mapper must expose runtime affiliation');
assert(mapperSource.includes('title: player?.title'), 'API mapper must expose runtime title');
assert(!mapperSource.includes('sect: player?.sect'), 'API mapper must remove sect projection');

console.log('✓ Local/API/Browser presentation keeps affiliation, title, experience, direction, and ending separate');
