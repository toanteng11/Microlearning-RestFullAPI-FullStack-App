import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ProgressStatusBadge } from '../../learning/components/LearningStatusBadge';
import { displayReportingDate, displayReportingPercentage } from '../reporting-format';
import type { TeacherProgressRow } from '../reporting.types';

export function TeacherProgressTable({
  courseId,
  rows,
  returnTo,
}: {
  courseId: string;
  rows: readonly TeacherProgressRow[];
  returnTo: string;
}) {
  if (rows.length === 0) {
    return <p className="muted-text">Không có Student phù hợp với bộ lọc hiện tại.</p>;
  }
  return (
    <div className="reporting-table-scroll" role="region" aria-label="Bảng xếp hạng tiến độ">
      <table className="reporting-table teacher-progress-table">
        <thead>
          <tr>
            <th scope="col">Hạng</th>
            <th scope="col">Student</th>
            <th scope="col">Hoàn thành</th>
            <th scope="col">Điểm quá trình</th>
            <th scope="col">Grade đã trả</th>
            <th scope="col">Thiếu / Trễ</th>
            <th scope="col">Hoạt động gần nhất</th>
            <th scope="col" aria-label="Chi tiết" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.student.id}>
              <td data-label="Hạng">{row.rank}</td>
              <td data-label="Student">
                <strong className="reporting-wrap-text">{row.student.fullName}</strong>
                <small>{row.student.studentCode ?? row.student.email}</small>
                <ProgressStatusBadge status={row.progressStatus} />
              </td>
              <td data-label="Hoàn thành">
                {row.completedRequiredCount}/{row.requiredActivityCount}
              </td>
              <td data-label="Điểm quá trình">{displayReportingPercentage(row.processScore)}</td>
              <td data-label="Grade đã trả">
                {displayReportingPercentage(row.returnedGradeAverage)}
              </td>
              <td data-label="Thiếu / Trễ">
                {row.missingCount} / {row.lateCount}
              </td>
              <td data-label="Hoạt động gần nhất">{displayReportingDate(row.lastActiveAt)}</td>
              <td data-label="Chi tiết">
                <Link
                  className="icon-link"
                  aria-label={`Xem tiến độ của ${row.student.fullName}`}
                  title="Xem tiến độ Student"
                  to={`/teacher/courses/${courseId}/students/${row.student.id}/progress?returnTo=${encodeURIComponent(returnTo)}`}
                >
                  <ExternalLink size={17} aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
