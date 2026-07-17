# Phase 02 Developer Start Guide

## 1. Mục Đích

Tài liệu này là entry point để chuyển Phase 02 từ planning sang implementation. Developer phải đọc `development-readiness-review.md`, `technical-decisions.md`, `api-contract.md`, `data-model-and-indexes.md` và `security-session-and-rbac.md` trước khi thay đổi auth code.

## 2. Baseline Bắt Buộc

- Planning status: `READY_FOR_IMPLEMENTATION`.
- Implementation status: `NOT_STARTED`.
- Must scope: Student registration, session/auth, profile, RBAC, role-specific Admin lists và manual Teacher Invitation.
- Conditional Should không được đưa vào PR nếu chưa có Change Control: Forgot/Reset Password và Advanced Cross-role Search.
- OpenAPI, automated test và evidence phải đi cùng capability; không để cuối phase mới bổ sung.

## 3. Branch Và Pull Request Đầu Tiên

Tạo branch không dùng tiền tố `codex/`:

```bash
git switch main
git pull origin main
git switch -c phase-02-contract-runtime
```

Pull Request đầu tiên dùng tên đề xuất:

```text
feat: establish phase 02 auth runtime and contract foundation
```

PR description phải dẫn `P02-T010`, `P02-T011`, `P02-T012`; các baseline `P02-ADR-001`, `P02-ADR-002`, `P02-ADR-003`, `P02-ADR-005`, `P02-ADR-009`, `P02-ADR-012`, `P02-ADR-015`; cùng acceptance/evidence sẽ được tạo.

## 4. Phạm Vi PR-02A

### Được Thực Hiện

- Thêm dependency nền auth đã duyệt và kiểm tra native `argon2` trên Local/Docker/CI.
- Mở rộng typed environment schema và `.env.example`, không thêm secret thật.
- Chuyển Local/CI MongoDB sang single-node replica set `rs0`.
- Thêm idempotent replica-set init và readiness kiểm primary.
- Thêm real-Mongo transaction smoke harness cho Vitest.
- Chuẩn bị root Playwright dependency/config nếu tách được thành commit reviewable; chưa viết business E2E giả.
- Cập nhật Docker/CI/docs/evidence tương ứng.

### Chưa Thực Hiện Trong PR-02A

- Chưa tạo Register/Login endpoint hoặc UI.
- Chưa tạo Admin/Invitation feature hoàn chỉnh.
- Chưa đánh dấu acceptance implementation là Pass.
- Không thêm Forgot/Reset Password, OAuth, MFA hoặc auto-email.

## 5. Trình Tự Kỹ Thuật PR-02A

1. Cập nhật package/lockfile và xác minh Node/Docker compatibility.
2. Thêm environment fields với missing/invalid/Production security tests.
3. Cập nhật Compose Mongo command, healthcheck và init service/script.
4. Đổi URI Local/CI có `replicaSet=rs0` và hostname đúng runtime.
5. Thêm readiness primary check, không chỉ database ping.
6. Chạy transaction integration smoke trên replica set thật.
7. Cập nhật CI job/service, cache và failure diagnostics.
8. Chạy clean-clone-equivalent commands và ghi evidence không chứa secret.

## 6. Verification Trước Pull Request

```bash
npm ci
npm run check:ci
docker compose config
docker compose up --build
```

Ngoài các lệnh trên, PR-02A phải chứng minh MongoDB là primary và transaction commit/rollback hoạt động. Không dùng kết quả từ Mongo standalone hoặc mock để đóng task replica set.

## 7. Merge Gate PR-02A

- Config fail-fast và không có unsafe default.
- `.env.example` chỉ có placeholder an toàn.
- Mongo Local/CI primary ổn định; init rerun idempotent.
- Existing System Status, Swagger và Web vẫn hoạt động.
- Transaction smoke, Docker build và `npm run check:ci` pass.
- Secret scan và production dependency audit pass trên remote.
- PR không chứa credential, cookie, token, private email hoặc local `.env`.

## 8. Chuỗi PR Tiếp Theo

| PR | Branch đề xuất | Outcome |
| --- | --- | --- |
| PR-02A | `phase-02-contract-runtime` | Config, dependencies, replica set, test harness |
| PR-02B | `phase-02-identity-backend` | User/session models, security primitives, register/login/me |
| PR-02C | `phase-02-session-rbac` | Refresh race/reuse, logout, active family, RBAC/rate control |
| PR-02D | `phase-02-auth-web` | AuthProvider, multi-tab coordinator, Login/Register/Profile/guards |
| PR-02E | `phase-02-admin-users` | Role lists/detail/status/role/SystemGuard |
| PR-02F | `phase-02-teacher-invitations` | Create/copy/revoke/preview/accept and concurrency |
| PR-02G | `phase-02-hardening-exit` | OpenAPI completion, Playwright, security, evidence và exit |

Không tạo một branch chứa toàn bộ Phase 02. Mỗi PR phải merge theo dependency, rebase/update từ `main` và giữ required checks xanh.

## 9. Developer Handoff Checklist

- [ ] Đọc Gate A result và ADR baseline.
- [ ] Chọn Task ID và xác nhận dependency đã `Ready/Done`.
- [ ] Tạo branch đúng tên, không dùng `codex/`.
- [ ] Viết hoặc cập nhật test trước/cùng implementation.
- [ ] Cập nhật OpenAPI cho mọi route thay đổi.
- [ ] Gắn evidence path/CI URL sau khi remote checks pass.
- [ ] Không check Gate B-F khi chưa có source chạy thật.
