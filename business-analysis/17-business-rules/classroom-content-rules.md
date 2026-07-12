# Classroom And Content Rules

## Mục Đích

Tài liệu này đặc tả lifecycle và quyền quản lý của Classroom, Course, Module, Lesson, Material/Resource, Quiz, Assignment, Announcement và Question Media. Mục tiêu là Teacher có quyền sáng tạo nội dung trong lớp mình nhưng nội dung đã học/nộp không bị thay đổi hoặc xóa làm mất lịch sử Student.

## Rule Coverage

| Rule ID | Nội dung |
| --- | --- |
| BR-008, BR-016 | Teacher là content actor chính; Teacher active tạo Classroom. |
| BR-025, BR-031, BR-032 | File/media policy và Question Media optional. |
| BR-033 | Teacher Course Detail Dashboard context. |
| BR-058 đến BR-068 | Lifecycle, publish, visibility, order, deletion/history, media. |

## Content Ownership And Scope

| Actor | Được phép | Điều kiện |
| --- | --- | --- |
| Teacher | Tạo/update/reorder/publish/unpublish/archive content trong Classroom/Course owned/authorized. | `TEACHER`, `ACTIVE`, owner hoặc explicit management permission. |
| Student | Xem/complete/attempt/submit published/assigned content trong Enrollment active. | Không tạo/sửa content source; chỉ tạo data học tập của chính mình. |
| Admin | Governance view/archive/ownership support khi permission cho phép. | Không là content author/grader mặc định; override phải audit. |
| Super Admin | Sensitive override theo permission. | Không vượt privacy/security/data rule. |

Teacher role đơn thuần không cho phép cập nhật Course ID bất kỳ. Service phải resolve Classroom/Course ownership trước khi tạo, đọc detail, update, reorder, publish hoặc archive content.

## Content Lifecycle

| Status | Teacher behavior | Student visibility | Mutation rule |
| --- | --- | --- | --- |
| `DRAFT` | Tạo/sửa/reorder nội dung. | Không thấy như activity học. | Có thể edit/delete nếu chưa có linked learning record. |
| `SCHEDULED` nếu hỗ trợ | Nội dung đã cấu hình thời điểm publish. | Chưa thấy trước publish time. | Teacher chỉnh schedule khi đủ quyền; schedule change audit nếu policy yêu cầu. |
| `PUBLISHED` | Nội dung available theo Course/Classroom/enrollment policy. | Student scope hợp lệ thấy/học/nộp. | Critical change sau activity phải theo protected-change rule. |
| `UNPUBLISHED` | Dừng availability mới. | Không mở như activity mới; lịch sử Student theo policy vẫn đọc. | Không xóa linked record. |
| `ARCHIVED` | Nội dung/Course kết thúc hoặc giữ lịch sử. | Không tạo activity/submission mới; historical visibility theo policy. | Restore/authorized override trước mutation mới. |

## Publish Decision

```text
Teacher authorized in Course/Classroom?
  -> Classroom/Course active and not archived?
      -> Content type required fields valid?
          -> Required dependency exists (Question, submission policy, media reference)?
              -> Deadline/availability rule valid?
                  -> Persist PUBLISHED + visibility data + audit/event
```

| Content type | Minimum publish conditions |
| --- | --- |
| Course | Title/classroom/owner/status valid; Classroom active; structure can initially be empty if product policy permits. |
| Module | Title and Course scope valid; `displayOrder` valid. |
| Lesson | Title/content/completion policy valid; `completionDeadline` required when published/assigned by MVP policy. |
| Required Material/Resource | Resource metadata/type/access valid; if it appears as actionable To-do, completion/deadline policy is explicit. |
| Quiz | Title/settings valid; at least one valid Question; each choice question has allowed options/correct answer. |
| Assignment | Title/instruction/max score/submission policy valid; due date and late/resubmit policy explicit before publish. |
| Announcement | Classroom scope, message content and attachment policy valid. |

Validation message must not be bypassed by direct API call. Failed publish creates no partial Student visibility/To-do/notification; it remains draft or returns domain error.

## Visibility Rules

- Student only sees Content when Classroom and Enrollment are active, Content is published/available, and Student satisfies assigned/visibility rule.
- A direct URL, cached response, object-storage link or browser history cannot bypass `DRAFT`, `UNPUBLISHED`, `ARCHIVED`, enrollment or ownership control.
- Announcements, Resources and Question Media inherit access from their Classroom/Course/Quiz. They are not public merely because a URL exists.
- When Classroom is locked/archived, Student does not get new content/attempt/submission rights; historical views follow Classroom status and retention policy.
- A Teacher can preview own draft content without making it visible to Student. Preview does not create Student progress or analytics completion.

## Ordering And Navigation Rules

| Subject | Rule |
| --- | --- |
| Module order | `displayOrder` is Teacher-controlled and stable within Course. |
| Activity order | Activities order within Module/Course is explicit; tie-break by safe persisted creation/order key. |
| Previous/Next | Only navigate to activity visible in same Course scope; do not leak hidden/draft/other Course item. |
| Reorder | Reorder is authorized Teacher action; normalize unique/contiguous order safely, without changing historical completion identity. |
| Course Dashboard | Teacher opens owned Course and sees activity list, Student list, ranking and deadline context as BR-033. |
| Student return context | Opening activity from To-do/Calendar preserves parent return context safely; context cannot grant extra access. |

## Protected Content Change Rules

| Change after Student activity exists | Default behavior | Why |
| --- | --- | --- |
| Edit wording/format non-semantic | Allowed with update history/time according policy. | Does not change correct result/score requirement. |
| Change correct answer, question type, points, max score | Require confirmation and impact/regrade policy; preserve old attempt/grade evidence. | Prevent silent score rewrite. |
| Change required flag/completion rule | Require progress/To-do/course completion recalculation and communication review. | Affects Student obligations/outcome. |
| Change deadline | Use BR-075 to BR-080: reason/history/recalculation/audit. | Fairness and traceability. |
| Unpublish/archive | Stop future access/mutation, preserve history. | Avoid data loss. |
| Delete content with linked Progress/Attempt/Submission/Grade | Deny hard delete; archive/unpublish/version instead. | Referential integrity/learning record. |

Any protected change that affects score/progress/deadline must produce a traceable event/audit record and trigger only the recalculation required by its business impact.

## File And Media Rules

| Area | Rule |
| --- | --- |
| Upload authorization | Teacher/Student must have rights to target resource before upload metadata/object is accepted. |
| Type/size | Validate allowed MIME/type, file size, extension policy and declared purpose at backend. |
| Object access | Private by default; authorized reader rechecked when view/download URL is requested. |
| Question media | Image/video is optional. A Question remains valid without media if text/answer/scoring validation passes. |
| Media relation | Media belongs to correct Question/Quiz/Course; cannot be attached by another Teacher or reused cross-scope without permission. |
| Orphan cleanup | Cleanup must check reference/age/owner and never remove an object still referenced by learning record. |
| File failure | Storage failure does not create a published resource/media record claiming successful upload. |

## Content Archive And Restore

- Archive Classroom/Course/content rather than hard delete when learning data/audit exists.
- Archive stops new Student progress/attempt/submission and normal Teacher mutation, except authorized governance/restore action.
- Restore reopens only the resource status specified by authorized actor; it does not automatically change old deadlines, grades, enrollment or Course completion.
- If archived content is restored, Teacher must review visibility/deadline/late policy before publishing new work to Student.

## Audit Rules

Create/publish/unpublish/archive, protected score/required/deadline change, ownership transfer, media access exception and Admin override are auditable actions according BR-101. Audit metadata includes actor/action/resource/time/old-new safe value/reason when required, never raw file content or secret.

## QA Checklist

- Teacher A cannot publish/edit/archive/reorder Teacher B Course through API.
- Student cannot view draft/unpublished/archived new activity via URL/cache/file URL.
- Publish rejects missing required fields, missing Quiz Question or missing required Lesson deadline.
- Protected Question/points/required/deadline change preserves attempts/submissions/history and triggers expected recalculation/audit.
- File/media upload/view is denied outside resource scope and invalid type/size; Question without media remains valid.
- Archive/restore does not hard delete historical learning record.

## Liên Kết

- Data validation: `../10-data-requirements/data-validation-rules.md`.
- UI content/deadline/media: `../12-ui-ux-requirements/lesson-deadline-management.md`, `../12-ui-ux-requirements/quiz-question-media.md`.
- Learning impact: `learning-progress-deadline-rules.md`, `assessment-grading-rules.md`.
