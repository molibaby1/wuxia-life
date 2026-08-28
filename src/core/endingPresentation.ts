import type { EndingInfo } from './EndingSystem';
import type { GameState, PlayerLifeStates } from '../types/eventTypes';

type QuietLifeAxis = 'business' | 'balanced' | 'training' | 'study' | 'ordinary';
const QUIET_LIFE_AXIS_ORDER: Array<Exclude<QuietLifeAxis, 'ordinary' | 'balanced'>> = [
  'business',
  'training',
  'study',
];

function habitValues(lifeStates: PlayerLifeStates | undefined): Record<Exclude<QuietLifeAxis, 'ordinary' | 'balanced'>, number> {
  return {
    business: lifeStates?.businessHabit ?? 0,
    training: lifeStates?.trainingHabit ?? 0,
    study: lifeStates?.studyHabit ?? 0,
  };
}

function resolveQuietLifeAxis(state: GameState): QuietLifeAxis {
  const habits = habitValues(state.player.lifeStates);
  const entries = Object.entries(habits) as Array<[Exclude<QuietLifeAxis, 'ordinary' | 'balanced'>, number]>;
  const established = entries.filter(([, value]) => value >= 4);

  if (established.length >= 2) return 'balanced';
  if (established.length === 1) return established[0]![0];

  const ordered = [...entries].sort(
    (a, b) => b[1] - a[1] || QUIET_LIFE_AXIS_ORDER.indexOf(a[0]) - QUIET_LIFE_AXIS_ORDER.indexOf(b[0]),
  );
  const [leading, second] = ordered;
  if (leading && leading[1] >= 3 && leading[1] - (second?.[1] ?? 0) >= 2) {
    return leading[0];
  }

  return 'ordinary';
}

function familyAnchorLine(state: GameState): string {
  return state.player.spouse || state.player.children > 0
    ? '最后，日子回到了家人身边，平常的相守成为这段人生最可靠的落点。'
    : '最后，日子回到了没有传奇喧嚣的平静而普通的日常。';
}

function quietLifeAxisLines(state: GameState, axis: QuietLifeAxis): string[] {
  const { player } = state;

  switch (axis) {
    case 'business':
      return [
        '你大半生奔走于生意和家业之间。',
        player.businessAcumen >= 60
          ? '经营能力已经成形，手上留下了一份真正做过、守过、也承担过风险的家业。'
          : '你在经营和家业上留下了实实在在的积累。',
        '这条路也让你为家人的生活留下了一份余裕。',
      ];
    case 'balanced':
      return [
        '你没有把一生押在一条路上，练武、读书与营生都留下了长期实践。',
        '这些积累没有合成一段传奇，却让你见过不同的天地，也有能力面对生活的起落。',
        '你最终更看重守住已有的生活，而不是继续追逐更高的名声。',
      ];
    case 'training':
      return [
        '你曾把许多年月用在练功和自我磨砺上。',
        player.martialPower >= 60 ? '武学积累已经成为你人生中清晰可见的一部分。' : '这份坚持留下了虽不显赫、却真实存在的功底。',
      ];
    case 'study':
      return [
        '你曾把许多年月用在读书和见识的积累上。',
        player.knowledge >= 50 ? '学识与思考成为你看待世界、安顿生活的底气。' : '这份积累没有化作传奇，却让你的日子多了一层自己的理解。',
      ];
    case 'ordinary':
      return ['你没有把一生押在单一的传奇道路上，却也在日常选择中留下了自己的分量。'];
    default:
      return [];
  }
}

/**
 * Builds the player-facing description stored in the existing ending.description field.
 * Ending classification remains owned by EndingSystem; this function only explains it.
 */
export function buildEndingPresentationDescription(state: GameState, ending: EndingInfo): string {
  if (ending.id !== 'quiet_family_life') return ending.description;

  const core = state.player.spouse || state.player.children > 0
    ? ending.description
    : '你最终没有把自己活成传说，人生回到了安静而普通的日常。';
  const axis = resolveQuietLifeAxis(state);

  return [core, ...quietLifeAxisLines(state, axis), familyAnchorLine(state)].join(' ');
}
