# Phase 05 Migration And Rollback

## 1. Strategy

Sử dụng `expand -> verify -> expose -> contract`. Phase 05 tạo collection/index mới và mở rộng enum contract trước khi route/UI public. Không sửa dữ liệu Phase 04 theo destructive migration.

## 2. Preflight

- Backup/snapshot local verification database.
- Mongo replica set healthy và transaction test Pass.
- Index name collision scan.
- P04 index manifest vẫn đúng.
- `learning_progress` hiện chỉ có activityType `LESSON`; unknown value count = 0.
- Không có collection P05 cũ với schema không tương thích.
- Config feature flags fail closed.

## 3. Expand Sequence

1. Merge TypeScript activity union/port V2 với backward compatibility tests.
2. Deploy/create P05 models nhưng chưa mount public routes nếu feature gate cần.
3. Create non-unique indexes trước.
4. Run duplicate preflight cho unique natural keys.
5. Create unique/partial indexes.
6. Register P05 services/adapters/router/OpenAPI.
7. Seed synthetic data trong isolated demo database.
8. Run migration/index/transaction/integration tests.
9. Expose Teacher authoring, sau đó Student mutation, rồi Grade/deadline integration.

## 4. Learning Progress Compatibility

- Mongoose enum mở rộng không rewrite Lesson rows.
- Reader V1 compatibility giữ behavior cho Lesson tests.
- Reader V2 dùng composite adapters.
- New Quiz/Assignment progress chỉ viết sau route enable.
- Rollback code phải đọc/ignore unknown P05 activity safely hoặc migration rollback phải giữ data và disable affected projection; không xóa progress.

## 5. Unique Index Preflight

### Active Attempt

- Aggregate `{quizId, studentId}` where status IN_PROGRESS count > 1.
- Synthetic/dev conflict có thể clean bằng deterministic script.
- Production conflict phải quarantine/manual decision, không auto-delete.

### Submission

- Aggregate `{assignmentId, studentId}` count > 1.
- Chọn current theo explicit rule chỉ trong approved migration; preserve others as revisions.

### Grade

- Aggregate `{studentId, activityType, activityId}` count > 1.
- Không chọn score tự động nếu có conflict; block rollout và review.

## 6. Index Deployment

- Use explicit index names from manifest.
- `syncIndexes` không chạy mù ở production.
- Record create duration/result.
- Verify key/options/partial filter exactly.
- Performance explain evidence trước expose high-volume route.

## 7. Rollback Levels

| Level | Trigger | Action |
| --- | --- | --- |
| L1 Feature | UI/API defect, data safe | Disable P05 route/navigation feature flag nếu có; retain data |
| L2 Application | Release regression | Roll back image/code; P04 routes remain available |
| L3 Index | Bad query/index behavior | Drop only named new index after impact review; data retained |
| L4 Data | Transaction/migration corruption | Stop writes, restore/reconcile from snapshot/history |

## 8. Rollback Constraints

- Không drop P05 collections nếu đã có real Attempt/Submission/Grade.
- Không downgrade enum bằng script làm mất records.
- Không overwrite Grade/Submission history.
- Rollback code phải deny P05 mutations rõ thay vì trả success giả.
- P04 Lesson progress/To-do/Classwork phải tiếp tục hoạt động.

## 9. Reconciliation Commands

Planned scripts/services:

- verify/rebuild attempt score from immutable snapshot (dry-run first).
- reconcile expired active attempts.
- verify Submission current vs latest revision.
- verify Grade evidence/reference/range.
- verify Deadline exception history/current revision.
- rebuild P05 learning progress from terminal attempt/current submission.

Mọi command có `--dry-run`, database allowlist, counts before/after và không log private content.

## 10. Migration Acceptance

- Clean database: indexes create and seed Pass.
- Existing P04 database: migrate without modifying Lesson data/count.
- Repeat migration: idempotent.
- Failed transaction: no partial current/history/progress.
- Rollback app: P04 smoke Pass; P05 data retained.
- Index manifest tests Pass trên Mongo version dùng trong Docker/Atlas target.
