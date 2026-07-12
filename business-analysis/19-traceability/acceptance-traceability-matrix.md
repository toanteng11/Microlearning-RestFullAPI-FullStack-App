# Acceptance Traceability Matrix

## Mục Đích

Matrix này nối Acceptance Criteria với Business Rule, Test Scenario, UAT/quality gate và evidence owner. Nó bảo đảm criterion Must có cách kiểm thử cụ thể và evidence release không bị quên.

## Acceptance Coverage Matrix

| Acceptance group | Criteria | Primary rules/requirements | Scenario / UAT evidence | Quality / release evidence | Owner | Coverage |
| --- | --- | --- | --- | --- | --- | --- |
| Authentication and access | AC-AUTH-001 to 006 | FR-001/002/004/005, BR-001A to 001C/036 to 040/098 | TS-001/001A/001B/002/028; UAT registration/account/role flow | SEC-AC-003/004, API-AC-003, Swagger/auth log | QA Lead + Backend Lead | Covered; execution pending |
| Teacher Invitation | AC-INV-001 to 003 | FR-006 to 008, BR-010 to 014C/042 to 049 | TS-INV-001 to 020; UAT invitation flow | SEC-AC-001/002/005/010, Audit evidence | QA Lead + Admin owner | Covered; execution pending |
| Classroom join | AC-JOIN-001 to 003 | FR-001/002/021 to 025, BR-001/001B/001C/017 to 019/050 to 057 | TS-001B/005/006/024/025; UAT Class Code/Invite Link | API-AC-004, DATA-AC-002, SEC-AC-003 | QA Lead + Backend Lead | Covered; execution pending |
| Content visibility/lifecycle | AC-CNT-001/002 | FR-026 to 038, BR-058 to 068 | TS-010/015/026/032; Teacher/Student UAT | API-AC-004, SEC-AC-009, UI-TEA-002 | QA Lead + Frontend/Backend | Covered; execution pending |
| Learning progress/Course completion | AC-LRN-001/002 | FR-049 to 059, BR-005/006/069 to 074 | TS-008/012/027; Student UAT | DATA-AC-004, UI-STU-001/002, report reconciliation | QA Lead + Backend Lead | Covered; execution pending |
| Deadline and exception | AC-DLN-001 to 003 | FR-030/056, BR-035/061/071/075 to 080 | TS-018 to 020; Teacher UAT | DATA-AC-005, UI-TEA-003, audit/rebuild evidence | QA Lead + Backend/Frontend | Covered; execution pending |
| Quiz and assessment | AC-ASM-001 to 003 | FR-036 to 041, BR-083 to 088 | TS-009/015; Student/Teacher UAT | DATA-AC-006, SEC-AC-009, UI-TEA-004 | QA Lead + Backend Lead | Covered; execution pending |
| Assignment/grading/privacy | AC-ASM-004 to 006 | FR-042 to 048/055, BR-089 to 096 | TS-021 to 023, TS-GC-003 to 010 | DATA-AC-007/008, SEC-AC-004/010, UI-TEA-005 | QA Lead + Backend Lead | Covered; execution pending |
| Student/Teacher dashboard | AC-DASH-001/002 | FR-027/049/050/060/061/063, BR-029/033/034/070/081 | TS-011 to 017; Student/Teacher UAT | UI-STU-001/002/006, UI-TEA-001/006, performance baseline | QA Lead + Frontend Lead | Covered; execution pending |
| Admin governance | AC-ADM-001/002 | FR-009 to 019, BR-020 to 028/097 to 104 | TS-029/030/033; Admin UAT | SEC-AC-010/011, DATA-AC-009, UI-ADM-001/003 | QA Lead + Backend Lead | Covered; execution pending |
| Reporting/export | AC-RPT-001/002 | REP-011 to 020, BR-105 to 110 | TS-031; Admin/Teacher report UAT | SEC-AC-012, DATA-AC-010, UI-ADM-004 | QA Lead + Backend/DevOps | Covered; execution pending |
| API and data contract | AC-API-001 to 003, AC-DATA-001 | FR-064 to 069, BR data/audit rules | TS-034/036, API/data test execution | API-AC-001 to 009, DATA-AC-001 to 010, OpenAPI JSON/Swagger UI/exposure evidence | QA Lead + Backend Lead + DevOps | Covered; execution pending |
| Security and privacy | AC-SEC-001/002 | NFR-SEC/PRV, BR-010/014/044/102/103 | TS-INV-011/016, TS-023/028/031 to 033/037/038 | SEC-AC-001 to 015, security gate | Security reviewer + QA | Covered; execution pending |
| DevOps/release | AC-OPS-001/002 | FR-070 to 075, NFR availability/reliability | TS-035, UAT release check | DOP-AC-001 to 018, CI/CD/health/version/rollback | DevOps + QA | Covered; execution pending |

## Evidence Status Rule

| Evidence type | When accepted |
| --- | --- |
| Automated test | Test ID/result linked to commit/build, with pass/fail and relevant data environment. |
| Manual QA/UAT | Execution record with tester/date/build/precondition/actual/evidence/status. |
| API contract | Swagger/OpenAPI plus request/response/negative authorization evidence. |
| Data integrity | Safe database/read-model/audit/reconciliation result. |
| Security | Negative attack/authorization/token/file/export test and log/config review. |
| DevOps | CI run, artifact/version, health/version/smoke/monitoring/backup/rollback reference. |

`Covered; execution pending` becomes `Verified` only after actual execution evidence is linked in test/UAT/release tooling. Do not change status by document review alone.

## UAT Sign-off Trace

| Sign-off decision | Required trace state |
| --- | --- |
| Go | Must groups verified, no Critical/High open, DOP/security/data evidence linked. |
| Conditional Go | Waiver ID for each unmet allowed criterion, owner/mitigation/expiry/release note linked. |
| No-Go | Blocked/failed Must criterion, security/data risk or missing release evidence traced to owner/action. |

## Liên Kết

- Acceptance package: `../18-acceptance-criteria/`.
- Defect/waiver: `../18-acceptance-criteria/defect-waiver-management.md`.
- Release evidence: `../15-devops-deployment/release-management.md`.
