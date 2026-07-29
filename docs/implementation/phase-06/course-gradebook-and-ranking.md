# Phase 06 Course Gradebook And Ranking

## 1. Mục Đích

Gradebook và ranking là hai read model liên quan nhưng không đồng nghĩa. Gradebook trình bày
trạng thái/score theo activity; ranking dùng process score V1. Teacher cần thấy cả hai để hỗ
trợ Student mà không suy diễn Grade thành mức hoàn thành.

## 2. Gradebook Scope

- Actor phải là Teacher có quyền trên Course hoặc Super Admin có permission tương ứng.
- Course phải resolve trước roster/activity/Grade query.
- Rows lấy từ active roster theo reporting `asOf`.
- Columns lấy từ bounded visible activity set; mặc định gradable Quiz/Assignment, có option
  include required Lesson.
- Không tạo Grade/Submission placeholder để lấp ô.

## 3. Gradebook Column Contract

```ts
type GradebookActivityLifecycleStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'CLOSED'
  | 'ARCHIVED';

interface GradebookColumn {
  activityId: string;
  activityType: 'LESSON' | 'QUIZ' | 'ASSIGNMENT';
  title: string;
  isRequired: boolean;
  maxScore: number | null;
  effectiveDefaultDeadline: string | null;
  lifecycleStatus: GradebookActivityLifecycleStatus;
  position: number;
}
```

Column order: Course/module/activity position; tie-break `activityType`, `activityId`.
`CLOSED` chỉ hợp lệ với `ASSIGNMENT`; Lesson/Quiz không được phát sinh giá trị này.

## 4. Gradebook Row Contract

```ts
interface GradebookRow {
  student: {
    id: string;
    fullName: string;
    email: string;
    studentCode: string | null;
  };
  processScore: number | null;
  progressPercentage: number | null;
  returnedGradeAverage: number | null;
  missingCount: number;
  lateCount: number;
  cells: GradebookCell[];
}
```

Safe Student projection chỉ được trả sau Course ownership check.

## 5. Orthogonal Cell States

Một ô có thể vừa `LATE` vừa có Grade `RETURNED`; vì vậy không nén toàn bộ nghiệp vụ vào một
status. P06 trả hai chiều độc lập:

### 5.1 Completion Status

Reuse canonical derived learning status:

```text
NOT_STARTED | IN_PROGRESS | MISSING | COMPLETED | LATE
```

`LATE` vẫn là completed theo progress numerator. Activity không áp dụng cho Student dùng
`NOT_APPLICABLE`.

### 5.2 Grading Status

```text
NOT_GRADABLE
NOT_READY
AWAITING_GRADE
DRAFT
RETURNED
```

| Status | Rule |
| --- | --- |
| `NOT_GRADABLE` | Lesson hoặc activity không có score |
| `NOT_READY` | Quiz/Assignment chưa có terminal Student evidence |
| `AWAITING_GRADE` | Evidence terminal, chưa có Grade |
| `DRAFT` | Current Grade status `DRAFT`; chỉ Teacher thấy score/feedback |
| `RETURNED` | Current Grade status `RETURNED` |

Compact UI có thể derive `displayStatus`, nhưng metric/filter dùng hai source fields, không dùng
label hiển thị làm business truth.

## 6. Cell DTO

```ts
interface GradebookCell {
  activityId: string;
  completionStatus:
    | 'NOT_APPLICABLE'
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'MISSING'
    | 'COMPLETED'
    | 'LATE';
  gradingStatus: 'NOT_GRADABLE' | 'NOT_READY' | 'AWAITING_GRADE' | 'DRAFT' | 'RETURNED';
  displayStatus:
    | 'NOT_APPLICABLE'
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'MISSING'
    | 'COMPLETED'
    | 'LATE'
    | 'AWAITING_GRADE'
    | 'DRAFT_GRADE'
    | 'RETURNED';
  score: number | null;
  maxScore: number | null;
  normalizedScore: number | null;
  submittedAt: string | null;
  returnedAt: string | null;
  effectiveDeadline: string | null;
  isDeadlineExceptionApplied: boolean;
  allowedActions: ReportingAllowedAction[];
}
```

`ReportingAllowedAction` import/reuse từ canonical reporting constants; Gradebook cell thường chỉ
có `OPEN_GRADING` khi actor/scope/evidence cho phép.

`displayStatus` precedence cho compact UI:
`RETURNED -> DRAFT_GRADE -> AWAITING_GRADE -> MISSING -> LATE -> COMPLETED -> IN_PROGRESS ->
NOT_STARTED -> NOT_APPLICABLE`. Completion/late vẫn đọc từ `completionStatus`, kể cả khi
display đang ưu tiên Grade.

`score`/feedback draft chỉ hiện cho Teacher owned scope. `ungradedActivityCount` là số gradable
activity có terminal evidence và `gradingStatus` thuộc `AWAITING_GRADE/DRAFT`. Admin report
không dùng cell DTO.

## 7. Gradebook Filters And Bounds

| Query | Default | Allowed/bound |
| --- | --- | --- |
| `page` | `1` | `>=1` |
| `limit` | `20` | `1..50` Students |
| `search` | none | normalized, max 100 chars |
| `activityType` | `ALL` | Lesson/Quiz/Assignment |
| `completionStatus` | none | canonical completion status |
| `gradingStatus` | none | canonical grading status |
| `moduleId` | none | must belong to Course |
| `activityLimit` | `25` | `1..50` columns |
| `activityCursor` | none | opaque/server-issued |
| `sortBy` | `processScore` | allowlist only |
| `sortOrder` | `desc` | `asc/desc` |

Không trả toàn bộ Gradebook không giới hạn.

## 8. Ranking Contract

Teacher ranking row:

- rank;
- safe Student summary;
- required/completed count;
- progress/process score;
- returned Grade average;
- missing/late/ungraded count;
- last active;
- support flags;
- metric/freshness metadata ở envelope.

Support flags:

- `HAS_MISSING_WORK`;
- `HAS_UNGRADED_WORK`;
- `NO_RECENT_ACTIVITY` nếu rule/time window cấu hình;
- `NO_REQUIRED_ACTIVITY`;
- `PARTIAL_DATA`.

Flag là mô tả rule, không phải phán đoán năng lực.

## 9. Regrade And Deadline Recalculation

- Grade return/regrade cập nhật grade average/cell, không tự đổi process score.
- Submission unsubmit có thể reverse completion theo P05, làm progress/process score đổi.
- Deadline exception có thể đổi `completionStatus` `MISSING/LATE`, support flags và
  `displayStatus`; không đổi `gradingStatus`.
- Invalidation scope phải là Student/Course khi biết Student; Course-wide khi activity
  publish/required/default deadline thay đổi.

## 10. Empty And Error States

| State | API | UI |
| --- | --- | --- |
| No roster | `items=[]`, valid freshness | “Chưa có học sinh trong khóa học” |
| No activity | columns empty | Không render matrix rỗng; hướng về Content |
| No Grade | average `null` | `N/A`, không hiển thị `0` |
| Stale | snapshot + warning | Banner thời điểm cập nhật |
| Partial | valid rows + failed count | Banner + retry |
| Too many columns | cursor/truncated metadata | Pagination cột/filter |

## 11. Privacy And Audit

- Gradebook JSON view không cần AuditLog từng page trừ security policy; export bắt buộc audit.
- Không log CSV body, email list hoặc Grade detail.
- Teacher cross-Course `studentId` bị chặn trước Grade lookup.
- Student không có route Gradebook/ranking toàn lớp.

## 12. Acceptance Focus

- Stable ranking xuyên page.
- Draft Grade không lộ Student/Admin.
- Deadline exception phản ánh đúng từng Student.
- Grade average weighted by points.
- Không có N+1 Student x Activity x Grade.
- Max bounds và index/explain evidence đạt NFR.
