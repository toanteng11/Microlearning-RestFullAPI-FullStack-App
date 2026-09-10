# Phase 08 - UAT Execution Matrix Template

## Planning status

`READY_TO_EXECUTE / PENDING RESULTS`. Historical blocked runs remain under their release-scoped artifact folders and are not copied into this template.

## Run header

| Field | Required value |
| --- | --- |
| UAT Run ID | `P08-G3-UAT-<UTC-date>-<sequence>` |
| Release ID | exact G0 release ID |
| Candidate | full commit SHA, immutable digest, Staging revision |
| Environment | exact HTTPS Staging URL |
| Data mode | `SYNTHETIC` for academic profile |
| Execution model | `SOLO_ROLE_SIMULATION` or approved external participants |
| Actor | Trần Đức Toàn / named external participant |
| Start/end | ISO-8601 UTC |

## Persona separation

| Persona | Minimum data boundary | Session rule | Status |
| --- | --- | --- | --- |
| Student A/B | different memberships/submissions/results | separate browser context | `PENDING` |
| Teacher A/B | different owned classrooms/courses | separate browser context | `PENDING` |
| Admin | user/invitation/governance scope | separate browser context | `PENDING` |
| Super Admin | only when capability is in selected scope | separate browser context | `PENDING` |

## Execution matrix

| Row | Catalog IDs | Persona | Required outcome | Status | Evidence/defect |
| --- | --- | --- | --- | --- | --- |
| UAT-R01 | 001-004 | Student/Admin/Teacher | auth/invitation lifecycle and safe denial | `PENDING` | `PENDING` |
| UAT-R02 | 005-008 | Teacher/Student | classroom/join/content lifecycle | `PENDING` | `PENDING` |
| UAT-R03 | 009-012 | Student | learning and assessment submission | `PENDING` | `PENDING` |
| UAT-R04 | 013-017 | Teacher/Student | grade/deadline/progress/history | `PENDING` | `PENDING` |
| UAT-R05 | 018-022 | Teacher/Admin | reporting/governance/audit/privacy | `PENDING` | `PENDING` |
| UAT-R06 | 023-027 | all roles/QA | API/session/security/conditional scope | `PENDING` | `PENDING` |
| UAT-R07 | 028-032 | QA/DevOps | cloud/runtime/operations/recovery | `PENDING` | `PENDING` |

Each catalog scenario must also have a row-level record containing expected, actual, actor/persona, UTC, release identity, status and artifact. A group row cannot hide a failed child scenario.

## Summary template

| Planned | Pass | Fail | Blocked | Not Run | Waived | Approved N/A | Critical/High open | Decision |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 32 | 0 | 0 | 0 | 32 | 0 | 0 | 0 | `PENDING` |

## Exit and sign-off

All Must scenarios must be `PASS`; conditional excluded capability may be `APPROVED_NA` with decision. The solo owner records separate QA, BA/PO and Technical recommendations with `soloProject=true`, `independentReview=false`, UTC and evidence. External participant acknowledgement is optional for the academic profile.
