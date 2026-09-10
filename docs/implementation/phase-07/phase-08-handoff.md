# Phase 08 Handoff

## 1. Purpose

Bàn giao một Staging release candidate đã triển khai, có thể quan sát và phục hồi để Phase 08 thực hiện
System Testing, UAT, Go/No-Go và Production release.

## 1.1 Current Status

`PHASE 07 EXIT PASS REPORTED / PHASE 08 ACCEPTANCE PENDING`.

Handoff G0 chỉ được yêu cầu Phase 07 exit `PASS`, exact Staging identity/stable record, rollback reference,
residual risks và quyết định Production `NO_GO`. System Test/UAT, Production plan/Atlas readiness và G5
decision là outputs của Phase 08 nên không được dùng làm điều kiện đầu vào G0. Validator hiện tại phải được
sửa ở Phase 08 Part 01 trước khi handoff được accept.

## 2. Required Handoff Package

- exact release commit/image digest/Cloud Run revision;
- Staging URL và environment ownership;
- latest main CI, Staging CD, smoke/E2E reports;
- OpenAPI/Swagger URL/version;
- four synthetic role accounts distribution method, không ghi password;
- Terraform state/module/version and drift result;
- WIF/IAM/secret inventory đã redaction;
- Atlas environment/data/network limitation;
- monitoring dashboard/uptime/alert/runbooks;
- backup/restore/rollback rehearsal reports;
- residual risks/debt/exceptions;
- Production promotion workflow and approval controls.

## 3. Phase 08 Blocking Gates

Phase 08 Production Go phải là `NO_GO` nếu:

- Production Atlas tier/network/backup/PITR chưa đáp ứng approved RPO/RTO;
- real-data/privacy controls chưa được duyệt;
- UAT/System Test còn Critical/High defect;
- latest digest chưa Pass Staging;
- Production secret/identity/environment separation chưa hoàn tất;
- rollback/monitoring owner không sẵn sàng;
- budget/quota/domain/certificate decision bắt buộc chưa xong.

## 4. UAT Inputs

- role-based test matrix;
- course/lesson/assessment/reporting synthetic scenarios;
- expected status/deadline/grade/progress outcomes từ BA;
- known limitations và excluded capabilities;
- defect severity/triage process;
- sign-off template.

## 5. G0 Handoff Record

```text
release_id:
verified_staging_digest:
staging_deployment_record:
rollback_revision/digest:
phase_07_exit_decision:
production_decision: NO_GO
residual_risks:
accepted_by / accepted_at_utc:
```

System Test result, UAT sign-off, Production plan/Atlas readiness and Go/No-Go are added later to the Phase 08 G5 release pack, not to the G0 handoff contract.

## 6. Residual Constraints Expected

- Cloud Run `run.app` URL nếu custom domain Conditional không bật.
- Staging scale-to-zero và cold start được chấp nhận.
- Atlas Free Staging chỉ synthetic. Academic Production demo may share the physical cluster only with a separate database/user and an explicit profile decision; organization Production requires stronger isolation.
- Production workflow tồn tại nhưng chưa apply trong Phase 07.
- Feature Preview không trở thành hard dependency.

## 7. Acceptance

| Role | Decision | Date UTC | Evidence/notes |
| --- | --- | --- | --- |
| Phase 07 Technical Lead | Phase 07 report says `PASS`; verify raw evidence at G0 | Pending | Phase 07 exit report/artifacts |
| Phase 08 acceptance (solo owner acting as TL/PO) | Pending | Pending | `P08-EV-001` |
