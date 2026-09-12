# Phase 08 — Work Breakdown Structure

| WP | Work package | Activities | Owner | Gate/output | Status |
|---|---|---|---|---|---|
| WP-00 | Baseline/handoff | Part 00-01: profile, solo governance, identity and corrected handoff | TL/PO | G0; EV-001/002 | `DONE` |
| WP-01 | Test/evidence readiness | Part 02/06: contracts, Staging, personas, data, catalog, artifact store | QA/BA | G1; EV-003 | `IN_PROGRESS - G1 PASS; Part 06 pending` |
| WP-02 | System Test | Part 03-05: CI/E2E/API/data/security/performance/a11y/responsive | QA/TL | G2; EV-005/010/015/016 | `DONE` |
| WP-03 | UAT | Part 07: scenario 001-032, persona sessions, actual result/sign-off | BA/QA/PO | G3; EV-020/025 | `PENDING` |
| WP-04 | Closure/readiness | Part 07-08: defects/retest/CR plus Production plan/recovery/ops | QA/TL/DevOps | G4; EV-004/006..008/026 | `PENDING` |
| WP-05 | Release decision | Part 09: PRE_RELEASE acceptance and Go/Conditional Go/No-Go | PO/TL | G5; EV-030 | `PENDING` |
| WP-06 | Production promotion | Part 10: protected APPLY, exact digest, deployment and smoke | DevOps | G6; EV-031/037 | `PENDING` |
| WP-07 | Operations | Part 11: observation, alert, incident/rollback and hypercare | DevOps/Support | G7; EV-038..040 | `PENDING` |
| WP-08 | Handover | Part 12: training, communications, support and known issues | BA/PO | G7; EV-044 | `PENDING` |
| WP-09 | Exit | Part 13: FINAL acceptance, traceability, residuals and closure | PO/TL | G8; EV-050/055 | `PENDING` |

## Work package control

Mỗi WP phải có entry checklist, owner, start/end UTC, input identity, output evidence và gate decision. `PENDING` không được chuyển thành `DONE` chỉ vì tài liệu đã viết.

## Dependency chain

`WP-00 -> WP-01 -> WP-02 -> WP-03 -> WP-04 -> WP-05 -> WP-06 -> WP-07/WP-08 -> WP-09`.

Production readiness inside WP-04 may begin after WP-00 and run in parallel with WP-01..03, but WP-05 cannot start before both streams Pass.

CR làm thay đổi digest, schema, IAM, secret, security hoặc business behavior phải quay lại WP-01/WP-02 theo impact assessment.
