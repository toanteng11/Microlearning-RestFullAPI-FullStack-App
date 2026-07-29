# Phase 06 Source File Blueprint

## 1. Mục Đích

Blueprint chỉ rõ file cần Create/Modify theo repo hiện tại. Tên cuối có thể điều chỉnh theo
pattern thực tế, nhưng module boundary/contract không được thay đổi âm thầm.

## 2. Cross-Cutting Files Modify

| File | Change |
| --- | --- |
| `.env.example` | Thêm env P06, Conditional mặc định false |
| `package.json` | Scripts rebuild/reconcile nếu dùng root forwarding |
| `apps/api/package.json` | `reporting:rebuild`, `reporting:reconcile`, benchmark |
| `apps/api/src/shared/config/environment.ts` | Zod env schema/config |
| `apps/api/src/shared/auth/permissions.ts` | Permissions/role grants |
| `apps/api/src/app.ts` | Create one P06 foundation; inject one writer instance into P04/P05; mount P06 router |
| `apps/api/src/modules/phase-four.router.ts` | Remove moved Student/Teacher reporting route registrations; require invalidation writer dependency |
| `apps/api/src/modules/phase-five.router.ts` | Remove old Gradebook route; require invalidation writer dependency |
| `apps/api/src/docs/openapi.ts` | Compose P06 OpenAPI operations/schemas/tags |
| `apps/api/src/scripts/seed-demo.ts` | Deterministic reporting dataset |
| `apps/web/src/app/router.tsx` | Reporting routes/permissions |
| `apps/web/src/shared/components/AppShell.tsx` | Actor navigation |
| `apps/web/src/styles.css` | Reporting layout, responsive, no overlap |
| `.github/workflows/ci.yml` | P06 integration/E2E/benchmark gates nếu cần |
| `docker-compose.yml` | Env/seed only; không thêm service tùy tiện |

## 3. Backend Files Create

```text
apps/api/src/modules/reporting/
|-- reporting.constants.ts
|-- reporting.types.ts
|-- reporting.schemas.ts
|-- reporting.dto.ts
|-- reporting.errors.ts
|-- metric-definition.policy.ts
|-- process-score.policy.ts
|-- grade-average.policy.ts
|-- ranking.policy.ts
|-- gradebook-cell.policy.ts
|-- reporting-scope.reader.ts
|-- reporting-roster.reader.ts
|-- reporting-activity.reader.ts
|-- reporting-progress.reader.ts
|-- reporting-grade.reader.ts
|-- reporting-governance.reader.ts
|-- reporting-audit.reader.ts
|-- course-progress-summary.model.ts
|-- course-progress-summary.repository.ts
|-- reporting-invalidation.model.ts
|-- reporting-invalidation.repository.ts
|-- course-progress.calculator.ts
|-- reporting-refresh.service.ts
|-- reporting-reconciliation.service.ts
|-- student-reporting.service.ts
|-- teacher-reporting.service.ts
|-- gradebook-reporting.service.ts
|-- admin-reporting.service.ts
|-- report-export.service.ts
|-- csv-report.serializer.ts
|-- analytics-event.model.ts
`-- analytics-event.service.ts
```

Conditional files chỉ tạo khi item được bật; không commit unused model/service.

Phase composition theo pattern hiện tại:

```text
apps/api/src/modules/phase-six.foundation.ts
apps/api/src/modules/phase-six.router.ts
```

Neutral producer port:

```text
apps/api/src/modules/learning-content/reporting-invalidation.writer.ts
```

P04/P05 source services import interface này; Mongo implementation nằm trong P06 reporting
module. Không import P06 Mongoose models vào producer services.

### 3.1 Composition Root Contract

Source hiện tại tạo repository/service bên trong `createPhaseFourRouter` và
`createPhaseFiveRouter`. P06 giữ pattern factory nhưng làm writer dependency bắt buộc:

```ts
export interface PhaseFourRouterDependencies {
  reportingInvalidationWriter: ReportingInvalidationWriter;
}

export interface PhaseFiveRouterDependencies {
  reportingInvalidationWriter: ReportingInvalidationWriter;
}

export function createPhaseFourRouter(
  config: AppConfig,
  classrooms: ClassroomRepository,
  dependencies: PhaseFourRouterDependencies,
): Router;

export function createPhaseFiveRouter(
  config: AppConfig,
  classrooms: ClassroomRepository,
  dependencies: PhaseFiveRouterDependencies,
): Router;
```

`app.ts` tạo `phaseSixFoundation` một lần, truyền
`phaseSixFoundation.reportingInvalidationWriter` vào cả hai router và truyền chính foundation đó
vào `createPhaseSixRouter`. Không tạo writer riêng theo router vì sẽ làm khó kiểm soát
configuration, test và claim/repository lifecycle.

Không định nghĩa default/noop writer trong production factory. Focused unit test muốn cô lập
reporting phải truyền fake/noop rõ ràng; integration test dùng Mongo writer thật và replica set.

## 4. Producer Adapter Files

Ưu tiên adapter ở reporting integration layer hoặc producer public port:

```text
apps/api/src/modules/reporting/adapters/
|-- mongo-reporting-scope.reader.ts
|-- mongo-reporting-roster.reader.ts
|-- mongo-reporting-activity.reader.ts
|-- mongo-reporting-progress.reader.ts
|-- mongo-reporting-grade.reader.ts
|-- mongo-reporting-governance.reader.ts
`-- mongo-reporting-audit.reader.ts
```

Nếu producer đã có safe reader, reuse/extend additive thay vì duplicate repository.

## 5. Existing Backend Files Likely Modify

| Area/file | Change |
| --- | --- |
| `learning-progress/teacher-course-dashboard.service.ts` | Delegate/compat adapter tới P06, stable nullable metric |
| `learning-progress/student-learning.service.ts` | Inject writer; wrap `start/complete` source write + invalidation trong transaction; giữ To-do contract |
| `learning-progress/learning-progress.repository.ts` | Truyền optional `ClientSession`; batch/source watermark methods nếu cần |
| `grades/grade.repository.ts` | Batch current Grade projection |
| `grades/grade.service.ts` | Gradebook ownership migration/compat + durable Grade invalidation trong existing transaction |
| `quiz-attempts/quiz-review.service.ts` | Inject writer; wrap `saveReview` trong transaction; invalidate review/finalize/release/regrade |
| `quiz-attempts/quiz-attempt.service.ts` | Invalidate start/submit/timeout trong existing transaction; không invalidate `saveAnswers` V1 |
| Enrollment/Classroom/Course/Lesson/Quiz/Assignment/Submission services | Durable invalidation intent trong existing source transaction |
| Deadline exception service | Student/Course durable invalidation trong existing transaction |
| Audit repository/service | Safe report reader |
| shared database index runner | P06 idempotent indexes/migration |

Không inject reporting model trực tiếp vào mọi domain service nếu một integration event/hook
abstraction có thể giữ dependency direction sạch.

Route migration bắt buộc theo `compatibility-and-cutover-plan.md`; không để old/new handler cùng
method/path.

## 6. Scripts Create

```text
apps/api/src/scripts/reporting-rebuild.ts
apps/api/src/scripts/reporting-reconcile.ts
apps/api/src/scripts/reporting-benchmark.ts
apps/api/src/shared/database/phase-six-migration.ts
apps/api/src/shared/database/phase-six-indexes.ts
```

## 7. OpenAPI Files

Theo pattern thực tế trong `apps/api/src/docs/`:

```text
apps/api/src/docs/phase-six-student-reporting.openapi.ts
apps/api/src/docs/phase-six-teacher-reporting.openapi.ts
apps/api/src/docs/phase-six-gradebook.openapi.ts
apps/api/src/docs/phase-six-admin-reporting.openapi.ts
apps/api/src/docs/phase-six-conditional.openapi.ts
```

`apps/api/src/docs/openapi.ts` compose operations/schemas/tags. File Conditional chỉ tạo khi
capability được bật. Tránh một OpenAPI file quá lớn nhưng không tách schema khỏi operation đến
mức khó trace.

## 8. Web Files Create

Theo `frontend-implementation-plan.md`:

```text
apps/web/src/features/reporting/
|-- reporting.types.ts
|-- reporting.schemas.ts
|-- reporting-format.ts
|-- reporting-query-keys.ts
|-- reporting-api.ts
|-- reporting-route-components.tsx
|-- components/...
|-- pages/...
|-- reporting-components.test.tsx
`-- reporting-pages.test.tsx
```

## 9. Existing Web Files Modify

| File/area | Change |
| --- | --- |
| `features/classrooms/pages/StudentClassroomsPage.tsx` | Giữ join/Classroom list; thay To-do-only fetch bằng composed P06 Dashboard summary/components |
| `TeacherCourseDashboardPage.tsx` | P06 summary/top ranking/freshness/actions |
| `StudentCoursePage.tsx` | Nullable metric/freshness |
| `StudentGradesPage.tsx` | Recent/summary integration, no visibility change |
| `features/role-home/RoleHomePage.tsx` | Retire old `AdminHomePage` route content sau khi management links được chuyển sang P06 Admin Dashboard |
| `router.tsx` | New routes/permissions/lazy components |
| `AppShell.tsx` | Progress/Reports navigation |
| `learning.types.ts` | Compatibility types hoặc move shared report types |

Route-specific cutover:

- `/student/dashboard` vẫn giữ join-by-code và Classroom list; reporting failure không được làm
  mất join workflow, mỗi band có request state độc lập;
- `/admin/dashboard` chuyển route element từ `AdminHomePage` sang
  `AdminReportingDashboardPage`, nhưng vẫn giữ links User/Teacher Invitation/Classroom/Course;
- update/remove tests/imports của retired `AdminHomePage`, không để dead export;
- `/teacher/courses/:courseId` giữ content management actions và thêm reporting tabs; không biến
  Dashboard thành trang analytics-only.

## 10. Test Files Create/Modify

```text
apps/api/tests/phase-six-metric-policy.test.ts
apps/api/tests/phase-six-gradebook-policy.test.ts
apps/api/tests/phase-six-reporting-policy.test.ts
apps/api/tests/phase-six-foundation.test.ts
apps/api/tests/integration/phase-six-reporting.integration.test.ts
apps/api/tests/integration/phase-six-security.integration.test.ts
apps/api/tests/integration/phase-six-export.integration.test.ts
apps/api/tests/integration/phase-six-reconciliation.integration.test.ts
apps/api/tests/app.test.ts
apps/web/src/features/reporting/*.test.tsx
tests/e2e/phase-06-critical-journeys.spec.ts
```

Reuse Mongo replica-set harness, auth fixtures và Playwright seed.

## 11. Compile-Safe Sequence

Sequence dưới đây được chia thành checkpoint hằng ngày tại `execution-parts/README.md`; không
được đổi dependency direction chỉ để hoàn thành một Part sớm hơn.

1. constants/types/pure policies/tests;
2. permissions/env;
3. ports/adapters;
4. models/repositories/migration;
5. calculator/refresh/reconcile;
6. Student service/routes/OpenAPI;
7. Teacher/Gradebook service/routes/OpenAPI;
8. Admin service/routes/OpenAPI;
9. Web types/API/components/routes;
10. Conditional capabilities;
11. E2E/performance/evidence.

## 12. Forbidden Structure

- Không tạo `reporting-service/` deployment riêng.
- Không tạo generic `utils.ts` chứa business formulas.
- Không import Question answer/Submission body Mongoose model vào reporting.
- Không tạo local `uploads/exports/`.
- Không duplicate permission map ở Web.
- Không tạo one-file router/service hàng nghìn dòng.
- Không để raw Mongo pipeline từ request.

## 13. Blueprint Exit

- Mọi file Create/Modify có owner/PR.
- Không orphan module/file.
- Dependency direction được review.
- Tests/OpenAPI/evidence nằm cùng slice.
