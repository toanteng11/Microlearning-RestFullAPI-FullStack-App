# Part 10 - Staging Deployment CD

## Implementation Status

`LOCAL_PASS_REMOTE_PENDING` ngày `2026-08-17`. Workflow/contract/Terraform source đã Pass local; exact
Staging apply, smoke, deployment record và rollback evidence trên Cloud vẫn Pending.

## Goal

Tự động promote exact build digest lên Staging bằng Terraform, chạy post-deploy gates và rollback khi fail.

## Parent PR

`P07-PR04 - Build Publish And Staging CD`

## Dependencies

- Part 08 first deploy stable.
- Part 09 release manifest available.

## Work

1. bind workflow to GitHub `staging` environment;
2. verify manifest/main CI/digest lineage;
3. add single-environment concurrency lock;
4. WIF auth and Terraform init/plan/apply;
5. policy-check plan and exact image ref;
6. capture outputs/revision/URL;
7. wait readiness/version match;
8. trigger smoke suite;
9. publish deployment record/evidence;
10. mark stable only after all gates;
11. invoke rollback path on Must failure;
12. add manual recovery/re-run input validation.

## Validation

- successful main build reaches Staging without manual credential;
- mutable/unknown digest rejected;
- failed readiness/smoke does not mark stable;
- apply/evidence failures fail workflow;
- post-apply drift clean.

## Evidence

`P07-EV-019..020`, workflow chain, deployment/rollback records.

## Stop Conditions

- concurrent apply to same state;
- tag deployment;
- workflow can target Production;
- failed smoke still returns success.

## Definition Of Done

- AC-038..043 Pass;
- P07-PR04 merged, main CI and first automated Staging chain Pass.

## Implemented Source

- `.github/workflows/deploy-staging.yml` chỉ nhận successful `Build And Publish` run từ cùng repository và
  protected `main`, hoặc manual recovery trỏ đúng successful build run ID;
- download artifact theo exact upstream run ID, kiểm tra release provenance, checksum, full SHA và immutable
  digest trước khi WIF authentication;
- Terraform tạo exact reviewed plan, chạy policy gate, apply chính plan đó, chặn concurrent Staging apply và
  kiểm tra post-apply drift;
- exact secret version phải là GitHub repository variable dạng số và trạng thái Secret Manager phải
  `ENABLED`; plaintext không đi qua Terraform input;
- chạy idempotent private seed Job bằng exact deployed image rồi mới chạy HTTPS/version smoke;
- deployment record lưu commit, digest, revision, service URL, secret versions, build/deploy run IDs và
  evidence checksums ở trạng thái `CANDIDATE`;
- nếu post-apply gate fail và có revision cũ, workflow trả `100%` traffic về revision cũ và vẫn kết thúc
  failed; lần deploy đầu tiên không giả lập rollback khi chưa có prior revision.

## Remote Completion Gates

1. Part 08 first deployment và exact GitHub variables đã sẵn sàng;
2. `Build And Publish` artifact Pass;
3. `Deploy Staging` plan/apply/seed/smoke/drift Pass;
4. artifact `phase-07-staging-deployment` có candidate record đúng lineage;
5. chạy negative recovery với invalid run ID/digest và xác nhận fail trước apply;
6. rehearsal rollback được đóng ở Part 14, không đánh dấu Pass chỉ từ source path.
