# Phase 08 - Test and Evidence Contract

## 1. Hai mức acceptance

| Mức | Dùng tại | Điều kiện Pass |
| --- | --- | --- |
| `PRE_RELEASE` | G5 | `P08-AC-001..010` Pass; G2/G3 Pass; Critical/High = 0; Production plan/recovery/promotion control ready |
| `FINAL` | G8 | `P08-AC-001..014` Pass; Production deployment Actual; smoke/observation/handover complete |

Không được dùng `FINAL=PENDING` để chặn G5 và không được dùng `PRE_RELEASE=PASS` để tuyên bố Phase 08 hoàn tất.

## 2. Evidence map

| Gate | Evidence IDs | Nội dung tối thiểu |
| --- | --- | --- |
| G0 | `P08-EV-001`, `P08-EV-002` | accepted handoff, immutable identity |
| G1 | `P08-EV-003` | test environment, personas/data, scope, catalog and evidence store |
| G2 | `P08-EV-005`, `P08-EV-010`, `P08-EV-015`, `P08-EV-016` | CI/lineage/System Test, security/NFR, API/data/integration summaries |
| G3 | `P08-EV-020`, `P08-EV-025` | UAT execution and signed role-based recommendation |
| G4 | `P08-EV-004`, `P08-EV-006`, `P08-EV-007`, `P08-EV-008`, `P08-EV-026` | Production readiness/separation/recovery/observability and defect closure |
| G5 | `P08-EV-030` | pre-release acceptance and Go/No-Go |
| G6 | `P08-EV-031`, `P08-EV-037` | plan/apply/deployment identity and production smoke |
| G7 | `P08-EV-038..040`, `P08-EV-044` | observations, alerts/incidents, support/training/comms |
| G8 | `P08-EV-050`, `P08-EV-055` | final acceptance, exit and follow-up |

Range notation in documents is descriptive. JSON records may only use IDs enumerated by `PHASE08_EVIDENCE`.

## 3. Raw evidence quality

An evidence item is acceptable only when it has:

- exact release ID and candidate identity;
- command/workflow/provider source;
- actor and UTC timestamp;
- expected and actual result;
- immutable artifact path, run URL or provider resource ID;
- redaction review;
- status and disposition for non-Pass.

Screenshot alone is supporting evidence, not sufficient for commit/digest, access-control, backup/restore or deployment claims.

## 4. Status accounting

`mustTotal = passCount + failCount + blockedCount + notRunCount + waivedCount`.

- `PASS`: evidence meets expected outcome.
- `FAIL`: behavior is wrong; defect required.
- `BLOCKED`: execution cannot continue; unblock condition required.
- `NOT RUN`: planned but not executed; cannot exit a Must gate.
- `WAIVED`: temporary accepted gap; forbidden for security/privacy/access/data/grade/deadline integrity.
- `APPROVED_NA`: capability outside selected profile/scope; decision ID required and not counted as Pass.
- `PENDING`: record is a template or evidence is not yet available.

## 5. Identity consistency

The following fields must match across G0-G8: `releaseId`, full `commitSha`, immutable `imageDigest`, `stagingRevision`, and `stagingUrl`. G6-G8 additionally require `productionRevision` and `productionUrl`.

Any application behavior change after G0 creates a new candidate. Documentation-only change may retain identity only when Technical Lead records that runtime artifact is unchanged.

## 6. Secrets and privacy

Never store password, raw invitation/refresh token, bearer token, private key, full MongoDB URI, secret value or real PII. Evidence may store secret resource name and version number, but not payload. Every generated report passes repository secret scan and the Phase 08 redactor.
