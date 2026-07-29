# Phase 06 Traceability Matrix

## 1. Requirement To Implementation

| BA/Rule | Capability | WBS | API/UI/Data | Tests | AC |
| --- | --- | --- | --- | --- | --- |
| FR-049/050, AC-DASH-001 | Student Dashboard/To-do | E03 | Student Dashboard, P05 To-do | IT-021/022, E2E-01/02 | 019-025 |
| FR-055 | Own Grade | E03/E04 | Grade projection/Dashboard | IT-025, E2E-03/04 | 020/022/026 |
| FR-059, BR-069..072 | Progress source | E02 | calculator/summary/refresh | UT-001..008, IT-011..020 | 009-018/023 |
| FR-060 | Teacher Progress Dashboard | E04 | Dashboard/activity/student detail | IT-029..038, E2E-05/06 | 028-034/038 |
| FR-061, BR-081 | Ranking | E04 | ranking policy/repository/UI | UT-012/013, IT-031/032 | 030-032 |
| FR-062 | Gradebook | E05 | Gradebook API/UI/read model | UT-009..014, IT-039..042 | 035-041 |
| FR-063 | Process score | E01/E02 | P06 formula/version | UT-002..004, IT-023/031 | 003/011/023/030 |
| FR-016, AC-ADM-001 | Admin Dashboard | E06 | Admin service/routes/pages | IT-043..050, E2E-10/11 | 043-050 |
| FR-018, BR-108/109 | Export | E07 Conditional | CSV service/routes/button | IT-051..056, E2E-12 | 069/070 |
| REP-013/014, BR-106/107 | Definition/freshness | E01/E02 | metadata/read model/UI | UT-015/016, IT-014..020 | 006/011-018 |
| BR-105, AC-RPT-001 | Reporting scope | E01/E03-07 | permission/scope/projection | IT-026/030/036/046/053 | 022/039/046/051-055 |
| BR-110 | Analytics event | E07 Conditional | event schema/model/service | UT-019, IT-057..059 | 071 |
| P04/P05 runtime compatibility | Atomic route/nullability/Gradebook cutover | E03-05 | compatibility plan + P06 router | OpenAPI uniqueness + regression | 024/028/035/058/062 |
| BR-107/read-model consistency | Durable source invalidation | E02 | invalidation writer/matrix/reconcile | IT-005..020 | 012-017 |
| NFR-PERF | Performance | E08 | indexes/batch/benchmark | PERF-001..006 | 018/063 |
| API/OpenAPI | Contract parity | E03-08 | P06 paths/schemas | OpenAPI suite | 058/061 |
| Privacy/security | Data minimization | E01-08 | projection/threshold/cache | Security + E2E | 046/048/051-060 |

## 2. Contract Traceability

| Runtime contract | Producer/source | Consumer | Evidence |
| --- | --- | --- | --- |
| `P05_ACTIVITY_DESCRIPTOR_V2` | P05 Activity reader | P06 calculator/Gradebook | version assertion tests |
| `P05_MIXED_ACTIVITY_TODO_V2` | P05 Student learning | P06 Student Dashboard | mixed To-do regression |
| `P05_REQUIRED_ACTIVITY_COMPLETION_V1` | P05 Progress | P06 process score | formula/compat tests |
| `P06_PROCESS_SCORE_V1` | P06 metric policy | API/Web/ranking | UT/API/OpenAPI/E2E |
| `P06_GRADEBOOK_V1` | P06 Gradebook | Teacher API/Web/export | IT/Web/E2E |
| `P06_ADMIN_GOVERNANCE_V1` | P06 Admin reporting | Admin API/Web/export | IT/privacy/E2E |

## 3. Evidence Traceability

| Evidence ID group | Proves |
| --- | --- |
| `P06-EV-PLAN-*` | Gate A, decisions, planning merge |
| `P06-EV-DATA-*` | schema/index/migration/rebuild/reconcile |
| `P06-EV-API-*` | routes/OpenAPI/RBAC/privacy |
| `P06-EV-WEB-*` | actor UI/states/accessibility/responsive |
| `P06-EV-SEC-*` | IDOR/export/event/privacy |
| `P06-EV-NFR-*` | performance/explain/Docker |
| `P06-EV-CI-*` | PR/main/clean clone |
| `P06-EV-EXIT-*` | defect review/signoff/handoff |

## 4. Update Rule

- Mỗi implementation PR cập nhật WBS, AC, test execution và evidence.
- Requirement đổi phải review tất cả row liên quan.
- Không ghi `Pass` nếu evidence chưa có commit/URL/path.
- Deferred/Conditional phải ghi disposition, không xóa khỏi matrix.
