# Core Test Scenarios

## Mục Đích

Tài liệu này chứa test scenarios cấp hệ thống cho các workflow core. Scenario không thay thế test case automation chi tiết; QA có thể tách mỗi scenario thành test case có data/request/assertion riêng. Các mã `TS-001` đến `TS-018` được giữ nguyên để bảo toàn traceability.

## Quy Ước Thực Thi

| Field | Quy tắc |
| --- | --- |
| Environment | Ghi Staging/UAT, build version/commit, API/frontend URL khi thực thi. |
| Data | Dùng account/lớp/course/activity synthetic; ghi precondition rõ. |
| Evidence | Lưu actual result, screenshot/API response/requestId/AuditLog/read-model check phù hợp. |
| Negative test | Với role/scope/policy/token/deadline, phải gọi cả API hoặc flow direct URL, không chỉ kiểm UI. |
| Pass | Tất cả expected result, data state và side effect trong scenario đạt. |

## Core Functional Scenarios

| ID | Scenario | Actor | Preconditions | Expected result | Priority | Traceability |
| --- | --- | --- | --- | --- | --- | --- |
| TS-001 | Guest tự đăng ký Student account | Guest | Email synthetic unique; full name/password hợp lệ | Tạo đúng một account `STUDENT` `ACTIVE`; password không plain text; không tạo session/Enrollment/Progress/To-do; redirect Login. | Must | FR-002, AC-AUTH-005, BR-001A/001B |
| TS-001A | Chặn privilege injection và dữ liệu đăng ký không hợp lệ | Guest | Request chứa role/status đặc quyền, email trùng hoặc password invalid | Không tạo account đặc quyền/partial; trả standard validation/conflict response an toàn. | Must | AC-AUTH-006, BR-001A |
| TS-001B | Bắt buộc Login trước khi join Classroom | Guest/Student | Có Code/Link hợp lệ; Student vừa đăng ký nhưng chưa Login | Direct join bị `401` và không tạo Enrollment; sau Login `ACTIVE`, join context được khôi phục/validate lại và join thành công đúng một lần. | Must | FR-001/002/023, BR-001/001B/001C |
| TS-002 | Login bằng credentials hợp lệ | ACTIVE User | Valid credential/account ACTIVE | Authenticated access/session đúng role; route/dashboard phù hợp backend context. | Must | AC-AUTH-001 |
| TS-003 | Teacher tạo Classroom | ACTIVE Teacher | Teacher ACTIVE, permission valid | Classroom có ownerTeacherId đúng, status/policy mặc định; Teacher thấy Classroom của mình. | Must | FR-020, BR-016 |
| TS-004 | Teacher tạo/reset Class Code | Teacher owner | Classroom ACTIVE, global/Classroom code policy enabled | Code active đúng Classroom; code cũ bị invalid sau reset theo policy. | Must | FR-021, BR-052 |
| TS-005 | Student join Classroom bằng Class Code | ACTIVE Student | Valid code, Classroom ACTIVE, policy enabled | Một Enrollment ACTIVE/joinedBy CLASS_CODE, roster/Student Classroom update; audit safe. | Must | AC-JOIN-001 |
| TS-006 | Student join Classroom bằng Invite Link | ACTIVE Student | Valid Classroom Invite Link/token, policy enabled | Một Enrollment ACTIVE/joinedBy INVITE_LINK, no raw token stored/logged. | Must | AC-JOIN-001 |
| TS-008 | Student hoàn thành Lesson | ACTIVE Student | Enrolled, Lesson PUBLISHED/visible, deadline configured | Progress/completed time updates idempotently; To-do and summary reflect completion. | Must | AC-LRN-001 |
| TS-009 | Student nộp Quiz attempt | ACTIVE Student | Enrolled, Quiz PUBLISHED/available, valid Question | Attempt bound to Student/Quiz/Course/Classroom; score/status persisted; retry no duplicate. | Must | AC-ASM-002/003 |
| TS-010 | Teacher tạo Course | Teacher owner | Classroom ACTIVE/owned | Course belongs to Classroom/Teacher, starts DRAFT, not visible to Student before publish. | Must | FR-026, BR-058 |
| TS-011 | Teacher xem Classroom/Course progress report | Teacher owner | Course has at least two Student summary states | Only owned scope data appears; progress/late/missing/score fields match source/read model. | Should | FR-060, BR-039/074 |
| TS-012 | Student xem To-do trên Dashboard | Student | Multiple active Classroom with pending/completed work | Only actionable scoped pending item displayed; completed item not in main To-do; empty state correct. | Must | FR-049/050, BR-029/070 |
| TS-013 | Student mở activity từ To-do | Student | To-do item valid | Opens correct scoped activity; return context works and cannot open hidden/other Course data. | Must | FR-050/057, BR-030/062 |
| TS-014 | Student dùng Back/Previous/Next | Student | Multi-activity Module/Course, accessible prior/next items | Navigation follows displayOrder/visibility, no lost progress/form data without warning. | Must | FR-057, BR-062 |
| TS-015 | Teacher thêm image/video optional vào Quiz Question | Teacher owner | Valid Quiz/Question, allowed file/media policy | Media stored private/previewed; Student scoped Quiz sees it; Question without media remains valid. | Should | FR-038, BR-031/032/065 |
| TS-016 | Teacher mở Course Detail Dashboard | Teacher owner | Course contains activity and enrolled Student | Shows Course summary, activity list, Student list, deadline context; no cross-Course data. | Must | FR-027, BR-033 |
| TS-017 | Teacher xem Student Progress Ranking | Teacher owner | At least 3 Student with distinct/equal score/progress | Default `processScore DESC`; documented tie-break/stable ordering; pagination/filter works. | Must | FR-061/063, BR-034/081 |
| TS-018 | Teacher đặt deadline cho Lesson | Teacher owner | Lesson DRAFT then PUBLISHED/assigned | Publish requires deadline; deadline saved/visible in Course Dashboard, Student To-do/Deadline View. | Must | FR-030, BR-035/061 |

## Extended Workflow And Negative Scenarios

| ID | Scenario | Actor | Preconditions | Expected result | Priority | Traceability |
| --- | --- | --- | --- | --- | --- | --- |
| TS-019 | Teacher reset published Lesson deadline | Teacher owner | Lesson has Student progress/To-do; valid new deadline + reason | History/AuditLog old/new/reason saved; To-do/Calendar/late-missing/summary recalc; old record retained. | Must | AC-DLN-002, BR-075 to 079 |
| TS-020 | Deadline reset denied | Non-owner/Teacher owner | No ownership, no reason, archived Lesson or invalid past deadline | Standard denial; no deadline/history/read-model partial change. | Must | AC-DLN-003 |
| TS-021 | Student submit Assignment on time/late/closed | Student | Assignment variants: due future, due past late enabled, due past late disabled/closed | Correct submitted/late/missing/denied state; no invalid attachment/current duplicate. | Must | AC-ASM-004, BR-089 to 091 |
| TS-022 | Teacher grade, return and regrade Submission | Teacher owner | Student valid Submission, maxScore known | Grade range validated; Student sees only after return; regrade updates summary/report/audit. | Must | AC-ASM-005, BR-092 to 094 |
| TS-023 | Student/Teacher cross-scope assessment access denied | Student A/Teacher B | Student B/Teacher A assessment exists | No answer/submission/grade/comment data exposed via UI/API/URL. | Must | AC-ASM-006, BR-039/095 |
| TS-024 | Join method policy disabled/locked Classroom | Student | Global or Classroom policy disabled, Classroom LOCKED/ARCHIVED | Join denied safely; no Enrollment/To-do/summary partial record. | Must | AC-JOIN-002, BR-017 to 019/051/057 |
| TS-025 | Duplicate/rejoin Classroom attempt | Student | Existing ACTIVE Enrollment and historical REMOVED/LEFT variants | Duplicate active blocked/idempotent; rejoin chỉ được mở qua authorized policy và Student vẫn phải dùng Class Code/Invite Link hợp lệ. | Must/Should | AC-JOIN-003, BR-053/054 |
| TS-026 | Content visibility lifecycle | Student/Teacher | DRAFT, PUBLISHED, UNPUBLISHED, ARCHIVED content variants | Student sees/acts only PUBLISHED eligible content; historical behavior follows rule; direct URL denied. | Must | BR-058 to 068 |
| TS-027 | Required/optional Course completion | Student | Required Lesson/Quiz plus optional activity; completed/incomplete variants | Course completion only after all required policy conditions; optional incomplete does not block by default. | Must | AC-LRN-002, BR-006/073 |
| TS-028 | Account status and role bypass denial | BLOCKED Student/Teacher/Admin and active lower-role User | Direct protected API and manipulated role/status/owner request | No business action/no data leak/self-escalation; security/audit behavior follows policy. | Must | AC-AUTH-002/003/004 |
| TS-029 | Admin role-specific user lists | Admin | Users across Student/Teacher/Admin and pagination/filter data | Each list returns intended role/projection/action only; invalid list/permission denied. | Must | AC-ADM-001 |
| TS-030 | Teacher offboarding with active Classroom | Admin | Teacher owns active Classroom | Transfer/archive prerequisite enforced; emergency path audit/reason; history preserved. | Must | AC-ADM-002, BR-100 |
| TS-031 | Report/filter/export authorization | Student/Teacher/Admin | Self/owned/out-of-scope report data and export policy | Correct scope/freshness; cross-scope filter/export denied; private export/audit if enabled. | Must | AC-RPT-001/002 |
| TS-032 | File/media invalid or outside scope | Student/Teacher | Invalid type/size and cross-Course media URL | Upload/view denied; no public object/metadata claim; valid media remains scoped. | Must if upload/media | AC-SEC-002 |
| TS-033 | AuditLog integrity/redaction | Admin/QA | Perform invitation/status/deadline/grade/export action | Required event exists, append-only, safe fields; no password/raw token/secret/full file. | Must | BR-101/102 |
| TS-034 | API validation/idempotency/dependency error | API client | Invalid enum/date/id, duplicate request, simulated dependency issue | Standard error/requestId as applicable; no partial/duplicate write; health/error state observable. | Must | AC-API-002 |
| TS-035 | Staging deployment role smoke | DevOps/QA | Release candidate deployed | Health/version/HTTPS/CORS/SPA fallback; Student/Teacher/Admin core route/API smoke; logs/rollback evidence. | Must | AC-OPS-001/002 |
| TS-036 | Swagger UI contract and exposure policy | QA/DevOps | OpenAPI JSON and Swagger UI deployed in Local, Staging or Cloud environment | `/api-docs` renders the same versioned contract as `/api/v1/openapi.json`; tags, schemas, security scheme and server context are visible; Swagger UI does not persist authorization token; Local/Development enabled, Staging only for authorized users and Cloud restricted by default until APP-Q-003 is approved. | Must | AC-API-003, API-AC-009, FR-067A, BRQ-019 |
| TS-037 | Browser token/session security | QA/Security Reviewer | Browser auth available in Staging-like same-site environment | Access JWT never appears in `localStorage`/`sessionStorage`; refresh cookie has `HttpOnly`, `Secure`, `SameSite=Lax`, expected path; refresh rotates token, reuse/logout/reset/block revokes session family, cross-origin refresh is denied. | Must | SEC-AC-014, NFR-SEC-012, ADR-006 |
| TS-038 | Password policy and auth cooldown | QA/Security Reviewer | Test account and safe non-production environment | Password lengths 11/12/128/129 and leading/trailing spaces behave according to policy; login/reset messages do not enumerate accounts; five failed logins trigger the configured cooldown and safe response. | Must | SEC-AC-007/015, NFR-SEC-007/011 |

## Scenario Execution Template

| Field | Nội dung |
| --- | --- |
| Scenario ID / title | Ví dụ `TS-019 - Teacher reset published Lesson deadline`. |
| Build/environment | Version, commit, Staging/UAT URL. |
| Tester/date | Người thực hiện và thời điểm. |
| Preconditions/data | Account/status/role/Classroom/Course/Activity/Test data IDs. |
| Steps | Numbered UI/API actions. |
| Expected | Criterion/rule/API/data/audit outcome. |
| Actual/evidence | Result, screenshot/API/requestId/AuditLog/query-safe evidence. |
| Status | PASS / FAIL / BLOCKED / NOT RUN / WAIVED. |
| Defect/retest | Defect ID, severity, retest result. |

## Liên Kết

- Criteria: `acceptance-criteria-catalog.md`.
- Invitation tests: `teacher-invitation-test-scenarios.md`.
- Security/API/UI/DevOps acceptance: các file domain cùng thư mục.
