# Phase 03 Scope And Deliverables

## 1. Objective

Xây dựng Classroom/Enrollment domain đủ tin cậy để Phase 04 gắn Course và learning content mà không phải sửa lại ownership, membership hoặc join security boundary.

## 2. Actor Scope

| Actor            | Trong P03                                                                                            | Không được làm                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Guest            | Mở Classroom Invite Link preview an toàn; đi tới Register/Login và giữ join context                  | Tạo Enrollment, xem roster hoặc Classroom private detail                         |
| Student `ACTIVE` | Join bằng Code/Link, xem Classroom đã enroll và metadata của chính membership                        | Tạo Classroom, xem roster, join khi chưa login, xem Classroom chưa enroll        |
| Teacher `ACTIVE` | CRUD mềm Classroom owned, quản lý join credential/settings/roster                                    | Quản lý Classroom Teacher khác; tạo Enrollment trực tiếp không qua approved flow |
| Admin            | Enrollment Policy, governance list/detail, offboarding guard; optional transfer/lock theo permission | Trở thành owner ngầm, xem raw Code/Invite Token, sửa learning history            |
| Super Admin      | Toàn bộ Admin permission và governance đặc biệt                                                      | Bỏ qua audit/data invariant                                                      |
| System           | Validate policy/order, transaction, unique/index, audit, safe projection                             | Tin role/object ID/client state mà không kiểm backend                            |

## 3. In Scope - Must

### 3.1 Classroom Lifecycle

- Create Classroom với `ownerTeacherId=currentUser.id`; client không gửi owner tùy ý.
- List role-scoped: Teacher thấy owned, Student thấy enrolled, Admin dùng governance endpoint riêng.
- Detail projection theo actor.
- Update allowlist: `name`, `description`, `subject`, `section` và settings được phép.
- Owner Teacher open/close enrollment trong Must; hệ thống nhận biết `LOCKED` để chặn join, còn Admin lock/unlock mutation là Conditional Should.
- Archive là soft state; không hard delete Enrollment/Audit/history.
- Optimistic concurrency bằng `expectedUpdatedAt` cho update nhạy cảm.

### 3.2 Class Code

- Code 8 ký tự từ alphabet không gây nhầm, hiển thị dạng `XXXX-XXXX`.
- Input normalize uppercase và bỏ khoảng trắng/dấu `-` trước lookup.
- Database chỉ lưu HMAC digest/metadata, không raw code.
- Mỗi Classroom tối đa một code `ACTIVE`; digest active unique toàn hệ thống.
- Create/regenerate/disable atomically; code cũ không join được.
- Raw code chỉ trả trong response create/regenerate và không xuất hiện lại ở list/detail/log/audit.

### 3.3 Classroom Invite Link

- Token opaque ngẫu nhiên tối thiểu 32 bytes, database chỉ lưu SHA-256 hash.
- Raw link chỉ trả một lần khi create/regenerate; Teacher phải copy ngay.
- Metadata endpoint chỉ trả status, expiry, createdAt, không reconstruct link.
- Disable/regenerate/expiry được kiểm ở backend.
- User-facing route giữ token tạm thời, xóa token khỏi URL trước API preview.

### 3.4 Join And Enrollment

- Join mutation chỉ cho authenticated `STUDENT` `ACTIVE`.
- Validation order: global policy -> Classroom setting/status -> credential -> Student/Enrollment.
- Code/link phải đúng method, Classroom, state và expiry.
- Một record Enrollment duy nhất cho cặp `classroomId + studentId` trong Must baseline.
- Retry/double click khi đã `ACTIVE` trả idempotent success với `alreadyEnrolled=true`.
- Failure không tạo partial Enrollment/Audit success/read model.
- Success lưu `joinedBy`, `joinedAt`, safe source ID và AuditLog/event.

### 3.5 Roster

- Teacher owner xem roster paginated, keyword/status filter và stable sort.
- Roster projection chỉ trả Student safe fields và membership metadata.
- Remove Student là transition `ACTIVE -> REMOVED`, reason bắt buộc, transaction với AuditLog.
- Removed Student mất quyền truy cập Classroom; learning history tương lai không bị xóa.
- Direct wrong-owner và wrong-role API phải bị từ chối.

### 3.6 Admin Enrollment Policy And Governance

- Singleton policy gồm `allowClassCodeJoin`, `allowInviteLinkJoin`, version và updater.
- Admin policy disable có hiệu lực ngay với join request mới, không remove Student cũ.
- Policy update dùng optimistic concurrency, reason và AuditLog.
- Governance list/detail paginated: owner, status, enrollment status, member count, created/updated timestamps.
- Teacher status mutation kiểm tra active Classroom qua port; không block/deactivate Teacher owner nếu chưa có archive/transfer plan theo BR-100.

### 3.7 UI, Contract And Operations

- Teacher/Student/Admin pages trong `frontend-implementation-plan.md` dùng API thật.
- Back/breadcrumb, loading, empty, validation, error, forbidden, stale-data và success state.
- OpenAPI bao phủ toàn bộ P03 route/method và representative errors.
- Mongo integration chạy replica set thật cho transaction/concurrency.
- CI bổ sung P03 integration, OpenAPI và browser E2E; không `continue-on-error`.

## 4. Conditional Should

| Capability                          | Điều kiện kéo vào                                        | Không được ảnh hưởng                      |
| ----------------------------------- | -------------------------------------------------------- | ----------------------------------------- |
| Ownership transfer                  | Offboarding flow được review và có active target Teacher | Must join/roster critical path            |
| Admin per-Classroom enrollment lock | Permission/audit/UX được khóa                            | Global policy precedence                  |
| Maximum capacity                    | Có Product Owner decision về default/override            | Transaction correctness                   |
| Rejoin                              | Có state machine và approval rule được BA chấp thuận     | Unique membership/history                 |
| Student code preview                | Public/privacy fields được review                        | Rate limit/anti-enumeration               |
| Interaction mode setting            | Phase 04 consumer contract được chốt                     | Không claim Stream/comment behavior ở P03 |

## 5. Explicit Out Of Scope

- QR generation/scanning.
- Public Classroom directory/search.
- Teacher manually adds Student bằng email.
- Enrollment import, CSV bulk add, SSO roster sync.
- Co-teacher, teaching assistant hoặc multi-owner.
- Invitation delivery tracking từ external channel.
- Stream/Classwork/Grades tab behavior.
- Course/content/assessment/progress collections ngoài foreign-key readiness.
- Hard delete Classroom/Enrollment.

## 6. Deliverables

| ID      | Deliverable                 | Completion evidence                                   |
| ------- | --------------------------- | ----------------------------------------------------- |
| P03-D01 | Planning/design baseline    | Approved docs, decisions, traceability, WBS           |
| P03-D02 | Classroom backend module    | Unit/service/API tests + OpenAPI                      |
| P03-D03 | Enrollment/join backend     | Real Mongo transaction/concurrency tests              |
| P03-D04 | Credential lifecycle        | Hash-only assertions, rotate/disable/expiry tests     |
| P03-D05 | Teacher UI                  | Create/list/detail/settings/roster browser flow       |
| P03-D06 | Student UI                  | Join Code/Link, enrolled list/detail browser flow     |
| P03-D07 | Admin UI                    | Enrollment Policy and governance list/detail          |
| P03-D08 | P02 offboarding integration | Teacher active-Classroom guard tests                  |
| P03-D09 | DevOps/seed/CI              | Deterministic synthetic fixtures and remote CI URL    |
| P03-D10 | Exit package                | Acceptance, risk, evidence, traceability, exit report |

## 7. Dependency Contract Từ Phase 02

- `AuthenticatedUser`, bearer/session validation và ACTIVE status enforcement.
- Permission catalog và middleware authorize.
- `UserRepository/UserReader` để kiểm role/status owner/Student.
- `AuditLogRepository` và Mongo Unit of Work.
- Error envelope, request ID, structured logger/redaction.
- React `AuthProvider`, `RoleRoute`, API client và `AppShell` navigation.
- Mongo replica set, Docker Compose, CI và Playwright harness.

Không copy lại auth logic trong Classroom module. P03 chỉ consume các port đã ổn định.

## 8. Scope Guard

Mọi yêu cầu thêm Course, Lesson, Announcement, Progress hoặc To-do vào P03 phải có Change Control. UI có thể dành route/tab extension point nhưng không dùng mock data hoặc placeholder rồi claim capability hoàn thành.
