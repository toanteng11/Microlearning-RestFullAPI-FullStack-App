# Phase 07 Architecture And Deployment Topology

## 1. Logical Topology

```text
User Browser
  |
  | HTTPS, same origin, secure HttpOnly refresh cookie
  v
Cloud Run service: microlearning-staging
  |-- /assets/*                 -> immutable React assets
  |-- /                         -> React index.html
  |-- /login, /courses/...      -> SPA fallback
  |-- /api/v1/*                 -> Express REST API
  |-- /api-docs                 -> Swagger UI
  |-- /api/v1/openapi.json      -> OpenAPI JSON
  |-- /health                   -> process liveness
  |-- /ready                    -> Mongo dependency readiness
  |-- /api/v1/system/version    -> release identity
  |-- stdout/stderr JSON        -> Cloud Logging
  +-- TLS mongodb+srv           -> MongoDB Atlas Staging DB

Cloud Run job: microlearning-staging-seed
  |-- private, on-demand only
  |-- same release image digest
  |-- Secret Manager references via dedicated seed identity
  +-- idempotent synthetic seed -> MongoDB Atlas Staging DB

GitHub Actions
  |-- required CI
  |-- OIDC -> Google WIF -> deploy service account
  |-- build/scan/SBOM -> Artifact Registry
  |-- Terraform plan/apply exact image digest
  +-- HTTPS smoke -> Cloud Run

Cloud Monitoring
  |-- Cloud Run metrics/log-based metrics
  |-- uptime check /health
  +-- alert policies -> configured notification target
```

## 2. Trust Boundaries

| Boundary | Input | Control |
| --- | --- | --- |
| Public Internet -> Cloud Run | HTTP request/cookie/body | HTTPS, Helmet, CORS exact origin, rate limit, validation |
| GitHub -> Google Cloud | OIDC token | WIF condition, environment protection, short-lived token |
| Cloud Run -> Secret Manager | Secret reference | Dedicated runtime SA + per-secret accessor |
| Cloud Run -> Atlas | TLS DB connection | Dedicated DB user, DB-scoped role, network policy, bounded pool |
| Terraform -> GCP | Resource changes | Protected workflow, reviewed plan, remote state |
| Operator -> provider consoles | Manual bootstrap/incident | MFA, least privilege, evidence, reconciliation to code |

Cloud Run application invoker là public có chủ đích để người dùng mở Web/login. Điều này không thay thế
authentication: mọi API/private screen vẫn phải qua session, RBAC và resource-ownership controls của ứng dụng.

## 3. Runtime Request Flow

1. Cloud Run terminates TLS và forwards request to container `PORT=8080`.
2. Express derives request ID, applies safe proxy policy, logging/security/CORS/body limits.
3. API/Swagger/health routes are matched before static Web middleware.
4. Hashed asset requests receive immutable cache header.
5. Known SPA route gets `index.html` with `no-store`/`no-cache` policy.
6. Unknown `/api/*` returns structured API `404`, never React HTML.
7. API accesses Atlas through bounded Mongoose pool.
8. Response log emits route/status/latency/version/requestId without secret/PII.

## 4. Deployment Flow

1. PR CI validates code, OpenAPI, integration, E2E, dependency và secret scan.
2. Main CI Success is authoritative source gate.
3. Publish workflow checks out exact successful SHA.
4. Image is built once, scanned, assigned commit tag and pushed.
5. Registry digest is captured in deployment manifest.
6. Terraform plan receives exact digest and reviewed environment variables/secret IDs.
7. Terraform apply creates a new Cloud Run revision.
8. Startup probe waits for Atlas readiness; no traffic is considered healthy before startup passes.
9. Smoke validates release identity and actor flows.
10. Successful deployment record stores workflow/commit/digest/revision/URL/smoke result.

Seed Job được chạy sau first deploy hoặc khi test dataset cần khởi tạo lại có kiểm soát; không chạy tự động
mỗi revision và không tồn tại như public endpoint.

## 5. Failure Containment

| Failure | Containment |
| --- | --- |
| Build/test/scan fail | Không push/promote artifact |
| WIF auth fail | Không fallback sang JSON key; repair principal/IAM |
| Terraform plan destructive | Stop and require explicit change review |
| Cloud Run startup/readiness fail | Revision không được coi là accepted; inspect config/Atlas/log |
| Smoke fail | Staging deployment marked failed; no Production promotion |
| Elevated 5xx after deploy | Shift traffic to prior stable revision |
| Data migration concern | Stop deploy; use backup/forward-fix procedure, không blind restore |
| Budget/quota anomaly | Stop nonessential deploy/job, contain max scale and inspect usage |

## 6. Availability And Cost Trade-off

Staging uses scale-to-zero. Cold start is accepted for demo and measured as operational evidence, not
counted as always-on SLA. Production availability, minimum instances, static egress and paid Atlas
tier require Phase 08 cost/RPO/RTO approval.
