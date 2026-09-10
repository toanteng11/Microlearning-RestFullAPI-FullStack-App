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
