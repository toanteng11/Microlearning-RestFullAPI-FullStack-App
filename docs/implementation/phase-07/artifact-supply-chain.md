# Artifact Supply Chain

## 1. Mục tiêu

Mỗi deployment phải truy ngược được từ Cloud Run revision về image digest, Git commit, CI run, test result,
SBOM và vulnerability report.

## 2. Artifact flow

```text
Protected main commit
  -> required CI Pass
  -> production image build once
  -> tests and scan on exact image
  -> push Artifact Registry
  -> resolve immutable digest
  -> attach metadata/SBOM
  -> deploy Staging by digest
  -> cloud smoke and evidence
  -> Phase 08 promotes same digest to Production
```

Không rebuild image khi promote giữa environments.

## 3. Registry design

- Artifact Registry repository ở `asia-southeast1`.
- Repository format Docker, không public.
- Writer chỉ là build/deploy identity cần thiết.
- Runtime đọc image qua Cloud Run platform integration.
- Retention giữ ít nhất current stable, prior stable và release candidates trong rollback/audit window.

## 4. Provenance metadata

Deployment record tối thiểu:

```text
repository:
image:
tag:
digest:
git_commit:
workflow_run_url:
build_time_utc:
sbom_artifact:
scan_result:
cloud_run_revision:
environment:
deployed_by:
smoke_result_url:
```

## 5. Build trust

- Chỉ build từ protected `main` commit đã Pass required CI.
- Pin GitHub Actions theo full commit SHA hoặc approved version policy.
- `npm ci` dùng committed lockfile.
- Docker base image pin theo digest sau validation.
- Build không nhận production secrets.
- Workflow dùng least-privilege OIDC token.

## 6. Scanning and SBOM

- Trivy is the selected Phase 07 scanner for container vulnerability/misconfiguration and CycloneDX SBOM.
- Existing Gitleaks full-history secret scan and production `npm audit` remain independent required controls.
- Chạy local image scan trước push để fail sớm; sau push, tạo final scan/SBOM từ exact registry digest và ghi
  tool/database timestamp vào release manifest.
- Dependency audit giữ gate hiện hành.
- Container image scan chạy trước deploy.
- SBOM được sinh từ exact digest/artifact.
- Critical và exploitable High block deployment.
- Exception cần finding ID, reachability analysis, owner, expiry và mitigation.
- Scan report không được đánh dấu Pass chỉ vì tool exit code bị ignore.
- Scanner result is bounded evidence, not proof that an image is vulnerability-free; tool/database version and
  scan timestamp must be recorded.

## 7. Promotion rules

Một digest chỉ được promote khi:

- commit thuộc protected main;
- CI, container tests, scan và Staging smoke Pass;
- version endpoint khớp digest/commit;
- không có critical open finding;
- deployment record đầy đủ;
- Phase 08 Go/No-Go và Production reviewer approve.

## 8. Retention and cleanup

- Không xóa digest đang được Staging/Production hoặc prior rollback revision sử dụng.
- Cleanup ưu tiên untagged artifact cũ không có release record.
- Retention policy được dry-run/kiểm tra trước khi bật.
- Registry storage và egress được theo dõi trong cost report.

## 9. Tamper checks

- Cloud Run revision image digest phải bằng deployment record.
- Tag mutation không ảnh hưởng revision đã deploy.
- Re-running workflow với cùng commit không được âm thầm promote digest khác mà không có record mới.
- Artifact metadata không nhận input tùy ý từ untrusted PR.

## 10. Evidence

- Artifact Registry URL và repository policy;
- image digest/labels;
- SBOM và scan summary;
- CI build run;
- deployment record;
- Cloud Run revision digest match;
- retention policy verification.
