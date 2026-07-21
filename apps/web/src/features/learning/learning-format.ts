import type { ContentStatus, DerivedLearningStatus } from './learning.types';

export function displayLearningDate(value: string | null | undefined): string {
  if (!value) return 'Chưa đặt';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function contentStatusLabel(status: ContentStatus): string {
  const labels: Record<ContentStatus, string> = {
    DRAFT: 'Bản nháp',
    SCHEDULED: 'Đã lên lịch',
    PUBLISHED: 'Đã xuất bản',
    UNPUBLISHED: 'Đã thu hồi',
    ARCHIVED: 'Đã lưu trữ',
  };
  return labels[status];
}

export function progressStatusLabel(status: DerivedLearningStatus): string {
  const labels: Record<DerivedLearningStatus, string> = {
    NOT_STARTED: 'Chưa bắt đầu',
    IN_PROGRESS: 'Đang học',
    MISSING: 'Quá hạn',
    COMPLETED: 'Đã hoàn thành',
    LATE: 'Hoàn thành trễ',
  };
  return labels[status];
}

export function requestErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
