import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { validateDeploymentRecord } from './lib/cd-contract.mjs';

const [recordPathValue, repository] = process.argv.slice(2);
if (!recordPathValue || !repository) {
  throw new Error(
    'Usage: node scripts/validate-stable-deployment-record.mjs <stable-record.json> <repository>',
  );
}
const recordPath = resolve(recordPathValue);
if (!existsSync(recordPath)) throw new Error(`Stable deployment record not found: ${recordPath}`);
const record = JSON.parse(readFileSync(recordPath, 'utf8'));
validateDeploymentRecord(record, { repository, expectedDecision: 'PASS' });
if (record.stable !== true || record.status !== 'STABLE') {
  throw new Error('Stable deployment record must have stable=true and status=STABLE.');
}
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `image_ref=${record.imageRef}`,
      `commit_sha=${record.commitSha}`,
      `revision=${record.revision}`,
      `service_url=${record.serviceUrl}`,
      '',
    ].join('\n'),
    { flag: 'a' },
  );
}
process.stdout.write(
  `${JSON.stringify({ event: 'staging.stable_record.validated', revision: record.revision })}\n`,
);
