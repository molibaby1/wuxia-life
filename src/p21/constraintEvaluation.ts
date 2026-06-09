import { EventLoader } from '../core/EventLoader';
import type { EventDefinition } from '../types/eventTypes';
import type {
  ContentConstraintFinding,
  ContentConstraintReport,
  ContentDuplicateConstraint,
  ContentStyleConstraint,
  WorldProfile,
} from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';

const P21_SAMPLE_PREFIX = 'p21_';

/** Risk classes that pass each duplicate constraint when they match the constraint riskClass. */
const ACCEPTABLE_RECURRENCE_BY_CONSTRAINT: Record<string, readonly string[]> = {
  p21_exact_repeat_guard: ['setback', 'echo_callback'],
  p21_route_homogenization_guard: ['route_reinforcement'],
  p21_slop_cluster_guard: ['archetype_family_motif'],
};

function isDuplicateRiskAcceptable(constraintId: string, riskClass: string): boolean {
  const allowed = ACCEPTABLE_RECURRENCE_BY_CONSTRAINT[constraintId] ?? [];
  return allowed.includes(riskClass);
}

function hasWuxiaTone(text: string, markers: string[]): boolean {
  return markers.some(marker => text.includes(marker));
}

function scoreRouteFit(event: EventDefinition): number {
  const semantics = event.metadata?.authoringSemantics;
  const affinity = event.metadata?.pathAffinity ?? {};
  if (!semantics?.routeFit?.length) {
    return Object.keys(affinity).length > 0 ? 0.5 : 0.3;
  }
  const matches = semantics.routeFit.filter(route => affinity[route] !== undefined && affinity[route]! > 0);
  return matches.length / semantics.routeFit.length;
}

function scoreStageFit(event: EventDefinition): number {
  const semantics = event.metadata?.authoringSemantics;
  const signals = event.metadata?.narrativeScheduling?.stageSignals ?? [];
  if (!semantics?.stageFit?.length) return signals.length > 0 ? 0.55 : 0.35;
  const matches = semantics.stageFit.filter(sig => signals.includes(sig));
  return matches.length / semantics.stageFit.length;
}

function scoreTone(event: EventDefinition, constraint: ContentStyleConstraint): number {
  const text = `${event.content.title ?? ''}${event.content.text}`;
  const markers = event.metadata?.authoringSemantics?.toneMarkers ?? constraint.toneMarkers ?? [];
  if (!markers.length) return 0.4;
  return hasWuxiaTone(text, markers) ? 1 : 0.2;
}

function evaluateEventAgainstConstraints(
  event: EventDefinition,
  styleConstraints: ContentStyleConstraint[],
  duplicateConstraints: ContentDuplicateConstraint[],
): ContentConstraintFinding[] {
  const findings: ContentConstraintFinding[] = [];

  for (const constraint of styleConstraints) {
    let score = 0;
    if (constraint.dimension === 'route_fit') score = scoreRouteFit(event);
    else if (constraint.dimension === 'stage_fit') score = scoreStageFit(event);
    else if (constraint.dimension === 'tone_consistency') score = scoreTone(event, constraint);
    else score = event.metadata?.authoringSemantics ? 0.7 : 0.4;

    findings.push({
      constraintId: constraint.id,
      dimension: constraint.dimension,
      eventId: event.id,
      score,
      passed: score >= constraint.minimumScore,
      detail: `${constraint.label}: score ${score.toFixed(2)} (min ${constraint.minimumScore})`,
    });
  }

  const riskClass = event.metadata?.authoringSemantics?.duplicateRiskClass ?? 'general';
  for (const constraint of duplicateConstraints) {
    const applies = riskClass === constraint.riskClass;
    const passed = !applies || isDuplicateRiskAcceptable(constraint.id, riskClass);
    findings.push({
      constraintId: constraint.id,
      dimension: 'duplicate_risk',
      eventId: event.id,
      score: passed ? 1 : constraint.harmfulOverlapThreshold,
      passed,
      detail: `${constraint.label}: class ${riskClass}`,
    });
  }

  return findings;
}

export function evaluateEventContentConstraints(
  event: EventDefinition,
  profile: WorldProfile = getWorldProfile(),
): ContentConstraintFinding[] {
  const styleConstraints = profile.contentStyleConstraints ?? [];
  const duplicateConstraints = profile.contentDuplicateConstraints ?? [];
  return evaluateEventAgainstConstraints(event, styleConstraints, duplicateConstraints);
}

export function evaluateContentConstraints(
  profile: WorldProfile = getWorldProfile(),
  eventFilter?: (event: EventDefinition) => boolean,
): ContentConstraintReport {
  const loader = EventLoader.getInstance();
  const events = loader.getAllEvents().filter(event => {
    if (eventFilter) return eventFilter(event);
    return event.id.startsWith(P21_SAMPLE_PREFIX) || event.metadata?.tags?.includes('p21');
  });

  const styleConstraints = profile.contentStyleConstraints ?? [];
  const duplicateConstraints = profile.contentDuplicateConstraints ?? [];
  const findings = events.flatMap(event =>
    evaluateEventAgainstConstraints(event, styleConstraints, duplicateConstraints),
  );

  const styleFindings = findings.filter(f => f.dimension !== 'duplicate_risk');
  const duplicateFindings = findings.filter(f => f.dimension === 'duplicate_risk');
  const stylePassRate = styleFindings.length
    ? styleFindings.filter(f => f.passed).length / styleFindings.length
    : 1;
  const duplicateRiskPassRate = duplicateFindings.length
    ? duplicateFindings.filter(f => f.passed).length / duplicateFindings.length
    : 1;

  let decision: ContentConstraintReport['decision'] = 'pass';
  if (stylePassRate < 0.7 || duplicateRiskPassRate < 0.7) decision = 'warning';
  if (stylePassRate < 0.5 || duplicateRiskPassRate < 0.5) decision = 'fail';

  return {
    generatedAt: new Date().toISOString(),
    eventCount: events.length,
    findings,
    stylePassRate,
    duplicateRiskPassRate,
    decision,
  };
}

export function formatConstraintReportMarkdown(report: ContentConstraintReport): string {
  const lines = [
    '# P21 Content Constraint Report',
    '',
    `- Events evaluated: ${report.eventCount}`,
    `- Style pass rate: ${(report.stylePassRate * 100).toFixed(1)}%`,
    `- Duplicate-risk pass rate: ${(report.duplicateRiskPassRate * 100).toFixed(1)}%`,
    `- Decision: **${report.decision}**`,
    '',
    '## Findings',
  ];
  for (const finding of report.findings) {
    lines.push(`- [${finding.passed ? 'PASS' : 'FAIL'}] ${finding.eventId}: ${finding.detail}`);
  }
  return lines.join('\n');
}
