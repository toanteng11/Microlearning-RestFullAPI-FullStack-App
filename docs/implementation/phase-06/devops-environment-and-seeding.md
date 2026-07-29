# Phase 06 DevOps Environment And Seeding

## 1. Purpose

P06 cần reproducible data, migration, CI và observability trước Cloud deployment. P07 mới triển
khai production Cloud Run/Atlas/GCS; P06 chuẩn bị contract và local/CI evidence.

## 2. Environment

Các biến trong `runtime-contract-catalog.md` phải:

- có `.env.example`;
- được Zod validate startup;
- không có secret trong `VITE_*`;
- Conditional default false;
- có config unit tests;
- được ghi trong Docker/Cloud handoff.

Lock/retry/expansion controls không được hard-code ngoài config:
`REPORTING_CLASSROOM_EXPANSION_BATCH_SIZE`,
`REPORTING_INVALIDATION_LOCK_SECONDS`,
`REPORTING_INVALIDATION_MAX_ATTEMPTS`,
`REPORTING_INVALIDATION_RETRY_BASE_SECONDS` và
`REPORTING_INVALIDATION_RETRY_MAX_SECONDS`.

`BASIC_GRADEBOOK_ENABLED` phải được remove theo cutover; deployment không được cấu hình đồng
thời old Gradebook flag và P06 Gradebook.

## 3. Seed Profiles

Seed deterministic tối thiểu:

| Profile | Data |
| --- | --- |
| `STUDENT_TOP` | 100% progress, returned Grades, no missing |
| `STUDENT_MID` | Partial progress, one late, mixed Grades |
| `STUDENT_AT_RISK` | Missing work, low progress, stale/no recent activity |
| `STUDENT_NO_DATA` | Enrolled Course không có required activity |
| `TEACHER_OWNER` | Owns reporting Course |
| `TEACHER_OTHER` | Dùng cho IDOR |
| `ADMIN` | Governance report |
| `SUPER_ADMIN` | Reconcile/permission tests |

Course có Lesson/Quiz/Assignment, deadline exception, returned/draft Grade, ungraded Submission
và activity lifecycle khác nhau.

Seed phải idempotent, không in password/secret, dùng demo password từ env như P05.

## 4. Benchmark Dataset

NFR scenario bắt buộc:

- 100 Students;
- 50 activities/Course;
- mixed Lesson/Quiz/Assignment;
- Progress cho nhiều status;
- Grade/Submission đủ để test Gradebook;
- ít nhất 5 Courses cho Admin aggregate.

Extended optional dataset theo BA: 500-1,000 Students, 100-300 Courses, 10k+ AuditLog.

## 5. Migration Commands

Proposed:

```text
npm run reporting:migrate --workspace @microlearning/api
npm run reporting:rebuild --workspace @microlearning/api -- --all --batchSize=50
npm run reporting:reconcile --workspace @microlearning/api -- --all
```

CI/local command phải chạy với Mongo replica set khi transaction/locking tests yêu cầu.

## 6. CI Jobs

| Job | Required checks |
| --- | --- |
| Lint/test/build | lint, negative gate, format, typecheck, coverage, build |
| Production dependency audit | npm audit policy |
| Mongo replica-set transaction | migration/index/refresh/reconcile/integration |
| OpenAPI contract | parser + route/schema parity |
| Integrated browser E2E | Student/Teacher/Admin P06 journeys |
| Secret scan | Gitleaks/existing gate |
| Reporting benchmark | Dataset target; required hoặc artifact theo runtime budget |

Không đổi tên required checks tùy tiện vì branch protection phụ thuộc tên.

## 7. Docker

- Existing Web/API/Mongo compose remains.
- API image chứa compiled scripts nhưng không auto-run rebuild destructive on startup.
- Migration/backfill command explicit.
- Health endpoint không phụ thuộc full reporting rebuild.
- No local export volume.

## 8. Observability

Structured metrics/logs:

- report request duration/result/reportId;
- rows/columns bounded counts;
- read-model age/freshness;
- refresh/reconcile result;
- invalidation backlog;
- CSV result/rows (Conditional);
- analytics invalid/duplicate/write result (Conditional).

Không ghi raw filters nếu có PII; safe summary only.

## 9. Alert Direction For P07

- Dashboard p95 > 1500ms.
- Reporting 5xx/error rate.
- Invalidation backlog/oldest age.
- Reconciliation difference >0.
- Refresh failed attempts >=3.
- CSV failure/security anomaly.
- Event invalid rate spike.

P06 tạo metric/log contract; P07 cấu hình Cloud Monitoring alert.

## 10. Local Verification

```text
npm ci
docker compose up -d --build
npm run seed:demo --workspace @microlearning/api
npm run reporting:rebuild --workspace @microlearning/api -- --all
npm run reporting:reconcile --workspace @microlearning/api -- --all
npm run check:ci
npm run test:integration
npm run test:openapi
npm run test:e2e
```

Command chính xác được cập nhật khi scripts được implement.

## 11. Evidence

- env validation tests;
- seed output counts;
- migration/backfill/reconcile JSON;
- Docker health;
- API/Swagger screenshots;
- browser actor screenshots;
- benchmark/explain;
- CI PR/main URLs;
- no-secret scan.
