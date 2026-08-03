# Phase 07 Test Case Catalog

## 1. Planning And Tools

| ID | Test | Expected |
| --- | --- | --- |
| P07-TC-001 | Gate A completeness | mọi Must decision Approved |
| P07-TC-002 | tool versions | Docker/Node/npm/gcloud/Terraform đúng baseline |
| P07-TC-003 | clean clone | install/CI/Terraform validation tái lập |
| P07-TC-004 | no credential baseline | scan repo/history/config không phát hiện real secret |

## 2. Runtime And Routing

| ID | Test | Expected |
| --- | --- | --- |
| P07-TC-005 | missing required Production env | process fail fast |
| P07-TC-006 | default/insecure secret | process fail fast |
| P07-TC-007 | health with Mongo disconnected | `/health=200`, `/ready=503` |
| P07-TC-008 | version metadata | commit/digest/version/environment chính xác |
| P07-TC-009 | API unknown route | JSON `404` |
| P07-TC-010 | SPA deep link reload | React shell/router đúng |
| P07-TC-011 | missing static asset | `404`, không HTML fallback |
| P07-TC-012 | Swagger/OpenAPI | UI/JSON valid |
| P07-TC-013 | cache/security headers | đúng contract |
| P07-TC-014 | SIGTERM | graceful shutdown trong budget |

## 3. Container And Supply Chain

| ID | Test | Expected |
| --- | --- | --- |
| P07-TC-015 | production image build | build Pass từ clean clone |
| P07-TC-016 | runtime user | UID khác root |
| P07-TC-017 | image content | không `.env`/secret/dev artifact |
| P07-TC-018 | local production smoke | React/API/Swagger/health Pass |
| P07-TC-019 | vulnerability gate | không Critical/exploitable High |
| P07-TC-020 | SBOM | gắn exact digest |
| P07-TC-021 | artifact trace | digest -> commit/run/manifest |
| P07-TC-022 | mutable tag rejection | deploy input tag bị reject |

## 4. Terraform IAM And Secrets

| ID | Test | Expected |
| --- | --- | --- |
| P07-TC-023 | Terraform fmt/validate | Pass all roots/modules |
| P07-TC-024 | IaC security scan | policy Pass/approved bounded exception |
| P07-TC-025 | state protection | private/versioned/tách env |
| P07-TC-026 | state secret canary | secret value không có trong state/plan |
| P07-TC-027 | WIF authorized context | exchange/auth Pass |
| P07-TC-028 | WIF unauthorized context | denied |
| P07-TC-029 | no SA keys | active key count `0` |
| P07-TC-030 | runtime/seed least privilege | deploy/admin/public-seed/Production actions denied |
| P07-TC-031 | environment isolation | Staging cannot mutate Production |
| P07-TC-032 | secret pinned version | revision dùng exact version |
| P07-TC-033 | config redaction | plan/log/workflow không lộ canary |

## 5. Atlas

| ID | Test | Expected |
| --- | --- | --- |
| P07-TC-034 | rotated credential | new works, old fails |
| P07-TC-035 | TLS connection | Cloud Run ready qua TLS |
| P07-TC-036 | least privilege | app user ngoài DB action denied |
| P07-TC-037 | data policy | chỉ synthetic records |
| P07-TC-038 | indexes | required indexes đúng spec |
| P07-TC-039 | transactions | replica-set suite Pass |
| P07-TC-040 | pool budget | total connections trong baseline |
| P07-TC-041 | seed/reset guard | idempotent và chặn sai environment |

## 6. Cloud Deployment

| ID | Test | Expected |
| --- | --- | --- |
| P07-TC-042 | main CI chain | only successful main commit builds |
| P07-TC-043 | deploy by digest | revision digest match manifest |
| P07-TC-044 | HTTPS/probes | public HTTPS và probes healthy |
| P07-TC-045 | service identity | expected runtime SA |
| P07-TC-046 | scale constraints | min/max/concurrency đúng Terraform |
| P07-TC-047 | post-apply drift | no unexpected drift |
| P07-TC-048 | deploy failure | workflow fail và không mark stable |
| P07-TC-049 | evidence failure | deployment không được mark Pass |

## 7. Actor E2E And Security

| ID | Test | Expected |
| --- | --- | --- |
| P07-TC-050 | Student cloud journey | Pass |
| P07-TC-051 | Teacher cloud journey | Pass |
| P07-TC-052 | Admin cloud journey | Pass |
| P07-TC-053 | Super Admin cloud journey | Pass |
| P07-TC-054 | cross-role/ownership denial | correct `401/403/404` |
| P07-TC-055 | secure cookie/session | HTTPS login/refresh/logout Pass |
| P07-TC-056 | Cloud proxy rate limit | correct client/proxy behavior |
| P07-TC-057 | concurrent business invariants | no duplicate/corruption |

## 8. Operations And Recovery

| ID | Test | Expected |
| --- | --- | --- |
| P07-TC-058 | structured log | request/revision/digest fields present |
| P07-TC-059 | log redaction canary | no secret in logs/alerts |
| P07-TC-060 | uptime check | successful check recorded |
| P07-TC-061 | alert notification | test reaches owner |
| P07-TC-062 | backup checksum | valid manifest/checksum |
| P07-TC-063 | isolated restore | counts/invariants/indexes Pass |
| P07-TC-064 | Cloud Run rollback | prior digest restored and smoke Pass |
| P07-TC-065 | drift after rollback | Terraform reconciled/clean |
| P07-TC-066 | cost/quota review | guardrails and budget evidence present |

## 9. Exit

| ID | Test | Expected |
| --- | --- | --- |
| P07-TC-067 | acceptance mapping | `66/66` Must have evidence |
| P07-TC-068 | conditional decisions | each Pass or `APPROVED_NA` |
| P07-TC-069 | clean-clone release | full required suite Pass |
| P07-TC-070 | Phase 08 handoff | reviewed and accepted |
