# Phase 01 - Project Foundation

## 1. Mục tiêu thư mục

Thư mục này là hồ sơ triển khai đầy đủ của `P01 - Project Foundation`. Mỗi file chỉ sở hữu một nhóm quyết định hoặc bằng chứng, giúp Development, QA và DevOps review độc lập mà không phải chỉnh một tài liệu tổng hợp quá lớn.

## 2. Trạng thái

| Thuộc tính | Giá trị |
| --- | --- |
| Phase ID | `P01` |
| Tên | `Project Foundation` |
| Implementation | Completed |
| Quality gates | Pass, gồm coverage threshold và negative lint gate |
| Docker integration | Pass |
| External CI | Pass trên Pull Request #1; ba required checks và branch protection đã được xác nhận |
| Phase status | `Completed` ngày `2026-07-13` |
| Phase tiếp theo | `P02 - Authentication and Users` |

## 3. Danh mục tài liệu

### Điều phối và phạm vi

| File | Nội dung | Owner đề xuất | Trạng thái |
| --- | --- | --- | --- |
| `phase-plan.md` | Mục tiêu, dependency, milestone và governance | Technical Lead | Baseline |
| `scope-and-deliverables.md` | In scope, out of scope và deliverables | Technical Lead/BA | Completed |
| `work-breakdown-structure.md` | Epic, task, dependency và output | Technical Lead | Completed |
| `implementation-checklist.md` | Checklist thực hiện và external action | Technical Lead/QA | Completed |

### Thiết kế kỹ thuật

| File | Nội dung | Owner đề xuất | Trạng thái |
| --- | --- | --- | --- |
| `architecture-overview.md` | Runtime flow, boundary và extension rule | Technical Lead | Implemented |
| `technical-decisions.md` | ADR-001 đến ADR-008 | Technical Lead | Accepted |
| `repository-structure.md` | Monorepo layout, ownership và dependency direction | Technical Lead | Implemented |
| `environment-and-security.md` | Environment contract và security baseline | Backend/DevOps | Implemented |

### Application foundation

| File | Nội dung | Owner đề xuất | Trạng thái |
| --- | --- | --- | --- |
| `frontend-foundation.md` | ReactJS, Vite, router, API client và UI state | Frontend | Implemented |
| `backend-foundation.md` | Express app/server, middleware, logging và errors | Backend | Implemented |
| `database-foundation.md` | MongoDB/Mongoose lifecycle và readiness | Backend/DevOps | Implemented |
| `api-documentation.md` | OpenAPI/Swagger contract và exposure | Backend/QA | Implemented |

### DevOps và chất lượng

| File | Nội dung | Owner đề xuất | Trạng thái |
| --- | --- | --- | --- |
| `docker-local-environment.md` | Dockerfiles, Compose, health và local operations | DevOps | Implemented |
| `ci-quality-gates.md` | CI jobs, branch protection và negative gate | DevOps/Technical Lead | Implemented |
| `testing-strategy.md` | Test level, cases, command và evidence | QA/Developers | Pass |
| `acceptance-criteria.md` | Acceptance result P01-AC-001..020 | QA/Technical Lead | 20/20 Pass |
| `risk-and-issues.md` | Risk, issue, mitigation và residual risk | Technical Lead/DevOps | Reviewed |
| `evidence-register.md` | Danh mục bằng chứng kiểm chứng | QA/DevOps | Updated |
| `phase-exit-evidence.md` | Evidence remote CI, clean clone, runtime và browser | QA/DevOps | Completed |
| `exit-report.md` | Kết luận phase và closed actions | Technical Lead/QA | Completed |
| `phase-02-readiness.md` | Điều kiện và quyết định trước Authentication | Technical Lead/Security | Ready for planning |

## 4. Trình tự review

1. Đọc `phase-plan.md` và `scope-and-deliverables.md`.
2. Review `technical-decisions.md`, `architecture-overview.md` và `repository-structure.md`.
3. Review từng application/DevOps document theo vai trò.
4. Đối chiếu `testing-strategy.md`, `acceptance-criteria.md` và `evidence-register.md`.
5. Xác nhận phase exit bằng cách đối chiếu `phase-exit-evidence.md` với `exit-report.md`.

## 5. Nguồn chuẩn

- BA baseline: `../../../business-analysis/`.
- Common implementation standards: `../common/`.
- Source code: `../../../apps/`.
- Infrastructure: `../../../infrastructure/` và `../../../docker-compose.yml`.
