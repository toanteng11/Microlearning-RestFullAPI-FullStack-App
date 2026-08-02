import type { ReportDataState } from './reporting.types.js';

export interface ProtectedSensitiveAggregate<T> {
  value: T | null;
  dataState: Extract<ReportDataState, 'READY' | 'SUPPRESSED'>;
  dataSuppressed: boolean;
  suppressionReason: 'SMALL_GROUP' | null;
}

export function protectSensitiveAggregate<T>(
  groupSize: number,
  value: T,
  minimumGroupSize: number,
): ProtectedSensitiveAggregate<T> {
  if (groupSize < minimumGroupSize) {
    return {
      value: null,
      dataState: 'SUPPRESSED',
      dataSuppressed: true,
      suppressionReason: 'SMALL_GROUP',
    };
  }
  return {
    value,
    dataState: 'READY',
    dataSuppressed: false,
    suppressionReason: null,
  };
}
