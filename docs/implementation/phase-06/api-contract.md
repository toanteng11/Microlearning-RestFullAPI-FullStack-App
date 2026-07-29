# Phase 06 API Contract

## 1. Conventions

- Base: `/api/v1`.
- Auth: access token/session contract hiện có.
- JSON response: `{ success, data, meta? }`.
- Pagination: `{ page, limit, totalItems, totalPages, hasNextPage, hasPreviousPage }`.
- Dates: ISO 8601 UTC; filter timezone trả lại trong metadata.
- Unknown query fields/sort values: `400 VALIDATION_ERROR`.
- Aggregate response có definition/freshness metadata.
- Private response mặc định `Cache-Control: no-store`.

## 2. Shared Reporting Metadata

```ts
type ReportDataState = 'READY' | 'NO_DATA' | 'SUPPRESSED';
type ReportFilterValue = string | number | boolean | null | readonly string[];

interface ReportMetadata {
  reportId: string;
  definitionVersion: string;
  sourceMetricVersion: string | null;
  descriptorVersion: string | null;
  dataState: ReportDataState;
  timezone: string;
  asOf: string;
  generatedAt: string;
  freshness: {
    status: 'FRESH' | 'STALE' | 'PARTIAL' | 'REBUILDING' | 'FAILED';
    recalculatedAt: string | null;
    sourceChangedAt: string | null;
    staleAfterSeconds: number;
    failedItemsCount: number;
  };
  filters: Record<string, ReportFilterValue>;
}
```

`report-dto-and-query-contracts.md` là canonical DTO source; ví dụ trong tài liệu này phải khớp
field required/nullability tại đó.

## 3. Student Endpoints

| Method/Path | Permission | Behavior |
| --- | --- | --- |
| `GET /students/me/dashboard` | `learning.view_enrolled` | Dashboard summary, To-do preview, Course progress, recent returned Grade |
| `GET /students/me/progress` | `learning.view_enrolled` | Existing Course progress; P06 metric/freshness |
| `GET /students/me/progress/courses` | `learning.view_enrolled` | Paginated all enrolled Course summaries |
| `GET /students/me/progress/trend` | `learning.view_enrolled`, Conditional | Compatible Course snapshots |
| `GET /students/me/grades` | `grade.view_own` | Existing returned Grade list |

### 3.1 Student Dashboard Query

`todoLimit=1..10`, `courseLimit=1..10`, `gradeLimit=1..10`, optional timezone; mỗi limit mặc
định `5`. Không nhận `studentId`.

### 3.2 Course Progress Query

`courseId` required cho existing detail. All-course route dùng `page/limit/progressStatus`,
`sortBy=courseTitle|processScore|lastActiveAt`, `sortOrder=asc|desc`. Trend Conditional yêu cầu
`courseId` và bounded date range.

## 4. Teacher Endpoints

P06 giữ path/permission hiện có nhưng thực hiện coordinated contract cutover; endpoint mới là
additive:

| Method/Path | Permission | Report |
| --- | --- | --- |
| `GET /teacher/courses/:courseId/dashboard` | `course.progress_view_owned` | Course summary/top activities/top ranking |
| `GET /teacher/courses/:courseId/activities` | `course.progress_view_owned` | Activity analysis |
| `GET /teacher/courses/:courseId/students` | `course.progress_view_owned` | Student list alphabetic |
| `GET /teacher/courses/:courseId/progress` | `course.progress_view_owned` | Stable process-score ranking |
| `GET /teacher/courses/:courseId/students/:studentId/progress` | `course.progress_view_owned` | Student learning detail |
| `GET /teacher/courses/:courseId/assessments/analytics` | `course.progress_view_owned` | Quiz/Assignment metrics |
| `GET /teacher/courses/:courseId/gradebook` | `grade.manage_owned` | Gradebook |
| `GET /teacher/courses/:courseId/gradebook/export` | `report.export_owned`, Conditional | CSV stream |

### 4.1 Ranking Query

```text
page=1
limit=20 (max 50)
search?
progressStatus?
supportFlag?
sortBy=processScore|progressPercentage|returnedGradeAverage|missingCount|lateCount|lastActiveAt|fullName
sortOrder=asc|desc
timezone=Asia/Ho_Chi_Minh
```

Default sort contract vẫn áp dụng khi query không có sort.

### 4.2 Gradebook Query

Theo `course-gradebook-and-ranking.md`: Student page/limit, activity type,
`completionStatus`, `gradingStatus`, module, activity cursor/limit và sort allowlist.
`displayStatus` không phải query field.

## 5. Admin Endpoints

| Method/Path | Permission | Report |
| --- | --- | --- |
| `GET /admin/dashboard` | `report.view_governance` | Governance summary |
| `GET /admin/reports/governance` | `report.view_governance` | User/invitation/Classroom/Course/enrollment aggregate |
| `GET /admin/reports/adoption` | `report.view_governance`, Conditional | Trend aggregate |
| `GET /admin/reports/learning-outcomes` | `report.view_governance`, Conditional | Privacy-threshold aggregate |
| `GET /admin/reports/export` | `report.export_governance`, Conditional | CSV stream |
| `GET /admin/audit-logs` | `report.audit_view` | Audit list/projection |
| `GET /admin/audit-logs/export` | `report.export_governance`, Conditional | CSV audit projection |

Date filter `from/to/timezone` và report-specific allowlist. Date range mặc định `30` days,
max `365` days.

## 6. Conditional Analytics Endpoint

| Method/Path | Permission | Behavior |
| --- | --- | --- |
| `POST /analytics/events` | Authenticated active actor, Conditional | Validate allowlisted event schema, idempotent by eventId |

Response `202` accepted hoặc idempotent `200`; event failure không được chặn business workflow.

## 7. Example Ranking Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "rank": 1,
        "student": {
          "id": "66a...",
          "fullName": "Nguyen Van A",
          "email": "student@example.test",
          "studentCode": "STU001"
        },
        "requiredActivityCount": 10,
        "completedRequiredCount": 9,
        "progressPercentage": 90,
        "processScore": 90,
        "progressStatus": "IN_PROGRESS",
        "returnedGradeAverage": 82.5,
        "missingCount": 0,
        "lateCount": 1,
        "ungradedCount": 1,
        "lastActiveAt": "2026-07-28T02:00:00.000Z",
        "courseCompleted": false,
        "supportFlags": ["HAS_UNGRADED_WORK"],
        "allowedActions": ["VIEW_STUDENT_PROGRESS"]
      }
    ],
    "reporting": {
      "reportId": "RPT-TEA-003",
      "definitionVersion": "P06_TEACHER_RANKING_V1",
      "sourceMetricVersion": "P05_REQUIRED_ACTIVITY_COMPLETION_V1",
      "descriptorVersion": "P05_ACTIVITY_DESCRIPTOR_V2",
      "dataState": "READY",
      "timezone": "Asia/Ho_Chi_Minh",
      "asOf": "2026-07-28T03:00:00.000Z",
      "generatedAt": "2026-07-28T03:00:00.100Z",
      "freshness": {
        "status": "FRESH",
        "recalculatedAt": "2026-07-28T02:59:59.000Z",
        "sourceChangedAt": "2026-07-28T02:59:50.000Z",
        "staleAfterSeconds": 300,
        "failedItemsCount": 0
      },
      "filters": {
        "sortBy": "processScore",
        "sortOrder": "desc"
      }
    }
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## 8. Error Catalog

| HTTP | Code | Condition |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Invalid filter/sort/timezone/object ID |
| 401 | `AUTHENTICATION_REQUIRED` | Session absent/expired |
| 403 | `ACCESS_DENIED` | Permission denied |
| 404 | `RESOURCE_NOT_FOUND` | Resource absent/out-of-scope per anti-enumeration |
| 409 | `METRIC_VERSION_MISMATCH` | Incompatible summary/definition |
| 409 | `REPORT_REBUILD_IN_PROGRESS` | Scope locked and no usable snapshot |
| 422 | `REPORT_LIMIT_EXCEEDED` | Row/date/column bound exceeded |
| 429 | `RATE_LIMITED` | Report/event abuse threshold |
| 503 | `REPORT_NOT_READY` | No trustworthy read model and rebuild failed |
| 503 | `DEPENDENCY_UNAVAILABLE` | Mongo/source unavailable |
| 503 | `FEATURE_DISABLED` | `REPORTING_ENABLED=false` trên P06-owned route |

Error response dùng standard `AppError` contract với `requestId`, không lộ stack/secret.

## 9. Compatibility

- P06 thực hiện coordinated contract correction: `progressPercentage`,
  `averageProgressPercentage` và `completionPercentage` là `number | null` khi denominator bằng
  `0`. Current Student Progress đã nullable; Teacher P05 fields phải được cập nhật cùng Web,
  OpenAPI và regression tests trong một PR.
- Dự án chưa có external production API consumer, vì vậy không duy trì song song hai field mang
  cùng ý nghĩa. Nếu xuất hiện external consumer trước cutover, phải phát hành API version mới.
- OpenAPI test phải assert route/permission/query/response/error parity.
- Web types được derive/maintain cùng contract; không `any`.

## 10. HTTP Caching And Headers

- JSON private: `Cache-Control: no-store`.
- CSV: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition` safe filename.
- Optional metadata headers: `X-Report-Id`, `X-Definition-Version`, `X-Generated-At`.
- Correlation/request ID luôn có theo middleware hiện tại.
