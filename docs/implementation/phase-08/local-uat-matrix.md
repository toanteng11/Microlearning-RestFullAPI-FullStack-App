# Phase 08 - Local Owner UAT Matrix

This is the remaining L4 gate for the local-only academic deliverable. Do not reuse the Cloud G3
matrix as proof of local UAT. The solo owner performs and signs this review; automated Playwright
results are supporting evidence, not an owner decision.

## Run header

| Field | Value |
| --- | --- |
| UAT run ID | `P08-LOCAL-UAT-<UTC date>-<sequence>` |
| Candidate commit | `d01f7b08a731c344950644382a4727787a8bad04` |
| Runtime commit from `/api/v1/system/version` | `d01f7b08a731c344950644382a4727787a8bad04` at technical preflight; owner must recheck before sign-off |
| Web and API URLs | `http://localhost:3300`, `http://localhost:4300` (isolated UAT stack) |
| Data mode | `SYNTHETIC` |
| Actor | Trần Đức Toàn, solo owner |
| Start/end UTC | `PENDING` |

The browser sessions and database must point to a runtime built from the candidate commit. The
`localhost:3000` stack reports `local-dev`; do not use it for this sign-off. The isolated UAT stack
passed readiness, four-role API login and guest `401` checks on `2026-09-22`, but those technical
checks do not fill in the owner's scenario results. Use separate browser profiles/contexts for each
persona. The active accounts are `student.active@example.test`, `teacher.active@example.test`,
`admin.active@example.test` and `superadmin.active@example.test`. Obtain the synthetic-data password
from the local owner handoff; do not record it in this file or screenshots.

## Scenarios

For every row, record actual behavior, UTC time and a local screenshot or API evidence path.
Mark `FAIL` and open a defect if actual behavior differs from expected. Do not paste passwords or
tokens into evidence.

| ID | Persona | Action | Expected result | Actual/evidence | Status |
| --- | --- | --- | --- | --- | --- |
| LOCAL-UAT-01 | Student | Sign in, open profile, sign out and revisit a protected page | Session works; sign-out removes access | `PENDING` | `PENDING` |
| LOCAL-UAT-02 | Student | Join an eligible classroom by code, then repeat the same request | One membership; no duplicate enrollment | `PENDING` | `PENDING` |
| LOCAL-UAT-03 | Student | Open a lesson, complete it and inspect progress/to-do | Completion and progress update consistently | `PENDING` | `PENDING` |
| LOCAL-UAT-04 | Student | Start, save, submit and inspect a quiz or assignment result | Submitted work and released result match the rules | `PENDING` | `PENDING` |
| LOCAL-UAT-05 | Teacher | Open an owned classroom, manage members and publish content | Only owned resources change; Student sees published content | `PENDING` | `PENDING` |
| LOCAL-UAT-06 | Teacher | Review a submission, grade/regrade and inspect Gradebook | Score, feedback, history and Gradebook agree | `PENDING` | `PENDING` |
| LOCAL-UAT-07 | Admin | Manage an invitation/user and inspect governance/reporting | Admin actions work without exposing private answers | `PENDING` | `PENDING` |
| LOCAL-UAT-08 | Super Admin | Open elevated admin management in a separate session | Elevated controls work; ordinary Admin lacks them | `PENDING` | `PENDING` |
| LOCAL-UAT-09 | Student/Teacher | Try a forbidden role route and another owner's resource | `403` or intentional `404`; no foreign data leaks | `PENDING` | `PENDING` |
| LOCAL-UAT-10 | Guest/Student | Submit malformed input and retry a completed operation | Validation error is clear; retry does not create duplicate data | `PENDING` | `PENDING` |

## Defects and decision

| Defect ID | Scenario | Severity | Expected/actual | Fix commit | Retest evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| None recorded yet | | | | | | `PENDING` |

L4 may be `PASS` only when all applicable scenarios pass, no Critical/High defect remains open,
the candidate identity matches, and the owner records a UTC sign-off with
`soloProject=true` and `independentReview=false`. Otherwise keep L4 `PENDING` or `FAIL`.
