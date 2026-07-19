# Phase 04 Evidence Register

## 1. Quy Tắc

- Status: `Planned`, `Collected`, `Verified`, `Rejected`, `Not Applicable`.
- `Collected` cần path/URL/command; `Verified` cần reviewer hoặc automated gate xác nhận.
- Không lưu password, cookie, token, Atlas URI, signed URL hoặc private content trong evidence.

## 2. Planning Evidence

| ID | Evidence | Required | Location | Status |
| --- | --- | --- | --- | --- |
| P04-EV-001 | Planning PR | Có | [PR #8](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/8) | Verified |
| P04-EV-002 | Planning CI all required checks | Có | [Actions run #29692181077](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/29692181077) | Verified |
| P04-EV-003 | Planning merge commit | Có | [`66f400d`](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/commit/66f400d727174efbafbbb58e10b0f00fb28840ed) | Verified |
| P04-EV-004 | Gate A accepted decision register | Có | `technical-decisions.md` | Collected |
| P04-EV-005 | Readiness approval record | Có | `development-readiness-review.md` | Collected |

## 3. Source And Automated Test Evidence

| ID | Evidence | Required | Location | Status |
| --- | --- | --- | --- | --- |
| P04-EV-006 | Permission/lifecycle/visibility unit report | Có | Pending CI/report | Planned |
| P04-EV-007 | Mongo index/repository report | Có | Pending CI/report | Planned |
| P04-EV-008 | Transaction/concurrency report | Có | Pending CI/report | Planned |
| P04-EV-009 | API integration/authorization report | Có | Pending CI/report | Planned |
| P04-EV-010 | OpenAPI route/schema parity report | Có | Pending CI/report | Planned |
| P04-EV-011 | React component/coverage report | Có | Pending CI/report | Planned |
| P04-EV-012 | XSS/unsafe URL/log-redaction report | Có | Pending CI/report | Planned |
| P04-EV-013 | Full `npm run check:ci` output | Có | Pending log/run | Planned |

## 4. Runtime And Browser Evidence

| ID | Evidence | Required | Location | Status |
| --- | --- | --- | --- | --- |
| P04-EV-014 | Docker images build and stack healthy | Có | Pending command log | Planned |
| P04-EV-015 | Deterministic seed first/repeat run | Có | Pending command log | Planned |
| P04-EV-016 | Teacher-to-Student golden E2E | Có | Pending Playwright report | Planned |
| P04-EV-017 | Lifecycle/deadline/foreign-access E2E | Có | Pending Playwright report | Planned |
| P04-EV-018 | Swagger UI/API interactive smoke | Có | Pending screenshots/log | Planned |
| P04-EV-019 | Desktop visual review | Có | Pending screenshots | Planned |
| P04-EV-020 | Mobile visual review | Có | Pending screenshots | Planned |
| P04-EV-021 | Keyboard/accessibility review | Có | Pending report | Planned |
| P04-EV-022 | Clean-clone onboarding | Có | Pending log | Planned |

## 5. Performance, Security And Remote Evidence

| ID | Evidence | Required | Location | Status |
| --- | --- | --- | --- | --- |
| P04-EV-023 | To-do/dashboard/structure performance | Có | Pending report | Planned |
| P04-EV-024 | Dependency audit | Có | Pending Actions URL | Planned |
| P04-EV-025 | Secret scan | Có | Pending Actions URL | Planned |
| P04-EV-026 | Implementation PR review/merge | Có | Pending PR/SHA | Planned |
| P04-EV-027 | Implementation PR required CI | Có | Pending run URL | Planned |
| P04-EV-028 | Post-merge `main` required CI | Có | Pending run URL | Planned |
| P04-EV-029 | Zero Critical/High open defects | Có | Pending issue query/report | Planned |
| P04-EV-030 | P05/P06 handoff review | Có | Pending review record | Planned |

## 6. Conditional Resource Evidence

| ID | Evidence | Required when enabled | Location | Status |
| --- | --- | --- | --- | --- |
| P04-EV-031 | Resource execution decision | Có | Pending decision | Planned |
| P04-EV-032 | Safe URL resource tests | URL mode | Pending | Planned |
| P04-EV-033 | GCS bucket/IAM/CORS review | Upload mode | Pending | Planned |
| P04-EV-034 | GCS upload/access/cleanup tests | Upload mode | Pending | Planned |

## 7. Verification Summary

| Category | Required evidence | Verified now |
| --- | --- | --- |
| Planning | 5 | 0 |
| Automated | 8 | 0 |
| Runtime/Browser | 9 | 0 |
| Performance/Security/Remote | 8 | 0 |
| Conditional | 1 decision + enabled scope | 0 |

Current conclusion: evidence package is fully planned but no implementation evidence exists yet.
