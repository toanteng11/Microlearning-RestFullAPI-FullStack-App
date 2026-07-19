# Phase 03 Traceability Matrix

## 1. Requirement To Delivery

| BA source                                                        | Capability                                 | P03 tasks                               | API/UI/Data                           | Acceptance/Test                      |
| ---------------------------------------------------------------- | ------------------------------------------ | --------------------------------------- | ------------------------------------- | ------------------------------------ |
| FR-020, US-TCH-001, UC-003, BR-004/016                           | Classroom create/update/archive/open-close | T028..T036, T056..T058                  | Classroom model/routes; Teacher pages | AC-001..008; TS-003                  |
| FR-021, US-TCH-002/031, UC-004, BR-052                           | Class Code lifecycle                       | T037..T040, T059                        | ClassCode model/API/settings UI       | AC-009..012; TS-004                  |
| FR-022, US-TCH-003/032, UC-005/052, BR-052                       | Invite Link lifecycle/preview              | T041..T044, T060/T063                   | InviteLink model/API/Invite page      | AC-013..016                          |
| FR-023, US-STU-002/003/016..018, UC-006/007, BR-001/002/050..056 | Join and Enrollment                        | T045..T049, T061..T064                  | Enrollment/join API/UI                | AC-017..027; TS-001B/005/006/024/025 |
| FR-051, US-STU-025..029, UC-053, BR-003                          | Student Classroom overview                 | T029/T031/T064                          | Role-scoped detail/UI; content deferred | AC-032                              |
| FR-024, US-TCH-078/079, UC-064, BR-041/053/055                   | Roster/remove/history                      | T046/T047, T059/T065                    | Roster API/UI, Enrollment state       | AC-028..031                          |
| FR-025, US-TCH-017/033, UC-024, BR-017..019/051                  | Classroom settings/policy precedence       | T034/T035/T038/T042/T058/T060           | Settings API/UI                       | AC-006/011/015/018/019               |
| FR-011, US-ADM-009/045/046/049, UC-031, BR-017..019/097/101      | Enrollment Policy                          | T018/T032/T050/T066                     | SystemSetting/API/Admin UI            | AC-018/034..036                      |
| FR-012, US-ADM-010/050, UC-032                                   | Governance list/detail                     | T033/T051/T067                          | Admin API/UI                          | AC-036/037                           |
| FR-013 Should, US-ADM-011/065, UC-033, BR-023/100                | Ownership/offboarding                      | T052..T055                              | Governance/Phase 02 port              | AC-033/038                           |
| FR-064                                                           | Pagination/filter/sort                     | T015/T030/T033/T046/T057/T059/T065/T067 | List queries/tables                   | AC-008/028/037                       |
| FR-065                                                           | Standard errors                            | T025/T035/T044/T048/T070                | Error mapping/UI                      | AC-002/004/017..019/039              |
| FR-067/067A                                                      | Swagger/OpenAPI                            | T068/T069                               | OpenAPI/Swagger UI                    | AC-041                               |
| FR-069, BR-020/055/101                                           | Audit                                      | T019/T026/T036/T040/T044/T047/T050/T054 | AuditLog transaction                  | AC-007/011/022/030/035/040           |
| NFR-SEC-API-004..007                                             | Validation/rate/no injection/safe error    | T021..T027/T071                         | Middleware/schemas/logging            | AC-039/040                           |
| NFR-REL-001, DATA-AC-002                                         | Idempotency/no partial                     | T016..T020/T045..T049/T072              | Unique indexes/transactions           | AC-023/024/026                       |
| NFR-PERF-API-001/002                                             | Bounded lists                              | T015/T030/T033/T046                     | Repository/API/UI pagination          | AC-008/028/037                       |

## 2. BA Acceptance Mapping

| BA acceptance/scenario | P03 criteria             |
| ---------------------- | ------------------------ |
| `AC-JOIN-001`          | P03-AC-020..024          |
| `AC-JOIN-002`          | P03-AC-018/019/026       |
| `AC-JOIN-003`          | P03-AC-023..025          |
| `DATA-AC-002`          | P03-AC-022..026/030/031  |
| `TS-003`               | P03-AC-001..008          |
| `TS-004`               | P03-AC-009..012          |
| `TS-005`               | P03-AC-020/022..024/028  |
| `TS-006`               | P03-AC-013..016/021..024 |
| `TS-024`               | P03-AC-018/019/026       |
| `TS-025`               | P03-AC-023..025          |
| `TS-030`, `BR-100`     | P03-AC-033/038           |

## 3. Actor Journey Mapping

| Journey                      | Requirements          | E2E        |
| ---------------------------- | --------------------- | ---------- |
| Teacher create/share         | FR-020..022/025       | E2E-P03-01 |
| Student join Code            | FR-021/023            | E2E-P03-02 |
| Guest link -> auth -> join   | FR-022/023, BR-001C   | E2E-P03-03 |
| Teacher roster/remove        | FR-024                | E2E-P03-04 |
| Admin global policy          | FR-011                | E2E-P03-05 |
| Cross-role/direct URL denial | FR-005/BA auth matrix | E2E-P03-06 |

## 4. Evidence Prefix

| Prefix           | Evidence                                     |
| ---------------- | -------------------------------------------- |
| `P03-EVD-API-*`  | Unit/service/API/repository/transaction      |
| `P03-EVD-DATA-*` | Index, migration, concurrency, rollback      |
| `P03-EVD-WEB-*`  | Component/E2E/responsive/accessibility       |
| `P03-EVD-SEC-*`  | RBAC/ownership/rate/redaction/raw exposure   |
| `P03-EVD-OPS-*`  | Docker/CI/seed/clean clone/log scan          |
| `P03-EVD-DOC-*`  | OpenAPI/traceability/checklist/exit approval |

## 5. Change Rule

- BA ID thay đổi phải review task/API/data/AC/test cùng lúc.
- Không ghi `Implemented` nếu chỉ có source nhưng chưa test/evidence.
- API preview POST body/fragment transport tại BA revision `1.40` và `DEC-016` đã được chấp thuận qua `P03-ADR-007`; code chỉ bắt đầu sau planning PR merge.
- Requirement chuyển phase phải có reason, owner, impact và Product Owner/BA approval.
