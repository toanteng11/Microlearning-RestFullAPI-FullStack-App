# Phase 07 Developer Start Guide

## 1. Trạng thái hiện tại

Planning baseline đã `ACCEPTED_AT_GATE_A` ngày `2026-08-14`. Bắt đầu Part 01 chỉ sau khi planning PR merge
qua protected `main`, post-merge main CI Pass và local `main` đã pull commit mới. Cloud apply vẫn phải đi
qua execution part, Terraform plan và stop conditions tương ứng.

Điều kiện trên đã hoàn thành. Part 01-11 hiện ở `LOCAL_PASS_REMOTE_PENDING` trên branch
`feature/phase-07-runtime-container`. Source đã được chuẩn bị theo dependency để review nhưng chưa được Cloud
apply hoặc đánh dấu `DONE`; các parent PR, post-merge main CI và Cloud evidence vẫn phải hoàn tất theo WBS.

## 2. Đọc trước khi code

Theo thứ tự:

1. `README.md` và `scope-and-deliverables.md`;
2. `gate-a-decision-sheet.md`;
3. `technical-decisions.md`;
4. runtime/routing/container contracts;
5. IaC/IAM/secret/Atlas designs;
6. `github-actions-cd-design.md`;
7. testing/acceptance/traceability;
8. execution part đang nhận.

## 3. Branch/PR convention

Theo yêu cầu dự án, branch mới không dùng prefix `codex/`.

Ví dụ:

```text
feat/phase-07-production-runtime
infra/phase-07-cloud-foundation
ci/phase-07-staging-deployment
test/phase-07-cloud-e2e
docs/phase-07-exit-evidence
```

Mỗi branch bắt đầu từ `main` mới nhất và chỉ chứa scope của parent PR trong WBS.

## 4. Local bootstrap after Gate A

```powershell
git switch main
git pull origin main
npm ci
npm run lint
npm test
npm run build
docker version
gcloud version
terraform version
```

Không paste output chứa account token/project credential vào issue/PR.

## 5. Recommended implementation order

1. Part 01: same-origin runtime.
2. Part 02: Production container and local smoke.
3. Part 03-06: Terraform, registry, WIF, secrets.
4. Part 07: Atlas staging hardening.
5. Part 08: first deploy.
6. Part 09-10: automate build/deploy.
7. Part 11: cloud E2E.
8. Part 12-14: operations/recovery.
9. Part 15-17: Production guard, hardening, exit.

## 6. Local validation per change

- Application: relevant unit/integration/OpenAPI/browser tests.
- Docker: image build, non-root inspect, health/readiness/version/static/API smoke, graceful stop.
- Terraform: fmt/validate/security scan and plan where possible.
- Workflow: YAML/workflow lint plus script unit tests; never test apply from untrusted PR.
- Docs: format/link/placeholder checks.

## 7. Secret safety

- Use placeholders in `.env.example`.
- Real secret only in ignored local file/Secret Manager/protected environment.
- Never use credential pasted in chat as trusted; rotate first.
- Never commit plan/state/credential JSON.
- Before commit run secret scan and inspect staged diff.

## 8. Developer stop conditions

Stop and escalate when:

- Gate A not approved for cloud-affecting work;
- Terraform plan contains unexpected delete/IAM/public access;
- deployment input is mutable tag;
- logs/state/image expose secret;
- Atlas environment/database is ambiguous;
- change would deploy Production before Phase 08;
- required CI check is removed/renamed unintentionally.

## 9. Evidence discipline

During implementation, update evidence continuously. Do not wait until Part 17 to reconstruct:

- command/test result;
- PR/main workflow URL;
- commit and digest;
- Terraform plan/apply artifact;
- Cloud revision/URL;
- screenshots/reports with redaction;
- decision/owner/date.

## 10. Part 03-05 owner bootstrap sequence

Sau khi P07-PR01 đã merge:

1. tạo branch `infra/phase-07-cloud-foundation` từ `main` mới nhất;
2. đưa riêng scope P07-PR02 vào branch và mở PR;
3. xác minh `Terraform quality` Pass từ clean GitHub runner;
4. owner review bootstrap plan, tạo/migrate state bucket theo runbook;
5. chạy Staging plan; xác nhận repository hiện hữu được `import`, không create/replace;
6. owner apply foundation đã duyệt; không chạy Production root;
7. thêm GitHub repository variables không nhạy cảm:

```text
GCP_PROJECT_ID=microlearning-platform-502716
GCP_WORKLOAD_IDENTITY_PROVIDER_STAGING=<Terraform workload_identity_provider output>
GCP_DEPLOY_SERVICE_ACCOUNT_STAGING=ml-github-staging@microlearning-platform-502716.iam.gserviceaccount.com
```

8. chạy `Identity Diagnostic` và `Identity Negative Test` từ branch selector `main`;
9. lưu workflow URLs/sanitized artifacts và tiếp tục Part 06.

Không tạo GitHub secret chứa service-account JSON. Không chạy cloud-plan job trước khi WIF foundation đã
được owner apply.

## 11. Part 09-11 activation sequence

Sau khi Part 08 có known-good Staging revision:

1. lấy Terraform outputs cho deploy WIF và dedicated E2E WIF;
2. tạo/cập nhật repository variables theo `phase-07-part-09-11-evidence.md`;
3. xác minh năm Secret Manager version variables là số version exact đang `ENABLED`;
4. merge source qua protected `main` và chờ `Continuous Integration` Pass;
5. theo dõi chuỗi `Build And Publish` -> `Deploy Staging` -> `Cloud Smoke And E2E`;
6. tải artifacts, kiểm tra redaction report trước khi chia sẻ evidence;
7. ghi run URLs, exact commit, digest, revision vào `evidence-register.md`;
8. nếu auto trigger bị gián đoạn, chỉ dùng manual recovery với exact successful upstream run ID;
9. nếu deploy fail sau apply, xác minh workflow fail và traffic đã quay về prior revision; không rerun mù;
10. chỉ đổi Part 09-11 thành `DONE` sau khi stable deployment record và post-merge evidence Pass.
