#!/usr/bin/env tsx
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getP8PersonaById } from '../../src/p8/personas';
import { createPersonaHeadlessSession, applyPersonaYouthRouteSeedsAtAge } from '../../src/headless/playability/createPersonaSession';
import { ensureProgressionCatchUp, progressUntilChoiceOrTerminal } from '../../src/headless/progressionLoop';
import {
  runActionSummaryAckStep,
  runDisturbanceAckStep,
  runPassiveProgressionStep,
  runPeriodSummaryStep,
  runStoryEventStep,
  runActivePlanningStep,
  type RunnerStepContext,
} from '../../src/headless/playability/runnerSteps';
import { defaultSnapshotConverter } from '../../src/headless/snapshot/SnapshotConverter';
import { validateGameStateSnapshot } from '../../src/contracts/validation/contractValidation';
import { createDefaultTimeSource } from '../../src/headless/adapters/timeSource';
import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot';
import type { GameState } from '../../src/types/eventTypes';
import type { LateLifeCheckpointManifest, CheckpointManifestEntry, LateLifePersonaKey, LateLifeTargetAge, PublicStateFingerprint } from './lateLifeBaselineTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

export const CHECKPOINT_OUTPUT_DIR = path.join(process.cwd(), '.tmp/late-life-active-action-baseline/checkpoints');
export const TARGETS: Array<{ key: LateLifePersonaKey; personaId: string; seed: number }> = [
  { key: 'martial', personaId: 'p8-martial-lin', seed: 801 },
  { key: 'wealth', personaId: 'p8-wealth-shen', seed: 804 },
  { key: 'balanced', personaId: 'p8-balanced-wei', seed: 810 },
];
export const TARGET_AGES: LateLifeTargetAge[] = [30, 45, 60, 75];

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

export function publicFingerprint(state: GameState): PublicStateFingerprint {
  const ending = state.ending;
  const endingId = typeof ending === 'object' && ending !== null && 'id' in ending && typeof ending.id === 'string'
    ? ending.id
    : null;
  return {
    age: state.player.age,
    money: state.player.money,
    martialPower: state.player.martialPower,
    constitution: state.player.constitution,
    knowledge: state.player.knowledge,
    businessAcumen: state.player.businessAcumen,
    connections: state.player.connections,
    reputation: state.player.reputation,
    healthStatus: state.player.healthStatus,
    affiliation: state.player.affiliation,
    title: state.player.title,
    alive: state.player.alive,
    endingId,
  };
}

function stableSnapshotForHash(snapshot: GameStateSnapshot): unknown {
  const normalized = clone(snapshot) as GameStateSnapshot;
  normalized.metadata.createdAt = 0;
  normalized.metadata.updatedAt = 0;
  delete normalized.metadata.snapshotId;
  delete normalized.metadata.contentHash;
  delete normalized.state.lastSavedAt;
  delete normalized.state.gameTimestamp;
  return normalized;
}

export function snapshotHash(snapshot: GameStateSnapshot): string {
  return createHash('sha256').update(JSON.stringify(stableSnapshotForHash(snapshot))).digest('hex');
}

function writeSnapshotFiles(entryId: string, snapshot: GameStateSnapshot): { snapshotPath: string; browserExportPath: string } {
  fs.mkdirSync(CHECKPOINT_OUTPUT_DIR, { recursive: true });
  const snapshotPath = path.join(CHECKPOINT_OUTPUT_DIR, `${entryId}.snapshot.json`);
  const browserExportPath = path.join(CHECKPOINT_OUTPUT_DIR, `${entryId}.browser-export.json`);
  fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  const save = {
    id: `baseline-${entryId}`,
    name: `Late-life baseline ${entryId}`,
    timestamp: 0,
    snapshot,
    metadata: {
      playerAge: snapshot.state.player.age,
      playerName: snapshot.state.player.name,
      eventCount: snapshot.state.eventHistory.length,
      playTime: snapshot.state.eventHistory.length * 30,
    },
  };
  fs.writeFileSync(browserExportPath, `${JSON.stringify({ version: '3.14.0', exportTime: 0, save }, null, 2)}\n`, 'utf8');
  return { snapshotPath, browserExportPath };
}

async function advanceToTarget(session: ReturnType<typeof createPersonaHeadlessSession>, persona: NonNullable<ReturnType<typeof getP8PersonaById>>, targetAge: number): Promise<void> {
  const records: RunnerStepContext['records'] = [];
  const ctx: RunnerStepContext = {
    session,
    persona,
    records,
    choiceDiagnostics: [],
    activeActionSelectionReasons: [],
  };
  await progressUntilChoiceOrTerminal(session);
  let anchor = session.getRuntimeState().player.age;
  let withoutAge = 0;
  for (let step = 0; step < 7000; step += 1) {
    if (session.getTerminalState() || session.getRuntimeState().player.age >= targetAge && session.getSessionPhase() === 'active_planning') return;
    applyPersonaYouthRouteSeedsAtAge(session, persona);
    let phase = session.getSessionPhase();
    if (phase !== 'story_event' && phase !== 'terminal' && session.hasPendingForcedEvent()) {
      await session.getNextEvent();
      phase = session.getSessionPhase();
    }
    switch (phase) {
      case 'story_event': await runStoryEventStep(ctx); break;
      case 'active_planning': await runActivePlanningStep(ctx); break;
      case 'action_summary': await runActionSummaryAckStep(ctx); break;
      case 'disturbance_narrative': await runDisturbanceAckStep(ctx); break;
      case 'passive_progression': await runPassiveProgressionStep(ctx); break;
      case 'period_summary': await runPeriodSummaryStep(ctx); break;
      case 'terminal': return;
      default: await progressUntilChoiceOrTerminal(session);
    }
    const age = session.getRuntimeState().player.age;
    if (age <= anchor) {
      withoutAge += 1;
      if (withoutAge >= 16) {
        await ensureProgressionCatchUp(session, anchor);
        if (session.getSessionPhase() === 'story_event') await runStoryEventStep(ctx);
        anchor = session.getRuntimeState().player.age;
        withoutAge = 0;
      }
    } else {
      anchor = age;
      withoutAge = 0;
    }
  }
  throw new Error(`checkpoint runner exceeded limit for ${persona.id} at ${targetAge}`);
}

async function generateOne(key: LateLifePersonaKey, personaId: string, seed: number, targetAge: LateLifeTargetAge): Promise<CheckpointManifestEntry | null> {
  const base = getP8PersonaById(personaId);
  if (!base) throw new Error(`unknown persona ${personaId}`);
  const persona = { ...base, seed };
  const session = createPersonaHeadlessSession(persona, '1.0.0');
  await advanceToTarget(session, persona, targetAge);
  const state = session.getRuntimeState();
  if (session.getTerminalState() || state.player.age < targetAge || session.getSessionPhase() !== 'active_planning') return null;
  const snapshot = defaultSnapshotConverter.toSnapshot(state, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: createDefaultTimeSource(),
  });
  const validation = validateGameStateSnapshot(snapshot);
  if (!validation.ok) throw new Error(`${key}/${seed}/${targetAge} snapshot invalid: ${validation.errors.join('; ')}`);
  const id = `${key}-${seed}-age-${targetAge}`;
  const paths = writeSnapshotFiles(id, snapshot);
  return {
    id,
    personaKey: key,
    personaId,
    seed,
    targetAge,
    actualAge: state.player.age,
    phase: 'active_planning',
    snapshotPath: path.relative(process.cwd(), paths.snapshotPath).split(path.sep).join('/'),
    browserExportPath: path.relative(process.cwd(), paths.browserExportPath).split(path.sep).join('/'),
    snapshotHash: snapshotHash(snapshot),
    publicFingerprint: publicFingerprint(state),
    planningOptions: clone(session.getPlanningOptions()),
  };
}

export async function generateLateLifeCheckpoints(): Promise<LateLifeCheckpointManifest> {
  fs.rmSync(CHECKPOINT_OUTPUT_DIR, { recursive: true, force: true });
  const checkpoints: CheckpointManifestEntry[] = [];
  const terminalBeforeTarget: LateLifeCheckpointManifest['terminalBeforeTarget'] = [];
  for (const target of TARGETS) {
    for (const targetAge of TARGET_AGES) {
      const entry = await generateOne(target.key, target.personaId, target.seed, targetAge);
      if (entry) {
        checkpoints.push(entry);
      } else {
        terminalBeforeTarget.push({ personaKey: target.key, seed: target.seed, targetAge, age: 0, endingId: null });
      }
    }
  }
  const manifest: LateLifeCheckpointManifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    catalogVersion: '1.0.0',
    checkpoints,
    terminalBeforeTarget,
  };
  fs.writeFileSync(path.join(CHECKPOINT_OUTPUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateLateLifeCheckpoints().then(manifest => {
    console.log(`late-life checkpoints: ${manifest.checkpoints.length}/${TARGETS.length * TARGET_AGES.length}`);
    console.log(path.relative(process.cwd(), path.join(CHECKPOINT_OUTPUT_DIR, 'manifest.json')));
  }).catch(error => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
  });
}
