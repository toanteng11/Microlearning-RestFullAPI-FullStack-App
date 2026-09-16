# Phase 08 - Source and Workflow Blueprint

## 1. Mục đích

Tài liệu này chỉ rõ thay đổi code/config cần thực hiện. Tên file là contract triển khai; đổi tên hoặc bỏ hạng mục phải có ghi chú impact trong PR.

## 2. Contract và validator

| File | Thay đổi bắt buộc | Test |
| --- | --- | --- |
| `scripts/lib/handoff-contract.mjs` | G0 chỉ yêu cầu P07 exit Pass, release identity, stable Staging record, rollback digest, residual risks và `productionDecision=NO_GO`; bỏ yêu cầu System Test/UAT/G5/Production plan chưa thể tồn tại ở G0 | `npm run handoff:contract:test` |
| `scripts/lib/phase-08-contract.mjs` | Tách `PRE_RELEASE` và `FINAL`; G5 dùng `preReleaseAcceptanceStatus`, không dùng final acceptance | `npm run phase-08:contract:test` |
| `scripts/lib/phase-08-contract.mjs` | Cho phép `applyMode=APPLY` chỉ trong record production/exit sau G5 `GO`; trước G5 chỉ `PLAN_ONLY` | negative + positive contract tests |
| `scripts/validate-phase-08-*.mjs` | Giữ fail-closed, redaction và identity consistency; report không chứa URI/token/password | CLI tests + secret scan |
| `scripts/test-phase-08-contract.mjs` | Thêm test chống vòng lặp gate, APPLY trước GO, digest mismatch, placeholder và solo governance giả | local/CI Pass |
| `scripts/lib/phase-08-pre-release.mjs` | Tổng hợp G2/G3/G4 cùng exact identity, tạo PRE_RELEASE acceptance, G5 decision và checksum lock bất biến | `npm run phase-08:pre-release:tooling:test` |
| `scripts/generate-phase-08-pre-release.mjs` | Tạo package G5 mới, không ghi đè decision đã phát hành | CLI + overwrite negative test |
| `scripts/verify-phase-08-pre-release.mjs` | Xác minh acceptance/decision checksum và identity trước Part 10 | tamper negative test |

Contract đích:

```text
G5 GO = G2 PASS + G3 PASS + P08-AC-001..010 PASS + Critical/High=0
G8 PASS = G6 ACTUAL + P08-AC-001..014 PASS + complete evidence + no blocker
```

## 3. System Test và UAT automation

| File | Trách nhiệm |
| --- | --- |
| `playwright.phase-08.config.ts` | Chạy exact Staging URL, project theo persona/viewport, trace khi retry, không ghi credential |
| `tests/e2e/phase-08-system.spec.ts` | Health/version/CORS/SPA/auth/RBAC và P0 cross-domain journeys |
| `tests/e2e/phase-08-uat.spec.ts` | Hỗ trợ scenario 001-032; automation là evidence hỗ trợ, không tự tạo business sign-off |
| `playwright.phase-08-uat.config.ts` | UAT chạy serial, retry một lần và giữ trace/screenshot/video khi lỗi |
| `scripts/lib/phase-08-uat.mjs` | Khóa 32 scenario, 8 persona, defect linkage, solo sign-off và exact candidate identity |
| `scripts/generate-phase-08-uat-summary.mjs` | Tạo `P08-EV-003/020/025/026` machine-readable từ raw observations và explicit acceptance |
| `tests/e2e/phase-08-accessibility.spec.ts` | Axe trên trang P0, keyboard/focus/status-not-color checks |
| `scripts/run-phase-08-performance.mjs` | Bounded synthetic requests, warm-up, p50/p95/error rate, dataset/run metadata |
| `scripts/lib/phase-08-system-test.mjs` | Chuẩn hóa case ID, counts, identity, scan result và fail-closed summary |
| `scripts/generate-phase-08-system-test-summary.mjs` | Tổng hợp Playwright JSON thành System Test summary theo contract |
| `scripts/verify-phase-08-staging-identity.mjs` | Đối chiếu provider/runtime/source deployment URL, revision, commit và immutable digest |
| `scripts/create-phase-08-scan-summary.mjs` | Tổng hợp dependency/IaC/redaction checks, checksum và retention metadata |

Không thêm dependency mới nếu Node/Playwright hiện tại đáp ứng. Nếu thêm package, phải audit, lockfile và license review.

## 4. Production Terraform

`infrastructure/terraform/environments/production/main.tf` phải đạt parity có chủ đích với Staging nhưng không copy secret/value:

- `provision` nhận từ biến/approved workflow, mặc định `false`.
- Cloud Run service riêng, service account riêng, WIF condition chỉ cho protected `main` và workflow được phép.
- Secret IDs Production riêng; runtime chỉ nhận secret version alias/number, không nhận plaintext.
- Runtime vars tối thiểu: `APP_ENV=production`, `NODE_ENV=production`, `PORT=8080`, commit/build/image identity, exact CORS/public URL và proxy settings.
- MongoDB database/user Production demo riêng; không dùng Staging URI.
- Monitoring, uptime, alert policy, notification route và labels theo release ID.
- Output an toàn: service URL, revision, service account, image digest; không output secret value.
- Public invoker chỉ bật nếu profile yêu cầu public demo và được plan policy cho phép.

Terraform checks: `fmt`, `init -backend=false`, `validate`, plan with approved variables, policy check for destroy/public IAM/cross-environment reference, then approved apply.

## 5. GitHub Actions

### `phase-08-system-test.yml`

- Trigger `workflow_dispatch` với release ID, full commit SHA, immutable digest, Staging revision/URL và exact source workflow run IDs.
- Verify caller inputs against stable deployment record.
- WIF provider `staging-cloud-tests` chỉ admit exact `workflow_ref` của `cloud-e2e.yml` và `phase-08-system-test.yml` trên `refs/heads/main`; không dùng actor hoặc wildcard làm trust anchor.
- Identity `ml-e2e-staging` chỉ có `roles/run.viewer` trên service `microlearning-staging` để đọc metadata phục vụ identity reconciliation; không cấp role này ở project scope.
- Run dedicated System Test, P0/negative API coverage, dependency/IaC checks and redaction scan.
- Upload raw + summary artifacts with bounded retention.

Accessibility, responsive and performance evidence are added by Part 05; they are intentionally not claimed by Part 03.

### `promote-production.yml`

- Modes: `PLAN_ONLY` and `APPLY`; default `PLAN_ONLY`.
- `APPLY` job requires exact G5 GO record, UAT/System Test Pass, protected `production` environment and WIF.
- Build is forbidden; workflow promotes the exact Staging digest.
- Apply the reviewed plan, capture revision/URL/traffic, run production smoke, and fail closed on identity mismatch.
- Preserve previous revision/digest; automatic traffic shift or rollback follows the runbook.

### CI integration

- Phase 08 contract tests belong in required `Lint, test and build`.
- Cloud/system workflows are release gates, not required on every source PR unless secrets/environment exist.
- No workflow may accept a free-form secret or MongoDB URI as an input.

## 6. Evidence layout

```text
artifacts/phase-08/<release-id>/
  identity/
  system-test/
  uat/
  security-performance/
  production-plan/
  deployment/
  observation/
  handover/
  exit/
```

Every final JSON record includes `schemaVersion`, `phase`, `releaseId`, `releaseIdentity`, `actor`, `recordedAtUtc`, `status`, `evidenceIds` and `redactionReviewed` where applicable.

## 7. Pull request boundaries

| PR | Scope | Merge condition |
| --- | --- | --- |
| P08-PR00 | Documentation baseline, profile, corrected contracts | contract tests + document consistency |
| P08-PR01 | G0/G1 scripts and evidence foundation | negative/positive CLI tests |
| P08-PR02 | System Test/performance/accessibility automation | local/staging dry run |
| P08-PR03 | UAT runner, data and defect workflow | catalog completeness + redaction |
| P08-PR04 | Production Terraform readiness | fmt/validate/plan/policy only |
| P08-PR05 | Protected APPLY/promotion | G5 GO prerequisite and environment protection |
| P08-PR06 | Post-release/operations/exit | smoke, observation, rollback and final contracts |
