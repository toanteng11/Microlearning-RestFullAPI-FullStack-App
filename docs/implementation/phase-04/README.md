# Phase 04 - Learning Content

## 1. Mục Đích

Phase 04 xây dựng increment Learning Content hoàn chỉnh trên nền Identity, RBAC, Classroom và Enrollment của Phase 02-03. Sau phase này, Teacher có thể tổ chức một Course thành Module, Micro Lesson, Flashcard và Announcement; quản lý publish lifecycle và deadline; Student đã enroll có thể học nội dung đã publish, điều hướng liền mạch và ghi nhận hoàn thành Lesson.

Phase này triển khai Course Dashboard và Student To-do theo phạm vi **Lesson completion v1**. Quiz, Assignment, Submission và Grade chưa tồn tại nên không được giả lập. Phase 05 mở rộng activity catalog; Phase 06 tổng hợp process score và reporting đa hoạt động.

## 2. Trạng Thái

| Thuộc tính | Giá trị |
| --- | --- |
| Phase ID | `P04` |
| Tên | `Learning Content` |
| Dependency | Phase 03 đã merge vào `main` tại `d9de828` |
| Planning branch | `docs/phase-04-planning-baseline` |
| Planning status | `COMPLETED` |
| Implementation branch | `feature/phase-04-content-foundation` |
| Implementation status | `COMPLETED` - đã merge vào `main` qua PR `#10` |
| Gate A | `APPROVED` - PR `#8`, CI `#18` và merge commit `66f400d` |
| Gate E | `PASSED` - `66/66` Must Pass, PR/main CI đều xanh đủ 6 job |
| Implementation PR | [PR #10](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/10) |
| Merge commit | [`a6cd37b`](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/commit/a6cd37b973242f44db1ebf9502ce5e0ba3acff60) |
| Exit target | Toàn bộ Must acceptance criteria Pass, không còn Critical/High defect |
| Phase tiếp theo | `P05 - Assessments and Grading` |

Planning baseline đã được repository owner review và merge qua protected workflow. Must implementation `P04-T009..T099` đã pass unit, component, Mongo replica-set integration, OpenAPI, performance, Docker seed/smoke, clean-clone onboarding và Playwright checks. Implementation được merge ngày `2026-07-21` qua PR `#10`; [PR CI](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/29798342894) và [post-merge main CI](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/29799307403) đều pass đủ 6 job bắt buộc. Resource/GCS Conditional scope được defer sang P07 theo quyết định đã phê duyệt. Phase 04 đã hoàn thành `66/66` Must acceptance criteria.

## 3. Business Outcome

- Teacher tạo Course trong Classroom mình sở hữu và quản lý Course theo lifecycle rõ ràng.
- Teacher tạo, sửa, sắp xếp Module và Lesson bằng optimistic concurrency; không silent overwrite.
- Teacher soạn Lesson dạng Markdown an toàn, tạo Flashcard, preview và publish khi đủ điều kiện.
- Teacher đặt hoặc đổi deadline từng Lesson; thay đổi sau publish có lý do và history bất biến.
- Teacher đăng Announcement; chỉ member hợp lệ xem được bản đã publish.
- Student xem Classwork đã publish, học Lesson, dùng Flashcard và điều hướng `Back/Previous/Next` ổn định.
- Student đánh dấu hoàn thành Lesson theo thao tác idempotent; retry không tạo progress trùng.
- Student To-do và Deadline View phản ánh Lesson đang cần làm; completed item rời danh sách chính.
- Teacher Course Dashboard hiển thị cấu trúc nội dung, roster và ranking dựa trên Lesson completion v1.
- Admin governance thấy được `contentCount` thật mà không có quyền sửa nội dung của Teacher.

## 4. BA Baseline

| Nhóm | ID chính |
| --- | --- |
| Functional Requirements | `FR-026..035`, `FR-049/050/052/053/057`, `FR-064/065/067/068/069` |
| User Stories | `US-TCH-005/006/010/011/015/019..021/038..057/076..079`; `US-STU-006/009..011/019..024/030..035/058..060` |
| Use Cases | `UC-009/011/012/017/018/020/041..044/046/053..055/059` |
| Business Rules | `BR-033..035`, `BR-058..081`, `BR-099`, `BR-101..103` |
| BA Acceptance | `DATA-AC-003..005`, `AC-DASH-001/002`, `UI-TEA-001..003`, `UI-STU-004/006`, `TS-018..020/026`, security/NFR criteria liên quan |

Chi tiết cách xử lý điểm giao nhau giữa Phase 04-06 nằm tại `ba-alignment-and-decisions.md`.

## 5. Must Scope

1. Course CRUD mềm, owner scope, list/detail và lifecycle.
2. Module CRUD mềm và reorder toàn bộ cấu trúc có kiểm soát đồng thời.
3. Lesson CRUD mềm, Markdown authoring, preview, schedule/publish/unpublish/archive.
4. Deadline hiện tại, deadline revision và immutable change history.
5. Flashcard CRUD mềm và reorder trong Lesson.
6. Announcement draft/publish/unpublish/archive trong Classroom Stream.
7. Student Classwork/Course/Lesson read model chỉ trả content nhìn thấy hợp lệ.
8. Lesson Player, Flashcard viewer và `Back/Previous/Next/breadcrumb`.
9. Idempotent Lesson completion và `learning_progress` source-of-truth.
10. Lesson-only To-do, Deadline View và progress summary v1.
11. Teacher Course Dashboard gồm summary, activities, Student list và ranking v1.
12. Admin Classroom governance `contentCount` và read-only Course visibility.
13. Permission, ownership, enrollment, XSS, URL safety, audit và abuse controls.
14. Swagger/OpenAPI, unit, integration, component, E2E, accessibility và concurrency tests.
15. Docker/CI/demo seed/evidence được mở rộng cho P04.

## 6. Conditional Should

- External `LINK` và `VIDEO_URL` resource metadata gắn Lesson/Module/Course.
- Upload `FILE/PDF/IMAGE` vào private Google Cloud Storage với authorized delivery.
- Teacher Preview as Student hoàn chỉnh cho resource.
- Autosave draft và unsaved-change recovery nhiều phiên.
- Scheduled publication reconciliation bằng Cloud Scheduler.
- Content reuse/duplicate giữa Course.
- Deadline shortening override dành cho một quyền quản trị được phê duyệt.

Conditional Should chỉ được kéo vào khi Must critical path xanh, có owner, acceptance criteria và change record. Không dùng local container filesystem để lưu upload.

## 7. Out Of Scope

- Quiz, Question, Attempt và auto-grading: Phase 05.
- Assignment, Submission, Grade, Feedback và per-Student deadline exception: Phase 05.
- Process score đa hoạt động, materialized `CourseProgressSummary`, báo cáo Admin: Phase 06.
- In-app notification/email khi deadline đổi: Phase 06 hoặc 07.
- Production Cloud Run/GCS provisioning, custom domain, backup/rollback production: Phase 07.
- QR enrollment, Google Classroom synchronization, live video conference và chat thời gian thực.
- Co-teacher, content marketplace, SCORM/xAPI và mobile native app.

## 8. Các Quyết Định Cốt Lõi

| Chủ đề | Baseline Phase 04 |
| --- | --- |
| Architecture | Modular Monolith; module mới giao tiếp qua service/reader port |
| Authoring | Markdown UTF-8, raw HTML bị vô hiệu; render qua sanitizer |
| Visibility | Server tính từ Account + Enrollment + Classroom + ancestor lifecycle |
| Concurrency | `expectedUpdatedAt` cho edit; `structureRevision` và `deadlineRevision` cho mutation đặc thù |
| Ordering | Client gửi exact ordered ID set; server transactionally gán order liên tục từ `0` |
| Completion | `learning_progress` unique theo Student + activity; completion idempotent |
| Dashboard | Tính từ Lesson progress tại request time; metric version `P04_LESSON_COMPLETION_V1` |
| To-do | Derived query cho published required Lesson; chưa materialize collection |
| Archive | Soft archive; không hard delete khi có history/progress |
| Resource | URL resource là Conditional Should; file upload chỉ dùng private GCS |

## 9. Tài Liệu Phase

| File | Mục đích |
| --- | --- |
| `phase-plan.md` | Gate, workstream, milestone và critical path |
| `scope-and-deliverables.md` | Khóa scope, actor, dependency và deliverable |
| `ba-alignment-and-decisions.md` | Giải quyết overlap/mâu thuẫn và BA refinement |
| `technical-decisions.md` | Decision register bắt buộc trước code |
| `architecture-and-module-design.md` | Module boundary, port và request flow |
| `content-lifecycle-and-visibility.md` | State machine, publish rules và visibility |
| `deadline-and-derived-state.md` | Deadline, late/missing, To-do và history |
| `security-ownership-and-governance.md` | Permission, object scope, XSS, audit và threat controls |
| `data-model-and-indexes.md` | Collection, field, index, transaction và migration |
| `migration-and-rollback.md` | Trình tự index deployment, rollback và data recovery |
| `api-contract.md` | Endpoint, payload, response/error và OpenAPI contract |
| `backend-implementation-plan.md` | Thứ tự triển khai backend theo vertical slice |
| `frontend-implementation-plan.md` | Route, page, form, state và accessibility |
| `devops-environment-and-seeding.md` | Env, seed, Docker, CI, logging và GCS boundary |
| `testing-strategy.md` | Test pyramid, fixture và quality gate |
| `acceptance-criteria.md` | Điều kiện Pass/Fail kiểm chứng được |
| `traceability-matrix.md` | BA -> task -> API/UI/data -> test |
| `work-breakdown-structure.md` | Task, dependency, output, estimate và status |
| `implementation-checklist.md` | Checklist theo Gate B-E |
| `risk-and-issues.md` | Risk, trigger, mitigation và contingency |
| `developer-start-guide.md` | Cách bắt đầu code, chia PR và chạy kiểm tra |
| `development-readiness-review.md` | Gate A review và điều kiện `READY_TO_CODE` |
| `conditional-resource-decision.md` | Quyết định defer Resource URL/GCS sang P07 |
| `evidence-register.md` | Danh mục bằng chứng cần thu thập |
| `phase-exit-evidence.md` | Template/kết quả test và runtime evidence |
| `exit-report.md` | Báo cáo đóng phase trung thực |

## 10. Definition Of Ready

- Must/Should/Out of scope và handoff Phase 05-06 không mâu thuẫn.
- Content lifecycle, ancestor visibility và publish prerequisites đã khóa.
- API request/response/error, permission và object scope đã khóa.
- Collection/index/transaction/concurrency behavior đã khóa.
- Deadline/timezone, completion, To-do và ranking v1 có công thức kiểm thử được.
- UI route, navigation, loading/empty/error/forbidden/conflict state đã định nghĩa.
- Acceptance criteria ánh xạ được tới test và evidence.
- WBS có dependency, critical path và PR strategy.
- Không còn decision `TBD` chặn Must implementation.

## 11. Exit Signal

Phase 04 chỉ được ghi `Completed` khi Must scope chạy bằng React/API/MongoDB thật, OpenAPI khớp runtime route, Docker integrated stack và browser E2E pass, CI của Pull Request và `main` xanh, không còn Critical/High defect, evidence có URL/commit cụ thể và Phase 05 nhận được content/activity contracts đã version hóa.
