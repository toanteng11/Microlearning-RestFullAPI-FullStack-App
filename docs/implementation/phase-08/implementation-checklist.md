# Phase 08 — Implementation Checklist

## G0 — Handoff

- [ ] Chọn release profile và ghi `soloProject=true`, role assignments, scope/non-goals.
- [ ] Đối chiếu P07 `../phase-07/exit-report.md`, `../phase-07/phase-08-handoff.md`, `../phase-07/phase-exit-evidence.md` với raw artifacts.
- [ ] Ghi release ID, commit, image digest, revision, URL, workflow run; mismatch là `BLOCKED`.
- [ ] Handoff record hợp lệ bằng `node scripts/validate-phase-08-handoff.mjs <record.json>`.
- [ ] P07 residual risks, Atlas waiver và production `NO_GO` được carried forward.

## G1 — System Test/UAT Readiness

- [ ] UAT HTTPS URL, roles, synthetic data, cleanup và evidence store ready.
- [ ] Catalog 001-032, expected results, persona sessions và defect process ready.
- [x] `PRE_RELEASE`/`FINAL` contracts và corrected handoff validator đã Pass local tests; remote required check vẫn pending.
- [ ] Candidate identity trả về từ Staging khớp G0.

## G2–G4 — Test and closure

- [ ] `npm ci`; `npm run check:ci`; `npm run test:openapi`; cloud E2E/security nếu environment cho phép.
- [ ] Catalog rows có actor, exact identity, expected/actual, evidence, UTC status.
- [ ] Defect severity, retest, CR/waiver and residual risk updated.
- [ ] BA latency targets, axe/keyboard/focus và desktop/mobile P0 states được kiểm tra với methodology.
- [ ] `npm run operations:contract:test`, `observability:contract:test`, `promotion:contract:test`, `hardening:contract:test`, `exit:contract:test`, `handoff:contract:test` pass.

## G4-G5 — Production Readiness and Decision

- [ ] Production Terraform plan/identity/state/secret/database tách Staging; root `provision=false` chỉ đổi qua reviewed PR.
- [ ] Atlas database/user/network/backup/restore đáp ứng selected profile; managed PITR `APPROVED_NA` có decision nếu academic.
- [ ] Prior revision/digest, rollback owner, monitoring, alert route, quota và budget ready.
- [ ] `PRE_RELEASE` AC-001..010 Pass; Critical/High = 0; G5 decision khớp exact identity.

## G6-G8 — Release and closure

- [ ] Signed G5 decision; no production apply with `NO_GO` or unresolved blocker.
- [ ] Verify promotion uses digest (`@sha256:`), not `latest`; no rebuild.
- [ ] Production deployment record, smoke and traffic are actual or explicitly `NOT RUN`.
- [ ] T+0/T+15m/T+1h/T+24h/T+72h observation, incident/rollback decision and hypercare closure recorded.
- [ ] Support/training/comms acknowledged; evidence register and traceability complete.
- [ ] G8 final acceptance/exit report signed; residual follow-up has owner/date.
- [ ] `FINAL` AC-001..014 Pass; production status `ACTUAL`; clean-checkout validation complete.

## Evidence hygiene

- [ ] Không commit secret, token, password, full URI, private key hoặc real PII.
- [ ] Artifact paths có release ID; raw evidence immutable/retained theo policy.
- [ ] Mọi `PENDING`, `BLOCKED`, `APPROVED_NA` còn lại đều có disposition; không “Pass by default”.
