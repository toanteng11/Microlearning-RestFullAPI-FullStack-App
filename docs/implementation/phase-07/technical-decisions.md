# Phase 07 Technical Decisions

## 1. Decision Register

| ID | Decision | Status |
| --- | --- | --- |
| P07-TD-001 | Terraform `>=1.9,<2.0`, Google provider pinned/locked | Proposed For Gate A |
| P07-TD-002 | GCS remote state, versioning, public access prevention, environment prefix | Proposed For Gate A |
| P07-TD-003 | Terraform owns Cloud Run config and exact `image_ref`; CD supplies digest | Proposed For Gate A |
| P07-TD-004 | Secret resources/reference in Terraform; secret values added outside state | Accepted Baseline |
| P07-TD-005 | One Artifact Registry repo `microlearning`, image `microlearning-app` | Proposed For Gate A |
| P07-TD-006 | Staging service `microlearning-staging`; Production `microlearning-production` | Accepted Baseline |
| P07-TD-007 | Cloud Run Staging: 1 vCPU, 512Mi, concurrency 20, min 0, max 2 | Proposed/measure |
| P07-TD-008 | Startup probe `/ready`; liveness `/health`; readiness probe only after stable support review | Accepted Baseline |
| P07-TD-009 | Cloud API base URL relative; Local absolute URL remains supported | Accepted Baseline |
| P07-TD-010 | Express serves Web dist; API routes registered before SPA fallback | Accepted Baseline |
| P07-TD-011 | WIF conditions use immutable GitHub repository/owner identity where available | Accepted Baseline |
| P07-TD-012 | Separate runtime and deploy service accounts per environment | Accepted Baseline |
| P07-TD-013 | Staging Free Atlas uses dedicated DB/user and synthetic data only | Accepted With Waiver |
| P07-TD-014 | Mongoose pool max 10/instance; Cloud Run max instances 2 until load review | Proposed/measure |
| P07-TD-015 | Staging backup rehearsal uses `mongodump`/`mongorestore` on synthetic data | Accepted Baseline |
| P07-TD-016 | Production deploy only promotes current verified Staging digest | Accepted Baseline |
| P07-TD-017 | Cloud Run rollback uses traffic to prior revision, not image rebuild | Accepted Baseline |
| P07-TD-018 | Monitoring uses provider metrics + safe application structured logs | Accepted Baseline |
| P07-TD-019 | Terraform computes deterministic Cloud Run URL from service/project number/region and verifies provider output | Accepted Baseline |
| P07-TD-020 | `TRUST_PROXY_HOPS=1` is the initial Cloud Run baseline and must be verified by client-IP/rate-limit tests | Proposed/measure |
| P07-TD-021 | Cloud Run application service allows unauthenticated invocation so the Web/login surface is public; application auth/RBAC protects private routes | Accepted Baseline |
| P07-TD-022 | Trivy scans Terraform/container and emits CycloneDX SBOM; existing Gitleaks and npm audit remain separate gates | Accepted Baseline |
| P07-TD-023 | A private on-demand Cloud Run Job with a dedicated seed identity creates Staging synthetic data using the same image digest; GitHub runner does not receive `MONGODB_URI` | Accepted Baseline |
| P07-TD-024 | Cloud E2E uses a dedicated WIF identity that can read only the synthetic test password, not application/database secrets | Accepted Baseline |
| P07-TD-025 | Synthetic logical backup artifacts use a separate private GCS bucket with short lifecycle; Terraform state bucket is never reused | Accepted Baseline |

## 2. Terraform Ownership Contract

Terraform owns APIs, registry, service accounts, IAM, WIF, secret containers/IAM, Cloud Run service
configuration, monitoring resources, labels và current image digest. GitHub Actions passes
`TF_VAR_image_ref=<registry>/<image>@sha256:<digest>` and applies the selected environment.

Secret values, Atlas owner credential, database dump và GitHub reviewer configuration are not stored
in Terraform state. Emergency Console change must be reconciled into Terraform or reverted within
one working day.

## 3. Runtime Sizing Baseline

| Setting | Staging baseline | Production direction |
| --- | --- | --- |
| CPU | 1 vCPU | 1 vCPU until performance review |
| Memory | 512Mi; increase to 1Gi if build/runtime evidence requires | Capacity decision in Phase 08 |
| Concurrency | 20 | 20, adjust with Atlas pool/load evidence |
| Min instances | 0 | 0 for demo; paid decision for availability |
| Max instances | 2 | Bounded value approved with Atlas/cost |
| Request timeout | 60s | 60s unless endpoint-specific evidence |
| Mongo pool max | 10/instance | `(max instances * pool max)` within Atlas limit |
| Startup budget | 120s | Tune from cold-start evidence |

## 4. Rejected Alternatives

| Alternative | Reason rejected |
| --- | --- |
| Firebase | Không thuộc accepted provider architecture |
| Separate static hosting and API origin | Tăng cookie/CORS/CSRF complexity |
| Service-account JSON in GitHub Secret | Long-lived key risk; WIF available |
| Deploy `latest` | Không đảm bảo artifact identity/rollback |
| Build again for Production | Có thể khác artifact đã test |
| MongoDB in Cloud Run container | Ephemeral filesystem/lifecycle, không phải managed database |
| Atlas Free as real Production | Không native backup/private endpoint/SLA/capacity evidence |
| Open `0.0.0.0/0` without waiver | Không có owner/expiry/compensating control |
| Terraform secret value resource | Dễ đưa plaintext vào state/log |
| Production deploy from local CLI | Bỏ qua approval/audit/reproducibility |
