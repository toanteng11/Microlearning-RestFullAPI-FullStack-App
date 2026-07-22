# Phase 05 Implementation Checklist

## 1. Cách Sử Dụng

- Checklist theo dõi điều kiện qua Gate; WBS theo dõi task chi tiết.
- Chỉ tick `[x]` khi có bằng chứng trong `evidence-register.md` hoặc Pull Request đã merge.
- Dòng `[Prepared]` nghĩa là tài liệu đã soạn trên planning branch nhưng chưa được reviewer phê duyệt.
- Conditional item phải là `Pass` hoặc `[N/A - approved reason/evidence]`; không được im lặng bỏ qua.
- Current status: `READY_FOR_REVIEW`, Gate A `PENDING`, implementation `NOT_STARTED`.

## 2. Gate A - Planning Baseline

- [x] [Prepared] BA `FR-036..048` và các requirement mở rộng đã được đối chiếu.
- [x] [Prepared] Must, Conditional và Deferred scope đã tách rõ.
- [x] [Prepared] Boundary Phase 04/05/06/07 đã được ghi thành contract.
- [x] [Prepared] Quiz/Question lifecycle và publish prerequisites đã mô tả.
- [x] [Prepared] Attempt snapshot, attempt limit, timeout và concurrency policy đã mô tả.
- [x] [Prepared] Objective exact-match scoring và SHORT_ANSWER manual review đã mô tả.
- [x] [Prepared] Result release/answer secrecy policy đã mô tả.
- [x] [Prepared] Assignment/Submission/revision/turn-in/unsubmit policy đã mô tả.
- [x] [Prepared] Grade/Feedback/Return/Regrade/history policy đã mô tả.
- [x] [Prepared] Per-Student deadline exception và late/missing derivation đã mô tả.
- [x] [Prepared] Activity/To-do/Deadline/Progress contract v2 đã mô tả.
- [x] [Prepared] Data model, index, transaction và migration/rollback đã mô tả.
- [x] [Prepared] API request/response/error/idempotency/revision đã mô tả.
- [x] [Prepared] Frontend routes, states, navigation và accessibility đã mô tả.
- [x] [Prepared] Security, IDOR, grade privacy và field projection đã mô tả.
- [x] [Prepared] Testing strategy, 78 AC và evidence model đã soạn.
- [x] [Prepared] WBS 108 task và critical dependencies đã soạn.
- [ ] PO/TL chấp thuận sáu refinement/boundary quyết định sản phẩm trong `ba-alignment-and-decisions.md`.
- [ ] Tất cả decision chặn Must trong `technical-decisions.md` chuyển từ `Proposed` sang `Accepted`.
- [ ] Conditional media/link/comment/basic Gradebook có disposition `Enabled` hoặc `Deferred/N/A`.
- [x] Planning package format/link/count và local `npm run check:ci` validation Pass (`P05-EV-002`).
- [ ] Planning Pull Request có required CI xanh và review approval.
- [ ] Planning Pull Request merge vào `main`.
- [ ] `development-readiness-review.md` được cập nhật thành `READY_TO_CODE` kèm PR/commit/CI evidence.

Gate A hiện tại: **PENDING**.

## 3. Gate B - Domain Và Data Foundation

- [ ] Permission constants và role capability tests P05 pass.
- [ ] Course/Classroom scope dùng port, không import chéo Mongoose model.
- [ ] `LearningActivityDescriptor` v2 hỗ trợ Lesson/Quiz/Assignment.
- [ ] Progress/deadline reader v2 giữ P04 backward compatibility.
- [ ] Quiz/Question repositories và actor projection pass.
- [ ] Attempt repository, immutable snapshot và active-attempt guard pass.
- [ ] Assignment/current Submission/append-only revision repositories pass.
- [ ] Grade/history và deadline exception/history repositories pass.
- [ ] Zod schemas, DTO allowlist và error codes compile/pass.
- [ ] Named index manifest đúng key/options.
- [ ] Migration preflight phát hiện duplicate/invalid data đúng.
- [ ] Rollback strategy được dry-run trên dữ liệu test.
- [ ] MongoDB replica-set transaction tests pass.
- [ ] Không có binary/file content trong MongoDB document.
- [ ] Gate B review ghi evidence và không còn High data/security defect.

Gate B hiện tại: **NOT_STARTED**.

## 4. Gate C - Quiz, Attempt Và Scoring

- [ ] Teacher Quiz CRUD/list/filter/page/sort đúng scope.
- [ ] Quiz lifecycle/availability/attempt/release policy pass.
- [ ] Publish bị chặn khi aggregate không hợp lệ.
- [ ] Bốn Question types có validation và reorder pass.
- [ ] Student DTO trước release không có correct answer/scoring internals.
- [ ] Conditional question media Pass hoặc approved N/A.
- [ ] Student eligibility/enrollment/visibility/window/limit checks pass.
- [ ] Start Attempt tạo immutable snapshot transactionally.
- [ ] Hai start đồng thời chỉ có một active Attempt.
- [ ] Save answer type validation, idempotency và revision conflict pass.
- [ ] Resume trả đúng snapshot/answer đã lưu/remaining time.
- [ ] Objective golden scoring fixtures pass.
- [ ] SHORT_ANSWER tạo `NEEDS_REVIEW` và không tự chấm.
- [ ] Submit/double-submit/retry/timeout dùng server time và terminal state đúng.
- [ ] Lazy timeout reconciliation nhất quán trên read/write/list.
- [ ] Result release policy và Student own-result privacy pass.
- [ ] Teacher manual review/regrade Quiz có history/audit.
- [ ] Teacher Quiz Builder/Result và Student Quiz Player dùng API thật.
- [ ] Navigation warning không làm mất answer chưa được server xác nhận.
- [ ] Quiz Swagger happy/negative samples hợp lệ.
- [ ] Quiz critical Playwright journeys pass desktop/mobile.

Gate C hiện tại: **NOT_STARTED**.

## 5. Gate D - Assignment, Submission, Grade Và Deadline Exception

- [ ] Teacher Assignment CRUD/lifecycle/policy đúng scope.
- [ ] TEXT submission method hoạt động đầy đủ.
- [ ] LINK/MARK_DONE Conditional Pass hoặc approved N/A.
- [ ] Student draft dùng một current Submission theo natural key.
- [ ] Turn in ghi revision/event và late state đúng server time.
- [ ] Unsubmit/resubmit tuân policy và không mất history.
- [ ] Retry/race save-turn-in-unsubmit không tạo corrupt state.
- [ ] Roster `ASSIGNED/MISSING/LATE` projection đúng theo effective deadline; turn-in evidence không bị viết lại và không tạo placeholder hàng loạt.
- [ ] Teacher Submission table filter/page/sort dùng query/index đúng.
- [ ] Grade draft validation không vượt max points.
- [ ] Return/regrade dùng optimistic revision, history và AuditLog.
- [ ] Student không thấy draft Grade/Feedback trước return.
- [ ] Student chỉ xem own returned Grade/Feedback.
- [ ] Private comment Conditional Pass hoặc approved N/A.
- [ ] Deadline exception chỉ áp dụng đúng Student/activity.
- [ ] Normal Teacher không thể rút ngắn deadline hoặc đặt quá khứ.
- [ ] Set/reset exception có reason/revision/history/audit.
- [ ] Exception lập tức phản ánh vào late/missing/To-do ở query tiếp theo.
- [ ] Teacher Editor/Grader và Student Submission/Grade screens dùng API thật.
- [ ] Assignment/Grade Swagger happy/negative samples hợp lệ.
- [ ] Assignment/Grade critical Playwright journeys pass desktop/mobile.

Gate D hiện tại: **NOT_STARTED**.

## 6. Gate E - Integration, Quality Và Phase Exit

- [ ] Classwork hỗ trợ Lesson/Quiz/Assignment, không regression P04.
- [ ] Student To-do hỗ trợ mixed activity, effective deadline và stable sort.
- [ ] Deadline View hỗ trợ mixed activity và deadline exception.
- [ ] Progress metric trả `P05_REQUIRED_ACTIVITY_COMPLETION_V1` và `asOf`.
- [ ] Score chưa bị dùng làm weighted process score Phase 06.
- [ ] Admin Course governance chỉ thêm assessment counts/status metadata, không lộ private assessment evidence.
- [ ] Conditional basic Gradebook Pass hoặc approved N/A; không export/weighting.
- [ ] OpenAPI operation/schema/security/error parity pass.
- [ ] Authorization/IDOR/field leak matrix pass.
- [ ] Scoring golden fixtures và all concurrency/rollback tests pass.
- [ ] Performance/index budgets pass trên seeded dataset.
- [ ] React component/integration tests pass.
- [ ] Accessibility axe/keyboard/focus/responsive review pass.
- [ ] 12 critical browser journeys pass bằng API/MongoDB thật.
- [ ] Deterministic demo seed không chứa PII/secret thật.
- [ ] Docker build/readiness/seed/smoke pass.
- [ ] Dependency audit và Secret Scan pass.
- [ ] Clean-clone onboarding pass.
- [ ] `74/74` Must AC Pass.
- [ ] Bốn Conditional AC Pass hoặc có approved N/A evidence.
- [ ] Không Critical/High defect; Medium/Low có disposition.
- [ ] Evidence register có command/count/commit/CI URL/report.
- [ ] Implementation PR merge qua branch protection.
- [ ] Post-merge `main` required CI xanh.
- [ ] Exit report được PO/TL chấp thuận.
- [ ] P06 nhận versioned activity/progress/grade contract.

Gate E hiện tại: **NOT_STARTED**.

## 7. Stop-The-Line Conditions

Dừng merge ngay khi có một trong các dấu hiệu sau:

1. Correct answer/scoring key xuất hiện trong Student response, browser bundle hoặc log.
2. Draft Grade/Feedback hoặc Submission của Student khác bị lộ.
3. Double request tạo duplicate Attempt/Submission/Grade history hoặc chấm điểm hai lần.
4. Scoring không khớp immutable snapshot.
5. Dữ liệu chỉ đúng trên standalone Mongo nhưng hỏng trên replica-set transaction.
6. UI báo “đã lưu/đã nộp” khi API chưa xác nhận terminal state.
7. Upload ghi vào local/container filesystem.
8. P04 Lesson/Classwork/To-do regress.

## 8. Completion Rule

Phase 05 không được ghi `100/100` hoặc `COMPLETED` chỉ vì code đã merge. Cần đồng thời có Gate A-E Pass, `74/74` Must AC Pass, Conditional disposition, PR/main CI xanh, clean-clone evidence và exit report được phê duyệt.
