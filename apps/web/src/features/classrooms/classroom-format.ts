export function displayDate(value: string | null | undefined): string {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function classroomStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Đang hoạt động',
    ARCHIVED: 'Đã lưu trữ',
    LOCKED: 'Đã khóa',
    OPEN: 'Đang mở',
    CLOSED: 'Đã đóng',
    DISABLED: 'Đã vô hiệu',
    REGENERATED: 'Đã thay thế',
    EXPIRED: 'Hết hạn',
    REMOVED: 'Đã rời lớp',
  };
  return labels[status] ?? status;
}
