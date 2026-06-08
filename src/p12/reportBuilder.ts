import type { WorldProfile } from '../narrative/profile/types';
import type { ProfileValidationResult } from '../narrative/profile/types';
import { validateWorldProfileForGate } from './profileVerification';
import { PROFILE_READER_REGISTRY, summarizeReaderRegistry } from './readerRegistry';

export interface P12ProfileGateReport {
  generatedAt: string;
  worldId: string;
  decision: 'pass' | 'warning' | 'fail';
  profileValidation: ProfileValidationResult;
  sectionSummary: Record<string, { count: number; present: boolean }>;
  readers: {
    profileFirst: string[];
    deferred: string[];
  };
  saveSchemaChanged: boolean;
  messages: string[];
}

export function assembleP12ProfileGateReport(profile: WorldProfile): P12ProfileGateReport {
  const profileValidation = validateWorldProfileForGate(profile);
  const readerSummary = summarizeReaderRegistry();

  const sectionSummary: P12ProfileGateReport['sectionSummary'] = {};
  for (const section of profileValidation.sections) {
    sectionSummary[section.key] = { count: section.count, present: section.present };
  }

  const messages = [...profileValidation.messages];
  if (readerSummary.deferred.length > 0) {
    messages.push(
      `Deferred readers (${readerSummary.deferred.length}): ${readerSummary.deferred.map(r => r.id).join(', ')}`,
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    worldId: profile.id,
    decision: profileValidation.decision,
    profileValidation,
    sectionSummary,
    readers: {
      profileFirst: readerSummary.profileFirst.map(r => r.id),
      deferred: readerSummary.deferred.map(r => r.id),
    },
    saveSchemaChanged: false,
    messages,
  };
}

export function formatP12GateMarkdown(report: P12ProfileGateReport): string {
  const lines: string[] = [
    '# P12 World Profile Gate Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `## Decision: **${report.decision.toUpperCase()}**`,
    '',
    '## Profile sections',
    '',
    '| Section | Present | Count |',
    '|---------|---------|-------|',
  ];

  for (const [key, value] of Object.entries(report.sectionSummary)) {
    lines.push(`| ${key} | ${value.present ? 'yes' : 'no'} | ${value.count} |`);
  }

  lines.push('', '## Profile-first readers', '');
  for (const id of report.readers.profileFirst) {
    const entry = PROFILE_READER_REGISTRY.find(r => r.id === id);
    lines.push(`- **${id}**: ${entry?.description ?? id}`);
  }

  lines.push('', '## Deferred readers', '');
  for (const id of report.readers.deferred) {
    const entry = PROFILE_READER_REGISTRY.find(r => r.id === id);
    lines.push(`- **${id}**: ${entry?.description ?? id}${entry?.note ? ` — ${entry.note}` : ''}`);
  }

  lines.push('', '## Save schema', '');
  lines.push(`- Changed in P12: **${report.saveSchemaChanged ? 'yes' : 'no'}**`);

  if (report.messages.length > 0) {
    lines.push('', '## Messages', '');
    for (const message of report.messages) {
      lines.push(`- ${message}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}
