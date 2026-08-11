export const B0_STATES = [
  'draft',
  'sealed',
  'queued',
  'simulated',
  'audited',
  'evidence_checked',
  'awaiting_human',
  'passed',
  'failed',
  'blocked',
] as const;

export type B0State = (typeof B0_STATES)[number];

const ALLOWED: Record<B0State, B0State[]> = {
  draft: ['sealed', 'blocked'],
  sealed: ['queued', 'blocked'],
  queued: ['simulated', 'blocked'],
  simulated: ['audited', 'blocked'],
  audited: ['evidence_checked', 'blocked'],
  evidence_checked: ['awaiting_human', 'blocked'],
  awaiting_human: ['passed', 'failed', 'blocked'],
  passed: [],
  failed: [],
  blocked: [],
};

export function transition(from: B0State, to: B0State): B0State {
  if (!ALLOWED[from].includes(to)) {
    throw new Error(`B0_BLOCKED: illegal transition ${from} -> ${to}`);
  }
  return to;
}
