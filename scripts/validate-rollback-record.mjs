import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { assertValidRollbackRecord } from './lib/recovery-contract.mjs';

const [recordPathValue, repository] = process.argv.slice(2);
if (!recordPathValue || !repository) {
  throw new Error('Usage: node scripts/validate-rollback-record.mjs <record.json> <repository>');
}
const recordPath = resolve(recordPathValue);
if (!existsSync(recordPath)) throw new Error(`Rollback record not found: ${recordPath}`);
const record = JSON.parse(readFileSync(recordPath, 'utf8'));
assertValidRollbackRecord(record, { repository });
process.stdout.write(
  `${JSON.stringify({ event: 'staging.rollback.record.validated', incidentId: record.incidentId })}\n`,
);
