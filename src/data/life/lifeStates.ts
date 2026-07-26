import type { LifeStateConfig, PlayerLifeStates } from '../../types/eventTypes';

export function createDefaultPlayerLifeStates(
  overrides: Partial<PlayerLifeStates> = {},
): PlayerLifeStates {
  const input = overrides as Record<string, unknown>;
  const allowed = new Set(lifeStates.map(item => item.key));

  for (const key of Object.keys(input)) {
    if (!allowed.has(key as never)) {
      throw new Error(`Unknown player life state: ${key}`);
    }
  }

  return lifeStates.reduce((result, config) => {
    const raw = input[config.key];
    if (raw === undefined) {
      result[config.key] = config.defaultValue;
      return result;
    }
    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      throw new Error(`Invalid player life state ${config.key}: expected finite number`);
    }
    result[config.key] = Math.max(config.min, Math.min(config.max, raw));
    return result;
  }, {} as PlayerLifeStates);
}

export const lifeStates: LifeStateConfig[] = [
  { key: 'familyBond', name: '家庭牵绊', min: 0, max: 5, defaultValue: 0 },
  { key: 'socialMomentum', name: '社交势能', min: 0, max: 5, defaultValue: 0 },
  { key: 'trainingHabit', name: '练功习惯', min: 0, max: 5, defaultValue: 0 },
  { key: 'studyHabit', name: '读书习惯', min: 0, max: 5, defaultValue: 0 },
  { key: 'businessHabit', name: '营生习惯', min: 0, max: 5, defaultValue: 0 },
];
