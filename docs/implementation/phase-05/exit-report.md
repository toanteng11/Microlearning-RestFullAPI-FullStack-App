# Phase 05 Exit Report

## 1. Current Status

| Field | Value |
| --- | --- |
| Phase | `P05 - Assessments And Grading` |
| Report type | Pre-created exit template |
| Planning | `READY_TO_CODE` |
| Gate A | `APPROVED` - `2026-07-22` |
| Implementation | `NOT_STARTED` |
| Exit decision | `NOT_EVALUATED` |
| Must acceptance | `0/74 Pass`, `74 Not Run` |
| Conditional acceptance | `4/4 Not Applicable` by approved Gate A disposition |
| Implementation PR | Pending |
| Post-merge main CI | Pending |

Đây chưa phải báo cáo hoàn thành. Tài liệu được tạo sẵn để ngăn việc đóng Phase thiếu bằng chứng và sẽ được cập nhật trong Pull Request closure riêng sau implementation merge.

## 2. Intended Outcome

Phase 05 dự kiến cung cấp workflow Teacher tạo/publish Quiz và Assignment; Student làm Quiz, lưu/nộp bài; hệ thống chấm câu khách quan; Teacher manual review, Grade, Feedback, Return/Regrade; Student xem kết quả của chính mình theo release policy. Classwork, To-do, Deadline View và progress được mở rộng sang Quiz/Assignment bằng API/MongoDB thật.

## 3. Delivered Outcome

`None yet.` Runtime implementation chưa bắt đầu. Planning documents không được tính là chức năng đã giao.

## 4. Exit Conditions To Be Proven

- `74/74` Must Acceptance Criteria Pass.
- Bốn Conditional AC Pass hoặc approved N/A.
- Quiz/Question/Attempt/scoring and result release operate end-to-end.
- Assignment/Submission/Grade/Feedback/Deadline exception operate end-to-end.
- No answer key, draft grade or private Student work leakage.
- Concurrency, retry, transaction and rollback tests pass.
- Activity/To-do/Deadline/Progress v2 works without Phase 04 regression.
- Swagger/OpenAPI matches runtime routes.
- Browser/accessibility/performance/Docker/clean-clone evidence pass.
- Implementation PR and post-merge `main` required CI are green.
- No Critical/High defect remains open.

## 5. Results Template

| Category | Planned evidence | Final result |
| --- | --- | --- |
| Backend unit/integration | Test count, coverage, transaction/concurrency | Not run |
| Frontend component/integration | Test count, coverage | Not run |
| OpenAPI | Operation count and parity | Not run |
| Browser E2E | Journey/browser count | Not run |
| Security/privacy | Authorization/leak matrix | Not run |
| Performance/index | Dataset, p95, explain | Not run |
| Docker/seed/smoke | Image/health/idempotency | Not run |
| Clean clone | Commit and commands | Not run |
| Remote CI | PR/main URLs and job count | Not run |

## 6. Residual Scope Template

Khi đóng Phase, ghi rõ disposition cuối cùng:

- Question image/video URL.
- Assignment external LINK/MARK_DONE.
- Private Assignment comments.
- Basic read-only Gradebook.
- Private file/media upload bàn giao Phase 07.
- Weighted process score, ranking, export và advanced reporting bàn giao Phase 06.

## 7. Defect And Risk Closure Template

| Item | Required final state | Current state |
| --- | --- | --- |
| Critical defects | 0 open | Not evaluated |
| High defects | 0 open | Not evaluated |
| Medium/Low defects | Disposition + owner | Not evaluated |
| Accepted risks | Owner + reason + review date | Not evaluated |
| Data reconciliation | Completed or N/A evidence | Not evaluated |

## 8. Final Decision Template

```text
Decision: NOT_EVALUATED
Evaluated release: Pending
Must AC result: 0/74 Pass; 74 Not Run
Conditional result: 4/4 Not Applicable by approved Gate A disposition
Open blockers: implementation, validation and remote evidence
```

## 9. Approval Record

| Role | Reviewer | Decision | Date | Evidence |
| --- | --- | --- | --- | --- |
| Product Owner/BA | Pending | Pending | - | - |
| Technical Lead | Pending | Pending | - | - |
| QA/Security | Pending | Pending | - | - |
| Repository Owner | Pending | Pending | - | - |

## 10. Integrity Rule

Không thay `NOT_EVALUATED` bằng `COMPLETED`, không điền test count/CI URL và không đánh AC Pass trước khi evidence tồn tại trên đúng source/merge commit. Nếu một Conditional bị defer, phải ghi approved N/A và phase nhận bàn giao thay vì xóa khỏi báo cáo.
