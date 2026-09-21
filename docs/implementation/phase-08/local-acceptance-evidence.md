# Phase 08 - Local Acceptance Evidence (2026-09-21)

This record tracks the **local-only academic** scope. It does not change the historical Cloud G3-G8
statuses or claim a Production deployment.

| Gate | Current observation | Status |
| --- | --- | --- |
| L0 - Source | PR #66 is open against `main`; CI ran on the PR. The owner-machine acceptance attempt had uncommitted test changes at the time and is not final source evidence. | `PENDING` until merge and a clean local run |
| L1 - Quality | `npm run check` passed locally: 238 API tests, 126 Web tests, contract tests and both builds. The PR quality job passed. | `PASS` for the PR candidate |
| L2 - Runtime | CI started the seeded integrated Compose stack and passed MongoDB integration and browser jobs. The owner-machine isolated runner could not reach Docker Desktop Linux Engine. | `CI_PASS / OWNER_LOCAL_PENDING` |
| L3 - Browser | [CI run 35616519846](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/35616519846) reported 40 passed and 22 skipped. The six new local identity/security/four-role cases were in the passing set; Cloud-only suites were skipped. The owner-machine JSON/JUnit run remains pending. | `CI_PASS / OWNER_LOCAL_PENDING` |
| L4 - Owner UAT | No signed four-role manual walkthrough or defect closure for this local candidate has been recorded. | `PENDING` |

The local runner failed before building containers. Its ignored raw summary is
`artifacts/phase-08/local-acceptance/P08-LOCAL-20260921T150111Z-3c65d1/summary.json` with
`docker could not start: spawnSync docker ETIMEDOUT`. Docker Desktop's backend error on this machine
reported an inaccessible `dockerInference` socket while starting services; `wsl --list --verbose`
showed `docker-desktop` stopped. This is an environment blocker, not a passing application test.

To resume, use Docker Desktop's **Troubleshoot > Restart Docker Desktop**, wait until its engine
reports running, then check `docker info`. Do not manually delete Docker's `run` files, WSL
distributions or volumes. From a clean checkout of the merged commit, run
`npm run phase-08:local:accept` and retain a `PASS` summary with 40 expected tests, zero unexpected
and zero flaky. Complete and sign L4 separately before marking local Phase 08 complete.
