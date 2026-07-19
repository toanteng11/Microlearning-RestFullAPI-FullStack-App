# Open Questions

## Mục Đích

Open Question Log ghi nhận điều chưa đủ thông tin để chốt policy, design, test, deployment hoặc release. Nó ngăn team tự giả định để code nhanh. Khi có câu trả lời, question phải chuyển thành Decision, Issue action, Change Request hoặc trạng thái Not Applicable; không để câu trả lời không owner nằm trong meeting chat.

## Phân Biệt Và Lifecycle

| Artifact | Khi dùng |
| --- | --- |
| Open Question | Cần authority/analysis xác định câu trả lời; tác động chưa được giải quyết. |
| Issue | Vấn đề hiện tại cần action/decision, có impact cụ thể. |
| Decision | Authority đã chọn một option có rationale/impact. |
| Change Request | Decision đề xuất thay baseline behavior/scope/priority. |
| Risk | Sự kiện tương lai có Probability/Impact; có thể phát sinh từ question chưa trả lời. |

```text
Open -> In Analysis -> Answer Proposed -> Resolved
                         -> Converted to Issue / Decision / Change Request
                         -> Deferred / Not Applicable with rationale
```

`Resolved` cần link nguồn trả lời/decision/reviewer/date. `Deferred` có target release/gate; không phải cách đóng câu hỏi không có câu trả lời.

## Priority

| Priority | Quy tắc |
| --- | --- |
| Critical | Block security, data integrity, legal/policy, UAT hoặc Cloud release ngay. |
| High | Block feature/architecture/RC/release gate nếu không có answer đúng hạn. |
| Medium | Ảnh hưởng Should feature, estimate hoặc design detail; cần answer trước target work. |
| Low | Không ảnh hưởng MVP hiện tại, nhưng có giá trị roadmap/documentation. |

## Current Open Question Log

| Question ID | Câu hỏi cần chốt | Owner / authority | Priority | Decision trigger | Linked source | Status / current direction |
| --- | --- | --- | --- | --- | --- | --- |
| APP-Q-003 | Swagger UI/OpenAPI exposure và operator access policy theo environment là gì, đặc biệt Cloud Demo/Production-like có public read-only hay restricted? | Technical Lead + DevOps + Security Reviewer | Medium | Before public/Staging API exposure | ARC-030, FR-067A, AC-API-003 | Open; Local/Development enabled, Staging authorized, Cloud default restricted cho đến khi có environment security decision. |
| APP-Q-005 | Ai là Teacher, Student, Admin representative cho UAT và ai có sign-off authority/proxy? | Product Owner + QA Lead | High | Before UAT planning | ISS-005, R-002, REL-DEP-007 | Open; cần participant, test account/data và schedule. |
| APP-Q-007 | RPO/RTO, backup retention/frequency, restore rehearsal cadence và backup media scope cuối cùng là gì theo provider/budget? | DevOps + Product Owner + Technical Lead | High | Before risky migration/Cloud release | NFR-BKP-001, R-010, REL-DEP-008 | Open; current docs chỉ nêu direction, chưa claim configured values. |
| APP-Q-009 | Resource/file/media scope có dùng safe external link trước, hay cần provider upload; nếu upload, allowed type/size/access/retention/backup policy là gì? | Product Owner + Technical Lead + DevOps | Medium | Before resource/media sprint | ISS-004, R-017, REL-DEP-009 | Open; default là REL-1.1 unless approved earlier. |
| APP-Q-010 | AuditLog/report/export retention, access reviewer và disposal/anonymization policy là gì cho môi trường Cloud? | Product Owner + Security Reviewer + Technical Lead | Medium | Before sensitive export/Cloud release | BR-099/101/102/108/109, privacy docs | Open; no final retention/purpose policy recorded. |
| APP-Q-011 | Khi/ nếu weighted `processScore` được yêu cầu, công thức, effective date, historical recalculation và user communication policy là gì? | Product Owner + Backend Lead + BA | Medium | Before any weighted-score Change Request | ISS-006, TR-GAP-008, R-025 | Deferred; MVP default remains `progressPercentage`. |

## Resolved Question Log

| Question ID | Kết luận baseline | Authority cần formal approval | Linked source | Release condition |
| --- | --- | --- | --- | --- |
| APP-Q-002 | Access JWT chỉ trong memory; opaque refresh token trong `HttpOnly` cookie, hash/rotation/revoke theo ADR-006; MVP same-site Frontend/API, CORS allowlist và Origin/Referer check. | Technical Lead + Security Reviewer | ADR-006, DEC-013, NFR-SEC-012, ARC-011 | Security test evidence và formal approval trước auth release. |
| APP-Q-004 | Password dài 12-128 ký tự, không có khoảng trắng đầu/cuối, không cắt ngầm/không bắt buộc đổi định kỳ; generic message và rate-limit/cooldown cho auth/reset. | Technical Lead + Security Reviewer + Product Owner | DEC-014, NFR-SEC-007/011 | Boundary/security/UAT evidence và formal approval trước auth UAT. |
| APP-Q-001 | Chọn Google Cloud Run tại `asia-southeast1` làm application runtime, MongoDB Atlas làm managed database và GitHub Actions làm CI/CD; Firebase không sử dụng. Supporting services là Artifact Registry, Secret Manager và Cloud Logging/Monitoring. | Product Owner + DevOps + Technical Lead | ADR-010, DEC-015, ISS-001, TR-GAP-006 | Provider question đã resolved ngày 2026-07-17; account/billing/quota/domain và deployment evidence vẫn là Phase 07 actions. |
| APP-Q-008 | GitHub Actions là CI/CD provider; Google Artifact Registry là registry; Staging/Production deploy dùng protected environment, immutable digest và ưu tiên Workload Identity Federation. | DevOps + Technical Lead | ADR-010, DEC-015, ISS-002, REL-DEP-005 | Provider/architecture resolved ngày 2026-07-17; CD workflow và remote evidence phải hoàn thành ở Phase 07. |

## Question Record Template

| Field | Nội dung bắt buộc |
| --- | --- |
| Question ID / title | Mã `APP-Q-*` và câu hỏi có thể trả lời được. |
| Context / why now | Scope/decision/gate nào bị ảnh hưởng, nếu không trả lời thì điều gì bị block. |
| Options / facts known | Option, assumption, evidence/source hiện có; không giả định option đã chosen. |
| Owner / authority | Người phân tích và người có quyền chốt có thể khác nhau. |
| Priority / target gate | Critical/High/Medium/Low và date/release/UAT/RC trigger. |
| Linked artifact | ISS/DEC/CR/Risk/FR/BR/AC/ADR/Release/Gap liên quan. |
| Outcome | Decision/Issue/CR/Deferred/Not Applicable, rationale, reviewer/date. |

## Review Rules

- Review High/Critical question trong weekly planning/risk review và trước mỗi target gate.
- Question answer thay Business Rule, scope, API/data/security/NFR hoặc release phải tạo Decision/Change Request và update source/RTM.
- Nếu question materializes thành operational blocker, tạo Issue; nếu tạo khả năng impact tương lai, link/create Risk.
- Không loại bỏ question do người hỏi không còn tham gia; phải chuyển owner hoặc record Not Applicable với rationale.

## Liên Kết

- Issue/Decision Log: `../20-risk-management/issue-decision-log.md`.
- Risk Register: `../20-risk-management/risk-register.md`.
- Release dependencies: `../21-release-planning/release-dependencies-and-assumptions.md`.
- Change Control: `../04-scope/change-control.md`.
