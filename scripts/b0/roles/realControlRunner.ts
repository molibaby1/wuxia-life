import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runHeadlessPersona } from '../../../src/headless/playability/headlessPersonaRunner';
import { getP8PersonaById } from '../../../src/p8/personas';
import { auditRawTrace } from './mechanicalAuditor';
import { projectPlayerVisibleTrace } from '../trace/projectPlayerVisibleTrace';
import { sha256Hex, stableStringify } from '../hash';
import type { B0RawTrace, MechanicalAuditResult } from '../types';

export const REAL_CONTROL_CASES = [
  { personaId: 'p8-balanced-wei', seed: 808, endAge: 16 },
  { personaId: 'p8-martial-lin', seed: 801, endAge: 16 },
] as const;

export type RealControlCaseResult = {
  personaId: string;
  seed: number;
  endAge: number;
  finalAge: number;
  recordCount: number;
  traceStepCount: number;
  stoppedReason: string;
  projectionOk: boolean;
  leakedKeys: string[];
  audit: MechanicalAuditResult;
  rawHash: string;
  visibleHash: string | null;
};

export type RealControlCheckResult = {
  runId: string;
  outDir: string;
  cases: RealControlCaseResult[];
  passed: boolean;
  failures: string[];
};

function toRawTrace(
  sampleId: string,
  personaId: string,
  seed: number,
  records: unknown[],
  experienceTrace: unknown,
): B0RawTrace {
  return {
    schemaVersion: 'b0-raw-trace-v1',
    sampleId,
    arm: 'candidate',
    seed,
    personaId,
    records: records as Array<Record<string, unknown>>,
    experienceTrace: experienceTrace as Record<string, unknown>,
    hiddenEffects: [],
  };
}

export async function runRealControlCheck(options?: {
  outRoot?: string;
  runId?: string;
}): Promise<RealControlCheckResult> {
  const runId = options?.runId ?? `b0-real-control-${Date.now()}`;
  const outDir = join(options?.outRoot ?? '.tmp/b0', runId);
  mkdirSync(join(outDir, 'raw-traces'), { recursive: true });
  mkdirSync(join(outDir, 'player-visible-traces'), { recursive: true });

  const cases: RealControlCaseResult[] = [];
  const failures: string[] = [];

  for (const spec of REAL_CONTROL_CASES) {
    const persona = getP8PersonaById(spec.personaId);
    if (!persona) {
      failures.push(`missing persona ${spec.personaId}`);
      continue;
    }

    const result = await runHeadlessPersona({
      persona,
      seed: spec.seed,
      endAge: spec.endAge,
      catalogVersion: '1.0.0',
      maxSteps: 800,
      experienceTrace: true,
    });

    if (!result.experienceTrace) {
      failures.push(`${spec.personaId}: missing experienceTrace`);
      continue;
    }

    const sampleId = `real_control_${spec.personaId}`;
    const raw = toRawTrace(
      sampleId,
      spec.personaId,
      result.randomSeed,
      result.records,
      result.experienceTrace,
    );
    const rawJson = stableStringify(raw);
    writeFileSync(join(outDir, 'raw-traces', `${sampleId}.json`), `${rawJson}\n`);

    const projected = projectPlayerVisibleTrace(raw);
    let visibleHash: string | null = null;
    const leakedKeys = projected.ok ? [] : projected.leakedKeys;
    if (!projected.ok) {
      failures.push(`${spec.personaId}: visible projection leaked ${projected.leakedKeys.join(',')}`);
    } else {
      const visJson = stableStringify(projected.visible);
      writeFileSync(join(outDir, 'player-visible-traces', `${sampleId}.json`), `${visJson}\n`);
      visibleHash = sha256Hex(visJson);
    }

    const audit = auditRawTrace(raw, 'real-control');
    if (audit.hardKill) {
      failures.push(
        `${spec.personaId}: control hard-killed (${audit.detections.map(d => d.code).join(',')})`,
      );
    }

    cases.push({
      personaId: spec.personaId,
      seed: spec.seed,
      endAge: spec.endAge,
      finalAge: result.finalAge,
      recordCount: result.records.length,
      traceStepCount: result.experienceTrace.steps.length,
      stoppedReason: result.stoppedReason,
      projectionOk: projected.ok,
      leakedKeys,
      audit,
      rawHash: sha256Hex(rawJson),
      visibleHash,
    });
  }

  const summary = {
    runId,
    passed: failures.length === 0,
    failures,
    cases,
  };
  writeFileSync(join(outDir, 'real-control-summary.json'), `${stableStringify(summary)}\n`);

  return {
    runId,
    outDir,
    cases,
    passed: failures.length === 0,
    failures,
  };
}
