# Phase 06 Backend Implementation Plan

## 1. Implementation Order

Triển khai theo compile-safe vertical slices. Không viết toàn bộ model trước rồi để route/service
không dùng kéo dài.

Developer thực hiện từng checkpoint nhỏ theo `execution-parts/part-01-*.md` đến
`execution-parts/part-17-*.md`; các Slice B01-B08 trong tài liệu này vẫn là technical source of
truth cho Backend.

## 2. Slice B01 - Contract Foundation

1. Thêm permission constants/role grants/tests.
2. Thêm env schema/default/example/tests.
3. Tạo reporting constants/types/schemas.
4. Tạo pure metric/ranking/Gradebook policies và unit tests.
5. Khóa DTO/query/nullability theo canonical contract.
6. Thêm OpenAPI component schemas cơ bản.

Exit: lint/type/unit/OpenAPI schema compile Pass; chưa expose route.

## 3. Slice B02 - Scope And Reader Ports

1. Định nghĩa scope/roster/activity/progress/grade/governance/audit ports.
2. Định nghĩa neutral durable invalidation writer port.
3. Viết adapters trên public repositories/services hiện có.
4. Batch APIs để tránh N+1.
5. Projection tests chặn answer/submission/draft Grade leakage.
6. Ownership/enrollment integration tests.

Exit: adapters trả plain safe projections, không import forbidden models trong reporting.

## 4. Slice B03 - Read Model Foundation

1. Mongoose schema/model/index cho summary/invalidation.
2. Repository list/rank/optimistic replace/claim/fail/resolve.
3. Tạo một `phaseSixFoundation` tại `app.ts`; truyền writer bắt buộc vào Phase Four/Five router,
   không có production noop/default.
4. Gắn invalidation `reasons[]` vào source transactions theo method matrix; wrap
   `StudentLearningService.start/complete` và `QuizReviewService.saveReview`, các mutation còn
   lại reuse transaction hiện có.
5. Calculator + refresh + reconciliation services.
6. Migration/index/backfill/rebuild/reconcile scripts.
7. Mongo replica-set integration/concurrency/fault tests.

Exit: deterministic rebuild, stale detection, transaction rollback leaves no partial
source/invalidation pair, multi-reason coalesce không mất reason và source mutation isolation
Pass.

## 5. Slice B04 - Student Reporting

1. `StudentReportingService`.
2. Extend progress contract; create Dashboard/all-Course routes.
3. Reuse Student To-do/Grade services.
4. Own scope/privacy/pagination/freshness.
5. OpenAPI + integration tests.

Exit: Student vertical slice chạy trên seeded Mongo.

## 6. Slice B05 - Teacher Reporting

1. Refactor/adapter existing `TeacherCourseDashboardService` vào P06 services.
2. Remove old Teacher report route registrations và add P06 routes atomically.
3. Add process score/null/freshness/stable ranking.
4. Activity/assessment aggregates.
5. Student detail.
6. Bounded Gradebook; retire old Gradebook route/flag/contract.
7. Ownership/IDOR/performance/route uniqueness tests.

Exit: dashboard/ranking/detail/Gradebook APIs Pass; planned nullability/Gradebook corrections đúng
cutover contract và không có P05 regression ngoài thay đổi đã phê duyệt.

## 7. Slice B06 - Admin Reporting

1. `AdminReportingService` và governance adapters.
2. Dashboard/governance/audit routes.
3. Privacy threshold/redaction.
4. Audit report view where required.
5. Integration/OpenAPI/privacy tests.

Exit: Admin metadata projection Pass, individual learning data inaccessible.

## 8. Slice B07 - Conditional Capabilities

Chỉ khi Gate A flag:

1. CSV serializer/scope/audit/stream.
2. Analytics event schema/model/TTL/rate limit.
3. Progress snapshots/trend.
4. Dedicated security/performance tests.

Mỗi capability độc lập; không bật tất cả chỉ vì cùng PR.

## 9. Slice B08 - Integration And Hardening

1. Wire `phase-six.router.ts`.
2. OpenAPI P06 paths/components/examples.
3. Seed/benchmark fixtures.
4. Structured metrics/logging.
5. Docker/API E2E.
6. Explain plans and index review.
7. Feature flag/rollback verification.

## 10. Service Rules

- Route mỏng: parse -> service -> response.
- Service không nhận Express Request/Response.
- Calculator pure và testable.
- Repository không tự authorization.
- Scope reader chạy trước data repository.
- Errors dùng `AppError` catalog.
- `now()` injectable cho deadline/freshness tests.
- No `any`, no raw aggregation input from client.

## 11. Query Performance Checklist

- Batch query roster/activities/progress/grades.
- Projection fields explicit.
- Count/items same scoped filter.
- page/limit max enforced.
- stable sort includes unique tie-breaker.
- explain plan uses expected index.
- no unbounded `$lookup` or collection scan.
- no Promise per Student x Activity.

## 12. Compatibility Checklist

- Existing P04/P05 routes still Pass regression.
- P05 constants imported/asserted.
- Old Gradebook route/flag removed atomically; P06 path unique.
- Null denominator coordinated across API/Web/OpenAPI.
- No source model destructive migration.
- Existing seed accounts/workflows remain usable.

## 13. Backend Evidence

- unit/integration/coverage reports;
- OpenAPI parser/parity;
- migration/backfill/reconcile JSON output;
- explain plans;
- benchmark summary;
- fault injection refresh result;
- Docker API smoke;
- PR/main CI URLs.
