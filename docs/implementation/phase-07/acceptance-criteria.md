# Phase 07 Acceptance Criteria

## 1. Rules

- `P07-AC-001..066` là Must.
- `P07-AC-067..072` là Conditional.
- Must chỉ `Pass` khi evidence gắn đúng commit/image digest/revision/workflow tùy criterion.
- Conditional chỉ `APPROVED_NA` khi Gate A/owner xác nhận không bật và ghi lý do.
- `Skipped`, placeholder hoặc local-only assertion không đủ cho Cloud criterion.

## 2. Planning And Gate A `001..008`

| ID | Criterion |
| --- | --- |
| P07-AC-001 | P06 release input/handoff và backward compatibility được xác nhận. |
| P07-AC-002 | Scope Phase 07/08, Must/Conditional/Deferred được review. |
| P07-AC-003 | Cloud provider/region/project và same-origin topology được chốt. |
| P07-AC-004 | Billing, budget owner, quota và project access có evidence. |
| P07-AC-005 | Docker/Node/npm/gcloud/Terraform baseline hoạt động. |
| P07-AC-006 | Atlas credential cũ revoke, credential Staging mới được bảo vệ. |
| P07-AC-007 | Synthetic-only data và Atlas network waiver/expiry được duyệt. |
| P07-AC-008 | GitHub environments/protection và Production defer-to-P08 được duyệt. |

## 3. Runtime And Container `009..016`

| ID | Criterion |
| --- | --- |
| P07-AC-009 | React, API, Swagger, health/version chạy cùng origin theo route contract. |
| P07-AC-010 | Production config fail fast với missing/insecure values. |
| P07-AC-011 | `/health`, `/ready` và dependency behavior đúng contract. |
| P07-AC-012 | Version endpoint phản ánh exact commit/digest/build/environment. |
| P07-AC-013 | SIGTERM graceful shutdown hoàn tất trong budget. |
| P07-AC-014 | Production image build từ clean clone và chạy non-root. |
| P07-AC-015 | Image không chứa secret/dev artifact và Pass vulnerability policy. |
| P07-AC-016 | Image có SBOM/labels/manifest và local production smoke Pass. |

## 4. IaC Identity Secrets And Artifact `017..026`

| ID | Criterion |
| --- | --- |
| P07-AC-017 | Terraform layout/module/version/lockfile đúng design. |
| P07-AC-018 | Remote state private, versioned, tách environment. |
| P07-AC-019 | Terraform fmt/validate/security scan/plan Pass. |
| P07-AC-020 | State/plan/output không chứa secret value. |
| P07-AC-021 | Dedicated runtime/seed/deploy identities và least privilege được review. |
| P07-AC-022 | GitHub OIDC/WIF authorized path Pass, unauthorized path denied. |
| P07-AC-023 | Không có active service-account JSON key cho workflow identities. |
| P07-AC-024 | Secret Manager resources/versions/IAM/rotation contract Pass. |
| P07-AC-025 | Artifact Registry private và image traceability digest-to-commit Pass. |
| P07-AC-026 | CD từ chối mutable tag/untrusted PR và dùng exact digest. |

## 5. MongoDB Atlas `027..034`

| ID | Criterion |
| --- | --- |
| P07-AC-027 | Staging dùng database/user riêng và TLS. |
| P07-AC-028 | Old credential fail, new credential works, secret không lộ. |
| P07-AC-029 | Network rule/waiver có owner, expiry và synthetic-only control. |
| P07-AC-030 | Pool/timeouts/max instance tạo bounded connection budget. |
| P07-AC-031 | App startup/readiness xử lý Atlas availability đúng. |
| P07-AC-032 | Required schema/indexes/transactions/invariants Pass trên Atlas. |
| P07-AC-033 | Synthetic seed/reset idempotent và environment-guarded. |
| P07-AC-034 | Production Atlas backup/network/tier gap được block cho Phase 08. |

## 6. CD And Staging Deployment `035..044`

| ID | Criterion |
| --- | --- |
| P07-AC-035 | Existing required CI gates không bị giảm hoặc đổi tên âm thầm. |
| P07-AC-036 | Build/publish chỉ chạy từ successful protected main commit. |
| P07-AC-037 | Exact image được test/scan/push và digest manifest được lưu. |
| P07-AC-038 | Staging Terraform apply deploy đúng digest/config/service identity. |
| P07-AC-039 | Cloud Run HTTPS/startup/liveness/scale/concurrency đúng baseline. |
| P07-AC-040 | Staging URL/revision/digest/commit/secret versions có deployment record. |
| P07-AC-041 | Post-deploy readiness/version checks Pass. |
| P07-AC-042 | Failed deploy/smoke không được mark stable và kích hoạt rollback path. |
| P07-AC-043 | Post-apply/drift plan không có unexpected drift. |
| P07-AC-044 | Production workflow manual/protected/same-digest guard được validation, chưa apply thật. |

## 7. Cloud Smoke Security And Actors `045..052`

| ID | Criterion |
| --- | --- |
| P07-AC-045 | React root/deep links/assets và API `404` routing Pass trên Cloud. |
| P07-AC-046 | Swagger/OpenAPI cùng origin Pass. |
| P07-AC-047 | HTTPS secure cookie, proxy, CORS/origin, headers và rate-limit Pass. |
| P07-AC-048 | Student critical cloud journey Pass. |
| P07-AC-049 | Teacher critical cloud journey Pass. |
| P07-AC-050 | Admin critical cloud journey Pass. |
| P07-AC-051 | Super Admin critical cloud journey Pass. |
| P07-AC-052 | Negative auth/RBAC/ownership/concurrency journeys Pass. |

## 8. Observability Recovery And Cost `053..060`

| ID | Criterion |
| --- | --- |
| P07-AC-053 | Structured logs có request/revision/commit/digest và error code. |
| P07-AC-054 | Secret/PII canary không xuất hiện trong log/alert/evidence. |
| P07-AC-055 | Dashboard, uptime check và required metrics hoạt động. |
| P07-AC-056 | Alert test đến đúng owner và có runbook. |
| P07-AC-057 | Logical backup manifest/checksum trên synthetic data Pass. |
| P07-AC-058 | Isolated restore rehearsal giữ counts/indexes/business invariants. |
| P07-AC-059 | Prior-digest Cloud Run rollback rehearsal và critical smoke Pass. |
| P07-AC-060 | Budget alerts, scale guardrails, quota/cost review có evidence. |

## 9. Hardening And Exit `061..066`

| ID | Criterion |
| --- | --- |
| P07-AC-061 | IAM/public-resource/security review không còn Critical/High gap. |
| P07-AC-062 | Critical/exploitable High image/IaC/dependency finding bằng `0`. |
| P07-AC-063 | Clean-clone full required suite và release verification Pass. |
| P07-AC-064 | PR CI, post-merge main CI, Staging CD và cloud smoke đều Pass. |
| P07-AC-065 | Evidence register ghi exact URLs/commit/digest/revision, không placeholder. |
| P07-AC-066 | Exit report Pass và Phase 08 handoff được review/accepted. |

## 10. Conditional `067..072`

| ID | Capability | Pass hoặc Approved N/A |
| --- | --- | --- |
| P07-AC-067 | Custom domain/TLS mapping | DNS owner/cost được duyệt và test, hoặc `APPROVED_NA`. |
| P07-AC-068 | Static egress/NAT và narrow Atlas allowlist | triển khai/test, hoặc waiver `APPROVED_NA` có expiry. |
| P07-AC-069 | Paid Atlas/private connectivity/native backup | triển khai nếu scope Phase 07 bật, nếu không block P08 và `APPROVED_NA`. |
| P07-AC-070 | Cloud Run readiness probe feature | bật/test khi status/support được duyệt, hoặc app readiness contract thay thế. |
| P07-AC-071 | Canary/gradual traffic rollout | rehearsal nếu bật, hoặc direct revision strategy được duyệt. |
| P07-AC-072 | Artifact signing/attestation nâng cao | verify chain nếu capability bật, hoặc SBOM/digest baseline `APPROVED_NA`. |

## 11. Planning Baseline Result

| Nhóm | Kết quả hiện tại |
| --- | --- |
| Must | `0/66 Pass`, implementation chưa bắt đầu |
| Conditional | `0/6 decided`, chờ Gate A |
| Gate A | `PENDING_MANUAL_CONFIRMATION` |
| Phase status | `DRAFT_FOR_GATE_A_REVIEW` |

Không đổi các số này thành Pass trong planning PR.
