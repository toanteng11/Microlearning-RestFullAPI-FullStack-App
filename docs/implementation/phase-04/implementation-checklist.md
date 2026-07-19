# Phase 04 Implementation Checklist

## 1. Cách Dùng

- Checklist này theo dõi gate execution; WBS theo dõi task chi tiết.
- Chỉ tick `[x]` khi có evidence kiểm chứng.
- Conditional item ghi `[N/A - reason/evidence]` nếu được defer chính thức.
- Planning hiện chưa phê duyệt, vì vậy tất cả mục giữ unchecked.

## 2. Gate A - Planning Baseline

- [ ] BA scope `FR-026..035` và overlap `FR-049/050/052/053/057` đã review.
- [ ] Must, Conditional Should và Out of scope đã chấp thuận.
- [ ] Lesson-only To-do/dashboard metric v1 đã chấp thuận.
- [ ] 36 technical decisions đổi thành `Accepted` hoặc có disposition.
- [ ] Lifecycle/visibility/deadline rules đã chấp thuận.
- [ ] Data/index/transaction contract đã review.
- [ ] API/OpenAPI contract đã review.
- [ ] Permission/object authorization matrix đã review.
- [ ] Frontend routes/states/accessibility đã review.
- [ ] Testing/68 AC/evidence model đã review.
- [ ] WBS 100 task/critical path đã review.
- [ ] Planning PR CI xanh và merge vào `main`.
- [ ] `development-readiness-review.md` ghi `READY_TO_CODE` trung thực.

## 3. Gate B - Domain And Data Foundation

- [ ] Permission constants/role capabilities được thêm và test.
- [ ] Classroom/Enrollment reader ports hoạt động qua current P03 data.
- [ ] Course/activity/content reader ports được định nghĩa.
- [ ] Lifecycle transition policy unit tests pass.
- [ ] Effective scheduled status fake-clock tests pass.
- [ ] Student ancestor visibility matrix pass.
- [ ] Exact-set/reorder policy tests pass.
- [ ] Course model/repository pass integration tests.
- [ ] Module model/repository pass integration tests.
- [ ] Lesson model/repository pass integration tests.
- [ ] Flashcard model/repository pass integration tests.
- [ ] Deadline append-only model/repository pass.
- [ ] Announcement model/repository pass.
- [ ] LearningProgress natural-key model/repository pass.
- [ ] Index manifest name/key/options pass trên replica set.
- [ ] No cross-domain Mongoose model import vi phạm boundary.

## 4. Gate C - Teacher Authoring

- [ ] Course create/list/detail/update APIs pass.
- [ ] Course lifecycle/publish prerequisite/archive APIs pass.
- [ ] Module create/update/status/archive APIs pass.
- [ ] Module reorder transaction/concurrency pass.
- [ ] Lesson create/detail/update/preview APIs pass.
- [ ] Lesson lifecycle/body-lock/archive APIs pass.
- [ ] Lesson move/reorder transaction/concurrency pass.
- [ ] Flashcard CRUD/archive/reorder APIs pass.
- [ ] Deadline set/reset/clear/history APIs pass.
- [ ] Deadline transaction rollback/race tests pass.
- [ ] Announcement CRUD/lifecycle APIs pass.
- [ ] Teacher Course/Classwork/Stream routes hoạt động.
- [ ] Course/Module forms có validation/conflict/dirty state.
- [ ] Lesson Editor/Markdown preview render an toàn.
- [ ] Flashcard editor có keyboard reorder.
- [ ] Deadline dialog hiển thị timezone/reason/revision conflict.
- [ ] Course Dashboard activity shell dùng API thật.
- [ ] Swagger Teacher happy/negative samples chạy được.

## 5. Gate D - Student Learning And Derived Views

- [ ] Student Classwork chỉ trả effective published content.
- [ ] Student Lesson DTO loại draft/audit/internal fields.
- [ ] Lesson Player render sanitized Markdown.
- [ ] Flashcard viewer hỗ trợ keyboard/reduced motion.
- [ ] Back/Previous/Next/breadcrumb đúng canonical visible order.
- [ ] GET Lesson không ghi progress.
- [ ] Start Lesson idempotent.
- [ ] Complete Lesson first/retry semantics đúng.
- [ ] Parallel complete tạo một progress record.
- [ ] To-do include/exclude/sort/filter/page đúng Lesson scope.
- [ ] Deadline View dùng UTC/server `asOf` đúng.
- [ ] Own progress không lộ Student khác.
- [ ] Course Dashboard summary/activity/student/ranking đúng.
- [ ] Metric response có `P04_LESSON_COMPLETION_V1` và `asOf`.
- [ ] Completion/deadline/visibility phản ánh ở query kế tiếp.
- [ ] Admin `contentCount` đúng và governance read-only.
- [ ] Student/Teacher/Admin deep-link negative journeys pass.

## 6. Conditional Resource Gate

- [ ] Product/Technical decision xác nhận resource được làm hay defer.
- [ ] [Conditional] External URL resource model/API/UI và safe URL tests pass.
- [ ] [Conditional] GCS bucket/IAM/CORS/provider adapter đã review.
- [ ] [Conditional] Upload MIME/size/quarantine/finalization pass.
- [ ] [Conditional] Download reauthorization/signed URL redaction pass.
- [ ] [Conditional] Orphan cleanup/rollback evidence pass.
- [ ] Nếu defer, AC-045/046 có `Not Applicable` reason và target phase.

## 7. Gate E - Quality And Exit

- [ ] All 66 Must AC = Pass.
- [ ] Conditional AC có Pass hoặc approved N/A evidence.
- [ ] `npm run check:ci` pass từ clean workspace.
- [ ] Unit/integration/component coverage gate pass.
- [ ] Mongo transaction/index tests pass.
- [ ] OpenAPI route/schema parity pass.
- [ ] Five critical Playwright journeys pass.
- [ ] XSS/unsafe URL/IDOR/log-redaction tests pass.
- [ ] Performance baseline có report và đạt/approved exception.
- [ ] Docker clean build/start/seed/smoke pass.
- [ ] Clean-clone onboarding pass.
- [ ] Desktop/mobile visual review không overlap/overflow.
- [ ] Keyboard/accessibility critical flow pass.
- [ ] Dependency audit và Secret Scan pass.
- [ ] Không còn Critical/High defect.
- [ ] Medium/Low defect có disposition/owner.
- [ ] Evidence register không còn Must placeholder.
- [ ] Exit report ghi đúng commit/PR/run.
- [ ] Implementation PR merge bằng protected workflow.
- [ ] Post-merge `main` CI pass.
- [ ] P05/P06 handoff review hoàn tất.

## 8. Status Summary

| Gate | Status | Blocking reason |
| --- | --- | --- |
| A | Pending | Planning baseline chưa review/merge |
| B | Not Started | Chờ Gate A |
| C | Not Started | Chờ foundation |
| D | Not Started | Chờ authoring/content APIs |
| Conditional Resource | Not Decided | Không chặn Must |
| E | Not Started | Chờ implementation |

Current overall status: `READY_FOR_REVIEW`, không phải `READY_TO_CODE` hay `COMPLETED`.
