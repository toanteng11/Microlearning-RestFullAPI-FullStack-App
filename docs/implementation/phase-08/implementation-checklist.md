# Phase 08 — Implementation Checklist

## G0 — Handoff

- [x] Chọn release profile và ghi `soloProject=true`, role assignments, scope/non-goals.
- [x] Đối chiếu P07 `../phase-07/exit-report.md`, `../phase-07/phase-08-handoff.md`, `../phase-07/phase-exit-evidence.md` với raw artifacts.
- [x] Ghi release ID, commit, image digest, revision, URL, workflow run; mismatch là `BLOCKED`.
- [x] Handoff record hợp lệ bằng `node scripts/validate-phase-08-handoff.mjs <record.json>`.
- [x] P07 residual risks, Atlas waiver và production `NO_GO` được carried forward.

## G1 — System Test/UAT Readiness

- [x] UAT HTTPS URL, roles, synthetic data, cleanup và evidence store ready.
- [x] Catalog 001-032, expected results, persona sessions và defect process ready.
- [x] `PRE_RELEASE`/`FINAL` contracts và corrected handoff validator đã Pass required main checks.
- [x] Candidate identity trả về từ Staging khớp G0.

## G2–G4 — Test and closure

- [x] Candidate source workflows xác nhận locked install, CI, OpenAPI và Cloud E2E đều `success` trên exact commit.
- [x] Part 03 System Test rows có actor/tool, exact identity, expected/actual, evidence và UTC status.
- [x] Part 03 summary xác nhận Critical/High = 0, retry/flaky = 0; UAT defect closure vẫn thuộc Part 07.
- [x] Remote System Test run `35078334825` Pass và artifact `10438877244` lưu `P08-EV-010/015/016` trong 90 ngày.
- [x] BA latency targets, axe/keyboard/focus và desktop/mobile P0 states được kiểm tra với methodology; performance 5/5 và accessibility/responsive 5/5 Pass trên exact candidate.
- [x] `npm run operations:contract:test`, `observability:contract:test`, `promotion:contract:test`, `hardening:contract:test`, `exit:contract:test`, `handoff:contract:test` pass trong CI `35068954040`.

## G4-G5 — Production Readiness and Decision

- [x] Local Production Terraform parity, fail-closed readiness validator and Production-aware plan-policy tests pass.
- [x] Protected workflow remains plan-only and records exact digest/commit/plan hash without uploading plan binary or secret values.

- [ ] Production Terraform plan/identity/state/secret/database tách Staging; provision variables mặc định `false` và chỉ được workflow được review bật cho plan/apply đúng gate.
- [ ] Atlas database/user/network/backup/restore đáp ứng selected profile; managed PITR `APPROVED_NA` có decision nếu academic.
- [ ] Prior revision/digest, rollback owner, monitoring, alert route, quota và budget ready.
- [ ] `PRE_RELEASE` AC-001..010 Pass; Critical/High = 0; G5 decision khớp exact identity.
- [x] Part 09 generator/validator khóa G2/G3/G4, deployment window và checksum; local tests Pass.
- [ ] Chạy generator bằng actual G2/G3/G4 artifacts và lưu package `P08-EV-030`; không dùng fixture/test data làm evidence.

## G6-G8 — Release and closure

- [ ] Signed G5 decision; no production apply with `NO_GO` or unresolved blocker.
- [ ] Verify promotion uses digest (`@sha256:`), not `latest`; no rebuild.
- [ ] Production deployment record, smoke and traffic are actual or explicitly `NOT RUN`.
- [ ] T+0/T+15m/T+1h/T+24h/T+72h observation, incident/rollback decision and hypercare closure recorded.
- [ ] Support/training/comms acknowledged; evidence register and traceability complete.
- [ ] G8 final acceptance/exit report signed; residual follow-up has owner/date.
- [ ] `FINAL` AC-001..014 Pass; production status `ACTUAL`; clean-checkout validation complete.

## Evidence hygiene

- [x] Part 00-05 không commit secret, token, password, full URI, private key hoặc real PII; final redaction scan 35 file có zero findings.
- [x] Artifact paths Part 00-05 có release ID; workflow G2 cấu hình retention 90 ngày.
- [ ] Mọi `PENDING`, `BLOCKED`, `APPROVED_NA` còn lại đều có disposition; không “Pass by default”.
