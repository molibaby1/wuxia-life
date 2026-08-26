export const STRUCTURED_FINAL_OUTPUT_CONTRACT_V1 =
  'Structured Final Output Contract V1' as const;

export function renderStructuredFinalOutputContractV1(input: {
  roleSchemaName: string;
}): string {
  return [
    STRUCTURED_FINAL_OUTPUT_CONTRACT_V1,
    '',
    `Your terminal result must be exactly one valid JSON object matching the ${input.roleSchemaName} schema required by this task.`,
    'Output bare JSON only. Do not include Markdown/code fences, prose, explanations, headings, or any other text before or after the JSON object.',
    'If the task requires a negative or non-actionable outcome, represent it using a valid status/output defined by the role-specific schema; do not replace the structured result with free-form prose.',
    'The host validates this result strictly and will reject invalid output rather than extract, normalize, or repair it.',
  ].join('\n');
}
