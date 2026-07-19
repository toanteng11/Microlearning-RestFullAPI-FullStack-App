# Phase 04 Developer Start Guide

## 1. Khi Nào Được Bắt Đầu

Implementation được bắt đầu sau khi `development-readiness-review.md` chuyển Gate A thành `READY_TO_CODE` và planning PR `#8` đã merge vào `main` tại `66f400d`. Điều kiện này đã đạt; implementation bắt đầu từ `P04-T009..T018`.

## 2. Chuẩn Bị Local

```powershell
git switch main
git pull --ff-only origin main
node --version
npm --version
npm ci
npm run check:ci
docker compose up --build -d
docker compose ps
```

Yêu cầu Node/npm phải khớp root `engines`. Không dùng Atlas production-like credential cho unit/integration local; dùng Mongo replica set từ Docker.

## 3. Branch Convention

Theo yêu cầu dự án, không dùng prefix `codex/`.

| Scope | Branch đề xuất |
| --- | --- |
| Foundation | `feature/phase-04-content-foundation` |
| Course/Module | `feature/phase-04-course-modules` |
| Lesson/Deadline | `feature/phase-04-lessons-deadlines` |
| Teacher Web | `feature/phase-04-teacher-content-ui` |
| Student Learning | `feature/phase-04-student-learning` |
| Derived Views | `feature/phase-04-progress-todo` |
| Hardening/Exit | `quality/phase-04-release` |

Mỗi branch tạo từ latest `main`. Không gom toàn bộ 100 task vào một PR.

## 4. First Implementation PR

### Scope

`P04-T009..T018` và phần cần thiết của `T094`:

- Permission catalog/capability tests.
- Classroom/Enrollment reader ports và adapters.
- Course/activity/content interfaces.
- Lifecycle/effective-status/visibility/order pure policies.
- Env validation fields cơ bản.

### Không Bao Gồm

- Mongoose collections.
- Public routes.
- React pages.
- GCS.

### Exit Commands

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run check:ci
git status --short
```

## 5. Implementation Order

1. Foundation/ports/policies.
2. Models/repositories/indexes.
3. Course/Module API.
4. Lesson/Flashcard/deadline API.
5. Teacher authoring UI.
6. Student visibility/player/completion.
7. To-do/dashboard v1.
8. Announcement/governance.
9. Conditional resource decision.
10. Integrated hardening/evidence/exit.

Không bắt đầu Student UI trước khi Student projection/navigation contract có test.

## 6. Per-Endpoint Workflow

1. Xác định BA/AC/Task IDs.
2. Viết Zod schema và domain inputs.
3. Viết policy/service test thất bại.
4. Implement repository/service.
5. Viết route/controller mỏng.
6. Thêm OpenAPI operation/schema/error examples.
7. Thêm integration/authorization tests.
8. Kết nối React surface và component tests nếu user-facing.
9. Chạy focused tests rồi full `check:ci`.
10. Cập nhật traceability/evidence cần thiết.

## 7. Coding Rules

- Dùng patterns Phase 02/03 trước khi tạo abstraction mới.
- Domain service không import model module khác.
- Không dùng `any`, raw query từ user hoặc ad hoc string parser.
- Không dùng GET có side effect; start/complete là POST rõ.
- Không log request body chứa content/reason/token.
- Không hard delete Course/content/progress/history.
- Không dùng browser clock cho business deadline.
- Không render Markdown bằng unsanitized HTML.
- Không thêm package nếu standard/existing package đủ; package mới cần audit/license/size rationale.

## 8. Test-First Priorities

Viết tests trước hoặc cùng code cho:

- Lifecycle transitions.
- Ancestor visibility.
- Reorder exact-set/revision.
- Deadline state/revision/transaction.
- Completion idempotency/concurrency.
- XSS/unsafe URL.
- Dashboard formula/ranking.

CRUD mapping đơn giản có thể code trước test, nhưng không merge nếu thiếu test.

## 9. Pull Request Template Inputs

Mỗi P04 PR ghi:

```text
Phase: P04
Tasks: P04-Txxx..Tyyy
BA: FR-xxx, US-xxx, UC-xxx, BR-xxx
Acceptance: P04-AC-xxx
Scope included:
Scope excluded:
API/data changes:
Security considerations:
Commands/evidence:
Risk/change notes:
```

PR có API/data phải đính OpenAPI/index/migration impact. PR UI phải có screenshots desktop/mobile khi behavior đã ổn định.

## 10. Review Checklist

- Object authorization nằm ở service, không chỉ UI/middleware.
- Every write validates current lifecycle and concurrency token.
- DTO projection đúng actor.
- Transaction đủ nhưng không bao quá nhiều network work.
- Query có pagination/projection/index.
- Error code nằm catalog.
- OpenAPI/test cập nhật cùng route.
- New UI có all critical states và keyboard path.
- No unrelated refactor/churn.

## 11. Conflict Handling

- Sync `main` trước mỗi PR lớn bằng merge/rebase theo team convention.
- Khi conflict docs/traceability, giữ cả requirement mới và evidence đã merge; không chọn một phía máy móc.
- Khi conflict model/API, dừng và review Accepted ADR/contract trước.
- Không dùng `git reset --hard` hoặc discard thay đổi người dùng.

## 12. Local Demo Loop

Sau mỗi completed vertical slice:

1. Start integrated stack.
2. Seed deterministic P04 data.
3. Login đúng actor.
4. Chạy happy path và ít nhất một foreign-access case.
5. Kiểm tra Swagger operation.
6. Kiểm tra API/log không lộ content/credential.
7. Ghi defect ngay; không chờ Phase 08.

## 13. Definition Of Done Per PR

- Scope/task/AC rõ và hoàn tất.
- Focused + full CI checks pass.
- No Critical/High review finding.
- OpenAPI/data/docs đồng bộ.
- UI evidence nếu có UI.
- Branch clean, không `.env`, log, report lớn hoặc generated temp file.
- PR merge qua branch protection, không direct push `main`.
