import { resolvePlanningPlaceholderText } from '../src/data/infantPassiveNarratives';

const ADULT_PLACEHOLDER_SNIPPET = '本期暂无强求的江湖变故，你可安排日常行动';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertNoAdultPlaceholder(age: number): void {
  const { title, text } = resolvePlanningPlaceholderText(age);
  const combined = `${title}${text}`;
  assert(
    !combined.includes(ADULT_PLACEHOLDER_SNIPPET),
    `age ${age} must not contain adult jianghu placeholder; got: ${combined}`,
  );
}

export function runPreschoolPlaceholderGovernanceTests(): void {
  for (const age of [0, 3, 5, 7]) {
    assertNoAdultPlaceholder(age);
  }

  const age0 = resolvePlanningPlaceholderText(0);
  assert(age0.title === '岁月静流', 'age 0 title');
  assert(age0.text.includes('家人'), 'age 0 home-season framing');

  const age3 = resolvePlanningPlaceholderText(3);
  assert(age3.title === '家中一季', 'age 3 title');
  assert(age3.text.includes('庭院'), 'age 3 passive/home copy');

  const age5 = resolvePlanningPlaceholderText(5);
  assert(age5.title === '童年时光', 'age 5 childhood framing');
  assert(!age5.text.includes('江湖变故'), 'age 5 no jianghu filler');

  const age7 = resolvePlanningPlaceholderText(7);
  assert(age7.title === '童年时光', 'age 7 childhood framing');

  const age8 = resolvePlanningPlaceholderText(8);
  assert(age8.text.includes(ADULT_PLACEHOLDER_SNIPPET), 'age 8+ retains adult placeholder');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPreschoolPlaceholderGovernanceTests();
  console.log('preschoolPlaceholderGovernanceTests: ok');
}
