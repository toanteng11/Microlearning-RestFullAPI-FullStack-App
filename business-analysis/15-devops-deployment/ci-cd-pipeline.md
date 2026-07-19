# CI/CD Pipeline

## Mục Đích

CI/CD Pipeline tự động hóa các bước lặp lại từ commit đến deployment. Pipeline không thay thế Developer/QA review, nhưng nó tạo quality gate nhất quán và bằng chứng để không đưa bản lỗi hoặc không trace được lên Staging/Production.

## Trigger Và Pipeline Loại

| Pipeline | Trigger | Mục tiêu | Có deploy? |
| --- | --- | --- | --- |
| Pull Request / Merge Request validation | Mở/cập nhật PR | Phát hiện lint/test/build/security issue trước merge | Không |
| Main branch build | Merge vào protected main branch | Tạo immutable artifact/image ứng viên | Có thể deploy Staging theo policy |
| Staging deployment | Artifact đã pass/main branch/manual approved | QA/UAT/demo verification | Có, Staging |
| Production release | Release tag/manual approval từ artifact đã verify Staging | Phát hành có kiểm soát | Có, Production |
| Scheduled security/maintenance | Lịch định kỳ | Dependency scan, backup verification, image/report hygiene | Không mặc định |

## Pipeline Mức Cao

```text
Checkout locked source
  -> Validate configuration/schema (no secret output)
  -> Install dependencies deterministically
  -> Lint / type check
  -> Unit / integration / API contract tests
  -> Build frontend + backend
  -> Dependency / secret / image security scan
  -> Build and push one immutable Cloud Run application image
  -> Deploy Staging
  -> Health + version + API/UI smoke tests
  -> QA/UAT / approval
  -> Deploy same artifact to Production
  -> Health + smoke + monitoring verification
  -> Create deployment/release record
```

## Detailed Stages

| Stage | Input | Required checks | Output / failure behavior | Owner |
| --- | --- | --- | --- | --- |
| 1. Checkout | Commit/PR ref | Protected branch/ref policy | Exact revision for traceability | CI |
| 2. Dependency install | Manifest + lock file | Deterministic install; cache safe | Fail if lock/dependency unresolved | CI/Developer |
| 3. Static quality | Source | Lint/type check/format policy | Fail on configured error threshold | Developer |
| 4. Automated tests | Buildable source | Unit; integration/API contract where available | Test report; fail pipeline on Must test failure | Developer/QA |
| 5. Build | Source/config public values only | React static build, backend build và multi-stage production image | Versioned application image | CI |
| 6. Security checks | Source/dependency/image | Secret scan, dependency vulnerability, container scan | Block/triage critical finding per policy | DevOps/Technical Lead |
| 7. Artifact publish | Build pass | Push immutable commit tag/digest vào Google Artifact Registry | Private immutable artifact; no deploy if publish fails | CI/DevOps |
| 8. Staging deploy | Artifact digest + Staging config | Config/secret reference correct, migration review | Deploy record; fail/stop on error | DevOps |
| 9. Verification | Staging runtime | `/health`, version, API/UI/role smoke, monitoring receipt | Mark candidate verified or rollback/forward-fix | QA/DevOps |
| 10. Production approval | Staging evidence | Release scope/known issue/rollback/backups approved | Approval record | Technical Lead/PO |
| 11. Production deploy | Same immutable artifact | Protected environment, controlled migration | Deployment record | DevOps |
| 12. Post-deploy | Production runtime | Health/version/smoke/monitoring | Release complete or incident/recovery | DevOps/QA |

## Minimum Quality Gates

| Gate | Pull Request | Staging | Production |
| --- | --- | --- | --- |
| Lint/type check/build | Must | Artifact already pass | Artifact already pass |
| Unit/integration tests available | Must | Review result | Review result |
| Swagger/API contract update when API changes | Must | API smoke | API compatibility smoke |
| Secret scan | Must | Must | Must |
| Dependency/image scan | Should/Must per risk | Must for release candidate | Must for release |
| Health/version endpoint | N/A | Must | Must |
| Student/Teacher/Admin critical smoke | N/A | Must | Must |
| CORS/HTTPS/SPA fallback | N/A | Must | Must |
| Migration/backup/rollback review | N/A | Must if data change | Must if data change |
| Approval | Code review | QA/UAT policy | Required |

## Smoke Test Contract

Sau deploy, pipeline hoặc operator chạy tối thiểu:

1. Gọi basic `/health`; status phù hợp và không lộ secret.
2. Gọi version endpoint để xác nhận `version`, `commitSha`, `environment` đúng artifact/release.
3. Mở frontend URL; direct refresh route SPA chính không `404`.
4. Kiểm tra CORS/frontend API base URL không lỗi.
5. Chạy representative protected flow bằng test account an toàn: Student Dashboard To-do, Teacher Course Dashboard, Admin role-specific list.
6. Nếu release ảnh hưởng: Teacher Invitation, Classroom join, deadline reset hoặc upload; chạy smoke riêng có audit/cleanup test data.
7. Kiểm tra log/metric/error tracking nhận event sau deploy.

Smoke test mutation phải dùng test data isolated, idempotent hoặc cleanup rõ; không tạo dữ liệu rác/grade sai trong Production.

## Deployment Controls

- Production deploy chỉ từ protected branch/release tag và protected environment có approval.
- CI/CD identity dùng secret/integration scope tối thiểu; không dùng credential cá nhân.
- Pipeline không in `.env`, database URI, token/header, secret value hoặc full request body nhạy cảm.
- Pipeline phải timeout và fail rõ khi deploy/health/smoke không đạt; không chờ vô hạn.
- Concurrency policy tránh hai Production deployment cùng mutate runtime/database; release mới chờ/hủy release cũ theo policy.
- Database migration được review riêng; pipeline không tự destructive migration không backup/compatibility plan.

## Failure Handling

| Failure | Pipeline action | Người xử lý tiếp |
| --- | --- | --- |
| Lint/test/build fail | Stop trước artifact publish/deploy | Developer sửa, tạo run mới. |
| Secret scan finding | Stop/quarantine theo severity policy | DevOps + Technical Lead triage/rotate nếu leak thật. |
| Image scan critical | Block promotion hoặc approved exception documented | Technical Lead/DevOps. |
| Staging deploy/health fail | Mark failed, inspect log/config; rollback if prior stable impacted | DevOps + Developer. |
| Smoke fail | Không promote Production; open defect/incident, rollback/forward fix Staging | QA + DevOps + Developer. |
| Production post-deploy fail | Stop rollout; invoke rollback/incident runbook | DevOps + Technical Lead. |

## Pipeline Evidence Và Retention

Mỗi release candidate cần lưu hoặc link được các bằng chứng: commit SHA, PR/code review, test report, scan result, artifact tag/digest, environment deploy time, config version/reference (không secret), health/version/smoke result, approval, release note và rollback/incident nếu có.

## Accepted Provider Pipeline

GitHub Actions là CI/CD provider đã chọn. Workflow mục tiêu gồm:

1. Pull Request chạy required checks hiện có và không có quyền deploy.
2. Merge vào `main` build một lần, scan và push `microlearning-app:sha-<commit>` vào Google Artifact Registry.
3. Staging job xác thực Google Cloud bằng Workload Identity Federation, deploy đúng image digest lên Cloud Run và chạy health/version/API/UI smoke.
4. Production job chỉ nhận cùng digest đã pass Staging, dùng GitHub protected environment và approval bắt buộc.
5. Deployment record lưu workflow run, commit SHA, image digest, Cloud Run revision, smoke result và approver.

Không lưu service-account JSON key, Atlas URI hoặc JWT secret trong workflow YAML/log. Nếu phải dùng credential dài hạn tạm thời, cần exception có owner, expiry và kế hoạch chuyển sang identity ngắn hạn.

## Liên Kết

- Image lifecycle: `container-registry-image-management.md`.
- Environment/secret: `deployment-environment-matrix.md`, `configuration-secret-management.md`.
- Release/rollback: `release-management.md`, `rollback-strategy.md`.
- NFR gate: `../13-non-functional-requirements/nfr-quality-gates.md`.
