# DevOps And Release Acceptance

## Mục Đích

Tài liệu này xác nhận release candidate có thể build, deploy, quan sát và phục hồi theo DevOps package. Một feature pass UAT nhưng không chạy được ổn định/an toàn trên Staging/Cloud chưa được xem là release-ready.

## Build And Container Acceptance

| ID | Given / When | Expected pass condition | Priority |
| --- | --- | --- | --- |
| DOP-AC-001 | Given clean checkout/Local environment | Frontend, Backend và Local MongoDB/service cần thiết build/run theo Docker/Docker Compose guidance; no Production secret. | Must |
| DOP-AC-002 | Given CI build | Lock dependency, lint/type/test/build pass according release scope; fail stops artifact promotion. | Must |
| DOP-AC-003 | Given Docker image build | Frontend/backend image traceable to version/commit/digest, no `.env`/secret/database dump baked into image. | Must |
| DOP-AC-004 | Given registry artifact | Staging/Production use immutable approved artifact, not mutable `latest` only; prior stable artifact retained for rollback. | Must |

## Environment And Security Acceptance

| ID | Given / When | Expected pass condition | Priority |
| --- | --- | --- | --- |
| DOP-AC-005 | Given Local/CI/Staging/Production config | Database/secret/domain/CORS/storage environment separated; no Production secret/data used in Local/CI/UAT without approval. | Must |
| DOP-AC-006 | Given runtime/CI deployment | Secret injected through approved protected mechanism/runtime identity and not printed in log/pipeline/UI bundle. | Must |
| DOP-AC-007 | Given Cloud endpoint | HTTPS/domain/API base URL/CORS/SPA fallback configured; direct refresh of P0 route does not return 404. | Must |
| DOP-AC-008 | Given storage/media feature | Bucket/object private policy/runtime access/expiry and upload validation satisfy security rule. | Must if media/upload release |

## Deployment And Smoke Acceptance

| ID | Given / When | Expected pass condition | Priority |
| --- | --- | --- | --- |
| DOP-AC-009 | Given deploy to Staging | CI/CD records artifact/environment/config reference and deploy result; no concurrent unsafe rollout. | Must |
| DOP-AC-010 | Given API starts | Basic `/health` returns expected safe UP/DEGRADED/DOWN; dependency failure does not falsely claim UP. | Must |
| DOP-AC-011 | Given post-deploy verification | Version endpoint identifies app version/commit/environment; frontend/API target match release candidate. | Should |
| DOP-AC-012 | Given Staging/Production smoke | Login and representative Student To-do, Teacher Course Dashboard, Admin role-specific list succeed; changed feature smoke runs. | Must |
| DOP-AC-013 | Given failure during deploy/smoke | Pipeline stops promotion; incident/rollback/forward-fix procedure is actionable and evidence recorded. | Must |

## Observability And Reliability Acceptance

| ID | Given / When | Expected pass condition | Priority |
| --- | --- | --- | --- |
| DOP-AC-014 | Given normal/error API request | Structured request/error log includes safe context/requestId/duration/version, no password/token/secret. | Must |
| DOP-AC-015 | Given monitoring configuration | API health, error rate, latency, MongoDB/runtime dependency, backup/job status monitored or manual procedure documented. | Should |
| DOP-AC-016 | Given critical alert/release incident | Alert owner, escalation, log/version/health triage and first response runbook known. | Should |
| DOP-AC-017 | Given backup/release with data risk | Backup/pre-release snapshot exists per policy; restore process documented/tested in isolated environment direction. | Must |
| DOP-AC-018 | Given rollback rehearsal | Prior frontend/backend artifact can be restored; health/version/role smoke confirms recovery; no blind data restore/deletion. | Must |

## Performance And Capacity Acceptance

| Check | Pass condition |
| --- | --- |
| Simple read API | Staging baseline p95 <= 800ms when NFR test scope/dataset applies. |
| Dashboard API | Staging baseline p95 <= 1500ms with defined dataset; report/read-model query not unbounded. |
| Frontend initial load | Target <= 3 seconds on good Staging network where measured. |
| List/report query | Pagination/index/projection/max range/limit prevent full data load. |
| Resource runtime | CPU/memory/restart/error trend has no unexplained sustained regression after release. |

Performance targets must cite environment/dataset/tool/time. A result without load/data context is evidence of observation, not a universal production guarantee.

## Release Go/No-Go Checklist

- [ ] Must functional/UAT criterion pass or approved non-security waiver.
- [ ] Security/privacy/API/Data acceptance pass.
- [ ] Docker/CI artifact/version/secret/environment/deploy/health/version/role smoke evidence available.
- [ ] Monitoring/log/alert/backup/rollback ownership and release record complete.
- [ ] Critical/High defect disposition complete; no unresolved data-loss/security incident.
- [ ] Product Owner/QA/Technical Lead/DevOps decision recorded.

## Liên Kết

- DevOps package: `../15-devops-deployment/`.
- NFR gates: `../13-non-functional-requirements/nfr-quality-gates.md`.
- UAT sign-off: `uat-execution-and-signoff.md`.
