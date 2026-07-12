# Traceability Gap Register

## Mục Đích

Gap Register ghi nhận link hoặc evidence còn thiếu sau khi BA baseline đã được viết. Nó giúp team minh bạch giữa “tài liệu đã định nghĩa” và “implementation/release evidence chưa tồn tại”, không dùng matrix để tạo cảm giác hoàn thành giả.

## Status Convention

| Status | Meaning |
| --- | --- |
| Open | Gap đã xác định, chưa có action/evidence đủ. |
| In Analysis | Owner đang xác định phạm vi/impact/solution. |
| Pending Implementation Evidence | BA/design/acceptance đầy đủ; chờ code/API/CI/UAT/release result. |
| Resolved | Link/evidence đã review và accepted. |
| Deferred | Không thuộc release hiện tại, có target/decision. |
| Accepted Risk | Có waiver approved; owner/mitigation/expiry recorded. |

## Initial Gap Register

| Gap ID | Area | Description | Impact | Required completion evidence | Owner | Status | Target / trigger |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TR-GAP-001 | API implementation | FR/BR/AC đã map, nhưng endpoint implementation/Swagger operation ID/contract test result sẽ được gắn sau khi Backend code tồn tại. | High for MVP delivery | Endpoint path/operation, Swagger, auth/error/pagination test link, build result. | Backend Lead + QA Lead | Pending Implementation Evidence | Before API integration/UAT |
| TR-GAP-002 | Data implementation | MongoDB collection/index/migration/read-model rebuild evidence cho Enrollment, Progress, Deadline, Grade, Audit/Report cần gắn sau implementation. | High for integrity/performance | Schema/index/migration/reconciliation/backup-safe result. | Backend Lead + DevOps | Pending Implementation Evidence | Before Staging data test |
| TR-GAP-003 | Frontend implementation | Page/route/component/API integration evidence cho Student To-do, Teacher Dashboard, Admin lists, invitation, deadline/grading phải map tới UI build/E2E. | High for UAT | Route/page ID, API client, UI state/accessibility/responsive test. | Frontend Lead + QA Lead | Pending Implementation Evidence | Before UAT |
| TR-GAP-004 | Automated test evidence | Current TS/AC define scenarios; unit/integration/E2E test IDs and CI result are not available until code/pipeline exists. | High for release confidence | Test suite ID, CI run, coverage/retest reference. | QA Lead + Developers | Pending Implementation Evidence | Before release candidate |
| TR-GAP-005 | UAT evidence | UAT plan/scenarios/sign-off exist but no execution run/build/result until Staging release candidate. | High for business acceptance | UAT run record, evidence, defect/retest, PO decision/sign-off. | BA + QA Lead + Product Owner | Pending Implementation Evidence | Before Go/Conditional Go |
| TR-GAP-006 | Cloud/provider choice | Architecture/DevOps are vendor-neutral; provider/region/service account/secret/monitoring decisions must be recorded before Cloud deployment. | Medium/High operational | Accepted ADR/provider decision, environment/infrastructure/runbook references. | DevOps + Product Owner | Open | Before Staging Cloud |
| TR-GAP-007 | Token storage decision | JWT direction exists; final frontend token storage/refresh/CSRF policy requires security ADR before auth implementation completion. | High security | Accepted ADR, security test, configuration/implementation evidence. | Technical Lead + Security Reviewer | Open | Before auth release |
| TR-GAP-008 | Metric formula version | MVP default processScore is defined; any weighted Course formula/effective date/recalculation policy requires Product Owner decision before implementation changes it. | Medium learning/reporting | Metric definition version, BR/FR/AC/report update, reconciliation result. | Product Owner + Backend Lead | Deferred | Only if weighted score feature approved |
| TR-GAP-009 | Notification delivery | In-app notification basic is Should; external email/SMS/Gmail/Zalo delivery is not MVP scope and must not be assumed in UAT. | Low/Scope | Approved scope/integration/security/privacy/DevOps design if added. | Product Owner | Deferred | Post-MVP change request |
| TR-GAP-010 | Certificate analytics | Certificate/badge feature is excluded current scope; reporting must not claim certificate evidence. | Low/Scope | Approved scope/FR/BR/data/API/UI/AC if added. | Product Owner + BA | Deferred | Post-MVP change request |

## Gap Management Rules

- Open/High gap affecting security, data integrity, Must flow or release evidence blocks Go unless formal decision changes scope or approved risk process applies.
- `Pending Implementation Evidence` is expected before development but must be resolved/updated at its trigger gate; it is not automatic pass.
- Deferred item needs approved release target or explicit out-of-scope decision, not indefinite silence.
- Gap closure links actual artifact/evidence, reviewer, date and affected matrix rows; do not close based on verbal confirmation.
- Gap related to defect/incident is linked to Defect/waiver/Change Request and updated after retest/root cause action.

## Gap Closure Template

| Field | Content |
| --- | --- |
| Gap ID / closure date | Identifier and date. |
| Evidence link | Code/Swagger/test/CI/UAT/ADR/release/runbook reference. |
| Matrix rows updated | BRQ/FR/BR/AC/TS affected. |
| Reviewer | BA, QA, Technical Lead, DevOps or Product Owner as relevant. |
| Result | Resolved / Deferred / Accepted Risk with rationale. |
| Follow-up | Remaining action/target if not fully resolved. |

## Liên Kết

- UAT evidence: `../18-acceptance-criteria/uat-execution-and-signoff.md`.
- Defect/waiver: `../18-acceptance-criteria/defect-waiver-management.md`.
- Risk/issue: `../20-risk-management/`.
