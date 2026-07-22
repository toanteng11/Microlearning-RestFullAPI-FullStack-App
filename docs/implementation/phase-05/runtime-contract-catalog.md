# Phase 05 Runtime Contract Catalog

## 1. Mục Đích

Tài liệu này khóa tên type, enum, port, service method, response envelope và cấu hình TypeScript trước khi code. Snippet là contract định hướng compile; Developer có thể tách type chi tiết theo module nhưng không được đổi behavior/state/field public mà chưa cập nhật baseline.

## 2. Canonical Domain Constants

```ts
export const ASSESSMENT_SCHEMA_VERSION = 1 as const;
export const SCORING_POLICY_VERSION = 'P05_EXACT_SET_INTEGER_V1' as const;
export const LEARNING_ACTIVITY_DESCRIPTOR_VERSION = 'P05_ACTIVITY_DESCRIPTOR_V2' as const;
export const STUDENT_TODO_SCOPE_VERSION = 'P05_MIXED_ACTIVITY_TODO_V2' as const;
export const LEARNING_PROGRESS_METRIC_VERSION =
  'P05_REQUIRED_ACTIVITY_COMPLETION_V1' as const;

export const QUIZ_STATUSES = [
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'UNPUBLISHED',
  'ARCHIVED',
] as const;

export const ATTEMPT_STATUSES = [
  'IN_PROGRESS',
  'SUBMITTED',
  'TIMED_OUT',
  'NEEDS_REVIEW',
  'GRADED',
  'RESULT_RELEASED',
] as const;

export const ASSIGNMENT_STATUSES = [
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'UNPUBLISHED',
  'CLOSED',
  'ARCHIVED',
] as const;

export const SUBMISSION_STATUSES = ['DRAFT', 'SUBMITTED', 'LATE', 'GRADED', 'RETURNED'] as const;
export const DERIVED_SUBMISSION_STATUSES = ['ASSIGNED', 'MISSING'] as const;
export const GRADE_STATUSES = ['DRAFT', 'RETURNED'] as const;
export const QUESTION_TYPES = [
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'SHORT_ANSWER',
] as const;
export const ACTIVITY_TYPES = ['LESSON', 'QUIZ', 'ASSIGNMENT'] as const;

export type QuizStatus = (typeof QUIZ_STATUSES)[number];
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];
export type GradeStatus = (typeof GRADE_STATUSES)[number];
export type QuestionType = (typeof QUESTION_TYPES)[number];
```

Không tạo thêm alias như `CANCELLED`, `EXPIRED`, `PENDING_REVIEW` hoặc `TURNED_IN`. HTTP/database/UI phải dùng canonical names phía trên; derived label tiếng Việt nằm ở frontend formatter.

## 3. Permission Contract

### 3.1 Permissions Mới

```ts
// Student
'quiz.view_assigned'
'quiz.attempt'
'quiz.result_view_own'
'assignment.view_assigned'
'submission.manage_own'
'submission.view_own'
'grade.view_own'

// Teacher
'quiz.manage_owned'
'quiz.publish_owned'
'quiz.results_view_owned'
'quiz.review_owned'
'assignment.manage_owned'
'assignment.publish_owned'
'submission.view_owned'
'grade.manage_owned'
'deadline_exception.manage_owned'

```

### 3.2 Role Grants

| Role | Grants P05 |
| --- | --- |
| `STUDENT` | Bảy own/assigned permissions; không Teacher/Admin permission |
| `TEACHER` | Chín owned permissions; không own-Student result permission |
| `ADMIN` | Không thêm P05 permission; reuse `content.governance_view` cho metadata-only Course counts |
| `SUPER_ADMIN` | Nhận P05 permissions qua `PERMISSIONS` theo cơ chế hiện tại nhưng vẫn bị service ownership/actor-scope policy; không có private override route baseline |

Permission chỉ là lớp đầu. Mọi service vẫn phải kiểm tra Course/Classroom ownership hoặc active Enrollment. Deep-link ngoài scope trả safe `404 RESOURCE_NOT_FOUND` theo policy.

### 3.3 Route Permission Map

| Operation group | Primary route permission | Service scope bắt buộc |
| --- | --- | --- |
| Teacher Quiz list/create/detail/update/preview/Question/media/reorder | `quiz.manage_owned` | Course/Classroom Teacher owner |
| Teacher Quiz status | `quiz.publish_owned` | Owner + lifecycle prerequisite |
| Student Quiz intro | `quiz.view_assigned` | Active Enrollment + visible Quiz |
| Student Attempt start/get/save/submit | `quiz.attempt` | Attempt owner + eligibility/state |
| Student attempt history/result | `quiz.result_view_own` | Student owner + release boundary |
| Teacher result list/detail | `quiz.results_view_owned` | Quiz owner |
| Teacher review/finalize/release/regrade | `quiz.review_owned` | Quiz owner + revision/state |
| Teacher Assignment list/create/detail/update/preview | `assignment.manage_owned` | Course/Classroom owner |
| Teacher Assignment status | `assignment.publish_owned` | Owner + lifecycle prerequisite |
| Teacher Submission roster/detail | `submission.view_owned` | Assignment owner |
| Student Assignment detail | `assignment.view_assigned` | Active Enrollment + visible Assignment |
| Student own Submission detail/history | `submission.view_own` | Student owner |
| Student save/turn-in/unsubmit/resubmit | `submission.manage_own` | Student owner + policy/state |
| Teacher Grade/return/regrade/history | `grade.manage_owned` | Evidence belongs owned activity; Grade permission bao gồm feedback cùng Grade |
| Student own Grade list/detail | `grade.view_own` | Returned own Grade, gồm feedback đã return |
| Teacher deadline exception list/set/revoke/history | `deadline_exception.manage_owned` | Owned activity + active roster Student |
| Conditional basic Gradebook | `grade.manage_owned` | Owned Course; no export/weighting |
| Existing Student Deadline View | Reuse `learning.view_enrolled` | Active Enrollment; own effective deadlines only |
| Existing Admin Course assessment counts | `content.governance_view` | Metadata-only projection |

## 4. Environment Contract

```ts
export interface AssessmentFeatureFlagConfig {
  questionImageUrlEnabled: boolean;
  questionVideoUrlEnabled: boolean;
  questionMediaAllowedHosts: readonly string[];
  assignmentLinkSubmissionEnabled: boolean;
  assignmentMarkDoneEnabled: boolean;
  basicGradebookEnabled: boolean;
  assessmentFileUploadEnabled: false;
}

export interface AssessmentRateLimitConfig {
  mutationWindowSeconds: number;
  mutationIdentityMax: number;
  attemptStartIpMax: number;
  attemptStartIdentityMax: number;
  answerSaveIdentityMax: number;
}
```

`AppConfig` thêm `assessmentFeatures` và `assessmentRateLimits`. `loadEnvironment()` phải:

1. Parse boolean bằng helper hiện có.
2. Chuẩn hóa allowlist thành lowercase hostname duy nhất; không nhận scheme/path.
3. Từ chối startup nếu media enabled nhưng allowlist rỗng.
4. Từ chối startup mọi environment nếu `ASSESSMENT_FILE_UPLOAD_ENABLED=true` trong P05.
5. Yêu cầu explicit P05 fields ở staging/production theo pattern `phaseFourExplicitProductionFields`.
6. Không log raw allowlist request URL, credential hoặc `.env`.

## 5. Shared HTTP Contract

```ts
export interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

export interface PaginatedEnvelope<T, TExtra extends object = Record<string, never>> {
  success: true;
  data: { items: T[] } & TExtra;
  meta: Pagination;
}

export interface PaginatedResult<T, TExtra extends object = Record<string, never>> {
  data: { items: T[] } & TExtra;
  meta: Pagination;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; code: string; message: string }>;
  };
  meta: { requestId: string; timestamp: string; path: string };
}
```

- Success `requestId` đọc từ response header `x-request-id` khi cần hỗ trợ.
- Validation dùng `422 VALIDATION_ERROR` như `parseWithSchema` hiện tại.
- Unsupported query enum/sort không silent fallback.
- `204` không có JSON body; mutation cần trả revision/audit dùng `200/201` envelope.
- Private routes luôn `Cache-Control: private, no-store`.

## 6. Learning Activity V2 Contract

```ts
export type LearningActivityType = 'LESSON' | 'QUIZ' | 'ASSIGNMENT';

export interface LearningActivityDescriptor {
  activityType: LearningActivityType;
  activityId: string;
  classroomId: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  isRequired: boolean;
  completionDeadline: string;
  displayOrder: number;
  visible: boolean;
  actionUrl: string;
}

export interface LearningActivityReader {
  readonly descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2';
  listByCourseIds(
    courseIds: readonly string[],
    asOf: Date,
  ): Promise<ReadonlyMap<string, readonly LearningActivityDescriptor[]>>;
}
```

`actionUrl` được tạo server-side. Composite reader merge ba adapter rồi sort theo Course/Module/display order/activity type/id. Lesson compatibility test phải chứng minh field semantics P04 không đổi ngoài version/union.

Response placement:

- Classwork `data.descriptorVersion=P05_ACTIVITY_DESCRIPTOR_V2`.
- To-do `data.scopeVersion=P05_MIXED_ACTIVITY_TODO_V2`.
- Deadlines `data.descriptorVersion=P05_ACTIVITY_DESCRIPTOR_V2`.
- Progress/Teacher dashboard `metricVersion=P05_REQUIRED_ACTIVITY_COMPLETION_V1`.

### 6.1 Learning Progress V2

```ts
export type LearningProgressStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface LearningProgressSnapshot {
  studentId: string;
  activityType: LearningActivityType;
  activityId: string;
  status: LearningProgressStatus;
  startedAt: string;
  completedAt: string | null;
  lastActiveAt: string;
}

export interface LearningProgressReader {
  readonly metricVersion: 'P05_REQUIRED_ACTIVITY_COMPLETION_V1';
  listStudentProgress(
    studentId: string,
    activities: readonly ActivityKey[],
  ): Promise<ReadonlyMap<string, LearningProgressSnapshot>>;
  countCompletedByActivities(
    activities: readonly ActivityKey[],
  ): Promise<ReadonlyMap<string, number>>;
}
```

Map key phải gồm discriminator, ví dụ `${activityType}:${activityId}`, để ObjectId bằng nhau ở hai collection khác nhau không collision. Result/Grade state không persist trong `learning_progress` và không nằm trong interface này.

## 7. Effective Deadline Contract

```ts
export interface ActivityKey {
  activityType: 'LESSON' | 'QUIZ' | 'ASSIGNMENT';
  activityId: string;
}

export interface EffectiveDeadline {
  defaultDeadline: Date;
  effectiveDeadline: Date;
  source: 'DEFAULT' | 'STUDENT_EXCEPTION';
  exceptionRevision: number | null;
}

export interface ActivityDeadlineReader {
  getDefaultDeadline(activity: ActivityKey): Promise<Date | null>;
}

export interface EffectiveDeadlineResolver {
  resolve(activity: ActivityKey, studentId: string): Promise<EffectiveDeadline>;
  resolveMany(
    activities: readonly ActivityKey[],
    studentId: string,
  ): Promise<ReadonlyMap<string, EffectiveDeadline>>;
}
```

Published Lesson/Quiz/Assignment phải có default deadline nên null tại resolver là invalid/not-found state. Attempt, Submission, To-do, Deadlines và progress đều gọi cùng resolver; không tự tính lại precedence.

## 8. Question Contracts

```ts
interface QuestionBase {
  prompt: string;
  points: number;
  isRequired: boolean;
  explanation?: string | null;
  media?: QuestionMedia | null;
}

interface ChoiceOptionInput {
  id?: string;
  label: string;
}

export interface QuestionMedia {
  kind: 'IMAGE_URL' | 'VIDEO_URL';
  url: string;
  provider: string | null;
  caption: string | null;
  altText: string | null;
}

export type QuestionInput =
  | (QuestionBase & {
      type: 'SINGLE_CHOICE';
      options: ChoiceOptionInput[];
      correctOptionIds: string[];
    })
  | (QuestionBase & {
      type: 'MULTIPLE_CHOICE';
      options: ChoiceOptionInput[];
      correctOptionIds: string[];
    })
  | (QuestionBase & {
      type: 'TRUE_FALSE';
      correctBoolean: boolean;
    })
  | (QuestionBase & {
      type: 'SHORT_ANSWER';
      rubric?: string | null;
    });
```

- Create request có thể nhận labels rồi server phát stable option IDs; update dùng IDs server đã trả.
- `SINGLE_CHOICE` đúng một key; `MULTIPLE_CHOICE` non-empty exact set; `TRUE_FALSE` canonical; `SHORT_ANSWER` không key/options.
- Student DTO không có `correctOptionIds`, `correctBoolean`, `rubric`, `explanation` mặc định hoặc scoring metadata.

## 9. Attempt Snapshot And Scoring Contract

```ts
export interface AttemptQuestionSnapshot {
  questionId: string;
  questionRevision: number;
  type: QuestionType;
  prompt: string;
  points: number;
  isRequired: boolean;
  displayOrder: number;
  options: Array<{ id: string; label: string; displayOrder: number }>;
  media: QuestionMedia | null;
  scoring: {
    correctOptionIds: string[];
    rubric: string | null;
  };
}

export interface ScoreBreakdown {
  objectiveScore: number;
  manualScore: number;
  totalScore: number;
  maxScore: number;
  manualReviewRequired: boolean;
  scoringPolicyVersion: 'P05_EXACT_SET_INTEGER_V1';
}
```

`scoring` chỉ tồn tại trong persistence/private repository projection, không xuất hiện trong Student DTO hoặc logs. Scoring function là pure:

```ts
scoreObjectiveAnswers(
  questions: readonly AttemptQuestionSnapshot[],
  answers: readonly AttemptAnswer[],
): ScoreBreakdown;
```

`MULTIPLE_CHOICE` chuẩn hóa selected IDs thành unique sorted set rồi so exact set; không partial credit. Mọi điểm là integer.

## 10. Service Method Contract

### 10.0 Canonical Mutation Results

```ts
export interface QuestionMutationResult {
  question: TeacherQuestionDto;
  questionRevision: number;
  maxScore: number;
  auditId: string;
}

export interface QuestionReorderResult {
  items: TeacherQuestionDto[];
  questionRevision: number;
  maxScore: number;
  auditId: string;
}

export interface AttemptSaveResult {
  attemptId: string;
  revision: number;
  lastSavedAt: string;
  answers: StudentAttemptAnswerDto[];
  answeredCount: number;
  totalQuestions: number;
}

export interface AttemptSubmitResult {
  attempt: StudentAttemptTerminalDto;
  resultAvailable: boolean;
  resultUrl: string | null;
  idempotentReplay: boolean;
}

export interface AssignmentMutationResult {
  assignment: TeacherAssignmentDto;
  auditId: string;
}

export interface DeadlineExceptionMutationResult {
  deadlineException: TeacherDeadlineExceptionDto | null;
  effectiveDeadline: string;
  revision: number;
  auditId: string;
}
```

Quiz/Assignment/Grade DTO trong mutation luôn là canonical post-commit snapshot. Route không tự merge request body vào response. `auditId` chỉ có khi command tạo AuditLog theo policy; không giả ID ở read operation.

### 10.1 Quiz And Question

```ts
class QuizService {
  create(actor, courseId, input, requestId): Promise<{ quiz: TeacherQuizDto; auditId: string }>;
  list(actor, courseId, query): Promise<{ data: { items: TeacherQuizListItem[] }; meta: Pagination }>;
  getTeacherDetail(actor, quizId): Promise<TeacherQuizDto>;
  getStudentIntro(actor, quizId): Promise<StudentQuizIntroDto>;
  update(actor, quizId, input, requestId): Promise<{ quiz: TeacherQuizDto; auditId: string }>;
  changeStatus(actor, quizId, input, requestId): Promise<{ quiz: TeacherQuizDto; auditId: string }>;
  preview(actor, quizId): Promise<StudentQuizPreviewDto>;
}

class QuestionService {
  list(actor, quizId): Promise<TeacherQuestionDto[]>;
  create(actor, quizId, input, requestId): Promise<QuestionMutationResult>;
  update(actor, questionId, input, requestId): Promise<QuestionMutationResult>;
  archive(actor, questionId, input, requestId): Promise<QuestionMutationResult>;
  reorder(actor, quizId, input, requestId): Promise<QuestionReorderResult>;
  setMedia(actor, questionId, input, requestId): Promise<QuestionMutationResult>;
  removeMedia(actor, questionId, input, requestId): Promise<QuestionMutationResult>;
}
```

### 10.2 Attempt And Review

```ts
class QuizAttemptService {
  start(actor, quizId, requestId): Promise<{ attempt: StudentAttemptDto; resumed: boolean }>;
  getOwn(actor, attemptId): Promise<StudentAttemptDto>;
  saveAnswers(actor, attemptId, input): Promise<AttemptSaveResult>;
  submit(actor, attemptId, input, requestId): Promise<AttemptSubmitResult>;
  listOwn(actor, quizId, query): Promise<PaginatedResult<StudentAttemptHistoryDto>>;
  getOwnResult(actor, attemptId): Promise<StudentQuizResultDto>;
}

class QuizReviewService {
  listResults(actor, quizId, query): Promise<PaginatedResult<TeacherQuizResultRowDto>>;
  getAttempt(actor, attemptId): Promise<TeacherAttemptReviewDto>;
  saveReview(actor, attemptId, input, requestId): Promise<TeacherAttemptReviewDto>;
  finalizeReview(actor, attemptId, input, requestId): Promise<TeacherAttemptReviewDto>;
  release(actor, attemptId, input, requestId): Promise<TeacherQuizResultDto>;
  regrade(actor, attemptId, input, requestId): Promise<TeacherQuizResultDto>;
}
```

### 10.3 Assignment, Submission And Grade

```ts
class AssignmentService {
  create(actor, courseId, input, requestId): Promise<AssignmentMutationResult>;
  list(actor, courseId, query): Promise<PaginatedResult<TeacherAssignmentListItem>>;
  getTeacherDetail(actor, assignmentId): Promise<TeacherAssignmentDto>;
  getStudentDetail(actor, assignmentId): Promise<StudentAssignmentDto>;
  update(actor, assignmentId, input, requestId): Promise<AssignmentMutationResult>;
  changeStatus(actor, assignmentId, input, requestId): Promise<AssignmentMutationResult>;
  preview(actor, assignmentId): Promise<StudentAssignmentPreviewDto>;
}

class SubmissionService {
  getOwn(actor, assignmentId): Promise<StudentSubmissionDto | null>;
  saveDraft(actor, assignmentId, input, requestId): Promise<StudentSubmissionDto>;
  turnIn(actor, submissionId, input, requestId): Promise<StudentSubmissionDto>;
  unsubmit(actor, submissionId, input, requestId): Promise<StudentSubmissionDto>;
  resubmit(actor, submissionId, input, requestId): Promise<StudentSubmissionDto>;
  listOwnHistory(actor, submissionId, query): Promise<PaginatedResult<SubmissionRevisionDto>>;
  listRoster(actor, assignmentId, query): Promise<PaginatedResult<SubmissionRosterRowDto>>;
  getTeacherDetail(actor, submissionId): Promise<TeacherSubmissionDto>;
}

class GradeService {
  save(actor, submissionId, input, requestId): Promise<TeacherGradeDto>;
  returnWork(actor, submissionId, input, requestId): Promise<TeacherGradeDto>;
  regrade(actor, gradeId, input, requestId): Promise<TeacherGradeDto>;
  history(actor, gradeId, query): Promise<PaginatedResult<GradeRevisionDto>>;
  listOwn(actor, query): Promise<PaginatedResult<StudentGradeListItemDto>>;
  getOwn(actor, gradeId): Promise<StudentGradeDetailDto>;
}
```

### 10.4 Deadline Exception

```ts
class DeadlineExceptionService {
  list(actor, activity, query): Promise<PaginatedResult<TeacherDeadlineExceptionRowDto>>;
  set(actor, activity, studentId, input, requestId): Promise<DeadlineExceptionMutationResult>;
  revoke(actor, activity, studentId, input, requestId): Promise<DeadlineExceptionMutationResult>;
  history(actor, activity, studentId, query): Promise<PaginatedResult<DeadlineExceptionHistoryDto>>;
}
```

Các signature trên rút gọn type `AuthenticatedUser`/input cho dễ đọc. Implementation phải dùng type cụ thể, không dùng implicit `any`.

## 11. Repository CAS Contract

Mọi update revision dùng một Mongo predicate duy nhất, ví dụ:

```ts
findOneAndUpdate(
  { _id, contentRevision: expectedContentRevision, archivedAt: null },
  { $set: update, $inc: { contentRevision: 1 } },
  { new: true, session },
);
```

Khi không match:

1. Query minimal existence/current revision trong cùng scope.
2. Nếu không tồn tại/không scope: safe `404`.
3. Nếu state/revision khác: `409 CONCURRENT_MODIFICATION` hoặc domain state code.
4. Không trả raw document trong `details`.

Natural keys bắt buộc:

- Attempt number: `{quizId, studentId, attemptNumber}` unique.
- Active attempt: partial unique `{quizId, studentId}` khi `status=IN_PROGRESS`.
- Submission current: `{assignmentId, studentId}` unique.
- Submission revision: `{submissionId, revision}` unique.
- Grade current: `{activityType, activityId, studentId}` unique.
- Grade revision: `{gradeId, revision}` unique.
- Deadline current: `{activityType, activityId, studentId}` unique.
- Deadline history: `{deadlineExceptionId, revision}` unique.

## 12. DTO Visibility Contract

| Field group | Student own | Teacher owner | Admin governance |
| --- | --- | --- | --- |
| Quiz metadata/deadline | Yes khi visible | Yes | Count/status metadata |
| Question prompt/options | Active attempt only | Yes | No |
| Correct key/rubric | No | Yes | No |
| Other Student identity | No | Roster/result scope | No private roster qua P05 governance |
| Own answer/submission body | Own only | Owned review/grading | No |
| Draft Grade/feedback | No | Yes | No |
| Returned Grade/feedback | Own only | Yes | No |
| Audit metadata | No | Action result `auditId` khi cần | Governance API riêng |

Forbidden-field test phải duyệt đệ quy key names, gồm nested snapshot/history/example.

### 12.1 Canonical `allowedActions`

| DTO | Action tokens có thể trả |
| --- | --- |
| Teacher Quiz | `EDIT`, `PREVIEW`, `SCHEDULE`, `PUBLISH`, `UNPUBLISH`, `ARCHIVE`, `VIEW_RESULTS`, `MANAGE_DEADLINES` |
| Teacher Question | `EDIT`, `MOVE_UP`, `MOVE_DOWN`, `ARCHIVE`, `SET_MEDIA`, `REMOVE_MEDIA` |
| Student Quiz intro/Attempt | `START`, `RESUME`, `SAVE_ANSWER`, `SUBMIT`, `VIEW_RESULT` |
| Teacher Assignment | `EDIT`, `PREVIEW`, `SCHEDULE`, `PUBLISH`, `UNPUBLISH`, `CLOSE`, `REOPEN`, `ARCHIVE`, `VIEW_SUBMISSIONS`, `MANAGE_DEADLINES` |
| Student Submission | `SAVE_DRAFT`, `TURN_IN`, `UNSUBMIT`, `RESUBMIT`, `VIEW_HISTORY`, `VIEW_GRADE` |
| Teacher Grade | `SAVE_GRADE`, `RETURN_WORK`, `REGRADE`, `VIEW_HISTORY` |
| Deadline exception | `SET`, `EXTEND`, `REVOKE`, `VIEW_HISTORY` |

Action token là server-derived UX contract, không thay thế authorization. Web không tự suy diễn action từ status/role và không gửi token ngược lại để cấp quyền.

## 13. Frontend Request State Contract

```ts
export type RemoteState<T> =
  | { status: 'LOADING'; data: null; error: null }
  | { status: 'READY'; data: T; error: null }
  | { status: 'EMPTY'; data: T; error: null }
  | { status: 'ERROR'; data: T | null; error: ApiError };

export type SaveState = 'IDLE' | 'DIRTY' | 'SAVING' | 'SAVED' | 'ERROR' | 'CONFLICT';
```

- `403/404` deep link không render stale private data.
- `409 CONCURRENT_MODIFICATION` chuyển `CONFLICT`, giữ local draft trong memory và đưa nút Reload/Review; không auto overwrite.
- Attempt `ATTEMPT_EXPIRED` bắt buộc reload canonical attempt/result.
- Mutation thành công cập nhật revision từ response trước khi cho phép mutation tiếp.
- Unmount/route change bỏ qua late response bằng cancellation flag; không set state sau unmount.

## 14. Contract Freeze Checklist

- [x] Gate A chấp thuận constants, permissions, flags và service boundaries ngày `2026-07-22`.
- [ ] Không type/status nào khác baseline xuất hiện trong OpenAPI/model/UI.
- [ ] Response envelope khớp middleware/Phase 04 runtime.
- [ ] Classwork giữ route `/classrooms/:classroomId/classwork`.
- [ ] Student DTO recursive leak tests đã được thiết kế.
- [ ] Every revisioned mutation có expected revision và conflict behavior.
- [ ] Every time-based service inject server `now`.
- [ ] Conditional fields/routes có feature-off test.
