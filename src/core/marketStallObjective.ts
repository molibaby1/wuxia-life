import type { GameState } from '../types/eventTypes';

export type MarketStallOperation = 'attempt' | 'abandon';

export type MarketStallObjectiveProjection = {
  title: string;
  status: 'active' | 'completed' | 'abandoned' | 'expired' | 'insufficient_time' | 'invalid';
  description: string;
  invitedAt: { year: number; month: number; day: number } | null;
  deadline: { year: number; month: number; day: number } | null;
  supplyPrepared: boolean;
  canAttempt: boolean;
  canAbandon: boolean;
  diagnostics: string[];
};

const INVITATION_EVENT_ID = 'p138_market_stall_invitation';
const ACCEPTED = 'p138_market_stall_accepted';
const REFUSED = 'p138_market_stall_refused';
const SUPPLY_PREPARED = 'p138_market_stall_supply_prepared';
const ATTEMPTED = 'p138_market_stall_attempted';
const ABANDONED = 'p138_market_stall_abandoned';
const DAY_COUNT = 30;
const MONTH_COUNT = 12;
const MONTHS_OPEN = 6;
const ATTEMPT_MONTHS = 1;

type CalendarDate = { year: number; month: number; day: number };

function isValidDate(value: unknown): value is CalendarDate {
  if (typeof value !== 'object' || value === null) return false;
  const date = value as Partial<CalendarDate>;
  const fieldsValid = Number.isSafeInteger(date.year) && (date.year ?? 0) >= 1
    && Number.isSafeInteger(date.month) && (date.month ?? 0) >= 1 && (date.month ?? 0) <= MONTH_COUNT
    && Number.isSafeInteger(date.day) && (date.day ?? 0) >= 1 && (date.day ?? 0) <= DAY_COUNT;
  if (!fieldsValid) return false;
  const ordinal = (((date.year! - 1) * MONTH_COUNT) + date.month! - 1) * DAY_COUNT + date.day! - 1;
  return Number.isSafeInteger(ordinal);
}

function toDayNumber(date: CalendarDate): number {
  return ((date.year - 1) * MONTH_COUNT + date.month - 1) * DAY_COUNT + date.day - 1;
}

function addMonths(date: CalendarDate, months: number): CalendarDate {
  const monthIndex = (date.year - 1) * MONTH_COUNT + date.month - 1 + months;
  return { year: Math.floor(monthIndex / MONTH_COUNT) + 1, month: monthIndex % MONTH_COUNT + 1, day: date.day };
}

function invalidProjection(
  invitedAt: CalendarDate | null,
  deadline: CalendarDate | null,
  diagnostics: string[],
): MarketStallObjectiveProjection {
  return {
    title: '集市试摊',
    status: 'invalid',
    description: '这次集市试摊记录不完整，暂时无法确认目标状态。',
    invitedAt,
    deadline,
    supplyPrepared: false,
    canAttempt: false,
    canAbandon: false,
    diagnostics,
  };
}

export function deriveMarketStallObjective(state: GameState): MarketStallObjectiveProjection | null {
  const flags = state.flags ?? {};
  const values = [ACCEPTED, REFUSED, SUPPLY_PREPARED, ATTEMPTED, ABANDONED]
    .map(key => flags[key]);
  if (values.some(value => value !== undefined && typeof value !== 'boolean')) {
    return invalidProjection(null, null, ['集市目标事实必须是布尔值。']);
  }

  const accepted = flags[ACCEPTED] === true;
  const refused = flags[REFUSED] === true;
  const supplyPreparedFact = flags[SUPPLY_PREPARED] === true;
  const attempted = flags[ATTEMPTED] === true;
  const abandoned = flags[ABANDONED] === true;
  const invitationRecords = (state.eventHistory ?? []).filter(record => record.eventId === INVITATION_EVENT_ID);
  const supplyRecords = (state.eventHistory ?? []).filter(record => record.eventId === 'p138_market_stall_supply');
  const anyObjectiveFact = values.some(value => value === true);

  if (!accepted && !refused && !anyObjectiveFact && invitationRecords.length === 0) return null;
  if (accepted && refused) return invalidProjection(null, null, ['同一次邀请不能同时接受和拒绝。']);
  if (attempted && abandoned) return invalidProjection(null, null, ['同一次追求不能同时完成和放弃。']);
  if (!accepted && (supplyPreparedFact || attempted || abandoned)) {
    return invalidProjection(null, null, ['筹备、完成或放弃事实缺少明确接受事实。']);
  }
  if (!accepted && !refused) return invalidProjection(null, null, ['邀请记录缺少明确接受或拒绝结果。']);
  if (supplyPreparedFact && supplyRecords.length === 0) {
    return invalidProjection(null, null, ['供货准备事实缺少对应的正式货商事件记录。']);
  }
  if (invitationRecords.length !== 1) {
    return invalidProjection(null, null, ['邀请事实缺失或重复，无法确定本次追求的期限。']);
  }

  const rawInvitationDate = invitationRecords[0].timestamp;
  if (!isValidDate(rawInvitationDate)) {
    return invalidProjection(null, null, ['邀请记录缺少合法的效果前年月日。']);
  }
  const invitedAt = { ...rawInvitationDate };
  const deadline = addMonths(invitedAt, MONTHS_OPEN);
  if (!isValidDate(deadline)) {
    return invalidProjection(invitedAt, null, ['邀请日期过大，无法安全计算六个月期限。']);
  }
  if (refused) {
    if (supplyPreparedFact || attempted || abandoned) {
      return invalidProjection(invitedAt, deadline, ['拒绝邀请后出现了接受后才允许产生的事实。']);
    }
    return null;
  }

  if (!isValidDate(state.currentTime)) {
    return invalidProjection(invitedAt, deadline, ['当前游戏日期缺失或非法。']);
  }
  if (toDayNumber(state.currentTime) < toDayNumber(invitedAt)) {
    return invalidProjection(invitedAt, deadline, ['当前游戏日期早于邀请日期。']);
  }
  if (attempted) {
    if (toDayNumber(state.currentTime) < toDayNumber(addMonths(invitedAt, ATTEMPT_MONTHS))) {
      return invalidProjection(invitedAt, deadline, ['完成事实早于一个月经营结算。']);
    }
    return {
      title: '集市试摊', status: 'completed',
      description: '你已经亲自经营过一次临时摊位。这项追求已经完成。',
      invitedAt, deadline, supplyPrepared: supplyPreparedFact,
      canAttempt: false, canAbandon: false, diagnostics: [],
    };
  }
  if (abandoned) {
    return {
      title: '集市试摊', status: 'abandoned',
      description: '你决定不再参加这次集市经营，之前接下的目标已经结束。',
      invitedAt, deadline, supplyPrepared: supplyPreparedFact,
      canAttempt: false, canAbandon: false, diagnostics: [],
    };
  }

  const now = toDayNumber(state.currentTime);
  const deadlineDay = toDayNumber(deadline);
  if (now >= deadlineDay) {
    return {
      title: '集市试摊', status: 'expired',
      description: '本次集市经营期已经结束，你没有在期限内完成尝试。',
      invitedAt, deadline, supplyPrepared: supplyPreparedFact,
      canAttempt: false, canAbandon: false, diagnostics: [],
    };
  }
  const finishAt = addMonths(state.currentTime, ATTEMPT_MONTHS);
  if (!isValidDate(finishAt)) {
    return invalidProjection(invitedAt, deadline, ['当前日期过大，无法安全计算一个月经营期限。']);
  }
  if (toDayNumber(finishAt) > deadlineDay) {
    return {
      title: '集市试摊', status: 'insufficient_time',
      description: '集市尚未结束，但余下时间不够完成一次为期一个月的经营尝试。',
      invitedAt, deadline, supplyPrepared: supplyPreparedFact,
      canAttempt: false, canAbandon: true, diagnostics: [],
    };
  }
  return {
    title: '集市试摊', status: 'active',
    description: '你接下了限时试摊机会，可以在期限内自行安排一个月亲自经营。',
    invitedAt, deadline, supplyPrepared: supplyPreparedFact,
    canAttempt: true, canAbandon: true, diagnostics: [],
  };
}

export function isMarketStallEventEligible(eventId: string, state: GameState): boolean {
  if (eventId === INVITATION_EVENT_ID) {
    const age = state.player?.age;
    const flags = state.flags ?? {};
    const facts = [ACCEPTED, REFUSED, SUPPLY_PREPARED, ATTEMPTED, ABANDONED].map(key => flags[key]);
    return Number.isSafeInteger(age) && age >= 16 && age <= 25
      && isValidDate(state.currentTime)
      && facts.every(value => value === undefined || value === false)
      && deriveMarketStallObjective(state) === null
      && !(state.eventHistory ?? []).some(record => record.eventId === INVITATION_EVENT_ID);
  }
  if (eventId === 'p138_market_stall_supply') {
    const objective = deriveMarketStallObjective(state);
    return objective?.status === 'active'
      && objective.canAttempt
      && !objective.supplyPrepared
      && !(state.eventHistory ?? []).some(record => record.eventId === 'p138_market_stall_supply');
  }
  return false;
}
