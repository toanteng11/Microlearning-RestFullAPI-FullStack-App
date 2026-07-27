# Phase 05 Exit Report

## 1. Current Status

| Field | Value |
| --- | --- |
| Phase | `P05 - Assessments And Grading` |
| Report type | Final Phase Exit report |
| Planning | `READY_TO_CODE` |
| Gate A | `APPROVED` - `2026-07-22` |
| Implementation | `COMPLETED` - Part 1-Part 7 verified at release `88404f3` |
| Exit decision | `COMPLETED` |
| Must acceptance | `74/74 Pass` |
| Conditional acceptance | `4/4 Not Applicable` by approved Gate A disposition |
| Implementation PR | [#14](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/14), merged |
| Post-merge main CI | [Run #30251385372](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/30251385372), `6/6 Pass` |

Source commit, clean clone, formal Must AC evaluation, implementation PR, PR/main required
CI, risk review và P06 handoff đã hoàn thành. Phase 05 đủ điều kiện đóng.

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

## 5. Final Results

| Category | Planned evidence | Final result |
| --- | --- | --- |
| Backend unit/integration | Test count, coverage, transaction/concurrency | Pass: unit `180/180`, coverage `77.36/59.84/70.10/78.94%`; integration `72/72`, coverage `80.66/60.95/87.56/82.97%` theo statements/branches/functions/lines |
| Frontend component/integration | Test count, coverage | Pass: `99/99`; coverage `83.77/71.44/82.26/87.20%` theo statements/branches/functions/lines |
| OpenAPI | Operation count and parity | Pass: `52/52` P05 operations; contract `9/9` |
| Browser E2E | Journey/browser count | Pass: P05 `12/12`; full Chromium regression `26/26` |
| Security/privacy | Authorization/leak matrix | Pass: anonymous/role/ownership/IDOR/projection matrix; Gitleaks Pass |
| Performance/index | Dataset, p95, explain | Pass: Phase 05 p95 < `500ms`; expected named `IXSCAN`; no unapproved `COLLSCAN` |
| Docker/seed/smoke | Image/health/idempotency | Pass: API/Web/Mongo healthy; P05 first `14` created, repeat `14` reused |
| Clean clone | Commit and commands | Pass at `88404f3`: clean status, `npm ci`, `check:ci`, audit, build and Docker health |
| Remote CI | PR/main URLs and job count | PR run #30251135895 and main run #30251385372, both `6/6 Pass` |

## 6. Residual Scope

Disposition cuối cùng:

- Question image/video URL: disabled/N/A tại P05.
- Assignment external LINK/MARK_DONE: disabled/N/A tại P05.
- Private Assignment comments: deferred/N/A.
- Basic read-only Gradebook: deferred sang Phase 06.
- Private file/media upload: bàn giao Phase 07.
- Weighted process score, ranking, export và advanced reporting: bàn giao Phase 06.

## 7. Defect And Risk Closure

| Item | Required final state | Current state |
| --- | --- | --- |
| Critical defects | 0 open | Exit review: `0` |
| High defects | 0 open | Exit review: `0` |
| Medium/Low defects | Disposition + owner | `0` open; one accepted dependency risk tracked separately |
| Accepted risks | Owner + reason + review date | React Router RSC-only advisory; owner DevOps/Security; expires `2026-08-31` |
| Data reconciliation | Completed or N/A evidence | Migration preflight/rollback dry-run Pass; production migration N/A before deployment |

## 8. Final Decision

```text
Decision: COMPLETED
Evaluated release: 88404f3
Must AC result: 74/74 Pass
Conditional result: 4/4 Not Applicable by approved Gate A disposition
Open Critical/High defects: 0
P06 handoff: P05-P06-HANDOFF-V1 accepted
```

## 9. Approval Record

| Role | Reviewer | Decision | Date | Evidence |
| --- | --- | --- | --- | --- |
| Product Owner/BA | Trần Đức Toàn | Accepted | `2026-07-27` | `74/74 Must`, scope/defer review |
| Technical Lead | Trần Đức Toàn | Accepted | `2026-07-27` | Architecture, test and release evidence review |
| QA/Security | Automated gates + owner attestation | Accepted | `2026-07-27` | PR/main `6/6`, security/privacy evidence |
| Repository Owner | `toanteng11` | Accepted | `2026-07-27` | PR #14 merge and protected `main` CI |

## 10. Integrity Rule

Decision `COMPLETED` chỉ áp dụng cho release `88404f3` cùng evidence được dẫn trong báo cáo.
Conditional vẫn giữ approved N/A và scope deferred được bàn giao, không bị xóa khỏi baseline.
Các vai trò phê duyệt trùng nhau do đây là đồ án học thuật một thành viên; giới hạn độc lập
review được công khai thay vì mô tả như một external approval.
