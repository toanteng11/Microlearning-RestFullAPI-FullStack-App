# Teacher Invitation Test Scenarios

## Mục Đích

Tài liệu này kiểm tra quy trình Admin mời Teacher bằng invitation link thủ công. Đây là workflow bảo mật: Admin không biết password Teacher, hệ thống không tự gửi email trong MVP, raw token không được lưu/log và acceptance phải atomic.

## Test Data Baseline

- Admin `ACTIVE` có permission create/copy/revoke invitation.
- Email Teacher synthetic, chưa có Teacher `ACTIVE`.
- Invitation states: `PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`.
- Một Teacher account `ACTIVE` để test duplicate/conflict.
- Log/AuditLog access cho QA/Admin authorized, không hiển thị raw token trong evidence.

## Invitation Test Scenarios

| ID | Scenario | Preconditions | Expected result | Priority | Rule/criterion |
| --- | --- | --- | --- | --- | --- |
| TS-INV-001 | Admin tạo invitation cho email Teacher hợp lệ | Admin authorized, no active Teacher/pending invitation | Invitation `PENDING`, `MANUAL_COPY`, expiry; authorized Admin copy link. | Must | AC-INV-001 |
| TS-INV-002 | Admin copy invitation link để gửi thủ công | Vừa tạo invitation và raw link còn trong one-time client state | Clipboard works; copy-event dùng UUID idempotent, không gửi/trả raw link; no auto-email/Gmail dependency hoặc “email sent” claim. | Must | BR-014A/014C/044/048 |
| TS-INV-003 | Teacher mở invitation link hợp lệ | Pending/unexpired token | Safe activation form appears; no protected Admin detail/raw token exposed. | Must | BR-012/049 |
| TS-INV-004 | Teacher nhập matching email/password hợp lệ | Pending/unexpired invitation | Atomic activation: Teacher ACTIVE/role TEACHER, invitation ACCEPTED, password hash only, AuditLog. | Must | AC-INV-002 |
| TS-INV-005 | Teacher nhập email không khớp | Pending invitation | Safe mismatch error; invitation remains usable pending policy; no account activation. | Must | BR-014B/045 |
| TS-INV-006 | Teacher dùng token hết hạn | Invitation expiry passed | Request denied, status `EXPIRED` resolved/audited; no account activation. | Must | BR-012/047 |
| TS-INV-007 | Teacher dùng token đã accept | Accepted invitation | Reuse denied; no duplicate Teacher/account. | Must | BR-012/046 |
| TS-INV-008 | Admin revoke invitation chưa dùng | Pending invitation/Admin authorized | Status becomes `REVOKED`; AuditLog safe event. | Must | BR-046/101 |
| TS-INV-009 | Teacher dùng invitation đã revoke | Revoked invitation | Safe denial; no activation. | Must | BR-046/049 |
| TS-INV-010 | Password and confirmation mismatch | Pending invitation | Validation error; invitation state stays PENDING, no User created. | Must | BR-045 |
| TS-INV-011 | Admin cannot know Teacher password | Invitation/Teacher flow available | No UI/API/AuditLog/response exposes plain password; Admin cannot set it. | Must | BR-010/014 |
| TS-INV-012 | Duplicate pending invitation same normalized email | Existing pending/unexpired invitation | New create denied or requires revoke/expiry old one; no two valid pending invitations. | Must | BR-042/043 |
| TS-INV-013 | Invitation for existing ACTIVE Teacher | Teacher already ACTIVE | Create denied unless explicit override policy; no duplicate account. | Must | BR-042 |
| TS-INV-014 | Invalid/malformed token | Random/malformed URL token | Generic safe invalid invitation response; no internal lookup/detail. | Must | BR-049 |
| TS-INV-015 | Invitation create/accept race/failure simulation | Valid invitation, controlled failure before commit | No half-created active Teacher or consumed token; retry follows consistent state. | Must | BR-045 |
| TS-INV-016 | Raw token one-time/redaction contract | Invitation created/copied/listed/accepted | Raw link chỉ có trong create response/client memory; list/detail/copy-event/database/log/AuditLog chỉ chứa hash hoặc safe metadata, evidence phải sanitize working token. | Must | BR-044/102 |
| TS-INV-017 | Unauthorized user create/copy/revoke invitation | Student/Teacher/non-permitted Admin | API/UI action denied; no invitation/link disclosure. | Must | Access rules |
| TS-INV-018 | Invitation expiry boundary server time | Token at/before/after expiry | Server time determines result consistently; client clock cannot bypass. | Should | BR-047 |
| TS-INV-019 | Account status after accepted link | Teacher activation successful | Teacher can login/use Teacher allowed functions; no Admin privileges gained. | Must | BR-013/036 |
| TS-INV-020 | Audit trail completeness | Create/copy/revoke/accept actions executed | Safe actor/action/invitation/status/time recorded; no password/raw email link/token leak beyond allowed metadata. | Must | BR-101/102 |

## Pass Conditions

- All Must scenarios pass in Staging/UAT with synthetic emails and no real automatic email integration.
- Plain password không xuất hiện; raw invitation token chỉ được phép trong one-time create response/client memory và phải được sanitize khỏi evidence. List/detail/copy-event/log/database/audit không chứa raw token.
- Invitation state transition and account activation are atomic and traceable.
- External manual delivery remains Admin responsibility; no test assumes Gmail/Zalo/Facebook API integration.

## Liên Kết

- Business rules: `../17-business-rules/teacher-invitation-classroom-join-rules.md`.
- API: `../11-api-requirements/teacher-invitation-api.md`.
- Security: `security-privacy-acceptance.md`.
