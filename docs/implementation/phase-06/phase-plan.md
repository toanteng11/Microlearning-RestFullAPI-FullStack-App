# Phase 06 Phase Plan

## 1. Objective

Xây dựng reporting increment có thể demo và kiểm chứng từ đầu đến cuối, không thay đổi semantics
Phase 02-05 và không phụ thuộc capability storage/deployment chưa có của Phase 07.

## 2. Gate Model

| Gate | Điều kiện vào | Điều kiện ra |
| --- | --- | --- |
| Gate A - Planning | P05 handoff accepted | Scope/decision/contract/test plan approved, planning CI xanh |
| Gate B - Data Foundation | Gate A Pass | Metric registry, read model, indexes, migration, rebuild/reconcile Pass |
| Gate C - API And Security | Gate B Pass | Student/Teacher/Admin APIs, RBAC/IDOR/privacy/OpenAPI Pass |
| Gate D - Web And Integration | Gate C Pass | React workflows, states, accessibility, E2E Pass |
| Gate E - Exit | Gate D Pass | NFR, Docker, clean clone, CI/main, evidence, handoff Pass |

## 3. Workstreams

| Workstream | Outcome | Dependency |
| --- | --- | --- |
| WS1 Planning/Contracts | Gate A baseline, metric/version/permission freeze | P05 handoff |
| WS2 Data/Read Model | Summary/invalidation/index/migration/reconcile | WS1 |
| WS3 Student Reporting | Dashboard/progress/grade aggregation | WS2 |
| WS4 Teacher Reporting | Dashboard/ranking/detail/Gradebook | WS2 |
| WS5 Admin Reporting | Governance/audit aggregate, privacy | WS2 |
| WS6 Conditional | CSV/event/trend theo approved flags | WS3-5 |
| WS7 React UX | Actor routes/components/states | Stable APIs WS3-6 |
| WS8 Quality/Exit | Security/NFR/E2E/Docker/evidence/handoff | WS1-7 |

## 4. Milestones

| Milestone | Kết quả | Exit evidence |
| --- | --- | --- |
| M0 Planning Ready | Documents merged, Gate A approved | Planning PR + approval record |
| M1 Reporting Foundation | Metric/summary/invalidation/reconcile | Unit + Mongo integration + migration |
| M2 Student Vertical Slice | Dashboard/progress own scope | API/Web/E2E |
| M3 Teacher Vertical Slice | Dashboard/ranking/detail/Gradebook | API/Web/E2E/IDOR |
| M4 Admin Vertical Slice | Governance/audit reports | API/Web/privacy E2E |
| M5 Conditional Slice | Approved CSV/event/trend | Feature flag + dedicated tests |
| M6 Release Candidate | Full CI/NFR/clean clone | PR/main runs + evidence |

## 5. Critical Path

```text
Gate A
  -> Metric/runtime contract
  -> Read model + migration/index
  -> Teacher ranking/Gradebook API
  -> Student/Admin API
  -> React integration
  -> Security + performance + E2E
  -> Gate E
```

Conditional CSV/event/trend không được nằm trên critical path nếu Gate A chưa bật.

## 6. Pull Request Strategy

| PR | Scope | Merge prerequisite |
| --- | --- | --- |
| P06-PR01 | Planning baseline/Gate A record | Docs links + CI Pass |
| P06-PR02 | Metric, permission, ports, read-model foundation | Unit/Mongo/index/migration Pass |
| P06-PR03 | Student reporting API/Web | Own-scope/OpenAPI/component/E2E Pass |
| P06-PR04 | Teacher dashboard/ranking/detail | Ownership/ranking/performance Pass |
| P06-PR05 | Gradebook and assessment analytics | Grade privacy/status tests Pass |
| P06-PR06 | Admin governance/audit reports | Metadata/small-group/IDOR Pass |
| P06-PR07 | Approved Conditional CSV/event/trend | Flag/safety/retention tests Pass |
| P06-PR08 | Quality, Docker, evidence, exit/handoff | Full CI, clean clone, no Critical/High |

Mỗi PR phải nhỏ đủ để review, giữ build xanh và không để code contract chưa dùng kéo dài qua
nhiều PR.

Thứ tự commit/checkpoint nhỏ bên trong từng PR được khóa tại `execution-parts/README.md`. Các
Execution Part không thay Parent PR hoặc merge prerequisite trong bảng trên.

## 7. Branch Naming

Theo quy ước người dùng đã chọn, không dùng prefix `codex/`:

- `docs/phase-06-planning-baseline`
- `feature/phase-06-reporting-foundation`
- `feature/phase-06-student-reporting`
- `feature/phase-06-teacher-reporting`
- `feature/phase-06-gradebook`
- `feature/phase-06-admin-reporting`
- `test/phase-06-quality-release`

## 8. Entry Criteria

- `main` clean, Phase 05 source/evidence đã merge.
- Node/npm/Docker/Mongo replica set hoạt động theo repo.
- Handoff `P05-P06-HANDOFF-V1` được đọc và không có breaking change mở.
- Gate A decision owner đã được chỉ định.
- Không có Critical defect từ Phase 05 chặn reporting.

## 9. Exit Criteria

- Must acceptance Pass và trace tới automated evidence.
- Conditional Pass hoặc approved N/A với lý do.
- OpenAPI/runtime/routes/client types khớp.
- NFR dashboard/list đạt dataset baseline; explain plan không có unbounded scan.
- RBAC, ownership, enrollment, privacy, CSV safety và stale/partial tests Pass.
- Docker seed/demo, clean clone, PR CI và post-merge `main` CI Pass.
- Phase 07 handoff accepted.

## 10. Status Vocabulary

`BACKLOG`, `READY`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `DONE`, `APPROVED_NA`.

`DONE` cần code + test + review + evidence. Code compile nhưng thiếu migration/OpenAPI/evidence
không được tính `DONE`.

## 11. Change Control

- Scope Must thay đổi: Product Owner + Technical Lead + QA approve.
- Formula/privacy/projection thay đổi: thêm Security reviewer.
- Index/migration/Cloud dependency thay đổi: thêm DevOps/Data reviewer.
- Conditional item được bật sau Gate A: tạo change record và cập nhật AC/test/WBS trước code.
