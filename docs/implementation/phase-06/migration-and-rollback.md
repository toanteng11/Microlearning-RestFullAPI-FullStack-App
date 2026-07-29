# Phase 06 Migration And Rollback

## 1. Strategy

P06 migration là additive-expand/backfill/enable. Không sửa hàng loạt authoritative source và
không drop P05 data/index trong cùng release.

## 2. Preflight

- Verify Phase 05 schema/index/version constants.
- Count active Courses/Enrollments/Progress/Grades.
- Verify Mongo version/replica set.
- Estimate summary documents/index size.
- Confirm feature flags disabled.
- Capture backup/snapshot procedure reference cho P07/staging.

## 3. Expand

1. Deploy code biết P06 schema nhưng routes/read model disabled.
2. Create `course_progress_summaries` indexes.
3. Create `reporting_invalidations` indexes.
4. Conditional collections/indexes chỉ khi flag approved.
5. Verify index names/options idempotently.

## 4. Backfill

- Batch by Course, then active roster.
- Calculate from authoritative readers.
- Checkpoint Course ID/batch.
- Idempotent upsert by unique scope/version.
- Bounded concurrency.
- Log aggregate counts only.
- Failure keeps checkpoint/invalidation for retry.

## 5. Verify

Per Course/sample/full:

- roster vs summary count;
- required/completed/status;
- process score;
- Grade points/average;
- source/definition versions;
- no PII fields;
- explain plan/index;
- stale state.

## 6. Enable

1. Enable `REPORTING_ENABLED` in staging.
2. Smoke Student/Teacher/Admin.
3. Run P06 E2E/security/performance.
4. Observe refresh/invalidation/reconcile.
5. Enable Conditional flags riêng nếu approved.
6. Production enable thuộc P07 deployment gate.

## 7. Compatibility

- Existing P04/P05 APIs remain during rollout.
- Nullable denominator cutover:
  - cập nhật Teacher service DTO, Web types/formatter, OpenAPI và tests trong cùng PR;
  - `progressPercentage`, `averageProgressPercentage`, `completionPercentage` dùng
    `number | null`;
  - không giữ field legacy `0` vì dự án chưa có external production consumer.
- P05 basic Gradebook cutover:
  - giữ path `/teacher/courses/:courseId/gradebook` và permission `grade.manage_owned`;
  - thay response `P05_BASIC_GRADEBOOK_V1` bằng `P06_GRADEBOOK_V1`;
  - retire `BASIC_GRADEBOOK_ENABLED` khỏi env schema/example/tests trong cùng PR;
  - `REPORTING_ENABLED` là feature gate duy nhất cho P06 Gradebook;
  - không chạy đồng thời hai implementation/response shape.
- Old code ignores P06 collections safely.

## 8. Rollback Triggers

- wrong metric/Grade visibility;
- cross-scope leakage;
- migration/index failure;
- p95 regression severe;
- invalidation backlog uncontrolled;
- reconciliation differences unexplained;
- CSV/event privacy issue.

## 9. Rollback Procedure

1. Disable Conditional flags.
2. Disable P06 routes/read-model usage via `REPORTING_ENABLED`.
3. Revert application version.
4. Keep P06 collections/indexes for investigation.
5. Restore existing P05 Dashboard/Gradebook behavior.
6. Run P05 regression/smoke.
7. Record incident, affected window/version.
8. Cleanup/drop only after approval and retention review.

## 10. Data Repair

- Repair script only replaces P06 read model.
- Never rewrite Progress/Grade/Submission source based on summary.
- Tampered summary is deleted/rebuilt.
- Definition mismatch rebuilds new version.
- Orphan summaries archived/deleted only after source scope confirmation.

## 11. Conditional Rollback

### CSV

Disable flag; no persistent server file should exist.

### Analytics Event

Disable ingestion; retain/delete according approved TTL; reporting truth unaffected.

### Trend Snapshot

Disable route/write; keep snapshots for investigation; no impact current summary.

## 12. Migration Evidence

- preflight counts;
- index list/options;
- batch/backfill output;
- reconcile result;
- rollback dry run;
- P05 compatibility test;
- staging enable/smoke;
- owner/date/commit.
