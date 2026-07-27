# Phase 05 Implementation Checklist

## 1. Cách Sử Dụng

- Checklist theo dõi điều kiện qua Gate; WBS theo dõi task chi tiết.
- Chỉ tick `[x]` khi có bằng chứng trong `evidence-register.md` hoặc Pull Request đã merge.
- Dòng `[Prepared]` nghĩa là tài liệu đã soạn trên planning branch nhưng chưa được reviewer phê duyệt.
- Conditional item phải là `Pass` hoặc `[N/A - approved reason/evidence]`; không được im lặng bỏ qua.
- Current status: Gate A `APPROVED`; Part 1-Part 7 `LOCAL_IMPLEMENTATION_COMPLETE`; local quality/security/Docker/E2E Pass; commit, clean clone, remote PR/CI và formal acceptance/exit approval pending.

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
- [x] [Prepared] Source file blueprint chỉ rõ file Create/Modify và compile-safe order.
- [x] [Prepared] Runtime TypeScript/permission/config/service/DTO contracts đã khóa.
- [x] [Prepared] Toàn bộ 52 P05 API và P04 read models đã ánh xạ tới UI/state/refetch.
- [x] [Prepared] 74 integration cases và 12 E2E journeys đã có expected assertion cụ thể.
- [x] [Prepared] P05-PR01..08 có branch, scope, test gate và exit riêng.
- [x] Product Owner chấp thuận sáu refinement/boundary quyết định sản phẩm trong `ba-alignment-and-decisions.md` ngày `2026-07-22`.
- [x] Tất cả decision chặn Must trong `technical-decisions.md` đã chuyển từ `Proposed` sang `Accepted`.
- [x] Conditional media/link/comment/basic Gradebook có disposition mặc định `Disabled` hoặc `Deferred/N/A`.
- [x] Planning package format/link/count và local `npm run check:ci` validation Pass (`P05-EV-002`).
- [x] Planning Pull Request [#13](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/13) có required CI xanh và đã được chấp thuận merge.
- [x] Planning Pull Request merge vào `main` tại `24084c0`.
- [x] `development-readiness-review.md` được cập nhật thành `READY_TO_CODE` kèm approval và local quality evidence.

Gate A hiện tại: **APPROVED** ngày `2026-07-22`. Hai mục planning PR/merge phía trên là bước đồng bộ repository bắt buộc trước khi tạo implementation branch, không phải runtime evidence.

## 3. Gate B - Domain Và Data Foundation

- [x] Permission constants và role capability tests P05 pass.
- [x] Course/Classroom scope dùng port, không import chéo Mongoose model.
- [x] `LearningActivityDescriptor` v2 hỗ trợ Lesson/Quiz/Assignment.
- [x] Progress/deadline reader v2 giữ P04 backward compatibility.
- [x] Actor-specific DTO allowlist pass: preview/Attempt không lộ scoring key, own Submission không lộ actor khác, draft Grade không visible.
- [x] Attempt repository, immutable snapshot contract và active-attempt unique guard pass.
- [x] Assignment/current Submission/append-only revision repositories compile và natural-key tests pass.
- [x] Grade/history và deadline exception/history repositories compile và natural-key tests pass.
- [x] Zod schemas, DTO allowlist và error codes compile/pass cho authoring slice.
- [x] Named index manifest đúng key/options trên MongoDB replica set.
- [x] Migration preflight phát hiện unknown activity, schema mismatch và duplicate active Attempt.
- [x] Rollback strategy dry-run giữ nguyên P05 documents và P04 Lesson progress.
- [x] MongoDB replica-set integration suite Pass `72/72`.
- [x] Không có binary/file content hoặc multipart upload trong P05 runtime.
- [x] Gate B local review đã ghi evidence và không còn High data/security defect.

Gate B hiện tại: **IMPLEMENTED_LOCALLY**. MongoDB replica-set suite `72/72` và security/data evidence Pass; còn thiếu implementation commit, Pull Request review và remote CI để chuyển sang **VERIFIED**.

## 4. Gate C - Quiz, Attempt Và Scoring

- [x] Teacher Quiz CRUD/list/filter/page/sort đúng scope.
- [x] Quiz lifecycle/availability/attempt/release policy authoring pass.
- [x] Publish bị chặn khi aggregate không hợp lệ.
- [x] Bốn Question types có validation và reorder pass.
- [x] Student-safe preview DTO không có correct answer/scoring internals.
- [x] [N/A - Gate A `2026-07-22`] Question media URL mặc định disabled; route URL-only fail closed, không tạo upload/media runtime.
- [x] Student eligibility/enrollment/visibility/window/limit checks pass.
- [x] Start Attempt tạo immutable snapshot transactionally.
- [x] Hai start đồng thời chỉ có một active Attempt.
- [x] Save answer type validation, idempotency và revision conflict pass.
- [x] Resume trả đúng snapshot/answer đã lưu/remaining time.
- [x] Objective golden scoring fixtures pass.
- [x] SHORT_ANSWER tạo `NEEDS_REVIEW` và không tự chấm.
- [x] Submit/double-submit/retry/timeout dùng server time và terminal state đúng.
- [x] Lazy timeout reconciliation nhất quán trên read/write/list.
- [x] Result release policy và Student own-result privacy pass.
- [x] Teacher manual review/regrade Quiz có history/audit.
- [x] Teacher Quiz Builder/Result và Student Quiz Player dùng API thật.
- [x] Navigation warning không làm mất answer chưa được server xác nhận.
- [x] Quiz Swagger happy/negative samples hợp lệ.
- [x] Quiz critical Playwright journeys pass desktop/mobile.

Gate C hiện tại: **IMPLEMENTED_LOCALLY**. Quiz/Question authoring, Attempt, scoring, timeout, result release, manual review/regrade, Teacher/Student UI và Playwright đều Pass local; implementation PR và remote CI còn pending.

## 5. Gate D - Assignment, Submission, Grade Và Deadline Exception

- [x] Teacher Assignment CRUD/lifecycle/policy đúng scope.
- [x] TEXT submission method hoạt động đầy đủ.
- [x] [N/A - Gate A `2026-07-22`] LINK/MARK_DONE disabled trong P05 baseline.
- [x] Student draft dùng một current Submission theo natural key.
- [x] Turn in ghi revision/event và late state đúng server time.
- [x] Unsubmit/resubmit tuân policy và không mất history.
- [x] Retry/race save-turn-in-unsubmit không tạo corrupt state.
- [x] Roster `ASSIGNED/MISSING/LATE` projection đúng theo effective deadline; turn-in evidence không bị viết lại và không tạo placeholder hàng loạt.
- [x] Teacher Submission table filter/page/sort dùng query/index đúng.
- [x] Grade draft validation không vượt max points.
- [x] Return/regrade dùng optimistic revision, history và AuditLog.
- [x] Student không thấy draft Grade/Feedback trước return.
- [x] Student chỉ xem own returned Grade/Feedback.
- [x] [N/A - Gate A `2026-07-22`] Private Comments deferred; không tạo contract ngầm.
- [x] Deadline exception chỉ áp dụng đúng Student/activity.
- [x] Normal Teacher không thể rút ngắn deadline hoặc đặt quá khứ.
- [x] Set/revoke exception có reason/revision/history/audit.
- [x] Exception lập tức phản ánh vào late/missing/To-do ở query tiếp theo.
- [x] Teacher Editor/Grader và Student Submission/Grade screens dùng API thật.
- [x] Assignment/Grade Swagger happy/negative samples hợp lệ.
- [x] Assignment/Grade critical Playwright journeys pass desktop/mobile.

Gate D hiện tại: **IMPLEMENTED_LOCALLY**. Assignment/Submission/Grade/Regrade/deadline exception cùng Teacher/Student UI, privacy, transaction và Playwright evidence đều Pass local; implementation PR và remote CI còn pending.

## 6. Gate E - Integration, Quality Và Phase Exit

- [x] Classwork hỗ trợ Lesson/Quiz/Assignment, không regression P04.
- [x] Student To-do hỗ trợ mixed activity, effective deadline và stable sort.
- [x] Deadline View hỗ trợ mixed activity và deadline exception.
- [x] Progress metric trả `P05_REQUIRED_ACTIVITY_COMPLETION_V1` và `asOf`.
- [x] Score chưa bị dùng làm weighted process score Phase 06.
- [x] Admin Course governance chỉ thêm assessment counts/status metadata, không lộ private assessment evidence.
- [x] [N/A - Gate A `2026-07-22`] Basic Gradebook deferred sang P06; không export/weighting.
- [x] OpenAPI operation/schema/security/error parity pass (`52/52` P05 operations; `9/9` contract tests).
- [x] Authorization/IDOR/field leak matrix pass.
- [x] Scoring golden fixtures và all concurrency/rollback tests pass.
- [x] Performance/index budgets pass trên seeded dataset.
- [x] React component/integration tests pass (`99/99`).
- [x] Accessibility axe/keyboard/focus/responsive review pass trên Student Course và Admin governance critical screens.
- [x] 12 critical browser journeys pass bằng API/MongoDB thật; full regression `26/26`.
- [x] Deterministic demo seed không chứa PII/secret thật và repeat run không tạo trùng.
- [x] Docker build/readiness/seed/smoke pass.
- [x] Dependency audit và local Secret Scan pass; React Router RSC advisory có exception chính xác, owner và expiry `2026-08-31`.
- [ ] Clean-clone onboarding pass.
- [ ] `74/74` Must AC Pass.
- [x] Bốn Conditional AC có approved N/A evidence tại Gate A `2026-07-22`.
- [x] Không Critical/High defect local; dependency advisory không áp dụng cho Vite SPA có accepted-risk disposition và expiry.
- [ ] Evidence register có command/count/commit/CI URL/report; local command/count đã có, commit/CI URL còn pending.
- [ ] Implementation PR merge qua branch protection.
- [ ] Post-merge `main` required CI xanh.
- [ ] Exit report được PO/TL chấp thuận.
- [ ] P06 nhận versioned activity/progress/grade contract.

Gate E hiện tại: **LOCAL_GATES_PASS_REMOTE_PENDING**. Còn thiếu clean clone trên implementation commit, formal `74/74` Must AC evaluation, implementation PR/main CI, exit approval và P06 handoff.

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
