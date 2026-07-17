import type { TeacherInvitationStatus } from '../teacher-invitation.types';

const LABELS: Record<TeacherInvitationStatus, string> = {
  PENDING: 'Chờ kích hoạt',
  ACCEPTED: 'Đã chấp nhận',
  EXPIRED: 'Đã hết hạn',
  REVOKED: 'Đã thu hồi',
};

export function InvitationStatusBadge({ status }: { status: TeacherInvitationStatus }) {
  return (
    <span className={`status-badge status-badge--${status.toLowerCase()}`}>{LABELS[status]}</span>
  );
}
