import type { ReportFreshnessStatus, ReportingProgressStatus } from './reporting.types';

const progressLabels: Record<ReportingProgressStatus, string> = {
  NOT_STARTED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang học',
  MISSING: 'Thiếu bài',
  COMPLETED: 'Hoàn thành',
  LATE: 'Hoàn thành trễ',
};

const freshnessLabels: Record<ReportFreshnessStatus, string> = {
  FRESH: 'Dữ liệu mới',
  STALE: 'Cần cập nhật',
  PARTIAL: 'Dữ liệu một phần',
  REBUILDING: 'Đang tổng hợp',
  FAILED: 'Chưa thể tổng hợp',
};

export function reportingProgressLabel(status: ReportingProgressStatus) {
  return progressLabels[status];
}

export function reportingFreshnessLabel(status: ReportFreshnessStatus) {
  return freshnessLabels[status];
}

export function displayReportingPercentage(value: number | null) {
  return value === null ? 'N/A' : `${value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;
}

export function displayReportingDate(value: string | null, timezone = 'Asia/Ho_Chi_Minh') {
  if (!value) return 'Chưa có hoạt động';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(new Date(value));
}
