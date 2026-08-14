# GitHub Actions CD Design

## 1. Mục tiêu

Mở rộng CI hiện hữu thành chuỗi CD có kiểm soát, build một lần, deploy exact digest và lưu evidence máy đọc
được. CD không được làm giảm bất kỳ quality gate nào của Phase 01-06.

## 2. Workflow inventory mục tiêu

| Workflow | Trigger | Environment | Chức năng |
| --- | --- | --- | --- |
| `ci.yml` | PR, push main | none | quality, audit, Mongo integration, OpenAPI, browser E2E, secret scan |
| `infrastructure-plan.yml` | PR/path filter, manual | none/Staging read-only | fmt, validate, security scan, plan summary |
| `release-staging.yml` | successful main CI | `staging` through called deploy job | trusted orchestration from commit to stable Staging |
| `build-publish.yml` | reusable `workflow_call` | none | build, test image, scan, SBOM, push, digest record |
| `deploy-staging.yml` | reusable call/manual recovery | `staging` | Terraform apply digest, smoke, evidence, rollback on failure |
| `promote-production.yml` | manual only | `production` | Phase 08: promote verified digest after approval |
| `drift-check.yml` | schedule/manual | read-only | Terraform plan và drift alert |

Tên workflow/job phải ổn định vì branch protection và evidence tham chiếu theo tên.

## 3. Dependency graph

```text
PR -> CI + Terraform validation
merge main -> main CI
main CI success -> release-staging orchestrator
release-staging -> reusable build/publish exact commit
build output -> reusable deploy Staging exact digest
deploy success -> cloud smoke/E2E
smoke success -> Staging release record
Phase 08 manual Go/No-Go -> promote same digest Production
```

Một workflow không được dựa vào artifact từ untrusted PR để deploy.

## 4. Build/publish job contract

1. checkout exact main commit;
2. setup pinned Node/npm/Docker tooling;
3. verify commit đã có successful required CI run;
4. authenticate GCP bằng WIF;
5. configure Artifact Registry auth;
6. build Production image;
7. run container contract tests;
8. pre-push scan local image;
9. push immutable tag;
10. resolve registry digest;
11. scan/generate SBOM against exact registry digest and verify local/pushed identity;
12. generate signed/attested metadata nếu capability khả dụng;
13. upload release manifest artifact;
14. expose digest qua trusted workflow output.

Nếu dùng `workflow_run`, trigger phải giới hạn workflow CI đã chốt, event `completed`, branch `main` và chỉ
tiếp tục khi `conclusion == success`. Checkout/build dùng `workflow_run.head_sha`; job phải xác minh commit
thuộc protected `main` trước khi xin `id-token: write` hoặc push artifact.

`release-staging.yml` là workflow duy nhất dùng `workflow_run`; build/deploy logic nằm trong reusable
workflows để digest truyền bằng trusted job output trong cùng orchestration. Manual recovery vẫn phải nhận
release manifest ID/digest và chạy lại toàn bộ validation, không nhận tùy ý một tag.

## 5. Staging deployment job contract

1. nhận manifest từ build workflow và verify commit/digest;
2. bind GitHub environment `staging`;
3. authenticate bằng Staging WIF identity;
4. Terraform init/plan với exact image ref;
5. policy check plan;
6. apply;
7. lấy Cloud Run URL/revision từ outputs;
8. wait readiness;
9. chạy smoke và actor E2E;
10. xác minh version endpoint;
11. test monitoring signal tối thiểu;
12. ghi deployment record;
13. nếu post-deploy gate fail, thực thi rollback runbook và fail workflow.

## 6. Production workflow guard

Workflow được code/test structure trong Phase 07 nhưng actual apply chỉ Phase 08. Bắt buộc:

- `workflow_dispatch` với input digest/release record ID;
- protected `production` environment, protected `main` source và no-bypass policy;
- solo mode dùng confirmation input chính xác `PROMOTE_PRODUCTION`; required reviewer là
  `APPROVED_NA` cho đến khi có collaborator;
- verify digest đã từng Pass Staging;
- reject tag, unknown digest hoặc commit chưa thuộc main;
- plan summary trước manual decision/apply;
- concurrency lock để chỉ một Production deployment;
- post-deploy smoke và automatic/manual rollback path.

## 7. Concurrency and cancellation

- Staging deployment group chỉ cho một run active.
- Run mới có thể cancel pending/old Staging run trước apply; không cancel giữa apply theo cách làm state hỏng.
- Production không auto-cancel đang apply.
- Terraform state locking/back-end consistency phải được tôn trọng.

## 8. Permissions and secrets

- Global `contents: read`.
- Chỉ deploy jobs có `id-token: write`.
- Không dùng `pull_request_target` cho code checkout/deploy.
- Không echo secret/context đầy đủ.
- Environment secrets chỉ được cấp sau protection rules.
- Third-party Actions pin theo full commit SHA hoặc approved governance.

## 9. Failure behavior

| Điểm lỗi | Hành vi |
| --- | --- |
| main CI fail | không build/deploy |
| image test/scan fail | không push/promote hoặc đánh artifact invalid |
| Terraform plan policy fail | không apply |
| apply fail | fail + diagnostics redacted; không smoke |
| readiness/smoke fail | rollback prior digest, fail run |
| evidence upload fail | deployment không được đánh Pass |
| rollback fail | severity Critical incident và manual recovery |

## 10. Artifacts/evidence

Retention phải đủ cho review đồ án:

- release manifest;
- Terraform plan summary;
- SBOM và scan summary;
- smoke/JUnit/Playwright report;
- deployment record;
- rollback report nếu có;
- Cloud URL/revision/digest không chứa secret.

## 11. Required checks direction

PR required checks giữ nguyên CI quality gates. Với solo project, approval count là `0`, nhưng Pull Request,
branch up-to-date, conversation resolution, linear history, no-bypass và toàn bộ required checks vẫn bắt
buộc. CD Staging là post-merge deployment gate; Phase 08 release decision yêu cầu Staging
deployment/smoke mới nhất Pass. Không bắt workflow có Cloud secret chạy trên mọi untrusted PR.
