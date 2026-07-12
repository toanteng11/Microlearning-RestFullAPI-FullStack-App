# Backup Restore And Disaster Recovery

## Mục Đích

Backup và restore bảo vệ dữ liệu khi database lỗi, thao tác nhầm, migration thất bại hoặc hạ tầng gặp sự cố. Disaster Recovery (DR) là kế hoạch khôi phục service/data có kiểm soát; nó không chỉ là “có một file backup”.

Tài liệu này áp dụng cho MongoDB, object storage/media policy, configuration reference và bằng chứng release. Chi tiết data retention xem thêm `../10-data-requirements/data-retention-privacy.md`; NFR availability/reliability xem mục 13.

## Data Protection Scope

| Asset | Criticality | Backup/recovery direction | Owner |
| --- | --- | --- | --- |
| MongoDB operational data | Critical | Managed snapshot/backup; cover account, Classroom, content, enrollment, progress, submission, grade, invitation, audit, settings | DevOps + Backend Lead |
| Object storage media/file | High khi upload trong release | Versioning/replication/lifecycle or documented backup policy; metadata/object consistency check | DevOps + Backend Lead |
| Runtime configuration/secret | Critical but not data backup | Secret store/provider recovery procedure; no secret value in repository/backup note | DevOps |
| IaC/source/CI definition | High | Version-controlled repository/remote state backup policy | DevOps + Technical Lead |
| Container image/release artifact | High for fast rollback | Registry retains current/prior stable release digest | DevOps |
| Log/Audit | Medium/High | Provider retention, audit data backup included in MongoDB scope | DevOps + Technical Lead |

## Backup Policy

| Environment | Frequency direction | Retention direction | Notes |
| --- | --- | --- | --- |
| Local | Optional/manual | Developer choice | Local data resettable; never treat as Production backup. |
| CI/Test | Not required persistent | Ephemeral | Test fixtures recreated each run. |
| Staging | Pre-demo/pre-risk-change snapshot; scheduled if data value requires | At least current + prior useful snapshots per cost/policy | Use synthetic/sanitized data when possible. |
| Production | Scheduled daily or provider plan; pre-release/pre-migration backup for risky change | According to RPO/retention/business/privacy policy | Automate/monitor backup success. |

Frequency/retention final values must be chosen after team states RPO, budget, data value and provider capability. The direction in NFR is Production RPO <= 24 hours or better; no document may promise a frequency not actually configured.

## RPO And RTO

| Metric | Meaning | MVP/Staging direction | Production direction |
| --- | --- | --- | --- |
| RPO | Maximum acceptable data loss measured in time | May lose data since last manual/pre-release backup | <= 24 hours or tighter after business decision |
| RTO | Target time to restore service/data | Same working day for important demo issue | 1-4 hours depending on SLA/provider/runbook |

RPO/RTO are service goals, not guarantees. DevOps must test restore and record actual duration before claiming readiness.

## Backup Runbook

```text
1. Confirm target environment and scope; never run Production action from assumption.
2. Check available storage/provider health and encryption/access policy.
3. Trigger or verify scheduled MongoDB snapshot/backup according to provider/runbook.
4. Record backup ID/name, timestamp, source environment, collection/media scope, operator/job and result.
5. Verify success signal without downloading/leaking data to insecure location.
6. Monitor backup failure alert and retain artifact per policy.
```

| Requirement | Rule |
| --- | --- |
| Access | Backup location private; only authorized operator/job can create/restore/delete. |
| Encryption | Use provider encryption in transit/at rest; protect backup credential/key. |
| Naming | Include logical environment/date/version but no personal data/secret. |
| Verification | Backup “created” is not enough; perform restore rehearsal regularly. |
| Pre-change | Before destructive/risky migration, confirm fresh backup and recovery plan. |
| Audit | Keep backup job/operator/result record and alert on failure. |

## Restore Runbook

```text
Incident or approved recovery request
  -> Declare restore owner and confirm target environment
  -> Identify backup ID/time and expected RPO data loss
  -> Prefer restore to isolated temporary/test target first
  -> Validate integrity and critical flows
  -> Approve cutover or controlled Production restore
  -> Perform restore, rotate/recheck credentials if needed
  -> Health/API/UI/data smoke test
  -> Record result, impact, actual RTO/RPO and follow-up
```

### Mandatory Restore Safeguards

- Type/write the target environment confirmation; do not use a copied connection string without review.
- Restore into isolated Staging/test instance first whenever incident time allows.
- Production restore needs Technical Lead/DevOps authorization and stakeholder communication according to severity.
- Do not restore Production data to Local/CI or share dump outside approved storage. Mask/approval is needed for any exception.
- Before overwrite/cutover, document current state/backup and data loss window; preserve evidence needed for incident analysis.
- After restore, run `health`, version, login, Student Classroom/To-do, Teacher course/ranking, Admin list and data count/sample integrity tests.

## MongoDB And Object Storage Consistency

MongoDB stores media metadata/object key while object storage holds binary. Recovery must consider both:

| Scenario | Recovery consideration |
| --- | --- |
| MongoDB restored older than storage | Metadata might not reference newest object; cleanup must not delete objects blindly. |
| Storage restored older than MongoDB | Metadata can point to missing file; detect/report controlled error and recover object if possible. |
| Orphan object | Validate owner/reference/age before cleanup; keep grace period and audit cleanup. |
| Backup excludes media | State explicitly in release/DR risk; user attachment/media may be unrecoverable. |
| Provider storage outage | API upload/download returns controlled failure; avoid writing metadata that claims successful object. |

## Disaster Recovery Scenarios

| Scenario | Immediate action | Recovery path |
| --- | --- | --- |
| Bad API deploy | Stop rollout, verify impact | Application rollback to prior digest; database unchanged if compatible. |
| Bad migration/data corruption | Stop mutation/deploy, preserve evidence | Forward-fix if safe; otherwise restore according to approved plan. |
| MongoDB outage | Health DOWN/DEGRADED, communicate | Provider/network/credential recovery; do not accept unsafe writes; restore only if data unavailable/corrupt. |
| Storage outage | Disable/fail upload safely | Check provider/policy/credential; retry/recover object, avoid orphan metadata. |
| Accidental delete | Freeze cleanup, identify scope/time | Restore snapshot/object version; validate referential consistency. |
| Secret compromise | Revoke/rotate first | Redeploy/restart with new secret, assess access/data impact; backup restore usually not first action. |
| Cloud account/region issue | Use provider escalation/architecture decision | Recreate from IaC/artifact/backup based on approved DR capability. |

## Restore Rehearsal Checklist

- Backup ID, source/target environment, operator, start/end time and expected data loss are recorded.
- Restore target is explicitly confirmed and isolated unless approved Production recovery.
- MongoDB connection/index/auth and collection counts/sample document integrity are checked.
- Critical business flows: login, Classroom/enrollment, content, Student To-do/progress, Teacher grade/deadline history, Admin invitation/audit work as expected.
- Media upload/download reference check is performed if media is in scope.
- Health/log/monitoring/backup alert return to normal; actual RTO/RPO gap and follow-up recorded.

## Acceptance Criteria

- Backup strategy covers required business collections and is private; no real backup in source repository.
- Restore procedure prevents wrong-environment destructive action and has been rehearsed at least before major demo/release.
- Latest stable artifact and IaC/config recovery directions are available in addition to data backup.
- Media/object storage recovery scope is explicit, not assumed.
- Backup/restore failure and recovery result have owner, record and alert/escalation direction.
