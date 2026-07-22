# Phase 05 Testing Strategy

## 1. Test Objectives

- Chứng minh scoring/state đúng, không chỉ endpoint trả 2xx.
- Chứng minh quyền/visibility ở object và field level.
- Chứng minh retry/concurrency không tạo duplicate hoặc partial data.
- Chứng minh P04 Lesson/Classwork/To-do không regression.
- Chứng minh React sử dụng API thật và hiển thị đầy đủ state.

## 2. Test Layers

| Layer | Focus | Runtime |
| --- | --- | --- |
| Unit | Lifecycle, validation, scoring, derived state, URL/deadline policy | Vitest no DB |
| Repository integration | Index, projection, aggregation | Mongo replica set |
| Service integration | Transaction, concurrency, RBAC/IDOR | Express + Mongo |
| OpenAPI contract | Schema/example/operation parity | OpenAPI parser/runtime manifest |
| Web component | Form/state/error/a11y/navigation | Vitest + Testing Library |
| Browser E2E | Real React/API/Mongo critical journeys | Playwright + Docker |
| Performance | Critical query/mutation baseline | Seeded Mongo/runtime |
| Security | Leakage, XSS, URL, mass assignment, abuse | Unit/integration/E2E |

## 3. Golden Scoring Fixtures

| Fixture | Answer | Expected |
| --- | --- | --- |
| Single correct | exact correct ID | Full points |
| Single wrong/unanswered | other/null | 0 |
| Multiple exact | same unique set any order | Full points |
| Multiple subset/superset | not exact | 0 |
| Duplicate option IDs | malformed | Validation reject |
| True/false | exact canonical | Full/0 |
| Short answer | any text | NEEDS_REVIEW, no final manual score |
| Mixed Quiz | objective + short | objective subtotal + pending manual |
| 100 Questions | bounded valid payload | Correct total/performance target |

Golden tests use integer points and injectable snapshot; no DB needed.

## 4. Lifecycle Unit Matrix

### Quiz/Assignment

- Every allowed transition.
- Every denied transition.
- Publish prerequisites.
- Scheduled/effective state before/equal/after time.
- Edit lock while published/scheduled.
- Archive retention semantics.
- Closed/reopen Assignment reason.

### Attempt

- start/resume/limit.
- save before/equal/after expiry.
- submit/retry/concurrent.
- timeout reconciliation.
- needs-review/finalize/release/regrade.

### Submission/Grade

- draft/turn-in/unsubmit/resubmit.
- late/missing boundary.
- grade draft/return/regrade.
- evidence revision mismatch.
- deadline exception set/extend/revoke/denied shorten.

## 5. Mongo Integration Matrix

| ID range | Test focus |
| --- | --- |
| P05-IT-001..008 | Model validation/index manifest |
| P05-IT-009..016 | Quiz/Question repositories/reorder/revision |
| P05-IT-017..026 | Attempt start/save/submit/timeout transactions |
| P05-IT-027..034 | Objective/manual scoring/result release |
| P05-IT-035..044 | Assignment/Submission current/history/late |
| P05-IT-045..052 | Grade/return/regrade/history/privacy |
| P05-IT-053..060 | Deadline exception/current/history/recalc |
| P05-IT-061..068 | Mixed Classwork/To-do/Deadline/Progress |
| P05-IT-069..074 | Migration/rollback/reconciliation/explain |

## 6. Concurrency Tests

1. Two simultaneous start requests -> one active attempt/one number.
2. Two simultaneous answer saves same revision -> one wins.
3. Submit and expiry reconciliation race -> one terminal outcome.
4. Two simultaneous submits -> one score/progress/grade side effect.
5. Two first draft saves -> one current Submission.
6. Turn-in vs draft save -> revision guard prevents lost update.
7. Unsubmit vs Teacher grade -> defined one wins/no partial state.
8. Two regrades -> one revision wins.
9. Two deadline extensions -> one current/history revision chain.

## 7. Authorization And Privacy Tests

- Student A cannot view/mutate Student B Attempt/Submission/Grade/comment.
- Teacher B cannot manage Teacher A Quiz/Assignment/result.
- Removed Enrollment cannot start/submit or read new assessment.
- BLOCKED account direct API denied.
- Admin without exceptional capability cannot read private evidence.
- Student DTO recursively lacks `correctOptionIds`, rubric, Teacher-only feedback draft.
- Student grade list excludes DRAFT and foreign Grades.
- Guessed ID error does not leak title/owner/existence.

## 8. Validation And Security Tests

- Unknown fields/mass assignment rejected.
- XSS corpus in prompt/instruction/short answer/submission/feedback.
- Unsafe URL schemes, credentials, non-allowlisted host, excessive URL.
- Oversized Question/options/answers/submission payload.
- Manipulated score/maxScore/status/timestamps.
- Rate limiter keys and 429 behavior.
- Audit/log redaction snapshot.
- Feature flags disabled fail closed.

## 9. Web Component Tests

| Area | Cases |
| --- | --- |
| Quiz Builder | Types/options/correct/points/reorder/publish blockers/conflict |
| Quiz Intro | Attempts/deadline/disabled reason/resume |
| Quiz Player | Controls/save state/countdown/expiry/unanswered confirm |
| Quiz Result | Pending vs released/no answer leak |
| Assignment Editor | Method/policy/due/file-disabled/publish |
| Student Assignment | Draft/turn-in/late/closed/unsubmit/resubmit |
| Submission Roster | Filter/page/derived statuses/return context |
| Grading | Score boundaries/draft/return/regrade conflict |
| Deadline Exception | reason/min length/extend/denied shortening/history |
| Own Grades | Returned only/filter/empty/error |
| Integration | Mixed To-do/Classwork/Deadline/action URLs |

## 10. Critical E2E Journeys

| ID | Journey |
| --- | --- |
| `P05-E2E-01` | Teacher creates objective Quiz -> adds/reorders Questions -> previews -> publishes. |
| `P05-E2E-02` | Student opens intro -> starts -> saves answers -> refreshes/resumes -> submits -> sees immediate result. |
| `P05-E2E-03` | Student submits mixed Quiz -> Teacher manual reviews/returns -> Student sees released result. |
| `P05-E2E-04` | Attempt limit/expiry/double-submit negative journey. |
| `P05-E2E-05` | Teacher creates Assignment -> Student saves draft/turns in -> Teacher sees roster. |
| `P05-E2E-06` | Late enabled/disabled/closed Assignment variants. |
| `P05-E2E-07` | Student unsubmit/resubmit -> history/current/To-do correct. |
| `P05-E2E-08` | Teacher grades/returns/regrades -> Student visibility boundary correct. |
| `P05-E2E-09` | Teacher extends Student A deadline -> Student A/B show distinct deadline/status. |
| `P05-E2E-10` | Cross-scope deep-link Student/Teacher denial. |
| `P05-E2E-11` | Mixed Lesson/Quiz/Assignment To-do completion journey. |
| `P05-E2E-12` | Desktop/mobile navigation, unsaved warning and no overflow. |

## 11. OpenAPI Tests

- 100% mounted P05 operations documented.
- Unique operationIds.
- Request examples validate.
- Student/Teacher schemas separated.
- Error status/code examples align.
- Conditional feature response documented.
- Existing P01-P04 operation parity unchanged.

## 12. Performance Tests

Use dataset/targets từ DevOps/data docs. Warm-up, at least defined sample iterations, report p50/p95/max and environment. Failing target blocks Gate E until optimized or approved variance có evidence.

## 13. Accessibility And Responsive Tests

- Keyboard complete Quiz/Assignment/grade critical action.
- Focus moves predictably after question navigation/dialog.
- Timer and statuses not color-only.
- Form errors associated labels/fields.
- Mobile no horizontal page overflow/overlap.
- Media alt/fallback.
- Reduced motion.

## 14. Regression Suite

- Auth/RBAC/session.
- Classroom ownership/enrollment/class code/link.
- Course/Module/Lesson/Flashcard/Announcement.
- Lesson deadline/completion.
- P04 Student To-do/Deadline/Teacher Dashboard/Admin governance.
- Docker/Swagger/System Status.

## 15. Coverage Gates

Reuse repository thresholds; new scoring/domain policies target near-complete branch coverage. Coverage không thay thế critical integration/E2E tests.

## 16. Test Data Rules

- Synthetic identity/content only.
- Fixed fake server clock.
- Stable ObjectIds where useful.
- No real email/password/token/private Student work.
- Correct answers stored only in server test fixtures, not browser fixture visible before attempt.

## 17. Evidence

Store command, commit, result count, coverage, CI URL, browser report and performance dataset. A test marked Pass without reproducible evidence không đủ Phase Exit.
