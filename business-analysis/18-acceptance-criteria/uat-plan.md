# UAT Plan

## Mục Đích

User Acceptance Testing (UAT) xác nhận hệ thống giải quyết đúng workflow nghiệp vụ cho Student, Teacher và Admin trong môi trường gần Production. UAT không thay thế QA automation, security test hay DevOps gate; nó là bước Product Owner/end-user representative chấp nhận business readiness.

## UAT Objectives

- Xác nhận workflow end-to-end phù hợp Internal Microlearning Classroom LMS, không phải clone thương hiệu Google Classroom.
- Xác nhận manual Teacher Invitation Link, Classroom join Code/Link, To-do, deadline, learning, assessment, grading, Admin governance và reporting.
- Xác nhận Business Rules Must hoạt động trong tình huống thực tế và exception phổ biến.
- Ghi nhận feedback/defect/known issue và ra quyết định Go, Conditional Go hoặc No-Go.

## UAT Scope

| Domain | Must UAT scenarios |
| --- | --- |
| Account/role | Login, account status, role-specific landing/access, unauthorized denial. |
| Teacher invitation | Create/copy/manual send simulation/accept/email mismatch/expired/revoked/reuse. |
| Classroom join | Code/Invite Link success, disabled/expired/duplicate/locked denial. |
| Teacher content | Classroom/Course/Module/Lesson/Quiz/Assignment publish, optional Question Media, deadline. |
| Student learning | To-do, navigation, Lesson completion, Quiz/Assignment submission, late/missing. |
| Progress/grade | Teacher roster/ranking, deadline reset recalculation, grade/feedback/return, Student self-result. |
| Admin governance | Student/Teacher/Admin lists, account status, ownership/offboarding, policy/audit. |
| Reporting/export | Scope/freshness/filter/report/export permission and no cross-scope data. |
| Quality readiness | Core UI states, API documentation, Docker/Cloud health/version/role smoke/rollback evidence. |

## UAT Exclusions

- Unit/load/penetration test execution itself, though their evidence may be reviewed.
- Native mobile, AI, payment, Certificate, external email/Gmail/SSO/BI integrations not approved in release scope.
- Production data migration or restore test unless authorized separately by privacy/DevOps process.

## Roles And Responsibilities

| Role | Responsibility |
| --- | --- |
| Product Owner | Defines business acceptance, decides Go/Conditional Go/No-Go, signs release scope. |
| Business Analyst | Prepares scenario/criterion/data, facilitates sessions, clarifies business expectation, maintains traceability. |
| QA Lead | Verifies environment/data readiness, supports execution/evidence/defect/retest and reports quality status. |
| Teacher Representative | Executes teacher authoring/deadline/grading/progress workflow and validates usability. |
| Student Representative | Executes join/To-do/learning/submit/feedback workflow and validates clarity. |
| Admin Representative | Executes invitation/user/policy/report/audit governance flow. |
| Technical Lead | Resolves rule/API/data ambiguity, assesses technical risk and waiver impact. |
| DevOps Engineer | Ensures Staging/health/version/log/rollback/backup release evidence. |

## UAT Environment And Data

| Item | Requirement |
| --- | --- |
| Environment | Dedicated Staging/UAT URL over HTTPS; build/version/commit identifiable. |
| Accounts | At least 2 Students, 2 Teachers, 1 Admin, 1 Super Admin if feature in scope; include ACTIVE and blocked/inactive negative account. |
| Classroom/Course | At least two Classroom/Course with separate Teacher ownership, published/draft/archived content. |
| Activities | Lesson with deadline, Quiz objective + optional media, Assignment with due/late/resubmit policy. |
| Invitation | Pending/expired/revoked/accepted test invitation with synthetic email; no real mailbox integration required. |
| Data safety | Synthetic or sanitized data only; no production secret/raw token/export file exposed in UAT evidence. |
| Observability | Swagger, health/version endpoint, safe log/requestId and CI/deployment record available to QA/DevOps. |

## UAT Entry Criteria

- Release candidate passes build/test/critical QA regression and relevant NFR quality gates.
- Must API/Swagger contract, test accounts/data, access roles and environment URLs are ready.
- Known defects are triaged; no open Critical blocker expected before UAT start.
- Acceptance catalog, scenarios, expected results and defect reporting channel have been shared with participants.
- DevOps confirms health/version/HTTPS/CORS/SPA route baseline and rollback target.

## UAT Execution Process

```text
Prepare environment/data/accounts
  -> Brief participants and confirm scope
  -> Execute scenario with Given/When/Then evidence
  -> Record PASS / FAIL / BLOCKED / NOT RUN
  -> Log defect or change request
  -> Fix and retest regression if applicable
  -> Summarize quality/risk/known issue
  -> Product Owner Go / Conditional Go / No-Go sign-off
```

## UAT Status Definitions

| Status | Meaning |
| --- | --- |
| PASS | Actual behavior/evidence meets criterion. |
| FAIL | Behavior differs from criterion; defect/change needs action. |
| BLOCKED | Cannot execute due to environment/data/access/dependency issue; not a pass. |
| NOT RUN | Planned but not executed; requires disposition before exit. |
| WAIVED | Criterion not passed but authorized risk acceptance has owner/mitigation/expiry; only allowed by waiver process. |

## UAT Exit Criteria

- All Must UAT scenarios executed and `PASS`, or formally `WAIVED` with no security/privacy/data-loss exception.
- Critical/High defects resolved and retested; Medium/Low defects assessed for release/backlog.
- Teacher/Student/Admin representative confirms critical workflow behavior or documents issue.
- DevOps confirms deploy/health/version/monitoring/rollback readiness relevant to release.
- Product Owner signs Go/Conditional Go/No-Go; Conditional Go has explicit known issue and follow-up date.

## UAT Deliverables

- UAT scope/version/build/environment record.
- Scenario execution sheet with actual result/evidence.
- Defect/waiver/known issue list and retest result.
- UAT summary with pass rate, risk and Go/Conditional Go/No-Go decision.
- Sign-off record in `uat-execution-and-signoff.md` template or project tool.

## Liên Kết

- Criteria catalog: `acceptance-criteria-catalog.md`.
- Scenario: `test-scenarios.md`, invitation/reference scenario files.
- Defect/waiver: `defect-waiver-management.md`.
- Release gate: `devops-release-acceptance.md`.
