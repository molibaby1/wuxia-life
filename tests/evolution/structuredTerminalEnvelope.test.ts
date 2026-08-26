import assert from 'node:assert/strict';
import { validateStructuredTerminalEnvelope } from '../../src/evolution/structuredTerminalEnvelope';

export async function runStructuredTerminalEnvelopeTests(): Promise<void> {
  for (const raw of [
    '{"a":1}',
    '{\n  "a": 1\n}',
    '\n  {\n    "a": 1\n  }\n',
  ]) {
    const result = validateStructuredTerminalEnvelope(raw);
    assert.equal(result.ok, true);
    assert.deepEqual(result.ok ? result.parsedObject : undefined, { a: 1 });
  }

  for (const raw of [
    '',
    'Here is the result:\n{"a":1}',
    '```json\n{"a":1}\n```',
    '{"a":1}\nextra',
    '{"a":1}\n{"b":2}',
    '[]',
    '"text"',
    'null',
  ]) {
    assert.equal(validateStructuredTerminalEnvelope(raw).ok, false);
  }

  assert.deepEqual(validateStructuredTerminalEnvelope('   '), {
    ok: false,
    failureClass: 'ENVELOPE_FAILURE',
    reason: 'EMPTY',
  });

  assert.deepEqual(validateStructuredTerminalEnvelope('[]'), {
    ok: false,
    failureClass: 'ENVELOPE_FAILURE',
    reason: 'NON_OBJECT_ROOT',
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStructuredTerminalEnvelopeTests()
    .then(() => console.log('structuredTerminalEnvelope.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
