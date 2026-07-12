# Business Rule Governance

## Mục Đích

Business Rules thay đổi ít thường xuyên hơn UI wording nhưng có tác động lớn hơn tới workflow, data, API, test, audit, report và release. Tài liệu này kiểm soát cách tạo, review, phê duyệt, triển khai, kiểm thử và thay đổi rule để hệ thống không có nhiều cách hiểu khác nhau cho cùng một quy tắc.

## Rule Record Template

| Field | Nội dung bắt buộc |
| --- | --- |
| Rule ID | Mã bất biến, ví dụ `BR-075`; không tái sử dụng ID đã retired. |
| Name/statement | Một câu mệnh lệnh/điều kiện rõ ràng, không mơ hồ. |
| Domain/owner | Account, Join, Content, Learning, Assessment, Admin, Reporting; Business Owner + Technical Owner. |
| Priority/status | Must/Should/Could và Draft/Proposed/Approved/Implemented/Deprecated/Superseded. |
| Trigger/actor/resource | Ai/hành động/tài nguyên nào kích hoạt rule. |
| Preconditions | Role, status, permission, ownership, policy, lifecycle/time/input conditions. |
| Decision/outcome | Allow/deny/state transition/formula/side effect rõ. |
| Exception | Ai được exception, reason/approval/audit nào cần; không để “Admin can do anything” mơ hồ. |
| Data/API/UI impact | Entity/field/history/read model/error/API/UI label bị ảnh hưởng. |
| Audit/notification | Event cần ghi, metadata safe, notification behavior nếu có. |
| Trace/test | FR/US/UC/API/schema/test scenario/UAT/NFR/ADR link. |
| Version/effective date | Khi change có impact historical metric/status/report. |

## Rule Status Lifecycle

```text
Draft -> Proposed -> Approved -> Implemented -> Verified
                    \-> Rejected
Approved/Implemented -> Superseded or Deprecated
```

| Status | Meaning | Allowed use |
| --- | --- | --- |
| Draft | BA/owner đang soạn, chưa review đầy đủ. | Không làm implementation baseline. |
| Proposed | Có context/options/impact sơ bộ. | Technical/QA/Product review. |
| Approved | Authority đã chấp nhận rule baseline. | Backlog/implementation/test input. |
| Implemented | Code/config/API đã thực hiện. | Cần QA/UAT evidence, chưa mặc định correct. |
| Verified | QA/UAT/owner xác nhận expected behavior. | Release evidence. |
| Rejected | Không dùng; giữ reason/history. | Không implement. |
| Superseded | Thay bằng Rule ID/version khác. | Giữ trace historical, do not delete. |
| Deprecated | Không còn product support. | Migration/communication needed if data/API exists. |

Tài liệu BA đang Draft ở version hiện tại; catalog là baseline đề xuất và cần Product Owner/Technical Lead review trước khi code nếu rule có thay đổi scope/experience lớn.

## Ownership And Approval

| Rule category | Business owner | Technical reviewer | Approval authority | QA/DevOps consult |
| --- | --- | --- | --- | --- |
| Learning/deadline/assessment | Product Owner + Teacher representative | Technical Lead/Backend Lead | Product Owner | QA Lead |
| Role/account/invitation/join | Product Owner/Admin owner | Technical Lead + Security reviewer | Product Owner/Super Admin policy owner | QA Lead, DevOps if rate/audit impact |
| Data retention/audit/privacy/export | Product Owner/Admin owner | Technical Lead/Security reviewer | Product Owner + authority policy | QA Lead, DevOps |
| Metric/report/analytics | Product Owner | Backend/Frontend/Technical Lead | Product Owner | QA, DevOps |
| Infrastructure/system policy | DevOps/Technical Lead | Security/Backend Lead | Technical Lead/Super Admin policy owner | QA, Product Owner |

## Rule Change Assessment

Change control is mandatory when a rule changes action permission, status transition, score/progress formula, deadline semantics, data retention, token policy, export scope, audit content or delivery/recovery behavior.

| Impact area | Questions before approval |
| --- | --- |
| Business/UX | Does the change alter Student/Teacher/Admin expectation, fairness or workflow? |
| Security/privacy | Does it broaden access, weaken token/password/policy, leak export/report data? |
| Data | Does it change schema, history, status, retention, index, migration/recalculation? |
| API | Are endpoint request/response/error/status/code/backward compatibility affected? |
| Reporting | Are historical metric/ranking/trend definitions comparable after change? |
| QA/UAT | Which positive/negative/regression test and edge cases must change? |
| DevOps | Does job/monitoring/backup/feature flag/config/rollout/rollback change? |
| Release | Is migration, communication, staged rollout or rollback/forward-fix required? |

## Rule Conflict Resolution

When two rules appear to conflict, resolve in this order and document outcome; do not rely on code order or UI behavior:

1. Law/privacy/security/compliance and explicit global system policy.
2. Account status, authentication, role/permission and object-level authorization.
3. Data integrity/retention/audit requirement.
4. Resource lifecycle/availability/time-window/assignment policy.
5. Domain-specific rule such as score/deadline/submission rule.
6. UI convenience/default/analytics presentation.

Example: Teacher setting says Invite Link enabled, but global policy says disabled. BR-017/BR-097 win and join is denied. Example: frontend shows Export button, but current Teacher has lost ownership; BR-105/BR-108 win and download is denied.

## Exception Governance

| Exception type | Minimum control |
| --- | --- |
| Deadline past/shortening correction | Authorized actor, reason, affected scope review, history/AuditLog, recalculation. |
| Admin content/grade override | Explicit permission, business/support reason, AuditLog, no silent normal workflow replacement. |
| Emergency Teacher block | Security authority, immediate audit/reason, mandatory follow-up transfer/archive. |
| Data hard delete/anonymization | Approved retention/legal process, impact/backup plan, audit; out of MVP ordinary flow. |
| Report/export beyond default | Permission/purpose/scope, limit/private file/re-authorization/audit. |

An exception is not a reason to remove core validation or authorization. It is an additional controlled branch with narrower permission and stronger audit.

## Implementation And Test Traceability

| Artifact | Required action when BR changes |
| --- | --- |
| Requirements/User Stories/Use Cases | Update affected behavior/acceptance condition. |
| Data model/validation | Update fields, enum/index/history/rebuild/retention as applicable. |
| API/Swagger | Update request/response/error/auth/authorization version or compatibility. |
| UI/UX | Update visibility, label, confirm/reason/error/loading/empty state. |
| Reporting | Update metric definition/version/as-of/reconciliation/export scope. |
| Test/UAT | Add positive, negative, edge, regression and data migration tests. |
| Security/DevOps | Update audit/log/monitor/alert/config/backup/rollback plan. |
| Revision/RTM | Record revision/change request and maintain traceability. |

## Review Cadence And Quality Gate

- Review all Must Business Rules before backend implementation of that domain.
- Re-review after any change to Invitation, Join, Role/Permission, Deadline, Grade, Progress formula, Export/Analytics or Data Retention.
- QA cannot close a Must feature without evidence that relevant BR positive and negative paths pass.
- Technical Lead reviews whether a rule is enforced in service/API/data rather than merely UI.
- Product Owner resolves ambiguous business outcome; no Developer/QA should invent policy silently to unblock implementation.

## Rule Review Checklist

- Is the actor/resource/scope/trigger clear?
- Are account status, permission and ownership considered?
- Is the valid state transition and denied state explicit?
- Is exception/reason/audit defined where fairness/privacy/data changes are involved?
- Does it preserve history and avoid duplicate/partial write?
- Does API return safe understandable error without leaking protected data?
- Are read model/report/notification side effects and failure/rebuild behavior stated?
- Are traceability/test cases updated, including negative test?

## Liên Kết

- Change control: `../04-scope/change-control.md`.
- Traceability: `../19-traceability/traceability-guidelines.md`.
- Acceptance/UAT: `../18-acceptance-criteria/`.
- Architecture ADR: `../14-solution-architecture/architecture-decision-records.md`.
