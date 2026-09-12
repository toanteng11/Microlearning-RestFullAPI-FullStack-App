import { readJson, writeValidationReport, emitValidationEvent } from './lib/phase-08-cli.mjs';
import { validatePhase08QualitySummary } from './lib/phase-08-quality.mjs';

const [recordPath, outputPath] = process.argv.slice(2);
const { value: record } = readJson(recordPath, 'Phase 08 quality summary');
validatePhase08QualitySummary(record);
writeValidationReport(outputPath, 'QUALITY_VERIFICATION_SUMMARY', record);
emitValidationEvent('phase-08.quality.validated', { status: record.status });
