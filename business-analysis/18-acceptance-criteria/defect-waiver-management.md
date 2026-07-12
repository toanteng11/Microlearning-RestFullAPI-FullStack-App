# Defect And Waiver Management

## Mục Đích

Tài liệu này quy định cách phân loại, triage, retest và quyết định waiver cho defect phát hiện trong QA/UAT/release acceptance. Mục tiêu là tránh hai cực: chặn release vì lỗi nhỏ không ảnh hưởng, hoặc “cho qua” lỗi security/data/learning workflow mà không có trách nhiệm rõ.

## Defect Severity

| Severity | Definition | Release impact | Ví dụ |
| --- | --- | --- | --- |
| Critical | System unavailable, security/privacy breach, data loss/corruption, role bypass, no recovery path. | No-Go; must fix/contain/retest. | Student đọc grade người khác, token/secret lộ, deploy corrupt progress. |
| High | Must workflow broken for many/critical user, incorrect grade/deadline/progress, no practical workaround. | No-Go unless exceptional authority/security assessment; normally fix/retest. | Student cannot join/học/nộp; Teacher grading wrong; deadline reset loses record. |
| Medium | Important flow partly degraded with safe workaround; scope limited, no integrity/privacy risk. | Conditional Go only with explicit waiver/owner/target. | Non-critical filter/report issue, UI state defect with workaround. |
| Low | Cosmetic/documentation/usability minor issue, no core behavior/data/security impact. | Can release with tracked backlog. | Minor alignment/wording/tooltip defect. |

Severity is impact-based, not based on how difficult a bug is to fix.

## Defect Lifecycle

```text
New -> Triaged -> Assigned -> In Progress -> Fixed -> Retest
   -> Verified -> Closed
   -> Reopened
   -> Deferred / Rejected with reason
```

| Status | Meaning |
| --- | --- |
| New | Tester records reproducible issue/evidence. |
| Triaged | Severity, scope, root domain, owner and release target assessed. |
| Assigned/In Progress | Team is responsible/implementing. |
| Fixed | Developer claims resolution; build/reference provided. |
| Retest | QA/UAT reruns original + impacted regression scenario. |
| Verified/Closed | Evidence confirms pass; trace/release note updated if needed. |
| Deferred | Intentional future release, with risk/owner rationale. |
| Rejected | Not a defect/duplicate/by-design, linked to requirement/rule decision. |

## Defect Record Template

| Field | Required content |
| --- | --- |
| Defect ID/title | Unique ID and concise behavior. |
| Environment/build | UAT/Staging, version/commit, date. |
| Reporter/role | Who found it and role used. |
| Preconditions/data | Safe account/resource states; no secret/PII. |
| Steps/actual/expected | Reproducible steps and criterion/rule expected. |
| Severity/priority | Impact and urgency, not assumed same. |
| Scope/trace | FR/BR/AC/TS/API/UI/Data/DevOps impact. |
| Evidence | Screenshot/API/requestId/Audit/log safe reference. |
| Owner/target | Responsible team/person and target fix/release. |
| Retest | Fix build, regression scope, result/date/tester. |

## Waiver Policy

A waiver is temporary, explicit acceptance of a known unmet criterion. It is not a way to conceal a failure or skip test execution.

| Waiver allowed? | Conditions |
| --- | --- |
| Medium/Low defect | May be considered when safe workaround, limited scope, no security/privacy/data/grade/deadline integrity impact, owner/target/expiry exists. |
| Must criterion with non-critical limitation | Requires Product Owner + Technical Lead + QA Lead approval; clear release note/mitigation/retest plan. |
| Critical/High security/privacy/token/authorization/data-loss issue | Not ordinary waiver; release blocked until containment/fix and authorized security decision. |
| Missing UAT/health/rollback evidence | Not a waiver by default; execute evidence or formally defer release scope. |
| Out-of-scope feature | Not a waiver; record as excluded scope, not failed criterion. |

## Waiver Record Template

| Field | Content |
| --- | --- |
| Waiver ID / linked defect/criterion | References. |
| Description/impact | What does not meet expected behavior and affected role/data/environment. |
| Risk assessment | Security/privacy/data/fairness/operations/business impact. |
| Workaround/mitigation | User/team action and monitoring/containment. |
| Owner/target release | Who fixes and by when. |
| Expiry | Date/event after which waiver is invalid and must be reviewed. |
| Approvers | Product Owner, Technical Lead, QA Lead, Security/DevOps where applicable. |
| Communication | Release note/known issue/stakeholder message needed. |

## UAT/Release Decision Rules

| Condition | Decision |
| --- | --- |
| All Must pass, no Critical/High open | Go. |
| Medium/Low issue with approved waiver and no protected risk | Conditional Go. |
| Must scenario blocked/not run without scope decision | No-Go or postpone scope. |
| Incorrect grade/progress/deadline/audit or cross-scope leak | No-Go until fix/retest. |
| Deployment health/rollback/backup evidence absent for risky release | No-Go or remove risky release change. |

## Lessons Learned

For Critical/High defect or repeated Medium issue, team records root cause and prevention: missing Business Rule, unclear acceptance criterion, insufficient test data, API/data design issue, CI gate gap, UI state gap or deployment/monitoring gap. Update relevant BA document and regression scenario, not only code.

## Liên Kết

- UAT: `uat-plan.md`, `uat-execution-and-signoff.md`.
- Change Control: `../04-scope/change-control.md`.
- Risk: `../20-risk-management/`.
- Release: `../15-devops-deployment/release-management.md`.
