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
| P05-EV-001 | Complete planning document package | Có | Branch `docs/phase-05-planning-baseline`, source commit [`67dbaf5`](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/commit/67dbaf5) | Verified |
| P05-EV-002 | Planning local format/link/count/quality validation | Có | `2026-07-22`: 28/28 files, 78 AC, 108 tasks, 32 decisions, 25 risks, 52 endpoint rows; local links resolve; `git diff --check`, targeted Prettier và `npm run check:ci` Pass; API `149/149`, Web `84/84`, builds Pass | Verified |
| P05-EV-003 | Planning Pull Request | Có | [PR #13](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/13) | Verified |
| P05-EV-004 | Planning required CI | Có | [PR #13 checks](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/13/checks), merge gate đã Pass | Verified |
| P05-EV-005 | Accepted product/technical decision record | Có | Product Owner approval `2026-07-22`; `ba-alignment-and-decisions.md`; `technical-decisions.md` | Verified |
| P05-EV-006 | Planning merge commit | Có | `24084c0` trên `main` | Verified |
| P05-EV-007 | Gate A readiness approval | Có | Product Owner approval `2026-07-22`; `development-readiness-review.md` decision `READY_TO_CODE` | Verified |
| P05-EV-053 | Developer implementation blueprint refinement validation | Có | `2026-07-22`: 33/33 Phase files; source/runtime/API-UI/test/PR catalogs added; 52 P05 endpoint rows + 10 existing read-model mappings, 74 integration cases, 12 E2E, 78 AC, 108 tasks; planning package đã merge trong PR #13. | Verified |

## 3. Domain, Data Và API Evidence

| ID | Evidence | Required | Planned location/result | Status |
| --- | --- | --- | --- | --- |
| P05-EV-008 | Permission/ownership/enrollment policy unit report | Có | `2026-07-27`: API unit `180/180`; Mongo integration `72/72`; deny-by-default, anonymous/role/foreign-owner/cross-Student matrix Pass | Verified |
| P05-EV-009 | Quiz/Question lifecycle and validation report | Có | `2026-07-27`: API unit `180/180`; Mongo integration `72/72`; bốn Question types, lifecycle, revision, publish Pass | Verified |
| P05-EV-010 | Attempt snapshot/active guard integration report | Có | `2026-07-27`: concurrent start chỉ trả một active Attempt; immutable snapshot và Student projection không lộ scoring key | Verified |
| P05-EV-011 | Golden objective scoring fixtures | Có | `2026-07-27`: exact scoring cho SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE; SHORT_ANSWER giữ manual review; eligibility/time boundary Pass | Verified |
| P05-EV-012 | Save/submit/timeout/retry/concurrency report | Có | `2026-07-27`: CAS save, stale revision, idempotent submit và concurrent lazy timeout chỉ finalize một lần trong suite `72/72` | Verified |
| P05-EV-013 | Assignment/Submission/revision integration report | Có | `2026-07-27`: TEXT draft, concurrent turn-in, unsubmit, resubmit, append-only history và derived roster Pass | Verified |
| P05-EV-014 | Grade/return/regrade/history integration report | Có | `2026-07-27`: return/regrade revision, audit/history, released visibility và browser regrade Pass | Verified |
| P05-EV-015 | Deadline exception/effective deadline report | Có | `2026-07-27`: extension-only validation, set/revoke/history, canonical effective deadline và mixed To-do projection Pass | Verified |
| P05-EV-016 | Index manifest and query plan report | Có | `2026-07-27`: named indexes và explain `IXSCAN` cho Attempt result, returned Grade và deadline exception; không có unapproved `COLLSCAN` | Verified |
| P05-EV-017 | Migration preflight/rollback dry-run | Có | `2026-07-22`: preflight chặn unknown activity/schema mismatch/duplicate active Attempt; rollback dry-run giữ nguyên document count | Verified |
| P05-EV-018 | OpenAPI/runtime route parity | Có | `2026-07-27`: `52/52` P05 runtime operations documented; OpenAPI contract `9/9` Pass | Verified |
| P05-EV-019 | API error/pagination/revision contract report | Có | `2026-07-22`: strict Zod, list envelope, stale revision và ownership cases Pass trong unit/integration suite | Verified |

## 4. Security Và Privacy Evidence

| ID | Evidence | Required | Planned location/result | Status |
| --- | --- | --- | --- | --- |
| P05-EV-020 | Role and object-level authorization matrix | Có | `2026-07-27`: anonymous `401`; wrong-role `403`; foreign Teacher/cross-Student object `404`; Student deep-link `/forbidden` Pass | Verified |
| P05-EV-021 | Answer-key and scoring-internal leak test | Có | Recursive assertions không có `correctOptionIds`, `correctBoolean`, rubric, explanation, snapshots hoặc answers trong Student/Admin projection | Verified |
| P05-EV-022 | Grade/feedback/submission privacy test | Có | `2026-07-27`: draft/unreleased và cross-Student denial; Student chỉ thấy own returned Grade/Submission | Verified |
| P05-EV-023 | Audit log allowlist/redaction test | Có | Unit/integration assertions loại prompt, answer key, rubric, explanation và Student ID khỏi audit metadata | Verified |
| P05-EV-024 | Abuse/rate-limit tests for start/save/submit | Có | API policy/integration suite Pass; E2E dùng giới hạn synthetic `300` để tránh shared-IP false failure, production default không đổi | Verified |
| P05-EV-025 | Conditional URL/media security review | Khi enabled | Gate A `2026-07-22`: feature disabled/fail closed; upload và server-side fetch không tồn tại | Not Applicable |
| P05-EV-026 | Proof no local-disk/multipart upload | Có | Production config hard-reject file upload; Question media URL mặc định disabled; không mount multipart route | Verified |

## 5. Frontend, Browser Và Accessibility Evidence

| ID | Evidence | Required | Planned location/result | Status |
| --- | --- | --- | --- | --- |
| P05-EV-027 | React component/integration test report | Có | `2026-07-27`: Web suite `99/99`; Quiz settings normalization, Question option/rubric editing, Assignment, Grade, deadline, mixed learning states và unsaved guard Pass | Verified |
| P05-EV-028 | Teacher Quiz authoring and result E2E | Có | `2026-07-27`: create/settings/question/preview/publish, result list, manual review và release browser journeys Pass | Verified |
| P05-EV-029 | Student attempt/save/resume/submit/result E2E | Có | `2026-07-27`: start, select, save, hard reload/resume, submit, immediate result và attempt-limit UI Pass | Verified |
| P05-EV-030 | Assignment/submission/grade E2E | Có | `2026-07-27`: Teacher create/publish; Student draft/turn-in/unsubmit/resubmit/history; Teacher roster/regrade; Student own Grade Pass | Verified |
| P05-EV-031 | Deadline exception + To-do/progress E2E | Có | `2026-07-27`: exception history, personal extension, mixed To-do/Deadline và Course progress browser journeys Pass | Verified |
| P05-EV-032 | Desktop visual review | Có | `2026-07-27`: in-app browser review tại `1280x720`; no overlap/console error | Verified |
| P05-EV-033 | Mobile visual/overflow review | Có | `2026-07-27`: `390x844` Playwright/browser checks; document width không overflow | Verified |
| P05-EV-034 | Keyboard/axe/focus/reduced-motion review | Có | `2026-07-27`: axe WCAG 2 A/AA and 2.1 A/AA serious/critical scan Pass trên Student Course và Admin governance; keyboard focus assertion Pass | Verified |
| P05-EV-035 | Dirty-navigation/autosave/conflict UX review | Có | Component/unit coverage và browser state review Pass; server confirmation remains source of truth | Verified |
| P05-EV-054 | Part 3/4 local browser smoke | Có | `2026-07-22`: Docker production build; Teacher tạo/publish Assignment; Student save/turn-in/unsubmit với revision history; Student start/save/submit Quiz; desktop/mobile không horizontal overflow và không có console error | Verified |

## 6. DevOps, Performance Và Remote Evidence

| ID | Evidence | Required | Planned location/result | Status |
| --- | --- | --- | --- | --- |
| P05-EV-036 | Deterministic seed first/repeat | Có | `2026-07-27`: first run P03 `8`, P04 `15`, P05 `14` created; repeat run tương ứng reused, không duplicate | Verified |
| P05-EV-037 | Docker API/Web image build | Có | `2026-07-27`: clean production API/Web image build Pass | Verified |
| P05-EV-038 | Integrated stack readiness/smoke | Có | `2026-07-27`: API/Web/MongoDB healthy; Swagger/Web success; `52/52` P05 operations | Verified |
| P05-EV-039 | Performance budgets and explain plans | Có | `2026-07-27`: Phase 05 p95 local < `500ms` cho 20 measured runs; named `IXSCAN`; P04 regression p95 todo `33.90ms`, dashboard `195.56ms`, ranking `185.61ms`, structure `40.73ms` | Verified |
| P05-EV-040 | Full local quality gate | Có | `2026-07-27`: `npm run check:ci` Pass; API `180/180`, Web `99/99`; API unit coverage `77.36/59.84/70.10/78.94%`, Web coverage `83.77/71.44/82.26/87.20%` theo statements/branches/functions/lines; Mongo integration `72/72` với integration coverage `80.66/60.95/87.56/82.97%` | Verified |
| P05-EV-041 | Dependency audit | Có | `npm run audit:production` Pass; exact React Router RSC-only advisory exception owned và hết hạn `2026-08-31` | Verified |
| P05-EV-042 | Secret Scan | Có | `2026-07-27`: Gitleaks local không phát hiện leak; PR/main `Secret scan` required job Pass | Verified |
| P05-EV-043 | Clean-clone onboarding | Có | `D:\Microlearning-phase05-clean` tại `88404f3`; clean status, `npm run check:ci`, audit, API/Web build và Docker API/Web/Mongo health Pass | Verified |
| P05-EV-044 | Implementation Pull Request review/merge | Có | [PR #14](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/14); source `e755ca6`; merge `88404f3` | Verified |
| P05-EV-045 | Implementation PR required CI | Có | [Run #30251135895](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/30251135895), `6/6` jobs Pass | Verified |
| P05-EV-046 | Post-merge `main` required CI | Có | [Run #30251385372](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/30251385372), `6/6` jobs Pass | Verified |
| P05-EV-047 | Zero open Critical/High defects | Có | Exit review: zero Critical/High; React Router advisory không áp dụng cho Vite SPA và có owner/expiry | Verified |
| P05-EV-048 | Phase 06/07 handoff review | Có | `phase-06-handoff.md`, handoff ID `P05-P06-HANDOFF-V1`; P07 private storage boundary giữ deferred | Verified |

## 7. Acceptance Và Exit Evidence

| ID | Evidence | Required | Planned location/result | Status |
| --- | --- | --- | --- | --- |
| P05-EV-049 | `74/74` Must AC evaluation | Có | `acceptance-criteria.md` + `test-case-execution-matrix.md`; `74/74 Pass` | Verified |
| P05-EV-050 | Four Conditional AC disposition | Có | Gate A `2026-07-22`: four items approved N/A/deferred | Verified |
| P05-EV-051 | Phase Exit evidence snapshot | Có | `phase-exit-evidence.md`; release/clean-clone/CI/acceptance evidence đầy đủ | Verified |
| P05-EV-052 | Exit report approval | Có | `exit-report.md`; single-contributor academic owner attestation, closure publication qua Pull Request | Verified |

## 8. Current Summary

| Category | Total | Prepared | Planned | Collected | Verified | N/A |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Planning | 8 | 0 | 0 | 0 | 8 | 0 |
| Domain/Data/API | 12 | 0 | 0 | 0 | 12 | 0 |
| Security/Privacy | 7 | 0 | 0 | 0 | 6 | 1 |
| Frontend/Browser | 10 | 0 | 0 | 0 | 10 | 0 |
| DevOps/Remote | 13 | 0 | 0 | 0 | 13 | 0 |
| Acceptance/Exit | 4 | 0 | 0 | 0 | 4 | 0 |

Current conclusion: `COMPLETED`. Part 1-Part 7, clean clone, `74/74 Must`, four approved
Conditional N/A, PR #14, PR/main `6/6` required CI, Phase Exit và P06 handoff đã có evidence.
