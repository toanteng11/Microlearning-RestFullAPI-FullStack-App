# Phase 06 Quality Hardening Evidence

## 1. Identity

| Field | Value |
| --- | --- |
| Scope | Part 16 - Quality Hardening |
| Branch | `quality/phase-06-release-hardening` |
| Code baseline | `f1baf06` |
| Captured date | `2026-08-03` |
| Local decision | `PASS` |

## 2. Quality Gates

| Gate | Actual result |
| --- | --- |
| Lint + intentional negative lint gate | Pass |
| Prettier | Pass |
| API/Web typecheck | Pass |
| API coverage | `230/230`; statements `75.40%`, branches `61.15%`, functions `72.04%`, lines `77.40%` |
| Web coverage | `126/126`; statements `84.48%`, branches `72.76%`, functions `80.39%`, lines `87.10%` |
| Mongo replica-set integration coverage | `97/97`; statements `79.14%`, lines `81.55%` |
| OpenAPI parser/parity | `10/10` |
| API/Web production build | Pass |
| Production dependency audit | Pass; time-bound `react-router`/`react-router-dom` exceptions applied |

## 3. Integrated Stack And Browser

| Check | Actual result |
| --- | --- |
| Docker MongoDB replica set | Healthy |
| Docker API | Healthy at `http://localhost:4000` |
| Docker Web | Healthy at `http://localhost:3000` |
| Swagger | Available at `http://localhost:4000/api-docs` |
| Deterministic seed | `10` users, Phase 3 `8`, Phase 4 `15`, Phase 5 `14` resources created; rerun reuses without duplicate |
| Fresh-stack browser E2E | `34/34` Pass |
| Admin reporting focused E2E | `2/2` Pass |
| Responsive review | Desktop and `390x844` mobile Pass; horizontal overflow `0` |
| Accessibility | Axe serious/critical `0` |

## 4. Performance

| Dataset/check | Result |
| --- | --- |
| Reporting calculator `100 Students x 50 activities`, 5 iterations | p50 `355.11 ms`, p95 `1069.79 ms`, heap `27.37 MB` |
| Gradebook endpoint `100 x 50`, 10 requests | p95 `78.87 ms`, target `<=1500 ms` |
| Phase 04 regression `100 x 50` | To-do `37.43 ms`, Dashboard `605.92 ms`, Ranking `420.86 ms`, Structure `69.35 ms` p95 |
| Intended index checks | Named summary ranking and analytics query/TTL/unique indexes asserted in Mongo suites |

## 5. Clean Clone

Clean clone tại `C:\tmp\phase06-clean-20260803-1115` từ branch quality:

1. `npm ci`: Pass, `471` packages installed from lockfile.
2. `npm run check:ci`: Pass.
3. API `230/230`, Web `126/126`, typecheck/build/format/lint Pass.

Không sử dụng `.env`, untracked source hoặc dependency cache của working tree gốc.

## 6. Defect Review

- Critical open defects: `0`.
- High open defects: `0`.
- Ba test-maintenance defects phát hiện trong hardening đã được sửa và rerun: Admin heading cũ,
  ambiguous Role label và missing `await` trong privacy assertion.
- Remote secret scan và required checks phải được xác nhận trên release PR.
