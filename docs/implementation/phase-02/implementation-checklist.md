# Phase 02 Implementation Checklist

## 1. Gate A - Ready To Code

- [x] Scope Must/Should/Out of scope được khóa trong baseline ngày 2026-07-15.
- [x] P02-ADR-001..015 được chấp nhận làm implementation baseline.
- [x] Threat-control matrix có control và verification tương ứng.
- [x] API request/response/error và role-list contract có schema chuẩn để triển khai.
- [x] Data model/index/transaction và concurrency invariant đã được chốt.
- [x] Critical path có accountable workstream, dependency và PR sequence.

## 2. Gate B - Runtime And Security Foundation

- [ ] Mongo Local/CI replica set primary và readiness đúng.
- [ ] Auth environment fail-fast, không có unsafe default.
- [ ] User/Session/LoginState/Invitation/Audit schemas và indexes tồn tại.
- [ ] Password/token/JWT/cookie/origin utilities có unit tests.
- [ ] Logging redacts header/body/URL token-sensitive fields.
- [ ] Permission catalog và auth middleware có negative tests.

## 3. Gate C - Authentication API And Web

- [ ] Register Student không session/Enrollment và chặn privilege injection.
- [ ] Login ACTIVE User tạo access JWT + refresh cookie.
- [ ] Identity cooldown và IP limiter đúng threshold.
- [ ] Refresh rotates, detects reuse và revokes family.
- [ ] Multi-tab refresh dùng Web Locks/BroadcastChannel hoặc grace fallback, không tự revoke.
- [ ] Logout/revoke/clear cookie đúng.
- [ ] `/users/me` và profile allowlist đúng.
- [ ] AuthProvider bootstrap/single-flight/cache clear đúng.
- [ ] Login/Register/Profile/role guards dùng API thật.

## 4. Gate D - Admin Users

- [ ] Student/Teacher/Admin APIs fixed role scope.
- [ ] Pagination/filter/search/sort allowlist và safe projection.
- [ ] User detail permission theo target role.
- [ ] Status transition + session revoke + audit atomically.
- [ ] Role transition chặn self/final Super Admin violation.
- [ ] Concurrent privileged mutation được serialize bằng SystemGuard.
- [ ] UI entry/list/detail có đầy đủ states và Back context.
- [ ] Direct wrong-role API tests pass.

## 5. Gate E - Teacher Invitation

- [ ] Create PENDING/MANUAL_COPY, hash only và one-time link.
- [ ] Unique partial index chặn concurrent PENDING invitation cùng email.
- [ ] UI warning/copy feedback, không auto-email; copy event idempotent được audit.
- [ ] List/detail không chứa/reconstruct token/link.
- [ ] Preview redacts token trong log.
- [ ] Revoke/expiry/state transition đúng.
- [ ] Accept dùng Mongo transaction và email/password validation.
- [ ] Concurrent/reuse/expired/revoked/mismatch tests pass.
- [ ] Audit events safe.

## 6. Gate F - Quality And Exit

- [ ] OpenAPI P02 parse/route coverage pass; Swagger browser review pass.
- [ ] Unit, integration, transaction, component, E2E và security suites pass.
- [ ] Coverage không thấp hơn P01 thresholds.
- [ ] Docker Web/API build, non-root và Compose healthy.
- [ ] Secret scan/dependency audit pass.
- [ ] Browser desktop/mobile/accessibility/storage/cookie review pass.
- [ ] Clean-clone onboarding pass.
- [ ] `acceptance-criteria.md` cập nhật 39/39 result.
- [ ] Traceability, risk, evidence và exit report hoàn tất.
- [ ] Phase 03 readiness ghi stable auth/user contract và residual dependency.

## 7. Không Được Check Done Khi

- Chỉ có mock hoặc UI chưa gọi API thật.
- API đúng happy path nhưng chưa có wrong-role/status/replay test.
- Swagger chưa cập nhật hoặc list trả field sensitive.
- Mongo transaction chỉ được mock, chưa chạy replica set.
- CI/E2E bị skip/continue-on-error.
- One-time link behavior chưa được UI giải thích.
- Forgot Password không có delivery nhưng được ghi hoàn thành.
