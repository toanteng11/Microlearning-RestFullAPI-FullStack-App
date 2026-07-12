# Meeting Notes Template

## Mục Đích

Mẫu này dùng cho requirement workshop, scope/release review, architecture/security review, UAT triage, incident follow-up hoặc stakeholder meeting. Meeting Notes phải biến thảo luận thành decision, action, risk/issue/change link rõ ràng; không chỉ là biên bản kể lại cuộc họp.

## Quy Ước Lưu Trữ

- Tạo record với mã `MTG-YYYYMMDD-<topic>-NN`, ví dụ `MTG-20260711-release-readiness-01`.
- Nội dung meeting note có thể dùng template này; tài liệu BA được lưu với file name English kebab-case và `.md`.
- Không ghi password, raw invitation URL/token, Cloud credential, Production PII, full private submission hoặc raw log chưa redact.
- Facilitator gửi recap/decision/action cho attendee trong thời gian team thống nhất; decision chỉ được coi là baseline khi authority xác nhận theo Document Control/Change Control.

## 1. Thông Tin Cuộc Họp

| Trường | Giá trị |
| --- | --- |
| Meeting ID / Name | `[Điền mã và tên cuộc họp]` |
| Date / Timezone / Duration | `[YYYY-MM-DD, timezone, thời lượng]` |
| Meeting Type | `[Requirement / Scope / Architecture / Security / UAT / Release / Incident / Other]` |
| Facilitator / Note Taker | `[Tên hoặc role]` |
| Attendees / Absentees | `[Tên hoặc role; ghi authority/proxy nếu có]` |
| Objective | `[Kết quả cần đạt, không chỉ chủ đề chung]` |
| Pre-read / Evidence | `[Document ID/path, build/version, safe evidence link]` |
| Linked Items | `[BRQ/FR/BR/AC/TS/Risk/Issue/Decision/CR/Release]` |

## 2. Agenda Và Discussion Notes

| Agenda ID | Topic / question | Discussion facts | Options / impact | Outcome / next step |
| --- | --- | --- | --- | --- |
| AG-01 | `[Chủ đề]` | `[Facts, source, evidence]` | `[Option và trade-off]` | `[Decision, action hoặc open question]` |
| AG-02 | `[Chủ đề]` | `[Facts, source, evidence]` | `[Option và trade-off]` | `[Decision, action hoặc open question]` |

Ghi facts đã xác minh tách biệt với opinion/assumption. Nếu còn bất đồng hoặc thiếu evidence, ghi Open Question/Issue thay vì kết luận theo đa số không có authority.

## 3. Decision Record

| Decision ID | Decision / rationale | Authority | Affected artifact | Effective point | Status |
| --- | --- | --- | --- | --- | --- |
| `[DEC-* hoặc quyết định mới]` | `[Lựa chọn và lý do]` | `[PO / Technical Lead / Security / DevOps]` | `[Scope, FR, BR, API, Data, UAT, Release]` | `[Release/date/event]` | `[Proposed / Recorded Baseline / Approved / Deferred]` |

Mọi decision đổi scope/priority/API/data/security/NFR/release phải link `CR-*` hoặc nêu lý do vì sao chỉ là clarification không đổi behavior.

## 4. Action Items

| Action ID | Action / expected evidence | Owner | Target date or gate | Priority | Status |
| --- | --- | --- | --- | --- | --- |
| ACT-01 | `[Việc cụ thể và evidence cần có]` | `[Role/tên]` | `[YYYY-MM-DD hoặc Before UAT/RC]` | `[High/Medium/Low]` | `[Open/In Progress/Blocked/Done]` |

Action phải có kết quả kiểm chứng được. “Kiểm tra lại” cần ghi rõ kiểm tra tài liệu/test/environment nào, ai review và tiêu chí pass là gì.

## 5. Risk, Issue Và Change Impact

| Type | ID / description | Impact | Owner | Required follow-up |
| --- | --- | --- | --- | --- |
| Risk | `[R-* hoặc risk mới]` | `[Probability/Impact/release effect]` | `[Owner]` | `[Update register/response]` |
| Issue | `[ISS-* hoặc APP-Q-*]` | `[Current blocker/decision]` | `[Owner]` | `[Decision/action target]` |
| Change | `[CR-*]` | `[Scope/API/data/security/release impact]` | `[Owner]` | `[Change Control analysis/approval]` |
| Defect / Incident | `[DEF-* / INC-*]` | `[Actual impact/severity]` | `[Owner]` | `[Retest/RCA/communication]` |

## 6. Next Steps Và Confirmation

| Nội dung | Giá trị |
| --- | --- |
| Decision cần xác nhận sau meeting | `[ID, authority, deadline/gate]` |
| Next meeting / checkpoint | `[Date/time/gate/owner]` |
| Recap distribution | `[Audience/channel, privacy restriction]` |
| Notes approved by | `[Authority hoặc status pending review]` |

## Final Checklist

- [ ] Objective và attendee/authority rõ.
- [ ] Facts/evidence khác với assumption/opinion.
- [ ] Decision có owner/status và artifact impact.
- [ ] Action có owner/target/evidence, không chỉ có chủ đề.
- [ ] Risk/Issue/Defect/CR linked đúng source.
- [ ] Không có sensitive data trong notes/evidence.
- [ ] BA cập nhật source documents/RTM/Risk/Release record nếu meeting quyết định thay đổi baseline.

## Liên Kết

- Decision/Issue: `../20-risk-management/issue-decision-log.md`.
- Change Control: `../04-scope/change-control.md`.
- Evidence guideline: `evidence-and-test-data-guidelines.md`.
