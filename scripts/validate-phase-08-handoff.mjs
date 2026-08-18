import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { assertValidPhase08Handoff } from './lib/handoff-contract.mjs';

const pathValue = process.argv[2];
if (!pathValue)
  throw new Error('Usage: node scripts/validate-phase-08-handoff.mjs <handoff-record.json>');
const path = resolve(pathValue);
if (!existsSync(path)) throw new Error(`Handoff record not found: ${path}`);
const record = JSON.parse(readFileSync(path, 'utf8'));
assertValidPhase08Handoff(record);
process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.handoff.validated', accepted: record.accepted })}\n`,
);
