# Phase 06 Read Model Refresh And Reconciliation

## 1. Mục Tiêu

Read model phải nhanh nhưng không được âm thầm sai. Tài liệu này định nghĩa invalidation,
refresh, stale response, rebuild và reconciliation để dữ liệu có thể phục hồi từ source.

## 2. Refresh Triggers

| Source event | Scope |
| --- | --- |
| Enrollment join/activate/remove | Course-wide |
| Course/activity publish/archive/required/reorder | Course-wide |
| Default deadline change | Course-wide |
| Lesson start/complete | Student/Course |
| Quiz attempt start/submit/finalize/review result | Student/Course |
| Assignment draft/turn-in/unsubmit/resubmit | Student/Course |
| Grade draft | Student/Course summary; Teacher projection đổi, Student không được thấy draft |
| Grade return/regrade | Student/Course |
| Deadline exception create/update/revoke | Student/Course |
| Metric definition activation | All affected Courses |

## 3. Durable Invalidation And Refresh Protocol

1. Source service thực hiện mutation trong `withMongoTransaction`.
2. Trong cùng `ClientSession`, integration writer idempotent upsert invalidation intent.
3. Transaction commit source + invalidation atomically.
4. Summary calculation không chạy trong transaction.
5. Report read hoặc explicit rebuild claim invalidation và refresh bounded scope.
   `CLASSROOM` intent được expand thành Course intents theo bounded batch trước khi refresh.
6. Refresh thành công: optimistic upsert summary, resolve invalidation.
7. Refresh lỗi: invalidation ở `FAILED/PENDING`, log code + retry metadata.
8. API report đọc freshness và công bố trạng thái.

Source mutation có thể retry/fail nếu chính durable invalidation intent không ghi được trong cùng
Mongo transaction. Tuy nhiên lỗi calculator/read model/rebuild sau commit không được rollback
source mutation. Mapping method/session nằm ở `source-event-invalidation-matrix.md`.

Classroom expansion:

1. list Course theo `_id` ascending với bounded batch;
2. upsert idempotent Course intents, giữ parent `sourceChangedAt/reasons`;
3. tiếp tục đến hết; retry có thể bắt đầu lại vì upsert idempotent;
4. chỉ resolve parent Classroom intent sau khi toàn bộ Course intents đã được ghi;
5. trong lúc parent còn pending/processing/failed, mọi report thuộc Classroom xem parent là stale.

## 4. Refresh Algorithm

Cho mỗi Student/Course:

1. xác nhận Course/Classroom/Enrollment scope;
2. batch-load visible activities;
3. load canonical progress;
4. resolve per-Student deadline exception;
5. load assessment status metadata;
6. load current eligible Grade;
7. tính metric bằng pure policies;
8. validate invariants;
9. compare source watermark/invalidation;
10. optimistic upsert summary;
11. structured metric/log.

Không query từng activity bên trong loop Student.

## 5. Bounded Inline Repair

| Scope | Inline behavior |
| --- | --- |
| One Student/Course | Có thể refresh trong request budget |
| Dashboard preview <=5 rows | Có thể refresh stale rows |
| Ranking page có Course-wide invalidation và roster <=100 | Tính source snapshot toàn Course trong request budget để giữ ranking đúng; batch upsert summary |
| Ranking page vượt on-demand bound/budget | Trả snapshot cũ với `STALE/PARTIAL`; nếu không có snapshot tin cậy trả `REPORT_NOT_READY` với `details.reason=REBUILD_REQUIRED` |
| Course-wide activity change | Enqueue/coalesce, rebuild batch |
| Admin aggregate | Không auto-rebuild learning rows không bounded |

Environment timeout/batch controls nằm trong runtime catalog.

## 6. Freshness Evaluation

```text
FRESH:
  summary version current
  AND no Student/Course, parent Course or parent Classroom invalidation newer than recalculatedAt
  AND recalculatedAt within stale threshold

STALE:
  summary usable
  AND invalidation/source change newer OR age exceeded

PARTIAL:
  response combines valid data with one or more failed/missing scopes

FAILED:
  no trustworthy summary and rebuild failed
```

`REBUILDING` là transient API status khi explicit rebuild đang giữ lock.

## 7. Rebuild Command

Proposed scripts:

```text
npm run reporting:rebuild --workspace @microlearning/api -- --courseId=<id>
npm run reporting:rebuild --workspace @microlearning/api -- --all --batchSize=50
npm run reporting:reconcile --workspace @microlearning/api -- --courseId=<id>
```

Rules:

- `--all` cần explicit flag, không là default.
- dry-run mặc định cho reconcile; `--repair` mới ghi.
- process exit non-zero khi invalid config/critical failure.
- không in PII/secret.
- output JSON summary để lưu evidence.

## 8. Reconciliation

So sánh sample/full tùy mode:

- roster count vs summary count;
- required/completed/missing/late;
- process score/version;
- returned Grade points/average;
- last active;
- orphan/missing summary;
- stale watermark.

Tolerance bằng `0` cho integer/count và exact one-decimal contract cho percentage. Difference
không tự sửa source.

## 9. Concurrency And Lock

- Invalidation upsert coalesce theo scope, set-union/dedupe `reasons[]` và giữ timestamp mới nhất.
- Source upsert tăng invalidation `revision`, đặt `PENDING` và supersede claim cũ.
- Refresh claim dùng atomic status/lock timestamp + random `claimToken`.
- Resolve/fail CAS theo claim token/revision; worker cũ không thể xóa invalidation mới.
- Lock timeout cho phép worker khác recover.
- Failure backoff:
  `min(REPORTING_INVALIDATION_RETRY_BASE_SECONDS * 2^(attempts-1),
  REPORTING_INVALIDATION_RETRY_MAX_SECONDS)`; attempts vượt max giữ `FAILED` để read-time/manual
  repair, không infinite retry.
- Summary update dùng `revision` compare-and-swap.
- Nếu source thay đổi trong lúc tính, watermark check thất bại và retry bounded.
- Không có infinite retry trong request.

## 10. Failure/Retry Policy

| Attempt | Behavior |
| --- | --- |
| 1 | Immediate/bounded |
| 2-3 | Exponential backoff metadata |
| >3 | `FAILED`, alert/operations review |

P06 không tự chạy background loop liên tục trên Cloud Run. P07 có thể gắn command với Cloud Run
Job/Scheduler sau khi contract được bàn giao.

Trong P06 local/staging, lazy on-demand Course refresh giữ normal Course tối đa `100` Student
có thể tự phục hồi. Dataset lớn hơn phải dùng explicit rebuild command trước khi report được
đánh dấu fresh.

## 11. Observability

Metrics/log fields:

- `reporting.refresh.duration_ms`;
- `reporting.refresh.result`;
- `reporting.invalidation.pending`;
- `reporting.reconcile.difference_count`;
- `reporting.summary.age_seconds`;
- course/scope hashed or ID according log policy;
- metric/schema version;
- correlation ID.

## 12. Acceptance

- Source mutation vẫn success khi refresh bị fault injection.
- Stale được công bố, không giả fresh.
- Rebuild cùng source tạo cùng summary.
- Concurrent refresh không duplicate/mất update.
- Reconcile phát hiện tampered summary.
- Repair chỉ sửa read model.
- Course 100 Student x 50 activity rebuild theo batch không vượt memory/timeout baseline.
