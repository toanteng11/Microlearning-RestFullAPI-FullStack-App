# Phase 02 Plan

## 1. Objective

Xây dựng increment Identity and User Administration chạy được end-to-end trên nền Phase 01. Sau phase này, hệ thống có danh tính đáng tin cậy để Phase 03 sử dụng cho Classroom ownership và Student enrollment.

## 2. Entry Criteria

| Entry criterion | Trạng thái đầu vào |
| --- | --- |
| Web/API build, test và Docker Compose hoạt động | Đạt từ P01 |
| MongoDB lifecycle, error envelope, request ID và logging có sẵn | Đạt từ P01 |
| OpenAPI/Swagger và CI required checks có sẵn | Đạt từ P01 |
| BA chốt Student self-registration và manual Teacher Invitation | Đã có baseline |
| BA chốt browser auth và password policy | Baseline DEC-013/014 được cụ thể hóa tại P02-ADR-001..003 |
| Phase 02 scope/task/acceptance được review | Đạt theo `development-readiness-review.md` ngày 2026-07-15 |

## 3. Milestones

| Milestone | Outcome bắt buộc | Exit signal |
| --- | --- | --- |
| P02-M1 - Contract Ready | Scope, decision, data model, API và threat model được review | Gate A `Pass`; P02-T001..T009 đạt `Done` sau khi planning baseline được merge trong PR-02P |
| P02-M2 - Identity Backend Ready | Register, login, refresh, logout, current user, session rotation và rate control chạy bằng API | API integration/security test pass |
| P02-M3 - Auth Web Ready | Login/Register/Auth bootstrap/Protected Route/Profile và role redirect dùng API thật | Component + browser auth flow pass |
| P02-M4 - Admin And Invitation Ready | Role-specific lists, status/role guard, invitation create/copy/revoke/accept và AuditLog tích hợp | Admin/Teacher E2E pass |
| P02-M5 - Hardening Ready | Negative authorization, concurrency, token redaction, Swagger và Mongo transaction test pass | CI quality/security jobs xanh |
| P02-M6 - Phase Exit | Compose demo, clean-clone onboarding, evidence và traceability hoàn tất | P02 exit review được ký |

### Milestone Result - 2026-07-17

| Milestone | Result |
| --- | --- |
| P02-M1..M4 | Pass |
| P02-M5 | Pass; local suites và remote CI `6/6` jobs xanh |
| P02-M6 | Pass; `39/39` acceptance criteria đạt, PR #4 đã merge vào `main` |

## 4. Delivery Sequence

```text
BA/Decision Review
  -> API + Data Contract
  -> MongoDB Replica Set + Test Harness
  -> Identity/Security Shared Components
  -> Register/Login/Refresh/Logout/Me
  -> React Auth Bootstrap + Public/Protected Routes
  -> Admin Users + Account Governance
  -> Teacher Invitation
  -> Swagger + E2E + Security Hardening
  -> Compose Demo + Phase Exit
```

Backend contract, Web UI và test fixture được phát triển theo lát cắt capability; không đợi toàn bộ backend hoàn thành mới bắt đầu frontend. Ví dụ, sau khi Register/Login contract được review, Backend và Frontend có thể làm song song bằng contract fixture có cùng schema.

## 5. Workstream Ownership

| Workstream | Accountable | Consulted |
| --- | --- | --- |
| Scope/BA trace | BA/Product Owner | Technical Lead/QA |
| Auth/session/RBAC | Backend Lead | Security/Frontend |
| MongoDB/index/transaction | Backend Lead | DevOps/QA |
| React auth/user/admin UI | Frontend Lead | BA/QA/Backend |
| OpenAPI/error contract | Backend Lead | Frontend/QA |
| Docker/CI/seed/bootstrap | DevOps | Backend/Security |
| Test/evidence/exit | QA Lead | All owners |

Một người có thể giữ nhiều vai trò trong đồ án, nhưng trách nhiệm review vẫn phải được thực hiện như các góc nhìn tách biệt.

## 6. Pull Request Strategy

| PR đề xuất | Nội dung | Dependency |
| --- | --- | --- |
| PR-02P | Planning baseline: decisions, contracts, WBS, test, risk và evidence templates | P01 completed |
| PR-02A | Dependencies, config, Mongo replica set và test harness | PR-02P/P02-M1 |
| PR-02B | User/session model, password/token utilities, register/login/me | PR-02A |
| PR-02C | Refresh rotation, logout, rate limit/cooldown, auth middleware/RBAC | PR-02B |
| PR-02D | React API client, AuthProvider, Login/Register/Profile/guards | PR-02B contract; tích hợp sau PR-02C |
| PR-02E | Admin user lists/detail/status/role và audit | PR-02C |
| PR-02F | Teacher invitation API/UI/transaction và audit | PR-02C/02E |
| PR-02G | OpenAPI completion, E2E, security hardening, docs/evidence | PR-02D/02E/02F |

Mỗi PR phải nhỏ đủ để review nhưng không tách contract khỏi implementation/test tương ứng. Nếu dùng chuỗi PR phụ thuộc, PR sau target branch của PR trước và phải rebase về `main` sau khi PR trước merge.

## 7. Estimate And Capacity Rule

- Estimate trong WBS là ngày công kỹ thuật tham khảo, không phải lịch cam kết.
- Baseline hiện có `68` task với tổng effort tham khảo `58.0` ngày công kỹ thuật.
- Lịch triển khai phải được tính riêng sau khi owner review dependency, khả năng làm song song và năng lực hiện tại.
- Security, transaction, E2E và review không được cắt khỏi Must để đạt ngày tùy ý.
- Task Should chỉ được kéo vào khi toàn bộ Must task trên critical path không bị ảnh hưởng.

## 8. Scope Change Rule

Các thay đổi sau bắt buộc đánh giá BA, security, data và test impact trước khi thêm vào phase:

- Email verification hoặc tự động gửi email.
- OAuth/Google Sign-In/Social Login.
- MFA.
- Cross-site cookie hoặc Frontend/API khác site.
- Multi-role động hoặc permission editor tổng quát.
- Tự đăng ký Teacher/Admin.
- Classroom/Enrollment/Content capability.
- Redis/distributed session/rate-limit store.

## 9. Exit Criteria

Phase 02 đạt `Completed` khi:

- Tất cả Must task và P02 acceptance criteria đạt `Pass`.
- Không còn lỗi Critical/High về authentication, authorization, token, account state hoặc data integrity.
- Register -> Login -> protected role workspace và Admin -> Invite -> Teacher Activate -> Login chạy bằng API thật.
- Refresh rotation, reuse detection, logout và account block revoke được kiểm chứng.
- Student/Teacher/Admin list không trộn role và chỉ trả projection được phép.
- MongoDB index/transaction behavior, Swagger, Compose, CI và browser E2E có evidence.
- Risk, traceability, checklist, evidence register và exit report được cập nhật.
- Phase 03 nhận được stable identity/RBAC contract và seed data phù hợp.
