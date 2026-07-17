# Phase 02 Implementation Checklist

## 1. Gate A - Ready To Code

- [x] Scope Must/Should/Out of scope được khóa trong baseline ngày 2026-07-15.
- [x] P02-ADR-001..015 được chấp nhận làm implementation baseline.
- [x] Threat-control matrix có control và verification tương ứng.
- [x] API request/response/error và role-list contract có schema chuẩn để triển khai.
- [x] Data model/index/transaction và concurrency invariant đã được chốt.
- [x] Critical path có accountable workstream, dependency và PR sequence.

## 2. Gate B - Runtime And Security Foundation

- [x] Mongo Local/CI replica set primary và readiness đúng.
- [x] Auth environment fail-fast, không có unsafe default.
- [x] User/Session/LoginState/Invitation/Audit schemas và indexes tồn tại.
- [x] Password/token/JWT/cookie/origin utilities có unit tests.
- [x] Logging redacts header/body/URL token-sensitive fields.
- [x] Permission catalog và auth middleware có negative tests.

## 3. Gate C - Authentication API And Web

- [x] Register Student không session/Enrollment và chặn privilege injection.
- [x] Login ACTIVE User tạo access JWT + refresh cookie.
- [x] Identity cooldown và IP limiter đúng threshold.
- [x] Refresh rotates, detects reuse và revokes family.
- [x] Multi-tab refresh dùng Web Locks/BroadcastChannel hoặc grace fallback, không tự revoke.
- [x] Logout/revoke/clear cookie đúng.
- [x] `/users/me` và profile allowlist đúng.
- [x] AuthProvider bootstrap/single-flight/cache clear đúng.
- [x] Login/Register/Profile/role guards dùng API thật.

## 4. Gate D - Admin Users

- [x] Student/Teacher/Admin APIs fixed role scope.
- [x] Pagination/filter/search/sort allowlist và safe projection.
- [x] User detail permission theo target role.
- [x] Status transition + session revoke + audit atomically.
- [x] Role transition chặn self/final Super Admin violation.
- [x] Concurrent privileged mutation được serialize bằng SystemGuard.
- [x] UI entry/list/detail có đầy đủ states và Back context.
- [x] Direct wrong-role API tests pass.

## 5. Gate E - Teacher Invitation

- [x] Create PENDING/MANUAL_COPY, hash only và one-time link.
- [x] Unique partial index chặn concurrent PENDING invitation cùng email.
- [x] UI warning/copy feedback, không auto-email; copy event idempotent được audit.
- [x] List/detail không chứa/reconstruct token/link.
- [x] Preview redacts token trong log.
- [x] Revoke/expiry/state transition đúng.
- [x] Accept dùng Mongo transaction và email/password validation.
- [x] Concurrent/reuse/expired/revoked/mismatch tests pass.
- [x] Audit events safe.

## 6. Gate F - Quality And Exit

- [x] OpenAPI P02 parse/route coverage pass; Swagger browser review pass.
- [x] Unit, integration, transaction, component, E2E và security suites pass local.
- [x] Coverage không thấp hơn P01 thresholds.
- [x] Docker Web/API build, non-root và Compose healthy.
- [x] Remote Secret scan/dependency audit/quality/integration/E2E/OpenAPI jobs pass và có URL.
- [x] Browser desktop/mobile/accessibility/storage/cookie review pass.
- [x] Clean-clone onboarding pass.
- [x] `acceptance-criteria.md` đạt `39/39`; `P02-AC-033` có PR và Actions run evidence.
- [x] Traceability, risk, evidence và exit report đã cập nhật theo local/remote result.
- [x] Phase 03 readiness ghi stable auth/user contract và residual dependency.

## 7. Không Được Check Done Khi

- Chỉ có mock hoặc UI chưa gọi API thật.
- API đúng happy path nhưng chưa có wrong-role/status/replay test.
- Swagger chưa cập nhật hoặc list trả field sensitive.
- Mongo transaction chỉ được mock, chưa chạy replica set.
- CI/E2E bị skip/continue-on-error.
- One-time link behavior chưa được UI giải thích.
- Forgot Password không có delivery nhưng được ghi hoàn thành.
