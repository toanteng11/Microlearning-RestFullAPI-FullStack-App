# Phase 05 Architecture And Module Design

## 1. Architecture Context

Phase 05 tiếp tục Modular Monolith hiện có:

```text
React Web
  -> /api/v1 REST + HttpOnly session
  -> Express Router
  -> Application Services
  -> Domain Policies / Ports
  -> Repositories
  -> MongoDB replica set
```

Không tạo microservice hoặc message broker mới. Boundary domain vẫn phải rõ để P06 analytics và P07 storage/deployment có thể mở rộng mà không import model xuyên module.

## 2. Proposed API Modules

| Module | Trách nhiệm | Không sở hữu |
| --- | --- | --- |
| `quizzes` | Quiz metadata/lifecycle/settings | Question body, Attempt |
| `questions` | Question CRUD/reorder/scoring definition | Student attempt state |
| `quiz-attempts` | Start/save/submit/timeout/result projection | Live Question mutation |
| `quiz-scoring` | Pure objective scoring/manual aggregation policy | HTTP/Mongoose |
| `assignments` | Assignment metadata/lifecycle/submission policy | Submission current/history |
| `submissions` | Draft/turn-in/unsubmit/resubmit/roster projection | Grade ownership |
| `grades` | Grade/feedback/regrade/return/own projection | Submission content mutation |
| `deadline-exceptions` | Per-Student deadline override/history | Activity default deadline |
| `assessment-content` | Activity adapters/read model composition | Direct domain persistence |

Conditional `private-comments` chỉ thêm khi Gate D Must path ổn định.

## 3. Dependency Direction

```text
quiz-attempts -> QuizScopeReader + QuestionSnapshotReader
questions     -> QuizScopeReader
submissions   -> AssignmentScopeReader + EnrollmentAccessReader
grades        -> AssessmentEvidenceReader + GradeRepository
deadline-exceptions -> ActivityDeadlineReader + CourseScopeReader

P05 -> P04 through CourseScopeReader / Activity contracts
P05 -> P03 through EnrollmentAccessReader / ClassroomScopeReader
P04 learning views <- P05 through AssessmentActivityReader / AssessmentProgressReader
P06 -> P05 through AssessmentResultReader / GradeReader
```

Forbidden:

- Service import Mongoose model của module khác.
- React tự tính authoritative score/deadline/status.
- Repository trả raw document có correct answer cho route Student.
- Audit logger serialize request/response body chứa answer/feedback.

## 4. Existing Contract Extensions

### 4.1 Activity Descriptor V2

```ts
type ActivityType = 'LESSON' | 'QUIZ' | 'ASSIGNMENT';

interface LearningActivityDescriptorV2 {
  activityType: ActivityType;
  activityId: string;
  classroomId: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  isRequired: boolean;
  defaultDeadline: string | null;
  displayOrder: number;
  visible: boolean;
  actionUrl: string;
}
```

Version constant: `P05_ACTIVITY_DESCRIPTOR_V2`. P04 Lesson adapter được nâng type nhưng giữ field semantics; compatibility test bảo vệ Lesson DTO.

### 4.2 Progress Snapshot V2

```ts
interface ActivityProgressSnapshotV2 {
  studentId: string;
  activityType: ActivityType;
  activityId: string;
  completionStatus: 'IN_PROGRESS' | 'COMPLETED';
  resultStatus: 'NONE' | 'NEEDS_REVIEW' | 'GRADED' | 'RETURNED';
  startedAt: string | null;
  completedAt: string | null;
  lastActiveAt: string;
}
```

Version: `P05_REQUIRED_ACTIVITY_COMPLETION_V1`.

### 4.3 Course Scope

Reuse `CourseScopeReader`; P05 không query Course model trực tiếp. P05 cần `getActivityContainer(courseId)` để lấy `structureRevision` và stable ordering context.

## 5. New Ports

### 5.1 Quiz Scope Reader

```ts
interface QuizScopeReader {
  requireTeacherManage(actorId: string, quizId: string): Promise<QuizScope>;
  requireStudentAttempt(studentId: string, quizId: string, asOf: Date): Promise<QuizScope>;
  getForScoring(quizId: string): Promise<QuizScoringScope>;
}
```

### 5.2 Assignment Scope Reader

```ts
interface AssignmentScopeReader {
  requireTeacherManage(actorId: string, assignmentId: string): Promise<AssignmentScope>;
  requireStudentSubmit(studentId: string, assignmentId: string, asOf: Date): Promise<AssignmentScope>;
}
```

### 5.3 Activity Deadline Reader

```ts
interface ActivityDeadlineReader {
  getDefaultDeadline(type: ActivityType, activityId: string): Promise<Date | null>;
  requireTeacherManage(actorId: string, type: ActivityType, activityId: string): Promise<ActivityScope>;
}
```

### 5.4 Assessment Evidence Reader

```ts
interface AssessmentEvidenceReader {
  getGradableSubmission(submissionId: string): Promise<GradableSubmission>;
  getGradableAttempt(attemptId: string): Promise<GradableAttempt>;
}
```

### 5.5 P06 Handoff

```ts
interface AssessmentResultReader {
  listCourseActivityResults(courseId: string, asOf: Date): Promise<AssessmentResultRow[]>;
}

interface GradeReader {
  listReturnedByCourse(courseId: string): Promise<ReturnedGrade[]>;
}
```

Không expose feedback body hoặc answers trong analytics port.

## 6. Composition Root

- Tạo `phase-five.router.ts` tương tự `phase-four.router.ts`.
- Composition root instantiate repositories/services/adapters một lần.
- `app.ts` mount `/api/v1` Phase Five router sau authentication foundations và trước not-found handler.
- Activity/Progress composition nhận Lesson adapter P04 + Quiz/Assignment adapters P05.
- OpenAPI root merge Phase Five tags/schemas/paths và operation parity manifest.

## 7. Request Flows

### 7.1 Publish Quiz

```text
Route + auth + permission
  -> validate request/revision
  -> QuizService.requireTeacherManage
  -> QuestionRepository.listActive
  -> QuizPublishPolicy.validate
  -> transaction update lifecycle/revision + audit metadata
  -> DTO Teacher
```

### 7.2 Start Quiz Attempt

```text
Route Student
  -> QuizScopeReader.requireStudentAttempt
  -> AttemptService.reconcileExpired
  -> withMongoTransaction
       -> active attempt lookup
       -> attempt number allocation
       -> QuestionSnapshotReader
       -> AttemptRepository.create
       -> ProgressWriter.start
  -> Student-safe DTO
```

### 7.3 Submit Quiz Attempt

```text
authorize owner
  -> reconcile expiry + revision guard
  -> pure ScoringPolicy(snapshot, answers)
  -> transaction freeze attempt + grade candidate + progress + audit
  -> release projection according policy
```

### 7.4 Turn In Assignment

```text
AssignmentScopeReader.requireStudentSubmit
  -> EffectiveDeadlineService.resolve
  -> SubmissionPolicy.validate
  -> transaction append revision + update current + progress
  -> derived DTO
```

### 7.5 Return Work

```text
Teacher scope + evidence revision guard
  -> GradePolicy.validate
  -> transaction append grade history
       -> Grade RETURNED
       -> evidence state RETURNED/RESULT_RELEASED
       -> audit safe metadata
  -> Student query immediately sees result
```

### 7.6 Deadline Exception

```text
Teacher scope + Student enrollment
  -> resolve default/current/effective deadline
  -> exception policy + revision
  -> transaction history + current exception
  -> scoped progress/To-do invalidation
  -> return effective deadline
```

## 8. DTO Boundaries

| Projection | Có thể chứa | Tuyệt đối không chứa |
| --- | --- | --- |
| Teacher Quiz | Settings, Question correct config, result aggregate | Student password/session |
| Student Quiz Intro | Settings, availability, attempts remaining | Questions/correct answer trước start |
| Student Attempt | Public snapshot/options, own answers | Correct answer/rubric |
| Teacher Attempt Review | Own Course Student answers, scoring keys | Other Course data |
| Student Assignment | Instruction/policy/own current state | Other Student submissions |
| Teacher Submission | Scoped Student content/history | Foreign Course data |
| Student Grade | Own returned score/feedback | Draft grade, other Student data |
| Admin Governance | Counts/status/IDs | Answer/submission body/feedback mặc định |

## 9. Error Equivalence

Guessed foreign IDs phải không cho attacker phân biệt resource tồn tại. Service layer dùng safe `RESOURCE_NOT_FOUND` hoặc `ACCESS_DENIED` theo established policy, không trả title/owner/status trong error details.

## 10. Scheduling And Reconciliation

- Scheduled content effective status dùng P04 server-clock policy.
- Attempt timeout lazy reconciler là idempotent pure/application service.
- Submission missing luôn derived tại `asOf`; không cần cron.
- Future background reconciliation có thể thêm ở P07 nhưng phải dùng cùng policy function.

## 11. Observability

- Structured event: operation, result, actor role, resource IDs, revision, duration, requestId.
- Metrics: attempt start/submit/conflict/expiry, scoring duration, submissions/late, grade return/regrade, deadline exception.
- Không log answer text, correct keys, submission body, feedback, media URL có token hoặc Grade private details.

## 12. Module Boundary Tests

- ESLint/import test chặn direct model import xuyên domain.
- Contract test cho port version.
- DTO leak tests kiểm tra forbidden fields recursively.
- Composition test xác nhận mọi runtime dependency được register.
- Route/OpenAPI parity test xác nhận operation IDs duy nhất.
