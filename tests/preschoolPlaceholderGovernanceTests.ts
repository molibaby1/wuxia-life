import { resolvePlanningPlaceholderText } from '../src/data/infantPassiveNarratives';

const ADULT_PLACEHOLDER_SNIPPET = '本期暂无强求的江湖变故，你可安排日常行动';
const ADULT_JIANGHU_SNIPPETS = ['江湖变故', '规划本期人生', '安排日常行动'] as const;
const CHILDHOOD_HOME_MARKERS = ['家中', '庭院', '亲人', '童年', '玩伴'] as const;

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

function assertChildhoodPlanningFraming(age: number): void {
  const { title, text } = resolvePlanningPlaceholderText(age);
  const combined = `${title}${text}`;
  for (const snippet of ADULT_JIANGHU_SNIPPETS) {
    assert(!combined.includes(snippet), `age ${age} must not contain "${snippet}"; got: ${combined}`);
  }
  assert(
    CHILDHOOD_HOME_MARKERS.some(marker => combined.includes(marker)),
    `age ${age} planning intro must mention childhood/home framing; got: ${combined}`,
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
  assertChildhoodPlanningFraming(5);

  const age7 = resolvePlanningPlaceholderText(7);
  assert(age7.title === '童年时光', 'age 7 childhood framing');
  assertChildhoodPlanningFraming(7);

  for (const age of [0, 1, 2, 3, 4]) {
    assertNoAdultPlaceholder(age);
    assert(!resolvePlanningPlaceholderText(age).text.includes('江湖变故'), `age ${age} no jianghu filler`);
  }

  const age8 = resolvePlanningPlaceholderText(8);
  assert(age8.text.includes(ADULT_PLACEHOLDER_SNIPPET), 'age 8+ retains adult placeholder');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPreschoolPlaceholderGovernanceTests();
  console.log('preschoolPlaceholderGovernanceTests: ok');
}
