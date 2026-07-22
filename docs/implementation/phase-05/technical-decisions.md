# Phase 05 Technical Decisions

## 1. Decision Status

| Status | Ý nghĩa |
| --- | --- |
| Proposed | Cần Gate A review |
| Accepted | Được chấp thuận trong planning baseline |
| Superseded | Có decision mới thay thế |
| Deferred | Chuyển phase khác có lý do |

Tất cả decision dưới đây là `Proposed` cho tới khi planning PR được review/merge. Implementation không được tự chọn khác mà không cập nhật ADR/impact.

## 2. Decision Register

| ID | Decision | Status | Consequence |
| --- | --- | --- | --- |
| P05-TD-001 | Giữ Modular Monolith, thêm domain module theo assessment | Proposed | Deploy đơn giản; boundary bằng port/repository |
| P05-TD-002 | Mở rộng activity union bằng adapter, không nhét field vào Lesson | Proposed | P04 không bị coupling assessment |
| P05-TD-003 | Attempt embed immutable Question/scoring snapshot | Proposed | Lịch sử đúng; document lớn hơn nhưng bounded |
| P05-TD-004 | Question lưu collection riêng, options embedded stable IDs | Proposed | Builder/reorder/query rõ; option luôn đọc cùng Question |
| P05-TD-005 | Correct answer chỉ trong Teacher/scoring projection | Proposed | Chống answer leakage ở API/UI/log |
| P05-TD-006 | Objective scoring exact-match backend | Proposed | Deterministic; partial credit deferred |
| P05-TD-007 | Short answer luôn manual review | Proposed | Không text-match sai; cần review UI |
| P05-TD-008 | `HIGHEST` là Quiz final score policy P05 | Proposed | Dễ hiểu; mọi attempt vẫn giữ |
| P05-TD-009 | Start/save/submit là ba command riêng | Proposed | Resume/time limit/idempotency rõ |
| P05-TD-010 | Timeout lazy reconciliation theo server UTC | Proposed | Không cần scheduler; read/write phải gọi reconciler |
| P05-TD-011 | Một active Attempt được bảo vệ bằng partial unique index | Proposed | Chặn concurrent double-start |
| P05-TD-012 | Submission dùng current document + append-only revisions/events | Proposed | Query nhanh, lịch sử đầy đủ |
| P05-TD-013 | `MISSING/ASSIGNED` derive từ roster, không persist placeholder | Proposed | Không write amplification |
| P05-TD-014 | Grade current unique Student/activity + grade history append-only | Proposed | Regrade concurrency/audit rõ |
| P05-TD-015 | Return transactionally cập nhật Grade visibility và Submission/result | Proposed | Không có grade visible nửa chừng |
| P05-TD-016 | Deadline exception generic `LESSON/QUIZ/ASSIGNMENT` | Proposed | Một policy/index/read path |
| P05-TD-017 | Exception precedence cao hơn default deadline | Proposed | Cá nhân hóa mà không sửa global content |
| P05-TD-018 | Activity completion metric version `P05_REQUIRED_ACTIVITY_COMPLETION_V1` | Proposed | P06 phân biệt formula version |
| P05-TD-019 | Quiz completion không đợi manual grade | Proposed | To-do phản ánh việc Student đã làm |
| P05-TD-020 | Assignment completion theo valid turn-in; unsubmit đảo completion | Proposed | To-do nhất quán workflow |
| P05-TD-021 | URL media/link feature-flag + HTTPS allowlist | Proposed | Không server fetch tùy ý; giảm SSRF/tracking |
| P05-TD-022 | Private upload/file deferred P07 | Deferred | Không local disk; phải giữ traceability gap |
| P05-TD-023 | Optimistic concurrency dùng explicit revision/expectedRevision | Proposed | Conflict rõ, không silent overwrite |
| P05-TD-024 | Idempotency dựa trên state/natural key + optional Idempotency-Key | Proposed | Retry an toàn; không cần global idempotency store ngay |
| P05-TD-025 | Result DTO không trả question scoring key kể cả sau release mặc định | Proposed | Teacher có thể trả feedback/explanation riêng, không lộ bank |
| P05-TD-026 | Grade score và Question points lưu integer points trong P05 | Proposed | Tránh floating point/Decimal128 ambiguity; fractional points deferred |
| P05-TD-027 | P05 chỉ hỗ trợ integer points | Proposed | Validation/scoring đơn giản; fractional score deferred |
| P05-TD-028 | Course Gradebook basic là derived query, không materialize | Proposed | Nguồn ít; P06 quyết định read model |
| P05-TD-029 | Audit payload allowlist, không log answer/feedback body | Proposed | Giảm dữ liệu nhạy cảm trong log |
| P05-TD-030 | OpenAPI source code cùng runtime và parity test | Proposed | Swagger không lệch route |
| P05-TD-031 | Migration index theo expand/verify/contract | Proposed | Rollback an toàn |
| P05-TD-032 | No background notification side effect trong source transaction | Proposed | Notification failure không rollback grade/deadline |

## 3. Chosen State Names

### Quiz

`DRAFT`, `SCHEDULED`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED`.

### Attempt

`IN_PROGRESS`, `SUBMITTED`, `TIMED_OUT`, `NEEDS_REVIEW`, `GRADED`, `RESULT_RELEASED`.

### Assignment

`DRAFT`, `SCHEDULED`, `PUBLISHED`, `UNPUBLISHED`, `CLOSED`, `ARCHIVED`.

### Submission Stored State

`DRAFT`, `SUBMITTED`, `LATE`, `GRADED`, `RETURNED`.

`ASSIGNED` và `MISSING` là derived row state, không phải current Submission document bắt buộc.

### Grade

`DRAFT`, `RETURNED`.

## 4. Concurrency Decisions

| Command | Guard |
| --- | --- |
| Quiz/Assignment update | `expectedContentRevision` |
| Question mutation/reorder | `expectedQuestionRevision` + exact ID set |
| Attempt save answer | `expectedAttemptRevision`, not expired |
| Attempt submit | terminal-state idempotency + revision |
| Start attempt | transaction + partial unique active index + attempt number unique |
| Submission save/turn-in | `expectedSubmissionRevision` |
| Grade/regrade/return | `expectedGradeRevision` |
| Deadline exception | `expectedDeadlineRevision` |

Conflict trả `409 CONCURRENT_MODIFICATION` với safe current revision, không trả private body.

## 5. Transaction Boundaries

1. Start Attempt: reconcile active -> allocate number -> create snapshot/attempt.
2. Submit Attempt: lock revision -> finalize answers -> score -> update progress/result summary -> audit metadata.
3. Turn In: validate effective deadline -> append revision/event -> update current Submission -> progress.
4. Return Work: upsert/revise Grade -> append history -> update Submission/Attempt result state -> audit.
5. Deadline Exception: append history -> update current exception -> invalidate/recalculate scoped derived state.

Transaction không gọi external URL, GCS hoặc notification provider.

## 6. Rejected Alternatives

| Alternative | Lý do không chọn |
| --- | --- |
| Embed Questions trong Quiz | Builder/reorder/version/update lớn và attempt history khó |
| Tính score ở React | Không tin client, dễ sửa request |
| Overwrite Question sau Attempt | Làm thay đổi bằng chứng/scoring lịch sử |
| Một Submission document cho mỗi lần resubmit | Query current phức tạp và dễ nhiều current |
| Tạo Submission placeholder cho toàn roster | Write amplification, stale state |
| Lưu upload ở container filesystem | Cloud Run ephemeral, privacy/rollback kém |
| Cho mọi external media URL | SSRF/tracking/CSP/unsafe content risk |
| Dùng Grade ngay làm processScore | Formula chưa được governance ở P06 |
| Cron bắt buộc để timeout | Tăng dependency trước deployment phase |

## 7. Review Checklist

- [ ] Product Owner chấp thuận score/result policy.
- [ ] Backend review transaction/index feasibility.
- [ ] Frontend review route/state/unsaved behavior.
- [ ] QA review deterministic scoring fixtures.
- [ ] Security review answer secrecy, IDOR, media/link policy.
- [ ] DevOps review env/seed/no-upload boundary.
- [ ] Planning PR CI xanh và merge.

Checklist chỉ được tick khi có review evidence; hiện Gate A chưa hoàn tất.
