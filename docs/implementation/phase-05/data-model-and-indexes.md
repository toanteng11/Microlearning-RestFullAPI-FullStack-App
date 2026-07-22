# Phase 05 Data Model And Indexes

## 1. Data Principles

- ObjectId references cho ownership/parent/evidence.
- Embed bounded immutable snapshot/answer/options khi luôn đọc cùng Attempt.
- Một current record + append-only history cho Submission/Grade/Deadline exception.
- Derived `ASSIGNED/MISSING` không persist hàng loạt.
- Server timestamps, soft archive, explicit `schemaVersion`.
- Index name/key/options được test trên Mongo replica set.

## 2. Collections

| Collection | Owner module | Purpose |
| --- | --- | --- |
| `quizzes` | quizzes | Quiz metadata/settings/lifecycle |
| `questions` | questions | Authoring/scoring definition |
| `quiz_attempts` | quiz-attempts | Student immutable attempt evidence |
| `assignments` | assignments | Assignment metadata/policy/lifecycle |
| `submissions` | submissions | Current Student submission |
| `submission_revisions` | submissions | Append-only content/state history |
| `grades` | grades | Current final/draft Grade per activity/Student |
| `grade_revisions` | grades | Append-only regrade/return history |
| `activity_deadline_exceptions` | deadline-exceptions | Current per-Student override |
| `deadline_exception_history` | deadline-exceptions | Append-only override history |
| `private_comments` | private-comments | Conditional private thread |

Existing `learning_progress` được migrate enum/activity DTO; không tạo duplicate progress collection.

`private_comments` không được tạo/index trong baseline mặc định. Chỉ bổ sung sau approved change-control trước PR06; nếu không, Conditional này được defer/N/A.

## 3. Quiz Schema

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Immutable |
| `classroomId` | ObjectId | Yes | Denormalized from Course, immutable |
| `courseId` | ObjectId | Yes | Immutable |
| `moduleId` | ObjectId/null | No | Must belong same Course |
| `title` | String | Yes | 2-150 normalized |
| `instruction` | String | Yes | 1-100000 sanitized at render |
| `isRequired` | Boolean | Yes | Default true |
| `status` | Enum | Yes | Quiz lifecycle |
| `availableFrom` | Date/null | No | UTC |
| `dueDate` | Date | Yes for publish | UTC/default deadline |
| `attemptLimit` | Number | Yes | Integer 1-10 |
| `timeLimitMinutes` | Number/null | No | Integer 1-180 |
| `resultReleasePolicy` | Enum | Yes | IMMEDIATE/AFTER_REVIEW/TEACHER_RETURN |
| `scorePolicy` | Enum | Yes | HIGHEST P05 |
| `displayOrder` | Number | Yes | Integer >=0 |
| `contentRevision` | Number | Yes | Starts 1 |
| `questionRevision` | Number | Yes | Starts 0 |
| `publishedRevision` | Number/null | No | Snapshot revision |
| `maxScore` | Number | Yes | Computed integer, not client-set |
| `scheduledPublishAt` | Date/null | No | P04 policy |
| `publishedAt/unpublishedAt/archivedAt` | Date/null | No | Lifecycle evidence |
| `createdBy/updatedBy` | ObjectId | Yes | Actor |
| `schemaVersion` | Number | Yes | P05 constant |
| `createdAt/updatedAt` | Date | Yes | Mongoose timestamps |

## 4. Question Schema

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Stable Question ID |
| `quizId/courseId` | ObjectId | Yes | Immutable scope |
| `type` | Enum | Yes | Four types |
| `prompt` | String | Yes | 1-10000 |
| `points` | Number | Yes | Integer 1-100 active |
| `isRequired` | Boolean | Yes | Default true |
| `options` | Embedded[] | Type dependent | Max 10; stable ObjectId/string IDs |
| `correctOptionIds` | ID[] | Objective only | Server/Teacher only |
| `rubric` | String/null | Short answer | Private, max 10000 |
| `explanation` | String/null | No | Private/default unreleased |
| `media` | Embedded/null | No | URL-only conditional |
| `displayOrder` | Number | Yes | Integer >=0 |
| `version` | Number | Yes | Increment on scoring-relevant edit |
| `status` | ACTIVE/ARCHIVED | Yes | Soft archive |
| `createdBy/updatedBy` | ObjectId | Yes | Actor |
| `createdAt/updatedAt` | Date | Yes | Timestamp |

Option fields: `id`, `label`, `displayOrder`. `isCorrect` không lưu lặp nếu dùng `correctOptionIds`.

## 5. Quiz Attempt Schema

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Attempt ID |
| `studentId/classroomId/courseId/quizId` | ObjectId | Yes | Immutable identity |
| `attemptNumber` | Number | Yes | Sequential >=1 |
| `status` | Enum | Yes | Attempt state |
| `assessmentRevision` | Number | Yes | Quiz published revision |
| `quizSnapshot` | Embedded | Yes | title/settings/maxScore |
| `questionSnapshots` | Embedded[] | Yes | Bounded max 100, includes server scoring key |
| `answers` | Embedded[] | Yes | Own latest saved answers |
| `objectiveScore/manualScore/totalScore/maxScore` | Number | Yes | Integer server-derived |
| `startedAt/expiresAt` | Date | Yes | Server time |
| `lastSavedAt/submittedAt/gradedAt/releasedAt` | Date/null | No | State evidence |
| `attemptRevision/reviewRevision` | Number | Yes | Concurrency |
| `createdAt/updatedAt` | Date | Yes | Timestamp |

Question snapshot includes public data and a server-only scoring subdocument. DTO serializers must explicitly omit scoring key/rubric.

## 6. Assignment Schema

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `_id/classroomId/courseId` | ObjectId | Yes | Scope |
| `moduleId` | ObjectId/null | No | Same Course |
| `title` | String | Yes | 2-150 |
| `instruction` | String | Yes | 1-100000 |
| `maxScore` | Number | Yes | Integer 1-1000 |
| `isRequired` | Boolean | Yes | Default true |
| `allowedSubmissionTypes` | Enum[] | Yes | TEXT plus enabled conditional types |
| `allowLateSubmission` | Boolean | Yes | Explicit |
| `allowUnsubmit` | Boolean | Yes | Explicit |
| `allowResubmit` | Boolean | Yes | Explicit |
| `availableFrom` | Date/null | No | UTC |
| `dueDate` | Date | Publish | UTC |
| `status` | Enum | Yes | Assignment lifecycle |
| `displayOrder` | Number | Yes | >=0 |
| `contentRevision/publishedRevision` | Number | Yes/null | Concurrency/snapshot |
| lifecycle/actor/schema/timestamps | Mixed | Yes | Same pattern Quiz |

## 7. Submission Schema

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Current Submission |
| `assignmentId/studentId` | ObjectId | Yes | Unique natural identity |
| `classroomId/courseId` | ObjectId | Yes | Immutable denormalized scope |
| `status` | Enum | Yes | DRAFT/SUBMITTED/LATE/GRADED/RETURNED |
| `submissionType` | Enum/null | Draft may null | Enabled method |
| `textAnswer` | String/null | Type dependent | Max 100000 |
| `links` | String[] | Type dependent | Max 5 HTTPS |
| `markDone` | Boolean | Type dependent | Conditional |
| `revision` | Number | Yes | Starts 1 |
| `submittedRevision` | Number/null | No | Evidence revision being graded |
| `submittedAt` | Date/null | No | Server time |
| `isLate` | Boolean | Yes | Snapshot at turn-in/current state |
| `effectiveDeadlineAtSubmit` | Date/null | No | Evidence |
| `gradedAt/returnedAt` | Date/null | No | State evidence |
| `createdAt/updatedAt` | Date | Yes | Timestamp |

## 8. Submission Revision Schema

Append-only fields:

- `submissionId`, `assignmentId`, `studentId`, `revision`.
- `eventType`: `DRAFT_SAVED`, `TURNED_IN`, `UNSUBMITTED`, `RESUBMITTED`, `GRADED`, `RETURNED`.
- safe content snapshot or normalized hash plus needed historical content.
- `status`, `submittedAt`, `isLate`, `effectiveDeadline`.
- `actorId`, `actorRole`, `reason`, `createdAt`, `requestId`.

Unique `{submissionId, revision}`. Normal actor không update/delete history.

## 9. Grade Schema

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Current Grade |
| `studentId/classroomId/courseId` | ObjectId | Yes | Immutable scope |
| `activityType` | QUIZ/ASSIGNMENT | Yes | P05 |
| `activityId` | ObjectId | Yes | Quiz/Assignment |
| `evidenceType` | ATTEMPT/SUBMISSION | Yes | Link type |
| `evidenceId` | ObjectId | Yes | Current selected evidence |
| `evidenceRevision` | Number | Yes | Prevent stale grading |
| `score/maxScore` | Number | Yes | Integer range |
| `feedback` | String/null | No | Current private feedback |
| `status` | DRAFT/RETURNED | Yes | Visibility boundary |
| `revision` | Number | Yes | Concurrency |
| `gradedBy/gradedAt` | ObjectId/Date | Yes | Evidence |
| `returnedBy/returnedAt` | ObjectId/Date/null | No | Release |
| `createdAt/updatedAt` | Date | Yes | Timestamp |

## 10. Grade Revision Schema

`gradeId`, `revision`, old/new score/status/evidence reference, feedback hash or retained private snapshot according retention policy, reason, actor/time/requestId. Unique `{gradeId, revision}`; append-only.

## 11. Deadline Exception Schemas

### Current

- student/activity/classroom/course identity.
- `deadline`, `revision`, `active`.
- `reason`, `changedBy`, `changedAt`.
- default deadline snapshot at change.

### History

- current identity + from/to deadline/revision.
- action, reason, actor role/time/requestId.
- immutable unique `{studentId, activityType, activityId, toRevision}`.

## 12. Learning Progress Migration

Existing enum `LESSON` expands to `LESSON/QUIZ/ASSIGNMENT`. Existing Lesson records không rewrite ngoài schema/index compatibility. New progress writes:

- Quiz: start -> IN_PROGRESS; submit/timeout -> COMPLETED.
- Assignment: draft -> IN_PROGRESS; turn-in -> COMPLETED; unsubmit -> IN_PROGRESS.

`resultStatus` không thêm vào `learning_progress`. Quiz/Assignment adapters derive `resultPending` hoặc result state cho To-do/result DTO; `LearningProgressReader` V2 giữ completion-only contract.

## 13. Index Manifest

| Name | Collection | Keys/options | Query |
| --- | --- | --- | --- |
| `quiz_course_status_order` | quizzes | `{courseId:1,status:1,moduleId:1,displayOrder:1,_id:1}` | Classwork/Teacher list |
| `quiz_due_visibility` | quizzes | `{courseId:1,status:1,isRequired:1,dueDate:1,_id:1}` | To-do/deadline |
| `question_quiz_status_order` | questions | `{quizId:1,status:1,displayOrder:1,_id:1}` | Builder/snapshot |
| `attempt_identity_unique` | quiz_attempts | `{quizId:1,studentId:1,attemptNumber:1}` unique | Attempt limit |
| `attempt_one_active` | quiz_attempts | `{quizId:1,studentId:1}` unique partial status IN_PROGRESS | Double start |
| `attempt_student_recent` | quiz_attempts | `{studentId:1,quizId:1,createdAt:-1,_id:-1}` | Own history |
| `attempt_quiz_results` | quiz_attempts | `{quizId:1,status:1,totalScore:-1,submittedAt:1,_id:1}` | Teacher results |
| `attempt_expiry` | quiz_attempts | `{status:1,expiresAt:1,_id:1}` partial active | Reconciliation |
| `assignment_course_status_order` | assignments | `{courseId:1,status:1,moduleId:1,displayOrder:1,_id:1}` | Classwork |
| `assignment_due_visibility` | assignments | `{courseId:1,status:1,isRequired:1,dueDate:1,_id:1}` | To-do/deadline |
| `submission_identity_unique` | submissions | `{assignmentId:1,studentId:1}` unique | Current submission |
| `submission_assignment_status` | submissions | `{assignmentId:1,status:1,submittedAt:-1,_id:1}` | Teacher table |
| `submission_student_recent` | submissions | `{studentId:1,courseId:1,updatedAt:-1,_id:1}` | Own list |
| `submission_revision_unique` | submission_revisions | `{submissionId:1,revision:1}` unique | History |
| `grade_identity_unique` | grades | `{studentId:1,activityType:1,activityId:1}` unique | Current grade |
| `grade_course_status` | grades | `{courseId:1,status:1,studentId:1,activityType:1,activityId:1}` | Gradebook/P06 |
| `grade_student_returned` | grades | `{studentId:1,status:1,returnedAt:-1,_id:1}` | Own grades |
| `grade_revision_unique` | grade_revisions | `{gradeId:1,revision:1}` unique | Regrade history |
| `deadline_exception_unique` | activity_deadline_exceptions | `{studentId:1,activityType:1,activityId:1}` unique | Effective deadline |
| `deadline_exception_course` | activity_deadline_exceptions | `{courseId:1,studentId:1,active:1,deadline:1}` | Student/Course query |
| `deadline_exception_history_unique` | deadline_exception_history | `{studentId:1,activityType:1,activityId:1,toRevision:1}` unique | History |

## 14. Query Plans And Performance Dataset

Required explain checks on synthetic baseline:

- 1 Course, 100 active Students.
- 20 Quizzes x 50 Questions, up to 3 Attempts/Student.
- 20 Assignments, 100 current Submissions each, 2 revisions average.
- Returned/draft Grades mixed.
- Deadline exceptions for 10% Students.

Critical query should use intended index and avoid unbounded COLLSCAN: active Attempt lookup, submission identity, Teacher submission table, Student own grades, deadline exception lookup, Quiz/Assignment due list.

## 15. Transaction Boundaries

| Transaction | Collections |
| --- | --- |
| Start Attempt | quiz_attempts, learning_progress |
| Submit/timeout | quiz_attempts, grades optional, learning_progress, audit_logs |
| Turn-in/unsubmit | submissions, submission_revisions, learning_progress, audit_logs |
| Grade/return | grades, grade_revisions, submissions/quiz_attempts, audit_logs |
| Deadline exception | current exception, history, audit_logs |

No external network call in transaction.

## 16. Retention And Deletion

- Quiz/Assignment/Question soft archive.
- Attempt/Submission/Grade/history không hard delete qua normal UI.
- User soft delete giữ references; projection dùng retained identity policy.
- Private feedback/comment retention theo BA privacy; deletion request cần legal/audit review.
- Future file object retention do P07.

## 17. Data Invariants

1. Parent IDs cùng Classroom/Course chain.
2. Attempt snapshot total max score bằng sum Question snapshot points.
3. Attempt score không vượt maxScore.
4. Một active attempt/Student/Quiz.
5. Một current Submission/Student/Assignment.
6. Submission history revision liên tục.
7. Grade evidence thuộc đúng Student/activity/scope.
8. Returned Grade có returnedAt/returnedBy.
9. Deadline exception revision/history nhất quán.
10. Student DTO không chứa scoring secret/private foreign data.
