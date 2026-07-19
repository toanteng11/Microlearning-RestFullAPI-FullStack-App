# Phase 03 Plan

## 1. Objective

Tạo vertical increment `Teacher creates Classroom -> shares Code/Link -> authenticated Student joins -> Teacher sees roster -> Admin governs policy`, chạy end-to-end bằng React, Express, MongoDB, Swagger, Docker và CI.

## 2. Entry Criteria

| Entry criterion             | Required evidence                                        |
| --------------------------- | -------------------------------------------------------- |
| Phase 02 code merged        | `main` chứa merge commit `61aa049`                       |
| Phase 02 post-merge CI      | Quality, Mongo, OpenAPI, E2E, audit, secret scan xanh    |
| Auth/RBAC/session stable    | P02 API and E2E tests pass                               |
| Mongo replica set available | Transaction integration harness chạy được                |
| BA scope baseline           | FR/BR/UC/AC IDs trong P03 traceability không có gap Must |
| P03 decisions reviewed      | P03-ADR-001..018 có owner/status                         |
| Gate A approved             | `development-readiness-review.md = READY_TO_CODE`        |

## 3. Milestones

| Milestone                    | Outcome                                                                | Exit signal                             |
| ---------------------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| P03-M1 Contract Ready        | Scope, lifecycle, data, API, permission và AC được review              | Gate A Pass                             |
| P03-M2 Data Foundation Ready | Collections/indexes/migrations/repositories và policy singleton        | Real Mongo index tests pass             |
| P03-M3 Classroom API Ready   | CRUD mềm, settings, role-scoped list/detail, governance                | API + ownership negative tests pass     |
| P03-M4 Join Ready            | Code/Link lifecycle, preview, transaction join, duplicate/race control | Join integration/concurrency suite pass |
| P03-M5 Web Ready             | Teacher/Student/Admin journeys dùng API thật                           | Component + Playwright journeys pass    |
| P03-M6 Hardening Ready       | Audit/redaction/rate/OpenAPI/Docker/CI                                 | Security/contract/CI gates xanh         |
| P03-M7 Phase Exit            | Evidence, traceability, clean clone và demo hoàn tất                   | P03 exit review signed                  |

## 4. Delivery Sequence

```text
BA/Decision Review
  -> Permission + API/Data Contract
  -> Policy/Classroom/Enrollment Models + Indexes
  -> Classroom CRUD + Owner Authorization
  -> Enrollment Policy + Governance Read APIs
  -> Class Code Lifecycle
  -> Invite Link Lifecycle + Public Preview
  -> Join Transaction + Roster Mutation
  -> Teacher/Student/Admin React Flows
  -> OpenAPI + E2E + Security/Concurrency Hardening
  -> Clean Clone + Evidence + Exit
```

## 5. Workstream Ownership

| Workstream                  | Accountable       | Required reviewer      |
| --------------------------- | ----------------- | ---------------------- |
| BA trace/scope              | BA/Product Owner  | Technical Lead, QA     |
| Domain/lifecycle/API        | Backend Lead      | BA, Frontend, Security |
| Mongo/index/transaction     | Backend Lead      | QA, DevOps             |
| React Teacher/Student/Admin | Frontend Lead     | BA, QA, Backend        |
| RBAC/object scope/abuse     | Security reviewer | Backend, QA            |
| Compose/seed/CI             | DevOps            | Backend, QA, Security  |
| Test/evidence/exit          | QA Lead           | All owners             |

Một người có thể giữ nhiều vai trò trong đồ án cá nhân, nhưng phải review từng góc nhìn và ghi evidence riêng; không tự động xem merge là đủ sign-off.

## 6. Pull Request Strategy

| PR     | Nội dung                                         | Dependency              |
| ------ | ------------------------------------------------ | ----------------------- |
| PR-03P | Planning baseline                                | P02 merged              |
| PR-03A | Permissions/env/models/indexes/policy repository | PR-03P                  |
| PR-03B | Classroom CRUD/settings/role-scoped queries      | PR-03A                  |
| PR-03C | Class Code/Invite Link lifecycle                 | PR-03A/03B              |
| PR-03D | Join transaction/roster/remove/offboarding guard | PR-03B/03C              |
| PR-03E | Teacher Classroom UI                             | Stable 03B/03C contract |
| PR-03F | Student join/list/detail UI                      | Stable 03D contract     |
| PR-03G | Admin policy/governance UI và optional Should    | Stable 03B/03D          |
| PR-03H | OpenAPI/E2E/security/CI/docs/evidence            | PR-03D..03G             |

Mỗi PR chứa source + tests + OpenAPI/evidence tương ứng. Branch sau có dependency phải target/rebase rõ; không để chuỗi PR lệch `main`.

## 7. Critical Path

```text
Decision/Data/API baseline
  -> models/indexes/policy
  -> Classroom owner CRUD
  -> credentials
  -> transactional join
  -> roster/access integration
  -> React journeys
  -> E2E/CI/evidence
```

## 8. Implementation Rules

1. Backend là authority cho role, owner, Enrollment và policy precedence.
2. Raw code/token không đi vào Mongo, logger, AuditLog, analytics, screenshot hoặc test snapshot.
3. Join và remove phải có real Mongo transaction/concurrency evidence.
4. List API luôn pagination + sort allowlist + `_id` tie-breaker.
5. Public preview trả projection tối thiểu và `Cache-Control: no-store`.
6. Archive/remove là soft state; hard delete không thuộc MVP.
7. Swagger cập nhật cùng route; route không có operation là CI fail.
8. UI không dùng mock khi capability được đánh dấu Done.

## 9. Exit Criteria

- Tất cả Must WBS task Done.
- Tất cả P03 acceptance criteria Pass; không có Not Run/Blocked Must.
- Critical/High defect về ownership, duplicate Enrollment, token/code exposure hoặc partial transaction bằng 0.
- Teacher/Student/Admin E2E chạy trên Compose/CI.
- OpenAPI route coverage chính xác.
- Clean-clone onboarding pass.
- Risk, traceability, evidence và exit report được cập nhật.
- Stable Classroom/Enrollment contract bàn giao cho Phase 04.
