import type { AccountStatus } from '../admin-user.types';

const STATUS_LABELS: Record<AccountStatus, string> = {
  PENDING: 'Chờ kích hoạt',
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  BLOCKED: 'Đã khóa',
  DELETED: 'Đã xóa',
};

export function StatusBadge({ status }: { status: AccountStatus }) {
  return (
    <span className={`status-badge status-badge--${status.toLowerCase()}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
