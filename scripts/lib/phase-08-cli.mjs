import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { redactPhase08Report } from './phase-08-contract.mjs';

export function readJson(pathValue, label = 'record') {
  if (!pathValue) throw new Error(`${label} path is required.`);
  const path = resolve(pathValue);
  if (!existsSync(path)) throw new Error(`${label} not found: ${path}`);
  try {
    return { path, value: JSON.parse(readFileSync(path, 'utf8')) };
  } catch (error) {
    throw new Error(
      `${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

export function writeValidationReport(outputPathValue, recordType, record, status = 'VALID') {
  if (!outputPathValue) return;
  const outputPath = resolve(outputPathValue);
  const report = redactPhase08Report({
    schemaVersion: 1,
    phase: '08',
    recordType,
    validationStatus: status,
    validatedAtUtc: new Date().toISOString(),
    record,
  });
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

export function emitValidationEvent(event, details = {}) {
  process.stdout.write(`${JSON.stringify({ event, ...details })}\n`);
}
