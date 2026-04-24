import type { LifeStateConfig } from '../../types/eventTypes';

export const lifeStates: LifeStateConfig[] = [
  {
    key: 'fatigue',
    name: '疲惫',
    min: 0,
    max: 5,
    defaultValue: 0,
    thresholds: [
      { min: 1, label: '有些疲惫', description: '精力开始下滑。' },
      { min: 3, label: '明显疲惫', description: '更容易偷懒、生病和失误。' },
    ],
  },
  { key: 'discipline', name: '自律积累', min: 0, max: 5, defaultValue: 0 },
  { key: 'indulgence', name: '放纵积累', min: 0, max: 5, defaultValue: 0 },
  { key: 'familyBond', name: '家庭牵绊', min: 0, max: 5, defaultValue: 0 },
  { key: 'socialMomentum', name: '社交势能', min: 0, max: 5, defaultValue: 0 },
  { key: 'anxiety', name: '焦虑', min: 0, max: 5, defaultValue: 0 },
];
