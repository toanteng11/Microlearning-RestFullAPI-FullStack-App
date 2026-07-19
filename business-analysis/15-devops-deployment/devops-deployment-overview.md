# DevOps And Deployment Overview

## Mục Đích

Tài liệu này là điểm bắt đầu cho mục `15-devops-deployment`. Nó chuyển kiến trúc ReactJS, Node.js/ExpressJS, MongoDB, Object Storage và Cloud runtime thành quy trình build, kiểm tra, triển khai, giám sát và phục hồi có thể lặp lại.

DevOps trong dự án này không chỉ là “đưa website lên Cloud”. DevOps là cách Development, QA và DevOps cùng chịu trách nhiệm để một thay đổi từ source code đến môi trường chạy thật có thể được:

1. Build giống nhau trên máy Developer và CI.
2. Kiểm tra chất lượng, bảo mật và API contract trước khi deploy.
3. Đóng gói/version hóa để biết chính xác bản nào đang chạy.
4. Cấu hình bằng environment/secret thay vì sửa source code theo từng môi trường.
5. Kiểm tra health, log, metric sau deploy.
6. Rollback hoặc khôi phục dữ liệu an toàn khi có sự cố.

## Phạm Vi Mục 15

| Trong phạm vi | Ngoài phạm vi MVP mặc định |
| --- | --- |
| Docker/Compose, CI/CD, image registry, environment/secret, Cloud runtime, HTTPS/domain, monitoring/logging, backup/restore, release/rollback runbook | Kubernetes, service mesh, multi-region active-active, tự xây CI/CD platform, tự vận hành mail server, SRE 24/7 SLA enterprise |
| Local, CI/Test, Staging, Production direction; GitHub Actions, Cloud Run, Atlas, Artifact Registry, Secret Manager và Cloud Monitoring baseline | Firebase, Kubernetes, multi-region và vendor khác nếu không có Change Control |
| Một Cloud Run application image chứa React static build, Node.js API và Swagger; MongoDB Atlas; private Object Storage khi được duyệt | Lưu file production trên local disk của container hoặc binary trong MongoDB |

## Chu Trình DevOps Của Dự Án

```text
Plan/Requirement
  -> Code + Review
  -> Local Quality Gate
  -> CI: lint/test/build/scan
  -> Versioned artifact/image
  -> Deploy Staging
  -> Health + API/UI smoke test + QA/UAT
  -> Approval
  -> Deploy Production
  -> Monitor + Release record
  -> Rollback / Forward-fix / Restore when needed
```

| Giai đoạn | Đầu vào | Đầu ra | Owner chính |
| --- | --- | --- | --- |
| Plan | Requirement, architecture, acceptance criteria | Implementation/test/deployment task rõ | Product Owner, BA, Technical Lead |
| Develop | Source code | Code reviewable, local build/test result | Frontend/Backend Developer |
| Continuous Integration | Commit/merge request | Test result, build artifact, image scan result | CI automation, Developer |
| Artifact management | Build pass | Immutable artifact/image tag trace tới commit | DevOps |
| Staging deployment | Approved artifact + Staging config | Runtime release, health/smoke evidence | DevOps, QA |
| Production release | Staging evidence + approval | Production release record | DevOps, Product Owner/Technical Lead |
| Operate | Logs, metrics, alerts, user report | Incident/recovery/continuous improvement | DevOps, Developer, QA |

## Nguyên Tắc Bắt Buộc

| ID | Nguyên tắc | Áp dụng |
| --- | --- | --- |
| DO-01 | Build once, promote the same artifact | Không build lại source khác nhau cho Staging và Production; dùng artifact/image đã versioned. |
| DO-02 | Environment parity | Local/CI/Staging/Production có thể khác resource nhưng app config, route, health và deployment pattern phải gần nhau. |
| DO-03 | Configuration outside artifact | API URL, database URI, CORS, token secret, storage config lấy từ environment/secret/runtime identity. |
| DO-04 | Immutable release identity | Mỗi release có version, commit SHA, image/artifact tag, environment, time và deployer/pipeline run. |
| DO-05 | Security by default | Không commit secret; least privilege; HTTPS; scan dependency/image; protect production deploy. |
| DO-06 | Verify after deploy | Không coi deploy là xong cho tới khi health, version, API/UI smoke test và monitoring check đạt. |
| DO-07 | Recover safely | Có rollback path cho artifact, kế hoạch forward-fix/migration và backup/restore runbook cho data. |
| DO-08 | Automation with evidence | Tự động hóa bước lặp lại; lưu log/result để QA/DevOps/PO review. |

## Bản Đồ Tài Liệu Mục 15

| Tài liệu | Dùng để trả lời |
| --- | --- |
| `devops-deployment-overview.md` | Mục 15 gồm gì và các team phối hợp thế nào? |
| `devops-foundations.md` | Docker, CI/CD, registry, Cloud, monitoring là gì trong chính dự án này? |
| `docker-strategy.md` | Build/run container Frontend, Backend và Local MongoDB như thế nào? |
| `deployment-environment-matrix.md` | Local/CI/Staging/Production khác nhau ở đâu và dùng dữ liệu nào? |
| `configuration-secret-management.md` | Config, secret, access và rotation được kiểm soát ra sao? |
| `container-registry-image-management.md` | Image tagging, scan, retention và promotion artifact thế nào? |
| `ci-cd-pipeline.md` | Pipeline quality gate, trigger, approval, deploy và smoke test thế nào? |
| `infrastructure-overview.md` | Hạ tầng logic gồm các component, network/boundary và ownership nào? |
| `infrastructure-as-code.md` | Infrastructure được version/review/áp dụng thế nào khi dùng IaC? |
| `cloud-deployment.md` | Tiêu chí chọn/triển khai Cloud, HTTPS, domain, runtime và managed services. |
| `observability-operations.md` | Log, metrics, alert, incident triage và operational ownership. |
| `backup-restore-disaster-recovery.md` | Backup, restore, RPO/RTO, data recovery được thực hiện thế nào? |
| `release-management.md` | Release readiness, approval, release note và post-release monitoring. |
| `rollback-strategy.md` | Khi nào rollback, rollback application/database/frontend thế nào? |
| `deployment-runbook.md` | Checklist thao tác deploy/recover có thể thực thi bởi DevOps. |

## RACI Rút Gọn

| Hoạt động | Developer | QA | DevOps | Technical Lead | Product Owner |
| --- | --- | --- | --- | --- | --- |
| Dockerfile/app readiness | R | C | C | A | I |
| CI test/build quality | R | C | R | A | I |
| Secret/infrastructure/deploy permission | I | I | R | A | I |
| Staging smoke/UAT evidence | C | R | R | A | I |
| Production release approval | I | C | R | A | A/C |
| Incident/rollback | C | C | R | A | I |
| Backup/restore rehearsal | C | C | R | A | I |

`R`: thực hiện; `A`: chịu trách nhiệm/phê duyệt; `C`: tham vấn; `I`: được thông báo.

## Điều Kiện Hoàn Thành Mục 15

- Developer có thể chạy project Local bằng hướng dẫn/Docker Compose không dùng production secret.
- CI tạo được artifact/image versioned, trace tới commit và fail khi quality gate Must không đạt.
- Staging/Production có environment config tách biệt, secret được bảo vệ, HTTPS/health/smoke test rõ.
- Có owner cho log/monitoring/backup/rollback; không phụ thuộc trí nhớ của một người.
- Không có deploy/database change rủi ro cao mà thiếu release record và recovery plan.

## Liên Kết

- Runtime architecture: `../14-solution-architecture/deployment-runtime-architecture.md`.
- Security architecture: `../14-solution-architecture/security-architecture.md`.
- NFR quality gates: `../13-non-functional-requirements/nfr-quality-gates.md`.
- API health: `../11-api-requirements/api-health-devops.md`.
