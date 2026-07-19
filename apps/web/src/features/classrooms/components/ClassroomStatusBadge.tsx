import { classroomStatusLabel } from '../classroom-format';

export function ClassroomStatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-badge--${status.toLowerCase()}`}>
      {classroomStatusLabel(status)}
    </span>
  );
}
