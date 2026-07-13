# Phase 01 Plan

## 1. Phase Charter

| Thuộc tính | Giá trị |
| --- | --- |
| Phase ID | `P01` |
| Outcome | Nền tảng Web/API/MongoDB/Swagger/Docker/CI chạy và kiểm thử được |
| Priority | `Must` |
| Architecture | Modular Monolith |
| Duration baseline | 10 ngày team nhỏ hoặc 2-3 tuần cá nhân |
| Entry | BA architecture/API/NFR/DevOps baseline sẵn sàng |
| Exit | Local quality/runtime pass và external governance evidence được ghi nhận |

## 2. Outcome Cần Chứng Minh

```text
Clean npm install
  -> React Web build/test
  -> Express API build/test
  -> MongoDB connectivity/readiness
  -> Swagger/OpenAPI validation
  -> Docker integrated runtime
  -> CI quality workflow
  -> Phase evidence and exit review
```

Phase 01 không tạo feature giả để minh họa. Authentication, Classroom, Course và Assessment chỉ bắt đầu ở phase sở hữu tương ứng.

## 3. Workstream

| Workstream | File chi tiết | Kết quả |
| --- | --- | --- |
| Governance | `scope-and-deliverables.md`, `technical-decisions.md` | Scope và ADR rõ ràng |
| Repository | `repository-structure.md` | npm workspaces và command thống nhất |
| Web | `frontend-foundation.md` | React app shell và System Status page |
| API | `backend-foundation.md` | Express operational foundation |
| Data | `database-foundation.md` | MongoDB lifecycle và readiness |
| Contract | `api-documentation.md` | OpenAPI 3.0.3 và Swagger UI |
| Runtime | `docker-local-environment.md` | Web/API/MongoDB healthy |
| Automation | `ci-quality-gates.md` | Pull Request quality workflow |
| Verification | `testing-strategy.md`, `acceptance-criteria.md` | Test và acceptance evidence |

## 4. Milestone

| Milestone | Điều kiện |
| --- | --- |
| M1 - Toolchain Locked | Node/npm/workspace/TypeScript/formatter/linter được pin |
| M2 - Applications Build | Web và API typecheck/build thành công |
| M3 - Operational Contract | Health/readiness/version/Swagger hoạt động |
| M4 - Local Integration | Docker Compose hoặc local development flow chạy end-to-end |
| M5 - Quality Automated | `npm run check:ci`, coverage, High dependency audit và secret scan CI pass |
| M6 - Exit Reviewed | Acceptance, evidence, risk và Phase 02 readiness được cập nhật |

## 5. Dependency

```text
Decisions -> Repository -> Web/API
                           |-> MongoDB
                           |-> OpenAPI
                           `-> Docker -> Smoke
Repository + Tests -----------------> CI
All workstreams --------------------> Exit review
```

## 6. Governance

- Task dùng trạng thái `Backlog`, `Ready`, `In progress`, `In review`, `Blocked`, `Done`.
- Không tính `Done` nếu thiếu review/test/evidence theo `../common/definition-of-done.md`.
- API/data/security change phải truy vết tới BA và cập nhật OpenAPI/test trong cùng Pull Request.
- External dependency không ngăn hoàn thành source local nhưng phải xuất hiện trong `exit-report.md` và `implementation-checklist.md`.

## 7. Kết quả hiện tại

Phase 01 đã hoàn thành local implementation, clean-clone onboarding, Docker/browser verification và remote CI governance. Tất cả `20/20` acceptance criteria đạt `Pass`; exit evidence được hợp nhất trong `phase-exit-evidence.md`. Trạng thái phase là `Completed` từ ngày `2026-07-13`.
