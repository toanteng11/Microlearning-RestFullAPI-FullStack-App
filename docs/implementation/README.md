# Implementation Documentation

## 1. Mục đích

Thư mục này chuyển BA baseline thành kế hoạch kỹ thuật, task, test và bằng chứng triển khai. Nội dung được viết bằng tiếng Việt; tên folder, file, module, API và ID dùng tiếng Anh.

## 2. Cấu trúc

```text
docs/implementation/
|-- README.md
|-- common/
|   |-- README.md
|   |-- technical-implementation-plan.md
|   |-- coding-standards.md
|   |-- development-workflow.md
|   |-- definition-of-done.md
|   `-- traceability-matrix.md
|-- phase-01/
|   |-- README.md
|   |-- phase-plan.md
|   |-- scope-and-deliverables.md
|   |-- work-breakdown-structure.md
|   |-- architecture-overview.md
|   |-- technical-decisions.md
|   |-- repository-structure.md
|   |-- frontend-foundation.md
|   |-- backend-foundation.md
|   |-- database-foundation.md
|   |-- api-documentation.md
|   |-- environment-and-security.md
|   |-- docker-local-environment.md
|   |-- ci-quality-gates.md
|   |-- testing-strategy.md
|   |-- acceptance-criteria.md
|   |-- risk-and-issues.md
|   |-- implementation-checklist.md
|   |-- evidence-register.md
|   |-- phase-02-readiness.md
|   `-- exit-report.md
|-- phase-02/
|   |-- README.md
|   |-- phase-plan.md
|   |-- scope-and-deliverables.md
|   |-- technical-decisions.md
|   |-- architecture-and-module-design.md
|   |-- security-session-and-rbac.md
|   |-- data-model-and-indexes.md
|   |-- api-contract.md
|   |-- backend-implementation-plan.md
|   |-- frontend-implementation-plan.md
|   |-- teacher-invitation-and-admin-users.md
|   |-- devops-environment-and-seeding.md
|   |-- work-breakdown-structure.md
|   |-- testing-strategy.md
|   |-- acceptance-criteria.md
|   |-- traceability-matrix.md
|   |-- risk-and-issues.md
|   |-- implementation-checklist.md
|   |-- evidence-register.md
|   |-- exit-report.md
|   `-- phase-exit-evidence.md
|-- phase-03/
|   |-- README.md
|   |-- scope-and-deliverables.md
|   |-- phase-plan.md
|   |-- technical-decisions.md
|   |-- architecture-and-module-design.md
|   |-- classroom-lifecycle-and-enrollment.md
|   |-- security-ownership-and-governance.md
|   |-- data-model-and-indexes.md
|   |-- api-contract.md
|   |-- backend-implementation-plan.md
|   |-- frontend-implementation-plan.md
|   |-- devops-environment-and-seeding.md
|   |-- testing-strategy.md
|   |-- work-breakdown-structure.md
|   |-- acceptance-criteria.md
|   |-- traceability-matrix.md
|   |-- risk-and-issues.md
|   |-- implementation-checklist.md
|   |-- developer-start-guide.md
|   |-- development-readiness-review.md
|   |-- evidence-register.md
|   |-- phase-exit-evidence.md
|   `-- exit-report.md
|-- phase-04/
|   |-- README.md
|   |-- phase-plan.md
|   |-- scope-and-deliverables.md
|   |-- ba-alignment-and-decisions.md
|   |-- technical-decisions.md
|   |-- architecture-and-module-design.md
|   |-- content-lifecycle-and-visibility.md
|   |-- deadline-and-derived-state.md
|   |-- security-ownership-and-governance.md
|   |-- data-model-and-indexes.md
|   |-- api-contract.md
|   |-- backend-implementation-plan.md
|   |-- frontend-implementation-plan.md
|   |-- devops-environment-and-seeding.md
|   |-- testing-strategy.md
|   |-- acceptance-criteria.md
|   |-- traceability-matrix.md
|   |-- work-breakdown-structure.md
|   |-- implementation-checklist.md
|   |-- risk-and-issues.md
|   |-- developer-start-guide.md
|   |-- development-readiness-review.md
|   |-- evidence-register.md
|   |-- phase-exit-evidence.md
|   `-- exit-report.md
|-- phase-05/
|-- phase-06/
|-- phase-07/
|   |-- README.md
|   `-- cloud-provider-baseline.md
`-- phase-08/
```

## 3. Phase Catalog

| Folder      | Phase                    | Outcome                                                             | Trạng thái                      |
| ----------- | ------------------------ | ------------------------------------------------------------------- | ------------------------------- |
| `phase-01/` | Project Foundation       | Web/API/MongoDB/Swagger/Docker/CI foundation                        | Completed                       |
| `phase-02/` | Authentication and Users | Registration, login/session, RBAC, user admin, Teacher invitation   | Merged; `39/39` Pass            |
| `phase-03/` | Classroom Management     | Classroom, enrollment, class code/link, roster và enrollment policy | Completed; `45/45` Pass; PR #6 merged |
| `phase-04/` | Learning Content         | Course/module/lesson/deadline/completion/To-do và dashboard v1      | Ready for review; Not Started   |
| `phase-05/` | Assessments and Grading  | Quiz/assignment/submission/grade/feedback                           | Planned                         |
| `phase-06/` | Reporting and Analytics  | To-do/progress/process score/ranking/report                         | Planned                         |
| `phase-07/` | DevOps and Deployment    | Cloud Run, Atlas, GitHub Actions, registry, monitoring, rollback    | Provider accepted; Planned      |
| `phase-08/` | Testing and Release      | System/E2E/UAT/hardening/MVP release                                | Planned                         |

## 4. Trình tự sử dụng

1. Đọc `common/technical-implementation-plan.md` để hiểu toàn bộ roadmap.
2. Đọc `common/coding-standards.md`, `common/development-workflow.md` và `common/definition-of-done.md`.
3. Mở `README.md` trong phase hiện tại để xem document map và trạng thái.
4. Thực hiện task theo work breakdown/checklist của phase.
5. Cập nhật test/evidence/acceptance/risks ngay khi có kết quả.
6. Cập nhật `common/traceability-matrix.md` khi requirement được hiện thực.
7. Không đóng phase khi exit criteria hoặc external blocker chưa được ghi rõ.

## 5. Document Ownership

| Document group           | Owner chính       | Reviewer                |
| ------------------------ | ----------------- | ----------------------- |
| Common standards         | Technical Lead    | Development/QA/DevOps   |
| Scope/plan               | Technical Lead/BA | Product Owner           |
| Web/API/Data design      | Area Lead         | Technical Lead/QA       |
| Docker/CI/Cloud          | DevOps            | Technical Lead/Security |
| Test/acceptance/evidence | QA                | Technical Lead/BA       |
| Risk/exit                | Technical Lead    | Product Owner/QA/DevOps |

## 6. Quy tắc Tài liệu Theo Phase

Mỗi phase khi được lập kế hoạch chi tiết nên có tối thiểu:

- `README.md` và `phase-plan.md`.
- `scope-and-deliverables.md`.
- `work-breakdown-structure.md`.
- Các file thiết kế theo domain/workstream.
- `testing-strategy.md` và `acceptance-criteria.md`.
- `risk-and-issues.md`.
- `implementation-checklist.md` và `evidence-register.md`.
- `exit-report.md`.

Không tạo nhiều file rỗng chỉ để đủ cấu trúc. File được tạo khi có owner, mục đích và thời điểm cập nhật rõ ràng.

## 7. Document Status

| Trạng thái            | Ý nghĩa                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `Draft`               | Đang soạn, chưa dùng làm cam kết                                   |
| `Ready for review`    | Đủ nội dung để review                                              |
| `Baseline`            | Đã thống nhất làm cơ sở thực hiện                                  |
| `Ready for execution` | Có task/dependency/acceptance rõ                                   |
| `In progress`         | Đang triển khai                                                    |
| `Implemented locally` | Source/local evidence đạt; có thể còn external governance evidence |
| `Completed`           | Exit criteria đầy đủ và được phê duyệt                             |
| `Blocked`             | Không thể tiếp tục vì dependency/decision cụ thể                   |
