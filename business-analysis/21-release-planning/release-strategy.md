# Release Strategy

## Mục Đích

Chiến lược release định nghĩa cách dự án đưa capability từ backlog đến môi trường sử dụng một cách kiểm soát. Mục tiêu của đồ án là chứng minh một **MVP Classroom LMS hoạt động end-to-end** và năng lực DevOps thực tế, không phải phát hành nhiều feature chưa liên kết hoặc đưa toàn bộ Post-MVP vào cùng một lần deploy.

## Chiến Lược Tổng Thể

### Incremental, Risk-Based Và Evidence-Driven

- Xây dựng theo **vertical capability slice**: access/onboarding, Classroom join, content/learning, assessment/progress, governance/reporting, then operations/release.
- Mỗi increment có thể deploy vào Local/Development/Staging để integration test; chỉ `REL-MVP-1` là target demo/Cloud release theo scope hiện tại.
- Feature có security/data/deadline/grade impact không được tách khỏi audit, negative test, recovery/observability evidence cần thiết.
- Should feature không được làm release blocker cho MVP. Nếu chưa đạt điều kiện, defer có trace thay vì cắt giảm Must control.
- Production-like Cloud release dùng immutable artifact/version, environment configuration an toàn và post-deploy monitoring; không deploy từ laptop hoặc tag mutable `latest`.

## Release Train Theo Capability

| Release ID | Mục tiêu / audience | Capability chính | Không phải điều kiện pass |
| --- | --- | --- | --- |
| REL-0 Foundation | Internal Developer/QA | Repo/runtime setup, ReactJS/Node.js/MongoDB skeleton, auth/RBAC foundation, API standards, Docker local, CI baseline. | Chỉ mở được UI hay có database connection. |
| REL-1 Classroom Access | Internal integration | Admin/Teacher onboarding, manual invitation, account/role policy, Classroom creation, Code/Link join, roster. | Link hoạt động ở UI nhưng server chưa enforce expiry/policy/uniqueness. |
| REL-2 Learning Workflow | QA/UAT candidate preparation | Course/module/lesson/flashcard, deadline/To-do, Quiz/Assignment/Submission/Grade/Feedback, Teacher/Student dashboards and progress/ranking. | Happy path đơn lẻ mà thiếu retry/denial/history/recalculation. |
| REL-MVP-1 Classroom LMS MVP | Teacher/Student/Admin UAT và Cloud demo audience đã được phê duyệt | Full Must workflow, Admin governance/audit/basic reporting, Swagger, Docker, CI/CD, health/monitoring, backup/rollback evidence. | Code merged hoặc documentation coverage nhưng thiếu UAT/operations evidence. |
| REL-1.1 Operational Enhancements | Sau MVP, audience theo PO decision | Resource/media, question media, Gradebook, Deadline Calendar, export, notification/config, ownership/offboarding enhancement. | Đưa external provider vào mà không có security/cost/operation decision. |
| REL-2.0 Extended Platform | Post-MVP | Co-teacher, advanced analytics/weighting, integrations, AI/mobile/enterprise feature nếu được approved. | Reuse MVP assumption cho multi-service/advanced policy. |

`REL-0`, `REL-1` và `REL-2` là **internal release increments**, có thể deploy nhiều lần vào Development/Staging. Chúng không được gọi là product release cho end user nếu entry/exit criteria của `REL-MVP-1` chưa đạt.

## Environment Và Artifact Strategy

| Environment | Mục đích | Scope dùng | Kiểm soát tối thiểu |
| --- | --- | --- | --- |
| Local | Developer implement/debug với data không nhạy cảm. | Feature branch/module. | Docker/Compose nếu applicable, `.env` local không commit, seed data safe. |
| CI | Build/lint/test/scan artifact tự động. | Pull request/protected branch. | Reproducible runtime, required checks, no secret in output. |
| Development / Integration | Kiểm tra API/UI/data giữa component. | REL-0/REL-1/REL-2 work-in-progress. | Version/commit visible, health/basic logs, controlled test data. |
| Staging / UAT | RC verification, regression, UAT, release rehearsal. | Scope freeze of REL-MVP-1 or hotfix. | HTTPS/CORS/SPA routing, health/version, test roles, monitoring, rollback target. |
| Cloud Demo / Production-like | Audience được approve sử dụng/demo. | Approved release artifact only. | Immutable digest/tag, secret reference, backup/recovery decision, monitoring window, release owner. |

Mỗi frontend/backend artifact phải xác định được commit/version/digest. Configuration khác nhau theo environment qua secret/env reference, không nhúng database URI, JWT secret hoặc provider credential vào source/image/client bundle.

## Release Types Và Mức Kiểm Soát

| Release type | Ví dụ | Kiểm soát tối thiểu |
| --- | --- | --- |
| Feature increment | Classroom join, Teacher dashboard. | Affected FR/BR/AC/API/UI/data test, integration evidence. |
| MVP release | REL-MVP-1. | Full Must functional/security/DevOps/UAT/release gate, PO approval. |
| Maintenance | Dependency patch, log improvement. | Risk-based regression, scan/build and release note. |
| Configuration | CORS, domain, feature flag, secret rotation. | Config review, role smoke, rollback/config recovery path. |
| Data/migration | New index, read-model rebuild, schema evolution. | Compatibility, backup, reconciliation and forward-fix/restore decision. |
| Hotfix | Severe auth/API/deploy issue. | Expedited but still versioned artifact, trace, minimum test, monitoring and rollback target. |

## Scope Freeze Và Release Branching Direction

- Scope freeze bắt đầu khi release candidate được chọn cho UAT. Sau đó chỉ nhận security fix, blocker defect, deployment fix hoặc explicitly approved change.
- Mọi feature chưa complete theo Definition of Ready/Done hoặc chưa pass required integration test sẽ chuyển release theo quyết định PO/Technical Lead/QA, không kéo vào RC vì “gần xong”.
- Nếu dùng release branch/tag, chỉ merge fix đã triage vào release scope; feature mới đi qua main/development stream cho release sau.
- Trước Cloud deploy, frozen scope phải có release note: included/excluded feature, known issue, risk/waiver, API/data/config impact, artifact and rollback target.

## Feature Flags Và Progressive Exposure

Feature flag chỉ nên dùng khi code/config/authorization/observability đã được thiết kế để tắt feature an toàn. Nó có thể giúp giảm exposure cho Resource Upload, Notification, export hoặc feature Should; nó không được dùng để che RBAC, data corruption, migration incompatibility hoặc Must quality gate thất bại.

Mọi flag phải có owner, default state theo environment, audience/scope, audit/change record, monitoring/rollback behavior và removal target. Không để flag không owner tồn tại vô hạn.

## Strategic Release Decisions

| Quyết định | Hướng áp dụng |
| --- | --- |
| Manual Teacher invitation | Giữ `MANUAL_COPY` trong MVP; không block release vì chưa có Gmail/SMTP. |
| Resource/upload/media | Chỉ vào MVP Lite/REL-1.1 khi storage/access/policy/risk evidence đủ; external file URL cơ bản vẫn phải check scope. |
| Gradebook/calendar/export/notification | Should; đưa vào REL-1.1 trừ khi Product Owner nâng priority bằng Change Control. Deadline management và Student To-do vẫn là Must. |
| Cloud provider | Không cam kết provider/date trong BA; chọn provider/region/account qua ADR trước Staging Cloud. |
| Post-MVP integration | AI, SIS, payment, Google Workspace, native mobile không được lẫn với REL-MVP-1. |

## Liên Kết

- Release roadmap: `release-roadmap.md`.
- Scope/backlog: `mvp-scope.md`, `release-backlog-catalog.md`, `backlog-management.md`.
- Release execution: `../15-devops-deployment/release-management.md`, `../15-devops-deployment/deployment-runbook.md`.
- Risk/Go-No-Go: `../20-risk-management/risk-monitoring-and-escalation.md`, `../20-risk-management/risk-review-checklist.md`.
