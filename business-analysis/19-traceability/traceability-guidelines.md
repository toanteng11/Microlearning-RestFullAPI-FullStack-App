# Traceability Guidelines

## Mục Đích

Tài liệu này quy định cách tạo, duy trì và review traceability links giữa BA, design, implementation, QA/UAT và release evidence.

## Traceability Chain

```text
Business Requirement (BRQ)
  -> Functional Requirement (FR)
  -> User Story (US) and/or Use Case (UC)
  -> Business Rule (BR) when a decision/constraint applies
  -> UI / API / Data / NFR / Architecture / DevOps impact
  -> Acceptance Criterion (AC)
  -> Test Scenario (TS) / UAT / quality gate
  -> Defect, waiver, CI/CD and release evidence
```

Không phải mọi layer đều cần User Story. Ví dụ health check, backup hoặc Swagger có thể trace từ BRQ/FR sang NFR, technical User Story, UC, DevOps acceptance và release evidence.

## ID Convention

| Artifact | Prefix / example | Source location |
| --- | --- | --- |
| Business Requirement | `BRQ-001` | `../07-requirements/business-requirements.md` |
| Functional Requirement | `FR-001`, `FR-009A` | `../07-requirements/functional-requirements.md` |
| User Story | `US-STU-001`, `US-TCH-*`, `US-ADM-*`, `US-DEVOPS-*` | `08-user-stories/` |
| Use Case | `UC-001` to `UC-079` | `09-use-cases/` |
| Business Rule | `BR-001` to `BR-110` | `17-business-rules/` |
| Acceptance Criterion | `AC-*`, `SEC-AC-*`, `API-AC-*`, `DOP-AC-*`, `UI-AC-*` | `18-acceptance-criteria/` |
| Test Scenario | `TS-*`, `TS-INV-*`, `TS-GC-*` | `18-acceptance-criteria/` |
| NFR | `NFR-*` | `13-non-functional-requirements/` |
| Risk/Issue/Decision | `R-*`, `ISS-*`, `DEC-*` when created | `20-risk-management/` |
| Change Request | `CR-*` | `../04-scope/change-control.md` / project tracker |
| Release/UAT/Defect | Release/UAT/DEF identifiers in delivery tracker | UAT/release/defect evidence system |

## Link Quality Rules

- Use exact stable ID or document path, not name-only phrase.
- Use ranges only when every ID in range genuinely relates; otherwise list specific IDs.
- Keep source artifact as owner of wording; matrix summarizes rather than inventing different behavior.
- Mark missing delivery proof as `Pending Implementation Evidence`, not `Covered` by assumption.
- Do not delete historical ID after approved change; mark `Superseded`/`Deprecated` and link replacement.
- Link negative tests for authorization, token, data integrity and privacy rules, not just happy path.

## Minimum Coverage By Artifact

| Artifact | Minimum downstream/upstream trace |
| --- | --- |
| BRQ Must | FR, release scope, AC/TS/UAT evidence path. |
| FR Must | BR if rule applies, US/UC, API/Data/UI impact, AC/TS. |
| BR Must | Enforcing service/API/data state, negative/positive acceptance and audit/error behavior. |
| NFR Must | Quality gate, measurement/evidence owner and release criterion. |
| API endpoint | FR/BR, Swagger schema/auth/error, UI consumer or technical caller, API test. |
| Data entity/change | FR/BR, validation/index/retention/migration, API impact, test/rebuild evidence. |
| UI page/flow | Role/FR/UC, API contract, loading/empty/error/navigation acceptance. |
| Defect | Actual vs expected AC/TS/BR/FR, impacted release and retest evidence. |

## Update Trigger

Traceability update is mandatory in the same Change Request/PR/release when changing:

- Scope, Business Requirement, Functional Requirement, priority or release assignment.
- Role/permission, invitation/join, deadline/progress/grade, report/export, retention/audit business rule.
- API request/response/error/auth, data schema/index/migration, UI flow or acceptance/test scenario.
- NFR, Docker/CI/CD/Cloud/health/backup/rollback behavior.
- Defect fix that changes expected behavior or requires regression expansion.

## Review Cadence

| Time | Review activity |
| --- | --- |
| Before development | BA/Technical Lead/QA review Must FR/BR/AC/TS/design impact. |
| Sprint planning | Ensure backlog items link to approved FR/BR/AC and implementation/test task. |
| Pull request/API change | Developer/QA update API/Data/UI/test trace and Swagger/contract evidence. |
| Before UAT | QA/BA verify Must matrix rows have executable scenario/data/environment. |
| Before release | PO/QA/DevOps verify evidence/waiver/gap/release links. |
| After incident/change | Add defect/root cause/prevention and update affected matrix/gap. |

## Traceability Review Questions

1. What business value is affected?
2. Which FR/BR/User Story/Use Case define intended behavior?
3. Which API, data, UI, NFR, architecture and DevOps components are affected?
4. Which acceptance/test/negative scenario proves change works safely?
5. Is any report/read-model/metric/audit/retention/backup behavior affected?
6. What evidence is actual versus still pending?
7. Does a release/waiver/known issue/rollback decision need update?

## Anti-Patterns

| Anti-pattern | Why it is harmful | Required correction |
| --- | --- | --- |
| Matrix says “tested” without test ID/evidence | Creates false release confidence. | Link scenario/execution/build/result or mark pending. |
| UI-only authorization trace | Direct API can bypass UI. | Add backend authorization/negative API test link. |
| One FR maps to every document | Noise hides real impact. | Link only impacted artifact with clear rationale. |
| Changed Business Rule but unchanged AC/TS | Regression/acceptance gaps emerge. | Run change impact analysis and update tests. |
| Delete old IDs | Historical defect/release references break. | Supersede/deprecate with replacement link. |

## Liên Kết

- Overview: `traceability-overview.md`.
- Change impact/gaps/checklist: các file cùng thư mục.
- Change control: `../04-scope/change-control.md`.
