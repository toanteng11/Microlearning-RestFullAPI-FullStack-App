# Phase 07 Testing Strategy

## 1. Mục tiêu chất lượng

Chứng minh hệ thống có thể build, deploy, quan sát và phục hồi trên Cloud mà không làm sai các contract nghiệp
vụ đã Pass ở Phase 01-06.

## 2. Test pyramid mở rộng

| Tầng | Nội dung | Gate |
| --- | --- | --- |
| Static | lint/type/build, Terraform fmt/validate, workflow lint, secret/IaC scan | PR block |
| Unit | env validation, URL routing, release manifest, policy parsers | PR block |
| Integration | Mongo replica set, container startup/shutdown, static/API routing | PR block |
| Contract | OpenAPI, version/deployment schema, Terraform outputs | PR/main block |
| Container | non-root, image content, probes, scan/SBOM | pre-push/pre-deploy |
| Cloud smoke | URL/probe/version/Swagger/cookie/RBAC | post-deploy block |
| Browser E2E | four-role critical journeys | Staging stable block |
| Operational | log/alert/backup/restore/rollback | Phase exit block |

## 3. Existing regression gates

Không được bỏ/giảm:

- lint, unit/integration test và production build;
- production dependency audit;
- MongoDB replica-set transaction suite;
- OpenAPI contract;
- integrated browser E2E;
- secret scan.

Thay đổi workflow phải xác minh required-check names hoặc cập nhật branch protection có evidence.

## 4. Runtime/container tests

- Production env fail-fast table-driven tests.
- Same-origin route precedence and unknown-route tests.
- SPA deep link/static asset cache tests.
- `/health` vs `/ready` dependency behavior.
- version metadata validation.
- graceful SIGTERM test.
- image runs as non-root.
- image has no `.env`, source credential or unnecessary dev artifact.
- vulnerability policy and SBOM generation.

## 5. IaC tests

- `terraform fmt -check -recursive`.
- `terraform validate` each root/module.
- provider lock/version constraints.
- static security/policy scan.
- Staging plan review with exact digest.
- negative/destructive plan policy.
- post-apply zero/unexpected drift check.
- state secret canary inspection.

## 6. Identity/security tests

- WIF auth from authorized main/environment succeeds.
- auth from disallowed branch/repository context fails.
- runtime identity cannot deploy.
- Staging deployer cannot mutate Production.
- no active service-account keys.
- secret old version/Atlas old credential revoked.
- HTTPS cookie, CORS, proxy/rate limit, RBAC/ownership Pass.

## 7. Cloud data tests

- Atlas TLS connection/readiness.
- indexes and transaction suite.
- pool connection budget under scale.
- synthetic seed idempotency.
- duplicate/concurrency invariants.
- backup/restore counts and business invariants.

## 8. Performance baseline

Không phải load-test Production, nhưng phải đo:

- cold-start readiness duration;
- warm health/API latency;
- representative p95 under small controlled load;
- memory/CPU and Atlas connection count;
- browser critical journey duration.

Threshold ban đầu là observation baseline; regression nghiêm trọng phải được giải thích trước exit.

## 9. Test data

- deterministic synthetic seed;
- unique run IDs;
- no real PII;
- cleanup guarded by environment/database allowlist;
- cloud test credentials protected;
- no password/token in report attachments.

## 10. Evidence quality

Mỗi report phải gắn:

- Git commit;
- image digest;
- Cloud Run revision;
- environment/base URL;
- workflow run;
- timestamp UTC;
- test counts/pass/fail/skip;
- artifact checksum nếu cần.

Skipped Must test được tính Fail trừ khi criterion là Conditional và có `APPROVED_NA`.

## 11. Exit thresholds

- `66/66` Must acceptance criteria Pass.
- Critical/High defects `0`.
- Required CI/main/Staging CD/smoke green.
- Container Critical/exploitable High findings `0` hoặc approved bounded exception không thuộc Critical.
- Rollback và restore rehearsals Pass.
- No secret/data leak.
