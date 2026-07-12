# Risk Monitoring And Escalation

## Mục Đích

Risk Monitoring biến Risk Register từ một bảng tĩnh thành hoạt động quản trị thường xuyên. Tài liệu này quy định chỉ báo sớm, nhịp review, ngưỡng escalation, reporting và release-blocking condition. Các threshold kỹ thuật chi tiết phải được điều chỉnh từ baseline Staging/Production; không tự tuyên bố SLA khi chưa có measurement.

## Key Risk Indicators

| KRI ID | Chỉ báo / nguồn | Trigger cần xử lý | Action và owner ban đầu | Escalation / link |
| --- | --- | --- | --- | --- |
| KRI-001 | Open Critical Risk | Thiếu owner, response hoặc review target; hoặc target đã quá hạn. | BA/owner cập nhật ngay và thông báo PO + Technical Lead. | Block affected scope/release until decision; R-001/R-023. |
| KRI-002 | Open High Risk | Không có action/evidence trước stage gate hoặc Probability/Impact tăng. | Owner cập nhật plan; BA tổ chức risk review. | Escalate domain lead; R-004 đến R-023. |
| KRI-003 | Scope/CR queue | Change Must/High impact chưa có analysis/approval nhưng được đưa vào sprint/release. | Dừng commitment, chạy Change Control. | PO decision; R-001. |
| KRI-004 | Decision/UAT readiness | Cloud, token, file storage, UAT representative hoặc formula decision còn Open khi đến trigger. | Mở/duy trì `ISS-*`, nêu impact và deadline decision. | PO/Technical Lead; R-002/R-003/R-006/R-017/R-025. |
| KRI-005 | API contract coverage | Endpoint/schema/error/auth change chưa có Swagger hoặc integration/contract evidence. | Backend/Frontend/QA reconcile contract. | Chặn integration/release of affected feature; R-013. |
| KRI-006 | Security signals | Token/secret in log/code, authorization negative test fail, auth/invitation failures bất thường, export scope failure. | Contain access, preserve safe evidence, security triage. | Immediate Technical Lead/Security; R-004-R-007/R-016. |
| KRI-007 | Data integrity signal | Duplicate enrollment/progress, summary mismatch, unexpected score/deadline result, audit/history missing. | Stop unsafe job/mutation; investigate and reconcile. | High/Critical data escalation; R-008/R-009/R-014. |
| KRI-008 | Backup/restore signal | Backup fail/missed, backup scope unknown, restore rehearsal missing before risky migration/release. | DevOps investigate/retry/rehearse; record result. | No-Go for risky release until decision; R-010. |
| KRI-009 | Pipeline/release gate | Required CI/scan/test/approval fails or is absent; artifact/version unknown. | Block promotion; restore required gate/evidence. | QA + DevOps + Technical Lead; R-011/R-012/R-023. |
| KRI-010 | Operational health | Health DOWN/DEGRADED, 5xx/latency/restart/database/storage signals vượt normal baseline. | Acknowledge, assign incident owner, inspect version/log/dependency. | Incident process; R-018-R-020. |
| KRI-011 | Performance signal | Dashboard/list query lacks pagination/index or p95 is above approved staging baseline. | Profile/query/index review; protect service if needed. | Backend + DevOps review; R-019. |
| KRI-012 | Dependency/security scan | Vulnerable dependency/image, unsupported runtime or provider quota/credential warning. | Assess severity, patch/replace/rotate or plan mitigation. | Technical Lead + DevOps; R-020/R-022. |
| KRI-013 | UAT/acceptance result | Must scenario blocked/not run, Critical/High defect, sign-off/waiver missing. | QA triage; PO decide No-Go, scope deferral or permitted waiver. | Release readiness review; R-023. |
| KRI-014 | Release timing | High-risk deployment planned near active deadline/class activity, incident or no monitoring window. | Reschedule/freeze, notify affected owner, verify recovery plan. | PO + DevOps; R-024. |

## Review Cadence

| Thời điểm | Bắt buộc review | Người tham gia | Output |
| --- | --- | --- | --- |
| BA/scope baseline | R-001 đến R-003, R-015, R-025 và assumptions/dependencies. | PO, BA, Technical Lead, QA/DevOps as needed. | Prioritized register, open decision/CR, owner/target. |
| Sprint planning / weekly delivery review | Open High/Critical, overdue action, changed score/trigger, new dependency/defect. | BA, leads, QA, DevOps, PO when scope decision needed. | Updated status/evidence/escalation/next action. |
| Before feature integration | API/data/security/UX risks affected by the feature. | Backend, Frontend, QA, Technical Lead. | Updated FR/BR/AC/Swagger/test and risk action. |
| Before UAT | R-002, R-004/R-005/R-009/R-014/R-016 and all evidence gaps. | BA, QA, PO, representative, Technical Lead. | UAT readiness or scope deferral/No-Go. |
| Before Staging/Cloud/Production release | R-003, R-007, R-010-R-013, R-018-R-024 and release residual risk. | PO, QA, Technical Lead, DevOps, BA. | Go/Conditional Go/No-Go record and communication plan. |
| After incident or Critical/High defect | Materialized Risk, root cause, recurrence and control gap. | Incident owner + affected leads. | RCA/CAPA, updated register/rules/tests/runbook. |

## Escalation Matrix

| Condition | Mức escalation | Người nhận | Required decision/action |
| --- | --- | --- | --- |
| Critical Risk has no owner/plan, becomes Immediate, or affects security/data/core flow. | Immediate | Product Owner, Technical Lead, QA Lead, DevOps/Security as relevant. | Contain, decide scope/release impact, create Issue/Incident if materialized. |
| High Risk target passed or quality/release evidence missing at gate. | Same review period / before gate closes | Domain Lead + BA/QA/DevOps; PO if scope decision. | Action plan, reschedule/defer/no-go or approved decision. |
| Must security/privacy/data/authorization test fails. | Immediate | Technical Lead + Security Reviewer + QA + DevOps when runtime. | Do not release affected scope; triage defect/incident and retest. |
| Backup/restore/rollback evidence missing for risky deployment. | Release blocker | DevOps + Technical Lead + QA + PO. | Execute evidence, remove risky change or explicitly postpone release. |
| UAT participant/sign-off unavailable. | Business escalation | Product Owner + BA + QA. | Provide authorized representative, reschedule, or defer affected scope. |
| Medium Risk action missed. | Weekly review | Owner + BA/Project Lead. | Replan/escalate score if timing/impact changed. |

## Risk Status Reporting

Mỗi weekly/stage review cần xuất một snapshot ngắn, không cần lặp toàn bộ Register:

| Field | Nội dung |
| --- | --- |
| Review date / stage / release | Thời điểm và phạm vi review. |
| Top Critical/High Risk | ID, score, thay đổi so với lần trước, affected release. |
| New / materialized Risk | Link Issue/Defect/Incident/CR và impact. |
| Overdue / blocked action | Owner, target, escalation và decision cần có. |
| Evidence gained | CI/test/UAT/ADR/runbook/rehearsal/release record đã review. |
| Accepted Risk / waiver | Rationale, mitigation, approver, expiry/review date. |
| Go/No-Go implication | Không ảnh hưởng / conditional / blocker và authority cần quyết định. |

## Quy Tắc Escalation Và Communication

- Escalate với facts: Risk ID, actual trigger, environment/version nếu có, affected user/data, action đã làm và decision cần hỗ trợ.
- Không gửi raw token, password, secret, PII, production dump hoặc log chưa redact qua chat/email/issue.
- Communication business phải nêu impact/workaround/timing khi đã được xác nhận; không suy đoán nguyên nhân kỹ thuật.
- Risk escalation không thay thế Incident communication; incident dùng `incident-management.md` và DevOps runbook.
- Nếu Risk cần thay đổi baseline, tạo Change Request; nếu chỉ là corrective task không đổi behavior đã approved, liên kết backlog/defect là đủ.

## Điều Kiện Giảm Escalation Hoặc Đóng

- Trigger đã được xử lý và evidence được reviewer phù hợp chấp nhận.
- Không còn release blocker; residual risk và next monitoring date được ghi rõ.
- Khi decision là defer/accept, target/expiry/mitigation và communication được PO/authority ghi nhận.
- Khi risk materialized, Issue/Defect/Incident đã có owner và link từ Risk; không đổi status thành Closed trước khi follow-up hoàn tất.

## Liên Kết

- Risk score/status: `risk-register.md`.
- Response plan: `risk-response-and-contingency-plans.md`.
- Operations signals: `../15-devops-deployment/observability-operations.md`.
- Release gate: `../15-devops-deployment/release-management.md`, `../13-non-functional-requirements/nfr-quality-gates.md`.
