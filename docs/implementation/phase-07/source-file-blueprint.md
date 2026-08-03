# Source File Blueprint

## 1. Mục tiêu

Chỉ ra nơi dự kiến thay đổi để Dev/DevOps triển khai Phase 07 theo đúng ownership. Tên file cuối cùng có thể
điều chỉnh theo codebase, nhưng thay đổi boundary phải được ghi trong PR.

## 2. Application runtime

| Path dự kiến | Trách nhiệm |
| --- | --- |
| `apps/api/src/shared/config/environment.ts` | thêm/khóa Production env, digest, proxy và Mongo pool contract |
| `apps/api/src/app.ts` | route ordering, static mount, SPA fallback |
| `apps/api/src/server.ts` | startup/readiness/shutdown metadata |
| `apps/api/src/scripts/seed-demo.ts` | compiled non-interactive Staging Job mode, guarded password input |
| `apps/api/src/modules/system/system.types.ts` và `system.routes.ts` | image digest/version response contract |
| `apps/api/src/shared/database/mongodb.ts` | pool/timeout/status hooks |
| `apps/api/src/shared/logging/logger.ts` | Cloud structured fields/redaction |
| `apps/web/src/shared/config/public-config.ts` | optional same-origin API origin, local absolute override |
| `apps/web/src/shared/api/api-client.ts` và `system-api.ts` | preserve `/api/v1` path on relative origin |
| `apps/web/vite.config.ts` | production build/base configuration |

Không tạo Cloud SDK dependency trong business/domain modules.

## 3. Container/build

| Path dự kiến | Trách nhiệm |
| --- | --- |
| `Dockerfile` | single multi-stage Production image |
| `.dockerignore` | loại secret/dev artifacts |
| `docker-compose.production.yml` nếu cần | local Production-like smoke |
| `scripts/verify-production-image.mjs` | non-root/routes/version/secret checks |
| `scripts/verify-runtime-config-contract.mjs` | compare runtime explicit fields with Terraform Staging mapping |
| `scripts/generate-release-manifest.mjs` | digest/commit/build metadata |
| `package.json` | scripts build/smoke/scan orchestration |

Không xóa Dockerfiles local hiện hữu nếu vẫn phục vụ developer workflow; ghi rõ vai trò từng file.

## 4. Infrastructure

```text
infrastructure/terraform/
  bootstrap/
  modules/
    artifact-registry/
    cloud-run-service/
    iam/
    monitoring/
    secret-containers/
    workload-identity/
  environments/
    staging/
    production/
```

Các file `.tfvars` thật, state, plan binary và provider cache phải nằm trong `.gitignore`.

## 5. GitHub Actions

| Path | Chức năng |
| --- | --- |
| `.github/workflows/ci.yml` | giữ required CI, bổ sung container checks nếu phù hợp |
| `.github/workflows/infrastructure-plan.yml` | Terraform/IaC PR gate |
| `.github/workflows/release-staging.yml` | trusted main-CI-success orchestration |
| `.github/workflows/build-publish.yml` | image/SBOM/scan/digest |
| `.github/workflows/deploy-staging.yml` | apply + smoke + rollback |
| `.github/workflows/promote-production.yml` | protected Phase 08 workflow |
| `.github/workflows/drift-check.yml` | scheduled/manual plan |
| `.github/actions/**` nếu cần | composite action nhỏ, pinned inputs |

Không duplicate shell logic phức tạp giữa workflows; đưa logic kiểm thử/phát hành có thể test vào `scripts/`.

## 6. Cloud tests

```text
tests/
  cloud/
    smoke/
      health.spec.ts
      version.spec.ts
      routing.spec.ts
      security-headers.spec.ts
    api/
      role-boundaries.spec.ts
      critical-journeys.spec.ts
    e2e/
      student-cloud.spec.ts
      teacher-cloud.spec.ts
      admin-cloud.spec.ts
      super-admin-cloud.spec.ts
    operations/
      logging-redaction.spec.ts
      rollback-verification.spec.ts
```

Nếu repository đang đặt Playwright tests ở vị trí khác, ưu tiên pattern hiện hữu và giữ cùng logical coverage.

## 7. Operational artifacts

```text
docs/operations/
  staging-deploy.md
  production-promotion.md
  rollback.md
  incident-response.md
  backup-restore.md

artifacts/phase-07/              # ignored hoặc generated trong CI
  release-manifest.json
  deployment-record.json
  smoke-results/
  terraform-plan-summary.txt
  sbom/
  scan/
```

Tài liệu implementation là design source; `docs/operations/` là runbook ngắn dùng khi vận hành.

## 8. Configuration files

- `.env.example`: placeholders và mô tả, không secret.
- `.gitignore`: state, tfvars, plan, credentials, reports nhạy cảm.
- `.gitleaks.toml`: chỉ thêm allowlist tối thiểu có lý do.
- `.trivyignore` hoặc scanner exception: finding ID + expiry, không blanket ignore.
- `CODEOWNERS` nếu được áp dụng: cloud/IAM/workflow paths cần review phù hợp.

## 9. Ownership rules

- Runtime routing thay đổi cần API + Web test.
- IAM/WIF/Terraform cần DevOps/security review.
- Atlas schema/index không thay âm thầm trong deployment PR.
- Workflow required-check name không đổi nếu chưa cập nhật branch rules.
- Mỗi PR cập nhật traceability, tests và evidence placeholder phù hợp.
