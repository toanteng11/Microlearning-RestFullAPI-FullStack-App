# Phase 03 Developer Start Guide

## 1. Mục Đích

Entry point cho Dev bắt đầu Phase 03 đúng dependency và contract. Đọc README, scope, decisions, data và API trước khi code.

> Tài liệu này là hướng dẫn lịch sử tại thời điểm bắt đầu implementation. Phase 03 hiện đã `Completed` qua PR #6 và merge commit `7d2c10c`; trạng thái cuối nằm trong `phase-exit-evidence.md`.

## 2. Baseline Required

- Branch base: latest protected `main` sau Phase 02.
- Planning status là `READY_TO_CODE`; PR #5 đã merge vào `main` tại `1e8ad41` và remote CI đạt `6/6` jobs.
- Must scope: Classroom, Code/Link, Enrollment/join, roster, Student list/detail, Admin policy/governance, offboarding guard.
- Should không tự kéo vào.
- QR/Course/Lesson/Stream không thuộc P03.

## 3. Required Reading Order

1. `README.md`
2. `scope-and-deliverables.md`
3. `technical-decisions.md`
4. `classroom-lifecycle-and-enrollment.md`
5. `security-ownership-and-governance.md`
6. `data-model-and-indexes.md`
7. `api-contract.md`
8. Backend/Frontend/DevOps/Testing plans
9. Acceptance/Traceability/WBS/Checklist/Risk

## 4. Local Readiness

```powershell
git switch main
git pull origin main
npm ci
npm run check:ci
docker compose up -d --build
docker compose ps
```

Xác nhận Web/API/Mongo healthy và Swagger hoạt động trước P03 change. Không commit `.env` hoặc runtime fixture.

## 5. Branch Strategy

Không dùng `codex/`. Đề xuất:

```text
docs/phase-03-planning-baseline
feature/phase-03-data-foundation
feature/phase-03-classroom-api
feature/phase-03-join-credentials
feature/phase-03-enrollment-roster
feature/phase-03-teacher-ui
feature/phase-03-student-join-ui
feature/phase-03-admin-governance
test/phase-03-quality-release
```

Không push trực tiếp `main`; mỗi branch mở PR và required checks phải xanh.

## 6. First Coding Slice - PR-03A

### Scope

- P03 env schema/fail-fast.
- Permission catalog additions.
- Code/token crypto utilities.
- Models/indexes/repositories.
- Enrollment Policy bootstrap.
- Unit + real Mongo index tests.

### Không Bao Gồm

- React pages.
- Public join routes.
- Course/content placeholders.
- Ownership transfer Should.

### Exit

- Exact indexes pass rs0.
- DB models không có raw fields.
- Env/redaction tests pass.
- OpenAPI không cần route chưa tồn tại nhưng docs WBS/evidence cập nhật.

## 7. Per-Slice Workflow

1. Chọn WBS task và confirm dependency Done.
2. Viết/điều chỉnh failing test cho behavior/invariant.
3. Implement minimal domain/service/repository boundary.
4. Add route/schema/DTO và OpenAPI cùng capability.
5. Run focused tests rồi full check.
6. Update evidence/traceability/WBS status.
7. Self-review security/object scope/log output.
8. Push branch, mở PR, chờ required checks/review.

## 8. Commands

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run format:check
npm run check:ci
```

P03 sẽ bổ sung scripts tên rõ cho integration/E2E; Dev không chạy destructive cleanup ngoài database test run-scoped.

## 9. Code Review Checklist

- Route/controller không query Mongoose trực tiếp.
- Service không phụ thuộc Express/environment global.
- Owner/Enrollment check nằm backend.
- Query strict allowlist/pagination/stable sort.
- Transaction có bounded retry và maps duplicate correctly.
- Raw credential absent DB/log/audit/error/test snapshot.
- DTO không leak Mongoose/internal fields.
- API/OpenAPI/tests cùng change.
- UI states/navigation/responsive/accessibility đủ.

## 10. Definition Of Done Cho Task

- Source chạy thật.
- Automated tests đúng risk level.
- OpenAPI/update docs nếu contract thay đổi.
- Evidence path/PR/check URL.
- No unapproved Should/scope creep.
- Review comments resolved và CI xanh.

## 11. Khi Bị Blocked

- Ghi issue ID, dependency, owner, impact, next action.
- Không tự đổi API/state/permission để đi tiếp.
- Contract ambiguity quay về BA/ADR; runtime dependency quay DevOps; invariant quay TL/Security/QA.
