import type { ReportMetadata } from './reporting.types.js';

export function toReportMetadataDto(metadata: ReportMetadata) {
  return {
    ...metadata,
    asOf: metadata.asOf.toISOString(),
    generatedAt: metadata.generatedAt.toISOString(),
    freshness: {
      ...metadata.freshness,
      recalculatedAt: metadata.freshness.recalculatedAt?.toISOString() ?? null,
      sourceChangedAt: metadata.freshness.sourceChangedAt?.toISOString() ?? null,
    },
  };
}
