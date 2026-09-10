# Phase 08 — Risk and Issues Register

Tất cả entries ban đầu là `OPEN/PENDING`; owner phải cập nhật bằng evidence, decision hoặc closure.

| ID | Risk/issue | Impact | Owner | Gate/action | Status |
|---|---|---|---|---|---|
| P08-RSK-001 | P07 Atlas network waiver đã hết hạn; Phase 08 cần decision mới | H/H | DevOps/PO | profile-specific network control + expiry/review | `OPEN` |
| P08-RSK-002 | P07 handoff acceptance chưa actual | M/H | TL | complete G0 record | `OPEN` |
| P08-RSK-003 | Exact digest/revision mismatch | M/H | DevOps | lineage + stable record checks | `OPEN` |
| P08-RSK-004 | Solo UAT có bias hoặc session/data không tách persona | M/H | BA/QA | explicit solo governance, synthetic personas, row evidence | `OPEN` |
| P08-RSK-005 | Grade/progress/deadline regression | M/H | TL/QA | cross-layer test; no ordinary waiver | `OPEN` |
| P08-RSK-006 | RBAC/privacy/cross-scope leak | H/H | Security/TL | negative API/E2E and redaction | `OPEN` |
| P08-RSK-007 | Production backup/restore/RPO/RTO theo selected profile unproven | H/H | DevOps | logical/provider backup + isolated restore + decision | `OPEN` |
| P08-RSK-008 | Rollback incompatible with data | M/H | TL/DevOps | N/N-1 compatibility decision | `OPEN` |
| P08-RSK-009 | Alert/on-call route untested | M/M | DevOps | notification evidence | `OPEN` |
| P08-RSK-010 | Cold start/Atlas latency/cost unknown | M/M | DevOps | measured observation/capacity review | `OPEN` |
| P08-RSK-011 | Solo approval mistaken for independence | H/M | PO/TL | explicit governance record | `OPEN` |
| P08-ISS-001 | Production root `provision=false`; workflow plan-only | H/H | DevOps/TL | CR and approved apply boundary | `OPEN` |
| P08-ISS-002 | Phase 08 validators created circular G0/G5/G8 requirements and forbade required APPLY | H/H | TL | corrected contracts and 40+ local positive/negative cases; verify on PR/main | `MITIGATED - REMOTE PENDING` |
| P08-ISS-003 | UAT/system tests and sign-off not executed | H/H | QA/BA/PO | G2/G3 execution | `OPEN — confirmed by G4 review` |
| P08-ISS-004 | Academic demo support/alert destination and response expectation unconfirmed | M/H | PO/DevOps | owner + bounded support statement at G7 | `OPEN` |
| P08-ISS-005 | Planning documents contained stale 2026-09-06 NO_GO execution records | M/M | BA/TL | history separated; UAT/exit/defect templates reset | `CLOSED - documentation review` |

## Escalation

Critical/High security, data, access, availability or release dependency is escalated immediately and blocks affected gate. Closure requires evidence, reviewer and UTC date; “team agrees” is not closure.
