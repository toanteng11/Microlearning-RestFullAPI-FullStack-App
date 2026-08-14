# Phase 07 BA Alignment And Decisions

## 1. Requirement Alignment

| BA requirement | Phase 07 response |
| --- | --- |
| FR-064..067A | Production runtime giữ REST `/api/v1`, OpenAPI JSON và Swagger UI cùng origin |
| FR-070 | `/health`, `/ready`, `/api/v1/system/version` được dùng cho probes/smoke |
| FR-071 | Local Compose tiếp tục hoạt động; production image được thêm riêng |
| FR-072 | GitHub Actions mở rộng từ CI thành build/publish/deploy/smoke/promotion |
| FR-073 | Config/secret từ GitHub Environment, Terraform variables và Secret Manager; không hard-code |
| FR-074 | Structured logs, Cloud Logging/Monitoring, uptime và alert baseline |
| FR-075 | Synthetic backup/restore và Cloud Run rollback rehearsal |
| BRQ-024 | Docker/CI/CD/environment/secret/Cloud deployment evidence |
| BRQ-025 | Health/version/log/monitoring/backup/rollback evidence |
| DOP-AC-001..018 | Map đầy đủ tại `traceability-matrix.md` và `acceptance-criteria.md` |

## 2. Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| P07-GA-001 | Google Cloud Run + Atlas + GitHub Actions | ADR-010 đã accepted |
| P07-GA-002 | Một application service/same origin | Giữ HttpOnly `SameSite=Lax` refresh cookie và đơn giản CORS |
| P07-GA-003 | `asia-southeast1` cho GCP resource | Gần người dùng Việt Nam; Artifact Registry cùng region |
| P07-GA-004 | Terraform là IaC tool | Học DevOps, reviewable plan, environment reproducibility |
| P07-GA-005 | Build once, promote exact digest | Chống drift giữa Staging/Production |
| P07-GA-006 | WIF/OIDC, không JSON key | Giảm long-lived credential risk |
| P07-GA-007 | Secret value chỉ ở Secret Manager | Runtime least privilege và rotation |
| P07-GA-008 | Staging auto deploy sau main CI | Feedback nhanh nhưng vẫn quality-gated |
| P07-GA-009 | Production protected/manual | UAT/Go-No-Go thuộc Phase 08 |
| P07-GA-010 | Atlas Free chỉ synthetic Staging/demo | Không đủ backup/private endpoint/SLA cho real Production |
| P07-GA-011 | Relative API URL trên Cloud | Web/API cùng release và origin |
| P07-GA-012 | Cloud Run `min=0`, bounded `max` | Kiểm soát free-tier/cost; chấp nhận cold start demo |
| P07-GA-013 | Solo Project Governance | PR/CI/no-bypass và manual Production confirmation thay independent reviewer |

## 3. Project-Specific Facts

| Fact | Status | Treatment |
| --- | --- | --- |
| GCP project `microlearning-platform-502716` | User-provided, project exists | Gate A xác minh login, billing, owner và APIs |
| Atlas `Cluster0` Free tại AWS Hong Kong | Existing | Staging latency/network waiver; Production không được suy diễn |
| Atlas credential từng được trao đổi ngoài approved secret flow | Security issue | Rotate/delete credential cũ trước mọi deploy; không ghi value |
| Repository public và protected `main` | Existing | Có thể dùng GitHub Environments/review; WIF lock repository identity |
| `gcloud` và Terraform chưa có trong local PATH | Verified | Part 00 install/verify prerequisite |
| Docker/Node/npm đã hoạt động | Verified | Dùng cho local production image validation |

## 4. Phase Boundary Decisions

- Phase 07 Must deploy Staging/demo; actual Production traffic không phải Phase 07 Must.
- Production workflow/config/IAM must be ready, nhưng Production secret/Atlas/service chỉ tạo sau Phase
  08 approval nếu có cost hoặc real-data impact.
- Swagger Staging exposure được phép cho demo nhưng không chứa credential và `persistAuthorization`
  phải false; Production exposure cần Phase 08 security decision.
- Media/file upload vẫn disabled. External question image/video URL chỉ theo Phase 05 allowlist; không
  tạo bucket chỉ để “đủ Cloud”.
- Atlas Free public access không được gọi là secure Production network. Waiver chỉ cho synthetic
  Staging và có expiry.

## 5. Open Gate A Decisions

| ID | Decision needed | Owner | Blocking |
| --- | --- | --- | --- |
| P07-OPEN-001 | Billing account linked và budget threshold | Product Owner/DevOps | Yes |
| P07-OPEN-002 | GCP principal có Owner/Admin bootstrap rồi giảm quyền | DevOps | Yes |
| P07-OPEN-003 | Atlas credential rotation/revoke completed | Backend/Security | Yes |
| P07-OPEN-004 | Accept synthetic-only Free Atlas + time-bound network waiver | PO/TL/Security | Yes |
| P07-OPEN-005 | GitHub Staging/Production solo protection và no-bypass evidence | PO/DevOps | Yes |
| P07-OPEN-006 | Production custom domain | Product Owner | No; default `run.app` |
| P07-OPEN-007 | Production Atlas tier/RPO/RTO | PO/TL/DevOps | Deferred to Phase 08 Go gate |
