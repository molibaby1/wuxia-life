export function resolvePlanningPlaceholderText(age: number): { title: string; text: string } {
  if (age <= 2) {
    return { title: '岁月静流', text: '这一季你在家人怀抱与啼哭声中度过，尚不知江湖为何物。' };
  }
  if (age <= 4) {
    return { title: '家中一季', text: '这一季你在庭院与亲人身边度过，听故事、学走路，日子平淡而安稳。' };
  }
  if (age <= 7) {
    return {
      title: '童年时光',
      text: '这一季在家中庭院与亲人、玩伴身边度过；若想略作安排，可从下方择一。',
    };
  }
  return {
    title: '规划本期人生',
    text: '本期暂无强求的江湖变故，你可安排日常行动。',
  };
}
