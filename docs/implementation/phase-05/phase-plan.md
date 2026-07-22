# Phase 05 Phase Plan

## 1. Objective

Triển khai Assessments And Grading theo vertical slice có thể demo, kiểm thử và rollback độc lập, đồng thời giữ hệ thống luôn build/test được sau mỗi Pull Request.

## 2. Gate Model

| Gate | Mục tiêu | Exit condition |
| --- | --- | --- |
| Gate A - Planning | Khóa scope/decision/contract/test | Product approval tạo readiness `READY_TO_CODE`; protected PR + CI + merge hoàn tất repository publication trước implementation |
| Gate B - Domain/Data | Model, policy, ports, indexes | Unit + Mongo integration + migration preflight Pass |
| Gate C - Quiz | Quiz/Question/Attempt/scoring/result | Teacher/Student Quiz journeys và security Pass |
| Gate D - Assignment/Grade | Submission/grade/return/deadline exception | Assignment/Grade journeys và privacy Pass |
| Gate E - Integration/Exit | To-do/progress/OpenAPI/Docker/E2E | All Must AC Pass, CI/evidence/exit report complete |

Không được đánh dấu Gate hoàn thành khi chỉ có UI placeholder hoặc mock data.

## 3. Workstreams

| Workstream | Phạm vi | Owner đề xuất |
| --- | --- | --- |
| WS-01 Product/BA | Scope, rule, AC, traceability, disposition | BA/PO |
| WS-02 Domain | Lifecycle, scoring, derived state, privacy policy | Backend/TL |
| WS-03 Data | Model, repository, index, transaction, migration | Backend/Data |
| WS-04 API/OpenAPI | Route, schema, DTO, error, Swagger | Backend/QA |
| WS-05 Teacher Web | Builder, result, submission, grading | Frontend |
| WS-06 Student Web | Quiz player, submission, own grade | Frontend |
| WS-07 Integration | Activity/To-do/deadline/progress | Full-stack |
| WS-08 Quality/Security | Test, IDOR, scoring, accessibility, perf | QA/Security |
| WS-09 DevOps/Evidence | Seed, Docker, CI, clean clone, evidence | DevOps/TL |

## 4. Milestones

| Milestone | Outcome | Gate |
| --- | --- | --- |
| M0 | Planning baseline merged | A |
| M1 | Permissions, contracts, models, indexes và migrations | B |
| M2 | Teacher Quiz Builder + lifecycle | C |
| M3 | Student Attempt + scoring + result review | C |
| M4 | Teacher Assignment + Student Submission | D |
| M5 | Grade/Feedback/Return + deadline exception | D |
| M6 | To-do/Classwork/Deadline/Progress integration | E |
| M7 | OpenAPI/E2E/security/performance/exit evidence | E |

## 5. Critical Path

```text
Gate A approved
  -> permission + activity contract version
  -> model/index/migration preflight
  -> Quiz/Question authoring
  -> Attempt snapshot + scoring
  -> Assignment + current Submission/revision
  -> Grade/return + deadline exception
  -> To-do/progress integration
  -> OpenAPI/E2E/clean clone
  -> PR/main CI + exit review
```

Quiz and Assignment branches may progress in parallel only after M1 contracts merge.

## 6. Pull Request Strategy

| PR | Nội dung | Không được chứa |
| --- | --- | --- |
| P05-PR01 | Planning baseline | Runtime implementation |
| P05-PR02 | Permissions, ports, model/index foundation | UI placeholder |
| P05-PR03 | Quiz/Question Teacher authoring API + Web | Attempt/result fake |
| P05-PR04 | Student Attempt/scoring/Teacher review API + Web | Assignment |
| P05-PR05 | Assignment/Submission API + Web | Gradebook/report export |
| P05-PR06 | Grade/Feedback/Return/deadline exception API + Web | P06 analytics |
| P05-PR07 | P04 mixed read-model integration + Web completion | GCS upload |
| P05-PR08 | Quality hardening/evidence/exit | Unreviewed feature scope |

Mỗi PR phải có Task ID, BA reference, migration impact, security impact, test evidence và rollback note.

Chi tiết branch, files, tests và exit demo cho từng PR nằm trong `pull-request-execution-guide.md`.

## 7. Branch Naming

- Planning: `docs/phase-05-planning-baseline`.
- Implementation slices: `feature/phase-05-foundation`, `feature/phase-05-quiz-authoring`, `feature/phase-05-quiz-attempts`, `feature/phase-05-assignments`, `feature/phase-05-grading-deadlines`, `feature/phase-05-learning-integration`.
- Quality/exit: `release/phase-05-quality-exit`; fix nếu cần: `fix/phase-05-<issue>`.
- Không dùng tiền tố `codex/` theo quy ước dự án.

## 8. Entry Criteria

- Phase 04 source/evidence đã merge và CI xanh.
- Planning baseline P05 được review/merge.
- Node/Mongo/Docker toolchain của P04 vẫn hoạt động.
- Không có Critical/High regression mở.
- Storage defer và URL-media policy được chấp thuận.
- Test data không dùng dữ liệu cá nhân thật.

## 9. Exit Criteria

1. Tất cả Must AC Pass; Conditional có Pass hoặc approved N/A/defer.
2. API/Web unit/component tests và Mongo replica-set integration Pass.
3. Scoring golden fixtures và concurrency tests Pass.
4. OpenAPI operation/runtime parity Pass.
5. Critical Playwright journeys Pass trên desktop/mobile.
6. Dependency audit/secret scan Pass; không answer/grade/feedback leak trong log.
7. Docker build/seed/smoke và clean-clone onboarding Pass.
8. Không Critical/High defect; Medium/Low có disposition.
9. Implementation PR merge qua protected workflow; post-merge main CI xanh.
10. Phase 06 handoff contract được version hóa và ghi evidence.

## 10. Status Vocabulary

| Status | Ý nghĩa |
| --- | --- |
| `DRAFTING` | Tài liệu đang soạn, chưa review |
| `READY_FOR_REVIEW` | Planning package đủ để review Gate A |
| `READY_TO_CODE` | Gate A đã phê duyệt; planning baseline sẵn sàng được đồng bộ qua protected PR trước implementation |
| `IMPLEMENTING` | Runtime implementation đang thực hiện |
| `IMPLEMENTED_LOCALLY` | Local evidence Pass, remote exit chưa đủ |
| `COMPLETED` | Tất cả Gate và exit evidence Pass |
| `BLOCKED` | Không thể tiến triển do dependency/decision cụ thể |

Current status: `READY_TO_CODE`; Gate A đã được Product Owner phê duyệt ngày `2026-07-22`. Implementation chưa bắt đầu.

## 11. Change Control

- Must scope change phải cập nhật scope, BA alignment, AC, WBS, risk và traceability cùng PR.
- Thêm upload/file capability phải có storage/security decision riêng; không bật bằng env ngầm.
- Thay scoring/result release phải version contract và đánh giá regrade migration.
- Thay progress formula phải bàn giao P06 và không silently đổi metric version.
