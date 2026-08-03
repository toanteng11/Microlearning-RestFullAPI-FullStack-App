import type { ReportDataState } from '../reporting.types';

export function SuppressedMetric({
  value,
  dataState,
}: {
  value: number | null;
  dataState: ReportDataState;
}) {
  if (dataState === 'SUPPRESSED' || value === null) {
    return <span aria-label="Dữ liệu được bảo vệ do nhóm nhỏ">N/A</span>;
  }
  return <>{value}</>;
}
