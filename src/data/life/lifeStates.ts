import type { LifeStateConfig, PlayerLifeStates } from '../../types/eventTypes';

export function createDefaultPlayerLifeStates(
  overrides: Partial<PlayerLifeStates> = {},
): PlayerLifeStates {
  const base = lifeStates.reduce((acc, state) => {
    acc[state.key] = state.defaultValue;
    return acc;
  }, {} as PlayerLifeStates);
  return { ...base, ...overrides };
}

export const lifeStates: LifeStateConfig[] = [
  { key: 'discipline', name: '自律积累', min: 0, max: 5, defaultValue: 0 },
  { key: 'indulgence', name: '放纵积累', min: 0, max: 5, defaultValue: 0 },
  { key: 'familyBond', name: '家庭牵绊', min: 0, max: 5, defaultValue: 0 },
  { key: 'socialMomentum', name: '社交势能', min: 0, max: 5, defaultValue: 0 },
  { key: 'trainingHabit', name: '练功习惯', min: 0, max: 5, defaultValue: 0 },
  { key: 'studyHabit', name: '读书习惯', min: 0, max: 5, defaultValue: 0 },
  { key: 'businessHabit', name: '营生习惯', min: 0, max: 5, defaultValue: 0 },
];
