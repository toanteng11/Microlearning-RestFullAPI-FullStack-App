# Phase 02 Traceability Matrix

## 1. Requirement To Implementation

| BA source | Capability | P02 tasks | API/UI | Acceptance/Test |
| --- | --- | --- | --- | --- |
| FR-001, US-AUTH-002/004/005 | Login/refresh/logout | T031..T033, T039..T042 | auth endpoints, Login/AuthProvider/multi-tab coordinator | AC-004/007/008/009/038; E2E-AUTH-01/02 |
| FR-002, UC-001, TS-001/001A | Student registration | T030/T043 | `/auth/register`, `/register` | AC-001/002/003 |
| FR-003 | Forgot/reset password | Conditional backlog P02-ADR-013 | Not baseline endpoint | Không claim complete |
| FR-004, BR-015/036/037 | Account status | T027/T035/T050/T053 | status API, guards | AC-006/016/017 |
| FR-005, RBAC matrix | RBAC/permissions/profile | T026/T027/T034/T041 | `/users/me`, protected/role route | AC-010..012 |
| FR-006, US-ADM-005/031/032 | Create/copy invitation | T055/T056/T059 | Admin invitation API/UI | AC-019..022/037 |
| FR-007, UC-051 | Teacher activation | T057/T058/T060 | public preview/accept UI/API | AC-023..025 |
| FR-008, US-ADM-006/007 | Invitation lifecycle | T056/T061 | list/detail/revoke | AC-024/026 |
| FR-009/A/B/C, AC-ADM-001 | Role-specific lists | T047..T054 | three Admin list APIs/UI | AC-013..015/018 |
| FR-010, BR-009/038/098 | Role governance | T018/T051/T053/T054 | role mutation API/UI + SystemGuard | AC-017/039 |
| FR-064 | Pagination/filter/sort | T047/T048/T052 | Admin lists | AC-014 |
| FR-065 | Standard errors | T005/T029/T064 | all P02 endpoints | AC-028 |
| FR-067/067A | Swagger/OpenAPI | T064 | OpenAPI/Swagger UI | AC-027 |
| FR-069, NFR-SEC-010 | Audit | T017/T050/T051/T055..T058 | Audit service/data | AC-016/020/023/026 |
| NFR-SEC-001/011 | Password policy/hash | T021/T030/T031/T058 | auth/invitation | AC-001/003/023 |
| NFR-SEC-002/003/012 | Token/session/cookie | T014/T022..T025/T032/T033 | login/refresh/logout | AC-007..009 |
| NFR-SEC-006/007 | Validation/rate control | T020/T028/T030/T037 | public/auth endpoints | AC-002/003/005 |
| SEC-AC-003/004 | Backend authorization | T026/T027/T054 | protected Admin/profile | AC-011/012/017 |
| SEC-AC-011 | Safe projection | T013/T047..T049 | user DTOs | AC-010/015 |
| DATA-AC-001/009 | Account/invitation integrity | T016/T018/T019/T050/T051/T055/T058/T061 | transactions/partial indexes/governance guard | AC-016/023..025/030/037/039 |
| NFR-SEC-012, DEC-013 | Multi-tab refresh safety | T032/T037/T039/T040 | refresh grace + Web Locks/BroadcastChannel | AC-007/038 |

## 2. BA Test Scenario Mapping

| BA scenario | P02 execution |
| --- | --- |
| TS-001/001A | API + DB register suite |
| TS-002 | Login/API/browser journey |
| TS-028 | Account status/role bypass negative suite |
| TS-029 | Admin role-specific list API/UI suite |
| TS-033 | Audit integrity/redaction suite |
| TS-034 | Validation/concurrency/dependency suite |
| TS-036 | Swagger contract/browser check |
| TS-037 | Browser token/session E2E |
| TS-038 | Password/cooldown boundary suite |
| Teacher invitation scenarios | Create/copy/revoke/preview/accept state and concurrency suite |
| Refresh/Super Admin concurrency | Multi-tab race/replay và final-admin invariant suite |

## 3. Evidence Mapping

| Evidence ID prefix | Nội dung |
| --- | --- |
| `P02-EVD-API-*` | Unit/API/repository/transaction test reports |
| `P02-EVD-WEB-*` | Component/browser/accessibility screenshots/report |
| `P02-EVD-SEC-*` | Cookie/storage/replay/redaction/negative authorization |
| `P02-EVD-OPS-*` | Compose/replica set/Docker/CI/clean clone |
| `P02-EVD-DOC-*` | Swagger/traceability/checklist/exit approval |

## 4. Update Rule

- Khi task merge, điền file/commit/PR/test report vào `evidence-register.md`.
- Khi BA ID thay đổi, review cả task, API, AC và test tương ứng.
- Không ghi `Implemented` nếu chỉ có source mà chưa có test/evidence.
- Requirement chuyển phase phải có lý do, owner, phase mới và Product Owner/BA approval.
