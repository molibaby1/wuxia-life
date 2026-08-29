import type { EventCondition, GameState } from '../../types/eventTypes';
import { ConditionEvaluator } from '../ConditionEvaluator';
import { isCanonicalPlayerNumericStat, readPlayerNumeric } from '../../utils/playerStatAccess';
import { isWealthCapacity, meetsWealthCapacity, WEALTH_CAPACITY_LABELS } from '../../types/wealthCapacity';

export type RequirementGapKind = 'exact' | 'fuzzy' | 'unsupported';

export interface ChoiceRequirementExplanation {
  requirementId: string;
  label: string;
  met: boolean;
  gapKind: RequirementGapKind;
  playerMessage: string;
  gapValue?: number;
}

export interface ChoiceExplanationResult {
  choiceId: string;
  available: boolean;
  explanations: ChoiceRequirementExplanation[];
  summary: string;
}

const STAT_LABELS: Record<string, string> = {
  martialPower: '功力',
  constitution: '体魄',
  charisma: '魅力',
  chivalry: '侠义',
  reputation: '名望',
  connections: '人脉',
  knowledge: '学识',
};

const RETIRED_WALLET_REQUIREMENT_STATS = new Set(['money', 'wealth']);

function parseStatThreshold(expression: string): { stat: string; op: string; value: number } | null {
  const match = expression.match(/(?:player\.)?([a-zA-Z]+)\s*(>=|>|<=|<|==)\s*(\d+)/);
  if (!match) return null;
  return { stat: match[1], op: match[2], value: Number(match[3]) };
}

export function explainChoiceRequirement(
  choiceId: string,
  condition: EventCondition | undefined,
  state: GameState,
  evaluator: ConditionEvaluator = new ConditionEvaluator(),
): ChoiceExplanationResult {
  if (!condition) {
    return {
      choiceId,
      available: true,
      explanations: [],
      summary: '可自由选择',
    };
  }

  if (condition.type === 'wealth_capacity_at_least') {
    const minimumLabel = isWealthCapacity(condition.minimum)
      ? WEALTH_CAPACITY_LABELS[condition.minimum]
      : String(condition.minimum);
    const available = isWealthCapacity(condition.minimum)
      && meetsWealthCapacity(state.player.wealthCapacity, condition.minimum);
    const playerMessage = available
      ? `财力已达「${minimumLabel}」`
      : `财力需达到「${minimumLabel}」`;

    return {
      choiceId,
      available,
      explanations: [{
        requirementId: 'wealth_capacity_at_least',
        label: '财力',
        met: available,
        gapKind: 'unsupported',
        playerMessage,
      }],
      summary: playerMessage,
    };
  }

  if (condition.type !== 'expression') {
    return {
      choiceId,
      available: evaluator.evaluate(condition, state),
      explanations: [{
        requirementId: 'custom',
        label: '特殊条件',
        met: evaluator.evaluate(condition, state),
        gapKind: 'unsupported',
        playerMessage: '需满足特定剧情条件',
      }],
      summary: '需满足特定剧情条件',
    };
  }

  const available = evaluator.evaluate(condition, state);
  const parsed = parseStatThreshold(condition.expression);
  if (!parsed) {
    return {
      choiceId,
      available,
      explanations: [{
        requirementId: 'expression',
        label: '条件',
        met: available,
        gapKind: 'unsupported',
        playerMessage: available ? '条件已满足' : '尚有未明条件未达成',
      }],
      summary: available ? '条件已满足' : '尚有未明条件未达成',
    };
  }

  if (RETIRED_WALLET_REQUIREMENT_STATS.has(parsed.stat) || !isCanonicalPlayerNumericStat(parsed.stat)) {
    return {
      choiceId,
      available: false,
      explanations: [{
        requirementId: parsed.stat,
        label: '条件',
        met: false,
        gapKind: 'unsupported',
        playerMessage: '尚有未明条件未达成',
      }],
      summary: '尚有未明条件未达成',
    };
  }

  const label = STAT_LABELS[parsed.stat] ?? parsed.stat;
  const current = readPlayerNumeric(state.player, parsed.stat);
  const met = available;
  const gap = Math.max(0, parsed.value - current);
  const gapKind: RequirementGapKind = gap > 10 ? 'fuzzy' : 'exact';

  const playerMessage = met
    ? `${label}已达标`
    : gapKind === 'fuzzy'
      ? `${label}尚有差距（还需提升）`
      : `${label}还差 ${gap}`;

  return {
    choiceId,
    available,
    explanations: [{
      requirementId: parsed.stat,
      label,
      met,
      gapKind,
      playerMessage,
      gapValue: met ? 0 : gap,
    }],
    summary: playerMessage,
  };
}
