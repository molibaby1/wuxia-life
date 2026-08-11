import type {
  B0TerminalVerdict,
  EvidenceIndex,
  FixtureRegistry,
  HumanDecision,
  MechanicalAuditResult,
  RedTeamResult,
} from './types';

export type DecisionInput = {
  labels: Record<string, {
    kind: string;
    expectedDetections?: string[];
    expectedBlockCodes?: string[];
  }>;
  mechanical: MechanicalAuditResult[];
  redTeam: RedTeamResult;
  evidence: EvidenceIndex;
  controlHardKilled: boolean;
  knownBadMissed: string[];
  registry: FixtureRegistry;
};

/**
 * B0 calibration verdict:
 * - Adversarial fixtures are expected to trigger red-team veto/findings.
 * - Calibration passes when detectors catch every known-bad and every adversarial attack,
 *   Control is not hard-killed, and the evidence chain is intact.
 * - A polluted production candidate (outside this fixture matrix) would still be blocked by veto.
 */
export function evaluateAutomaticTerminal(input: DecisionInput): {
  suggested: B0TerminalVerdict;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!input.evidence.chainOk || input.evidence.breakReasons.length > 0) {
    reasons.push(...input.evidence.breakReasons.map(r => `evidence: ${r}`));
    return { suggested: 'blocked', reasons };
  }

  if (input.controlHardKilled) {
    reasons.push('control hard-killed by mechanical auditor');
    return { suggested: 'failed', reasons };
  }

  if (input.knownBadMissed.length > 0) {
    reasons.push(`known-bad missed: ${input.knownBadMissed.join(',')}`);
    return { suggested: 'failed', reasons };
  }

  const found = new Set(input.redTeam.findings.map(f => f.code));
  for (const sample of input.registry.samples.filter(s => s.kind === 'adversarial')) {
    const expected = sample.expectedBlockCodes ?? [];
    const missing = expected.filter(code => !found.has(code));
    if (missing.length > 0) {
      reasons.push(`adversarial ${sample.id} missed blocks: ${missing.join(',')}`);
      return { suggested: 'failed', reasons };
    }
  }

  // Calibration matrix includes intentional attacks; veto must fire for them.
  const hasAdversarial = input.registry.samples.some(s => s.kind === 'adversarial');
  if (hasAdversarial && !input.redTeam.veto) {
    reasons.push('adversarial fixtures present but red-team did not veto');
    return { suggested: 'failed', reasons };
  }

  reasons.push(
    'calibration matrix covered: known-bad detected, control alive, adversarial vetoed, evidence chain ok',
  );
  return { suggested: 'passed', reasons };
}

export function applyHumanDecision(
  decision: 'accept' | 'reject',
  automatic: { suggested: B0TerminalVerdict; reasons: string[] },
  reason: string,
): HumanDecision {
  if (decision === 'accept') {
    if (automatic.suggested !== 'passed') {
      return {
        decision: 'reject',
        decidedAt: new Date().toISOString(),
        reason: `accept refused: automatic=${automatic.suggested}; ${automatic.reasons.join('; ')}`,
        terminalVerdict: automatic.suggested,
      };
    }
    return {
      decision: 'accept',
      decidedAt: new Date().toISOString(),
      reason,
      terminalVerdict: 'passed',
    };
  }

  return {
    decision: 'reject',
    decidedAt: new Date().toISOString(),
    reason,
    terminalVerdict: automatic.suggested === 'blocked' ? 'blocked' : 'failed',
  };
}

/** Production-path helper: any red-team veto on a real candidate blocks promotion. */
export function productionVetoBlocks(redTeam: RedTeamResult): boolean {
  return redTeam.veto;
}
