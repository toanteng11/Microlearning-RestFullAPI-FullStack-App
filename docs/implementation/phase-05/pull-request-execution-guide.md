# Phase 05 Pull Request Execution Guide

## 1. Mục Đích

Hướng dẫn này chia Phase 05 thành Pull Request có dependency, file scope, test gate và evidence rõ. Mỗi PR phải giữ repository build/test được, có vertical behavior thật và không chứa placeholder.

## 2. Workflow Bắt Buộc

1. Chỉ bắt đầu runtime PR sau khi P05-PR01 planning đã review/merge và Gate A=`READY_TO_CODE`.
2. Mỗi branch implementation tách từ `main` mới nhất, không tách từ branch PR chưa merge trừ khi explicitly approved stacked PR.
3. Không dùng tiền tố `codex/`.
4. Mỗi PR link WBS IDs, BA IDs, Acceptance IDs, risk và migration impact.
5. Required CI xanh + approval trước merge.
6. Sau merge: sync `main`, xác nhận post-merge CI, rồi mới tạo branch tiếp theo.

```powershell
git switch main
git pull --ff-only origin main
git status --short
git switch -c <branch-name>
```

Expected: working tree sạch trước khi tạo branch.

## 3. PR Dependency Graph

```text
P05-PR01 Planning baseline
  -> P05-PR02 Foundation/data contracts
     -> P05-PR03 Quiz/Question authoring
        -> P05-PR04 Attempt/scoring/review
     -> P05-PR05 Assignment/Submission
        -> P05-PR06 Grade/Deadline exception
           -> P05-PR07 Mixed learning/Web integration
              -> P05-PR08 Hardening/evidence/exit
```

PR05 có thể bắt đầu sau PR02 trong team nhiều người, nhưng dự án cá nhân nên đi tuần tự PR03 -> PR04 -> PR05 để giảm merge conflict ở router/OpenAPI/Web shell.

## 4. P05-PR01 - Planning Baseline

| Thuộc tính | Giá trị |
| --- | --- |
| Branch | `docs/phase-05-planning-baseline` |
| WBS | `P05-T001..008` |
| Runtime | Không |
| Exit | Review decisions, CI xanh, merge `main`, readiness đổi `READY_TO_CODE` |

### Review trọng tâm

- Exact-set/HIGHEST/result release.
- File upload defer P07 và URL conditional.
- Extend-only deadline exception.
- Completion-only P05 progress metric.
- Response envelope, 52 API operations, source/test blueprint.

Không đánh P05-PR01 Done chỉ vì tài liệu local đầy đủ; cần PR URL, approval, required checks và merge commit.

## 5. P05-PR02 - Foundation And Data Contracts

| Thuộc tính | Giá trị |
| --- | --- |
| Branch | `feature/phase-05-foundation` |
| WBS | `P05-T009..020` |
| BA/AC | Cross-cutting security/data/API AC |
| Depends | P05-PR01 merged |

### Included

- Permissions/role grants và tests.
- P05 environment flags/rate limits, `.env.example`, `testConfig`.
- Activity descriptor/progress union/version + P04 compatibility.
- All P05 models, named indexes và repository skeleton có real CRUD/CAS methods cần cho next slice.
- Phase Five index manifest/server initialization.
- Shared ports/types, migration preflight và rollback tests.
- Phase Five foundation composition; chưa mount empty/fake routes.

### Primary files

- `shared/auth/permissions.ts`.
- `shared/config/environment.ts`, `.env.example`, test fixtures.
- `learning-content/learning-activity.reader.ts`, `learning-progress.reader.ts`.
- P05 `*.model.ts`, `*.repository.ts`, `*.types.ts`.
- `shared/database/phase-five-indexes.ts`, `server.ts`.
- `phase-five.foundation.ts`.

### Required tests

- Permission deny/grant matrix.
- Environment missing/invalid/production explicit/hard file-upload guard.
- `P05-IT-001..008`, `P05-IT-069..072` relevant foundation cases.
- P04 data/progress regression.

### Exit

- Clean build without runtime placeholder route.
- Index manifest Pass on replica set.
- Migration preflight idempotent.
- No model import across modules.

## 6. P05-PR03 - Quiz And Question Authoring

| Thuộc tính | Giá trị |
| --- | --- |
| Branch | `feature/phase-05-quiz-authoring` |
| WBS | `P05-T021..035`, frontend part `P05-T083` |
| Depends | P05-PR02 merged |

### Included

- Quiz/Question domain policies, services, DTOs và repositories hoàn chỉnh.
- 13 Teacher authoring routes, limiter, ownership và audit.
- OpenAPI authoring file + operation parity.
- Quiz create/list/builder/preview React screens dùng API thật.
- Conditional URL media chỉ khi Gate A approved; default feature-off path vẫn tested.

### Excluded

- Attempt/start/score/result fake data.
- Assignment/Grade.
- Upload/GCS.

### Required tests

- Unit lifecycle/question/publish prerequisite.
- `P05-IT-009..016`.
- `P05-OAS-001..008` phần operations đã mount.
- `P05-WEB-001..004`.
- `P05-E2E-01`.
- Recursive Student preview forbidden-field assertion.

### Exit demo

Teacher tạo Quiz, thêm đủ loại Question, reorder, xem validation/preview và publish qua Web/Swagger; không có scoring key trong Student-safe payload.

## 7. P05-PR04 - Quiz Attempt, Scoring And Review

| Thuộc tính | Giá trị |
| --- | --- |
| Branch | `feature/phase-05-quiz-attempts` |
| WBS | `P05-T036..052`, quiz part `P05-T068..073`, frontend `P05-T084/087` |
| Depends | P05-PR03 merged |

### Included

- Immutable attempt snapshot, active guard và attempt number transaction.
- Student intro/start/resume/save/submit/history/result.
- Exact objective scoring, timeout reconciliation, short-answer review.
- Teacher result list/detail/review/finalize/release/regrade.
- Quiz Player, Student Result, Teacher Results/Review UI.
- Quiz completion update để later read-model integration consume.

### Required tests

- Golden scoring policy tests.
- `P05-IT-017..034` và Quiz-related `P05-IT-045..052`.
- Concurrent double-start/save/submit.
- `P05-WEB-005..011`.
- `P05-E2E-02..04`, Quiz branch of `P05-E2E-08/10`.
- OpenAPI/runtime parity for 13 attempt/result operations.

### Exit demo

Student làm objective/mixed Quiz end-to-end; Teacher manual review/release/regrade; Student chỉ thấy own released result.

## 8. P05-PR05 - Assignment And Submission

| Thuộc tính | Giá trị |
| --- | --- |
| Branch | `feature/phase-05-assignments` |
| WBS | `P05-T053..067`, frontend `P05-T085/086` |
| Depends | P05-PR02 merged; dự án cá nhân sau PR04 |

### Included

- Assignment lifecycle/policy/CRUD/preview.
- Current Submission + append-only revisions.
- Draft/turn-in/unsubmit/resubmit/history và derived roster states.
- Teacher Assignment list/editor/roster; Student Assignment page.
- TEXT Must; LINK/MARK_DONE only when approved; FILE hard-disabled.

### Required tests

- Assignment/submission pure policies.
- `P05-IT-035..044`.
- First-save/double-turn-in concurrency and rollback.
- `P05-WEB-012..015`.
- `P05-E2E-05..07`, Assignment branch of `P05-E2E-10`.
- OpenAPI parity for 15 Assignment/Submission operations.

### Exit demo

Teacher publish Assignment; Student save/turn in/unsubmit/resubmit theo policy; Teacher roster hiển thị assigned/draft/submitted/late/missing đúng mà không tạo placeholder rows.

## 9. P05-PR06 - Grade, Feedback And Deadline Exceptions

| Thuộc tính | Giá trị |
| --- | --- |
| Branch | `feature/phase-05-grading-deadlines` |
| WBS | `P05-T068..080`, frontend `P05-T087..090` |
| Depends | P05-PR04 và P05-PR05 merged |

### Included

- Generic Grade target adapters cho Quiz Attempt/Assignment Submission.
- Grade draft/return/regrade/history và Student own returned Grade.
- Transactional visibility boundary.
- Generic deadline exception Lesson/Quiz/Assignment, resolver/set/revoke/history.
- Grader, own Grades và deadline exception screens.
- Conditional Gradebook chỉ khi flag/decision approved và Must xanh. Private Comments mặc định defer/N/A; nếu được bật phải có change-control bổ sung full API/data/UI/test contract trước PR06.

### Required tests

- `P05-IT-045..060`.
- Injected return transaction failure/rollback.
- Student A/B scoped deadline effect.
- `P05-WEB-016..020` relevant cases.
- `P05-E2E-08..10`.
- OpenAPI parity cho 11 Grade/Deadline operations, cộng Conditional Gradebook nếu bật.

### Exit demo

Teacher chấm/trả/chấm lại; Student thấy đúng own returned Grade; Teacher gia hạn riêng Student và mọi due/late state dùng cùng resolver.

## 10. P05-PR07 - Mixed Learning And Web Integration

| Thuộc tính | Giá trị |
| --- | --- |
| Branch | `feature/phase-05-learning-integration` |
| WBS | `P05-T081..093` còn lại |
| Depends | P05-PR03..06 merged |

### Included

- Composite Activity reader V2.
- Classwork/To-do/Deadlines/Progress/Teacher dashboard mixed activities.
- Admin Course assessment counts metadata-only.
- Navigation/actionUrl/Back/breadcrumb/unsaved/conflict states toàn bộ P05.
- Responsive/accessibility corrections cho critical screens.

### Required tests

- `P05-IT-061..068`.
- P04 Lesson/Classwork/To-do/Progress regression.
- Web route guard/all integration component tests.
- `P05-E2E-11/12` và smoke toàn bộ prior P05 E2E.
- No horizontal overflow ở 1440x900, 768x1024 và 390x844.

### Exit demo

Student và Teacher có navigation liền mạch giữa Lesson/Quiz/Assignment; không còn P05 endpoint Must chưa có UI consumer.

## 11. P05-PR08 - Quality Hardening And Exit

| Thuộc tính | Giá trị |
| --- | --- |
| Branch | `release/phase-05-quality-exit` |
| WBS | `P05-T094..108` |
| Depends | P05-PR07 merged |

### Included

- Complete OpenAPI examples/parity and Swagger seeded smoke.
- Deterministic/idempotent Phase Five seed.
- Docker integrated stack update.
- Full security/IDOR/field-leak/rate tests.
- Performance/explain/reconciliation evidence.
- Full Playwright desktop/mobile critical journeys.
- Clean clone, AC evaluation, risks, evidence và exit report.

### Excluded

- Feature mới để “tiện thể”.
- P06 weighted analytics/export.
- P07 GCS/Cloud deployment.

### Required gates

1. `npm run check:ci`.
2. `npm run test:integration` trên replica set.
3. `npm run test:openapi`.
4. `npm run test:e2e` trên seeded integrated stack.
5. `npm audit --omit=dev --audit-level=high`.
6. Secret scan required job.
7. Docker build/first seed/repeat seed/smoke.
8. Clean-clone reproduction.

### Exit

- 74 Must AC Pass; 4 Conditional Pass hoặc approved N/A.
- 74 integration cases và 12 E2E journeys có result evidence.
- Không Critical/High defect.
- PR merge, post-merge `main` CI xanh.
- Exit report `COMPLETED` và P06 handoff versioned.

## 12. Standard PR Description

```md
## Scope
- Phase: P05
- PR: P05-PR0X
- WBS: P05-T...
- BA/AC: FR-..., BR-..., P05-AC-...

## Behavior
- Actor/workflow trước và sau thay đổi
- State transition và retry/concurrency behavior

## Data And Migration
- Collections/indexes/schema version
- Backward compatibility/rollback

## Security And Privacy
- Permission + ownership/enrollment checks
- DTO fields được phép/forbidden

## Verification
- Commands, passed counts, source commit
- Integration/OpenAPI/E2E/CI URLs

## Conditional/Deferred
- Feature flags và N/A/defer disposition
```

## 13. Commit Guidance

- Commit message ngắn, có intent: `feat: add quiz authoring contracts`.
- Không gom docs, generated reports và unrelated cleanup vào runtime commit.
- OpenAPI/test/docs đi cùng behavior commit hoặc commit kế tiếp trong cùng PR.
- Không force-push sau review trừ khi branch policy/team đồng ý; mọi check phải chạy lại.

## 14. After-Merge Checklist

```powershell
git switch main
git pull --ff-only origin main
git log -1 --oneline
git status --short
```

Sau đó:

1. Xác nhận merge commit/PR number.
2. Xác nhận post-merge `main` required CI xanh.
3. Cập nhật `evidence-register.md`, WBS và checklist cho đúng task đã merge.
4. Không đánh toàn Phase Completed khi chỉ một slice hoàn tất.
5. Tạo branch PR tiếp theo từ `main` mới nhất.

## 15. Stop Conditions

Dừng merge và sửa trước khi tiếp tục nếu có một trong các tình huống:

- Runtime/OpenAPI route mismatch.
- Student DTO/log lộ scoring key, answer, foreign work hoặc draft feedback.
- Concurrency test flaky/fail.
- Mongo transaction/index test không chạy trên replica set.
- UI có action không được API `allowedActions` cho phép.
- Required check bị skip/bypass.
- Scope P06/P07 lọt vào PR mà chưa change control.
