# Phase 07 Part 06-08 Local Evidence

## 1. Kết luận

Ngày kiểm tra: `2026-08-17`. Part 06-08 đạt `LOCAL_PASS_REMOTE_PENDING`. Source, unit/static contract và
Terraform validation đã sẵn sàng cho P07-PR02/P07-PR03; tài liệu này không thay thế actual Cloud/Atlas run.

## 2. Part 06 - Secret And Runtime Configuration

- Terraform chỉ tạo `google_secret_manager_secret` containers và secret-level accessor IAM.
- Không có `google_secret_manager_secret_version`, secret value input hoặc secret output.
- Runtime chỉ mount exact numeric versions; `latest` bị validation/policy cấm.
- Runtime identity không đọc seed password; E2E identity chỉ đọc seed password; seed identity đọc đúng năm
  secret cần cho non-interactive job; deployer không có `secretAccessor`.
- `scripts/add-secret-version.ps1` dùng secure prompt và chuyển payload qua stdin, không dùng file tạm.
- Runtime schema-to-Terraform verifier xác nhận `71` explicit Production-like fields và `5` secret containers.

## 3. Part 07 - Atlas Staging

- Runtime fail-fast nếu Staging/Production không dùng SRV, đúng database, credential hoặc cố tắt TLS.
- Staging pool là min `0`, max `10`; server/connect timeout `10000ms`, socket timeout `30000ms`.
- Diagnostic chỉ nhận URI từ protected process environment và che URI/userinfo trong error.
- Mặc định diagnostic chỉ đọc; `--prepare-indexes` và `--transaction` là opt-in Staging-only.
- Transaction probe chỉ tạo record `synthetic=true`, xác minh commit và cleanup trong `finally`.
- Private seed command tạo application indexes trước dữ liệu synthetic và cấm mounted password ngoài Staging.

Actual Atlas verification chưa chạy trong lượt local này vì agent không đọc Secret Manager payload và không
tự ý dùng credential thật. Run theo `atlas-staging-verification-runbook.md` sau initial secret version.

## 4. Part 08 - First Staging Deploy

- `google_cloud_run_v2_service`: exact digest, dedicated runtime SA, request CPU, `512Mi`, scale `0..2`,
  concurrency `20`, timeout `300s`, startup/readiness `/ready`, liveness `/health`.
- Public invoker chỉ được policy cho phép với exact service `microlearning-staging` và role `roles/run.invoker`.
- Private `google_cloud_run_v2_job`: same digest, dedicated seed SA, task/parallelism `1`, retries `0`, no
  schedule và no public IAM.
- First deploy tách hai saved plans: seed/index job trước, public service sau khi seed Pass.
- HTTPS verifier kiểm tra health, ready, version/commit/digest, React root/deep-link, Swagger và OpenAPI.
- Workflow có confirmation `DEPLOY_STAGING`, protected environment, WIF, plan policy, drift check, observation
  window và redacted deployment record.

Không chạy workflow/apply trong local verification để tránh thay đổi Cloud hoặc phát sinh chi phí khi chưa có
owner confirmation.

## 5. Local Results

| Gate | Result |
| --- | --- |
| Monorepo lint/format/typecheck/build | Pass |
| API unit/coverage | `37` files, `237/237` Pass; statements `75.44%` |
| Web unit/coverage | `23` files, `126/126` Pass; statements `84.42%` |
| Atlas/runtime unit tests | Pass; bare Atlas host và URI/userinfo đều được redacted |
| OpenAPI contract | `12/12` Pass |
| Terraform fmt/init/validate: bootstrap/staging/production | Pass |
| Terraform policy/release/runtime-config contracts | Pass |
| Secret payload Terraform resource | Absent |
| Secure secret-version PowerShell syntax | Pass |
| Production image smoke/browser/graceful shutdown/Atlas boundary | Pass; non-root image `63,798,557` bytes |
| Production image Trivy | Pass - `0` Critical/High finding |
| Docker-backed Trivy IaC | Pass - `0` Critical/High finding |
| Production dependency audit | Pass; `0` active exception |
| Atlas connected transaction/index report | Cloud Pending |
| First Deploy Staging workflow | Cloud Pending |

## 6. Remaining Evidence

1. P07-PR02 clean-checkout CI/merge/main CI.
2. Owner apply Secret containers/IAM và add five initial versions securely.
3. Atlas diagnostic Pass, old credential negative-connect và network waiver evidence.
4. P07-PR03 first-deploy run URL, plan policies, seed execution, URL/revision/digest and deployment record.
5. Post-apply drift `0`, HTTPS smoke Pass và required observation window.
