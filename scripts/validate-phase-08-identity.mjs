import {
  assertValidPhase08Record,
  validatePhase08Identity,
  validatePhase08IdentityConsistency,
} from './lib/phase-08-contract.mjs';
import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';

const paths = process.argv.slice(2);
if (paths.length < 1)
  throw new Error(
    'Usage: node scripts/validate-phase-08-identity.mjs <identity.json> [record.json ...] [--report <report.json>]',
  );
const reportIndex = paths.indexOf('--report');
if (reportIndex >= 0 && !paths[reportIndex + 1])
  throw new Error('--report requires an output path.');
const outputPath = reportIndex >= 0 ? paths[reportIndex + 1] : undefined;
const recordPaths = paths.filter(
  (path, index) => path !== '--report' && (reportIndex < 0 || index !== reportIndex + 1),
);
if (recordPaths.length === 0) throw new Error('At least one Phase 08 identity record is required.');
const records = recordPaths.map((path) => readJson(path, 'Phase 08 identity record').value);
records.forEach((record) =>
  assertValidPhase08Record(record, (value) => validatePhase08Identity(value, { actual: true })),
);
if (records.length > 1) {
  const errors = validatePhase08IdentityConsistency(records);
  if (errors.length)
    throw new Error(`Phase 08 identity consistency failed:\n- ${errors.join('\n- ')}`);
}
writeValidationReport(outputPath, 'RELEASE_IDENTITY', records[0]);
emitValidationEvent('phase-08.identity.validated', { records: records.length });
