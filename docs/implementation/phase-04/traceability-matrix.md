# Phase 04 Traceability Matrix

## 1. Mục Đích

Ánh xạ BA requirement tới quyết định, task, API/UI/data và test/evidence. Matrix này là index truy ngược; chi tiết behavior nằm trong contract tương ứng.

## 2. Functional Traceability

| BA source | Capability | WBS | API/UI/Data | Acceptance |
| --- | --- | --- | --- | --- |
| `FR-026`, `US-TCH-005`, `UC-011` | Create Course | T031-T036,T078 | `/courses`; `courses`; Course form | AC-013..015 |
| `FR-027`, `US-TCH-019/044..046`, `UC-044` | Course Dashboard | T065-T067,T079,T085 | `/teacher/courses/:id/*` | AC-055..058 |
| `FR-028`, `US-TCH-010/048`, `UC-017` | Module/reorder | T037-T042,T080-T081 | `/modules`, reorder; `course_modules` | AC-019..024 |
| `FR-029`, `US-TCH-006/049..051`, `UC-012` | Lesson authoring/lifecycle | T043-T049,T082 | `/lessons`; `lessons` | AC-025..032 |
| `FR-030`, `US-TCH-021/052/053`, `UC-046` | Deadline/reset/history | T053-T056,T084 | `/teacher/lessons/:id/deadline*` | AC-035..041 |
| `FR-031`, `US-TCH-011/054`, `UC-018` | Flashcard | T050-T052,T083,T089 | `/flashcards`; `flashcards` | AC-033/034 |
| `FR-032`, `US-TCH-055..057`, `UC-055` | Learning Resource | T073-T075 | `/resources`; `learning_resources` | AC-045/046 |
| `FR-033`, `BR-058..067` | Content lifecycle/visibility | T015-T017,T033,T045,T068 | Lifecycle/visibility services | AC-016..018/020/028..030 |
| `FR-034`, `US-TCH-050`, `UC-012` | Preview as Student | T043,T046,T082 | `/lessons/:id/preview` | AC-027 |
| `FR-035`, `US-TCH-015/038..040`, `UC-020` | Announcement | T068-T069,T077 | Announcement APIs/Stream | AC-042..044 |
| `FR-049/050`, `US-STU-009/019..024`, `UC-041/042` | To-do v1 | T062-T064,T092 | `/students/me/todo` | AC-052..054 |
| `FR-052`, `US-STU-006/030/031`, `UC-009` | Lesson learning/completion | T057-T061,T086-T090 | Player/start/complete; progress | AC-047..051 |
| `FR-053`, `US-STU-033` | Learn Flashcards | T058,T089 | Lesson DTO/viewer | AC-033/034/048 |
| `FR-057`, `US-STU-011/058`, `UC-043` | Back/Previous/Next | T059,T091 | navigation DTO/UI | AC-032/048 |
| `FR-064/065` | Pagination/UI states | T031,T063-T066,T077-T093 | Common list/UI state | AC-014/043/052/057/065 |
| `FR-067` | Swagger/OpenAPI | T036,T041,T049,T052,T055,T069,T097 | `/api-docs` | AC-060 |
| `FR-068`, `BR-065/103` | Secure media access | T074-T075 | URL/GCS adapter | AC-045/046/062 |
| `FR-069`, `BR-101/102` | Audit/logging | T033,T039,T054,T060,T068 | AuditLog/structured logs | AC-040/068 |

## 3. Business Rule Traceability

| Business rules | Implementation contract | Tests/AC |
| --- | --- | --- |
| `BR-033..035` | Dashboard + ranking + deadline derived query | AC-041/052..058 |
| `BR-058..060` | Common lifecycle, effective status, publish prerequisite | AC-016/017/020/028/030 |
| `BR-061` | Published/scheduled Lesson deadline required | AC-017/028/035 |
| `BR-062` | Canonical `displayOrder` and navigation | AC-021..024/031/032 |
| `BR-063`, `BR-099` | Soft archive/history preservation | AC-018/029/044 |
| `BR-065/068` | Scoped resources/announcement | AC-008/012/043/045/046 |
| `BR-066/067` | Persisted publish + archived terminal | AC-016/018/028/029 |
| `BR-069..074` | Active enrollment, To-do, progress, idempotency, formula | AC-047..058 |
| `BR-075..080` | Deadline owner/reason/time/history/recalculation | AC-035..041/053 |
| `BR-081` | Deterministic ranking tie-break | AC-058 |
| `BR-101..103` | Audit/redaction/media reauthorization | AC-040/045/046/068 |

## 4. Non-Functional Traceability

| NFR area | Plan | Acceptance/evidence |
| --- | --- | --- |
| Security | Object authorization, XSS/URL/GCS controls | AC-005..012/062/068 |
| Performance | Indexed batch aggregation, bounded datasets | AC-061/066 |
| Reliability | Transaction/CAS/idempotency | AC-021/022/040/050/051 |
| Usability | Workflow, state matrix, deadline clarity | AC-014/027/034/048/052..058 |
| Accessibility | Keyboard/focus/semantic controls | AC-034/065 |
| Maintainability | Ports, module boundaries, OpenAPI parity | AC-004/060/063 |
| Observability | Structured event/request ID/redaction | AC-040/068 |
| Deployability | Env validation, Docker, seed, clean clone | AC-067/068 |

## 5. Phase Boundary Traceability

| Deferred capability | Target | P04 handoff |
| --- | --- | --- |
| Quiz/Question/Attempt | P05 | Activity descriptor, visibility, deadline container |
| Assignment/Submission/Grade | P05 | Course scope, ordering, deadline policy |
| Multi-activity To-do | P05/P06 | `activityTypes` extensible response |
| Process score/grade formula | P06 | Versioned P04 lesson metric and source progress |
| Materialized summaries | P06 | Rebuildable queries/source indexes |
| Notification | P06/07 | Audited publish/deadline events |
| Cloud Run/Atlas/GCS production | P07 | Stateless/env/storage port contracts |

## 6. Update Rule

- Task PR phải ghi P04 Task ID và BA/AC IDs.
- API/data behavior đổi phải cập nhật contract + OpenAPI + matrix trong cùng PR.
- Khi test pass, link test/report được ghi ở `evidence-register.md` và acceptance row.
- Deferred requirement phải ghi target phase/reason; không xóa khỏi matrix.
- Status `Completed` chỉ khi matrix không còn Must row thiếu implementation/test evidence.
