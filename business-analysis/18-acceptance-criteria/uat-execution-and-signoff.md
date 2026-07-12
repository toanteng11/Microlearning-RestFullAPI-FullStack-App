# UAT Execution And Sign-off

## Mục Đích

Tài liệu này hướng dẫn cách chạy UAT, ghi evidence, phân loại kết quả và sign-off. Mục tiêu là Product Owner có thể quyết định dựa trên kết quả thật thay vì chỉ nhận báo cáo “đã test xong”.

## Pre-UAT Checklist

| Check | Owner | Pass condition |
| --- | --- | --- |
| Release candidate | Technical Lead/DevOps | Version, commit, release note và rollback target xác định được. |
| Environment | DevOps | UAT/Staging HTTPS, health/version/CORS/SPA route pass. |
| Test data | BA/QA | Account/role/Classroom/Course/activities/invitation states đủ scenario, dữ liệu synthetic. |
| Access | QA/DevOps | Teacher, Student, Admin, Super Admin/QA role đúng quyền; no shared Production credential. |
| Scope | BA/Product Owner | Must scenario, known exclusion, acceptance catalog và change list đã chốt. |
| Quality gate | QA/Technical Lead | No unresolved blocker from build/API/security/deployment baseline. |
| Evidence location | BA/QA | Test sheet/defect system/release folder accessible, retention/privacy understood. |

## Session Execution Flow

```text
Kick-off and scope confirmation
  -> tester executes scenario with supplied data
  -> capture actual result/evidence
  -> mark PASS / FAIL / BLOCKED / NOT RUN
  -> log defect or change request
  -> triage severity/owner/target release
  -> retest fixed build and regression impacted flow
  -> consolidate UAT summary and sign-off decision
```

## Execution Record Template

| Field | Nội dung |
| --- | --- |
| UAT Run ID | Ví dụ `UAT-2026-07-11-RC1`. |
| Scenario/criterion | `TS-*`, `TS-INV-*`, `TS-GC-*`, `AC-*` liên quan. |
| Build/environment | Frontend/backend version, commit, UAT URL, date/time. |
| Tester role | Product Owner, Teacher representative, Student representative, Admin representative, QA. |
| Preconditions/data | Account/status, Classroom/Course/Activity/invitation state, relevant IDs an toàn. |
| Steps | Các bước thực hiện UI/API ngắn gọn. |
| Expected/actual | Điều kiện expected và actual quan sát được. |
| Evidence | Screenshot, safe API response/requestId, AuditLog ID, health/version, video link if approved. |
| Status | PASS / FAIL / BLOCKED / NOT RUN / WAIVED. |
| Defect/change | ID, severity, owner, retest build/status. |
| Sign-off comment | Business feedback/limitation/decision. |

## Evidence Rules

- Evidence phải đủ tái hiện kết quả nhưng không chứa password, raw token, raw invitation URL, secret, full private submission/media hoặc Production PII.
- Với data mutation, evidence nên gồm UI result và một trong API response/AuditLog/read model/database-safe verification.
- Với denial/security, evidence phải chứng minh API/backend chặn, không chỉ button ẩn.
- Với DevOps, evidence gồm health/version/CI-CD/deployment/monitoring/rollback reference phù hợp.
- Evidence filename/link nên có UAT Run, scenario, environment/build và date; quyền truy cập theo project policy.

## Retest Rules

| Situation | Retest requirement |
| --- | --- |
| Defect fixes one scenario | Retest original failed criterion with same/controlled data. |
| Change affects Business Rule/API/data | Retest impacted positive/negative scenarios, read model/report/audit and regression flow. |
| Deadline/grade/progress change | Retest source record, To-do/Calendar, ranking/report and history/audit. |
| Auth/RBAC/permission change | Retest all affected role/scope denial and allowed paths. |
| Deploy/config/secret change | Retest health/version/CORS/SPA/core role smoke. |

## UAT Daily Status Template

| Date | Run/build | Planned | Pass | Fail | Blocked | Not run | Waived | Critical/High open | Main risk/decision |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| YYYY-MM-DD | RC version | 0 | 0 | 0 | 0 | 0 | 0 | 0 | Notes |

## Sign-off Decision

| Decision | Conditions |
| --- | --- |
| Go | All Must UAT criterion pass; no Critical/High open; NFR/DevOps gate pass; evidence and release plan complete. |
| Conditional Go | Limited Medium/Low known issues or approved waiver; no security/privacy/data-loss risk; owner/mitigation/expiry/release note explicit. |
| No-Go | Any Must flow unverified/failed without accepted waiver, Critical/High defect, security/privacy/data integrity concern, or deployment recovery gap. |

## UAT Sign-off Template

| Field | Content |
| --- | --- |
| UAT Run / Release candidate | ID, version, commit, environment, date. |
| Scope tested | Included domains/scenario count and exclusions. |
| Result summary | Pass/Fail/Blocked/Not Run/Waived count. |
| Open defects/known issues | ID, severity, impact, workaround, owner, target/expiry. |
| Quality/operations evidence | Health/version/CI-CD/monitoring/backup/rollback references. |
| Decision | Go / Conditional Go / No-Go. |
| Product Owner | Name/date/decision/comment. |
| QA Lead | Name/date/quality statement. |
| Technical Lead | Name/date/risk statement. |
| DevOps Engineer | Name/date/deployment readiness statement. |
| Business Analyst | Name/date/traceability/documentation confirmation. |

Sign-off acknowledges release scope and known risk; it does not authorize bypassing security, privacy, data integrity or legal/organization policy.

## Liên Kết

- Plan: `uat-plan.md`.
- Defect/waiver: `defect-waiver-management.md`.
- Release: `devops-release-acceptance.md`.
