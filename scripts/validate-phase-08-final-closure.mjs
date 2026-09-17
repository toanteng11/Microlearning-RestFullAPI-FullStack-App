import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  assertValidPhase08FinalClosure,
  PHASE08_FINAL_CLOSURE,
} from './lib/phase-08-final-closure.mjs';
import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';

const [manifestPath, ...rest] = process.argv.slice(2);
const expectedArgumentCount = PHASE08_FINAL_CLOSURE.SOURCE_RECORDS.length + 1;
if (!manifestPath || rest.length !== expectedArgumentCount) {
  throw new Error(
    'Usage: node scripts/validate-phase-08-final-closure.mjs <manifest.json> ' +
      '<production-deployment.json> <post-release.json> <handover.json> ' +
      '<final-acceptance.json> <g5-decision.json> <exit.json> <validation-report.json>',
  );
}

const outputPath = rest.at(-1);
const sourcePaths = rest.slice(0, -1);
const { value: manifest } = readJson(manifestPath, 'Phase 08 final closure manifest');
const records = {};

for (const [index, key] of PHASE08_FINAL_CLOSURE.SOURCE_RECORDS.entries()) {
  const sourcePath = resolve(sourcePaths[index]);
  const { value } = readJson(sourcePath, `Phase 08 ${key} source record`);
  const sha256 = `sha256:${createHash('sha256').update(readFileSync(sourcePath)).digest('hex')}`;
  records[key] = value;
  if (manifest.sourceRecords?.[key]?.sha256 !== sha256) {
    throw new Error(`sourceRecords.${key}.sha256 does not match the source file.`);
  }
}

assertValidPhase08FinalClosure(manifest, records);
writeValidationReport(outputPath, 'FINAL_CLOSURE_PACKAGE', manifest);
emitValidationEvent('phase-08.final_closure.validated', {
  status: manifest.status,
  decision: manifest.finalDecision,
  releaseId: manifest.releaseIdentity.releaseId,
  evidenceCount: manifest.evidenceRegister.length,
});
