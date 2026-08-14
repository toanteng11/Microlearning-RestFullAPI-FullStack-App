# Phase 08 Handoff

## 1. Purpose

Bàn giao một Staging release candidate đã triển khai, có thể quan sát và phục hồi để Phase 08 thực hiện
System Testing, UAT, Go/No-Go và Production release.

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

## 5. Production Promotion Inputs

```text
release_id:
verified_staging_digest:
staging_deployment_record:
system_test_result:
uat_signoff:
go_no_go_decision:
production_terraform_plan:
production_atlas_readiness:
rollback_revision/digest:
approvers:
```

## 6. Residual Constraints Expected

- Cloud Run `run.app` URL nếu custom domain Conditional không bật.
- Staging scale-to-zero và cold start được chấp nhận.
- Atlas Free Staging chỉ synthetic; không chuyển nguyên cluster thành Production.
- Production workflow tồn tại nhưng chưa apply trong Phase 07.
- Feature Preview không trở thành hard dependency.

## 7. Acceptance

| Role | Decision | Date UTC | Evidence/notes |
| --- | --- | --- | --- |
| Phase 07 Technical Lead | Pending | Pending | Pending |
| QA/UAT Owner | Pending | Pending | Pending |
| DevOps/Release Owner | Pending | Pending | Pending |
| Product Owner | Pending | Pending | Pending |
