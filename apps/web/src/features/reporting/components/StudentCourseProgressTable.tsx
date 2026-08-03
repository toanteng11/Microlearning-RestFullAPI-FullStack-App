import { Link } from 'react-router-dom';

import { ProgressStatusBadge } from '../../learning/components/LearningStatusBadge';
import { displayReportingDate, displayReportingPercentage } from '../reporting-format';
import type { StudentCourseProgressSummary } from '../reporting.types';

export function StudentCourseProgressTable({
  items,
  timezone,
}: {
  items: readonly StudentCourseProgressSummary[];
  timezone: string;
}) {
  return (
    <div className="data-table-wrap data-table-wrap--responsive reporting-progress-table">
      <table className="data-table">
        <thead>
          <tr>
            <th>Khóa học</th>
            <th>Tiến độ</th>
            <th>Điểm quá trình</th>
            <th>Thiếu / trễ</th>
            <th>Hoạt động cuối</th>
            <th>
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.course.id}>
              <td data-label="Khóa học">
                <strong>{item.course.title}</strong>
                <small>{item.classroom.name}</small>
              </td>
              <td data-label="Tiến độ">
                <ProgressStatusBadge status={item.progressStatus} />
                <div className="reporting-progress-value">
                  {item.progressPercentage === null ? (
                    <span title="Khóa học chưa có nội dung bắt buộc">N/A</span>
                  ) : (
                    <progress
                      max={100}
                      value={item.progressPercentage}
                      aria-label={`Tiến độ ${item.course.title}`}
                      aria-valuetext={displayReportingPercentage(item.progressPercentage)}
                    />
                  )}
                  <small>
                    {item.completedRequiredCount}/{item.requiredActivityCount} hoạt động
                  </small>
                </div>
              </td>
              <td data-label="Điểm quá trình">{displayReportingPercentage(item.processScore)}</td>
              <td data-label="Thiếu / trễ">
                {item.missingCount} / {item.lateCount}
              </td>
              <td data-label="Hoạt động cuối">
                {displayReportingDate(item.lastActiveAt, timezone)}
              </td>
              <td data-label="Thao tác">
                <span className="row-actions">
                  <Link className="row-link" to={item.actionUrl}>
                    Mở khóa học
                  </Link>
                  {item.allowedActions.includes('VIEW_PROGRESS_TREND') ? (
                    <Link className="row-link" to={`/student/progress/${item.course.id}/trend`}>
                      Xu hướng
                    </Link>
                  ) : null}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
