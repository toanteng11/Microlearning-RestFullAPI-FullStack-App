import { RotateCcw, SlidersHorizontal } from 'lucide-react';

import type { GradebookQuery } from '../reporting.types';

export interface GradebookFilterValues {
  search?: string;
  activityType?: string;
  completionStatus?: string;
  gradingStatus?: string;
  sortBy: string;
  sortOrder: string;
}

export function GradebookFilters({
  query,
  onApply,
  onReset,
}: {
  query: GradebookQuery;
  onApply: (values: GradebookFilterValues) => void;
  onReset: () => void;
}) {
  return (
    <form
      className="reporting-filter-bar gradebook-filter-bar"
      key={[
        query.search,
        query.activityType,
        query.completionStatus,
        query.gradingStatus,
        query.sortBy,
        query.sortOrder,
      ].join(':')}
      onSubmit={(event) => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        const value = (name: string) => String(values.get(name) ?? '').trim() || undefined;
        onApply({
          search: value('search'),
          activityType: value('activityType'),
          completionStatus: value('completionStatus'),
          gradingStatus: value('gradingStatus'),
          sortBy: value('sortBy') ?? 'processScore',
          sortOrder: value('sortOrder') ?? 'desc',
        });
      }}
    >
      <label>
        Tìm Student
        <input
          type="search"
          name="search"
          maxLength={100}
          defaultValue={query.search ?? ''}
          placeholder="Tên, email hoặc mã Student"
        />
      </label>
      <label>
        Loại hoạt động
        <select name="activityType" defaultValue={query.activityType ?? ''}>
          <option value="">Quiz và Assignment</option>
          <option value="LESSON">Lesson bắt buộc</option>
          <option value="QUIZ">Quiz</option>
          <option value="ASSIGNMENT">Assignment</option>
        </select>
      </label>
      <label>
        Trạng thái hoàn thành
        <select name="completionStatus" defaultValue={query.completionStatus ?? ''}>
          <option value="">Tất cả</option>
          <option value="NOT_APPLICABLE">Không áp dụng</option>
          <option value="NOT_STARTED">Chưa bắt đầu</option>
          <option value="IN_PROGRESS">Đang thực hiện</option>
          <option value="MISSING">Thiếu</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="LATE">Hoàn thành trễ</option>
        </select>
      </label>
      <label>
        Trạng thái chấm điểm
        <select name="gradingStatus" defaultValue={query.gradingStatus ?? ''}>
          <option value="">Tất cả</option>
          <option value="NOT_GRADABLE">Không chấm điểm</option>
          <option value="NOT_READY">Chưa sẵn sàng</option>
          <option value="AWAITING_GRADE">Chờ chấm</option>
          <option value="DRAFT">Điểm nháp</option>
          <option value="RETURNED">Đã trả điểm</option>
        </select>
      </label>
      <label>
        Sắp xếp
        <select name="sortBy" defaultValue={query.sortBy}>
          <option value="processScore">Điểm quá trình</option>
          <option value="progressPercentage">Tiến độ</option>
          <option value="returnedGradeAverage">Điểm đã trả</option>
          <option value="missingCount">Số bài thiếu</option>
          <option value="lateCount">Số bài trễ</option>
          <option value="fullName">Tên Student</option>
        </select>
      </label>
      <label>
        Thứ tự
        <select name="sortOrder" defaultValue={query.sortOrder}>
          <option value="desc">Giảm dần</option>
          <option value="asc">Tăng dần</option>
        </select>
      </label>
      <button type="submit">
        <SlidersHorizontal size={16} aria-hidden="true" /> Áp dụng
      </button>
      <button type="button" className="button-secondary" onClick={onReset}>
        <RotateCcw size={16} aria-hidden="true" /> Đặt lại
      </button>
    </form>
  );
}
