# Part 05 - Performance, Accessibility and Responsive Verification

## Outcome

The release meets BA NFR targets under a documented Staging workload and remains usable on P0 screens.

## Entry

- Stable candidate and deterministic dataset.

## Tasks

1. Record dataset size, endpoint, concurrency, warm-up, sample count, region, tool and UTC window.
2. Measure simple read p95 <= 800 ms, list/report p95 <= 1000 ms, mutation p95 <= 1200 ms and dashboard p95 <= 1500 ms where each category applies.
3. Measure initial frontend load target <= 3 seconds on documented good Staging network.
4. Record error rate, cold-start outliers, Cloud Run instances/concurrency and Atlas pool behavior.
5. Run axe on P0 pages and manual keyboard/focus/status checks.
6. Verify desktop and mobile viewports for overflow, overlap, dead-end navigation, empty/error/loading states.

## Exit

Measured report contains methodology and raw result. Any miss has defect/risk and disposition; no universal capacity claim is made from a small sample. Must accessibility issues are closed before G2 Pass.

## Implementation status

`LOCAL_PASS_REMOTE_PENDING` on branch `phase-08-part-04-05-quality-verification`.

- The quality suite records one warm-up plus five measured samples at bounded concurrency `1` for simple read, list/report, mutation, dashboard and frontend initial load.
- `scripts/lib/phase-08-quality.mjs` calculates nearest-rank p95 from raw samples and enforces BA thresholds of `800/1000/1200/1500/3000 ms` with zero request errors.
- Chromium verifies public Login, Student dashboard/progress states, Teacher Gradebook and Admin governance at desktop/mobile viewports using axe WCAG A/AA, keyboard focus and horizontal-overflow checks.
- The report records environment, Staging region, network path, deterministic dataset, sample count and tool. It is a release acceptance measurement, not a universal SLA or capacity claim.

Part 05 becomes `DONE` only after the updated System Test workflow succeeds for the exact candidate and stores the machine-readable quality reports with final redaction Pass.
