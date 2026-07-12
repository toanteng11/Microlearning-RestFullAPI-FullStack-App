# Release Roadmap

## Mục Đích

Roadmap mô tả thứ tự release theo capability, dependency và quality gate. Đây **không phải lịch cam kết ngày**: ngày/effort chỉ được thêm sau khi team xác nhận capacity, provider, UAT participant và backlog estimate. Mỗi increment có thể cần nhiều sprint/build; chỉ được tiến khi exit criteria đạt.

## Roadmap At A Glance

```text
REL-0 Foundation
  -> REL-1 Classroom Access
  -> REL-2 Learning Workflow
  -> REL-MVP-1 UAT + Cloud Demo Release
  -> REL-1.1 Operational Enhancements
  -> REL-2.0 Extended Platform
```

## Release Increment Plan

| Release | Objective / scope | Primary dependency | Entry gate | Exit gate / evidence | Status |
| --- | --- | --- | --- | --- | --- |
| REL-0 Foundation | ReactJS/Node.js/MongoDB structure, Student self-registration, auth/account/RBAC baseline, API conventions, Swagger skeleton, Docker local, CI quality baseline. | Stack decisions, repository/runtime, token security direction. | Core FR/BR/API/data/UI design reviewed; safe local config. | Register/Login and privilege-injection tests; role access baseline; Swagger/error standard; Docker local; CI checks execute; no secret exposure. | Planned |
| REL-1 Classroom Access | Admin lists/policy, manual Teacher invitation, Teacher activation, Classroom/roster/settings, authenticated Class Code/Invite Link join. | REL-0, invitation policy, token security và enrollment data uniqueness. | Invitation/join FR/BR/AC test data and authorization design ready. | Register→Login→Join plus Admin/Teacher/Student create/copy/accept/join/deny/retry integration; audit/policy/duplicate evidence. | Planned |
| REL-2 Learning Workflow | Course/Module/Lesson/Flashcard/Stream, deadline, To-do, Lesson flow, Quiz/Assignment/Submission/Grade/Feedback, dashboard/progress/ranking. | REL-1, progress/read-model design, time/deadline policy, assessment data. | Content/learning/assessment API/UI/data designs and tests ready. | End-to-end Teacher-to-Student learning flow; deadline reset/recalculation/history; grade/private scope; navigation/role regression. | Planned |
| REL-MVP-1 Classroom LMS MVP | Integrate all Must bundles, Admin report/audit basic, API/Swagger, Docker/CI/CD, Staging/Cloud, monitoring/backup/rollback and UAT. | REL-0/1/2, Cloud/provider decision, CI/CD evidence, UAT representatives/test data, release risk closure. | Scope freeze, versioned RC, no blocking integration defect, release entry criteria pass. | Must UAT/quality/DevOps pass; Go approval; controlled deployment, smoke/monitoring and release closure. | Planned |
| REL-1.1 Operational Enhancements | Resource/media/question media, Gradebook, Calendar, export, notification config, ownership/offboarding and content reuse where approved. | Stable MVP, storage/notification/export policy, residual risk/capacity. | Approved backlog/CR and design/risk review. | Affected functional/security/privacy/operations acceptance; no regression of MVP. | Backlog |
| REL-2.0 Extended Platform | Co-teacher, advanced grading/analytics, integrations, AI/mobile/enterprise features if business value justifies. | Product roadmap, provider/data/privacy/security architecture decisions. | Separate vision/scope/ADR/estimate/risks approved. | Release-specific criteria defined; not inferred from MVP. | Future |

## Capability Sequencing Rationale

| Sequence | Lý do không nên đảo ngược |
| --- | --- |
| REL-0 trước REL-1 | Invitation/join cần account state, RBAC, token policy, API error/audit/data foundation; UI trước security/data sẽ gây rework. |
| REL-1 trước REL-2 | Learning/To-do/progress phải có Classroom enrollment/ownership/visibility scope đúng. |
| REL-2 trước REL-MVP-1 | UAT cần end-to-end learning workflow trước khi kiểm chứng report/operations/release. |
| DevOps xuyên suốt, không để cuối | Docker/CI/API health/log/config phải xuất hiện từ REL-0; Cloud/UAT/recovery evidence chốt ở REL-MVP-1. |
| REL-1.1 sau stable MVP | Upload/media/export/notification tăng privacy/storage/provider risk; không được làm yếu core workflow. |

## REL-MVP-1 Milestones

| Milestone | Outcome required | Owner accountable | Gate decision |
| --- | --- | --- | --- |
| M1 Scope and Backlog Ready | Must/Should split, dependencies, acceptance and known exclusions clear. | Product Owner + BA | Proceed to implementation planning. |
| M2 Architecture and API Ready | API/data/UI design, token/security decision, Swagger direction, migration/index implications reviewed. | Technical Lead | Proceed to integrated implementation. |
| M3 Integrated Workflow Ready | REL-0/1/2 end-to-end flows work in integration environment; required test cases available. | Backend/Frontend Leads + QA | Select RC only when blockers resolved. |
| M4 Release Candidate Ready | Frozen scope, immutable artifacts, CI quality result, Staging health/version, test data/access and rollback target ready. | DevOps + QA Lead + Technical Lead | Proceed to UAT. |
| M5 UAT and Operational Ready | Must UAT pass, risk/defect/waiver decision, monitoring/backup/rollback/release note ready. | QA Lead + PO + DevOps | Go / Conditional Go / No-Go. |
| M6 Release Closure | Cloud deploy/smoke/monitoring complete, actual version/outcome/known issue/lessons recorded. | Release Owner | Close or open incident/follow-up. |

## Scope Movement Rules

| Situation | Planning response |
| --- | --- |
| Must feature is incomplete at scope freeze | Do not call it “almost done”; either fix before RC or Product Owner changes scope through Change Control. |
| Should feature is incomplete | Move to REL-1.1/backlog; retain trace/acceptance and document no user promise. |
| Critical/High defect or risk | Block affected release; contain/fix/retest or formally remove affected scope. |
| New security/data/architecture finding | Re-estimate impact; Technical Lead/Security/DevOps review; release sequence may change. |
| Cloud/UAT dependency unavailable | Delay target stage or use approved non-Cloud internal increment; do not claim Cloud release complete. |
| Hotfix after MVP | Use hotfix release type with shortened but non-zero CI/test/trace/monitoring/rollback controls. |

## Post-MVP Roadmap Boundaries

`REL-1.1` is a controlled enhancement release, not a dumping ground. Each item needs clear value, priority, storage/notification/export/privacy design where relevant and regression testing. `REL-2.0` needs a separate scope baseline because advanced integrations, AI, native mobile, co-teacher and multi-tenant capability materially change permissions, data, NFR and operations.

## Liên Kết

- Release strategy and scope: `release-strategy.md`, `mvp-scope.md`.
- Backlog/dependencies/gates: `release-backlog-catalog.md`, `release-dependencies-and-assumptions.md`, `release-entry-exit-criteria.md`.
- Release operation: `../15-devops-deployment/release-management.md`.
