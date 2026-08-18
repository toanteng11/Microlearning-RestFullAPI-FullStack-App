# Phase 07 Part 09-11 Evidence

## 1. Decision

| Field | Value |
| --- | --- |
| Scope | Part 09 Build/Publish, Part 10 Staging CD, Part 11 Cloud Smoke/E2E |
| Review date | `2026-08-17` |
| Source status | `LOCAL_PASS_REMOTE_PENDING` |
| Cloud status | `NOT_RUN` |
| Production impact | None; Production deployment remains blocked until Phase 08 |

Source code đủ điều kiện mở PR review. Tài liệu này không thay thế GitHub Actions, GCP, Artifact Registry,
Cloud Run hoặc Atlas evidence chạy thật.

## 2. Source Inventory

| Area | Files |
| --- | --- |
| Build/publish | `.github/workflows/build-publish.yml`, `scripts/generate-release-manifest.mjs`, `scripts/validate-release-lineage.mjs` |
| Deploy Staging | `.github/workflows/deploy-staging.yml`, `scripts/create-deployment-record.mjs`, `scripts/validate-deployment-record.mjs` |
| Cloud verification | `.github/workflows/cloud-e2e.yml`, `scripts/verify-cloud-security.mjs`, `tests/e2e/phase-07-cloud-roles.spec.ts` |
| Stable decision | `scripts/promote-stable-deployment.mjs`, `scripts/scan-e2e-artifacts.mjs` |
| Shared contracts | `scripts/lib/cd-contract.mjs`, `scripts/lib/release-contract.mjs`, `infrastructure/release/release-manifest.schema.json` |
| Test/config | `scripts/test-cd-contract.mjs`, `playwright.cloud.config.ts`, `package.json` |
| Least privilege | `infrastructure/terraform/environments/staging/main.tf`, `outputs.tf` |

## 3. Trust And Supply-Chain Controls

1. source CI/build/deploy workflow run phải `completed/success`, đúng workflow name, cùng repository,
   `head_branch=main` và full SHA;
2. checkout thực hiện theo exact validated SHA, không dùng untrusted PR head;
3. build publish dùng immutable commit tag, registry release chỉ truyền bằng digest;
4. release manifest lưu CI/build run IDs và URLs, checksums, Trivy scan và CycloneDX SBOM;
5. deploy download artifact theo exact upstream run ID và reject provenance mismatch;
6. WIF cấp short-lived token; source không có service-account JSON key;
7. Terraform apply dùng exact reviewed plan, exact secret versions và concurrency lock;
8. candidate chỉ thành stable sau khi cloud security report, four-role report cùng khớp commit/digest/revision;
9. artifact scan phải có `0` credential finding trước upload.

## 4. Local Verification Result

| Command | Result |
| --- | --- |
| `npm run release:contract:test` | Pass: release contract và CD contract |
| `npm run typecheck` | Pass: API và Web |
| `npm run lint` | Pass |
| `npm run format:check` | Pass |
| `npm run terraform:check` | Pass: init/validate/policy/release/runtime contracts |
| `npm run test:e2e:cloud -- --list` | Pass: nhận đủ 4 tests, 1 project `cloud-chromium` |
| `npm run check` | Pass: lint, negative gate, format, typecheck, API/Web tests và production build |
| `npm run container:build -- microlearning-platform:phase-07-local` | Pass: image ID `sha256:5af74ca72bcc4b6c663261e7a6b11d71f09db02732042da2d486066e037fe52d` |
| `npm run container:verify -- microlearning-platform:phase-07-local` | Pass: routes, browser smoke, non-root, content audit, Atlas boundary, graceful shutdown |
| `npm run container:scan -- microlearning-platform:phase-07-local ...local.json` | Pass: `0` Critical/High findings |
| `npm run sbom:production -- microlearning-platform:phase-07-local ...local.cdx.json` | Pass: CycloneDX, `167` components |

Không chạy Cloud browser assertions ở local vì suite yêu cầu exact deployment record, HTTPS Staging URL,
dedicated WIF và synthetic password secret.

## 5. Workflow Chain

```text
Continuous Integration (successful protected main push)
  -> Build And Publish
  -> Deploy Staging
  -> Cloud Smoke And E2E
  -> stable-deployment-record.json
```

Manual recovery không nhận tag hoặc arbitrary commit. Operator phải cung cấp exact successful upstream run
ID và confirmation phrase; mọi lineage validation vẫn chạy lại.

## 6. Required Repository Variables

| Variable | Expected non-secret value/source |
| --- | --- |
| `GCP_PROJECT_ID` | `microlearning-platform-502716` |
| `CLOUD_RUN_SERVICE` | `microlearning-staging` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER_STAGING` | Terraform `workload_identity_provider` output |
| `GCP_DEPLOY_SERVICE_ACCOUNT_STAGING` | `ml-github-staging@microlearning-platform-502716.iam.gserviceaccount.com` |
| `GCP_E2E_WORKLOAD_IDENTITY_PROVIDER_STAGING` | Terraform `e2e_workload_identity_provider` output |
| `GCP_E2E_SERVICE_ACCOUNT_STAGING` | `ml-e2e-staging@microlearning-platform-502716.iam.gserviceaccount.com` |
| `GCP_SECRET_VERSION_MONGODB_URI_STAGING` | exact enabled numeric version |
| `GCP_SECRET_VERSION_ACCESS_TOKEN_STAGING` | exact enabled numeric version |
| `GCP_SECRET_VERSION_AUTH_IDENTITY_PEPPER_STAGING` | exact enabled numeric version |
| `GCP_SECRET_VERSION_CLASSROOM_CODE_PEPPER_STAGING` | exact enabled numeric version |
| `GCP_SECRET_VERSION_SEED_DEMO_PASSWORD_STAGING` | exact enabled numeric version |

Các giá trị trên là metadata/reference, không chứa secret payload. Không tạo GitHub secret chứa Mongo URI,
password hoặc service-account key.

## 7. Remote Evidence Still Required

- protected-main CI URL và exact commit;
- `Build And Publish` URL, Artifact Registry digest và release candidate artifact;
- `Deploy Staging` URL, Terraform policy report, seed execution, smoke report và candidate record;
- `Cloud Smoke And E2E` URL, JUnit/HTML, security/role/redaction reports và stable record;
- negative recovery input rejection;
- rollback rehearsal ở Part 14;
- update `P07-EV-019..025`, acceptance/test matrices và parent PR URLs.

Không chuyển Part 09-11 sang `DONE` trước khi toàn bộ evidence tương ứng được lưu và redaction review Pass.
