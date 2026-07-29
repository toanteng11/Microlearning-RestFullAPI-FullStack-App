import type { ReportingGovernanceCounts } from './reporting.types.js';

export interface ReportingGovernanceReader {
  readCounts(): Promise<ReportingGovernanceCounts>;
  getSourceWatermark(): Promise<Date | null>;
}
