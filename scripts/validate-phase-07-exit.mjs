import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { assertValidPhase07Exit } from './lib/exit-contract.mjs';

const pathValue = process.argv[2];
if (!pathValue)
  throw new Error('Usage: node scripts/validate-phase-07-exit.mjs <exit-record.json>');
const path = resolve(pathValue);
if (!existsSync(path)) throw new Error(`Exit record not found: ${path}`);
const record = JSON.parse(readFileSync(path, 'utf8'));
assertValidPhase07Exit(record);
process.stdout.write(
  `${JSON.stringify({ event: 'phase-07.exit.validated', decision: record.decision })}\n`,
);
