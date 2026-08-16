export interface InvestigationStatement {
  statement: string;
  evidenceRefs: string[];
}

export interface HypothesisInvestigationResult {
  confirmedFacts: InvestigationStatement[];
  relevantMechanisms: InvestigationStatement[];
  limitingEvidence: InvestigationStatement[];
  unresolvedQuestions: string[];
  evidenceGaps: string[];
}

const ROOT_KEYS = [
  'confirmedFacts',
  'relevantMechanisms',
  'limitingEvidence',
  'unresolvedQuestions',
  'evidenceGaps',
] as const;

const STATEMENT_KEYS = ['statement', 'evidenceRefs'] as const;

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object and must not be null`);
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      throw new Error(`${label} contains unknown field: ${key}`);
    }
  }
  for (const key of allowed) {
    if (!(key in value)) {
      throw new Error(`${label} missing required field: ${key}`);
    }
  }
}

function assertNonEmptyString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
}

function assertNonEmptyStringArray(value: unknown, path: string): asserts value is string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }
  if (value.length === 0) {
    throw new Error(`${path} must be a non-empty array`);
  }
  value.forEach((item, index) => {
    if (typeof item !== 'string' || item.length === 0) {
      throw new Error(`${path}[${index}] must be a non-empty string`);
    }
  });
}

function assertStringArrayAllowEmpty(value: unknown, path: string): asserts value is string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }
  value.forEach((item, index) => {
    if (typeof item !== 'string' || item.length === 0) {
      throw new Error(`${path}[${index}] must be a non-empty string`);
    }
  });
}

function parseStatement(value: unknown, path: string): InvestigationStatement {
  assertObject(value, path);
  assertExactKeys(value, STATEMENT_KEYS, path);
  assertNonEmptyString(value.statement, `${path}.statement`);
  assertNonEmptyStringArray(value.evidenceRefs, `${path}.evidenceRefs`);
  return {
    statement: value.statement,
    evidenceRefs: [...value.evidenceRefs],
  };
}

function parseStatementArray(value: unknown, path: string): InvestigationStatement[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }
  return value.map((item, index) => parseStatement(item, `${path}[${index}]`));
}

export function parseHypothesisInvestigationResult(
  rawResponse: string,
): HypothesisInvestigationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error('hypothesis investigation response must be valid JSON');
  }

  assertObject(parsed, 'hypothesis investigation response');
  assertExactKeys(parsed, ROOT_KEYS, 'hypothesis investigation response');

  return {
    confirmedFacts: parseStatementArray(parsed.confirmedFacts, 'confirmedFacts'),
    relevantMechanisms: parseStatementArray(parsed.relevantMechanisms, 'relevantMechanisms'),
    limitingEvidence: parseStatementArray(parsed.limitingEvidence, 'limitingEvidence'),
    unresolvedQuestions: (() => {
      assertStringArrayAllowEmpty(parsed.unresolvedQuestions, 'unresolvedQuestions');
      return [...parsed.unresolvedQuestions];
    })(),
    evidenceGaps: (() => {
      assertStringArrayAllowEmpty(parsed.evidenceGaps, 'evidenceGaps');
      return [...parsed.evidenceGaps];
    })(),
  };
}

export function validateHypothesisInvestigationReferences(
  result: HypothesisInvestigationResult,
  allowedEvidenceRefs: ReadonlySet<string>,
): void {
  const categories: Array<{
    name: keyof Pick<
      HypothesisInvestigationResult,
      'confirmedFacts' | 'relevantMechanisms' | 'limitingEvidence'
    >;
    items: InvestigationStatement[];
  }> = [
    { name: 'confirmedFacts', items: result.confirmedFacts },
    { name: 'relevantMechanisms', items: result.relevantMechanisms },
    { name: 'limitingEvidence', items: result.limitingEvidence },
  ];

  for (const category of categories) {
    for (const [index, item] of category.items.entries()) {
      for (const ref of item.evidenceRefs) {
        if (!allowedEvidenceRefs.has(ref)) {
          throw new Error(
            `${category.name}[${index}] references unknown evidence: ${ref}`,
          );
        }
      }
    }
  }
}
