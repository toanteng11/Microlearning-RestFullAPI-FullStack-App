# Phase 07 Traceability Matrix

## 1. Requirement To Delivery

| BA source | Phase 07 capability | Design | Execution | Acceptance/Test |
| --- | --- | --- | --- | --- |
| FR-064..067A | REST/OpenAPI runtime | runtime/routing contracts | Part 01-02 | AC-009..016, TC-005..022 |
| FR-070 | health/readiness/version | `production-runtime-contract.md` | Part 01, 08, 11 | AC-011..012, 041 |
| FR-071 | Docker | `production-container-contract.md` | Part 02 | AC-014..016 |
| FR-072 | CI/CD | `github-actions-cd-design.md` | Part 09-10, 15 | AC-035..044 |
| FR-073 | environment/secrets | `secret-and-configuration-management.md` | Part 06 | AC-010, 020, 024 |
| FR-074 | logging/monitoring | `observability-and-alerting.md` | Part 12 | AC-053..056 |
| FR-075 | backup/rollback | recovery/rollback runbooks | Part 13-14 | AC-057..059 |
| BRQ-024 | DevOps foundation/deployment | IaC/IAM/artifact/CD docs | Part 03-10 | AC-017..044 |
| BRQ-025 | operations/recovery | observability/recovery docs | Part 12-14 | AC-053..060 |

## 2. BA DevOps Acceptance Mapping

| BA AC | Phase 07 interpretation | Phase 07 AC |
| --- | --- | --- |
| DOP-AC-001 | Production build/container tái lập | 014..016 |
| DOP-AC-002 | Docker local/Cloud runtime Pass | 009..016 |
| DOP-AC-003 | CI quality gates bắt buộc | 035..037 |
| DOP-AC-004 | Immutable artifact traceability | 025..026, 037, 040 |
| DOP-AC-005 | Environment/config separation | 017..024, 027 |
| DOP-AC-006 | Secret management/no hard-code | 020, 024, 054 |
| DOP-AC-007 | Cloud deploy HTTPS/probes | 038..041 |
| DOP-AC-008 | Health/readiness/version | 011..012, 041 |
| DOP-AC-009 | Logging | 053..054 |
| DOP-AC-010 | Monitoring/dashboard/uptime | 055 |
| DOP-AC-011 | Alert notification/runbook | 056 |
| DOP-AC-012 | Backup | 057 |
| DOP-AC-013 | Restore rehearsal | 058 |
| DOP-AC-014 | Rollback rehearsal | 059 |
| DOP-AC-015 | Security scan/hardening | 061..062 |
| DOP-AC-016 | Cost/quota controls | 060 |
| DOP-AC-017 | Staging smoke/E2E | 045..052 |
| DOP-AC-018 | Release evidence/handoff | 063..066 |

## 3. Architecture To Source Mapping

| Contract | Source area | Test area |
| --- | --- | --- |
| same-origin route ownership | API app/static middleware, Web API client | route/deep-link/cloud browser tests |
| runtime/probe/shutdown | server/config/database | unit + container + Cloud probes |
| immutable image | Dockerfile/build scripts | image inspect/scan/SBOM |
| Terraform state/modules | `infrastructure/terraform/**` | fmt/validate/plan/drift |
| WIF/least privilege | IAM Terraform + workflows | authorized/unauthorized identity tests |
| secret pinned versions | Secret Manager/Terraform/runtime config | state/log/image/config negative tests |
| Atlas pool/TLS/readiness | database adapter/config | Atlas integration/pool/readiness tests |
| CD/promotion | workflows/release scripts | workflow and post-deploy gates |
| observability | logger/monitoring Terraform | log/alert canary tests |
| recovery | runbooks/workflows | backup/restore/rollback rehearsal |

## 4. Execution Part To Parent PR

| Parts | Parent PR | Outcome |
| --- | --- | --- |
| 00 | P07-PR00 | Gate A approved |
| 01-02 | P07-PR01 | same-origin Production image |
| 03-06 | P07-PR02 | Terraform, artifact, IAM, secrets |
| 07-08 | P07-PR03 | Atlas Staging + first Cloud deploy |
| 09-10 | P07-PR04 | build/publish/deploy CD |
| 11 | P07-PR05 | Cloud smoke/E2E |
| 12-14 | P07-PR06 | observability/recovery/rollback |
| 15-16 | P07-PR07 | promotion readiness/hardening |
| 17 | P07-PR08 | evidence/exit/P08 handoff |

## 5. Coverage Rule

- Mỗi Must AC phải có ít nhất một test/evidence source.
- Mỗi code/IaC/workflow PR phải cập nhật AC/test/evidence rows bị ảnh hưởng.
- Mọi BA requirement ngoài scope phải ghi Deferred/Conditional rõ, không để trống.
- Traceability hoàn tất không đồng nghĩa implementation Pass; result nằm ở acceptance/evidence records.
