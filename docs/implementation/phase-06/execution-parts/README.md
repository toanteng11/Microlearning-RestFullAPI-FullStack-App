# Phase 06 Execution Parts

## 1. Purpose

Thư mục này chia Phase 06 thành các phần triển khai nhỏ để một developer có thể hoàn thành,
kiểm tra và ghi nhận bằng chứng theo từng checkpoint. Cách chia này không thay đổi Business
Analysis baseline, acceptance criteria, WBS hoặc phạm vi của các Pull Request đã duyệt.

Mỗi `Execution Part` là một đơn vị công việc có:

- một mục tiêu duy nhất;
- dependency rõ ràng;
- nhóm file được phép thay đổi;
- test ID bắt buộc;
- điều kiện dừng khi có rủi ro;
- Definition of Done có thể kiểm chứng.

## 2. Current Status

| Thuộc tính | Giá trị |
| --- | --- |
| Gate A | `APPROVED` |
| Implementation | `COMPLETED` |
| Part 00 | `DONE` |
| Part 01-05 | `DONE` |
| Part 06 | `DONE` |
| Part 07-08 | `DONE` |
| Part 09-10 | `DONE` |
| Part 11-12 | `DONE` |
| Part 13 | `DONE` |
| Part 14 | `DONE`; Admin UI/E2E/privacy Pass |
| Part 15 | `DONE`; four enabled capabilities Pass, two capabilities `APPROVED_NA` |
| Part 16 | `DONE`; full quality, Docker, performance, visual và clean clone Pass |
| Part 17 | `DONE`; protected PR/main CI và P07 acceptance Pass |
| Activation evidence | PR `#16`, CI `6/6`, merge `e7437bc`, local `main` synchronized |
| Foundation implementation | Commit `1afe813`; Gate B Pass; included in release PR `#18` |
| Student reporting implementation | Commit `f560233`; `student-reporting-evidence.md`; release CI Pass |
| Teacher reporting implementation | Commit `9096d78`; `teacher-reporting-evidence.md`; release CI Pass |
| Gradebook implementation | Commit `fe36dda`; `gradebook-evidence.md`; release CI Pass |
| Admin Reporting API implementation | Commit `2bbbc2d`; `admin-reporting-api-evidence.md`; release CI Pass |
| Admin Reporting Web implementation | Commit `c1f5fa9`; `admin-reporting-web-evidence.md` |
| Conditional reporting implementation | Commit `f1baf06`; `conditional-reporting-evidence.md` |
| Quality hardening | `quality-hardening-evidence.md`; PR `#18` và post-merge main CI Pass |

## 3. Execution Map

| Part | Nội dung | Parent PR | Dependency | Exit chính |
| --- | --- | --- | --- | --- |
| 00 | Gate A And Baseline | P06-PR01 | P05 handoff | Gate A Approved, planning merged |
| 01 | Contract Permissions And Environment | P06-PR02 | 00 | Contract compile, permission/env tests Pass |
| 02 | Metric And Grade Policies | P06-PR02 | 01 | Pure policy tests Pass |
| 03 | Reader Ports And Safe Adapters | P06-PR02 | 01 | Scoped, batched, safe projections |
| 04 | Summary Data Layer | P06-PR02 | 02-03 | Schema, indexes, repositories Pass |
| 05 | Transactional Invalidation | P06-PR02 | 04 | Source + intent atomic, no production noop |
| 06 | Refresh Reconciliation And Migration | P06-PR02 | 03-05 | Gate B Pass |
| 07 | Student Reporting API | P06-PR03 | 06 | Student API/OpenAPI/integration Pass |
| 08 | Student Reporting Web | P06-PR03 | 07 | Student UI and E2E 01-04 Pass |
| 09 | Teacher Reporting API | P06-PR04 | 06 | Dashboard/ranking/detail APIs Pass |
| 10 | Teacher Reporting Web | P06-PR04 | 09 | Teacher UI and E2E 05/06/08 Pass |
| 11 | Gradebook API And Cutover | P06-PR05 | 06, 09 | Unique P06 Gradebook contract Pass |
| 12 | Gradebook Web | P06-PR05 | 11 | Gradebook UI and E2E 07/09 Pass |
| 13 | Admin Reporting API | P06-PR06 | 06 | Metadata/privacy APIs Pass |
| 14 | Admin Reporting Web | P06-PR06 | 13 | Admin UI and E2E 10/11 Pass |
| 15 | Conditional Capabilities | P06-PR07 | 07-14, Gate A disposition | Enabled items Pass hoặc Approved N/A |
| 16 | Quality Hardening | P06-PR08 | 07-15 | NFR, regression, Docker, security Pass |
| 17 | Release Evidence And Handoff | P06-PR08 | 16 | Gate E, main CI, P07 handoff accepted |

## 4. Recommended Order For One Developer

```text
00
 -> 01 -> 02 -> 03 -> 04 -> 05 -> 06
 -> 07 -> 08
 -> 09 -> 10
 -> 11 -> 12
 -> 13 -> 14
 -> 15
 -> 16 -> 17
```

Part 07 và Part 09 có thể phát triển song song khi có nhiều developer, nhưng cả hai phải xuất
phát từ `main` đã merge P06-PR02. Với một developer, thực hiện tuần tự để giảm merge conflict.

## 5. PR And Commit Rule

- Không tạo một PR cho từng Part; dùng Parent PR trong bảng trên.
- Mỗi Part nên có ít nhất một commit độc lập, build được và có test liên quan.
- Không merge Parent PR khi bất kỳ Part bắt buộc nào trong PR còn `IN_PROGRESS`.
- Không để route mới trỏ đến service giả hoặc repository chưa hoàn thành.
- Không commit file Conditional khi Gate A không bật capability tương ứng.

Commit gợi ý:

```text
feat(reporting): add phase 06 runtime contracts
feat(reporting): implement metric policies
feat(reporting): add safe source readers
feat(reporting): add summary repositories
feat(reporting): persist transactional invalidation
feat(reporting): add rebuild and reconciliation
```

## 6. Part Workflow

Với từng Part:

1. đọc file Part và domain document được dẫn chiếu;
2. đổi trạng thái Part sang `IN_PROGRESS`;
3. viết test/policy contract trước hoặc đồng thời với implementation;
4. chạy focused tests;
5. chạy lint, typecheck và build;
6. cập nhật acceptance/test execution/evidence;
7. review diff chỉ trong phạm vi Part;
8. đổi trạng thái `DONE` khi đủ code, test, docs và evidence.

## 7. Common Commands

```text
npm run lint
npm run format:check
npm run typecheck
npm run test --workspace @microlearning/api
npm run test --workspace @microlearning/web
npm run test:integration
npm run test:openapi
npm run build
```

Trước khi mở Parent PR:

```text
npm run check:ci
npm run test:integration
npm run test:openapi
```

E2E, Docker, benchmark và clean clone chạy tại Part có yêu cầu cụ thể.

## 8. Status Vocabulary

`BLOCKED_BY_DEPENDENCY`, `READY`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `DONE`,
`APPROVED_NA`.

`DONE` không chỉ có nghĩa code compile. Part phải có test Pass, tài liệu contract đồng bộ, không
có file ngoài phạm vi và evidence đã được ghi.

## 9. Source Of Truth

Khi có khác biệt, ưu tiên theo thứ tự:

1. `gate-a-decision-sheet.md`;
2. `technical-decisions.md`;
3. `runtime-contract-catalog.md`;
4. `report-dto-and-query-contracts.md`;
5. domain document của actor/capability;
6. file Execution Part này.

Execution Part chỉ hướng dẫn thứ tự thực hiện, không được tự thay đổi business semantics.

## 10. Foundation Implementation Evidence

- Part 01-06 được triển khai tại commit `1afe813`.
- `npm run check:ci`: Pass.
- API unit coverage: `202/202` tests Pass, statements `78.19%`, lines `80.12%`.
- Mongo replica-set integration coverage: `82/82` tests Pass, statements `78.65%`,
  lines `81.29%`.
- P06 focused Mongo foundation: `11/11` tests Pass.
- Rebuild, reconcile dry-run, reconcile repair và benchmark CLI: Pass.
- Chi tiết: `gate-b-foundation-evidence.md`.

Part 01-17 đã được kiểm chứng trong release PR `#18`, merge vào `main` tại `d2abe52`; required CI và
post-merge main CI đều Pass.
