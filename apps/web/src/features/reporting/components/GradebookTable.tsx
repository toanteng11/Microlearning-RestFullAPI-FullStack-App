import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import { displayReportingPercentage } from '../reporting-format';
import type { GradebookColumn, GradebookRow } from '../reporting.types';
import { GradebookCell } from './GradebookCell';

export function GradebookTable({
  courseId,
  columns,
  rows,
  returnTo,
}: {
  courseId: string;
  columns: GradebookColumn[];
  rows: GradebookRow[];
  returnTo: string;
}) {
  const minimumWidth = Math.max(1040, 670 + columns.length * 190);
  return (
    <div
      className="reporting-table-scroll gradebook-table-scroll"
      role="region"
      aria-label="Bảng điểm Gradebook"
      tabIndex={0}
    >
      <table className="reporting-table gradebook-table" style={{ minWidth: minimumWidth }}>
        <thead>
          <tr>
            <th className="gradebook-student-column" scope="col">
              Student
            </th>
            <th scope="col">Điểm quá trình</th>
            <th scope="col">Tiến độ</th>
            <th scope="col">Điểm đã trả</th>
            {columns.map((column) => (
              <th key={column.activityId} scope="col">
                <span className="gradebook-column-title" title={column.title}>
                  {column.title}
                </span>
                <small>
                  {column.activityType} ·{' '}
                  {column.maxScore === null ? 'Không chấm điểm' : `${column.maxScore} điểm`}
                </small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const cells = new Map(row.cells.map((cell) => [cell.activityId, cell]));
            return (
              <tr key={row.student.id}>
                <th className="gradebook-student-column" scope="row">
                  <span className="reporting-wrap-text">{row.student.fullName}</span>
                  <small>{row.student.studentCode ?? row.student.email}</small>
                  <Link
                    className="gradebook-student-link"
                    to={`/teacher/courses/${courseId}/students/${row.student.id}/progress?returnTo=${encodeURIComponent(returnTo)}`}
                    aria-label={`Xem tiến độ của ${row.student.fullName}`}
                  >
                    <ExternalLink size={14} aria-hidden="true" /> Chi tiết
                  </Link>
                </th>
                <td>{displayReportingPercentage(row.processScore)}</td>
                <td>{displayReportingPercentage(row.progressPercentage)}</td>
                <td>
                  {displayReportingPercentage(row.returnedGradeAverage)}
                  <small>
                    Thiếu {row.missingCount} · Trễ {row.lateCount}
                  </small>
                </td>
                {columns.map((column) => {
                  const cell = cells.get(column.activityId);
                  return (
                    <td key={column.activityId}>
                      {cell ? (
                        <GradebookCell
                          cell={cell}
                          column={column}
                          studentName={row.student.fullName}
                        />
                      ) : (
                        <span className="gradebook-status">Không có dữ liệu</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
