# MVP Scope

## Mục Đích

Tài liệu này xác định phạm vi tối thiểu có thể phát hành của **Microlearning Classroom LMS Platform**. MVP không phải là “mọi feature đã được nhắc đến”; đó là capability đủ để Admin onboarding Teacher, Teacher tổ chức/lãnh đạo hoạt động học, Student tham gia/học/nộp bài và cả ba role có thể vận hành an toàn trên môi trường đã được kiểm chứng.

Mọi scope trong tài liệu này vẫn chịu sự điều chỉnh của `../04-scope/scope-baseline.md` và `../04-scope/change-control.md`. Khi có khác biệt giữa tài liệu cũ và current Business Rules/Feature Priority, không tự chọn phương án có lợi cho tiến độ; phải ghi decision hoặc Change Request.

## MVP Release Outcome

`REL-MVP-1` phải chứng minh được flow sau trên Staging/Cloud target:

```text
Admin tạo/copy Teacher invitation link và gửi thủ công
  -> Teacher kích hoạt account, tạo Classroom/Course và publish hoạt động có deadline
  -> Student join bằng Code/Link, thấy Student To-do và học/làm/nộp bài
  -> Teacher xem roster/progress/ranking, chấm điểm/feedback và reset deadline có lý do
  -> Student chỉ xem kết quả của mình
  -> Admin quản trị account/policy và xem report/audit cơ bản
  -> API/CI-CD/health/monitoring/backup-rollback evidence xác nhận release vận hành được
```

## Must Capability Bundles

| Bundle ID | Capability Must | Requirement / rule trace chính | Release evidence tối thiểu |
| --- | --- | --- | --- |
| MVP-CAP-001 | Student self-registration, Login/session, account status, password/token security, RBAC và object-level access. | FR-001 đến 005, FR-064 đến 069; BR-001 đến 004/001A đến 001C, BR-036 đến 041; BRQ-004/021. | Registration allowlist/no-side-effect test; Login; allowed/denied API test theo role/scope; safe error/log review. |
| MVP-CAP-002 | Admin quản lý Student/Teacher/Admin list, role/permission, system policy, dashboard/report/audit cơ bản. | FR-004, FR-009/009A/009B/009C đến 011, FR-016/017/019/064/069; BRQ-013/016/017. | Admin UAT, pagination/filter, sensitive action audit, role negative test. |
| MVP-CAP-003 | Manual Teacher invitation: create/copy, external manual delivery, accept, email matching, one-time/expiry/revoke. | FR-006 đến 008; BR-010 đến 014C, BR-042 đến 049; BRQ-014/015. | Invitation lifecycle/security test, Admin/Teacher UAT, no auto-email assumption. |
| MVP-CAP-004 | Classroom access: create/manage Classroom, Class Code/Invite Link Join, enrollment policy, roster. | FR-020 đến 025; BR-016 đến 019, BR-050 đến 057; BRQ-001/004/016. | Join success/denial/retry/duplicate test, policy and roster verification. |
| MVP-CAP-005 | Teacher tạo Course, Module/Topic, Micro Lesson, Flashcard, Announcement và publish lifecycle. | FR-026, FR-028 đến 031, FR-033, FR-035; BR-058 đến 068; BRQ-002/003/020. | Teacher content UAT, Student visibility scope, content state/audit where required. |
| MVP-CAP-006 | Deadline, Student To-do, Lesson Player, Progress và navigation. | FR-027, FR-029/030, FR-049 đến 057, FR-059; BR-029/030, BR-033/035, BR-069 đến 080; BRQ-005/007/009/022. | Deadline/To-do/history/recalculation and navigation edge tests; Teacher/Student UAT. |
| MVP-CAP-007 | Quiz, Assignment, Submission, Grade, Feedback và private result scope. | FR-036/037/039/041 đến 043/045/046/048/055; BR-083 đến 096; BRQ-006/011/012. | Assessment E2E, retry/late/authorization/feedback visibility test, audit/retest. |
| MVP-CAP-008 | Teacher Course Dashboard, Student progress, backend process score/ranking and learning record integrity. | FR-027, FR-054, FR-060/061/063; BR-034, BR-074/081/082; BRQ-007/008/012. | Teacher ranking/Student own-view UAT, tie/recalculation/data integrity test. |
| MVP-CAP-009 | RESTful API/Swagger, pagination/error standard, Docker, CI/CD, Cloud configuration, health/logging/monitoring/backup/rollback. | FR-064 đến 075; BRQ-019/021/024/025; NFR/DevOps AC. | Swagger, CI run, Docker setup, Staging health/version, monitoring, backup/recovery/rollback evidence. |

## MVP Must Scope Detail

| Domain | Included behavior | Explicit boundary |
| --- | --- | --- |
| Admin | Separate Student/Teacher/Admin lists; account status/role policy; Teacher invitation; enrollment policy; basic report/audit. | Không cần BI dashboard phức tạp, bulk import hoặc full organization hierarchy. |
| Teacher | Classroom/Course/Module/Lesson/Flashcard/Announcement; Quiz/Assignment; deadline reset with reason; roster, dashboard, grading/feedback. | Không cần co-teacher, advanced rubric, content marketplace hoặc live video integration. |
| Student | Join Code/Link; Dashboard To-do; Classwork/lesson/flashcard/quiz/assignment; own progress and returned grade/feedback; navigation controls. | Không xem data/feedback/ranking riêng tư của Student khác; không cần native app. |
| Business integrity | Active account/scope checks, no duplicate enrollment/progress mutation, backend calculation, history/audit for sensitive actions. | Không tự sửa data/bỏ audit để demo; no client-side source-of-truth for score/deadline. |
| Technical/DevOps | Versioned REST API/Swagger, ReactJS/Node.js/MongoDB, Docker, CI/CD, Cloud-ready config, health/log/monitoring, backup/rollback strategy. | Không yêu cầu Kubernetes, multi-region DR hoặc enterprise SRE stack cho MVP. |

## Conditional Scope: MVP Lite Hoặc REL-1.1

Các item sau chỉ đưa vào `REL-MVP-1` khi Must capability đã không bị ảnh hưởng, dependency/risk/evidence đầy đủ và PO chấp nhận scope. Nếu không, chúng thuộc `REL-1.1`, không được ghi là failed MVP.

| Capability | Priority hiện tại | Điều kiện để đưa sớm | Default release nếu chưa đủ điều kiện |
| --- | --- | --- | --- |
| Learning Resource / attachment | Should | File/storage/access/retention policy và test có sẵn. | REL-1.1 |
| Image/video trong Quiz Question | Should | Media policy/storage/access/preview/resilience được xác nhận. | REL-1.1 |
| Gradebook Basic | Should | Grade source/ranking/report consistency và privacy/export scope được test. | REL-1.1 |
| Learning Calendar / Deadline View | Should | Deadline logic Must đã stable; UI không tạo source-of-truth mới. | REL-1.1 |
| In-app notification | Should | Event schema/retry/visibility/observability rõ; no external delivery assumption. | REL-1.1 |
| Export report/audit | Should | Re-authorization, projection/limit/expiry/audit policy và privacy test. | REL-1.1 |
| Ownership transfer / Teacher offboarding enhancement | Should | Policy/data history/audit/UAT for active Classroom transfer complete. | REL-1.1 |
| Content preview/reuse | Should | Ownership/visibility/audit impact reviewed. | REL-1.1 |

## Explicitly Excluded From REL-MVP-1

| Exclusion | Lý do / release direction |
| --- | --- |
| Gmail/SMTP automatic Teacher invitation | MVP uses manual copy delivery; adding provider changes security/operation/scope. |
| SIS, payment, marketplace, Google Classroom API integration | Không thuộc Internal LMS core và cần dependency/data governance riêng. |
| AI grading/recommendation, plagiarism/originality engine | Cần model/provider/policy/quality evaluation riêng. |
| Native mobile, advanced realtime/live meeting integration | Cần platform/realtime capability ngoài ReactJS web MVP. |
| Co-teacher, advanced weighted grade/rubric, multi-tenant billing | Tăng rule/data/permission/release complexity; Post-MVP. |
| Advanced BI/organization analytics and multi-region DR | Vượt nhu cầu MVP/demo; chỉ roadmap khi có business decision. |

## Scope Consistency And Resolution Points

| Point | Current planning treatment | Required action if changed |
| --- | --- | --- |
| Deadline Calendar | Deadline creation/reset/To-do propagation là Must; standalone Calendar view là Should. | Không defer deadline logic vì Calendar UI chưa ready. |
| Process score | MVP default is backend `processScore = progressPercentage`; weighted formula là Post-MVP decision. | Change formula cần BR/metric/recalculation/report/UAT impact analysis. |
| Resource/upload | Resource may use safe link/basic support; full upload/storage provider chưa assumed. | Decide feature-gate or provider/policy before accepting media/upload scope. |
| Cloud release | Provider baseline đã chọn; account/billing/quota/domain và remote deployment evidence chưa có. | Implement ADR-010/ISS-001 và pass Phase 07 environment readiness trước Staging Cloud commitment. |

## MVP Acceptance Summary

`REL-MVP-1` chỉ đạt MVP khi tất cả Must capability bundle pass acceptance/UAT evidence và không có open Critical/High security, privacy, data integrity, grade/progress/deadline, deployment/recovery blocker. Scope defer là hợp lệ khi được record trong release note/backlog/decision, không làm sai business promise.

## Liên Kết

- Detailed backlog: `release-backlog-catalog.md`.
- Entry/exit: `release-entry-exit-criteria.md`.
- Scope/change: `../04-scope/scope-baseline.md`, `../04-scope/change-control.md`.
- RTM: `../19-traceability/requirement-traceability-matrix.md`.
