# Phase 07 Scope And Deliverables

## 1. In Scope - Must

### Application Runtime

- React build, API và Swagger cùng một HTTPS origin.
- Relative API URL contract; Local development vẫn hỗ trợ Web/API tách port.
- Static asset caching, SPA fallback và API/Swagger/health 404 boundary đúng.
- `PORT`, graceful shutdown, startup/liveness, readiness dependency và proxy/client-IP behavior.
- Production image multi-stage, non-root, pinned runtime và reproducible build.

### Infrastructure And Security

- Terraform code cho GCP Staging resource baseline.
- Remote state có encryption/provider controls, versioning và access restriction.
- Artifact Registry repository, cleanup policy và immutable digest deployment.
- Dedicated runtime/deploy service accounts và least-privilege IAM.
- GitHub OIDC/Workload Identity Federation; không có service-account JSON key.
- Secret Manager mapping, secret version policy và rotation runbook.

### Database

- Atlas Staging database/user riêng, TLS và credential rotation.
- Network waiver rõ cho Free cluster nếu cần public access.
- Mongoose connection pool/timeouts bounded theo Cloud Run max instances/concurrency.
- Index/migration/transaction/rebuild/reconcile preflight trên Atlas.
- Synthetic seed và isolated backup/restore rehearsal.

### Delivery And Operations

- GitHub Actions build/scan/SBOM/push/deploy/smoke flow.
- Staging deploy tự động sau required main CI Success.
- Production promotion workflow protected và verify same digest.
- Cloud smoke cho system, actors, cookie, Swagger, SPA deep link.
- Logging redaction, Monitoring dashboard/uptime/alerts và alert test.
- Cloud Run rollback rehearsal và incident/forward-fix process.
- Evidence register, release record và P08 handoff.

## 2. Conditional

| Capability | Điều kiện bật | Nếu không bật |
| --- | --- | --- |
| Custom domain | Có DNS owner, domain, cost và change approval | Dùng managed `run.app` URL |
| Paid Atlas tier/native backup | Có budget và real-data Production decision | Free Atlas chỉ synthetic Staging/demo; backup rehearsal bằng tool |
| Private/static egress to Atlas | Có approved network/cost | Time-bound Staging wildcard network waiver |
| Cloud Run readiness probe | Provider feature status/support được duyệt | Application `/ready` + startup probe vẫn là Must |
| Canary/gradual traffic | Có approved rollout design và test window | Direct revision rollout + rollback rehearsal |
| Image signing/attestation | Tooling và policy được duyệt sau digest/SBOM baseline | Digest + scan + SBOM vẫn Must |

## 3. Out Of Scope

- Kubernetes/GKE, VM-managed runtime hoặc self-hosted MongoDB Production.
- Firebase Hosting, Firestore, Firebase Auth hoặc Firebase Storage.
- Multi-region active-active, global load balancer, CDN/WAF paid baseline.
- Data warehouse, BI pipeline hoặc high-volume analytics platform.
- Real email/SMS provider, payment hoặc commerce capability.
- Public bucket/object URL hoặc local-disk persistent storage.
- GCS media/upload và background scheduler; feature flags liên quan vẫn tắt. Terraform state và short-lived
  synthetic backup buckets là operational resources riêng, vẫn thuộc Phase 07.
- Actual Production apply; workflow/config chỉ được chuẩn bị cho Phase 08.
- Phase 08 full UAT, actual Production Go-No-Go và release closure.

## 4. Deliverables

| ID | Deliverable | Evidence |
| --- | --- | --- |
| P07-DEL-001 | Planning/Gate A package | Decision sheet, scope, risks, approvals |
| P07-DEL-002 | Single-origin production runtime | Unit/integration/container/SPA tests |
| P07-DEL-003 | Production application image | Local smoke, non-root, size/layer/secret inspection |
| P07-DEL-004 | Terraform GCP baseline | fmt/validate/plan/apply, state and resource inventory |
| P07-DEL-005 | Artifact supply chain | Commit/tag/digest/SBOM/scan/retention record |
| P07-DEL-006 | WIF/IAM | OIDC auth, principal condition, least-privilege review |
| P07-DEL-007 | Secret/config package | Secret inventory, mapping, fail-fast/rotation/no-log evidence |
| P07-DEL-008 | Atlas Staging integration | User/network/TLS/pool/index/transaction/synthetic data evidence |
| P07-DEL-009 | Staging Cloud Run service | URL, revision, digest, health/version/HTTPS evidence |
| P07-DEL-010 | CI/CD workflows | Main-to-Staging and protected Production promotion evidence |
| P07-DEL-011 | Cloud smoke/E2E | Actor journeys, cookie, Swagger, SPA result |
| P07-DEL-012 | Observability | Dashboard, logs, uptime, alert test và runbook |
| P07-DEL-013 | Backup/restore | Synthetic backup ID/hash, isolated restore verification |
| P07-DEL-014 | Rollback rehearsal | Prior revision traffic restoration and smoke evidence |
| P07-DEL-015 | Production readiness | Protected environment, same-digest check, Go template |
| P07-DEL-016 | Exit/P08 handoff | `66/66` result, evidence, risk, sign-off, handoff |

## 5. Scope Change Rule

Mọi yêu cầu thêm service trả phí, custom domain, production data, public object storage, static egress
hoặc background scheduler phải có Change Request với cost, security, data, rollback và acceptance
impact. Không mở rộng Phase 07 bằng thao tác Console không được ghi lại.
