# Phase 08 — Scope and Deliverables

## Outcome

Một release cuối có thể nghiệm thu và vận hành có kiểm soát, với trace từ BA requirement đến exact artifact, kết quả test, decision, production record và project closure. Profile lập kế hoạch là `ACADEMIC_DEMO_RELEASE`; Phase không thêm feature nghiệp vụ.

## Deliverables

| ID | Deliverable | Owner | Acceptance evidence | Status |
|---|---|---|---|---|
| P08-D01 | Accepted P07 handoff | Technical Lead | signed `P08-G0-*`, valid handoff record | `PENDING` |
| P08-D02 | Release identity lock | TL/DevOps | commit, digest, revision, URL, manifest | `PENDING` |
| P08-D03 | System Test report | QA | catalog counts, raw reports, defects | `PENDING` |
| P08-D04 | UAT execution/sign-off | BA/QA/PO | matrix, defect/retest, decision | `PENDING` |
| P08-D05 | Production readiness pack | DevOps/Security | plan, IAM, secrets, Atlas, recovery | `PENDING` |
| P08-D06 | Production deployment record | Release Owner | exact digest, revision, traffic, smoke | `PENDING` |
| P08-D07 | Observation/hypercare/handover | DevOps/Support | T+0..T+72h, runbooks, contacts | `PENDING` |
| P08-D08 | Training and communications | BA/PO | materials, audience, acknowledgement | `PENDING` |
| P08-D09 | Final evidence and exit report | PO/TL/BA | exit pack, residual risks, closure | `PENDING` |
| P08-D10 | Release profile and solo-governance record | PO/BA | profile/data class/role statements | `PENDING` |
| P08-D11 | Source/workflow implementation pack | TL/DevOps | Part 00-13, contract and workflow tests | `PENDING` |

## In scope

- Regression of P07 release and all Must behavior from Phases 01–07.
- Authentication/RBAC, classroom/content, learning, assessment, grading, reporting, audit/privacy and operational contracts.
- Cloud Run/Artifact Registry/GitHub Actions/Secret Manager/Atlas release controls already present in repository.
- Public Production-like academic demo using synthetic data and bounded support/cost controls.

## Out of scope

New business capability; Firebase, external email, SSO, mobile native, payment, AI, real-user Production migration, organizational SLA/compliance claims, real PII in test/demo evidence, and conditional capabilities not enabled by current configuration.

## Completion rule

Deliverable chỉ hoàn thành khi status là `ACTUAL` với evidence link. `PLANNED`, `PENDING`, `APPROVED_NA` hoặc `BLOCKED` không được mô tả là complete.
