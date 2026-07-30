import { ExternalLink, TimerReset } from 'lucide-react';
import { Link } from 'react-router-dom';

import type {
  GradebookCell as GradebookCellData,
  GradebookColumn,
  GradebookDisplayStatus,
} from '../reporting.types';

const labels: Record<GradebookDisplayStatus, string> = {
  NOT_APPLICABLE: 'Không áp dụng',
  NOT_STARTED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang thực hiện',
  MISSING: 'Thiếu',
  COMPLETED: 'Hoàn thành',
  LATE: 'Hoàn thành trễ',
  AWAITING_GRADE: 'Chờ chấm',
  DRAFT_GRADE: 'Điểm nháp',
  RETURNED: 'Đã trả điểm',
};

function gradingUrl(column: GradebookColumn) {
  if (column.activityType === 'QUIZ') return `/teacher/quizzes/${column.activityId}/results`;
  if (column.activityType === 'ASSIGNMENT')
    return `/teacher/assignments/${column.activityId}/submissions`;
  return null;
}

export function GradebookCell({
  cell,
  column,
  studentName,
}: {
  cell: GradebookCellData;
  column: GradebookColumn;
  studentName: string;
}) {
  const actionUrl = gradingUrl(column);
  return (
    <div className="gradebook-cell">
      <span className={`gradebook-status gradebook-status--${cell.displayStatus.toLowerCase()}`}>
        {labels[cell.displayStatus]}
      </span>
      <strong className="gradebook-score">
        {cell.score === null || cell.maxScore === null ? 'N/A' : `${cell.score}/${cell.maxScore}`}
      </strong>
      <small>
        Hoàn thành: {cell.completionStatus} · Chấm điểm: {cell.gradingStatus}
      </small>
      {cell.isDeadlineExceptionApplied ? (
        <span className="gradebook-exception" title="Deadline riêng đang được áp dụng">
          <TimerReset size={14} aria-hidden="true" /> Deadline riêng
        </span>
      ) : null}
      {actionUrl && cell.allowedActions.includes('OPEN_GRADING') ? (
        <Link
          className="gradebook-cell-action"
          to={actionUrl}
          aria-label={`Mở chấm điểm ${column.title} của ${studentName}`}
        >
          <ExternalLink size={15} aria-hidden="true" /> Chấm điểm
        </Link>
      ) : null}
    </div>
  );
}
