# Phase 05 Development Readiness Review

## 1. Review Snapshot

| Field | Value |
| --- | --- |
| Review date | `2026-07-22` |
| Dependency | Phase 04 completed; closure commit `4860e45` trên `main` |
| Planning branch | `docs/phase-05-planning-baseline` |
| Planning package | Prepared; awaiting Pull Request review/CI/merge |
| Planning status | `READY_FOR_REVIEW` |
| Gate A | `PENDING` |
| Code authorization | `NOT_AUTHORIZED` |
| Implementation | `NOT_STARTED` |

## 2. Readiness Assessment

| Area | Assessment | Evidence | Remaining action |
| --- | --- | --- | --- |
| BA scope/traceability | Prepared | Scope, BA alignment, phase matrix | PO/BA review |
| Phase boundary | Prepared | P04/P05/P06/P07 handoff explicit | TL accept |
| Quiz/Question lifecycle | Prepared | lifecycle/scoring document | PO/BE/QA accept |
| Attempt/scoring/release | Prepared | immutable snapshot, exact-match, manual review | Security/QA accept |
| Assignment/Submission | Prepared | current + append-only revisions | PO/BE accept |
| Grade/deadline exception | Prepared | return/regrade/privacy/effective deadline | PO/Security accept |
| Architecture/ports | Prepared | module/port/request flow | TL accept |
| Data/index/transaction | Prepared | model/index/migration/rollback | BE/Data accept |
| API/OpenAPI | Prepared | endpoint/payload/error contract | BE/QA accept |
| Frontend UX/accessibility | Prepared | routes/screens/states/navigation | FE/QA accept |
| DevOps/seed/CI | Prepared | environment, seed, gates | DevOps accept |
| Testing/acceptance | Prepared | testing strategy + 78 AC | QA/PO accept |
| WBS/dependency | Prepared | 108 tasks + critical path | TL accept |
| Risk/evidence/exit | Prepared | registers and truthful templates | TL/QA accept |

Không còn gap tài liệu đã biết ngăn package được đưa ra review. Tuy nhiên, “đủ để review” chưa phải “được phép code”; các quyết định và baseline chỉ có hiệu lực sau protected Pull Request merge.

## 3. Product Confirmations Required

| ID | Nội dung cần xác nhận | Baseline đề xuất | Blocking |
| --- | --- | --- | --- |
| P05-PC-001 | Cách chấm Multiple Choice | Exact set; không partial credit | Có |
| P05-PC-002 | Final Quiz score khi làm nhiều lần | Highest submitted/released attempt | Có |
| P05-PC-003 | FILE/media upload | Defer P07; không local/container disk | Có |
| P05-PC-004 | Gradebook boundary | Basic grid Conditional; weighting/export để P06 | Có |
| P05-PC-005 | Normal Teacher deadline exception | Chỉ được gia hạn, không rút ngắn/đặt quá khứ | Có |
| P05-PC-006 | Progress metric P05 | Required activity completion; chưa weighted grade | Có |
| P05-PC-007 | Question media URL | Conditional, allowlisted HTTPS; default off nếu chưa review | Không chặn Must |
| P05-PC-008 | Assignment LINK/MARK_DONE | Conditional theo explicit policy | Không chặn Must |
| P05-PC-009 | Private comments | Conditional; có thể defer | Không chặn Must |

Các mục `PC-001..006` phải được chấp thuận hoặc thay bằng một quyết định kiểm thử được trước Gate A. Khi thay đổi baseline, cập nhật rule, API, data, test, AC và WBS đồng thời.

## 4. Technical Review Questions

- Attempt snapshot có giới hạn đủ để không tiến gần MongoDB document limit không?
- Partial unique index/transaction nào bảo đảm một active Attempt?
- Save answer và submit dùng revision/state precondition ra sao?
- Student projection được dựng bằng allowlist ở service/DTO nào?
- Grade Return/Regrade có history và AuditLog atomic không?
- Tất cả late/missing/To-do có gọi cùng effective deadline resolver không?
- Activity contract v2 giữ regression compatibility với Lesson như thế nào?
- Migration preflight và named index rollback có chạy được trên replica set không?
- Không endpoint nào nhận multipart hoặc ghi local filesystem đúng không?

Reviewer chỉ đánh `Accepted` khi câu trả lời đã có trong baseline và có test/evidence task tương ứng.

## 5. Gate A Closure Conditions

| ID | Condition | Owner | Current status | Evidence required |
| --- | --- | --- | --- | --- |
| P05-GA-001 | Approve Must/Conditional/Deferred scope | PO/BA | Pending | PR review/comment resolution |
| P05-GA-002 | Approve `PC-001..006` | PO/BA | Pending | Accepted decision record |
| P05-GA-003 | Accept Must technical decisions | TL | Pending | `technical-decisions.md` updated |
| P05-GA-004 | Approve API/data/transaction/migration contract | BE/Data/QA | Pending | Review approval |
| P05-GA-005 | Approve security/privacy/storage policy | Security/DevOps | Pending | Review approval |
| P05-GA-006 | Approve UI/accessibility plan | FE/QA | Pending | Review approval |
| P05-GA-007 | Approve 78 AC/108 tasks/evidence model | QA/PO | Pending | Review approval |
| P05-GA-008 | Validate links/format/counts/local quality gate | QA/DevOps | Passed | `P05-EV-002`: `npm run check:ci`, API `149/149`, Web `84/84`, builds Pass |
| P05-GA-009 | Planning PR required CI Pass | DevOps | Pending | GitHub Actions URL |
| P05-GA-010 | Planning PR merge vào `main` | Repository owner | Pending | PR URL + merge commit |
| P05-GA-011 | Post-merge readiness closure | TL/Owner | Pending | Document updated to `READY_TO_CODE` |

## 6. Readiness Scorecard

| Dimension | Prepared | Approved | Weight |
| --- | ---: | ---: | ---: |
| Product/BA | 100% | 0% | 20 |
| Architecture/Data/API | 100% | 0% | 25 |
| Security/Privacy | 100% | 0% | 15 |
| Frontend/UX | 100% | 0% | 10 |
| Test/Acceptance | 100% | 0% | 15 |
| DevOps/Evidence | 100% | 0% | 10 |
| Review/Merge | 0% | 0% | 5 |

Prepared score dùng để đánh giá độ đầy đủ của tài liệu, không phải phần trăm hoàn thành Phase. Implementation completion hiện là `0%`.

## 7. Current Decision

```text
Decision: READY_FOR_REVIEW
Code authorization: NOT_AUTHORIZED
Reason: Planning package đã được soạn nhưng chưa có reviewer approval, required CI và merge commit.
Next action: hoàn tất local validation, commit/push branch, mở planning Pull Request và đóng P05-GA-001..011.
```

## 8. Approval Record

| Role | Reviewer | Decision | Date | Evidence |
| --- | --- | --- | --- | --- |
| Product Owner/BA | Pending | Pending | - | - |
| Technical Lead/Backend | Pending | Pending | - | - |
| Frontend/QA | Pending | Pending | - | - |
| Security/DevOps | Pending | Pending | - | - |
| Repository Owner | Pending | Pending | - | - |

Không điền tên, ngày hoặc `Approved` trước khi hành động review/merge thực sự xảy ra.
