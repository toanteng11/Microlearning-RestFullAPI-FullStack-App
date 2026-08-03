# Phase 06 Analytics Event Contract

## 1. Status And Purpose

Analytics event là Conditional, đã đạt Local Pass tại commit `f1baf06` và mặc định
`ANALYTICS_EVENTS_ENABLED=false`. Mục đích: hiểu mức sử dụng và vận hành ở dạng aggregate an toàn.
Event không quyết định Enrollment, completion, Grade, deadline hoặc authorization.

## 2. Event Envelope

```ts
interface AnalyticsEventEnvelope {
  eventId: string;            // UUID, idempotency key
  eventName: AllowedEventName;
  schemaVersion: '1';
  occurredAt: string;         // client/server event time
  actor: {
    id: string;               // authenticated actor, server overrides client
    role: UserRole;
  };
  context: {
    classroomId?: string;
    courseId?: string;
    activityType?: 'LESSON' | 'QUIZ' | 'ASSIGNMENT';
    activityId?: string;
  };
  properties: Record<string, string | number | boolean | null>;
}
```

Server tự gắn `receivedAt`, environment, app version và actor identity.

## 3. Event Catalog

### Backend Transaction-Derived

- `account_activated`;
- `login_succeeded`;
- `classroom_created`;
- `classroom_joined`;
- `course_published`;
- `lesson_started`;
- `lesson_completed`;
- `quiz_started`;
- `quiz_submitted`;
- `assignment_opened`;
- `assignment_submitted`;
- `submission_graded`;
- `deadline_exception_created`;
- `teacher_invitation_created`;
- `teacher_invitation_accepted`;
- `report_export_requested/completed`.

### Client Interaction

- `report_viewed`;
- `report_filter_changed`;
- `report_tab_changed`;

Client event là best effort và không dùng làm learning truth.

## 4. Property Allowlist

Mỗi event có Zod schema riêng. Safe examples:

- report ID;
- activity type;
- lifecycle/status enum;
- duration bucket;
- result `SUCCESS/FAILED`;
- row count bucket;
- client surface/version.

Không chấp nhận arbitrary nested object.

## 5. PII/Secret Denylist

Không event:

- email/fullName/studentCode nếu không cần;
- raw answer/submission/content/feedback;
- score/Grade ở level cá nhân cho product event;
- token/cookie/header/password/hash;
- invitation/join token;
- IP raw dài hạn; nếu security rate limit dùng IP thì không chuyển sang analytics.

## 6. Idempotency And Ordering

- `eventId` unique.
- Duplicate event trả idempotent success.
- Không giả định event đến đúng thứ tự.
- `occurredAt` lệch clock quá giới hạn bị normalize/reject.
- Aggregate dùng `receivedAt`/time policy ghi rõ.

## 7. Failure Isolation

- Event write fail không fail learning/report business request.
- Client queue bounded, không infinite retry.
- Backend log error code/count, không log payload nhạy cảm.
- Feature flag kill switch.

## 8. Retention

Baseline `90` days, TTL index. Retention thay đổi cần privacy/DevOps approval. AuditLog có
retention riêng và không được thay bằng analytics collection.

## 9. Event Reporting

Allowed aggregate:

- report view count;
- feature adoption theo role;
- active Course usage;
- event ingestion invalid/duplicate rate;
- export success/failure.

Không xếp hạng Student theo page view/click count.

## 10. Tests

- schema allowlist/unknown property reject;
- actor spoof overridden;
- duplicate event idempotent;
- out-of-scope context reject;
- PII/secret denylist;
- body max/rate limit;
- feature disabled;
- storage failure isolation;
- TTL/index;
- event không làm thay đổi Progress/Grade.
