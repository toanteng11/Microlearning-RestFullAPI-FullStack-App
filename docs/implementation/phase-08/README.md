# Phase 08 — Final System Acceptance and Production Release

## Executive summary

Phase 08 là **final phase** của Microlearning Classroom LMS. Đây là phase kiểm chứng và phát hành, không phải phase phát triển feature. Mục tiêu là đưa release candidate của Phase 07 qua System Test, UAT, quyết định Go/No-Go, production release có kiểm soát, hypercare, bàn giao vận hành và đóng dự án bằng evidence có thể truy nguyên.

**Phase status:** `IMPLEMENTATION IN PROGRESS / PART 00-05 DONE / PRODUCTION BOOTSTRAP VERIFIED / G2 PASS`. G0/G1 đã được xác nhận; release candidate `P08-RC-20260916-8489623` đã hoàn tất System Test và quality verification trên exact Staging identity. Workflow `35078334825` ghi nhận 6/6 Must System Test, 11/11 security/data checks, 5/5 accessibility/responsive screens và 5/5 performance categories Pass; Critical/High, retry và flaky đều bằng 0. Production IAM/WIF/state bootstrap đã được Apply trong boundary 14 resources và hậu kiểm `No changes`; không đọc secret value và chưa deploy Cloud Run. UAT, phần còn lại của Production-readiness, G5 package, protected Production APPLY, hypercare/handover and final-exit vẫn chờ evidence thực tế; G3-G8 chưa hoàn tất.

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
- `promote-production.yml` mặc định `PLAN_ONLY` và có đường `APPLY` fail-closed sau exact G5; sự tồn tại của code path không chứng minh Production đã được deploy.
- P07 ghi Atlas network waiver hết hạn `2026-09-13`; waiver cũ phải được thay bằng decision hiện hành. Với profile academic, Production demo chỉ dùng synthetic data, database/user riêng, logical backup và isolated restore; managed PITR có thể `APPROVED_NA` nhưng không được ghi `PASS`.

## Mục tiêu, phạm vi và non-goal

**In scope:** P07 handoff acceptance; exact digest lock; System Test/regression; UAT; defect/change control; Production readiness; immutable promotion; smoke/observation/hypercare; backup/restore/DR/rollback; support, training, communications; final acceptance và project exit.

**Out of scope:** feature nghiệp vụ mới, migration dữ liệu Production chưa được phê duyệt, Firebase/SMTP/Gmail/SSO/mobile/AI/payment, hoặc biến conditional capability thành Must không qua Change Control.

## Gate model G0-G8

| Gate | Quyết định | Điều kiện chính | Trạng thái hiện tại |
|---|---|---|---|
| G0 | Accept P07 handoff | Handoff record hợp lệ, identity và P07 exit được đối chiếu | `PASS` |
| G1 | Ready for System Test/UAT | Staging, personas, synthetic data, catalog và evidence workspace sẵn sàng; không phụ thuộc Production apply | `PASS` |
| G2 | System Test exit | Test technical/integration/security/NFR đã chạy trên exact candidate | `PASS` |
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
| Governance/acceptance | `phase-08-governance-and-go-no-go.md`, `pre-release-go-no-go-runbook.md`, `acceptance-criteria.md`, `ba-alignment-and-decisions.md` |
| Test/UAT/evidence | `system-test-and-uat-strategy.md`, `uat-test-catalog.md`, `uat-execution-matrix.md`, `test-and-evidence-contract.md` |
| Release/operations | `production-readiness-and-promotion.md`, `production-bootstrap-runbook.md`, `production-bootstrap-actual-evidence.md`, `production-deployment-runbook.md`, `post-release-validation.md`, `observability-and-operations-handover.md` |
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

1. G0/G1/G2 được thỏa mãn cho candidate `P08-RC-20260916-8489623`, khóa bằng exact commit, immutable digest, Staging revision và bốn workflow nguồn cùng commit.
2. Deployment, Cloud E2E, provider observation và runtime hiện cùng ghi `microlearning-staging-00028-wgq`; mọi thay đổi runtime/deployment identity tiếp theo phải tạo candidate mới và chạy lại các gate bị ảnh hưởng.
3. Production Terraform provision variables mặc định `false`; workflow hiện tại chỉ bật chúng để tạo plan tại `G4/G5`, không apply.
4. Mâu thuẫn `APPLY`/Production `ACTUAL` và vòng lặp G0/G5/G8 đã được sửa; protected workflow/G5 evidence vẫn pending.
5. Atlas/recovery decision phải theo selected profile; real data luôn là blocker với academic profile.
6. UAT execution/sign-off, Production readiness, defect closure, Production deployment và hypercare records đều `PENDING` cho đến khi execution tạo raw evidence.
7. Production bootstrap đã hoàn tất thực tế: 14 IAM/WIF/state resources được Apply, read-only verification Pass và post-apply plan `No changes`; secret/database/recovery/observability vẫn là blocker của G4.

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
npm run phase-08:pre-release:sources:verify -- <identity.json> <system-test.json> <uat.json> <production-readiness.json> <plan-only.json> <report.json>
npm run phase-08:pre-release:generate -- <identity.json> <system-test.json> <uat.json> <production-readiness.json> <evidence-index.json> <decision-request.json> <output-directory>
npm run phase-08:pre-release:verify -- <pre-release-acceptance.json> <go-no-go-decision.json> <g5-decision-lock.json>
npm run phase-08:pre-release:tooling:test
npm run phase-08:exit:validate -- <exit-record.json> [report.json]
npm run phase-08:readiness:validate -- <readiness-pack.json> [report.json]
npm run phase-08:system-test:tooling:test
npm run test:e2e:phase-08
npm run phase-08:staging:verify -- <identity.json> <provider.json> <identity-report.json>
npm run phase-08:system-test:summary -- <identity.json> <playwright.json> <identity-report.json> <scan.json> <output.json>
npm run phase-08:scan-summary:create -- <identity.json> <release-artifact-root> <output.json>
```

Final `PASS`/`GO` records cannot contain placeholders and require actual evidence. Reports redact secret keys, MongoDB URIs, bearer credentials and private keys. The validator and workflow permit `APPLY` only through the protected Production path with exact G5 decision provenance; default execution remains `PLAN_ONLY` and no actual apply is inferred from tooling completion.

## Candidate G0/G1/G2 đã xác nhận

| Thuộc tính | Actual |
|---|---|
| Release ID | `P08-RC-20260916-8489623` |
| Commit | `8489623b41d1603bbbe0693749b5fa31cabfad10` |
| Staging URL | `https://microlearning-staging-bu73wlfj5a-as.a.run.app` |
| Ready revision | `microlearning-staging-00028-wgq` (100% traffic) |
| Image digest | `sha256:1c3d8b3f0c9d768e1bafdb0414ae9a929189fdd3b503a2d4a4a7ec4c2c98db6b` |
| Source workflows | CI `35068954040`; Build `35069210543`; Deploy `35069452869`; Cloud E2E `35069714047` - cùng commit, `success` |
| System Test/G2 | Run `35078334825`; 6/6 Must, security/data 11/11, UI 5/5, performance 5/5 Pass; retry/flaky/Critical/High = 0 |
| Runtime checks | `/health`, `/ready`, `/api/v1/system/version`, provider image/commit/revision và 100% traffic đều khớp |

Raw evidence nằm trong GitHub artifact `phase-08-system-test-P08-RC-20260916-8489623` của [run `35078334825`](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/35078334825) (artifact ID `10438877244`, digest `sha256:5e420a4329b31e361d880bbdbd4aa7225444a0736b2ccc84de0f5b4d3ae72332`, hết hạn `2026-12-15T09:14:59Z`). Final redaction scan đã kiểm tra 35 file và không có finding. Thư mục local `artifacts/phase-08/<release-id>/` được ignore có chủ đích để không commit raw artifacts/secret-adjacent output.
