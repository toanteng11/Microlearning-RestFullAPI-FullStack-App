# Phase 05 Developer Start Guide

## 1. Mục Tiêu

Hướng dẫn này giúp Developer bắt đầu Phase 05 theo đúng baseline sau khi Gate A được phê duyệt. Không chạy bước tạo implementation branch khi `development-readiness-review.md` chưa ghi `READY_TO_CODE` và chưa có planning merge commit.

## 2. Preflight Bắt Buộc

1. Xác nhận planning Pull Request đã merge vào `main` và required CI xanh.
2. Xác nhận working tree sạch; không trộn thay đổi Phase khác.
3. Đồng bộ `main` và đọc các tài liệu theo thứ tự ở mục 4.
4. Xác nhận Node/npm/Docker/MongoDB versions theo repository hiện tại.
5. Chạy baseline quality trên `main`; ghi commit và kết quả vào evidence.
6. Chỉ sau đó tạo branch đầu tiên `feature/phase-05-foundation` theo P05-PR02.

```powershell
git switch main
git pull --ff-only origin main
git status --short
npm ci
npm run check:ci
docker compose config
```

Expected:

- `git status --short` không có output.
- `npm ci` dùng lockfile, không tạo thay đổi không chủ đích.
- Baseline lint/test/build/OpenAPI hiện có pass.
- Docker Compose config hợp lệ.

## 3. Tạo Implementation Branch

```powershell
git switch -c feature/phase-05-foundation
git push -u origin feature/phase-05-foundation
```

Không dùng tiền tố `codex/`. Mỗi PR dùng branch slice trong `pull-request-execution-guide.md`, tách từ `main` mới nhất sau khi PR dependency đã merge và không duplicate thay đổi đang chờ merge.

## 4. Thứ Tự Đọc Tài Liệu

1. `README.md` và `scope-and-deliverables.md` để hiểu outcome/boundary.
2. `ba-alignment-and-decisions.md` và `technical-decisions.md` để biết policy đã chấp thuận.
3. `assessment-lifecycle-and-scoring.md` và `assignment-submission-grading.md` để hiểu state machine.
4. `deadline-exceptions-and-derived-state.md` để dùng một deadline resolver.
5. `architecture-and-module-design.md`, `data-model-and-indexes.md`, `migration-and-rollback.md`.
6. `security-ownership-and-privacy.md` trước khi viết handler/query.
7. `api-contract.md`, backend/frontend plans.
8. `source-file-blueprint.md` và `runtime-contract-catalog.md` để biết file/type/service cần code.
9. `api-ui-integration-matrix.md` để khóa API consumer và state UI.
10. `test-case-catalog.md`, `testing-strategy.md` và `acceptance-criteria.md`.
11. `pull-request-execution-guide.md`, WBS/checklist/traceability/evidence.

Nếu code và tài liệu mâu thuẫn, dừng slice, tạo decision update và sửa baseline qua review; không tự chọn hành vi trong handler.

## 5. Environment Contract

Sử dụng `.env.example` làm nguồn tên biến. Không commit `.env`, token, Atlas URI hoặc mật khẩu demo thật. Các biến P05 dự kiến được mô tả trong `devops-environment-and-seeding.md`; khi thêm biến:

1. Thêm schema validation và default an toàn.
2. Cập nhật `.env.example` bằng giá trị giả.
3. Thêm config unit tests cho missing/invalid values.
4. Cập nhật Docker/CI nếu biến cần ở runtime test.
5. Không log secret hoặc full connection string.

Phase 05 không cần credential Google Cloud Storage vì upload bị defer.

## 6. Trình Tự Code Khuyến Nghị

### Slice 1 - Foundation

- Permission constants và role capability tests.
- Domain types/state machines/policies thuần.
- P04 port adapters và Activity contract v2.
- Models/repositories/index manifest/migration preflight.
- Zod schemas, DTO projections và error codes.

Chưa tạo UI ở slice này. Exit: Gate B integration tests pass trên MongoDB replica set.

### Slice 2 - Teacher Quiz Authoring

- Quiz aggregate CRUD/lifecycle.
- Bốn Question types và reorder.
- Publish prerequisite.
- Teacher routes/OpenAPI.
- Quiz Builder/Settings dùng API thật.

Exit: Teacher tạo, sửa, kiểm tra lỗi và publish Quiz hợp lệ; Student projection chưa lộ answer key.

### Slice 3 - Attempt Và Scoring

- Eligibility + immutable snapshot + active-attempt transaction.
- Save/resume with revision.
- Submit/timeout/lazy reconciliation.
- Objective scoring + short-answer review state.
- Result release, Teacher review và Student own result.
- Student Quiz Player + Teacher Results.

Exit: Gate C tests, E2E và privacy pass.

### Slice 4 - Assignment Và Submission

- Assignment CRUD/lifecycle/policy.
- Current Submission + revisions/events.
- Draft/turn in/unsubmit/resubmit.
- Derived late/missing.
- Teacher/Student Assignment UI.

Exit: retry/concurrency/history và Assignment E2E pass.

### Slice 5 - Grade Và Deadline Exception

- Teacher result/submission queries.
- Grade draft/return/regrade/history/audit.
- Student own returned grades.
- Per-Student deadline set/revoke/history.
- Grader/Grades/Exception UI.

Exit: Gate D privacy/concurrency/E2E pass.

### Slice 6 - Learning Integration Và Exit

- Classwork/To-do/Deadline/Progress v2.
- Conditional items đã approved.
- OpenAPI parity, perf/index, accessibility, Docker seed, E2E.
- Evidence, AC evaluation và exit report.

Exit: Gate E và post-merge main CI pass.

## 7. Coding Rules

- Route chỉ parse/authenticate/dispatch; nghiệp vụ nằm trong application/domain service.
- Repository chịu persistence, không quyết định role visibility.
- Mọi resource access đi qua scope/ownership/enrollment policy.
- Student DTO dùng allowlist; không xóa field sau khi serialize object đầy đủ.
- Mọi scoring dùng Attempt snapshot và scoring policy version.
- Mọi deadline/late/missing dùng shared effective deadline resolver và server clock.
- Mọi terminal transition có state precondition, transaction/revision và retry semantics.
- Không import model của module khác; dùng port/adapter.
- Không ghi file lên local/container disk.
- Không thêm analytics/weighting/export của Phase 06.

## 8. Test Loop Cho Mỗi Task

1. Viết test policy/unit hoặc integration tái hiện rule/risk.
2. Implement tối thiểu để test pass.
3. Chạy test module hẹp.
4. Chạy lint/typecheck/OpenAPI liên quan.
5. Chạy regression P04 nếu sửa Activity/To-do/Progress.
6. Cập nhật Swagger example và traceability/evidence cùng PR.

Các command thực tế phải dùng scripts hiện có trong `package.json`; không tự ghi một command giả vào evidence. Trước commit, chạy ít nhất:

```powershell
npm run lint
npm test
npm run build
npm run test:openapi
git diff --check
```

Nếu script name thay đổi, cập nhật hướng dẫn và CI trong cùng Pull Request.

## 9. Pull Request Checklist Cho Developer

- Nêu WBS Task ID, BA ID và AC ID.
- Nêu behavior trước/sau, actor và state transition.
- Nêu data/index/migration impact.
- Nêu security/privacy/answer secrecy impact.
- Nêu retry/concurrency behavior.
- Đính kèm command + số test pass + CI URL.
- Đính kèm ảnh/video cho UI, gồm desktop/mobile và state lỗi quan trọng.
- Cập nhật OpenAPI và example.
- Ghi rollback/disposition Conditional.
- Không merge khi required review/check còn thiếu.

## 10. Debugging Order

Khi test hoặc E2E fail, kiểm tra theo thứ tự:

1. Effective configuration và Mongo replica-set readiness.
2. Seed identity, role, ownership và enrollment.
3. Activity lifecycle/visibility/time window.
4. Revision/idempotency/state precondition.
5. Transaction/index uniqueness.
6. DTO projection và API error code.
7. Frontend request lifecycle, local draft revision và navigation state.

Không sửa test data hoặc bỏ assertion trước khi xác định contract nào đang bị vi phạm.

## 11. Definition Of Task Done

Một task chỉ hoàn thành khi code, unit/integration/component test, OpenAPI/docs, security impact, migration impact và evidence đều được review/merge. UI chỉ hiển thị mock hoặc endpoint chỉ trả placeholder không được tính là hoàn thành.
