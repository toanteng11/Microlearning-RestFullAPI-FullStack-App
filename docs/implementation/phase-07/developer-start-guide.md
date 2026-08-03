# Phase 07 Developer Start Guide

## 1. Trạng thái hiện tại

Planning baseline đang là `DRAFT_FOR_GATE_A_REVIEW`. Không bắt đầu cloud apply hoặc đưa secret vào hệ thống
trước khi Gate A `APPROVED`.

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
