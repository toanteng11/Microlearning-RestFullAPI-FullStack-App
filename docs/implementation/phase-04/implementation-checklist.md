# Phase 04 Implementation Checklist

## 1. Cách Dùng

- Checklist này theo dõi gate execution; WBS theo dõi task chi tiết.
- Chỉ tick `[x]` khi có evidence kiểm chứng.
- Conditional item ghi `[N/A - reason/evidence]` nếu được defer chính thức.
- Gate A đã được phê duyệt bằng PR `#8`, CI `#18` và merge commit `66f400d`; Gate B-E đã được xác minh bằng implementation PR `#10` và post-merge main CI.

## 2. Gate A - Planning Baseline

- [x] BA scope `FR-026..035` và overlap `FR-049/050/052/053/057` đã review.
- [x] Must, Conditional Should và Out of scope đã chấp thuận.
- [x] Lesson-only To-do/dashboard metric v1 đã chấp thuận.
- [x] 36 technical decisions đổi thành `Accepted` hoặc có disposition.
- [x] Lifecycle/visibility/deadline rules đã chấp thuận.
- [x] Data/index/transaction contract đã review.
- [x] API/OpenAPI contract đã review.
- [x] Permission/object authorization matrix đã review.
- [x] Frontend routes/states/accessibility đã review.
- [x] Testing/68 AC/evidence model đã review.
- [x] WBS 100 task/critical path đã review.
- [x] Planning PR CI xanh và merge vào `main`.
- [x] `development-readiness-review.md` ghi `READY_TO_CODE` trung thực.

## 3. Gate B - Domain And Data Foundation

- [x] Permission constants/role capabilities được thêm và test.
- [x] Classroom/Enrollment reader ports hoạt động qua current P03 data.
- [x] Course/activity/content reader ports được định nghĩa.
- [x] Lifecycle transition policy unit tests pass.
- [x] Effective scheduled status fake-clock tests pass.
- [x] Student ancestor visibility matrix pass.
- [x] Exact-set/reorder policy tests pass.
- [x] Course model/repository pass integration tests.
- [x] Module model/repository pass integration tests.
- [x] Lesson model/repository pass integration tests.
- [x] Flashcard model/repository pass integration tests.
- [x] Deadline append-only model/repository pass.
- [x] Announcement model/repository pass.
- [x] LearningProgress natural-key model/repository pass.
- [x] Index manifest name/key/options pass trên replica set.
- [x] No cross-domain Mongoose model import vi phạm boundary.

## 4. Gate C - Teacher Authoring

- [x] Course create/list/detail/update APIs pass local integration.
- [x] Course lifecycle/publish prerequisite/archive APIs pass local integration.
- [x] Module create/update/status/archive APIs pass local integration.
- [x] Module reorder transaction/concurrency pass local integration.
- [x] Lesson create/detail/update/preview APIs pass local integration.
- [x] Lesson lifecycle/body-lock/archive APIs pass local integration.
- [x] Lesson move/reorder transaction/concurrency pass local integration.
- [x] Flashcard CRUD/archive/reorder APIs pass local integration.
- [x] Deadline set/reset/clear/history APIs pass local policy/integration tests.
- [x] Deadline transaction rollback/race tests pass local integration.
- [x] Announcement CRUD/lifecycle APIs pass.
- [x] Teacher Course/Classwork/Stream routes hoạt động.
- [x] Course/Module forms có validation/conflict handling.
- [x] Course/Lesson authoring form cảnh báo khi Back/navigation/refresh làm mất thay đổi chưa lưu.
- [x] Lesson Editor/Markdown preview render an toàn.
- [x] Flashcard editor có keyboard-accessible reorder controls.
- [x] Deadline editor hiển thị timezone/reason/revision conflict.
- [x] Course Dashboard activity shell dùng API thật.
- [x] Swagger Teacher happy/negative samples chạy được.

## 5. Gate D - Student Learning And Derived Views

- [x] Student Classwork chỉ trả effective published content.
- [x] Student Lesson DTO loại draft/audit/internal fields.
- [x] Lesson Player render sanitized Markdown.
- [x] Flashcard viewer hỗ trợ keyboard/reduced motion.
- [x] Back/Previous/Next/breadcrumb đúng canonical visible order.
- [x] GET Lesson không ghi progress.
- [x] Start Lesson idempotent.
- [x] Complete Lesson first/retry semantics đúng.
- [x] Parallel complete tạo một progress record.
- [x] To-do include/exclude/sort/filter/page đúng Lesson scope.
- [x] Deadline View dùng UTC/server `asOf` đúng.
- [x] Deadline View group theo ngày, validate URL/date range và pagination đúng.
- [x] Own progress không lộ Student khác.
- [x] Course Dashboard summary/activity/student/ranking đúng.
- [x] Metric response có `P04_LESSON_COMPLETION_V1` và `asOf`.
- [x] Completion/deadline/visibility phản ánh ở query kế tiếp.
- [x] Admin `contentCount` đúng và governance read-only.
- [x] Student/Teacher/Admin deep-link negative journeys pass.

## 6. Conditional Resource Gate

- [x] Product/Technical decision xác nhận Resource defer sang P07.
- [x] [N/A] External URL Resource không bật trong Phase 04.
- [x] [N/A] GCS upload không bật trong Phase 04.
- [x] [N/A] Upload MIME/size/quarantine/finalization được giữ cho P07.
- [x] [N/A] Download reauthorization/signed URL redaction được giữ cho P07.
- [x] [N/A] Orphan cleanup/rollback được giữ cho P07.
- [x] AC-045/046 có `Not Applicable` reason tại `conditional-resource-decision.md`.

## 7. Gate E - Quality And Exit

- [x] All 66 Must AC = Pass.
- [x] Conditional AC có approved N/A evidence tại `conditional-resource-decision.md`.
- [x] `npm run check:ci` pass trên implementation source, clean clone và remote CI.
- [x] Web test timeout được harden cho full parallel coverage trên CI; full suite `84/84` pass.
- [x] Unit/integration/component coverage gate pass.
- [x] Mongo transaction/index tests pass.
- [x] OpenAPI route/schema parity pass.
- [x] Five critical Playwright journeys pass.
- [x] XSS/unsafe URL/IDOR/log-redaction tests pass cho enabled scope.
- [x] Performance baseline có report và đạt.
- [x] Docker build/start/seed/smoke pass.
- [x] Clean-clone onboarding pass tại source commit `ccf032c`.
- [x] Desktop/mobile automated review không overlap/overflow.
- [x] Keyboard/accessibility critical flow pass.
- [x] Dependency audit và Secret Scan pass trên PR/main CI.
- [x] Không còn Critical/High defect trong local review.
- [x] Local review không có Medium/Low defect đang mở cần disposition.
- [x] Evidence register không còn Must placeholder.
- [x] Exit report ghi đúng source/merge commit, PR và hai CI run URL.
- [x] Implementation PR `#10` merge bằng protected workflow.
- [x] Post-merge `main` CI run `29799307403` pass đủ 6 job.
- [x] P05/P06 handoff review hoàn tất qua versioned contracts đã merge.

## 8. Status Summary

| Gate | Status | Blocking reason |
| --- | --- | --- |
| A | Completed | PR `#8`, CI `#18`, merge `66f400d` |
| B | Completed | `P04-T009..T030` pass local, clean clone và remote CI |
| C | Completed | Teacher authoring, Announcement và React flow đã merge |
| D | Completed | Student learning, Dashboard và Admin governance đã merge |
| Conditional Resource | Deferred by decision | AC-045/046 N/A; review lại tại P07 |
| E | Completed | `66/66` Must Pass; PR/main CI đều xanh `6/6` job |

Current overall status: `COMPLETED` tại merge commit `a6cd37b`.
