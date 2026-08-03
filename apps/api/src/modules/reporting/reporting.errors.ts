import { AppError } from '../../shared/errors/app-error.js';

export const REPORTING_ERROR_CODES = [
  'REPORTING_DISABLED',
  'REPORT_NOT_READY',
  'REPORTING_REVISION_CONFLICT',
  'REPORTING_DEFINITION_MISMATCH',
  'REPORTING_INVALIDATION_CLAIM_LOST',
  'REPORTING_REBUILD_FAILED',
] as const;

export type ReportingErrorCode = (typeof REPORTING_ERROR_CODES)[number];

export function reportingError(
  statusCode: number,
  code: ReportingErrorCode,
  message: string,
): AppError {
  return new AppError(statusCode, code, message);
}
