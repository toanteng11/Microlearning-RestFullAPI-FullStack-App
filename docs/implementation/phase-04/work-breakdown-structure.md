# Phase 04 Work Breakdown Structure

## 1. Quy Ước

- Estimate là ideal engineering day, không phải deadline lịch.
- Status ban đầu: `Backlog`; chỉ `Done` khi code, test, docs và evidence của task đạt.
- Priority `C` là Conditional Should, không nằm Must critical path.
- Owner là vai trò đề xuất; dự án cá nhân có thể cùng một người thực hiện nhưng vẫn giữ trách nhiệm review rõ.

## 2. E01 - Planning And Gate A

| ID | Task | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- |
| P04-T001 | Review BA FR/US/UC/BR/AC P04 | BA/TL | P03 exit | 0.5d | Done |
| P04-T002 | Approve phased To-do/dashboard metric | PO/BA | T001 | 0.5d | Done |
| P04-T003 | Review 36 ADR decisions | TL | T001 | 0.5d | Done |
| P04-T004 | Review API/data contracts | BE/QA | T003 | 0.5d | Done |
| P04-T005 | Review UI/accessibility plan | FE/QA | T003 | 0.5d | Done |
| P04-T006 | Review security/GCS boundary | Security/DevOps | T003 | 0.5d | Done |
| P04-T007 | Run planning docs quality/CI | DevOps | T001-T006 | 0.25d | Done |
| P04-T008 | Merge planning PR and mark Gate A | PO/TL | T007 | 0.25d | Done |

## 3. E02 - Permissions, Ports And Domain Policies

| ID | Task | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- |
| P04-T009 | Add P04 permission constants | BE | T008 | 0.25d | Backlog |
| P04-T010 | Update role capability matrix/tests | BE | T009 | 0.5d | Backlog |
| P04-T011 | Define `ClassroomScopeReader` | BE | T008 | 0.5d | Backlog |
| P04-T012 | Implement P03 scope adapter | BE | T011 | 0.75d | Backlog |
| P04-T013 | Define `CourseScopeReader` | BE | T011 | 0.5d | Backlog |
| P04-T014 | Define activity/progress/content reader ports | BE | T013 | 0.5d | Backlog |
| P04-T015 | Implement lifecycle transition policy | BE | T003 | 0.75d | Backlog |
| P04-T016 | Implement effective scheduled status | BE | T015 | 0.5d | Backlog |
| P04-T017 | Implement visibility resolver | BE/Security | T012,T016 | 1d | Backlog |
| P04-T018 | Implement ordering/exact-set policy | BE | T015 | 0.75d | Backlog |

## 4. E03 - Data Foundation

| ID | Task | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- |
| P04-T019 | Create Course domain/model/repository | BE | T008 | 1d | Backlog |
| P04-T020 | Create Module domain/model/repository | BE | T019 | 0.75d | Backlog |
| P04-T021 | Create Lesson domain/model/repository | BE | T019 | 1d | Backlog |
| P04-T022 | Create Flashcard model/repository | BE | T021 | 0.75d | Backlog |
| P04-T023 | Create deadline history model/repository | BE | T021 | 0.75d | Backlog |
| P04-T024 | Create Announcement model/repository | BE | T008 | 0.75d | Backlog |
| P04-T025 | Create LearningProgress model/repository | BE | T021 | 1d | Backlog |
| P04-T026 | Define P04 index manifest | BE | T019-T025 | 0.75d | Backlog |
| P04-T027 | Wire index bootstrap/verification | BE/DevOps | T026 | 0.5d | Backlog |
| P04-T028 | Add schema/reference validation tests | BE | T019-T025 | 1d | Backlog |
| P04-T029 | Add index contract/query tests | BE | T027 | 0.75d | Backlog |
| P04-T030 | Add migration/rollback notes | BE/DevOps | T027 | 0.25d | Backlog |

## 5. E04 - Course And Module Backend

| ID | Task | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- |
| P04-T031 | Course create/list service | BE | T017,T019 | 1d | Backlog |
| P04-T032 | Course detail/update service | BE | T031 | 0.75d | Backlog |
| P04-T033 | Course lifecycle/archive service | BE | T015,T032 | 1d | Backlog |
| P04-T034 | Course DTO role projections | BE | T017,T032 | 0.5d | Backlog |
| P04-T035 | Course Zod schemas/routes | BE | T031-T034 | 0.75d | Backlog |
| P04-T036 | Course OpenAPI/tests | BE/QA | T035 | 1d | Backlog |
| P04-T037 | Module create/update/status service | BE | T020,T017 | 1d | Backlog |
| P04-T038 | Module archive preservation | BE | T037 | 0.5d | Backlog |
| P04-T039 | Module reorder transaction | BE | T018,T019,T020 | 1d | Backlog |
| P04-T040 | Module routes/schemas/DTO | BE | T037-T039 | 0.75d | Backlog |
| P04-T041 | Module OpenAPI/tests | BE/QA | T040 | 0.75d | Backlog |
| P04-T042 | Course/Module ownership/concurrency suite | BE/Security | T036,T041 | 1d | Backlog |

## 6. E05 - Lesson, Flashcard And Deadline Backend

| ID | Task | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- |
| P04-T043 | Markdown validation/sanitized projection | BE/Security | T021 | 0.75d | Backlog |
| P04-T044 | Lesson create/detail/update service | BE | T017,T021,T043 | 1.25d | Backlog |
| P04-T045 | Lesson publish prerequisite/lifecycle | BE | T015,T044 | 1d | Backlog |
| P04-T046 | Lesson preview projection | BE | T043,T044 | 0.5d | Backlog |
| P04-T047 | Lesson move/reorder transaction | BE | T018,T019-T021 | 1.25d | Backlog |
| P04-T048 | Lesson routes/schemas/DTO | BE | T044-T047 | 1d | Backlog |
| P04-T049 | Lesson OpenAPI/integration tests | BE/QA | T048 | 1.25d | Backlog |
| P04-T050 | Flashcard CRUD/archive service | BE | T022,T044 | 0.75d | Backlog |
| P04-T051 | Flashcard reorder transaction | BE | T018,T021,T022 | 0.75d | Backlog |
| P04-T052 | Flashcard routes/OpenAPI/tests | BE/QA | T050,T051 | 1d | Backlog |
| P04-T053 | Deadline pure policy | BE | T015 | 0.75d | Backlog |
| P04-T054 | Deadline transaction/history/audit | BE | T023,T053 | 1.25d | Backlog |
| P04-T055 | Deadline routes/OpenAPI/tests | BE/QA | T054 | 1d | Backlog |
| P04-T056 | Deadline race/failure-injection suite | BE/QA | T055 | 1d | Backlog |

## 7. E06 - Student Learning And Derived Queries

| ID | Task | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- |
| P04-T057 | Student Classwork query | BE | T017,T034,T048 | 1d | Backlog |
| P04-T058 | Lesson Player projection | BE | T043,T052,T057 | 0.75d | Backlog |
| P04-T059 | Server navigation service | BE | T018,T057 | 0.75d | Backlog |
| P04-T060 | Progress start/complete service | BE | T025,T017 | 1d | Backlog |
| P04-T061 | Progress concurrency/idempotency tests | BE/QA | T060 | 1d | Backlog |
| P04-T062 | Derived status pure function | BE | T053 | 0.5d | Backlog |
| P04-T063 | Student To-do query/API | BE | T057,T060,T062 | 1.25d | Backlog |
| P04-T064 | Deadline range/progress query/API | BE | T063 | 0.75d | Backlog |
| P04-T065 | Course Dashboard summary/activity query | BE | T057,T060 | 1.25d | Backlog |
| P04-T066 | Student list/ranking query | BE | T065 | 1.25d | Backlog |
| P04-T067 | Query performance/explain tests | BE/QA | T063-T066 | 1d | Backlog |

## 8. E07 - Stream, Governance And Conditional Resource

| ID | Task | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- |
| P04-T068 | Announcement CRUD/lifecycle service | BE | T017,T024 | 1d | Backlog |
| P04-T069 | Announcement routes/OpenAPI/tests | BE/QA | T068 | 1d | Backlog |
| P04-T070 | Implement `ClassroomContentReader` | BE | T019 | 0.5d | Backlog |
| P04-T071 | Add Admin contentCount/governance APIs | BE | T070 | 0.75d | Backlog |
| P04-T072 | Governance authorization/projection tests | BE/Security | T071 | 0.75d | Backlog |
| P04-T073 | Decide Conditional Resource execution | PO/TL | Must path green | 0.25d | Backlog |
| P04-T074 | Implement safe URL resource [C] | BE/FE | T073 | 1.5d | Backlog |
| P04-T075 | Implement private GCS flow [C] | BE/DevOps/Security | T073,T074 | 3d | Backlog |

## 9. E08 - Teacher React Experience

| ID | Task | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- |
| P04-T076 | Add typed P04 API clients/routes | FE | T036,T041,T049 | 1d | Backlog |
| P04-T077 | Classroom Stream/Classwork tabs | FE | T069,T076 | 1d | Backlog |
| P04-T078 | Course list/create/edit pages | FE | T036,T076 | 1.25d | Backlog |
| P04-T079 | Course Dashboard shell/summary/tabs | FE | T065,T076 | 1.25d | Backlog |
| P04-T080 | Module/Lesson structure manager | FE | T041,T049,T076 | 1.5d | Backlog |
| P04-T081 | Reorder keyboard/conflict UX | FE | T039,T047,T080 | 1d | Backlog |
| P04-T082 | Lesson editor/Markdown preview | FE | T049,T076 | 1.5d | Backlog |
| P04-T083 | Flashcard editor | FE | T052,T082 | 1d | Backlog |
| P04-T084 | Deadline/history dialog | FE | T055,T082 | 1d | Backlog |
| P04-T085 | Teacher progress list/ranking UI | FE | T066,T079 | 1.25d | Backlog |

## 10. E09 - Student React Experience

| ID | Task | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- |
| P04-T086 | Student Classwork/Course pages | FE | T057,T076 | 1.25d | Backlog |
| P04-T087 | Safe Lesson presentation component | FE | T043,T058 | 1d | Backlog |
| P04-T088 | Lesson Player layout | FE | T058,T087 | 1.25d | Backlog |
| P04-T089 | Flashcard viewer keyboard behavior | FE | T052,T088 | 0.75d | Backlog |
| P04-T090 | Start/complete integration | FE | T060,T088 | 0.75d | Backlog |
| P04-T091 | Back/Previous/Next/breadcrumb | FE | T059,T088 | 0.75d | Backlog |
| P04-T092 | Dashboard To-do/deadline pages | FE | T063,T064 | 1.25d | Backlog |
| P04-T093 | Student/Teacher component test suite | FE/QA | T077-T092 | 2d | Backlog |

## 11. E10 - Integration, DevOps And Exit

| ID | Task | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- |
| P04-T094 | Extend env validation/example | BE/DevOps | T008 | 0.5d | Backlog |
| P04-T095 | Build deterministic P04 demo seed | BE/QA | T069,T071 | 1d | Backlog |
| P04-T096 | Add integrated Playwright journeys | QA/FE | T093,T095 | 1.5d | Backlog |
| P04-T097 | Extend CI/OpenAPI/Mongo jobs | DevOps | T029,T096 | 0.75d | Backlog |
| P04-T098 | Docker/clean-clone/visual/performance review | DevOps/QA | T067,T097 | 1.5d | Backlog |
| P04-T099 | Close 68 AC and evidence register | QA/BA | T098 | 1d | Backlog |
| P04-T100 | Exit PR, main CI and handoff P05/P06 | TL/PO | T099 | 0.75d | Backlog |

## 12. Critical Path

`T001 -> T008 -> T009/T011 -> T017 -> T019/T021/T025 -> T031 -> T044 -> T045 -> T057 -> T060 -> T063/T065 -> T076 -> T082/T088 -> T096 -> T098 -> T099 -> T100`

## 13. Recommended Capacity

- Solo developer: 10-14 calendar weeks tùy mức test/UI và Conditional scope.
- Hai developer BE/FE: 6-9 weeks với shared QA/DevOps time.
- Không dùng estimate để cắt security/concurrency/evidence; defer Conditional scope trước.

## 14. Task Completion Rule

Một task chỉ `Done` khi:

1. Output đã merge vào feature branch/PR phù hợp.
2. Unit/integration/component test liên quan pass.
3. API thay đổi có OpenAPI.
4. Docs/traceability được cập nhật.
5. Không có unresolved review comment mức blocking.
6. Evidence reference được ghi khi task thuộc gate/exit.
