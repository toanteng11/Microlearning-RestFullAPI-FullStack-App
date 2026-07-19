# Phase 04 Architecture And Module Design

## 1. Architecture Context

Phase 04 mở rộng Modular Monolith hiện tại. React và Express tiếp tục dùng cùng origin ở production; MongoDB là persistence source. Không tạo microservice hay queue chỉ để chuẩn bị tương lai.

```text
React Web
  -> /api/v1
Express composition root
  -> Auth/RBAC middleware
  -> PhaseFourRouter
     -> Course/Module/Lesson/Announcement services
     -> Access/Lifecycle/Deadline/Progress policies
     -> Repositories + Mongo UnitOfWork
  -> MongoDB replica set

Optional resource adapter
  -> Google Cloud Storage (conditional only)
```

## 2. Proposed Source Structure

```text
apps/api/src/
  modules/
    phase-four.router.ts
    learning-content/
      content-access.service.ts
      content-visibility.policy.ts
      content.types.ts
      learning-activity.reader.ts
    courses/
      course.model.ts
      course.repository.ts
      course.schemas.ts
      course.service.ts
      course.dto.ts
      course.types.ts
    modules/
      module.model.ts
      module.repository.ts
      module.schemas.ts
      module.service.ts
    lessons/
      lesson.model.ts
      lesson.repository.ts
      lesson.schemas.ts
      lesson.service.ts
      lesson-navigation.service.ts
    flashcards/
      flashcard.model.ts
      flashcard.repository.ts
      flashcard.schemas.ts
      flashcard.service.ts
    deadlines/
      lesson-deadline-change.model.ts
      lesson-deadline.repository.ts
      deadline.policy.ts
    announcements/
      announcement.model.ts
      announcement.repository.ts
      announcement.schemas.ts
      announcement.service.ts
    learning-progress/
      learning-progress.model.ts
      learning-progress.repository.ts
      learning-progress.service.ts
      course-dashboard.query.ts
      student-todo.query.ts
    learning-resources/              # conditional
      learning-resource.*
  docs/
    phase-four.openapi.ts
  shared/database/
    phase-four-indexes.ts

apps/web/src/
  features/
    courses/
    lesson-authoring/
    learning-player/
    announcements/
    student-todo/
```

Tên `modules` domain không được nhầm với thư mục Node modules; import path phải rõ và không dùng generic `utils` cho domain logic.

## 3. Module Responsibilities

| Module | Chịu trách nhiệm | Không chịu trách nhiệm |
| --- | --- | --- |
| `courses` | Course lifecycle, summary, structure revision | Enrollment internals, Student grade |
| `modules` | Module metadata/order/lifecycle | Lesson content body |
| `lessons` | Lesson content/lifecycle/navigation projection | Per-Student analytics aggregate |
| `flashcards` | Cards và order trong Lesson | Independent visibility/progress |
| `deadlines` | Deadline policy/history/revision | Notification delivery |
| `announcements` | Classroom Stream lifecycle | Course activities |
| `learning-progress` | Start/complete, To-do/dashboard v1 query | Quiz/Assignment logic |
| `learning-content` | Cross-module access/visibility/activity contract | Persistence ownership của aggregate khác |
| `learning-resources` | URL/GCS metadata qua provider port | Raw binary trong Mongo/API disk |

## 4. Dependency Direction

```text
router -> services -> policies/ports -> repositories -> models

courses <- modules/lessons through CourseScopeReader
lessons <- flashcards/deadlines through LessonScopeReader
P04 -> P03 through ClassroomScopeReader and EnrollmentAccessReader
P05/P06 -> P04 through LearningActivityReader and LearningProgressReader
```

Forbidden dependencies:

- Service import Mongoose model của module khác.
- React component gọi `fetch` trực tiếp ngoài shared API client.
- Repository quyết định RBAC/business transition.
- Controller tự tính progress/deadline/visibility.
- P03 import Course model để đếm content; dùng `ClassroomContentReader` injection.

## 5. Port Contracts

### 5.1 Classroom Scope Reader

```ts
interface ClassroomScopeReader {
  getTeacherOwnedScope(actorId: string, classroomId: string): Promise<{
    classroomId: string;
    ownerTeacherId: string;
    status: 'ACTIVE' | 'LOCKED' | 'ARCHIVED';
  }>;
  getStudentEnrollmentScope(studentId: string, classroomId: string): Promise<{
    classroomId: string;
    enrollmentId: string;
    classroomStatus: string;
    enrollmentStatus: string;
  }>;
}
```

Implementation adapter được đặt gần composition root/P03. Port không trả raw credential, roster hoặc settings không cần thiết.

### 5.2 Course Scope Reader

P04 cung cấp cho P05:

```ts
interface CourseScopeReader {
  requireTeacherManage(actorId: string, courseId: string): Promise<CourseScope>;
  requireStudentView(studentId: string, courseId: string): Promise<CourseScope>;
  getActivityContainer(courseId: string): Promise<ActivityContainer>;
}
```

### 5.3 Learning Activity Reader

```ts
type LearningActivityDescriptor = {
  activityType: 'LESSON';
  activityId: string;
  classroomId: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  isRequired: boolean;
  completionDeadline: string;
  displayOrder: number;
  visible: boolean;
};
```

Phase 05 mở rộng union bằng adapter đăng ký, không sửa Lesson document để nhét Quiz/Assignment.

### 5.4 Classroom Content Reader

```ts
interface ClassroomContentReader {
  countByClassroomIds(ids: readonly string[]): Promise<Map<string, number>>;
  getGovernanceSummary(classroomId: string): Promise<ContentGovernanceSummary>;
}
```

P03 Admin list/detail gọi port để thêm `contentCount`; khi P04 chưa register, composition fallback phải trả `0` chỉ trong test bootstrap cũ, không trong production P04.

## 6. Request Flows

### 6.1 Teacher Publishes Lesson

```text
Route auth/RBAC
  -> parse params/body
  -> LessonService.publish
  -> LessonScopeReader resolves Course/Classroom
  -> current ownership + lifecycle + prerequisite + CAS
  -> UnitOfWork: update Lesson + AuditLog
  -> DTO mapper
  -> 200 response
```

### 6.2 Student Opens Lesson

```text
Route auth/RBAC
  -> parse lessonId
  -> ContentAccessService.requireStudentVisibleLesson
  -> Enrollment + ancestor visibility
  -> Lesson projection + flashcards + navigation
  -> Cache-Control: private, no-store
  -> 200 response
```

GET không ghi started state. Client gọi explicit `/start` sau khi Lesson Player render thành công.

### 6.3 Student Completes Lesson

```text
Authorization/visibility
  -> upsert natural progress key in transaction
  -> preserve first completedAt on retry
  -> emit structured completion event metadata once after first commit
  -> return newlyCompleted + progress summary
```

### 6.4 Teacher Reorders Content

```text
Authorize owner
  -> load active child IDs and current structureRevision
  -> validate exact set + expected revision
  -> transaction bulk update displayOrder
  -> increment parent structureRevision + AuditLog
  -> return canonical ordered projection
```

## 7. Service Boundaries

| Service | Public methods chính |
| --- | --- |
| `CourseService` | create/list/get/update/changeStatus/archive/getDashboard |
| `ModuleService` | create/update/changeStatus/archive/reorder |
| `LessonService` | create/get/update/changeStatus/archive/preview |
| `LessonNavigationService` | studentProjection/previousNext |
| `FlashcardService` | list/create/update/archive/reorder |
| `DeadlineService` | change/getHistory |
| `AnnouncementService` | list/create/update/changeStatus/archive |
| `LearningProgressService` | start/complete/getOwnProgress |
| `StudentTodoQuery` | listTodo/listDeadlines |
| `CourseDashboardQuery` | summary/activities/students/ranking |

Service method nhận authenticated actor từ middleware và server-generated requestId; không nhận role/owner ID rời từ body.

## 8. DTO Rules

- Mongoose document không trả trực tiếp ra controller.
- ID được stringify nhất quán.
- Date serialize ISO UTC.
- Teacher DTO có lifecycle/revision; Student DTO loại draft/audit/internal metadata.
- Optional field dùng `null` nhất quán, không lúc missing lúc empty string.
- List response giữ envelope `{ success, data, meta }` theo P02/P03.
- Error qua `AppError` và common handler; không route-specific raw stack.

## 9. Transaction Boundaries

| Use case | Transaction |
| --- | --- |
| Create single draft without audit-critical event | Có thể single write |
| Publish/unpublish/archive | Content + AuditLog |
| Reorder | Children + parent revision + AuditLog |
| Deadline change | Lesson + history + AuditLog |
| First complete | Progress source-of-truth; structured event after first commit |
| Retry complete | Read/current result; không duplicate side effect |
| Announcement publish/archive | Announcement + AuditLog |

Transaction retry chỉ áp dụng Mongo transient label theo UnitOfWork hiện tại; không retry validation/auth/conflict error.

## 10. OpenAPI Composition

- `phase-four.openapi.ts` export paths/components/tags.
- Root `openapi.ts` compose nhưng detect duplicate operationId/path-method.
- Mỗi route có security, permission summary, success schema, common errors và examples.
- `operationId` ổn định theo `verbResourceContext`, ví dụ `publishLesson`, `listStudentTodo`.
- OpenAPI contract test so sánh registered route manifest với documented path/method.

## 11. Observability

Structured events tối thiểu:

- `course.created`, `content.status.changed`.
- `content.structure.reordered`.
- `lesson.deadline.changed`.
- `lesson.started`, `lesson.completed` là operational events; không ghi full governance AuditLog cho mỗi hành vi học.
- `announcement.published`.
- `content.access.denied` ở mức rate-controlled.
- `course.dashboard.queried` với duration/count, không Student details trong message.

Log fields: event, requestId, actorId, resourceType, resourceId, classroomId, outcome, durationMs. Không log Markdown body, flashcard text, deadline reason đầy đủ hoặc signed URL.

## 12. Performance Design

- Repository list luôn projection + index-backed sort.
- Dashboard batch load; không query từng Student/Lesson.
- Use `$match` sớm trước `$lookup/$group`.
- Student visibility batch resolve ancestor IDs.
- Limit tối đa `100`; default `20` trừ structure endpoint có bounded full list.
- Explain-plan smoke cho dashboard/todo indexes trên dataset chuẩn.

## 13. Failure And Recovery

- Validation: không write.
- Conflict: trả revision/current timestamp tối thiểu trong error details an toàn.
- Transaction abort: không partial history/audit.
- Optional GCS unavailable: content core vẫn hoạt động; resource operation trả dependency error.
- Dashboard query fail: Teacher authoring không bị khóa; UI có retry riêng.
- Scheduled read uses server clock; không phụ thuộc background service.

## 14. Phase Handoff

Phase 04 exit phải cung cấp:

- Activity descriptor schema/version.
- Content visibility service contract.
- Deadline policy API.
- Progress source schema và metric version.
- Stable IDs/order rules cho Phase 05 insertion.
- Rebuildable query definition cho Phase 06.
