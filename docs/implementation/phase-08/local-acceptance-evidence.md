# Phase 08 - Local Acceptance Evidence (2026-09-22)

This record tracks the **local-only academic** scope. It does not change the historical Cloud G3-G8
statuses or claim a Production deployment.

| Gate | Current observation | Status |
| --- | --- | --- |
| L0 - Source | PR #66 merged as `d01f7b08a731c344950644382a4727787a8bad04`; [main CI run 35618029671](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/35618029671) succeeded. The local run used the same commit with `sourceDirty=false`. | `PASS` |
| L1 - Quality | `npm run check` passed on the merged commit: 238 API tests, 126 Web tests, contract tests and both builds. | `PASS` |
| L2 - Runtime | The isolated Compose project `microlearning-phase08-b0922b24` started a MongoDB replica set, API and Web. Readiness, exact API commit identity, synthetic seed and cleanup all passed. | `PASS` |
| L3 - Browser | The owner-machine Playwright run passed 40/40 selected Phase 03/05/06/08 tests with zero unexpected, flaky or skipped; JSON, JUnit and HTML reports were retained locally. | `PASS` |
| L4 - Owner UAT | Exact-commit UAT runtime and four-role technical preflight are ready. The owner's manual walkthrough, defect closure and solo-owner sign-off have not yet been recorded. Use the [local UAT matrix](local-uat-matrix.md). | `PENDING` |

## Raw local run

- Run ID: `P08-LOCAL-20260922T033616Z-18ded4`.
- Time: `2026-09-22T03:36:16Z` to `2026-09-22T03:42:40Z`.
- Retention: ignored `artifacts/phase-08/local-acceptance/P08-LOCAL-20260922T033616Z-18ded4/`
  in the clean checkout and a checksum-matching local copy under the main workspace's `artifacts/`
  directory. Raw reports are not published without redaction review.
- `summary.json` SHA-256: `586e5fd3ccce6f0ed9c12c09eba11c9ef4713569a68f28b58200c6d7ad031dcf`.
- `playwright-results.json` SHA-256: `26052eada95c3b9722dd10e17075cb902938f36d1fc22d7a0a742f21bec05fec`.
- `junit.xml` SHA-256: `fd3c3887c1da6b0c985425e5403d96429c31722e902184ca169223d03dce71fe`.
- Summary status: `PASS`; every automated check including cleanup is `PASS`;
  `productionDeployment=NOT_RUN` and `secretValuesRecorded=false`.

The earlier Docker timeout run is retained as a failed environmental attempt, not counted as acceptance.
The normal stack at `http://localhost:3000` currently reports `commitSha=local-dev`, so its health
checks are not evidence for the exact merged commit. L4 must use a runtime built from the candidate
commit and must be signed by the solo owner; automated role journeys do not replace that decision.

## Local UAT technical preflight

On `2026-09-22` at approximately `06:23 UTC`, the isolated Compose project
`microlearning-phase08-uat` was built from a clean `main` checkout at candidate commit
`d01f7b08a731c344950644382a4727787a8bad04`. It bound Web/API/MongoDB to loopback ports
`3300`/`4300`/`27019`, leaving `microlearning-local` untouched. Web and API were healthy, the API
version endpoint returned the candidate commit and `environment=test`, and the synthetic demo seed
created 10 identities plus Phase 03-05 classroom/content/assessment fixtures.

API logins succeeded for `student.active@example.test`, `teacher.active@example.test`,
`admin.active@example.test` and `superadmin.active@example.test`, each returning the intended role.
An unauthenticated `/api/v1/users/me` request returned `401`. This is a technical availability check,
**not** a completed owner UAT scenario or sign-off. No demo password or access token is recorded here.

A separate non-business-mutating Playwright smoke against that persistent UAT stack passed `6/6` on
`2026-09-22` (`0` unexpected, `0` flaky, `0` skipped). Its ignored local report is
`artifacts/phase-08/local-uat-technical-preflight-20260922/playwright-results.json`
(SHA-256 `a8bac5df14f35936acfa54c21558f63a8d7716c3b5123bc5825f72e6a8bb135b`);
the JUnit report SHA-256 is
`d322cd4f5664cbb4b49737454f990ab056b7610e7f6b7ad1c9ca57789e4f0b87`.
The report remains local and is not a substitute for the owner's ten manual observations.
