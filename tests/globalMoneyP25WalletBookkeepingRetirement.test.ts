import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runP34MedicalLifetimeBirthToDeathSlice } from '../src/p25/p34LifetimeBirthToDeathSlice';
import {
  runP35MixedHealerSwordsmanLifetimeSlice,
  runP35PinnacleMythLegendLifetimeSlice,
} from '../src/p25/p35MixedPinnacleLifetimeSlices';
import {
  runP37MixedMerchantPatronLifetimeSlice,
  runP37PinnacleFoundingPatriarchLifetimeSlice,
} from '../src/p25/p37AdditionalMixedPinnacleLifetimeSlices';
import { runP36ExtendedConsequenceConsistencySlice } from '../src/p25/p36ConsequenceConsistencySlice';
import { runP25HabitTrajectorySlice } from '../src/p25/habitTrajectorySlice';
import { createSimulationPlayerState } from '../src/p25/simulationPlayerState';

const P25_ROOT = path.join('src', 'p25');
const COMPAT_FACTORY = 'src/p25/simulationPlayerState.ts';

function listTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTsFiles(full));
    } else if (entry.name.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

function relativeSrc(filePath: string): string {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
}

function testCompiledP25OmitLegacyBalanceFixtures(): void {
  const offenders: string[] = [];
  for (const file of listTsFiles(P25_ROOT)) {
    const rel = relativeSrc(file);
    if (rel === COMPAT_FACTORY) continue;
    const source = fs.readFileSync(file, 'utf8');
    if (/\bmoney\s*:/.test(source)) offenders.push(`${rel}: money fixture field`);
    if (/\.money\s*=/.test(source)) offenders.push(`${rel}: money mutation`);
    if (/\bmoney\s*[+\-]=/.test(source)) offenders.push(`${rel}: wallet bookkeeping`);
    if (/\bwealth\s*:\s*\d/.test(source)) offenders.push(`${rel}: numeric wealth fixture`);
    if (/player\.wealth\b/.test(source)) offenders.push(`${rel}: player.wealth access`);
  }
  assert.equal(
    offenders.length,
    0,
    `P25 compiled slices must not fixture or mutate legacy balances:\n${offenders.join('\n')}`,
  );
}

function testSimulationFactoryUsesCompatZeroOnly(): void {
  const source = fs.readFileSync(COMPAT_FACTORY, 'utf8');
  assert(!/\bmoney\s*:\s*number\b/.test(source), 'factory options must not accept money input');
  assert.match(source, /\bmoney:\s*0\b/, 'factory keeps internal compat zero only');
}

function testLifetimeSimulationsStillUnlock(): void {
  assert(runP34MedicalLifetimeBirthToDeathSlice().terminalCheckpoint.unlocked, 'P34 medical lifetime');
  assert(runP35MixedHealerSwordsmanLifetimeSlice().terminalCheckpoint.unlocked, 'P35 mixed lifetime');
  assert(runP35PinnacleMythLegendLifetimeSlice().terminalCheckpoint.unlocked, 'P35 pinnacle lifetime');
  assert(runP37MixedMerchantPatronLifetimeSlice().terminalCheckpoint.unlocked, 'P37 mixed lifetime');
  assert(runP37PinnacleFoundingPatriarchLifetimeSlice().terminalCheckpoint.unlocked, 'P37 pinnacle lifetime');
}

function testConsistencyAndHabitSlicesRemainGreen(): void {
  const p36 = runP36ExtendedConsequenceConsistencySlice();
  assert(p36.passed, 'P36 extended consistency stays green');
  const habit = runP25HabitTrajectorySlice();
  assert(habit.passed, 'P25 habit trajectory slice stays green');
}

function testCreateSimulationPlayerStateOmitsMoneyInput(): void {
  const player = createSimulationPlayerState({
    name: 'wallet-retire',
    age: 30,
    origin: 'martial_family',
    martialPower: 50,
    reputation: 40,
    connections: 20,
    alive: true,
  });
  assert.equal(player.money, 0, 'simulation factory seeds compat zero only');
}

testCompiledP25OmitLegacyBalanceFixtures();
testSimulationFactoryUsesCompatZeroOnly();
testLifetimeSimulationsStillUnlock();
testConsistencyAndHabitSlicesRemainGreen();
testCreateSimulationPlayerStateOmitsMoneyInput();
console.log('globalMoneyP25WalletBookkeepingRetirement.test.ts: all passed');
