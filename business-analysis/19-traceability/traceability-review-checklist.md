# Traceability Review Checklist

## Mục Đích

Checklist này được dùng tại requirement baseline, sprint planning, API/data review, pre-UAT và pre-release. Nó giúp review traceability theo evidence thay vì chỉ kiểm số lượng file.

## Business And Requirement Review

| ID | Check | Pass condition | Owner |
| --- | --- | --- | --- |
| TRC-001 | BRQ coverage | Mỗi `BRQ-001` đến `BRQ-025` có RTM row, FR/release/acceptance path. | BA + Product Owner |
| TRC-002 | Must FR coverage | Must FR có User Story/UC hoặc technical rationale, BR when applicable, AC/TS path. | BA + Technical Lead + QA |
| TRC-003 | Scope/priority | MVP/Should/Deferred/Out-of-scope nhất quán giữa Scope, priority, RTM và release plan. | BA + Product Owner |
| TRC-004 | Decision consistency | Manual invitation, Google reference-not-clone, To-do, ranking, deadline, Admin lists không bị document khác mâu thuẫn. | BA + Product Owner |

## Business Rule Review

| ID | Check | Pass condition | Owner |
| --- | --- | --- | --- |
| TRC-005 | Rule coverage | BR Must maps to requirement/UC, enforcement/API/data/UI impact and acceptance/test. | BA + Technical Lead + QA |
| TRC-006 | Security/access rule | Has allowed and denied role/status/ownership/token test; no UI-only enforcement. | Security reviewer + Backend + QA |
| TRC-007 | Data/history rule | Join/deadline/grade/archive/regrade has state/history/audit/read-model/rollback consideration. | Backend + QA + DevOps |
| TRC-008 | Rule change | Changed/superseded rule has governance/impact/retest/release update. | BA + Technical Lead |

## API, Data And UI Review

| ID | Check | Pass condition | Owner |
| --- | --- | --- | --- |
| TRC-009 | API trace | Changed endpoint maps FR/BR/Swagger/auth/error/UI consumer/test. | Backend + Frontend + QA |
| TRC-010 | Data trace | Collection/field/index/retention/migration/read-model maps FR/BR/API/test/backup. | Backend + DevOps + QA |
| TRC-011 | UI trace | Page/route maps role/FR/UC/API/state/navigation/accessibility acceptance. | Frontend + QA |
| TRC-012 | Reporting trace | Metric/report/export maps source/definition/scope/freshness/privacy/acceptance. | Backend + BA + QA |

## Quality And Release Review

| ID | Check | Pass condition | Owner |
| --- | --- | --- |
| TRC-013 | Acceptance coverage | Must AC has positive/negative scenario and UAT/quality evidence owner. | QA + BA |
| TRC-014 | NFR/DevOps | NFR Must maps quality gate/measurement/build-deploy-health/rollback evidence. | QA + DevOps |
| TRC-015 | Defect/waiver | Open defect/waiver maps to affected AC/TS/BR/FR/release and has owner/expiry. | QA + Product Owner |
| TRC-016 | Release proof | Release candidate has commit/artifact, CI result, UAT/sign-off, known issue, backup/rollback/monitoring link. | DevOps + QA + Product Owner |

## Gate Result Template

| Review gate | Date/build | Pass | Gaps/risks | Required action/owner | Decision |
| --- | --- | --- | --- | --- | --- |
| Requirement baseline / Sprint / API-Data / Pre-UAT / Pre-release | YYYY-MM-DD | Yes/No | Gap IDs | Name/date | Pass / Conditional / Blocked |

## Exit Rule

Traceability review passes only when no unidentified Must gap exists. Known gap/defect may be Conditional only if it has status, owner, risk, mitigation/expiry and approval according change/waiver policy.

## Liên Kết

- Gap register: `traceability-gap-register.md`.
- Change impact: `traceability-change-impact.md`.
- Acceptance/UAT: `../18-acceptance-criteria/`.
