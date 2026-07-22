# Phase 05 Evidence Register

## 1. Quy Tắc

- Status: `Planned`, `Prepared`, `Collected`, `Verified`, `Rejected`, `Not Applicable`.
- `Prepared`: artifact đã soạn trên branch nhưng chưa merge.
- `Collected`: có path/URL/command/result thật.
- `Verified`: reviewer hoặc automated gate đã xác nhận evidence gắn với đúng commit.
- Không ghi password, cookie, token, Atlas URI, answer key, private Student work hoặc signed URL vào evidence.
- Evidence phải tái lập được; “đã test” không kèm command/report/count/commit không hợp lệ.

## 2. Planning Evidence

| ID | Evidence | Required | Location | Status |
| --- | --- | --- | --- | --- |
| P05-EV-001 | Complete planning document package | Có | Branch `docs/phase-05-planning-baseline`, source commit [`67dbaf5`](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/commit/67dbaf5) | Collected |
| P05-EV-002 | Planning local format/link/count/quality validation | Có | `2026-07-22`: 28/28 files, 78 AC, 108 tasks, 32 decisions, 25 risks, 52 endpoint rows; local links resolve; `git diff --check`, targeted Prettier và `npm run check:ci` Pass; API `149/149`, Web `84/84`, builds Pass | Collected |
| P05-EV-003 | Planning Pull Request | Có | URL pending | Planned |
| P05-EV-004 | Planning required CI | Có | Actions URL pending | Planned |
| P05-EV-005 | Accepted product/technical decision record | Có | `technical-decisions.md` + PR review | Prepared |
| P05-EV-006 | Planning merge commit | Có | Commit pending | Planned |
| P05-EV-007 | Gate A readiness approval | Có | `development-readiness-review.md` | Prepared |

## 3. Domain, Data Và API Evidence

| ID | Evidence | Required | Planned location/result | Status |
| --- | --- | --- | --- | --- |
| P05-EV-008 | Permission/ownership/enrollment policy unit report | Có | API unit test report | Planned |
| P05-EV-009 | Quiz/Question lifecycle and validation report | Có | Unit + Mongo integration report | Planned |
| P05-EV-010 | Attempt snapshot/active guard integration report | Có | Replica-set transaction suite | Planned |
| P05-EV-011 | Golden objective scoring fixtures | Có | Scoring unit report with fixture IDs | Planned |
| P05-EV-012 | Save/submit/timeout/retry/concurrency report | Có | Unit + integration + fake-clock report | Planned |
| P05-EV-013 | Assignment/Submission/revision integration report | Có | Replica-set transaction suite | Planned |
| P05-EV-014 | Grade/return/regrade/history integration report | Có | Revision/audit/privacy suite | Planned |
| P05-EV-015 | Deadline exception/effective deadline report | Có | Fake-clock + transaction suite | Planned |
| P05-EV-016 | Index manifest and query plan report | Có | Named index assertions + explain | Planned |
| P05-EV-017 | Migration preflight/rollback dry-run | Có | Command + before/after summary | Planned |
| P05-EV-018 | OpenAPI/runtime route parity | Có | Parser/route test count | Planned |
| P05-EV-019 | API error/pagination/revision contract report | Có | Integration + OpenAPI schemas | Planned |

## 4. Security Và Privacy Evidence

| ID | Evidence | Required | Planned location/result | Status |
| --- | --- | --- | --- | --- |
| P05-EV-020 | Role and object-level authorization matrix | Có | Admin/Teacher/Student/anonymous negative suite | Planned |
| P05-EV-021 | Answer-key and scoring-internal leak test | Có | Student DTO/browser/log assertions | Planned |
| P05-EV-022 | Grade/feedback/submission privacy test | Có | unreleased/cross-student denial suite | Planned |
| P05-EV-023 | Audit log allowlist/redaction test | Có | audit/log assertions | Planned |
| P05-EV-024 | Abuse/rate-limit tests for start/save/submit | Có | API integration report | Planned |
| P05-EV-025 | Conditional URL/media security review | Khi enabled | URL parser/allowlist/browser behavior | Planned |
| P05-EV-026 | Proof no local-disk/multipart upload | Có | Route/source review + negative contract test | Planned |

## 5. Frontend, Browser Và Accessibility Evidence

| ID | Evidence | Required | Planned location/result | Status |
| --- | --- | --- | --- | --- |
| P05-EV-027 | React component/integration test report | Có | Test count + coverage | Planned |
| P05-EV-028 | Teacher Quiz authoring and result E2E | Có | Playwright artifacts | Planned |
| P05-EV-029 | Student attempt/save/resume/submit/result E2E | Có | Playwright artifacts | Planned |
| P05-EV-030 | Assignment/submission/grade E2E | Có | Playwright artifacts | Planned |
| P05-EV-031 | Deadline exception + To-do/progress E2E | Có | Playwright artifacts | Planned |
| P05-EV-032 | Desktop visual review | Có | Screenshots at named commit | Planned |
| P05-EV-033 | Mobile visual/overflow review | Có | `390x844` screenshots + overflow assertion | Planned |
| P05-EV-034 | Keyboard/axe/focus/reduced-motion review | Có | Automated + manual checklist | Planned |
| P05-EV-035 | Dirty-navigation/autosave/conflict UX review | Có | Browser journey/report | Planned |

## 6. DevOps, Performance Và Remote Evidence

| ID | Evidence | Required | Planned location/result | Status |
| --- | --- | --- | --- | --- |
| P05-EV-036 | Deterministic seed first/repeat | Có | created/reused counts | Planned |
| P05-EV-037 | Docker API/Web image build | Có | Command/result/digest | Planned |
| P05-EV-038 | Integrated stack readiness/smoke | Có | Health/API/Web/Swagger result | Planned |
| P05-EV-039 | Performance budgets and explain plans | Có | p95 dataset/result + IXSCAN evidence | Planned |
| P05-EV-040 | Full local quality gate | Có | `npm run check:ci` equivalent | Planned |
| P05-EV-041 | Dependency audit | Có | CI URL/result | Planned |
| P05-EV-042 | Secret Scan | Có | CI URL/result | Planned |
| P05-EV-043 | Clean-clone onboarding | Có | fresh path, commit, commands/results | Planned |
| P05-EV-044 | Implementation Pull Request review/merge | Có | PR URL + source/merge commit | Planned |
| P05-EV-045 | Implementation PR required CI | Có | Actions URL + job count | Planned |
| P05-EV-046 | Post-merge `main` required CI | Có | Actions URL + job count | Planned |
| P05-EV-047 | Zero open Critical/High defects | Có | issue/risk review snapshot | Planned |
| P05-EV-048 | Phase 06/07 handoff review | Có | versioned contract/deferred scope sign-off | Planned |

## 7. Acceptance Và Exit Evidence

| ID | Evidence | Required | Planned location/result | Status |
| --- | --- | --- | --- | --- |
| P05-EV-049 | `74/74` Must AC evaluation | Có | `acceptance-criteria.md` with per-AC evidence | Planned |
| P05-EV-050 | Four Conditional AC disposition | Có | Pass or approved N/A evidence | Planned |
| P05-EV-051 | Phase Exit evidence snapshot | Có | `phase-exit-evidence.md` | Prepared |
| P05-EV-052 | Exit report approval | Có | `exit-report.md` + review/merge evidence | Prepared |

## 8. Current Summary

| Category | Total | Prepared | Planned | Collected | Verified |
| --- | ---: | ---: | ---: | ---: | ---: |
| Planning | 7 | 2 | 3 | 2 | 0 |
| Domain/Data/API | 12 | 0 | 12 | 0 | 0 |
| Security/Privacy | 7 | 0 | 7 | 0 | 0 |
| Frontend/Browser | 9 | 0 | 9 | 0 | 0 |
| DevOps/Remote | 13 | 0 | 13 | 0 | 0 |
| Acceptance/Exit | 4 | 2 | 2 | 0 | 0 |

Current conclusion: planning package và local validation đã được thu thập trên remote branch; chưa có Pull Request review/CI/merge, chưa có implementation evidence và chưa evidence nào được ghi `Verified`.
