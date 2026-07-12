# Analytics Event Tracking

## Mục Đích

Analytics event tracking đo adoption và engagement để cải thiện sản phẩm/học liệu. Nó không thay thế transactional data, AuditLog hoặc logic chính thức về progress/score/grade.

## Event Design Principles

| ID | Principle | Rule |
| --- | --- | --- |
| EVT-01 | Purposeful | Event phải map tới product question/metric, không thu thập “cho chắc”. |
| EVT-02 | Authoritative where needed | Completion/submission/grade/join thành công do backend emit/derive từ committed business record. |
| EVT-03 | Client event is best-effort | View/open/click event từ frontend có thể mất; không dùng để tính điểm/progress. |
| EVT-04 | No sensitive payload | Không email/fullName/password/token/raw invitation link/submission content/file URL secret. |
| EVT-05 | Versioned schema | Mỗi event có `eventName`, `schemaVersion`; field đổi breaking cần version/review. |
| EVT-06 | Deduplicated | Có `eventId`; backend event dùng business record/operation id để chống double count. |
| EVT-07 | Time and context | Có `occurredAt` UTC, environment, app version, actor role/context scope không nhạy cảm. |
| EVT-08 | Validated | Allowlist event/properties/type/size; reject/quarantine invalid event. |

## Event Envelope

```json
{
  "eventId": "evt_uuid",
  "eventName": "lesson_completed",
  "schemaVersion": 1,
  "occurredAt": "2026-07-10T10:00:00.000Z",
  "receivedAt": "2026-07-10T10:00:01.000Z",
  "environment": "staging",
  "actor": {
    "userId": "internal-id-or-pseudonymous-reference",
    "role": "STUDENT"
  },
  "context": {
    "classroomId": "internal-id",
    "courseId": "internal-id",
    "activityId": "internal-id"
  },
  "properties": {
    "activityType": "LESSON",
    "completionMethod": "SYSTEM_POLICY"
  },
  "appVersion": "1.0.0"
}
```

`userId`, `classroomId`, `courseId` có thể được pseudonymize/hashed ở analytics destination nếu analytics audience không cần truy ngược identity. Client không được tự khai `actor.userId`/role như dữ liệu tin cậy; backend/session xác định actor khi event cần authenticated context.

## Event Catalog

| Event name | Producer | Trigger | Required safe properties | Use |
| --- | --- | --- | --- | --- |
| `account_activated` | Backend | Account chuyển ACTIVE qua invitation/provision policy | activationMethod, role | Activation funnel. |
| `login_succeeded` | Backend | Login success | role, authMethod | DAU/WAU candidate, auth adoption. |
| `classroom_created` | Backend | Teacher creates Classroom | classroomId, enrollmentPolicy flags | Teacher/Classroom adoption. |
| `classroom_joined` | Backend | Unique enrollment success | classroomId, joinMethod `CLASS_CODE/INVITE_LINK` | Join funnel/method adoption. |
| `course_published` | Backend | Teacher publishes Course | courseId, classroomId | Content readiness/publish trend. |
| `lesson_started` | Frontend best-effort or Backend view endpoint | Student opens eligible Lesson | courseId, lessonId, activityType | Engagement, not completion. |
| `lesson_completed` | Backend | Completion policy persisted | courseId, lessonId, activityType | Completion trend; official record remains progress data. |
| `quiz_started` | Backend/Frontend controlled | Valid attempt begins | courseId, quizId, attemptNumber | Assessment engagement. |
| `quiz_submitted` | Backend | Valid quiz attempt submitted | courseId, quizId, attemptNumber, submissionStatus | Submit trend; score omitted unless aggregate need approved. |
| `assignment_opened` | Frontend best-effort | Student opens Assignment | courseId, assignmentId | Engagement. |
| `assignment_submitted` | Backend | Submission accepted | courseId, assignmentId, submissionStatus, lateFlag | Submission trend. |
| `submission_graded` | Backend | Teacher saves/publishes grade | courseId, assessmentId, assessmentType | Teaching workflow adoption; no Student name/feedback text. |
| `lesson_deadline_reset` | Backend | Teacher resets Lesson deadline with reason | courseId, lessonId, old/new date category, reasonProvided=true | Feature adoption/operation trend; full reason stays AuditLog. |
| `question_media_added` | Backend | Teacher adds image/video to Question | courseId, quizId, mediaType | Optional media adoption. |
| `teacher_invitation_created` | Backend | Admin creates Teacher invitation | invitation status only, role | Onboarding funnel; no email/token/link. |
| `teacher_invitation_accepted` | Backend | Teacher invitation accepted | role | Onboarding completion. |
| `report_viewed` | Frontend/Backend controlled | Authorized dashboard/report view | reportType, scopeType, filter dimension names only | Report adoption/performance. |
| `report_export_requested` | Backend | Authorized export job requested | reportType, format, scopeType | Export demand; no exported data/filter values sensitive. |
| `report_export_completed` | Backend job | Export becomes ready | reportType, duration bucket, result | Export operation quality. |
| `feature_error_shown` | Frontend controlled | User-facing recoverable error state | featureArea, safe errorCode | UX issue trend; not server error source of truth. |

## Events Not To Track As Product Analytics

- Raw password, token/header, invitation URL/code payload, reset link, database URL, IP address unless specific security audit policy requires separate protected storage.
- Full Student answer, submission file/content, feedback text, question media URL, personal email/fullName/phone.
- Keystroke, clipboard, screen recording, precise location or background device behavior.
- Failed authorization details that can reveal account/resource existence; security monitoring handles aggregated safe signal separately.
- Any event whose only purpose is surveillance and has no approved learning/product/operational question.

## Event Delivery And Deduplication

| Scenario | Handling |
| --- | --- |
| Backend transactional event | Emit/derive after successful commit; event ID tied to operation/resource version where possible. |
| Client retry/offline duplicate | Generate event ID, server/provider dedupe within retention window; do not count click retry twice. |
| Event provider down | Buffer/retry bounded or log loss metric; official business mutation still succeeds if transactional source committed. |
| Invalid schema/property | Reject/quarantine, count validation failure, do not break user flow unless request is abuse/security issue. |
| Clock skew | Store `occurredAt` and `receivedAt`; aggregate uses documented event time policy. |
| Schema migration | Accept old/new version during transition; update metric query and docs before deprecating old. |

## Implementation Responsibilities

| Layer | Responsibility |
| --- | --- |
| Frontend | Emit only approved UI engagement event; attach no secret/PII; handle failure silently/safely; do not block learning flow. |
| Backend | Emit/derive authoritative business event; validate actor/context; dedupe and log safe failure. |
| Analytics/Reporting service | Validate schema, store/aggregate according retention, expose aggregate only according permission. |
| QA | Verify event fires exactly once for key success path, property allowlist, no PII/secret, and event loss does not corrupt business record. |
| DevOps | Monitor ingestion/job failure/volume/cost; protect event destination credential/retention/access. |

## Event Governance

- New event requires product question, owner, schema/properties, privacy classification, retention, metric/report consumer and test case.
- Event removal/rename/property meaning change requires schema version/change note; dashboards must not silently compare incompatible periods.
- Review event volume/cost/noise periodically; remove unused events with retention/metric impact considered.

## Liên Kết

- Metric definitions: `metric-definitions.md`.
- Source/read model: `analytics-data-model.md`.
- Privacy/quality: `analytics-privacy-data-quality.md`.
