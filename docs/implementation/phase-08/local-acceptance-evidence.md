# Phase 08 - Local Acceptance Evidence (2026-09-22)

This record tracks the **local-only academic** scope. It does not change the historical Cloud G3-G8
statuses or claim a Production deployment.

| Gate | Current observation | Status |
| --- | --- | --- |
| L0 - Source | PR #66 merged as `d01f7b08a731c344950644382a4727787a8bad04`; [main CI run 35618029671](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/35618029671) succeeded. The local run used the same commit with `sourceDirty=false`. | `PASS` |
| L1 - Quality | `npm run check` passed on the merged commit: 238 API tests, 126 Web tests, contract tests and both builds. | `PASS` |
| L2 - Runtime | The isolated Compose project `microlearning-phase08-b0922b24` started a MongoDB replica set, API and Web. Readiness, exact API commit identity, synthetic seed and cleanup all passed. | `PASS` |
| L3 - Browser | The owner-machine Playwright run passed 40/40 selected Phase 03/05/06/08 tests with zero unexpected, flaky or skipped; JSON, JUnit and HTML reports were retained locally. | `PASS` |
| L4 - Owner UAT | Four-role manual walkthrough, defect closure and solo-owner sign-off have not yet been recorded. Use the [local UAT matrix](local-uat-matrix.md). | `PENDING` |

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
