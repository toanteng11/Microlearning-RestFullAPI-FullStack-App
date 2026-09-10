# Phase 08 — System Test and UAT Strategy

## Test model

```text
P07 reported baseline -> exact-digest System Test -> API/data/security/NFR regression
-> role-based UAT -> defect/retest -> G5 decision -> Production smoke/observation
```

System Test proves technical integration and release safety; UAT proves business fitness. UAT never replaces CI, contract, security, backup, rollback or monitoring evidence.

## Test layers

| Layer | Scope | Existing command/evidence | Owner | Gate |
|---|---|---|---|---|
| Static/CI | lint, format, types, coverage, build | `npm run check:ci` | TL/QA | G2 |
| API/OpenAPI | parser, operation coverage, Swagger | `npm run test:openapi` | QA/TL | G2 |
| Integration | Mongo replica-set transaction tests | workflow `ci.yml` / workspace script | QA/Dev | G2 |
| Browser | local and cloud critical journeys | `npm run test:e2e`, `npm run test:e2e:cloud` | QA | G2/G3 |
| Cloud security | HTTPS, headers, version, digest, revision | `npm run cloud:security:verify -- ...` | DevOps/Security | G2 |
| Supply chain | image verify/scan/SBOM/lineage | existing root scripts | DevOps | G1/G2 |
| Recovery/ops | backup/restore, rollback, logs/alerts | records and contract tests | DevOps | G4/G7 |

Production recovery/operations readiness may be prepared during G1-G3 but is evaluated at G4/G5. It is not an entry condition for running tests on Staging.

## Test controls

Candidate identity (commit, digest, revision, URL) appears in every run. Use synthetic IDs and unique `UAT_RUN_ID`; no password/raw token/full private submission/PII in evidence. Mutation scenarios require safe API/AuditLog/read-model verification; denial scenarios require backend response. Với đồ án cá nhân, một người chạy nhiều persona bằng session tách biệt và ghi rõ `soloProject=true`; automation không tự thay thế UAT sign-off.

## Entry/exit

**Entry G2/G3:** G0 accepted; HTTPS Staging stable; health/readiness/version/Swagger available; data/roles/scenarios ready; rollback target recorded; no known Critical blocker. Production apply/backup tier chưa hoàn thiện không chặn test Staging.

**Exit G2/G3:** mọi Must row là `PASS`; Critical/High = 0; security/privacy/data integrity clear; exact evidence and role-specific recommendations attached. `WAIVED`, `APPROVED_NA` chỉ hợp lệ cho item không-Must/conditional theo decision đã ghi.

## BA performance and accessibility baseline

- Simple read API p95 <= 800 ms.
- List/report API p95 <= 1000 ms.
- Mutation API p95 <= 1200 ms.
- Dashboard API p95 <= 1500 ms.
- Initial frontend load target <= 3 seconds trên good Staging network đã mô tả.
- P0 form/accessibility Must: accessible label, status không chỉ bằng màu, clear validation/error, role-safe navigation và không dead-end.

Kết quả phải ghi dataset, warm-up, concurrency, sample count, region/tool và UTC window; thiếu context chỉ là observation, không phải capacity proof.

## Test result labels

`PASS`, `FAIL`, `BLOCKED`, `NOT RUN`, `WAIVED`, `APPROVED_NA`. A missing artifact always remains `PENDING`/`NOT RUN`.
