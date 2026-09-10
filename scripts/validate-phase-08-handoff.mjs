import { resolve } from 'node:path';

import { readJson, writeValidationReport, emitValidationEvent } from './lib/phase-08-cli.mjs';
import { assertPhase08Handoff } from './lib/handoff-contract.mjs';

const [inputPathValue, outputPathValue] = process.argv.slice(2);

if (!inputPathValue) {
  console.error(
    'Usage: node scripts/validate-phase-08-handoff.mjs <handoff.json> [validation-report.json]',
  );
  process.exit(1);
}

try {
  const inputPath = resolve(process.cwd(), inputPathValue);
  const { value: record } = readJson(inputPath, 'Phase 08 handoff record');
  assertPhase08Handoff(record);
  writeValidationReport(outputPathValue, 'PHASE_08_HANDOFF', record);
  emitValidationEvent('phase08.handoff.valid', {
    releaseId: record.releaseId,
    source: inputPathValue,
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
