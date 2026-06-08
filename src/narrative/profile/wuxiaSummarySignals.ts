import type { WorldProfileSummarySignal } from './types';

export const WUXIA_PROFILE_SUMMARY_SIGNALS: WorldProfileSummarySignal[] = [
  {
    slot: 'age40_identity',
    variableName: 'origin',
    description: '出身信息',
    sourceRole: 'origin',
  },
  {
    slot: 'age40_identity',
    variableName: 'route_identity',
    description: '路线身份信号',
    sourceRole: 'route_identity',
  },
  {
    slot: 'age40_identity',
    variableName: 'route_preference',
    description: '画像偏好',
    sourceRole: 'route_preference',
  },
  {
    slot: 'age40_identity',
    variableName: 'echo_suffix',
    description: '回响摘要拼接',
    sourceRole: 'echo',
  },
];
