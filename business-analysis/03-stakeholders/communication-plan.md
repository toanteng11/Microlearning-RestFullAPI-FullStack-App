# Communication Plan

## Mục Đích

Tài liệu này xác định kế hoạch giao tiếp giữa các stakeholder trong dự án **Microlearning Classroom LMS Platform**.

Communication Plan giúp đảm bảo:

- Thông tin đúng người, đúng thời điểm, đúng mức chi tiết.
- Requirement, scope, risk, issue và decision được truyền đạt rõ ràng.
- Student, Teacher và Admin có cơ hội feedback trước khi UAT/release.
- Technical Lead, QA và DevOps nhận đủ input để triển khai, kiểm thử và deployment.
- Các thay đổi quan trọng được ghi nhận, review và phê duyệt.

## Communication Principles

| Nguyên tắc | Mô tả |
| --- | --- |
| Transparent | Scope, decision, risk và issue cần được ghi nhận rõ |
| Role-based | Mỗi stakeholder nhận thông tin phù hợp với vai trò |
| Timely | Thông tin quan trọng phải được gửi trước khi ảnh hưởng đến delivery |
| Traceable | Quyết định quan trọng phải có owner, date và impact |
| Action-oriented | Meeting cần có output rõ: decision, action item hoặc open question |
| Documentation-first | Requirement, RACI, decision và change phải được cập nhật vào BA docs |

## Communication Matrix

| Hoạt động | Mục đích | Đối tượng | Kênh | Tần suất | Owner | Output |
| --- | --- | --- | --- | --- | --- | --- |
| Product Vision Review | Thống nhất vision, positioning, MVP direction | PO, BA, Sponsor, Tech Lead, QA Lead | Meeting / document review | Theo milestone | PO | Vision approved / comments |
| Stakeholder Review | Xác nhận stakeholder, quyền và cách tương tác | PO, BA, PM, key representatives | Meeting | Khi baseline BA hoặc có thay đổi lớn | BA | Stakeholder Register updated |
| Requirement Workshop | Thu thập và làm rõ requirement | PO, BA, Teacher, Student, Admin, Tech Lead, QA | Workshop | Theo module | BA | Requirement notes, open questions |
| Backlog Prioritization | Ưu tiên feature theo MoSCoW/release | PO, BA, Tech Lead, QA | Meeting | Hằng tuần hoặc theo sprint | PO | Prioritized backlog |
| UX Flow Review | Review user flow và wireframe | PO, BA, UX, Teacher, Student, Admin, QA | Demo / prototype review | Theo sprint | UX | UX feedback, changes |
| Technical Review | Review architecture, API, data model | Tech Lead, Developers, BA, QA, DevOps | Meeting | Hằng tuần | Tech Lead | Technical decisions |
| API Contract Review | Căn chỉnh frontend/backend/QA | Tech Lead, Backend, Frontend, QA, BA | Meeting / Swagger review | Theo API module | Tech Lead | API contract agreement |
| Security / Privacy Review | Review auth, RBAC, token, audit, privacy | Security, Tech Lead, BA, QA, DevOps, Admin | Review session | Trước implementation nhạy cảm và trước release | Security Reviewer | Security findings |
| QA And Acceptance Review | Xác nhận testability và pass/fail criteria | BA, QA, PO, Tech Lead | Meeting | Trước sprint build / trước UAT | QA Lead | Test scenarios updated |
| Sprint Planning | Chọn scope sprint | PO, PM, Tech Lead, Dev, QA, BA | Meeting | Theo sprint | PM / PO | Sprint backlog |
| Sprint Demo | Demo phần đã hoàn thành | PO, BA, Teacher, Student, Admin, team | Demo | Theo sprint | PO / PM | Feedback, acceptance notes |
| Defect Triage | Phân loại và ưu tiên defect | QA, PO, BA, Tech Lead, Dev | Meeting | Khi có defect quan trọng | QA Lead | Defect priority and owner |
| DevOps Review | Review Docker, CI/CD, cloud, rollback | DevOps, Tech Lead, Dev, QA, PO | Meeting | Theo milestone | DevOps | Deployment readiness |
| UAT Planning | Chuẩn bị UAT scenario, user, data | PO, BA, QA, Teacher, Student, Admin | Meeting | Trước UAT | QA Lead | UAT plan |
| UAT Execution Update | Theo dõi UAT progress và issue | PO, BA, QA, representatives | Daily/meeting/chat | Trong UAT | QA Lead | UAT status |
| Release Readiness Review | Quyết định release hoặc demo | PO, BA, Tech Lead, QA, DevOps | Meeting | Trước release | PO | Go/No-Go decision |
| Release Communication | Thông báo release scope và known issues | Stakeholders | Email/chat/document | Theo release | PM / PO | Release note |

## Meeting Cadence

| Meeting | Tần suất | Thời lượng đề xuất | Thành phần bắt buộc | Thành phần tùy chọn |
| --- | --- | --- | --- | --- |
| Weekly Requirement Review | Hằng tuần | 45-60 phút | PO, BA, Tech Lead, QA Lead | Teacher/Admin tùy chủ đề |
| Technical Sync | Hằng tuần | 30-45 phút | Tech Lead, Developers, DevOps | BA, QA |
| UX Review | Theo sprint | 30-60 phút | PO, BA, UX, QA | Teacher, Student, Admin |
| Sprint Planning | Theo sprint | 60-90 phút | PO, PM, Tech Lead, Dev, QA | BA |
| Sprint Demo | Theo sprint | 45-60 phút | PO, BA, Team | Teacher, Student, Admin |
| Defect Triage | Khi cần | 30 phút | QA, PO, Tech Lead, Dev | BA |
| UAT Review | Trước và trong UAT | 30-60 phút | PO, BA, QA, Representatives | Tech Lead |
| Release Readiness | Trước release | 45-60 phút | PO, BA, Tech Lead, QA, DevOps | Security |

## Artifact Communication Plan

| Artifact | Owner | Reviewer | Khi nào cập nhật | Kênh thông báo |
| --- | --- | --- | --- | --- |
| Product Vision | BA | PO, Tech Lead, QA | Khi vision/scope đổi | Document review |
| Stakeholder Register | BA | PO, PM | Khi stakeholder hoặc quyền thay đổi | Document review |
| Scope Baseline | BA | PO, Tech Lead, QA | Khi baseline hoặc change request | Meeting/email |
| Business Requirements | BA | PO, Teacher/Admin, Tech Lead, QA | Khi thêm/sửa requirement | Document review |
| User Stories | BA / PO | Tech Lead, QA | Trước sprint planning | Backlog tool/document |
| Use Cases | BA | PO, QA, Tech Lead | Khi workflow đổi | Document review |
| Data Model | Tech Lead / Backend | BA, QA, Security | Khi entity/relationship đổi | Technical review |
| API Catalog / Swagger | Tech Lead / Backend | Frontend, QA, BA | Theo API module | Swagger/review |
| UI Wireframes | UX | PO, BA, QA, Users | Theo screen/module | Prototype/demo |
| Test Scenarios | QA | BA, PO, Tech Lead | Trước testing/UAT | QA review |
| Release Notes | PM / PO | BA, QA, Tech Lead | Trước release | Email/chat |
| Decision Log | BA / PM | PO, Tech Lead | Khi có quyết định quan trọng | Document update |

## Stakeholder-specific Communication

### Product Owner

| Nội dung cần nhận | Tần suất | Format |
| --- | --- | --- |
| Requirement status | Hằng tuần | Summary + open decisions |
| Scope change impact | Khi phát sinh | Change impact note |
| UAT readiness | Trước UAT | Checklist |
| Release readiness | Trước release | Go/No-Go pack |

### Teacher Representative

| Nội dung cần nhận | Tần suất | Format |
| --- | --- | --- |
| Teacher workflow demo | Theo sprint | Demo/prototype |
| Classwork/Grading changes | Khi có thay đổi | Short walkthrough |
| UAT scenarios | Trước UAT | Task list |
| Feedback result | Sau review | Summary of accepted/rejected feedback |

### Student Representative

| Nội dung cần nhận | Tần suất | Format |
| --- | --- | --- |
| Join/Classwork/Submission demo | Theo sprint hoặc UAT | Demo/task-based test |
| UX survey | Sau demo/UAT | Form |
| Change affecting Student | Khi có thay đổi | Short update |

### Admin Representative

| Nội dung cần nhận | Tần suất | Format |
| --- | --- | --- |
| Admin workflow review | Theo milestone | Demo/document review |
| Role/Permission changes | Khi có thay đổi | Matrix update |
| Reports/AuditLog review | Trước UAT | Walkthrough |
| Offboarding/Policy changes | Khi phát sinh | Business rule review |

### Technical Team

| Nội dung cần nhận | Tần suất | Format |
| --- | --- | --- |
| Approved requirements | Trước sprint | User story + acceptance criteria |
| API/data changes | Khi có thay đổi | Technical review |
| Defect priority | Khi triage | Defect list |
| Release scope | Trước release | Release note |

## Escalation Path

| Loại vấn đề | Escalation Level 1 | Escalation Level 2 | Decision Owner |
| --- | --- | --- | --- |
| Requirement ambiguity | BA | Product Owner | Product Owner |
| Scope conflict | BA / PM | Product Owner | Product Owner |
| Technical feasibility issue | Developer | Technical Lead | Technical Lead |
| API/data model conflict | Backend/Frontend | Technical Lead | Technical Lead |
| UX disagreement | UX / BA | Product Owner | Product Owner |
| Quality gate issue | QA Engineer | QA Lead | QA Lead / Product Owner |
| Deployment blocker | DevOps | Technical Lead | DevOps / Technical Lead |
| Security/privacy concern | Tech Lead | Security Reviewer | Security Reviewer / Product Owner |
| Release Go/No-Go | PM / QA / DevOps | Product Owner | Product Owner |

## Decision Communication Rules

- Mọi quyết định ảnh hưởng scope, priority, requirement hoặc release phải được ghi vào decision log.
- Mọi change request ảnh hưởng MVP phải có Product Owner phê duyệt.
- Mọi thay đổi ảnh hưởng API hoặc data model phải được Technical Lead review.
- Mọi thay đổi ảnh hưởng test scope phải được QA Lead thông báo.
- Mọi thay đổi ảnh hưởng deployment phải được DevOps Engineer xác nhận.
- Mọi thay đổi ảnh hưởng role, permission, token, password hoặc audit log phải được Security/Privacy Reviewer consulted.

## Feedback Management

| Nguồn feedback | Cách thu thập | Cách xử lý |
| --- | --- | --- |
| Teacher | Demo, interview, UAT task | BA phân loại thành requirement/change/request |
| Student | UAT task, usability survey | UX/BA phân tích pain point và improvement |
| Admin | Workflow review, policy review | BA cập nhật rules, permissions, reports |
| QA | Defect, test gap, acceptance issue | QA/BA cập nhật test scenario hoặc requirement |
| Technical Team | Feasibility concern, API concern | Tech Lead/BA cập nhật design hoặc scope |
| DevOps | Deployment issue, environment issue | DevOps/Tech Lead cập nhật deployment docs |

## Communication Risks

| Risk | Tác động | Mitigation |
| --- | --- | --- |
| Stakeholder không review đúng hạn | Chậm baseline requirement | Đặt deadline review và escalation qua PO/PM |
| Feedback rải rác nhiều kênh | Mất thông tin hoặc hiểu sai | Gom vào decision log/open questions |
| Teacher/Student feedback đến muộn | UX phải sửa nhiều | Tổ chức demo sớm theo workflow |
| Technical decision không thông báo BA/QA | Tài liệu và test lệch implementation | Technical review notes phải gửi lại BA/QA |
| Release scope không rõ | UAT và demo bị tranh cãi | Release readiness review và release note |
| Security issue phát hiện cuối | Chậm release | Security checkpoint trước implementation và trước UAT |

## Communication Output Templates

### Meeting Note Tối Thiểu

```text
Meeting:
Date:
Participants:
Topics:
Decisions:
Action Items:
Open Questions:
Risks / Issues:
Next Review:
```

### Decision Note Tối Thiểu

```text
Decision ID:
Decision:
Date:
Owner:
Context:
Options Considered:
Impact:
Follow-up Actions:
```

### Change Summary Tối Thiểu

```text
Change:
Reason:
Affected Scope:
Affected Requirements:
Affected API/Data/UI/Test:
Decision Owner:
Status:
```

## Kết Luận

Communication Plan của dự án cần phục vụ ba mục tiêu: **ra quyết định đúng**, **giảm hiểu nhầm**, và **giữ tài liệu BA đồng bộ với delivery**.

Với sản phẩm Microlearning Classroom LMS, các luồng giao tiếp quan trọng nhất là:

```text
Product Owner quyết định scope
        ↓
BA làm rõ requirement
        ↓
Teacher / Student / Admin xác thực workflow
        ↓
Tech Lead / Dev / QA / DevOps triển khai và kiểm chứng
        ↓
Product Owner phê duyệt release
```

Nếu kế hoạch giao tiếp được duy trì tốt, dự án sẽ giảm đáng kể rủi ro sai scope, thiếu requirement, lệch API, thiếu test coverage hoặc không deploy được đúng kỳ vọng.
