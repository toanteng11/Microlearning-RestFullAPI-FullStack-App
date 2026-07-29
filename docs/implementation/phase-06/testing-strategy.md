# Phase 06 Testing Strategy

## 1. Quality Objective

P06 phải chứng minh bốn thuộc tính: metric đúng, dữ liệu đúng scope, freshness trung thực và
dashboard đủ nhanh. Snapshot đẹp nhưng formula/privacy sai là defect Critical/High.

## 2. Test Pyramid

| Layer | Focus |
| --- | --- |
| Unit | Formula, rounding, eligibility, ranking, status, CSV/event schemas |
| Mongo integration | Ports, aggregation, indexes, invalidation, concurrency, migration |
| API/OpenAPI | Auth/RBAC/scope/query/DTO/error/schema parity |
| React component/page | States, URL filters, table, null/freshness, accessibility |
| Browser E2E | Actor journeys trên integrated Web/API/Mongo |
| Security/privacy | IDOR, projection, filter/export leakage, formula injection |
| Performance | Dashboard/list/Gradebook/rebuild/export baseline |
| Operational | Docker, seed, clean clone, reconcile, rollback |

## 3. Deterministic Fixtures

- Inject `now()`; không phụ thuộc clock thật.
- Stable Object IDs/codes.
- UTC times quanh deadline/timezone boundary.
- Top/mid/at-risk/no-data Students.
- Draft/returned/regraded Grade.
- Deadline exception.
- Cross-owned Teacher/Course.
- Admin/small group >=/< threshold.
- stale/partial/version mismatch summaries.

## 4. Unit Coverage

- metric formula/rounding/null denominator;
- required activity eligibility/lifecycle;
- late/missing/effective deadline;
- Grade average/visibility;
- stable ranking/tie/null;
- Gradebook cell precedence;
- freshness state;
- filter/date/timezone validation;
- CSV escaping/injection;
- event allowlist/PII rejection.

Critical policies target branch coverage `>=90%`; repo overall gate không được giảm.

## 5. Mongo Integration

- Unique/index options.
- Batch readers/projections.
- Summary optimistic revision.
- Invalidation reason-union, revision/claim CAS, timeout/new-source race và retry.
- Refresh/rebuild determinism.
- Mutation failure isolation.
- Reconcile detects/repairs summary only.
- Migration idempotency.
- TTL Conditional.
- Explain/index query shape.

Use replica-set harness hiện có.

## 6. API And OpenAPI

Mỗi route:

- unauthenticated/inactive;
- permitted role;
- wrong role;
- owned/enrolled scope;
- cross-scope/out-of-roster;
- valid/invalid filters;
- pagination/max;
- fresh/stale/partial/no-data;
- DTO denylist;
- OpenAPI path/schema/example/error.
- moved report paths có đúng một Express handler và một OpenAPI operation;
- P04/P05 route removal + P06 route addition không tạo khoảng trống contract.

## 7. Web

- Route guard/capability.
- Loading/empty/no-data/stale/partial/error.
- URL filter Back/Forward.
- Server sorting/pagination request.
- Null renders `N/A`.
- Export button visibility/blob cleanup.
- Logout private cache.
- Responsive long text/table.
- keyboard/focus/aria.

## 8. E2E Journeys

Tối thiểu 12:

1. Student Dashboard actionable To-do/progress.
2. Student completes activity and report refreshes.
3. Student sees returned Grade, not draft.
4. Student cross-account blocked.
5. Teacher Course Dashboard/ranking stable.
6. Teacher filters/pages and opens Student detail/back.
7. Teacher Gradebook statuses.
8. Teacher cross-Course IDOR blocked.
9. Deadline exception/regrade reflected.
10. Admin governance report metadata only.
11. Small-group suppression.
12. Conditional CSV safety hoặc feature disabled behavior.

## 9. Performance

Targets:

- simple read p95 `<=800ms`;
- list p95 `<=1000ms`, page <=50;
- dashboard aggregate p95 `<=1500ms`;
- Teacher Course Dashboard usable `<=3s`;
- Student Dashboard usable `<=2.5s`.

Dataset required: 100 Students x 50 activities; extended Admin/audit fixture as feasible.
Error rate `<1%` cho load scenario.

## 10. Security

- horizontal/vertical authorization;
- query/operator injection;
- filter/count leakage;
- CSV formula injection;
- event actor spoof/PII;
- rate/body/row/date limits;
- cached data after logout;
- log/response secret scan;
- Admin/Super Admin redaction.

## 11. Regression

P02 auth/user, P03 Classroom, P04 content/To-do, P05 assessment/Grade/deadline/mixed progress
tests vẫn Pass. P06 không được sửa test kỳ vọng chỉ để che breaking regression.

## 12. CI Gates

Required:

- lint/format/typecheck/unit coverage/build;
- production audit;
- Mongo integration;
- OpenAPI;
- browser E2E;
- secret scan.

Reporting benchmark có thể artifact ở PR đầu, bắt buộc Pass trước Gate E.

## 13. Evidence Standard

Evidence ghi command, commit SHA, environment, dataset, result, duration và URL/path. Screenshot
không thay automated assertion; automated output không thay visual/accessibility review.

## 14. Defect Severity

| Severity | Example |
| --- | --- |
| Critical | Cross-Student/Course leak, wrong Grade release, secret export |
| High | Wrong score/ranking, silent stale presented fresh, destructive migration |
| Medium | Filter/pagination/status UI incorrect |
| Low | Copy/alignment issue không ảnh hưởng task |

Gate E yêu cầu Critical/High = `0`.
