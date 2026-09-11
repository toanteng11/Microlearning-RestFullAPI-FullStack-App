# Phase 08 — Final System Acceptance and Production Release

## Executive summary

Phase 08 là **final phase** của Microlearning Classroom LMS. Đây là phase kiểm chứng và phát hành, không phải phase phát triển feature. Mục tiêu là đưa release candidate của Phase 07 qua System Test, UAT, quyết định Go/No-Go, production release có kiểm soát, hypercare, bàn giao vận hành và đóng dự án bằng evidence có thể truy nguyên.

**Phase status:** `IMPLEMENTATION IN PROGRESS / PART 00-02 DONE / PART 03 LOCAL_PASS_REMOTE_PENDING`. G0/G1 đã được xác nhận bằng release candidate thực tế; System Test Part 03 đã Pass 6/6 Must scenarios trên Staging. Workflow và artifact retention trên GitHub vẫn phải chạy xanh trước khi Part 03 chuyển `DONE`; UAT, Production deployment và final sign-off chưa hoàn tất.

### Quy ước trạng thái

| Trạng thái | Cách hiểu bắt buộc |
|---|---|
| `BASELINE` | Sự thật được ghi trong codebase, BA hoặc Phase 01–07; vẫn phải kiểm tra tính phù hợp với release. |
| `PLANNED` | Thiết kế/ý định thực thi của Phase 08. |
| `PENDING` | Chưa có raw evidence; không được tính là Pass. |
| `ACTUAL` | Kết quả thực tế có ID/URL, timestamp UTC, actor và artifact/digest khi cần. |
| `BLOCKED` | Không thể tiếp tục; phải có owner, điều kiện gỡ và quyết định gate. |
| `APPROVED_NA` | Được authority phê duyệt không áp dụng; không đồng nghĩa `PASS`. |

## BASELINE đầu vào đã đối chiếu

- Root scripts cung cấp `npm run check:ci`, `npm run test:openapi`, `npm run test:e2e:cloud`, các contract tests, release-lineage, deployment, rollback, observability và Terraform validation.
- CI dùng Node/npm theo `package.json`, workflow `.github/workflows/ci.yml` và `npm ci`; Cloud baseline là Cloud Run, Artifact Registry, Secret Manager, Cloud Monitoring, GitHub Actions WIF và MongoDB Atlas.
- Phase 07 report **tự ghi nhận** `66/66` Must, image/revision/Staging URL và một số cloud run IDs. P08 xem đây là `BASELINE_REPORTED`, không chuyển thành P08 `ACTUAL` nếu chưa kiểm tra raw artifact và exact digest.
- `promote-production.yml` hiện đặt `PROMOTION_APPLY_MODE=PLAN_ONLY`; production apply thật chưa được suy ra từ workflow này.
- P07 ghi Atlas network waiver hết hạn `2026-09-13`; waiver cũ phải được thay bằng decision hiện hành. Với profile academic, Production demo chỉ dùng synthetic data, database/user riêng, logical backup và isolated restore; managed PITR có thể `APPROVED_NA` nhưng không được ghi `PASS`.

## Mục tiêu, phạm vi và non-goal

**In scope:** P07 handoff acceptance; exact digest lock; System Test/regression; UAT; defect/change control; Production readiness; immutable promotion; smoke/observation/hypercare; backup/restore/DR/rollback; support, training, communications; final acceptance và project exit.

**Out of scope:** feature nghiệp vụ mới, migration dữ liệu Production chưa được phê duyệt, Firebase/SMTP/Gmail/SSO/mobile/AI/payment, hoặc biến conditional capability thành Must không qua Change Control.

## Gate model G0-G8

| Gate | Quyết định | Điều kiện chính | Trạng thái hiện tại |
|---|---|---|---|
| G0 | Accept P07 handoff | Handoff record hợp lệ, identity và P07 exit được đối chiếu | `PASS` |
| G1 | Ready for System Test/UAT | Staging, personas, synthetic data, catalog và evidence workspace sẵn sàng; không phụ thuộc Production apply | `PASS` |
| G2 | System Test exit | Test technical/integration/security/NFR đã chạy trên exact candidate | `LOCAL_PASS_REMOTE_PENDING` |
| G3 | UAT exit | Must scenarios có kết quả và Product Owner decision | `PENDING` |
| G4 | Release readiness/closure | Critical/High đóng; Medium/Low có disposition; Production plan, separation và recovery ready | `PENDING` |
| G5 | Go/Conditional Go/No-Go | `PRE_RELEASE` AC-001..010 Pass; PO accountable; role recommendations recorded | `PENDING` |
| G6 | Production deployment | Exact digest, protected workflow/change, smoke và deployment record | `PENDING` |
| G7 | Observation/handover | T+0/T+15m/T+1h/T+24h/T+72h, support và recovery evidence | `PENDING` |
| G8 | Final acceptance/exit | `FINAL` AC-001..014 Pass; Production Actual; risks/follow-up và closure complete | `PENDING` |

Một gate `NO_GO` dừng các gate sau; không được dùng placeholder để mở gate.

## Document map

| Chủ đề | Tài liệu |
|---|---|
| Release profile | `release-profile-and-solo-governance.md` |
| Readiness review | `implementation-readiness-review.md` |
| Plan/scope/work | `phase-plan.md`, `scope-and-deliverables.md`, `work-breakdown-structure.md` |
| Execution/code map | `execution-parts/README.md`, `source-and-workflow-blueprint.md` |
| Governance/acceptance | `phase-08-governance-and-go-no-go.md`, `acceptance-criteria.md`, `ba-alignment-and-decisions.md` |
| Test/UAT/evidence | `system-test-and-uat-strategy.md`, `uat-test-catalog.md`, `uat-execution-matrix.md`, `test-and-evidence-contract.md` |
| Release/operations | `production-readiness-and-promotion.md`, `production-deployment-runbook.md`, `post-release-validation.md`, `observability-and-operations-handover.md` |
| Recovery/security | `backup-restore-and-disaster-recovery-final.md`, `rollback-and-incident-response-final.md`, `security-privacy-and-compliance-final.md`, `performance-capacity-and-cost-final.md` |
| People/change | `defect-and-change-management.md`, `support-and-maintenance-model.md`, `training-and-user-handover.md`, `release-communications.md` |
| Evidence/exit | `traceability-matrix.md`, `evidence-register.md`, `phase-exit-evidence.md`, `exit-report.md` |

## Definition of Done

- [ ] G0-G4 có decision record và raw evidence; không còn Must `NOT RUN`/`BLOCKED`.
- [ ] System Test/UAT dùng cùng exact commit, image digest và revision record.
- [ ] UAT sign-off và G5 decision có ID, actor, UTC timestamp; không giả lập independent approval cho solo project.
- [ ] G5 dùng `PRE_RELEASE` acceptance; G8 dùng `FINAL` acceptance, không còn phụ thuộc vòng tròn.
- [ ] Production readiness chứng minh state, service, secret, identity và database user/name tách Staging; recovery đúng selected profile.
- [ ] Production apply chỉ chạy sau exact G5 GO qua protected workflow; không ghi deployment thành công từ plan.
- [ ] Production smoke, observation, hypercare, handover, communications, training, exit evidence và follow-up đã lưu.
- [ ] Không có Critical/High defect hoặc security/privacy/data-integrity blocker; mọi exception có owner, expiry và waiver/CR.

## Blocking findings cần theo dõi

1. G0/G1 đã Pass cho `P08-RC-20260910-92cdc07`; nếu runtime behavior hoặc deployment identity đổi thì phải tạo candidate mới và chạy lại từ G0.
2. Source deployment record còn ghi revision `microlearning-staging-00012-qw2`; provider/runtime actual là `microlearning-staging-00013-6ns`. Reconciliation đã Pass vì URL, commit và image digest khớp, nhưng workflow Part 03 phải lưu record mới làm nguồn chuẩn.
3. Production Terraform root đang `provision = false`; production workflow là plan-only (`G4/G5`).
4. Mâu thuẫn `APPLY`/Production `ACTUAL` và vòng lặp G0/G5/G8 đã được sửa; protected workflow/G5 evidence vẫn pending.
5. Atlas/recovery decision phải theo selected profile; real data luôn là blocker với academic profile.
6. UAT execution/sign-off, defect closure, Production deployment và hypercare records đều `PENDING` cho đến khi execution tạo raw evidence.

## Executable Phase 08 controls

The repository provides strict JSON contracts for the acceptance/evidence pack,
release identity, System Test, UAT, Go/Conditional-Go/No-Go and G8 exit records:

```powershell
npm run phase-08:contract:test
npm run phase-08:handoff:validate -- <handoff.json> [report.json]
npm run phase-08:profile:validate -- <release-profile.json> [report.json]
npm run phase-08:release:init -- <release-profile.json> [artifact-root]
npm run phase-08:acceptance:validate -- <acceptance-evidence.json> [report.json]
npm run phase-08:identity:validate -- <identity.json> [other-record.json ...] [--report report.json]
npm run phase-08:system-test:validate -- <system-test-summary.json> [report.json]
npm run phase-08:uat:validate -- <uat-summary.json> [report.json]
npm run phase-08:decision:validate -- <go-no-go.json> [report.json]
npm run phase-08:exit:validate -- <exit-record.json> [report.json]
npm run phase-08:readiness:validate -- <readiness-pack.json> [report.json]
npm run phase-08:system-test:tooling:test
npm run test:e2e:phase-08
npm run phase-08:staging:verify -- <identity.json> <provider.json> <identity-report.json>
npm run phase-08:system-test:summary -- <identity.json> <playwright.json> <identity-report.json> <scan.json> <output.json>
npm run phase-08:scan-summary:create -- <identity.json> <release-artifact-root> <output.json>
```

Final `PASS`/`GO` records cannot contain placeholders and require actual evidence. Reports redact secret keys, MongoDB URIs, bearer credentials and private keys. The validator permits `APPLY` only in an actual protected Production/exit record with G5 decision provenance; the deployment workflow itself remains `PLAN_ONLY` until Part 09-10.

## Candidate G0/G1 đã xác nhận

| Thuộc tính | Actual |
|---|---|
| Release ID | `P08-RC-20260910-92cdc07` |
| Commit | `92cdc07051eace7062957c89b412bcbda920b254` |
| Staging URL | `https://microlearning-staging-bu73wlfj5a-as.a.run.app` |
| Ready revision | `microlearning-staging-00013-6ns` (100% traffic) |
| Image digest | `sha256:5cabccd99633e331160fbcae0df64cbfcb058090718d0ba6b9fe650aeefde981` |
| Source workflows | CI `34498334816`; Build `34498666885`; Deploy `34498961381`; Cloud E2E `34499272941` - cùng commit, `success` |
| Runtime checks | `/health`, `/ready`, `/api/v1/system/version` Pass và identity khớp |

Raw local evidence nằm trong `artifacts/phase-08/P08-RC-20260910-92cdc07/`. Thư mục này được ignore có chủ đích để không commit raw artifacts/secret-adjacent output; workflow `phase-08-system-test.yml` chịu trách nhiệm upload artifact với retention 90 ngày.
