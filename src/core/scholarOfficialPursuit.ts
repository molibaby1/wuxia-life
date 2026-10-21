import type { GameState } from '../types/eventTypes';

export const SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY = 'p138_scholar_official_pursuit_ledger';
export const SCHOLAR_OFFICIAL_PURSUIT_INVITATION_EVENT_ID = 'p138_scholar_official_invitation';
export const SCHOLAR_OFFICIAL_PURSUIT_ACCEPT_CHOICE_ID = 'accept_scholar_official_pursuit';
export const SCHOLAR_OFFICIAL_PURSUIT_DECLINE_CHOICE_ID = 'decline_scholar_official_pursuit';
export const SCHOLAR_OFFICIAL_PURSUIT_EXAM_RULES_VERSION = 'curve-a-v1';

export type ScholarOfficialPursuitOperation = 'take_exam' | 'abandon';

export interface PursuitDate {
  year: number;
  month: number;
  day: number;
}

interface InvitationResponseEntry {
  sequence: number;
  type: 'invitation_response';
  date: PursuitDate;
  age: number;
  sourceEventId: string;
  response: 'accepted' | 'declined';
}

interface ExamAttemptEntry {
  sequence: number;
  type: 'exam_attempt';
  attemptNumber: number;
  startedAt: PursuitDate;
  completedAt: PursuitDate;
  ageAtStart: number;
  knowledgeAtStart: number;
  rulesVersion: string;
  adoptedPassRate: number;
  result: 'passed' | 'failed';
}

interface AbandonEntry {
  sequence: number;
  type: 'abandon';
  date: PursuitDate;
}

interface AppointmentDecisionEntry {
  sequence: number;
  type: 'appointment_decision';
  opportunityId: string;
  offeredAt: PursuitDate;
  decidedAt: PursuitDate;
  officeId: string;
  authorityId: string;
  response: 'accepted' | 'declined';
  effectiveAt?: PursuitDate;
}

export type ScholarOfficialPursuitEntry =
  | InvitationResponseEntry
  | ExamAttemptEntry
  | AbandonEntry
  | AppointmentDecisionEntry;

export type ScholarOfficialPursuitEntryDraft =
  | Omit<InvitationResponseEntry, 'sequence'>
  | Omit<ExamAttemptEntry, 'sequence'>
  | Omit<AbandonEntry, 'sequence'>
  | Omit<AppointmentDecisionEntry, 'sequence'>;

export type ScholarOfficialPursuitExamSummary = Omit<ExamAttemptEntry, 'sequence'>;

export interface ScholarOfficialPursuitLedger {
  schemaVersion: 1;
  entries: ScholarOfficialPursuitEntry[];
}

export type ScholarOfficialPursuitStage =
  | 'waiting_for_exam_age'
  | 'waiting_for_knowledge'
  | 'exam_cooldown'
  | 'ready_to_take_exam'
  | 'qualified_waiting_appointment';

export interface ScholarOfficialPursuitProjection {
  status: 'none' | 'active' | 'abandoned' | 'completed' | 'death_unfinished' | 'terminal_unfinished' | 'invalid';
  invitationResponse: 'accepted' | 'declined' | null;
  stage: ScholarOfficialPursuitStage | null;
  invitationDate: PursuitDate | null;
  examAttempts: number;
  latestExamResult: 'passed' | 'failed' | null;
  nextExamEligibleAt: PursuitDate | null;
  canTakeExam: boolean;
  canAbandon: boolean;
  appointmentAccepted: boolean;
  diagnostics: string[];
}

const MONTHS_PER_YEAR = 12;
const DAYS_PER_MONTH = 30;
const EMPTY_PROJECTION: ScholarOfficialPursuitProjection = {
  status: 'none',
  invitationResponse: null,
  stage: null,
  invitationDate: null,
  examAttempts: 0,
  latestExamResult: null,
  nextExamEligibleAt: null,
  canTakeExam: false,
  canAbandon: false,
  appointmentAccepted: false,
  diagnostics: [],
};

type StateLedgerRead = {
  ledger: ScholarOfficialPursuitLedger | null;
  mirrorMissing: boolean;
  diagnostics: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwn(value: unknown, key: string): boolean {
  return isRecord(value) && Object.prototype.hasOwnProperty.call(value, key);
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const allowed = [...expected].sort();
  return actual.length === allowed.length && actual.every((key, index) => key === allowed[index]);
}

function isValidDate(value: unknown): value is PursuitDate {
  if (!isRecord(value) || !exactKeys(value, ['year', 'month', 'day'])) return false;
  if (!Number.isSafeInteger(value.year) || (value.year as number) < 1) return false;
  if (!Number.isSafeInteger(value.month) || (value.month as number) < 1 || (value.month as number) > MONTHS_PER_YEAR) return false;
  if (!Number.isSafeInteger(value.day) || (value.day as number) < 1 || (value.day as number) > DAYS_PER_MONTH) return false;
  return Number.isSafeInteger(toDayNumber(value as unknown as PursuitDate));
}

function toDayNumber(date: PursuitDate): number {
  return (((date.year - 1) * MONTHS_PER_YEAR) + date.month - 1) * DAYS_PER_MONTH + date.day - 1;
}

function compareDate(left: PursuitDate, right: PursuitDate): number {
  return toDayNumber(left) - toDayNumber(right);
}

function sameDate(left: PursuitDate, right: PursuitDate): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day;
}

function addMonths(date: PursuitDate, months: number): PursuitDate | null {
  const monthIndex = (date.year - 1) * MONTHS_PER_YEAR + date.month - 1 + months;
  const year = Math.floor(monthIndex / MONTHS_PER_YEAR) + 1;
  const result = { year, month: monthIndex % MONTHS_PER_YEAR + 1, day: date.day };
  return isValidDate(result) ? result : null;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseEntry(value: unknown, index: number, diagnostics: string[]): ScholarOfficialPursuitEntry | null {
  const path = `entries[${index}]`;
  if (!isRecord(value)) {
    diagnostics.push(`${path} must be an object.`);
    return null;
  }
  if (!Number.isSafeInteger(value.sequence) || (value.sequence as number) !== index + 1) {
    diagnostics.push(`${path}.sequence must be unique, contiguous, and start at 1.`);
  }

  if (value.type === 'invitation_response') {
    if (!exactKeys(value, ['sequence', 'type', 'date', 'age', 'sourceEventId', 'response'])) {
      diagnostics.push(`${path} has unknown or missing invitation fields.`);
    }
    if (!isValidDate(value.date)) diagnostics.push(`${path}.date is not a valid game date.`);
    if (!Number.isSafeInteger(value.age) || (value.age as number) < 0) diagnostics.push(`${path}.age must be a non-negative integer.`);
    if (!nonEmptyString(value.sourceEventId)) diagnostics.push(`${path}.sourceEventId must name its source event.`);
    if (value.response !== 'accepted' && value.response !== 'declined') diagnostics.push(`${path}.response is invalid.`);
    if (!isValidDate(value.date) || !Number.isSafeInteger(value.age) || !nonEmptyString(value.sourceEventId)
      || (value.response !== 'accepted' && value.response !== 'declined')) return null;
    return {
      sequence: value.sequence as number,
      type: 'invitation_response',
      date: { ...value.date },
      age: value.age as number,
      sourceEventId: value.sourceEventId,
      response: value.response,
    };
  }

  if (value.type === 'exam_attempt') {
    if (!exactKeys(value, [
      'sequence', 'type', 'attemptNumber', 'startedAt', 'completedAt', 'ageAtStart',
      'knowledgeAtStart', 'rulesVersion', 'adoptedPassRate', 'result',
    ])) diagnostics.push(`${path} has unknown or missing exam fields.`);
    if (!isValidDate(value.startedAt)) diagnostics.push(`${path}.startedAt is not a valid game date.`);
    if (!isValidDate(value.completedAt)) diagnostics.push(`${path}.completedAt is not a valid game date.`);
    if (!Number.isSafeInteger(value.attemptNumber) || (value.attemptNumber as number) < 1) diagnostics.push(`${path}.attemptNumber must be a positive integer.`);
    if (!Number.isSafeInteger(value.ageAtStart) || (value.ageAtStart as number) < 0) diagnostics.push(`${path}.ageAtStart must be a non-negative integer.`);
    if (typeof value.knowledgeAtStart !== 'number' || !Number.isFinite(value.knowledgeAtStart)) diagnostics.push(`${path}.knowledgeAtStart must be finite.`);
    if (!nonEmptyString(value.rulesVersion)) diagnostics.push(`${path}.rulesVersion must be non-empty.`);
    if (typeof value.adoptedPassRate !== 'number' || !Number.isFinite(value.adoptedPassRate)
      || value.adoptedPassRate < 0 || value.adoptedPassRate > 1) diagnostics.push(`${path}.adoptedPassRate must be between 0 and 1.`);
    if (value.result !== 'passed' && value.result !== 'failed') diagnostics.push(`${path}.result is invalid.`);
    if (!isValidDate(value.startedAt) || !isValidDate(value.completedAt)
      || !Number.isSafeInteger(value.attemptNumber) || !Number.isSafeInteger(value.ageAtStart)
      || typeof value.knowledgeAtStart !== 'number' || !Number.isFinite(value.knowledgeAtStart)
      || !nonEmptyString(value.rulesVersion) || typeof value.adoptedPassRate !== 'number'
      || !Number.isFinite(value.adoptedPassRate)
      || (value.result !== 'passed' && value.result !== 'failed')) return null;
    return {
      sequence: value.sequence as number,
      type: 'exam_attempt',
      attemptNumber: value.attemptNumber as number,
      startedAt: { ...value.startedAt },
      completedAt: { ...value.completedAt },
      ageAtStart: value.ageAtStart as number,
      knowledgeAtStart: value.knowledgeAtStart,
      rulesVersion: value.rulesVersion,
      adoptedPassRate: value.adoptedPassRate,
      result: value.result,
    };
  }

  if (value.type === 'abandon') {
    if (!exactKeys(value, ['sequence', 'type', 'date'])) diagnostics.push(`${path} has unknown or missing abandon fields.`);
    if (!isValidDate(value.date)) diagnostics.push(`${path}.date is not a valid game date.`);
    if (!isValidDate(value.date)) return null;
    return { sequence: value.sequence as number, type: 'abandon', date: { ...value.date } };
  }

  if (value.type === 'appointment_decision') {
    const allowedKeys = value.response === 'accepted'
      ? ['sequence', 'type', 'opportunityId', 'offeredAt', 'decidedAt', 'officeId', 'authorityId', 'response', 'effectiveAt']
      : ['sequence', 'type', 'opportunityId', 'offeredAt', 'decidedAt', 'officeId', 'authorityId', 'response'];
    if (!exactKeys(value, allowedKeys)) diagnostics.push(`${path} has unknown or missing appointment fields.`);
    if (!nonEmptyString(value.opportunityId)) diagnostics.push(`${path}.opportunityId must be non-empty.`);
    if (!isValidDate(value.offeredAt)) diagnostics.push(`${path}.offeredAt is not a valid game date.`);
    if (!isValidDate(value.decidedAt)) diagnostics.push(`${path}.decidedAt is not a valid game date.`);
    if (!nonEmptyString(value.officeId)) diagnostics.push(`${path}.officeId must be non-empty.`);
    if (!nonEmptyString(value.authorityId)) diagnostics.push(`${path}.authorityId must be non-empty.`);
    if (value.response !== 'accepted' && value.response !== 'declined') diagnostics.push(`${path}.response is invalid.`);
    if (value.response === 'accepted' && !isValidDate(value.effectiveAt)) diagnostics.push(`${path}.effectiveAt is required and must be a valid game date.`);
    if (value.response === 'declined' && hasOwn(value, 'effectiveAt')) diagnostics.push(`${path}.effectiveAt is not allowed for a declined appointment.`);
    if (!nonEmptyString(value.opportunityId) || !isValidDate(value.offeredAt) || !isValidDate(value.decidedAt)
      || !nonEmptyString(value.officeId) || !nonEmptyString(value.authorityId)
      || (value.response !== 'accepted' && value.response !== 'declined')
      || (value.response === 'accepted' && !isValidDate(value.effectiveAt))) return null;
    return {
      sequence: value.sequence as number,
      type: 'appointment_decision',
      opportunityId: value.opportunityId,
      offeredAt: { ...value.offeredAt },
      decidedAt: { ...value.decidedAt },
      officeId: value.officeId,
      authorityId: value.authorityId,
      response: value.response,
      ...(value.response === 'accepted' ? { effectiveAt: { ...(value.effectiveAt as PursuitDate) } } : {}),
    };
  }

  diagnostics.push(`${path}.type is unknown.`);
  return null;
}

function entryDate(entry: ScholarOfficialPursuitEntry): PursuitDate {
  switch (entry.type) {
    case 'invitation_response':
    case 'abandon':
      return entry.date;
    case 'exam_attempt':
      return entry.completedAt;
    case 'appointment_decision':
      return entry.decidedAt;
  }
}

function validateEntrySequence(entries: ScholarOfficialPursuitEntry[], diagnostics: string[]): void {
  let invitation: InvitationResponseEntry | null = null;
  let abandoned = false;
  let passedAt: PursuitDate | null = null;
  let latestFailedAt: PursuitDate | null = null;
  let latestDeclinedAppointmentAt: PursuitDate | null = null;
  let examAttempts = 0;
  let acceptedAppointment = false;
  let lastRecordedAge: number | null = null;
  let previousDate: PursuitDate | null = null;
  const opportunityIds = new Set<string>();

  entries.forEach(entry => {
    const operationDate = entryDate(entry);
    if (previousDate && compareDate(operationDate, previousDate) < 0) {
      diagnostics.push(`Entry ${entry.sequence} is earlier than the preceding ledger entry.`);
    }
    const priorDate = previousDate;

    if (entry.type === 'invitation_response') {
      if (invitation || entries[0] !== entry) diagnostics.push('The invitation may be recorded once and must be the first entry.');
      if (entry.age < 16 || entry.age > 30) diagnostics.push('Invitation age must be between 16 and 30 inclusive.');
      lastRecordedAge = entry.age;
      invitation = entry;
    } else if (entry.type === 'exam_attempt') {
      if (!invitation || invitation.response !== 'accepted') diagnostics.push(`Exam entry ${entry.sequence} requires an accepted invitation.`);
      if (abandoned) diagnostics.push(`Exam entry ${entry.sequence} follows an abandoned pursuit.`);
      if (passedAt) diagnostics.push(`Exam entry ${entry.sequence} follows a passing exam.`);
      examAttempts += 1;
      if (entry.attemptNumber !== examAttempts) diagnostics.push(`Exam entry ${entry.sequence} has a non-consecutive attempt number.`);
      if (entry.ageAtStart < 18) diagnostics.push(`Exam entry ${entry.sequence} requires age 18 or older.`);
      if (lastRecordedAge !== null && entry.ageAtStart < lastRecordedAge) diagnostics.push(`Exam entry ${entry.sequence} age precedes an earlier case record.`);
      lastRecordedAge = entry.ageAtStart;
      if (entry.knowledgeAtStart < 20) diagnostics.push(`Exam entry ${entry.sequence} requires knowledge of at least 20.`);
      if (compareDate(entry.completedAt, entry.startedAt) <= 0) diagnostics.push(`Exam entry ${entry.sequence} must take a positive amount of time.`);
      const oneMonthLater = addMonths(entry.startedAt, 1);
      if (!oneMonthLater || !sameDate(oneMonthLater, entry.completedAt)) {
        diagnostics.push(`Exam entry ${entry.sequence} must take exactly one complete game month.`);
      }
      if (invitation && compareDate(entry.startedAt, invitation.date) < 0) diagnostics.push(`Exam entry ${entry.sequence} starts before the accepted invitation.`);
      if (priorDate && compareDate(entry.startedAt, priorDate) < 0) diagnostics.push(`Exam entry ${entry.sequence} starts before the preceding decision.`);
      if (latestFailedAt) {
        const eligibleAt = addMonths(latestFailedAt, 12);
        if (!eligibleAt || compareDate(entry.startedAt, eligibleAt) < 0) {
          diagnostics.push(`Exam entry ${entry.sequence} starts before 12 complete months have passed since the prior failure.`);
        }
      }
      if (entry.result === 'passed') passedAt = entry.completedAt;
      else latestFailedAt = entry.completedAt;
    } else if (entry.type === 'abandon') {
      if (!invitation || invitation.response !== 'accepted') diagnostics.push(`Abandon entry ${entry.sequence} requires an accepted invitation.`);
      if (abandoned) diagnostics.push('A pursuit may be abandoned only once.');
      if (acceptedAppointment) diagnostics.push('A pursuit cannot be abandoned after accepting an appointment.');
      abandoned = true;
    } else {
      if (!invitation || invitation.response !== 'accepted') diagnostics.push(`Appointment entry ${entry.sequence} requires an accepted invitation.`);
      if (!passedAt) diagnostics.push(`Appointment entry ${entry.sequence} requires a prior passing exam.`);
      if (acceptedAppointment) diagnostics.push('An accepted appointment cannot be repeated or followed by another appointment decision.');
      if (opportunityIds.has(entry.opportunityId)) diagnostics.push(`Appointment opportunity ${entry.opportunityId} is duplicated.`);
      opportunityIds.add(entry.opportunityId);
      if (passedAt && compareDate(entry.offeredAt, passedAt) < 0) diagnostics.push(`Appointment entry ${entry.sequence} was offered before the passing exam.`);
      if (compareDate(entry.decidedAt, entry.offeredAt) < 0) diagnostics.push(`Appointment entry ${entry.sequence} was decided before it was offered.`);
      if (latestDeclinedAppointmentAt) {
        const eligibleAt = addMonths(latestDeclinedAppointmentAt, 24);
        if (!eligibleAt || compareDate(entry.offeredAt, eligibleAt) < 0) {
          diagnostics.push(`Appointment entry ${entry.sequence} was offered before 24 complete months passed after the prior refusal.`);
        }
      }
      if (entry.response === 'accepted') {
        if (!entry.effectiveAt || !sameDate(entry.effectiveAt, entry.decidedAt)) {
          diagnostics.push(`Appointment entry ${entry.sequence} effective date must equal its acceptance date.`);
        }
        acceptedAppointment = true;
      } else {
        latestDeclinedAppointmentAt = entry.decidedAt;
      }
    }
    previousDate = operationDate;
  });
}

export function validateScholarOfficialPursuitLedger(value: unknown): string[] {
  const diagnostics: string[] = [];
  if (!isRecord(value)) return ['The case ledger must be a plain object.'];
  if (!exactKeys(value, ['schemaVersion', 'entries'])) diagnostics.push('The case ledger has unknown or missing fields.');
  if (value.schemaVersion !== 1) diagnostics.push('The case ledger schemaVersion must be 1.');
  if (!Array.isArray(value.entries)) return [...diagnostics, 'The case ledger entries must be an array.'];
  const parsedEntries: ScholarOfficialPursuitEntry[] = [];
  let allEntriesParsed = true;
  value.entries.forEach((entry, index) => {
    const parsed = parseEntry(entry, index, diagnostics);
    if (!parsed) allEntriesParsed = false;
    else parsedEntries.push(parsed);
  });
  if (allEntriesParsed && parsedEntries.length === value.entries.length) validateEntrySequence(parsedEntries, diagnostics);
  return diagnostics;
}

function jsonDeepEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right)
      && left.length === right.length
      && left.every((item, index) => jsonDeepEqual(item, right[index]));
  }
  if (isRecord(left) || isRecord(right)) {
    if (!isRecord(left) || !isRecord(right)) return false;
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return leftKeys.length === rightKeys.length
      && leftKeys.every((key, index) => key === rightKeys[index] && jsonDeepEqual(left[key], right[key]));
  }
  return false;
}

function readStateLedger(state: GameState): StateLedgerRead {
  const diagnostics: string[] = [];
  const topFlags = state.flags;
  const playerFlags = state.player?.flags;
  const topHasLedger = hasOwn(topFlags, SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY);
  const playerHasLedger = hasOwn(playerFlags, SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY);
  if (!topHasLedger && !playerHasLedger) return { ledger: null, mirrorMissing: false, diagnostics };
  if (!topHasLedger) {
    return {
      ledger: null,
      mirrorMissing: false,
      diagnostics: ['The case ledger exists only in player.flags; state.flags is the sole source of truth.'],
    };
  }
  const rawLedger = (topFlags as Record<string, unknown>)[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY];
  diagnostics.push(...validateScholarOfficialPursuitLedger(rawLedger));
  if (playerHasLedger && !jsonDeepEqual(rawLedger, (playerFlags as Record<string, unknown>)[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY])) {
    diagnostics.push('The case ledger mirror in player.flags does not deeply match state.flags.');
  }
  return {
    ledger: diagnostics.length === 0 ? rawLedger as ScholarOfficialPursuitLedger : null,
    mirrorMissing: !playerHasLedger,
    diagnostics,
  };
}

function validateStateLedger(state: GameState): StateLedgerRead {
  const result = readStateLedger(state);
  if (!result.ledger || result.diagnostics.length > 0) return result;
  if (!isValidDate(state.currentTime)) {
    result.diagnostics.push('A case ledger requires a valid current game date.');
  } else if (result.ledger.entries.length > 0) {
    const latestDate = entryDate(result.ledger.entries[result.ledger.entries.length - 1]);
    if (compareDate(state.currentTime, latestDate) < 0) result.diagnostics.push('The current game date precedes the latest case ledger entry.');
  }
  const lastRecordedAge = result.ledger.entries.reduce((age, entry) => {
    if (entry.type === 'invitation_response') return Math.max(age, entry.age);
    if (entry.type === 'exam_attempt') return Math.max(age, entry.ageAtStart);
    return age;
  }, 0);
  if (!Number.isSafeInteger(state.player?.age) || state.player.age < lastRecordedAge) {
    result.diagnostics.push('The current player age precedes the latest recorded case age.');
  }
  if (result.diagnostics.length > 0) result.ledger = null;
  return result;
}

function cloneLedger(ledger: ScholarOfficialPursuitLedger): ScholarOfficialPursuitLedger {
  return {
    schemaVersion: 1,
    entries: ledger.entries.map(entry => {
      if (entry.type === 'invitation_response') return { ...entry, date: { ...entry.date } };
      if (entry.type === 'exam_attempt') return { ...entry, startedAt: { ...entry.startedAt }, completedAt: { ...entry.completedAt } };
      if (entry.type === 'abandon') return { ...entry, date: { ...entry.date } };
      return {
        ...entry,
        offeredAt: { ...entry.offeredAt },
        decidedAt: { ...entry.decidedAt },
        ...(entry.effectiveAt ? { effectiveAt: { ...entry.effectiveAt } } : {}),
      };
    }),
  };
}

export function prepareScholarOfficialPursuitState(state: GameState): GameState {
  const result = validateStateLedger(state);
  if (result.diagnostics.length > 0) {
    throw new Error(`Invalid scholar official pursuit ledger: ${result.diagnostics.join('; ')}`);
  }
  if (!result.ledger || !result.mirrorMissing) return state;
  const ledgerCopy = cloneLedger(result.ledger);
  return {
    ...state,
    flags: { ...state.flags, [SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY]: ledgerCopy },
    player: {
      ...state.player,
      flags: { ...(state.player.flags || {}), [SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY]: cloneLedger(result.ledger) },
    },
  };
}

function invalidProjection(diagnostics: string[]): ScholarOfficialPursuitProjection {
  return { ...EMPTY_PROJECTION, status: 'invalid', diagnostics };
}

export function deriveScholarOfficialPursuit(state: GameState): ScholarOfficialPursuitProjection {
  const stateRead = validateStateLedger(state);
  if (stateRead.diagnostics.length > 0) return invalidProjection(stateRead.diagnostics);
  const ledger = stateRead.ledger;
  if (!ledger || ledger.entries.length === 0) return { ...EMPTY_PROJECTION };

  const invitation = ledger.entries.find((entry): entry is InvitationResponseEntry => entry.type === 'invitation_response')!;
  if (invitation.response === 'declined') {
    return { ...EMPTY_PROJECTION, invitationResponse: 'declined', invitationDate: { ...invitation.date } };
  }

  const exams = ledger.entries.filter((entry): entry is ExamAttemptEntry => entry.type === 'exam_attempt');
  const abandon = ledger.entries.find((entry): entry is AbandonEntry => entry.type === 'abandon');
  const acceptedAppointment = ledger.entries.find(
    (entry): entry is AppointmentDecisionEntry => entry.type === 'appointment_decision' && entry.response === 'accepted',
  );
  const invitationDate = { ...invitation.date };
  const latestExam = exams.length > 0 ? exams[exams.length - 1] : null;
  const nextExamEligibleAt = latestExam?.result === 'failed' ? addMonths(latestExam.completedAt, 12) : null;

  if (abandon) {
    return {
      ...EMPTY_PROJECTION,
      status: 'abandoned',
      invitationResponse: 'accepted',
      invitationDate,
      examAttempts: exams.length,
      latestExamResult: latestExam?.result ?? null,
      nextExamEligibleAt,
      appointmentAccepted: Boolean(acceptedAppointment),
    };
  }

  if (!isValidDate(state.currentTime)) return invalidProjection(['An accepted pursuit requires a valid current game date.']);
  if (!state.player || !Number.isSafeInteger(state.player.age) || typeof state.player.knowledge !== 'number'
    || !Number.isFinite(state.player.knowledge) || typeof state.player.alive !== 'boolean') {
    return invalidProjection(['The current player age, knowledge, or alive state is invalid.']);
  }

  if (acceptedAppointment) {
    return {
      ...EMPTY_PROJECTION,
      status: 'completed',
      invitationResponse: 'accepted',
      invitationDate,
      examAttempts: exams.length,
      latestExamResult: latestExam?.result ?? null,
      appointmentAccepted: true,
    };
  }
  if (!state.player.alive) {
    return {
      ...EMPTY_PROJECTION,
      status: 'death_unfinished',
      invitationResponse: 'accepted',
      invitationDate,
      examAttempts: exams.length,
      latestExamResult: latestExam?.result ?? null,
      nextExamEligibleAt,
      appointmentAccepted: Boolean(acceptedAppointment),
    };
  }
  if (state.ending) {
    return {
      ...EMPTY_PROJECTION,
      status: 'terminal_unfinished',
      invitationResponse: 'accepted',
      invitationDate,
      examAttempts: exams.length,
      latestExamResult: latestExam?.result ?? null,
      nextExamEligibleAt,
      appointmentAccepted: false,
    };
  }

  let stage: ScholarOfficialPursuitStage;
  if (latestExam?.result === 'passed') stage = 'qualified_waiting_appointment';
  else if (state.player.age < 18) stage = 'waiting_for_exam_age';
  else if (state.player.knowledge < 20) stage = 'waiting_for_knowledge';
  else if (nextExamEligibleAt && compareDate(state.currentTime, nextExamEligibleAt) < 0) stage = 'exam_cooldown';
  else stage = 'ready_to_take_exam';

  return {
    ...EMPTY_PROJECTION,
    status: 'active',
    invitationResponse: 'accepted',
    stage,
    invitationDate,
    examAttempts: exams.length,
    latestExamResult: latestExam?.result ?? null,
    nextExamEligibleAt,
    canTakeExam: stage === 'ready_to_take_exam',
    canAbandon: !acceptedAppointment,
    appointmentAccepted: Boolean(acceptedAppointment),
  };
}

export function getLatestScholarOfficialPursuitExam(
  state: GameState,
): ScholarOfficialPursuitExamSummary | null {
  const stateRead = validateStateLedger(state);
  if (stateRead.diagnostics.length > 0 || !stateRead.ledger) return null;
  const exam = [...stateRead.ledger.entries].reverse().find(
    (entry): entry is ExamAttemptEntry => entry.type === 'exam_attempt',
  );
  if (!exam) return null;
  const { sequence: _sequence, ...summary } = exam;
  return {
    ...summary,
    startedAt: { ...summary.startedAt },
    completedAt: { ...summary.completedAt },
  };
}

export function calculateScholarOfficialExamPassRate(knowledge: number): number {
  if (!Number.isFinite(knowledge) || knowledge < 20) {
    throw new Error('Scholar official exam probability requires finite knowledge of at least 20.');
  }
  const probability = 0.25 + 0.60 * (1 - Math.exp(-(knowledge - 20) / 25));
  return Math.max(0, Math.min(1, probability));
}

export function isScholarOfficialPursuitInvitationEligible(state: GameState): boolean {
  const age = state.player?.age;
  const projection = deriveScholarOfficialPursuit(state);
  return Number.isSafeInteger(age) && age >= 16 && age <= 30
    && isValidDate(state.currentTime)
    && state.player?.alive === true
    && !state.ending
    && projection.status === 'none'
    && projection.invitationResponse === null;
}

function draftDate(draft: ScholarOfficialPursuitEntryDraft): PursuitDate {
  switch (draft.type) {
    case 'invitation_response':
    case 'abandon':
      return draft.date;
    case 'exam_attempt':
      return draft.completedAt;
    case 'appointment_decision':
      return draft.decidedAt;
  }
}

export function appendScholarOfficialPursuitEntry(
  state: GameState,
  draft: ScholarOfficialPursuitEntryDraft,
): GameState {
  const prepared = prepareScholarOfficialPursuitState(state);
  if (!prepared.player.alive || prepared.ending) {
    throw new Error('Cannot append a scholar official pursuit entry after death or a terminal ending.');
  }
  if (!isValidDate(prepared.currentTime)) throw new Error('A case ledger entry requires a valid current game date.');
  if (!isValidDate(draftDate(draft)) || !sameDate(draftDate(draft), prepared.currentTime)) {
    throw new Error('A case ledger entry date must match the current game date.');
  }
  if (draft.type === 'invitation_response' && draft.age !== prepared.player.age) {
    throw new Error('The invitation age must match the current player age.');
  }

  const existing = prepared.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as ScholarOfficialPursuitLedger | undefined;
  const entries = existing ? cloneLedger(existing).entries : [];
  const entry = { ...draft, sequence: entries.length + 1 } as ScholarOfficialPursuitEntry;
  const ledger: ScholarOfficialPursuitLedger = { schemaVersion: 1, entries: [...entries, entry] };
  const nextState: GameState = {
    ...prepared,
    flags: { ...prepared.flags, [SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY]: cloneLedger(ledger) },
    player: {
      ...prepared.player,
      flags: { ...(prepared.player.flags || {}), [SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY]: cloneLedger(ledger) },
    },
  };
  const validation = validateStateLedger(nextState);
  if (validation.diagnostics.length > 0) {
    throw new Error(`Illegal scholar official pursuit transition: ${validation.diagnostics.join('; ')}`);
  }
  return nextState;
}
