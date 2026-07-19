# Phase 02 Exit Evidence

## 1. Baseline

| Field | Value |
| --- | --- |
| Phase | `P02 - Authentication and Users` |
| Local verification date | `2026-07-17` |
| Branch | `phase-02-quality-release` |
| Code commit | `ff0e5fd` |
| Evidence commit | `e1c5479` |
| Pull Request | [#4](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/4) |
| Main merge commit | `61aa049` |
| Remote CI | [Actions run #8](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/29577811819): `6/6` jobs success |
| Environment | Windows 11, Node `24`, npm `11`, Docker Desktop, MongoDB `8.0` replica set `rs0` |
| Data policy | Chỉ dùng identity synthetic; không lưu password/token/cookie value vào tài liệu |

## 2. Automated Quality

| Gate | Result |
| --- | --- |
| `npm run check:ci` | Pass: lint, negative lint gate, format, typecheck, coverage, build |
| API unit/route/service tests | `13` files, `73/73` pass |
| API statement coverage | `78.68%` |
| Web component/unit tests | `11` files, `48/48` pass |
| Web statement coverage | `89.83%` |
| Mongo integration | `5` files, `21/21` pass |
| Playwright Chromium | `4/4` critical journeys pass |
| Production dependency audit | `0 vulnerabilities` |
| Remote required checks | `6/6` success: quality, Mongo transaction, OpenAPI, E2E, dependency audit, secret scan |
| `git diff --check` | Pass |

Integration coverage includes transaction commit/rollback, auth rotation/reuse, Admin governance, Teacher Invitation state/concurrency and real MongoDB index behavior.

## 3. Contract And Security

- OpenAPI parser and route coverage pass for all `19` Phase 02 operations; Swagger UI renders `24` total documented operations including system endpoints.
- Refresh cookie is `HttpOnly`, `SameSite=Lax`, scoped to `/api/v1/auth`; access token is absent from `localStorage` and `sessionStorage`.
- Two browser tabs can refresh concurrently without revoking the active family; reuse outside grace revokes the family.
- Database stores Argon2id password hashes and SHA-256 token hashes, never raw refresh/invitation tokens.
- Structured logger redacts authorization, cookie, password and token fields; runtime log scan found no demo password, bearer value or raw invitation query token.
- Student/Teacher calls to Admin routes are denied at API middleware, independent of frontend route visibility.

## 4. Docker And Clean Clone

Clean-clone rehearsal used a new temporary checkout of commit `ff0e5fd` and completed:

1. `npm ci`: `449` packages installed; audit found `0` vulnerabilities.
2. `npm run check`: `121` API/Web tests plus build passed.
3. Compose configuration validated; API and Web images built from the clean checkout.
4. MongoDB replica set initialized; Web, API and MongoDB reported healthy.
5. API process ran as `uid=1000(node)`.
6. Bootstrap first run created one synthetic Super Admin; second run returned `created=false`.
7. Seed first run created five synthetic role/status users; second run reused all five.
8. Mongo integration `21/21` and Playwright `4/4` passed against the clean-clone stack.

Local demo remains available at `http://localhost:3000`; Swagger at `http://localhost:4000/api-docs`.

## 5. Browser Review

Browser review covered Login, Register, Admin Dashboard, Profile, Student List, Teacher Invitation and Swagger at desktop/mobile breakpoints.

- No document-level horizontal overflow or incoherent element overlap was detected.
- Mobile Admin list switches from table to readable cards; filters and pagination remain operable.
- Form controls expose labels; navigation includes Back, Forward and Logout accessible names.
- Invitation UI explains one-time manual copy, does not expose a resend/auto-email action and removes activation token from the visible URL before preview.
- Swagger loaded without browser console errors.

## 6. Acceptance Accounting

| Result | Count |
| --- | --- |
| Pass | `39` |
| Fail | `0` |
| Not Run | `0` |
| Blocked | `0` |

Implementation, local verification và remote required checks đã hoàn tất; PR #4 đã merge vào `main` tại commit `61aa049`. Phase 02 được đóng với `39/39` acceptance criteria đạt và không còn release gate kỹ thuật chưa chạy.
