import { AlertTriangle, RefreshCw } from 'lucide-react';

import { displayReportingDate, reportingFreshnessLabel } from '../reporting-format';
import type { ReportMetadata } from '../reporting.types';

export function ReportingFreshnessNotice({
  metadata,
  refreshing,
  onRefresh,
}: {
  metadata: ReportMetadata;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const status = metadata.freshness.status;
  if (status === 'FRESH') {
    return (
      <p className="reporting-freshness reporting-freshness--fresh">
        Cập nhật lúc {displayReportingDate(metadata.freshness.recalculatedAt, metadata.timezone)}
      </p>
    );
  }
  return (
    <div className="reporting-freshness reporting-freshness--warning" role="status">
      <AlertTriangle size={18} aria-hidden="true" />
      <div>
        <strong>{reportingFreshnessLabel(status)}</strong>
        <span>
          Cập nhật gần nhất:{' '}
          {displayReportingDate(metadata.freshness.recalculatedAt, metadata.timezone)}
          {metadata.freshness.failedItemsCount > 0
            ? ` · ${metadata.freshness.failedItemsCount} mục chưa tổng hợp`
            : ''}
        </span>
      </div>
      <button type="button" onClick={onRefresh} disabled={refreshing}>
        <RefreshCw size={16} aria-hidden="true" />
        {refreshing ? 'Đang tải' : 'Thử lại'}
      </button>
    </div>
  );
}
