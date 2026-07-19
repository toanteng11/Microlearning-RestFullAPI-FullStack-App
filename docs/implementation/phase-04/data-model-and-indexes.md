# Phase 04 Data Model And Indexes

## 1. Data Principles

- MongoDB document IDs dùng `ObjectId`; API serialize string.
- UTC cho mọi timestamp; Mongoose `timestamps` cho `createdAt/updatedAt`.
- Ownership được resolve từ Course -> Classroom; không tin owner trong request.
- Archive/status thay hard delete đối với dữ liệu có thể có progress/history.
- Index xuất phát từ query thật; mọi list sort có `_id` tie-breaker.
- Multi-document invariant dùng replica-set transaction.
- Schema có `schemaVersion`; migration/index verification idempotent.

## 2. Collection Catalog

| Collection | Priority | Owner module | Mục đích |
| --- | --- | --- | --- |
| `courses` | Must | courses | Course trong Classroom |
| `course_modules` | Must | modules | Module/Topic của Course |
| `lessons` | Must | lessons | Micro Lesson và current deadline |
| `flashcards` | Must | flashcards | Flashcard trong Lesson |
| `lesson_deadline_changes` | Must | deadlines | Immutable deadline history |
| `announcements` | Must | announcements | Classroom Stream |
| `learning_progress` | Must | learning-progress | Student progress source-of-truth |
| `learning_resources` | Conditional | learning-resources | URL/GCS metadata |
| `course_progress_summaries` | Deferred P06 | reporting | Materialized summary, không tạo P04 |
| `student_todo_items` | Deferred P06 | reporting | Materialized To-do, không tạo P04 |

## 3. Course Schema

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `_id` | ObjectId | Có | Immutable |
| `classroomId` | ObjectId | Có | Existing Classroom |
| `ownerTeacherId` | ObjectId | Có | Snapshot current owner; validate với Classroom |
| `title` | String | Có | Trim, 2-150 |
| `description` | String | Không | Trim, max 5,000; default empty |
| `status` | Enum | Có | Common lifecycle; default `DRAFT` |
| `scheduledPublishAt` | Date/null | Có | Required only for `SCHEDULED` |
| `publishedAt` | Date/null | Có | First/current publish audit timestamp |
| `unpublishedAt` | Date/null | Có | Last unpublish |
| `archivedAt` | Date/null | Có | Set for `ARCHIVED` |
| `displayOrder` | Number | Có | Integer >= 0 in Classroom |
| `structureRevision` | Number | Có | Integer >= 0; increment on module/lesson structural mutation |
| `schemaVersion` | Number | Có | Start `1` |
| `createdBy/updatedBy` | ObjectId | Có | Server actor |
| `createdAt/updatedAt` | Date | Có | Server timestamp |

Course title không cần globally unique. UI có thể cảnh báo duplicate title trong một Classroom nhưng không block business flow.
`ownerTeacherId` là denormalized query snapshot, không phải nguồn authorization. Current Classroom owner từ Phase 03 reader luôn thắng; nếu ownership transfer được bật ở phase sau, use case transfer phải cập nhật snapshot Course có kiểm soát và có reconciliation test.

## 4. Course Module Schema

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `_id` | ObjectId | Có | Immutable |
| `courseId` | ObjectId | Có | Existing Course |
| `title` | String | Có | Trim, 2-150 |
| `description` | String | Không | Max 2,000 |
| `status` | Enum | Có | `DRAFT/PUBLISHED/UNPUBLISHED/ARCHIVED` |
| `displayOrder` | Number | Có | Integer >= 0 |
| `schemaVersion` | Number | Có | `1` |
| actor/timestamps | ObjectId/Date | Có | Standard audit metadata |

Module archive không xóa Lesson. `courseId` không đổi qua generic patch.

## 5. Lesson Schema

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `_id` | ObjectId | Có | Immutable |
| `courseId` | ObjectId | Có | Existing Course |
| `moduleId` | ObjectId/null | Có | Nếu có phải cùng Course |
| `title` | String | Có | Trim, 2-150 |
| `content` | String | Có | Markdown, 1-100,000 chars |
| `contentFormat` | Enum | Có | `MARKDOWN` duy nhất P04 |
| `estimatedMinutes` | Number | Có | Integer 1-60 |
| `isRequired` | Boolean | Có | Default true |
| `status` | Enum | Có | Common lifecycle |
| `scheduledPublishAt` | Date/null | Có | Lifecycle rule |
| `publishedAt/unpublishedAt/archivedAt` | Date/null | Có | Lifecycle audit |
| `publishedRevision` | Number/null | Có | `contentRevision` tại lần publish |
| `contentRevision` | Number | Có | Increment khi content field đổi |
| `completionDeadline` | Date/null | Có | Required khi scheduled/published |
| `deadlineRevision` | Number | Có | Start 0, increment mỗi change |
| `deadlineLastUpdatedAt` | Date/null | Có | Server time |
| `deadlineLastUpdatedBy` | ObjectId/null | Có | Server actor |
| `displayOrder` | Number | Có | Integer >= 0 trong module/unassigned |
| `flashcardRevision` | Number | Có | CAS cho reorder Flashcard |
| `schemaVersion` | Number | Có | `1` |
| actor/timestamps | ObjectId/Date | Có | Standard metadata |

Generic Lesson patch không nhận `status`, deadline, order, courseId, moduleId hoặc audit fields. Move Module là endpoint cấu trúc riêng.

## 6. Flashcard Schema

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `_id` | ObjectId | Có | Immutable |
| `lessonId` | ObjectId | Có | Existing editable Lesson |
| `frontText` | String | Có | Trim, 1-2,000 |
| `backText` | String | Có | Trim, 1-5,000 |
| `displayOrder` | Number | Có | Integer >= 0 |
| `status` | Enum | Có | `ACTIVE/ARCHIVED` |
| `archivedAt` | Date/null | Có | Soft archive |
| `schemaVersion` | Number | Có | `1` |
| actor/timestamps | ObjectId/Date | Có | Standard metadata |

P04 giới hạn 100 active Flashcard/Lesson để bảo vệ payload/UX.

## 7. Deadline Change Schema

`lesson_deadline_changes` là append-only. Field contract theo `deadline-and-derived-state.md`, thêm `schemaVersion=1`. Repository không expose update/delete. Unique index trên `{lessonId, toRevision}` bảo vệ history sequence.

## 8. Announcement Schema

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `_id` | ObjectId | Có | Immutable |
| `classroomId` | ObjectId | Có | Existing owned Classroom |
| `teacherId` | ObjectId | Có | Current creator/owner actor |
| `content` | String | Có | Markdown/plain subset, 1-10,000 |
| `status` | Enum | Có | Common lifecycle |
| `scheduledPublishAt` | Date/null | Có | Lifecycle rule |
| `publishedAt/unpublishedAt/archivedAt` | Date/null | Có | Lifecycle audit |
| `schemaVersion` | Number | Có | `1` |
| actor/timestamps | ObjectId/Date | Có | Standard metadata |

Attachment IDs chỉ được thêm nếu Conditional Resource module được bật.

## 9. Learning Progress Schema

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `_id` | ObjectId | Có | Immutable |
| `studentId` | ObjectId | Có | Actor Student |
| `classroomId` | ObjectId | Có | Denormalized query scope |
| `courseId` | ObjectId | Có | Denormalized query scope |
| `activityType` | Enum | Có | `LESSON` P04; extensible P05 |
| `activityId` | ObjectId | Có | Lesson ID P04 |
| `status` | Enum | Có | `IN_PROGRESS/COMPLETED` stored |
| `startedAt` | Date | Có | First start; immutable after set |
| `completedAt` | Date/null | Có | First completion; immutable after set |
| `lastActiveAt` | Date | Có | Update on meaningful activity |
| `schemaVersion` | Number | Có | `1` |
| `createdAt/updatedAt` | Date | Có | Standard timestamps |

`MISSING/LATE/NOT_STARTED` là derived state, không lưu vào record để tránh stale data.

## 10. Learning Resource Schema - Conditional

| Field | Type | Rule |
| --- | --- | --- |
| `ownerType/ownerId` | Enum/ObjectId | P04 allow `COURSE/MODULE/LESSON/ANNOUNCEMENT` |
| `classroomId/courseId` | ObjectId/null | Denormalized authorization/query context |
| `type` | Enum | `LINK/VIDEO_URL`; `FILE/PDF/IMAGE` only with GCS gate |
| `title` | String | 2-150 |
| `url` | String/null | Normalized HTTPS for URL type |
| `storageProvider` | Enum/null | `GCS` only for file type |
| `objectKey` | String/null | Server generated; never public URL |
| `mimeType/fileSize/originalName` | Metadata | Validated/escaped |
| `isRequired` | Boolean | Default false; P04 resource không là progress unit |
| `status` | Enum | `ACTIVE/ARCHIVED` |
| actor/timestamps/schemaVersion | Standard | Required |

## 11. Index Plan

| Name | Collection | Keys | Type/Purpose |
| --- | --- | --- | --- |
| `course_classroom_status_order` | courses | `{classroomId:1,status:1,displayOrder:1,_id:1}` | Teacher/Student Course list |
| `course_owner_status_updated` | courses | `{ownerTeacherId:1,status:1,updatedAt:-1,_id:1}` | Teacher dashboard/list |
| `module_course_status_order` | course_modules | `{courseId:1,status:1,displayOrder:1,_id:1}` | Structure |
| `lesson_course_status_order` | lessons | `{courseId:1,status:1,moduleId:1,displayOrder:1,_id:1}` | Dashboard/structure |
| `lesson_module_status_order` | lessons | `{moduleId:1,status:1,displayOrder:1,_id:1}` | Module children |
| `lesson_due_visibility` | lessons | `{courseId:1,status:1,isRequired:1,completionDeadline:1,_id:1}` | To-do/deadline |
| `flashcard_lesson_status_order` | flashcards | `{lessonId:1,status:1,displayOrder:1,_id:1}` | Lesson player |
| `deadline_history_revision_unique` | lesson_deadline_changes | `{lessonId:1,toRevision:1}` | Unique history |
| `deadline_history_recent` | lesson_deadline_changes | `{lessonId:1,changedAt:-1,_id:-1}` | History list |
| `announcement_stream` | announcements | `{classroomId:1,status:1,publishedAt:-1,_id:-1}` | Student/Teacher Stream |
| `progress_activity_unique` | learning_progress | `{studentId:1,activityType:1,activityId:1}` | Unique/idempotency |
| `progress_student_course` | learning_progress | `{studentId:1,courseId:1,status:1,activityId:1}` | Own progress/To-do |
| `progress_course_students` | learning_progress | `{courseId:1,studentId:1,status:1,lastActiveAt:-1}` | Teacher dashboard |
| `resource_owner_status_order` | learning_resources | `{ownerType:1,ownerId:1,status:1,createdAt:1,_id:1}` | Conditional resource list |

Không tạo unique index trên `displayOrder`; bulk reorder có thể đi qua giá trị trung gian trùng trong transaction. Exact-set/revision bảo vệ logical uniqueness.

## 12. Collection Limits And Validation

| Aggregate | Guardrail P04 |
| --- | --- |
| Course/Classroom | 100 active/non-archived |
| Module/Course | 100 active/non-archived |
| Lesson/Course | 500 active/non-archived |
| Flashcard/Lesson | 100 active |
| Announcement/Classroom | Pagination bắt buộc; 10,000 chars/item |
| Dashboard page | Max 100 Student/request |
| Deadline range | Max 366 days |

Guardrail phải trả error code rõ, không phụ thuộc Mongo document size failure.

## 13. Transaction Matrix

| Transaction | Writes | Invariant |
| --- | --- | --- |
| Course create | Course + optional audit | owner/Classroom/status/order |
| Structure reorder/move | Course revision + affected children + audit | exact-set/order atomic |
| Status change | Resource + audit | valid transition/prerequisite |
| Deadline change | Lesson + deadline history + audit | revision/history atomic |
| First completion | Progress + audit/event | one first completion |
| Announcement publish/archive | Announcement + audit | visibility/audit atomic |
| Archive with children | Parent status only + audit | no destructive cascade |

## 14. Query Plans

### Student Course Structure

1. Resolve Enrollment/Classroom.
2. Match Course effective visibility.
3. Batch query modules và lessons bằng indexed parent IDs.
4. Apply effective scheduled predicate with bounded due scan.
5. Sort canonical order và map Student DTO.

### Student To-do

1. Get active enrolled Classroom IDs.
2. Get effective published Courses.
3. Match required published Lessons with deadline.
4. Left join own progress only.
5. Exclude completed; derive status at one `asOf`.
6. Sort/page/project.

### Course Dashboard

1. Authorize owner and load required visible Lesson IDs.
2. Load active Enrollment page/count.
3. Aggregate progress for selected Student IDs and Lesson IDs.
4. Derive row metrics using same `asOf`.
5. Apply deterministic ranking/sort.

Không chạy N+1 query cho từng Student.

## 15. Migration And Index Deployment

1. Add model/schema without route exposure.
2. Create indexes idempotently in local/CI migration verification.
3. Run index name/key/options contract test.
4. Deploy backward-compatible code before data backfill nếu schema thay đổi.
5. Seed uses upsert by semantic key and records schemaVersion.
6. Rollback code không drop collection/index tự động.

P04 là collection mới nên không cần backfill production. `contentCount` được query từ source, không ghi vào existing Classroom document.

## 16. Data Integrity Tests

- Foreign Classroom/Course/Module reference bị từ chối ở service và schema boundary.
- Module của Course A không gắn vào Lesson Course B.
- Parallel completion tạo đúng một progress record.
- Parallel deadline update tạo một revision thắng, một conflict.
- Reorder rollback không để partial `displayOrder`.
- Archive/unpublish giữ progress/history.
- Index manifest đúng tên/key/unique options.
- UTC round-trip và deadline boundary không lệch timezone.
- Derived To-do/dashboard rebuild cho cùng input cho cùng output.
