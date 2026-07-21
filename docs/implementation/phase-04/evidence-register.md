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
| P04-EV-006 | Permission/lifecycle/visibility unit report | Có | `phase-four-content-policy.test.ts`, `phase-four-foundation.test.ts`, `phase-four-course-module.test.ts`, `phase-four-learning-content.test.ts` | Collected |
| P04-EV-007 | Mongo index/repository report | Có | 13 Mongo replica-set suites, `55/55` tests; index contract và explain `IXSCAN` ngày `2026-07-20` | Collected |
| P04-EV-008 | Transaction/concurrency report | Có | Course/Module/Lesson/Flashcard exact-set reorder; deadline race; 20-way Lesson completion race; rollback, archive preservation và atomic audit integration tests | Collected |
| P04-EV-009 | API integration/authorization report | Có | Course/Module/Lesson/Flashcard/Deadline/Progress/Announcement/Governance suites: owner/foreign Teacher/active-removed Student/Admin/CAS/visibility | Collected |
| P04-EV-010 | OpenAPI route/schema parity report | Có | `app.test.ts` `8/8`; bốn P04 OpenAPI modules có `44` secured operations | Collected |
| P04-EV-011 | React component/coverage report | Có | 15 files, `84/84` tests; coverage `83.45/70.91/80.67/87.05`; có test Stream filter/page, Student To-do/Deadline, malformed URL và dirty navigation | Collected |
| P04-EV-012 | XSS/unsafe URL/log-redaction report | Có | Markdown XSS/unsafe-scheme corpus, sanitized projection và audit allowlist pass; Resource capability N/A theo decision | Collected |
| P04-EV-013 | Full `npm run check:ci` output | Có | Local pass ngày `2026-07-21`: API `149/149`, Web `84/84`, coverage gates và production builds pass | Collected |

## 4. Runtime And Browser Evidence

| ID | Evidence | Required | Location | Status |
| --- | --- | --- | --- | --- |
| P04-EV-014 | Docker images build and stack healthy | Có | API/Web production image build; Mongo internal-only, API `4000`, Web `3000`; ba service healthy | Collected |
| P04-EV-015 | Deterministic seed first/repeat run | Có | First P04 run `created=15`; repeat `created=0`, `reused=15` | Collected |
| P04-EV-016 | Teacher-to-Student golden E2E | Có | Playwright Chromium trên Docker production stack `14/14` ngày `2026-07-21` | Collected |
| P04-EV-017 | Lifecycle/deadline/foreign-access E2E | Có | Browser suite gồm authoring, Stream, completion, dashboard, governance và cross-role denial | Collected |
| P04-EV-018 | Swagger UI/API interactive smoke | Có | E2E `/api-docs` và `/api/v1/openapi.json` HTTP 200; parser test `8/8` | Collected |
| P04-EV-019 | Desktop visual review | Có | Chromium ngày `2026-07-21`: Teacher Stream status filter, Student Deadline grouped-by-day và form authoring render đúng; không overlap | Collected |
| P04-EV-020 | Mobile visual review | Có | Viewport `390x844` ngày `2026-07-21`: `body/document scrollWidth=375`, không có child overflow; Stream/Deadline controls xếp một cột | Collected |
| P04-EV-021 | Keyboard/accessibility review | Có | Flashcard Enter/Space, semantic navigation/reorder, accessible labels và dirty-form confirm accept/dismiss đã test | Collected |
| P04-EV-022 | Clean-clone onboarding | Có | Pending log | Planned |

## 5. Performance, Security And Remote Evidence

| ID | Evidence | Required | Location | Status |
| --- | --- | --- | --- | --- |
| P04-EV-023 | To-do/dashboard/structure performance | Có | 100 Student/50 Lesson/30 requests: p95 To-do `203.38ms`, Dashboard `701.32ms`, Ranking `588.42ms`, Structure `169.75ms`; explain `IXSCAN` | Collected |
| P04-EV-024 | Dependency audit | Có | Local `npm audit --omit=dev --audit-level=high` ngày `2026-07-21`: `0 vulnerabilities`; chờ Actions URL | Collected |
| P04-EV-025 | Secret scan | Có | Pending Actions URL | Planned |
| P04-EV-026 | Implementation PR review/merge | Có | Pending PR/SHA | Planned |
| P04-EV-027 | Implementation PR required CI | Có | Pending run URL | Planned |
| P04-EV-028 | Post-merge `main` required CI | Có | Pending run URL | Planned |
| P04-EV-029 | Zero Critical/High open defects | Có | Local automated review không còn Critical/High; xác nhận lại trong implementation PR | Collected |
| P04-EV-030 | P05/P06 handoff review | Có | Versioned activity/progress contracts và Phase Boundary Traceability; chờ PR review | Collected |

## 6. Conditional Resource Evidence

| ID | Evidence | Required when enabled | Location | Status |
| --- | --- | --- | --- | --- |
| P04-EV-031 | Resource execution decision | Có | `conditional-resource-decision.md` | Collected |
| P04-EV-032 | Safe URL resource tests | URL mode | Capability disabled/deferred P07 | Not Applicable |
| P04-EV-033 | GCS bucket/IAM/CORS review | Upload mode | Capability disabled/deferred P07 | Not Applicable |
| P04-EV-034 | GCS upload/access/cleanup tests | Upload mode | Capability disabled/deferred P07 | Not Applicable |

## 7. Verification Summary

| Category | Required evidence | Verified now |
| --- | --- | --- |
| Planning | 5 | 3 Verified + 2 Collected |
| Automated | 8 | 8 Collected |
| Runtime/Browser | 9 | 8 Collected, clean-clone pending |
| Performance/Security/Remote | 8 | 4 Collected, 4 remote pending |
| Conditional | 1 decision + enabled scope | Decision Collected; enabled scope N/A |

Current conclusion: toàn bộ Must implementation và local automated/runtime evidence đã sẵn sàng cho review. Clean-clone sau commit, implementation PR, required CI, merge commit và post-merge `main` CI vẫn phải được bổ sung trước Phase Exit.
