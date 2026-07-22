# Phase 05 Traceability Matrix

## 1. Mục Đích

Ma trận này là nguồn đối chiếu cấp Phase giữa Business Analysis, quyết định kỹ thuật, dữ liệu, REST API, màn hình, kiểm thử và Acceptance Criteria. Mỗi Pull Request triển khai phải nêu các `P05-Txxx`, requirement và AC bị tác động; một chức năng không có đường truy vết đầy đủ không được tính là hoàn thành.

## 2. Quy Ước

- `Must`: bắt buộc để đóng Phase 05.
- `Conditional`: chỉ triển khai khi điều kiện trong `scope-and-deliverables.md` được chấp thuận; nếu defer phải có bằng chứng `N/A`.
- `Derived`: trạng thái được tính tại thời điểm đọc, không lưu như nguồn sự thật độc lập.
- Test ID trỏ tới nhóm kiểm thử trong `testing-strategy.md`; test case cụ thể được bổ sung cạnh code.
- Task ID trỏ tới `work-breakdown-structure.md`.
- Trạng thái hiện tại của implementation là `NOT_STARTED`; các cột bên dưới là contract dự kiến, không phải bằng chứng đã chạy.

## 3. Quiz Và Question

| BA / Rule | Capability | Data | REST API | Web | Task | Test | AC | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `FR-036`, `US-TCH-012`, `UC-019` | Teacher tạo Quiz trong đúng Classroom/Course | `quizzes` | `POST /api/v1/teacher/courses/{courseId}/quizzes` | Quiz Builder | `P05-T021..024` | `P05-IT-009..012`, `P05-E2E-01` | `P05-AC-015/016` | Must |
| `FR-036`, `BR-083/084` | Sửa cấu hình, lifecycle và publish prerequisite | `quizzes`, audit | `PATCH /teacher/quizzes/{quizId}`, status endpoint | Quiz Settings | `P05-T025..028` | policy/unit, `P05-IT-013..016` | `P05-AC-017..020` | Must |
| `FR-037`, `US-TCH-058..063` | CRUD/reorder bốn loại Question | `questions` | nested Question endpoints | Question Editor | `P05-T029..035` | golden validation, `P05-IT-009..016` | `P05-AC-021/023..025` | Must |
| `FR-037`, `US-TCH-064` | Question có image/video URL | `question.media` | Question payload | Media URL controls | `P05-T034` | URL/security suite | `P05-AC-022` | Conditional |
| `BR-085/086` | Correct answer và points chỉ Teacher được thấy trước release | private Question projection | Teacher/Student DTO tách biệt | Student không nhận answer key | `P05-T018/033` | answer-leak suite | `P05-AC-009/024` | Must |
| `BR-083..087` | Không publish Quiz sai cấu hình | Quiz aggregate validation | transition endpoint | publish error summary | `P05-T027/035` | invalid aggregate matrix | `P05-AC-018/025` | Must |

## 4. Attempt, Scoring Và Result

| BA / Rule | Capability | Data | REST API | Web | Task | Test | AC | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `FR-038`, `US-STU-036..039`, `UC-021` | Start/resume một active Attempt | `quiz_attempts` + unique active guard | start/detail endpoints | Quiz Intro/Player | `P05-T036..040` | `P05-IT-017..020`, concurrency | `P05-AC-026..030` | Must |
| `BR-088/089` | Attempt giữ immutable Quiz/Question/scoring snapshot | embedded snapshot | start response | Player render snapshot | `P05-T037/038` | mutation-after-start suite | `P05-AC-027/031` | Must |
| `FR-039`, `US-STU-040..043` | Save answer idempotent, resume an toàn | `answers`, attempt revision | answer-save endpoint | autosave/manual retry state | `P05-T041..044` | `P05-IT-021..023`, conflict | `P05-AC-032..034` | Must |
| `FR-040`, `BR-090..092`, `UC-022` | Submit/timeout đúng server time | Attempt state/timestamps | submit/finalize endpoint | Submit confirmation/expired state | `P05-T045..048` | `P05-IT-024..026`, fake clock/double submit | `P05-AC-035..037` | Must |
| `FR-041`, `BR-093..096` | Auto-grade objective, short answer manual review | score breakdown | submit/review/regrade endpoints | Result Review | `P05-T049..052`, `P05-T068..071` | golden scoring/regrade | `P05-AC-038..040/054..058` | Must |
| `FR-042`, `US-STU-044..047` | Student chỉ thấy own released result | result release state/projection | own-result endpoint | Student Result | `P05-T050/084` | IDOR/field leak/`P05-E2E-03/04` | `P05-AC-009/011/012/039` | Must |
| `FR-043`, `US-TCH-065..068` | Teacher xem danh sách, review và regrade kết quả | attempt query indexes | Teacher result endpoints | Quiz Results | `P05-T069/084/087` | paging/filter/review/privacy | `P05-AC-037..040` | Must |

## 5. Assignment Và Submission

| BA / Rule | Capability | Data | REST API | Web | Task | Test | AC | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `FR-044`, `US-TCH-013`, `UC-056` | Teacher tạo/sửa/publish/preview Assignment | `assignments` | Course Assignment endpoints | Assignment Editor | `P05-T053..058` | `P05-IT-035..038`, `P05-E2E-05` | `P05-AC-041..047/049` | Must |
| `FR-044`, `BR-069..073` | Due date, late/resubmit, submission method | assignment policy | create/update/transition | policy controls | `P05-T055..058` | validation/fake clock | `P05-AC-042..046` | Must |
| `FR-045`, `US-STU-048..053`, `UC-057` | Student lưu draft/turn in | `submissions`, `submission_revisions` | own submission endpoints | Assignment Detail | `P05-T059..064` | `P05-IT-039..044`, `P05-E2E-05..07` | `P05-AC-050..053` | Must |
| `FR-045`, `BR-074..078` | Unsubmit/resubmit theo policy, không mất history | current + append-only revisions | unsubmit/turn-in endpoints | revision/status timeline | `P05-T063..067` | race/retry/history | `P05-AC-052/054/055` | Must/Conditional |
| `FR-045` | Nộp external link hoặc MARK_DONE | submission content | submission payload | link/mark-done controls | `P05-T061/085` | URL/method matrix | `P05-AC-048` | Conditional |
| `BR-079/080` | Roster `MISSING/LATE` là projection theo effective deadline; Submission giữ evidence tại lúc turn-in | deadline resolver + submission timestamps | list/detail projection | status chip/filter | `P05-T075..079/086` | boundary time suite | `P05-AC-051/053/064` | Must |

## 6. Grade, Feedback Và Return

| BA / Rule | Capability | Data | REST API | Web | Task | Test | AC | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `FR-046`, `US-TCH-069..073`, `UC-061` | Teacher xem Submission và chấm điểm | `grades`, grade history | Teacher submission/grade endpoints | Submission Table/Grader | `P05-T068..073/087` | `P05-IT-045..052`, `P05-E2E-08` | `P05-AC-056..058/060` | Must |
| `FR-047`, `BR-094..096` | Return/regrade có revision, history và audit | grade event/history | return/regrade endpoints | return/regrade confirmation | `P05-T071..074` | stale revision/concurrency | `P05-AC-057/058` | Must |
| `FR-048`, `US-STU-054..057`, `UC-063` | Student xem own returned Grade/Feedback | role projection | own grades endpoints | Grades list/detail | `P05-T073/088` | unreleased 404/IDOR/`P05-E2E-08` | `P05-AC-060/061` | Must |
| `US-TCH-074`, `US-STU-058` | Private comment theo Assignment | comments collection/event | comment endpoints | comment thread | `P05-T074/089` | membership/privacy | `P05-AC-059` | Conditional |

## 7. Deadline Exception Và Learning Integration

| BA / Rule | Capability | Data | REST API | Web | Task | Test | AC | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `FR-067`, `US-TCH-018`, `UC-064`, `BR-081/082` | Teacher gia hạn riêng từng Student | `activity_deadline_exceptions`, history | deadline exception endpoints | Exception dialog/history | `P05-T075..080/090` | `P05-IT-053..060`, `P05-E2E-09` | `P05-AC-062..064` | Must |
| `FR-049/050/054..057` | Classwork/To-do/Deadline View có Quiz/Assignment | activity reader v2 | existing aggregate endpoints v2 | Student dashboards | `P05-T081..086` | `P05-IT-061..068`, P04 regression, `P05-E2E-11` | `P05-AC-065..067` | Must |
| `FR-059..061` | Course progress theo required activity completion | progress read model v2 | progress/dashboard endpoints | progress views | `P05-T082/091` | denominator/visibility tests | `P05-AC-066/067` | Must |
| `FR-062/063` | Basic Gradebook view | grade read model | Teacher course gradebook endpoint | Gradebook table | `P05-T092` | privacy/paging | `P05-AC-068` | Conditional |
| `FR-064/069` | Pagination/filter/sort và audit | indexes, AuditLog | query params/audit service | table controls | `P05-T017/072/080/093` | contract/query/audit tests | `P05-AC-011..014/069` | Must |
| `US-ADM-010`, `FR-012/067` | Admin Course governance thấy assessment counts, không private evidence | metadata aggregation | existing Admin Course endpoints | existing Admin governance | `P05-T081/091/094` | projection/privacy/P04 regression | `P05-AC-006/067/073` | Must |

## 8. Cross-Cutting Quality

| NFR / Acceptance | Capability | Artifact | Task | Test / Evidence | AC |
| --- | --- | --- | --- | --- | --- |
| Security/RBAC/IDOR | Permission + ownership + enrollment + projection | `security-ownership-and-privacy.md` | `P05-T009..018`, `P05-T094` | negative authorization matrix | `P05-AC-005..014/073` |
| API consistency | Zod, error envelope, pagination, idempotency, revision | OpenAPI/runtime routes | `P05-T019/020/095` | OpenAPI parity/negative schemas | `P05-AC-069` |
| Reliability | Transaction, unique index, retry, optimistic conflict | repositories/services | `P05-T012..017/096` | concurrency/rollback suite | `P05-AC-071` |
| Performance | Indexed Teacher tables and Student dashboard | explain/query evidence | `P05-T097` | seeded p95 dataset | `P05-AC-074` |
| Accessibility | Keyboard, focus, labels, live status, reduced motion | React screens | `P05-T098` | axe/manual keyboard + browser journey | `P05-AC-072` |
| DevOps | deterministic seed, Docker, CI, secret/dependency scan | workflow/evidence | `P05-T099..103` | coverage/runtime/clean-clone/CI reports | `P05-AC-070/075..077` |
| Documentation/exit | Swagger, evidence, exit review | Phase docs | `P05-T104..108` | evidence links + review | `P05-AC-078` |

## 9. Handoff Và Boundary

| Contract | Producer | Consumer | Phase 05 responsibility |
| --- | --- | --- | --- |
| `CourseScopeReader` | Phase 04 | Assessment/Assignment modules | Dùng port hiện có; không import trực tiếp Course Mongoose model |
| `LearningActivityDescriptor` v2 | Phase 05 | Phase 04 To-do/Deadline/Progress và Phase 06 | Mở union thành `LESSON | QUIZ | ASSIGNMENT`, giữ tương thích Lesson |
| `LearningProgressReader` v2 | Phase 05 | Phase 06 reporting | Trả required completion theo activity, không áp weighted grade |
| Grade event/read model | Phase 05 | Phase 06 | Cung cấp score/points/release/status có version; Phase 06 chịu trách nhiệm weighting/ranking/export |
| Private object storage | Phase 07 | Assignment/media | Phase 05 chỉ giữ interface/metadata boundary, không ghi local disk |

## 10. Quy Tắc Cập Nhật

1. Khi requirement thay đổi, cập nhật BA alignment, contract, WBS, AC và matrix trong cùng Pull Request.
2. Khi code merge, bổ sung đường dẫn source/test thật vào cột evidence hoặc evidence register; không thay thế bằng mô tả chung.
3. Khi một Conditional bị defer, ghi decision owner, lý do, AC `N/A` và phase nhận bàn giao.
4. Khi test phát hiện contract sai, sửa contract trước khi sửa test; không nới assertion chỉ để CI xanh.
5. Phase Exit review phải truy ngược được mọi Must AC tới ít nhất một test tự động hoặc bằng chứng manual có thể tái lập.
