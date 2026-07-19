# Phase 03 Exit Evidence

## 1. Baseline

| Field             | Value                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| Phase             | `P03 - Classroom Management`                                           |
| Branch/commit     | `feature/phase-03-data-foundation`; commit chờ tạo qua Pull Request     |
| Verification date | `2026-07-19`                                                           |
| Environment       | Node.js 24; MongoDB 8 replica set `rs0`; Docker Compose; Chromium       |
| Data policy       | Chỉ synthetic data; evidence không chứa raw credential, secret hoặc PII |

## 2. Automated Quality

| Gate                                      | Result                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| Root quality check                        | Pass: `npm run check:ci`                                                   |
| API unit/service/route                    | Pass: `85/85`; coverage statements `79.73%`, lines `81.40%`                 |
| Web unit/component                        | Pass: `71/71`; coverage statements `83.41%`, lines `86.85%`                 |
| Real Mongo integration/concurrency        | Pass: `35/35`; statements `85.37%`, lines `88.02%`                          |
| Playwright P03                            | Pass: `9/9` critical journeys                                              |
| OpenAPI contract                          | Pass: `7/7`; exact `22` P03 operations                                     |
| Production dependency audit               | Pass: `0` vulnerabilities ở mức High trở lên                               |
| Runtime log/raw credential scan           | Pass: `0` sensitive pattern match                                          |
| Remote GitHub Actions/Gitleaks             | Not Run: chờ branch push và Pull Request                                    |

## 3. Security And Data

- Role/owner/Enrollment negative matrix Pass, gồm wrong role, non-owner, non-enrolled, non-ACTIVE actor và owner/status injection.
- Class Code dùng HMAC digest; Invite Link dùng hash; raw value chỉ trả ở create/regenerate response và bị loại khỏi DB, AuditLog, structured log, OpenAPI schema và browser storage.
- Unique indexes và transaction được kiểm tra trên MongoDB replica set thật. `20` concurrent join tạo đúng một Enrollment; forced audit failure rollback toàn bộ mutation.
- Global/local enrollment policy, Classroom state, credential state/expiry và membership state được revalidate trong join transaction.
- Join/preview rate limiting trả `429` theo error contract; validation allowlist chặn query/path/body không hợp lệ và NoSQL injection payload.
- Teacher offboarding bị chặn khi còn sở hữu active Classroom; không tạo partial User/session/audit state.

## 4. Docker And Clean Clone

- API và Web production images build thành công từ source hiện tại.
- Compose API/Web/Mongo healthy; API `/ready` xác nhận API và MongoDB `UP`.
- API container chạy non-root với UID/GID `1000`.
- Synthetic seed run 1 tạo `10` users và `8` Phase 03 entities; run 2 reuse `10` và `8`, không tạo duplicate.
- E2E dùng database tách biệt `microlearning-e2e-phase3-final`; không dùng dữ liệu thật.
- Clean Git clone rehearsal: tạo sanitized temporary repository, commit snapshot `5bf8dbe`, rồi clone sang `C:\tmp\microlearning-phase3-git-clone-20260719`. Clone không chứa `.env`, dependency hoặc artifact cũ; `npm ci`, `npm run check:ci` và `docker compose ... config --quiet` đều Pass.
- Remote image/CI evidence chưa có cho commit hiện tại; thuộc P03-AC-045.

## 5. Browser Review

- Swagger hiển thị đúng phạm vi Classroom, Class Code, Invite Link, Enrollment, roster và governance của Phase 03.
- Teacher Classroom list/detail/settings/share/roster/remove hoạt động với API thật; roster mobile chuyển thành row-card có nhãn, không ẩn dữ liệu.
- Student join by Code/Invite, Classroom list/detail hoạt động; nút join không vỡ layout ở mobile.
- Admin Enrollment Policy và Classroom governance list/detail hoạt động; bảng governance mobile không overflow ngang.
- Back/Forward, breadcrumb, loading/empty/error/forbidden/stale/success được component test và browser review.
- Invite token được xóa khỏi URL trước preview; không còn trong storage sau success/cancel. Console review không có error/warning.

## 6. Acceptance Accounting

| Result  | Count |
| ------- | ----- |
| Pass    | `44`  |
| Fail    | `0`   |
| Not Run | `1`   |
| Blocked | `0`   |

`P03-AC-045` là criterion duy nhất `Not Run`. Phase 03 đạt local exit candidate nhưng chưa đạt repository Definition of Done cho đến khi Pull Request, required GitHub Actions checks, Gitleaks và reviewer sign-off đều có bằng chứng thật.
