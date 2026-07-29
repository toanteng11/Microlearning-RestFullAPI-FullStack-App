# Phase 06 Pull Request Execution Guide

## 1. General PR Contract

Mỗi PR ghi:

- P06 PR ID và WBS tasks;
- BA/AC references;
- scope/out-of-scope;
- runtime/data/API changes;
- tests/commands/results;
- migration/rollback;
- security/privacy impact;
- screenshots khi UI;
- evidence links;
- risk/debt.

## 2. P06-PR01 Planning

Branch: `docs/phase-06-planning-baseline`.

Files: chỉ docs/common roadmap. Exit: links/encoding/status consistent, DTO/query/cutover/
invalidation contracts reviewed và Gate A approval recorded.

### 2.1 Execution Part Mapping

Checklist chi tiết của từng Part nằm tại `execution-parts/README.md` và file
`execution-parts/part-XX-*.md` tương ứng.

| Parent PR | Execution Parts |
| --- | --- |
| P06-PR01 | Part 00 |
| P06-PR02 | Part 01-06 |
| P06-PR03 | Part 07-08 |
| P06-PR04 | Part 09-10 |
| P06-PR05 | Part 11-12 |
| P06-PR06 | Part 13-14 |
| P06-PR07 | Part 15 |
| P06-PR08 | Part 16-17 |

Mỗi Part có thể gồm một hoặc nhiều commit nhỏ trên cùng Parent PR. Parent PR chỉ được merge khi
toàn bộ Part bắt buộc của PR đã `DONE`.

## 3. P06-PR02 Foundation

Branch: `feature/phase-06-reporting-foundation`.

Scope:

- permissions/env/constants;
- metric/Grade/ranking policies;
- ports/adapters/durable invalidation writer;
- summary/invalidation;
- migration/rebuild/reconcile.

Required tests: unit, Mongo, migration idempotency, fault/concurrency, regression.

## 4. P06-PR03 Student

Branch: `feature/phase-06-student-reporting`.

Scope: Student service/routes/OpenAPI/Web/pages/tests; remove old Student Progress route
registration atomically. Không thêm Teacher/Admin behavior ngoài shared foundation.

Required evidence: own-scope, returned Grade privacy, null/stale/partial, E2E 01-04.

## 5. P06-PR04 Teacher

Branch: `feature/phase-06-teacher-reporting`.

Scope: Dashboard/ranking/activity/assessment/student detail API/Web; remove old Teacher report
route registrations atomically.

Required evidence: stable pagination, ownership/IDOR, 100x50 dashboard, E2E 05/06/08.

## 6. P06-PR05 Gradebook

Branch: `feature/phase-06-gradebook`.

Scope: Gradebook policies/query/API/Web, regrade/deadline integration; remove P05 Gradebook
route/flag/contract atomically.

Required evidence: Grade visibility, status precedence, point-weighted average, no N+1, E2E
07/09.

## 7. P06-PR06 Admin

Branch: `feature/phase-06-admin-reporting`.

Scope: governance/audit reports, threshold/redaction, Admin UI.

Required evidence: metadata only, role-specific lists preserved, small group, E2E 10/11.

## 8. P06-PR07 Conditional

Branch: `feature/phase-06-conditional-reporting`.

Only create if approved. Separate commits/slices per CSV/event/trend; one item failing không
được buộc merge các item khác.

Required evidence: feature flag, security/privacy, failure isolation, N/A disposition.

## 9. P06-PR08 Quality/Exit

Branch: `test/phase-06-quality-release`.

Scope:

- seed/benchmark/explain;
- CI/E2E/Docker/clean clone;
- defect closure;
- evidence/exit/handoff docs.

Không thêm business feature mới trừ defect fix có trace.

## 10. Merge Order

`PR01 -> PR02 -> PR03/PR04 -> PR05 -> PR06 -> PR07 -> PR08`.

PR03/PR04 có thể phát triển song song sau PR02 nhưng phải rebase/update branch với latest main
và chạy lại checks.

## 11. Required Checks

- Lint, test and build;
- Production dependency audit;
- Mongo replica-set transaction;
- OpenAPI contract;
- Integrated browser E2E;
- Secret scan;
- required branch up-to-date/approval theo ruleset.

## 12. Merge Policy

- Không direct push main.
- Squash merge theo repo convention.
- Branch up-to-date.
- Required reviewer/approval.
- Conversations resolved.
- Post-merge main CI được theo dõi.

## 13. PR Failure Handling

- CI failure: đọc đúng job/log, reproduce local, fix same branch.
- Main changed: update branch, resolve conflict có review, rerun full checks.
- Migration/security failure: block merge; không bypass required check.
- Reviewer unavailable: không tự tắt branch protection.
