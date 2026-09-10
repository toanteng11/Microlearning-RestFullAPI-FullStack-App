# Phase 08 — Technical Decisions

| ID | Decision | Rationale | Status/owner |
|---|---|---|---|
| P08-TD-001 | Promote exact immutable digest, never rebuild/tag-only | preserves test-to-production lineage | `BASELINE / DevOps` |
| P08-TD-002 | Keep Production plan-only through G4; permit protected APPLY only after exact G5 GO | removes unsafe apply while allowing G6/G8 to be achievable | `PLANNED / TL` |
| P08-TD-003 | Production service/config/state/secret/database user/name must be separate | avoids cross-environment data and credential leakage | `PLANNED / DevOps` |
| P08-TD-004 | No business feature in final phase | protects scope freeze and release confidence | `BASELINE / PO` |
| P08-TD-005 | Synthetic data for UAT unless privacy decision approves sanitized data | evidence safety and reproducibility | `PLANNED / PO/Security` |
| P08-TD-006 | `APPROVED_NA` is not `PASS` | maintains credible acceptance accounting | `PLANNED / QA` |
| P08-TD-007 | Rollback must preserve data compatibility | revision-only rollback cannot undo incompatible schema/data | `PLANNED / TL/DevOps` |
| P08-TD-008 | Default planning profile is `ACADEMIC_DEMO_RELEASE` | matches a solo academic project and synthetic-only public demo | `PLANNED / PO; confirm G0` |
| P08-TD-009 | One actor may hold multiple roles but cannot claim independent approval | keeps governance honest for a solo project | `PLANNED / PO` |
| P08-TD-010 | G5 evaluates PRE_RELEASE AC-001..010; G8 evaluates FINAL AC-001..014 | removes circular dependency between Go and deployment evidence | `PLANNED / TL/QA` |

## Open decisions

- Confirm the selected release profile and synthetic-only rule at G0 (`PENDING`).
- Production Atlas network/database user/backup/restore/RPO/RTO controls for that profile (`PENDING`).
- Reviewed implementation of protected APPLY; current production root remains `provision = false` (`PENDING`).
- `run.app` versus custom domain, budget/quota, alert test and bounded academic support owner (`PENDING`).

No open decision may be silently assumed in a Go record.
