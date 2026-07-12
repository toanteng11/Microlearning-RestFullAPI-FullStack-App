# Acceptance Criteria Catalog

## Mục Đích

Catalog này cung cấp tiêu chí nghiệm thu có mã định danh cho các workflow và quality gate quan trọng. Criterion chi tiết được kiểm tra bởi test/UAT scenario cùng mục 18; cột traceability giúp team tìm requirement/business rule nguồn.

## Authentication And Access

| AC ID | Given / When | Then | Priority | Traceability |
| --- | --- | --- | --- | --- |
| AC-AUTH-001 | Given User ACTIVE có credential hợp lệ, When login | Then hệ thống tạo authenticated session/token phù hợp và điều hướng theo role từ backend. | Must | FR auth, BR-036 |
| AC-AUTH-002 | Given account PENDING/INACTIVE/BLOCKED/DELETED, When login/gọi protected API | Then truy cập bị từ chối an toàn, không thực hiện mutation nghiệp vụ. | Must | BR-015, BR-037 |
| AC-AUTH-003 | Given Student/Teacher/Admin gọi resource ngoài scope, When API request | Then trả `403` hoặc safe error theo policy, không trả data resource. | Must | BR-003, BR-004, BR-039, BR-040 |
| AC-AUTH-004 | Given user thay đổi request body/URL role/status/owner, When gọi mutation | Then backend không cho self-escalation hoặc ownership bypass. | Must | BR-038, BR-098 |
| AC-AUTH-005 | Given Guest nhập full name/email/password hợp lệ, When đăng ký | Then chỉ một User `STUDENT` `ACTIVE` được tạo, password được hash, không có session/Enrollment và UI chuyển đến Login. | Must | FR-002, BR-001A/001B |
| AC-AUTH-006 | Given registration request chứa role/status đặc quyền hoặc email trùng/password không hợp lệ, When gửi request | Then backend từ chối hoặc bỏ field không cho phép theo contract, không tạo account đặc quyền hoặc dữ liệu partial. | Must | FR-002, FR-065, BR-001A |

## Teacher Invitation And Classroom Join

| AC ID | Given / When | Then | Priority | Traceability |
| --- | --- | --- | --- | --- |
| AC-INV-001 | Given Admin authorized nhập email Teacher hợp lệ, When tạo invitation | Then invitation PENDING/MANUAL_COPY có expiry; raw link chỉ hiển thị/copy cho Admin theo policy; token hash được lưu. | Must | FR-006, BR-011 đến BR-014C, BR-042 đến BR-044 |
| AC-INV-002 | Given invitation PENDING hợp lệ và email khớp, When Teacher tạo password hợp lệ | Then User TEACHER ACTIVE được tạo/activate và invitation ACCEPTED atomically. | Must | BR-013, BR-045 |
| AC-INV-003 | Given invitation expired/revoked/accepted/email mismatch, When Teacher accept | Then activation bị từ chối, không tạo account partial, không lộ raw token/account detail. | Must | BR-012, BR-046 đến BR-049 |
| AC-JOIN-001 | Given Student ACTIVE, method/code/token hợp lệ, Classroom ACTIVE, When join bằng Code/Link | Then chỉ một Enrollment ACTIVE được tạo, `joinedBy` đúng và Student thấy Classroom. | Must | FR-021 đến FR-023, BR-002, BR-050 đến BR-056 |
| AC-JOIN-002 | Given global/Classroom join policy tắt hoặc Classroom LOCKED/ARCHIVED, When Student join | Then join bị từ chối và không tạo Enrollment/To-do/summary partial. | Must | BR-017 đến BR-019, BR-051, BR-057 |
| AC-JOIN-003 | Given Enrollment ACTIVE đã tồn tại, When Student retry/double join | Then API trả idempotent/conflict theo contract, không tạo duplicate enrollment. | Must | BR-053, BR-056 |

## Content, Learning And Deadline

| AC ID | Given / When | Then | Priority | Traceability |
| --- | --- | --- | --- | --- |
| AC-CNT-001 | Given Teacher owner ACTIVE tạo/publish Course Content, When required fields valid | Then Content PUBLISHED chỉ trong scope, Student enrolled thấy đúng activity; Draft không lộ. | Must | FR-026 đến FR-038, BR-058 đến BR-068 |
| AC-CNT-002 | Given Teacher không sở hữu Course hoặc Student direct URL đến draft/archive | When access/mutate | Then backend từ chối, không lộ content/file/media ngoài scope. | Must | BR-004, BR-059, BR-065 |
| AC-LRN-001 | Given Student ACTIVE/enrolled mở/complete valid Lesson | When completion submits/retries | Then Progress cập nhật idempotently, To-do/summary được cập nhật đúng. | Must | FR-052, FR-059, BR-005, BR-069 đến BR-072 |
| AC-LRN-002 | Given required/optional activities, When Course progress evaluated | Then progress/Course completion chỉ dùng required completion policy; denominator zero được xử lý rõ. | Must | BR-006, BR-073, Metric definitions |
| AC-DLN-001 | Given Teacher owner publish/assign Lesson, When set deadline | Then valid deadline hiển thị trong Teacher Course Dashboard, Student To-do và Deadline View. | Must | FR-030, BR-035, BR-061 |
| AC-DLN-002 | Given published Lesson, When Teacher reset deadline có reason | Then old/new history + AuditLog được lưu và To-do/Calendar/late/missing/summary được recalculated, không mất Progress/Submission/Attempt. | Must | BR-075 đến BR-080 |
| AC-DLN-003 | Given non-owner/no reason/archived Lesson/invalid past deadline, When reset deadline | Then action bị từ chối an toàn và không có partial update. | Must | BR-075 đến BR-080 |

## Assessment, Grade And Feedback

| AC ID | Given / When | Then | Priority | Traceability |
| --- | --- | --- | --- | --- |
| AC-ASM-001 | Given Teacher publishes Quiz, When Quiz has valid Question/options/correct answer | Then Student eligible can start attempt; Question image/video optional renders only when authorized. | Must | FR-036 đến FR-041, BR-083 |
| AC-ASM-002 | Given Student valid scope and attempt limit, When start/submit Quiz | Then attempt binds Student/Quiz/Course/Classroom, limit/time policy is enforced and retry creates no duplicate. | Must | BR-007, BR-084 đến BR-087 |
| AC-ASM-003 | Given objective/short-answer Quiz, When submit | Then objective score computed backend; manual review state is clear; Student sees result only when result policy permits. | Must | BR-088, BR-093 |
| AC-ASM-004 | Given Student submits Assignment valid type before/after due date | Then submitted/late/missing/closed behavior follows policy; no invalid attachment/current duplicate submission. | Must | FR-042 đến FR-045, BR-089 đến BR-091 |
| AC-ASM-005 | Given Teacher owns assessment, When grade/regrade/return feedback | Then score range/Student/assessment relation validated, Student sees result after return/publish and summary/ranking/audit update correctly. | Must | FR-046 đến FR-048, BR-092 đến BR-096 |
| AC-ASM-006 | Given Student A/Teacher B outside scope, When view/grade/comment | Then private answer/submission/feedback/grade is denied. | Must | BR-039, BR-095 |

## Dashboard, Reporting And Admin

| AC ID | Given / When | Then | Priority | Traceability |
| --- | --- | --- | --- | --- |
| AC-DASH-001 | Given Student has active enrollment and pending work, When opens Dashboard | Then To-do shows only actionable scoped item with deadline/status/action; completed work leaves main pending list. | Must | FR-049, FR-050, BR-029, BR-070 |
| AC-DASH-002 | Given Teacher opens owned Course, When Course Dashboard loads | Then activity list, Student list, deadline and ranking appear; ranking default `processScore DESC` with stable result. | Must | FR-027, FR-061, BR-033, BR-034, BR-081 |
| AC-ADM-001 | Given Admin authorized, When opens Student/Teacher/Admin list | Then each list contains only intended role, server pagination/filter/projection and permitted actions. | Must | FR-009A to FR-009C, BR admin governance |
| AC-ADM-002 | Given Teacher offboarding/block with active Classroom, When Admin action | Then transfer/archive prerequisite or audited emergency exception is enforced; historical data preserved. | Must | BR-024, BR-100 |
| AC-RPT-001 | Given Student/Teacher/Admin requests report/filter/export, When resource scope is valid/invalid | Then backend applies role/object scope; invalid filter/export leaks no data. | Must | REP-011 to REP-015, BR-105, BR-108 |
| AC-RPT-002 | Given aggregate/read-model report, When it is returned/exported | Then metric definition/freshness/as-of is visible; stale/partial/no-data handled clearly. | Must | REP-013, REP-014, BR-106, BR-107 |

## API, Security, Data And Operations

| AC ID | Given / When | Then | Priority | Traceability |
| --- | --- | --- | --- | --- |
| AC-API-001 | Given changed/new API, When Swagger and API are reviewed | Then endpoint, auth, request/response/error/pagination are documented and contract-consistent. | Must | FR-065 to FR-067, NFR-MNT-002 |
| AC-API-002 | Given invalid request/duplicate mutation/dependency error, When API called | Then standard safe error, requestId as applicable and no invalid/partial write. | Must | API error standard, BR-056, BR-072 |
| AC-API-003 | Given Local/Development or authorized Staging environment, When Developer/QA opens `/api-docs` | Then Swagger UI loads the same OpenAPI JSON contract, renders representative tags/operations/schemas and does not prefill/persist token/secret; Cloud exposure and `Try it out` follow approved environment policy. | Must | FR-067/067A, API-AC-009, APP-Q-003 |
| AC-SEC-001 | Given password/token/invitation/upload/export action, When inspected through API/log/database/UI | Then plain password/raw token/secret is not exposed; token/hash/access policy follows NFR. | Must | NFR-SEC/PRV, BR-044, BR-102 |
| AC-SEC-002 | Given file/media request outside scope or invalid type/size, When upload/view/download | Then backend rejects or controls access; object URL/key alone does not authorize. | Must if media/upload release | FR-068, BR-025, BR-103 |
| AC-DATA-001 | Given important mutation (join, deadline reset, submission, grade, role/status) | When transaction completes/fails | Then uniqueness/history/audit/read-model integrity are correct, no unwanted duplicate/partial record. | Must | Data requirements, BR-045, BR-053, BR-079, BR-101 |
| AC-OPS-001 | Given Staging/Cloud deployment | When release completes | Then health/version/role smoke/HTTPS/CORS/SPA fallback/logging pass and failed deploy has rollback evidence. | Must | NFR quality gate, DevOps section 15 |
| AC-OPS-002 | Given release with data risk | When release is approved | Then backup/restore/rollback/monitoring decision and evidence exist. | Must | NFR-REL/BKP/RBK, DevOps release rules |

## Catalog Rules

- `Must` criterion must have at least one executable test scenario/evidence before release within scope.
- A criterion can use several test scenarios when it includes happy path, negative authorization and data/audit verification.
- New Business Rule/FR/NFR changes must update affected AC row or create a new one; no change is accepted based only on informal manual test.
