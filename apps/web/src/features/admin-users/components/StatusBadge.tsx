import type { AccountStatus } from '../admin-user.types';
import { accountStatusLabel } from '../account-status';

export function StatusBadge({ status }: { status: AccountStatus }) {
  return (
    <span className={`status-badge status-badge--${status.toLowerCase()}`}>
      {accountStatusLabel(status)}
    </span>
  );
}
