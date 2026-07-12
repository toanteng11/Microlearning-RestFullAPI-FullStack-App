# Evidence And Test Data Guidelines

## Mục Đích

Guideline này chuẩn hóa evidence cho QA, UAT, API, CI/CD, deployment, monitoring và recovery; đồng thời bảo vệ privacy khi tạo test data. Mục tiêu là đủ bằng chứng để review/retest/release mà không đưa password, raw token, secret hoặc Production PII vào BA repository/meeting notes.

## Nguyên Tắc Evidence

1. Evidence chứng minh một condition cụ thể: ID scenario/criterion, actual result, environment/build, actor role và thời điểm.
2. Một screenshot UI không đủ cho authorization/data mutation/DevOps result nếu API, AuditLog, health/version hoặc CI evidence mới chứng minh được backend behavior.
3. Evidence phải tối thiểu cần thiết, safe to share, có owner/location/retention rõ và link lại `AC/TS/FR/BR/Release` khi applicable.
4. BA folder chỉ chứa `.md`; binary evidence (screenshot/video/log/export) nên được lưu ở approved evidence system/location có access control, rồi link/reference an toàn từ record.
5. Không tạo evidence giả hoặc mark PASS khi execution chưa xảy ra. Dùng `NOT RUN`, `BLOCKED` hoặc `Pending Implementation Evidence` đúng trạng thái.

## Test Data Classification

| Classification | Cho phép dùng | Không cho phép / control |
| --- | --- | --- |
| Synthetic test data | Tài khoản/lớp/nội dung/điểm do team tạo, không gắn người thật. | Không dùng email/số điện thoại/Student ID thật. Ưu tiên domain `.test`. |
| Masked data | Data đã loại bỏ/mask định danh, chỉ dùng khi synthetic không đủ. | Cần authority/privacy review; không copy vào Local/CI/public evidence. |
| Production data | Chỉ dùng khi policy/authority cho phép cho incident/recovery cụ thể. | Không đưa vào BA repository, local laptop, CI fixture, screenshot chia sẻ rộng hoặc test thường ngày. |
| Sensitive security data | Secret, password, raw token, private key, connection URI. | Không dùng làm test evidence; dùng masked reference/secret ID/rotation record thay thế. |

## Test Data Minimum Set

| Data set | Mục đích / trạng thái cần có |
| --- | --- |
| Accounts | Synthetic `Student`, `Teacher`, `Admin`, Super Admin nếu feature có scope; `ACTIVE`, `PENDING`, `BLOCKED`, `INACTIVE` test state. |
| Invitation | Valid pending, accepted, expired, revoked, email-mismatch token state; raw invitation URL không lưu trong evidence. |
| Classroom / Enrollment | Active/archived Classroom, owner/non-owner, active/removed/left Student, Code/Link/policy enabled-disabled, duplicate/retry case. |
| Content / Deadline | Draft/published/archived Lesson, before/equal/after deadline, reset history/reason and affected To-do/read-model state. |
| Assessment | Quiz objective/manual path, Assignment submitted/missing/late/returned, private grade/feedback and retry/resubmit policy. |
| Reporting / Audit | Role-scope report/export request, audit event redacted, pagination/filter/sort data set. |
| Operations | Safe environment/config reference, known artifact version, health/version response, failed/success pipeline simulation where possible. |

## Evidence Type Matrix

| Situation | Minimum evidence |
| --- | --- |
| UI workflow | Scenario ID, role/account state, screenshot/video if useful, actual/expected, build/environment. |
| API contract / error | Swagger operation/schema plus safe request/response/status/error code and auth role; omit token/PII. |
| Authorization denial | Backend/API denial result and resource scope, not just hidden button. |
| Data mutation | UI/API result plus safe AuditLog/read-model/data verification; include idempotency/history result where relevant. |
| Deadline/grade/progress | Source event, derived To-do/summary/ranking/report state, history/audit and boundary/retry test. |
| CI/CD / deploy | Pipeline/build/artifact/commit/environment, health/version, smoke/monitoring/rollback target. |
| Backup/restore | Backup ID/time/scope, isolated target confirmation, rehearsal result, actual RPO/RTO observation and reviewer. |
| Defect/retest | Defect ID, original reproduction/evidence, fixed build, retest/regression result and closure decision. |

## Evidence Naming And Reference

Nếu evidence system cần tên file/record, dùng convention không chứa PII/secret:

```text
EVT-YYYYMMDD-<ENV>-<RELEASE_OR_BUILD>-<ARTIFACT>-<SCENARIO_OR_ID>-<RESULT>-NN
```

Ví dụ: `EVT-20260711-STAGING-REL-MVP-1-API-TS-INV-004-PASS-01`.

| Field | Quy tắc |
| --- | --- |
| `ENV` | `LOCAL`, `CI`, `DEV`, `STAGING`, `UAT`, `CLOUD`; không dùng tên/URL bí mật. |
| `RELEASE_OR_BUILD` | Release ID, semantic version, build/commit short reference được phép chia sẻ. |
| `ARTIFACT` | `UI`, `API`, `DATA`, `CI`, `DEPLOY`, `MONITOR`, `BACKUP`, `UAT`. |
| `SCENARIO_OR_ID` | `AC-*`, `TS-*`, `DOP-AC-*`, `DEF-*`, `INC-*` hoặc source ID phù hợp. |
| `RESULT` | `PASS`, `FAIL`, `BLOCKED`, `NOT-RUN`, `RETEST`. |

## Redaction Checklist

- [ ] Mask/redact password, raw JWT/refresh/invitation/reset token, secret, connection string, private key and cookie.
- [ ] Remove/blur real name, email, phone, Student ID, IP address or private submission/media unless explicit approved need exists.
- [ ] Do not expose full request body/query/log if it contains sensitive field; capture relevant status/code/requestId safely.
- [ ] Use synthetic account label/opaque ID in screenshot; crop unrelated browser tabs/notification/credential manager.
- [ ] Verify evidence location has access control; sharing link does not grant public access to sensitive content.

## Storage, Retention Và Access

| Evidence category | Access / retention direction |
| --- | --- |
| BA markdown, safe test execution summary | Project roles who need review; retain with project documentation/revision policy. |
| UAT screenshot/video/API response | QA/BA/PO/Technical roles; retain per UAT/release policy, then delete/limit if sensitive. |
| CI/CD/deployment/monitoring logs | DevOps/Technical/QA authorized; retain per operations/audit policy. |
| Backup/restore evidence | DevOps/Technical authorized only; retain record/reference, not raw backup dump in docs. |
| Security/incident evidence | Least privilege, Security/Technical/authority access; preserve chain/timeline and redact communication copies. |

## Quality Review Before Attach/Link

- [ ] Evidence maps to expected ID and shows environment/build/role/state.
- [ ] Actual result can be interpreted without hidden context; result status is accurate.
- [ ] Sensitive content is removed/masked and access is appropriate.
- [ ] For pass of a Must flow, required backend/data/operations evidence is included, not only UI happy path.
- [ ] Link works for intended reviewer and follows retention/access policy.
- [ ] Defect/retest/waiver/incident/release record is updated when evidence changes decision.

## Liên Kết

- UAT evidence: `../18-acceptance-criteria/uat-execution-and-signoff.md`.
- Traceability gap: `../19-traceability/traceability-gap-register.md`.
- Incident/release: `../20-risk-management/incident-management.md`, `../21-release-planning/release-entry-exit-criteria.md`.
- Documentation rules: `documentation-style-guide.md`.
