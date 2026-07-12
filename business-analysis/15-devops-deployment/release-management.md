# Release Management

## Mục Đích

Release Management kiểm soát việc một build đã deploy trở thành phiên bản được phép sử dụng bởi người dùng. Nó kết nối scope/acceptance criteria với CI/CD, QA/UAT, approval, communication, monitoring và rollback để release không chỉ là một thao tác kỹ thuật.

## Release Vocabulary

| Term | Ý nghĩa trong dự án |
| --- | --- |
| Build | Kết quả compile/package từ một commit. |
| Artifact/Image | Output immutable versioned/digest có thể deploy. |
| Release Candidate (RC) | Artifact đã pass CI và được deploy Staging để QA/UAT. |
| Deployment | Hành động đưa artifact lên một environment. |
| Release | Quyết định cho artifact/deployment được dùng cho audience mục tiêu. |
| Hotfix | Sửa lỗi ưu tiên cao sau release; vẫn phải qua CI/trace/verification phù hợp. |
| Rollback | Quay application artifact/config về prior stable state; không mặc định restore data. |

## Release Lifecycle

```text
Scope freeze / backlog selection
  -> implementation + code review
  -> CI quality pass + immutable artifact
  -> Staging deployment
  -> QA regression + UAT + NFR/DevOps gate
  -> release readiness review
  -> approval and scheduled/controlled Production deploy
  -> post-release smoke + monitoring window
  -> release complete or incident/rollback/forward-fix
```

## Release Types

| Type | Ví dụ | Approval / test direction |
| --- | --- | --- |
| Feature release | Student To-do, Teacher ranking, Admin list feature | Full affected functional/API/UI/regression/DevOps gate. |
| Maintenance release | Dependency patch, logging improvement | Risk-based regression/security scan; release note. |
| Hotfix | Login/API outage, critical authorization defect | Expedited but CI, review, Staging smoke and Production verification remain mandatory. |
| Configuration release | CORS/domain/feature flag/secret rotation | Config review, environment health/role smoke, rollback config plan. |
| Data/migration release | New index/field, summary rebuild | Migration compatibility/backup/rollback-forward plan and data validation. |

## Release Readiness Checklist

| Area | Required evidence | Owner |
| --- | --- | --- |
| Scope | Release ID, included/excluded requirements/known issues | Product Owner + BA |
| Source | PR/code review, commit SHA, protected branch status | Technical Lead + Developer |
| Artifact | Frontend/backend version/tag/digest and registry scan result | DevOps |
| Functional QA | Critical Student/Teacher/Admin test and regression result | QA Lead |
| API/Data | Swagger/API contract, DB/index/migration/read model impact reviewed | Backend Lead |
| Security | RBAC/object access/secret/upload/auth impact test as applicable | Technical Lead + QA |
| NFR/DevOps | Health, version, CORS, SPA fallback, Docker/CI, monitoring | DevOps + QA |
| Data protection | Backup/pre-release decision, restore/rollback/forward-fix plan | DevOps + Technical Lead |
| Operations | Alert/log/dashboard/release owner/on-call or response contact | DevOps |
| Approval | QA/UAT/Technical Lead/PO approval per release policy | Assigned approvers |

Must-quality gates from `../13-non-functional-requirements/nfr-quality-gates.md` cannot be silently waived. A waiver needs risk, reason, owner, mitigation, expiry and approver in release record.

## Release Approval Matrix

| Release risk | Minimum approval | Examples |
| --- | --- | --- |
| Low | Technical Lead + QA confirmation | UI copy/non-critical fix without API/data/security change. |
| Medium | Technical Lead + QA Lead + DevOps | Feature/API/config/change to Staging/Production without destructive data change. |
| High | Product Owner + Technical Lead + QA Lead + DevOps | Auth/RBAC, migration, storage, deadline/grade calculation, Production platform change. |
| Emergency security/outage | Technical Lead + DevOps immediate; PO informed | Active data/security incident, API unavailable. Post-incident review mandatory. |

## Production Release Window And Controls

- Chọn release window có DevOps/Technical Lead/QA contact và đủ thời gian quan sát/rollback, tránh thời điểm không có người xử lý cho high-risk release.
- Freeze concurrent high-risk deploy/migration khi release đang chạy; dùng CI/CD concurrency/protected environment.
- Confirm exact artifact digest/version, target environment, secret/config version/reference và migration state trước deploy.
- Tạo pre-release backup/snapshot theo risk; không tự coi backup cũ là đủ.
- Thông báo impacted stakeholder nếu có downtime, migration, feature flag, known limitation hoặc user action cần biết.
- Sau deploy, giữ monitoring window; release chỉ complete khi health/smoke/metric không có regression rõ.

## Release Note Template

```text
Release ID / Version:
Environment:
Date/time and release window:
Frontend artifact version/digest:
Backend artifact version/digest:
Commit SHA / pipeline run:

Included changes:
Known issues / excluded scope:
API/data/migration/config impact:
Security/privacy impact:
Backup reference and recovery plan:
Smoke test and monitoring result:
Approvals:
Rollback target / criteria:
Release owner and communication channel:
```

Release note không chứa secret, database URI, raw token hoặc PII.

## Post-Release Verification

| Check | Requirement |
| --- | --- |
| Identity | `/api/v1/system/version` and frontend version show expected artifact/environment. |
| Availability | `/health` status and runtime healthy instance count are normal. |
| Core flow | Login and representative Student To-do, Teacher Course Dashboard, Admin role-specific list pass. |
| Change-specific flow | Invitation, Classroom join, deadline reset, grading, upload/media or changed feature pass. |
| Security | CORS/HTTPS/auth/authorization behavior unchanged; no secret/error stack leak. |
| Observability | Logs/metrics/error tracking receive events; no unexpected 5xx/latency/restart. |
| Data | Migration/index/read model/backup result checked as applicable. |
| Communication | Release status/known issue/incident path documented. |

## Hotfix Policy

Hotfix may shorten approval/QA scope only after Technical Lead assesses risk. It must still have:

- A traceable commit, code review where possible, CI result and immutable artifact.
- A minimum Staging or isolated verification proportionate to urgency.
- Defined Production smoke/monitoring and prior stable rollback target.
- Incident/reference, release note and follow-up regression test/root cause action.

“Nóng” không phải lý do để deploy code chưa build/test/trace hoặc bypass secret/data safety.

## Release Closure

Release owner closes release after post-release monitoring window ends without unresolved release-blocking issue, or after incident/rollback decision is recorded. Closure records actual version, timing, outcome, known issue, metric/alert observation, and tasks for lessons learned.

## Liên Kết

- Pipeline: `ci-cd-pipeline.md`.
- Quality gates: `../13-non-functional-requirements/nfr-quality-gates.md`.
- Operations/recovery: `observability-operations.md`, `rollback-strategy.md`, `backup-restore-disaster-recovery.md`.
