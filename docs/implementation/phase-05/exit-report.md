# Phase 05 Exit Report

## 1. Current Status

| Field | Value |
| --- | --- |
| Phase | `P05 - Assessments And Grading` |
| Report type | Local implementation closure snapshot |
| Planning | `READY_TO_CODE` |
| Gate A | `APPROVED` - `2026-07-22` |
| Implementation | `LOCAL_IMPLEMENTATION_COMPLETE` - Part 1-Part 7 implemented and tested locally |
| Exit decision | `PENDING_REMOTE_VERIFICATION` |
| Must acceptance | `0/74 Pass`, `74 Not Run` |
| Conditional acceptance | `4/4 Not Applicable` by approved Gate A disposition |
| Implementation PR | Pending |
| Post-merge main CI | Pending |

Đây chưa phải báo cáo `COMPLETED`. Local implementation đã hoàn thành, nhưng source commit, clean clone, formal Must AC evaluation, implementation PR, remote required CI, post-merge `main` CI và approval vẫn là điều kiện bắt buộc.

## 2. Intended Outcome

Phase 05 dự kiến cung cấp workflow Teacher tạo/publish Quiz và Assignment; Student làm Quiz, lưu/nộp bài; hệ thống chấm câu khách quan; Teacher manual review, Grade, Feedback, Return/Regrade; Student xem kết quả của chính mình theo release policy. Classwork, To-do, Deadline View và progress được mở rộng sang Quiz/Assignment bằng API/MongoDB thật.

## 3. Delivered Outcome

Part 1-Part 7 đã triển khai local cho data foundation, Quiz/Question/Attempt/scoring/result, Assignment/Submission/Grade/Regrade, deadline exception, mixed learning progress/To-do, React UI, Swagger, security/privacy, Docker seed và CI configuration. Local evidence đạt API `180/180`, Web `99/99`, Mongo integration `72/72`, OpenAPI `9/9`, Phase 05 E2E `12/12` và full browser regression `26/26`.

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
| Backend unit/integration | Test count, coverage, transaction/concurrency | Local Pass: unit `180/180`, coverage `77.36/59.84/70.10/78.94%`; integration `72/72`, coverage `80.66/60.95/87.56/82.97%` theo statements/branches/functions/lines |
| Frontend component/integration | Test count, coverage | Local Pass: `99/99`; coverage `83.77/71.44/82.26/87.20%` theo statements/branches/functions/lines |
| OpenAPI | Operation count and parity | Local Pass: `52/52` P05 operations; contract `9/9` |
| Browser E2E | Journey/browser count | Local Pass: P05 `12/12`; full Chromium regression `26/26` |
| Security/privacy | Authorization/leak matrix | Local Pass: anonymous/role/ownership/IDOR/projection matrix; Gitleaks Pass |
| Performance/index | Dataset, p95, explain | Local Pass: Phase 05 p95 < `500ms`; expected named `IXSCAN`; no unapproved `COLLSCAN` |
| Docker/seed/smoke | Image/health/idempotency | Local Pass: API/Web/Mongo healthy; P05 first `14` created, repeat `14` reused |
| Clean clone | Commit and commands | Pending implementation commit |
| Remote CI | PR/main URLs and job count | Pending |

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
| Critical defects | 0 open | Local review: `0` |
| High defects | 0 open | Local review: `0` |
| Medium/Low defects | Disposition + owner | Local browser/axe closure hoàn tất; remote evidence và approval được theo dõi như exit work |
| Accepted risks | Owner + reason + review date | React Router RSC-only advisory; owner DevOps/Security; expires `2026-08-31` |
| Data reconciliation | Completed or N/A evidence | Migration preflight/rollback dry-run Pass; production migration N/A before deployment |

## 8. Final Decision Template

```text
Decision: PENDING_REMOTE_VERIFICATION
Evaluated release: Local working tree on feature/phase-05-foundation
Must AC result: 0/74 Pass; 74 Not Run
Conditional result: 4/4 Not Applicable by approved Gate A disposition
Open blockers: source commit, clean clone, formal AC evaluation,
PR/main CI, approval and P06 handoff
```

## 9. Approval Record

| Role | Reviewer | Decision | Date | Evidence |
| --- | --- | --- | --- | --- |
| Product Owner/BA | Pending | Pending | - | - |
| Technical Lead | Pending | Pending | - | - |
| QA/Security | Pending | Pending | - | - |
| Repository Owner | Pending | Pending | - | - |

## 10. Integrity Rule

Không thay `PENDING_REMOTE_VERIFICATION` bằng `COMPLETED`, không điền CI URL và không đánh AC Pass trước khi evidence tồn tại trên đúng source/merge commit. Nếu một Conditional bị defer, phải ghi approved N/A và phase nhận bàn giao thay vì xóa khỏi báo cáo.
