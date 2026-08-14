# Phase 07 Environment Resource Matrix

## 1. Environment Matrix

| Resource/config | Local | CI | Staging | Production |
| --- | --- | --- | --- | --- |
| Web/API topology | Vite `5173` + API `4000` | Compose Web/API | One Cloud Run origin | One Cloud Run origin |
| Database | Mongo replica set container | Ephemeral replica set | Atlas Free/synthetic dedicated DB | Paid/approved Atlas target |
| Runtime URL | HTTP localhost | HTTP runner | Managed HTTPS `run.app` | Managed/custom HTTPS |
| Secret | Local `.env`, ignored | Generated masked values | Secret Manager Staging | Secret Manager Production |
| Artifact | Local image | CI image validation | GAR exact digest | Same Staging-approved digest |
| Deployment | Manual local | None | Main CI -> automatic CD | Protected manual promotion |
| Data | Developer synthetic | Ephemeral fixtures | Synthetic demo only | Approved UAT/Production policy |
| Scale | Compose | Runner | min 0/max 2 | bounded after capacity approval |
| Monitoring | Console/logs | CI logs | Cloud Logging/Monitoring | Production alert/SLO policy |
| Backup | Reset/seed | None | Synthetic dump/restore to private short-lived GCS bucket | Native/approved backup required |

## 2. GCP Resource Baseline

| Resource | Shared/Staging name | Production direction |
| --- | --- | --- |
| Project | `microlearning-platform-502716` | Same project for portfolio unless separate project approved |
| Region | `asia-southeast1` | Same region unless ADR changes |
| Artifact Registry | `microlearning` | Shared immutable repository |
| Image | `microlearning-app` | Same repository/digest |
| Cloud Run | `microlearning-staging` | `microlearning-production` |
| Cloud Run seed job | `microlearning-staging-seed` | Không provision mặc định; P08 quyết định |
| Runtime SA | `ml-runtime-staging` | `ml-runtime-production` |
| Seed Job SA | `ml-seed-staging` | Không provision mặc định |
| Cloud E2E SA | `ml-e2e-staging` | Không dùng Production; P08 tạo identity riêng nếu cần |
| Deploy SA | `ml-github-staging` | `ml-github-production` |
| WIF pool/provider | `github-pool` / `github-provider` | Shared pool; environment-specific principal binding |
| Secret prefix | `ml-staging-*` | `ml-production-*` |
| Terraform state prefix | `phase-07/staging` | `phase-07/production` |
| Logical backup bucket | `microlearning-staging-backups-<project-number>` | Native Atlas/approved P08 design; no reuse by default |
| Monitoring display prefix | `Microlearning Staging` | `Microlearning Production` |

Project ID, service-account email, WIF provider name và service URL là identifiers, không phải secret;
chúng được lưu dưới GitHub Environment Variables. Secret value không được lưu dưới Variables.

## 3. GitHub Environment Contract

| Variable | Staging | Production | Secret? |
| --- | --- | --- | --- |
| `GCP_PROJECT_ID` | Project ID | Project ID | No |
| `GCP_REGION` | `asia-southeast1` | `asia-southeast1` | No |
| `GAR_REPOSITORY` | `microlearning` | `microlearning` | No |
| `CLOUD_RUN_SERVICE` | `microlearning-staging` | `microlearning-production` | No |
| `GCP_WIF_PROVIDER` | Fully qualified provider | Environment-approved provider | No |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | Staging deploy SA email | Production deploy SA email | No |
| `TF_STATE_PREFIX` | `phase-07/staging` | `phase-07/production` | No |
| GCP JSON key | Forbidden | Forbidden | N/A |
| Atlas URI/JWT pepper | Not stored in GitHub if runtime uses Secret Manager | Same | Yes, but source is Secret Manager |

## 4. Runtime Configuration Categories

| Category | Examples | Source |
| --- | --- | --- |
| Artifact identity | `APP_VERSION`, `COMMIT_SHA`, `BUILD_TIME` | CD workflow/Terraform |
| Runtime | `APP_ENV`, `PORT`, `LOG_LEVEL`, proxy/pool limits | Terraform non-secret variables |
| URLs | `PUBLIC_WEB_URL`, `ALLOWED_ORIGINS` | Terraform-computed deterministic Cloud Run origin; verify after apply |
| Auth/session | signing material, identity pepper | Secret Manager |
| Database | `MONGODB_URI` | Secret Manager |
| Synthetic seed | protected `SEED_DEMO_PASSWORD` + same runtime config | Secret Manager; private Cloud Run Job only |
| Functional limits | Classroom/content/assessment/reporting variables | Environment tfvars, explicit values |
| Feature flags | upload/export/analytics/trend/outcomes/weighted score | Environment tfvars + owner |

## 5. Staging Baseline Values

- `APP_ENV=staging`.
- `PORT=8080` supplied by Cloud Run; code must not override it incorrectly.
- `REFRESH_COOKIE_SECURE=true`.
- `PUBLIC_WEB_URL` and `ALLOWED_ORIGINS` equal exact Cloud Run HTTPS origin.
- `BOOTSTRAP_ADMIN_ENABLED=false` after controlled bootstrap.
- `GCS_UPLOADS_ENABLED=false`, `ASSESSMENT_FILE_UPLOAD_ENABLED=false`.
- Reporting feature flags follow Phase 06 accepted defaults; experimental flags remain false unless
  cloud test explicitly includes them.
- `LOG_LEVEL=info`; debug/trace forbidden for steady Staging.
- Mongo pool/timeouts explicit and bounded.

Với service name đủ ngắn, Terraform lấy project number bằng data source và tính URL theo format Cloud Run
deterministic trước first deploy. Sau apply, workflow so sánh output/service URL thật với giá trị cấu hình;
không được tiếp tục smoke nếu mismatch.

## 6. Separation Rules

- Không dùng cùng secret version/database user/database name giữa Staging và Production.
- Production GitHub environment chỉ nhận manual deploy từ protected `main`. Solo mode dùng confirmation
  phrase, exact digest và Go/No-Go record; independent reviewer là `APPROVED_NA`.
- Staging synthetic accounts không được dùng lại password cho Production.
- Production config không được copy từ screenshot hoặc shell history.
- Terraform plan/apply phải chọn environment rõ; thiếu environment thì fail closed.
