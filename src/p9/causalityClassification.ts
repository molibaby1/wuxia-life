import type { GameProcessRecord } from '../types/simulationRecordTypes';
import type {
  CausalityPersonaClassification,
  CausalityRootCauseClass,
  P9CausalityRootCauseReport,
  PersonaSimulationBundle,
} from './types';

function findImplicitSignals(records: GameProcessRecord[]): string[] {
  const signals: string[] = [];
  const earlyActions = records.filter(r => r.progressionKind === 'active_action' && r.age <= 10);
  const lateRecords = records.filter(r => r.age >= 20);

  for (const early of earlyActions) {
    const actionId = early.activeActionId ?? '';
    const category = actionId.replace('action_', '').replace('_basic', '');
    for (const late of lateRecords) {
      const text = `${late.eventTitle} ${late.outcomeText ?? ''} ${late.eventText ?? ''}`;
      if (/武功|学识|人脉|营商|游历|练功|读书|交游/.test(text) && !text.includes(actionId)) {
        if (category === 'training' && /武功|练功|武学/.test(text)) {
          signals.push(`age ${late.age}: martial progression without token ref to ${actionId}`);
        }
        if (category === 'business' && /营商|生意|银两|商/.test(text)) {
          signals.push(`age ${late.age}: business progression without token ref to ${actionId}`);
        }
        if (category === 'travel' && /游历|行走|江湖/.test(text)) {
          signals.push(`age ${late.age}: travel progression without token ref to ${actionId}`);
        }
      }
    }
  }

  for (const r of lateRecords) {
    const flags = r.gameState?.flags ?? {};
    for (const [key, val] of Object.entries(flags)) {
      if (typeof val === 'string' && val.includes('from_choice')) {
        signals.push(`age ${r.age}: flag ${key}=${val} (implicit choice echo, not token-matched)`);
      }
    }
  }

  return [...new Set(signals)].slice(0, 5);
}

function classifyPersona(
  bundle: PersonaSimulationBundle,
  implicitSignals: string[],
): CausalityRootCauseClass {
  const hasExplicitLaterText = bundle.records.some(r => {
    if (r.age < 15) return false;
    const text = `${r.outcomeText ?? ''} ${r.eventText ?? ''}`;
    return /因.*幼|早年|当初|那时/.test(text);
  });

  if (implicitSignals.length >= 2 && !hasExplicitLaterText) {
    return 'implicit-only-echo';
  }
  if (implicitSignals.length === 0) {
    return 'missing-content-echo';
  }
  if (hasExplicitLaterText) {
    return 'detector-too-strict';
  }
  return 'implicit-only-echo';
}

export function buildCausalityRootCauseReport(
  bundles: PersonaSimulationBundle[],
): P9CausalityRootCauseReport {
  const personas: CausalityPersonaClassification[] = [];

  for (const bundle of bundles) {
    if (bundle.metrics.causality.directEchoCount > 0) continue;
    const implicitSignals = findImplicitSignals(bundle.records);
    const classification = classifyPersona(bundle, implicitSignals);
    const evidenceExample =
      implicitSignals[0] ??
      bundle.metrics.causality.strongestExamples[0]?.description ??
      'No direct or implicit echo detected in simulation output';

    personas.push({
      personaId: bundle.personaId,
      personaName: bundle.metrics.personaName,
      directEchoCount: bundle.metrics.causality.directEchoCount,
      classification,
      evidenceExample,
      implicitSignals,
    });
  }

  return {
    schemaVersion: 'p9-causality-v1',
    generatedAt: new Date().toISOString(),
    personas,
  };
}

export function renderCausalityRootCauseMarkdown(report: P9CausalityRootCauseReport): string {
  const lines = [
    '# P9 Causality Root Cause Classification',
    '',
    `Generated: ${report.generatedAt}`,
    `Personas with zero direct echoes: ${report.personas.length}`,
    '',
  ];
  for (const p of report.personas) {
    lines.push(`## ${p.personaName} (\`${p.personaId}\`)`);
    lines.push('');
    lines.push(`- Classification: **${p.classification}**`);
    lines.push(`- Direct echoes: ${p.directEchoCount}`);
    lines.push(`- Evidence: ${p.evidenceExample}`);
    if (p.implicitSignals.length > 0) {
      lines.push('- Implicit signals:');
      for (const s of p.implicitSignals) {
        lines.push(`  - ${s}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}
