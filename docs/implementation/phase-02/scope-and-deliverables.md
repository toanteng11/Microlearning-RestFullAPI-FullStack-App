# Phase 02 Scope And Deliverables

## 1. In Scope - Must

### Authentication And Account

- Guest tự đăng ký Student bằng `fullName`, `email`, `password`, `confirmPassword`.
- Email normalize/unique; backend bỏ hoặc từ chối field ngoài allowlist như `role`, `status`, `permissions`.
- Password policy 12-128 ký tự, không có khoảng trắng đầu/cuối, không trim ngầm và hash bằng Argon2id.
- Login bằng email/password cho account `ACTIVE`.
- Access JWT short-lived chỉ giữ trong memory của React.
- Opaque refresh token trong cookie `HttpOnly`, rotate/revoke/reuse detection theo session family.
- Logout, session restore, `GET/PATCH users/me` và redirect theo role.
- Account status `PENDING`, `ACTIVE`, `INACTIVE`, `BLOCKED`, `DELETED` và authorization middleware.
- Rate limit theo IP và login cooldown theo identity: 5 lần sai trong 15 phút, cooldown 15 phút.

### Authorization And Administration

- Role `STUDENT`, `TEACHER`, `ADMIN`, `SUPER_ADMIN` với permission catalog tĩnh trong code cho MVP.
- Protected route trên Web và authorization bắt buộc tại API.
- Admin User Management entry, Student List, Teacher List và Admin List riêng biệt.
- Server-side search, status filter, sort allowlist, pagination và safe projection.
- User detail cơ bản; status update; role update có giới hạn và chống self-escalation/final Super Admin removal.
- Bootstrap Super Admin bằng CLI bảo mật cho môi trường mới.

### Teacher Invitation

- Admin tạo invitation bằng normalized Teacher email, expiry và `MANUAL_COPY`.
- Token crypto-random, database chỉ lưu hash; raw link chỉ trả một lần trong create response.
- Admin copy link trong UI hiện tại và có feedback; không có auto-email.
- List/detail/revoke invitation; trạng thái `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`.
- Public preview và accept invitation; email matching; Teacher tự đặt password.
- User creation và invitation acceptance trong MongoDB transaction.

### Cross-cutting

- AuditLog append-only cho invitation, account status, role và bootstrap action.
- OpenAPI/Swagger cho mọi endpoint P02, security scheme, cookie behavior, schema và error.
- Docker Compose MongoDB single-node replica set để test transaction.
- Unit, API integration, component, browser E2E, negative authorization và security tests.
- CI chạy đầy đủ quality gate, Mongo integration và auth E2E phù hợp.

## 2. In Scope - Should Khi Không Ảnh Hưởng Must

- Forgot/Reset Password chỉ được đưa vào khi delivery mechanism được phê duyệt; public response luôn chống account enumeration.
- Advanced User Search toàn role.
- Invitation copy event/channel hint trong phiên vừa tạo link.
- Avatar URL, department, studentCode và phone profile field nếu BA xác nhận validation/privacy.
- UI tối ưu mobile cho bảng Admin bằng card-list responsive.

## 3. Out Of Scope

- Classroom, Class Code, Classroom Invite Link, Enrollment và roster: Phase 03.
- Course, Module, Lesson, resource, deadline: Phase 04.
- Quiz, Assignment, Submission, Grade, Feedback: Phase 05.
- Dashboard analytics, To-do, progress, ranking và report đầy đủ: Phase 06.
- Gmail/SMTP/Zalo/Facebook API hoặc bất kỳ auto-delivery integration nào.
- Google OAuth, social login, SSO, MFA và passwordless authentication.
- Email verification cho Student trong MVP baseline.
- Refresh token ở `localStorage`/`sessionStorage`, cross-site cookie và `SameSite=None`.
- Multi-role tùy ý, permission editor tổng quát và custom role builder.
- Hard delete User/AuditLog hoặc xóa learning history.
- Production Cloud, Redis distributed store và multi-instance auth: Phase 07.
- Import user hàng loạt, SIS/Google Workspace sync.

## 4. Functional Boundary Notes

| Chủ đề | Boundary P02 |
| --- | --- |
| Student registration | Tạo identity; không tạo Enrollment, To-do hoặc progress |
| Role dashboard | Chỉ shell/empty state và navigation phù hợp role; dashboard nghiệp vụ ở phase sau |
| Teacher counts | `classroomCount`/`courseCount` có thể trả `0` hoặc chưa trả trước P03/P04; không tạo dữ liệu giả |
| Teacher block | P02 kiểm status/session/audit; ownership prerequisite được nối thật ở P03 khi có Classroom |
| Invitation copy lại | Không thể phục hồi raw token từ hash; mất link thì revoke và tạo invitation mới |
| Password reset | Không tuyên bố hoàn thành khi chưa có kênh delivery hợp lệ |
| Audit viewer | P02 ghi AuditLog; màn hình lọc/export toàn diện thuộc phase reporting/admin sau |

## 5. Deliverables

| ID | Deliverable | Location mục tiêu | Acceptance basis |
| --- | --- | --- | --- |
| P02-DEL-001 | Auth/session/security decision baseline | `docs/implementation/phase-02` | Security review |
| P02-DEL-002 | Identity/RBAC modules | `apps/api/src/modules`, `shared/auth` | API/security tests |
| P02-DEL-003 | User/session/invitation/audit collections | API models/repositories | Index/transaction tests |
| P02-DEL-004 | Auth and profile APIs | `/api/v1/auth`, `/api/v1/users` | Contract/integration tests |
| P02-DEL-005 | Admin user APIs | `/api/v1/admin/users` | Role-list/permission tests |
| P02-DEL-006 | Teacher Invitation APIs | Admin/public invitation routes | State/atomicity tests |
| P02-DEL-007 | React auth and role workspace | `apps/web/src/features/auth`, app guards | Component/E2E tests |
| P02-DEL-008 | Admin user/invitation UI | `apps/web/src/features/admin` | Browser/UAT evidence |
| P02-DEL-009 | OpenAPI/Swagger P02 contract | API docs module | Parser/contract tests |
| P02-DEL-010 | Replica-set Local/CI runtime | Compose/CI/infrastructure docs | Transaction smoke |
| P02-DEL-011 | Seed/bootstrap/test data tooling | API scripts/test fixtures | Idempotency/redaction review |
| P02-DEL-012 | Phase test/evidence/exit package | Phase 02 docs | Exit review |

## 6. Non-Deliverable Claims

Các nội dung sau không được ghi là đã hoàn thành chỉ vì có placeholder hoặc schema:

- Forgot Password nếu user không nhận được link an toàn.
- Teacher list counts nếu chưa được nối với Classroom/Course source.
- Production-ready distributed rate limiting nếu vẫn dùng process memory/IP limiter.
- Cloud security nếu chỉ mới chạy localhost/Compose.
- RBAC đầy đủ toàn LMS nếu mới kiểm soát resource P02.

## 7. Scope Approval

| Review perspective | Document readiness | Implementation gate |
| --- | --- | --- |
| Product Owner/BA | Must/Should/Out of scope và manual invitation đã được ghi nhận theo chỉ đạo `2026-07-15` | Change Control nếu đổi scope |
| Technical | Architecture, dependency và PR sequence đã sẵn sàng để review trong PR | Code review từng PR |
| Security | Threat-control baseline và security assertions đã được định nghĩa | Negative/security tests trước merge |
| QA | 39 AC, test matrix và evidence catalog đã sẵn sàng thực thi | Test/evidence review từng milestone |
| DevOps | Replica set, env/secret, Playwright CI và onboarding đã có implementation plan | Runtime/CI evidence trước phase exit |

Bảng trên xác nhận độ sẵn sàng của hồ sơ, không thay thế chữ ký của reviewer được chỉ định. Tên reviewer, ngày duyệt và PR/CI URL thực tế phải được ghi vào `evidence-register.md` khi phát sinh.
