# Phase 07 Runtime And Container Evidence

## 1. Scope

Tài liệu ghi bằng chứng local cho Part 01-02 trước P07-PR01. Evidence này chứng minh implementation và
tooling hoạt động, nhưng không thay thế clean-checkout CI, immutable registry digest, PR merge hoặc
post-merge main CI.

## 2. Execution Context

| Field | Value |
| --- | --- |
| Branch | `feature/phase-07-runtime-container` |
| Baseline HEAD khi chạy local image | `792e2039d2a3c576c260b0b53b1e148da37bcb3e` |
| Evidence scope | `LOCAL_ONLY`, pre-P07-PR01 |
| Local image | `microlearning-platform:phase-07-local` |
| Local image ID | `sha256:5af74ca72bcc4b6c663261e7a6b11d71f09db02732042da2d486066e037fe52d` |
| Image size | `63,798,927` bytes |
| Runtime user | `node` |
| Validation time | `2026-08-17T14:45:07.322Z` |

Image được build từ working tree đang triển khai nên OCI revision vẫn phản ánh baseline HEAD. Vì vậy image
này chỉ dùng làm local engineering evidence, `promotionEligible=false`; P07-PR01 phải build lại từ clean
checkout để gắn đúng commit.

## 3. Quality Results

| Gate | Result |
| --- | --- |
| ESLint, negative lint gate, Prettier, typecheck | Pass |
| API unit/coverage | `37` files, `237/237` tests Pass |
| Web unit/coverage | `23` files, `126/126` tests Pass |
| API/Web Production build | Pass |
| Production dependency audit | Pass; không có active exception |
| Single-origin bundle verifier | Pass |

## 4. Runtime And Image Results

| Check | Result |
| --- | --- |
| React root và `/student/todo` deep link | Pass |
| API, Swagger UI và OpenAPI JSON | Pass |
| API/static missing route isolation | Pass |
| Chromium root/deep-link render and page errors | Pass |
| Health/readiness/version metadata | Pass |
| Non-root and OCI labels | Pass |
| Runtime content audit | Pass |
| Graceful `docker stop` trong budget | Pass |
| Staging reject non-Atlas MongoDB URI | Pass |
| Trivy Critical/High, gồm cả finding chưa có bản vá | Pass, `0` finding |
| CycloneDX SBOM from exact local image | Pass, `167` components |

Generated local artifacts, intentionally excluded from Git:

- `artifacts/phase-07/smoke/production-image-smoke.json`;
- `artifacts/phase-07/scan/microlearning-production-trivy.local.json`;
- `artifacts/phase-07/sbom/microlearning-production.local.cdx.json`;
- `artifacts/phase-07/release-manifest.local.json`.

## 5. Remote Closure Gate

Part 01-02 chỉ chuyển sang `DONE` khi:

1. P07-PR01 được tạo từ branch hiện tại;
2. job `Production container` build image từ clean Git checkout và upload evidence artifact;
3. toàn bộ required checks cùng job container Pass;
4. PR merge qua protected `main`;
5. post-merge main CI Pass và URL được ghi vào evidence register.
