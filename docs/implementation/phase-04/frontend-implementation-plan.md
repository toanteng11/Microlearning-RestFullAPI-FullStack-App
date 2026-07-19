# Phase 04 Frontend Implementation Plan

## 1. UX Goal

Tạo trải nghiệm làm việc tập trung cho Teacher và luồng học rõ ràng cho Student. Các màn hình là công cụ vận hành, không phải landing page: cấu trúc dày vừa đủ, dễ scan, hành động nhất quán và không dùng card lồng card.

## 2. Route Map

### Teacher

| Route | Page | Permission |
| --- | --- | --- |
| `/teacher/classrooms/:classroomId` | Existing detail, thêm Stream/Classwork | `classroom.view_owned` |
| `/teacher/classrooms/:classroomId/courses/new` | Create Course | `course.create` |
| `/teacher/courses/:courseId` | Course Dashboard | `course.view_owned` |
| `/teacher/courses/:courseId/content` | Structure manager | `course.update_owned` |
| `/teacher/courses/:courseId/modules/new` | Create Module | `course.update_owned` |
| `/teacher/courses/:courseId/lessons/new` | Create Lesson | `lesson.manage_owned` |
| `/teacher/lessons/:lessonId/edit` | Lesson editor/Flashcards | `lesson.manage_owned` |
| `/teacher/lessons/:lessonId/preview` | Student-like preview | `lesson.manage_owned` |
| `/teacher/classrooms/:classroomId/stream` | Announcement manager | `announcement.manage_owned` |

### Student

| Route | Page | Permission |
| --- | --- | --- |
| `/student/dashboard` | Existing, thêm To-do summary | Student role |
| `/student/todo` | Lesson To-do | `learning.view_enrolled` |
| `/student/deadlines` | Deadline list/range | `learning.view_enrolled` |
| `/student/classrooms/:classroomId` | Stream/Classwork tabs | `learning.view_enrolled` |
| `/student/courses/:courseId` | Course structure/progress | `learning.view_enrolled` |
| `/student/lessons/:lessonId` | Lesson Player | `learning.view_enrolled` |

### Admin

| Route | Page | Permission |
| --- | --- | --- |
| `/admin/courses` | Governance Course list | `content.governance_view` |
| `/admin/courses/:courseId` | Read-only summary | `content.governance_view` |

## 3. Navigation Contract

- Global AppShell giữ role navigation hiện tại.
- Mọi nested page có breadcrumb semantic `nav[aria-label="Breadcrumb"]`.
- Form/detail có icon Back về parent route, không chỉ dựa browser history.
- Lesson Player dùng server `navigation.previous/next/back`.
- Previous/Next disabled giữ kích thước ổn định khi ở biên.
- Sau create Course redirect Course Dashboard; sau create Lesson redirect editor/detail theo explicit action.
- Deep link unauthorized vào `/forbidden` hoặc Not Found theo API semantics.

## 4. Teacher Classroom Detail

Tabs dự kiến:

1. `Stream`: Announcement list/create.
2. `Classwork`: Course list + create Course.
3. `People`: existing roster.
4. `Settings`: existing settings.

Tab route/query phải bookmarkable. Không reset tab vô cớ sau refresh.

### Course List

- Search, status filter, pagination.
- Row hiển thị title, status badge, Lesson count, nearest deadline, updated time.
- Primary command `Create Course`.
- Row menu cho edit/publish/unpublish/archive; icon có tooltip.
- Empty state chỉ có heading ngắn và action phù hợp, không mô tả marketing.

## 5. Course Dashboard

### Layout

- Compact header: Back, Course title, status, primary lifecycle action, overflow menu.
- Summary band: total/published/required Lessons, active Students, average progress.
- Tabs: `Content`, `Students`, `Progress`.
- Không tạo một card bao toàn bộ page hay card lồng nhau.

### Content Tab

- Hierarchical Module/Lesson rows.
- Drag handle hoặc keyboard reorder controls; fallback Move Up/Down menu.
- Status, required, deadline, estimated time và completion count.
- Create Module/Create Lesson commands.
- Conflict banner khi `structureRevision` stale; reload canonical structure.

### Students/Progress Tabs

- Search/filter/pagination.
- Default rank cao xuống thấp với explicit rank column.
- Progress bar có text percentage, không chỉ màu.
- Empty state phân biệt no enrollment và no required Lesson.
- Tooltip/label nói `Lesson completion`, không gọi là grade.

## 6. Course And Module Forms

### Fields

- Course: title, description.
- Module: title, description.
- Status không nằm trong create form; lifecycle command riêng.

### Behavior

- Client validation đồng bộ server constraints nhưng server là nguồn cuối.
- Save button disabled khi invalid/submitting; kích thước không đổi khi loading.
- API field errors gắn đúng input; summary error focusable.
- Cancel/Back khi dirty mở confirm dialog.
- Conflict `409` hiển thị compare message và Reload; không auto overwrite.

## 7. Lesson Editor

### Sections

1. Metadata: title, estimated minutes, required toggle, Module selection.
2. Content: Markdown editor + preview tabs.
3. Deadline: local date/time + timezone display.
4. Flashcards: ordered editor rows.
5. Lifecycle action bar.

### Controls

- Tabs/segmented control cho Edit/Preview.
- Numeric input/stepper cho estimated minutes.
- Toggle cho required.
- Calendar/time input cho deadline; confirm UTC conversion.
- Icon buttons với Lucide cho move/edit/archive, có accessible label/tooltip.
- Không dùng rounded text pill thay icon quen thuộc.

### Dirty State

- Track local dirty flag.
- Back/navigation/refresh khi dirty phải cảnh báo.
- Save thành công cập nhật `expectedUpdatedAt` từ server.
- Published/Scheduled editor ở read-only mode, giải thích bằng concise inline status; action `Unpublish to edit`.

### Markdown Preview

- Dùng renderer/sanitizer đã chọn; raw HTML off.
- Same presentation component dùng cho Teacher preview và Student Player.
- Long code/link/text wrap, không overflow mobile.

## 8. Deadline Dialog

- Hiển thị current deadline, new deadline, timezone.
- Khi Lesson published/scheduled, reason textarea bắt buộc và counter 10-500.
- Cảnh báo rõ nếu deadline mới ảnh hưởng trạng thái missing/late.
- Must UI không cho chọn deadline ngắn hơn current published deadline.
- Submit gửi `expectedDeadlineRevision`.
- Conflict mở message, refetch deadline/history và giữ draft reason để user review.
- Success toast và màn hình cập nhật từ response, không tự cộng revision.

## 9. Flashcard Editor And Viewer

### Teacher

- Add card command, front/back inputs, order controls, archive confirm.
- Stable row dimensions; validation text không đẩy toolbar chồng nhau.
- Max 100 active cards; UI hiển thị count.
- Published Lesson khóa Flashcard mutation.

### Student

- Card front/back flip bằng button semantic, keyboard Enter/Space.
- Previous/Next card controls và position `3 of 10`.
- Reduced motion preference được tôn trọng; không cần 3D effect.
- Flashcard viewer không tự complete Lesson.

## 10. Announcement Stream

### Teacher

- Composer compact, create draft/publish action.
- List newest first, filter status.
- Edit only draft/unpublished; lifecycle commands có confirm khi cần.

### Student

- Chỉ published/effective scheduled items.
- Author display name và published time.
- Paginated Load More hoặc page controls theo established pattern.
- Safe Markdown/link rendering.

## 11. Student To-do And Deadline View

### Dashboard Summary

- `Việc cần làm` hiển thị overdue trước, sau đó gần deadline.
- Mỗi row: Lesson title, Course/Classroom, due time, derived status, open action.
- Completed item rời active list sau successful completion/refetch.
- Label nhỏ nêu scope `Bài học` nếu cần tránh hiểu là đã có Quiz/Assignment.

### Full To-do

- Tabs/segmented control: All, Overdue, Upcoming.
- Classroom filter và pagination.
- Empty state riêng theo filter.
- API meta `activityTypes=[LESSON]` được typed; component thiết kế union-extensible.

### Deadline View

- P04 dùng list/range view, không cần calendar grid phức tạp.
- Date range control max 366 ngày.
- Group theo ngày nhưng sort dựa UTC/server response.

## 12. Lesson Player

- First viewport có breadcrumb, Lesson title, estimated time, deadline/status.
- Nội dung full-width constrained reading column, không đặt trong decorative card.
- Flashcards/resources nằm sau Lesson content.
- Footer navigation có Back, Previous, Next và Complete Lesson.
- Complete button có pending/success/error states; retry idempotent.
- Sau complete, UI giữ trang để Student review và cập nhật progress; không tự nhảy bất ngờ.
- Mobile controls wrap hợp lý, không overlap fixed footer/content.

## 13. Shared Client Architecture

- Typed API modules theo feature, dùng common `api-client`.
- Query state có abort/cancel khi route đổi; tránh stale response overwrite.
- Không thêm state library mới nếu React context/hooks hiện có đủ.
- Form state local; server state re-fetch/invalidate có helper rõ.
- Error mapping theo common `ApiError`; field errors và global errors tách.
- Date formatter tập trung và luôn nhận ISO UTC.

## 14. UI State Matrix

Mỗi critical page/component phải có:

| State | Expected UI |
| --- | --- |
| Loading | Stable skeleton/inline spinner, no layout shift |
| Empty | Correct actor/filter-specific action |
| Error | Concise message + retry/back |
| Forbidden | Standard forbidden route/message |
| Not Found | Standard not found, no leaked title |
| Conflict | Explain stale data + reload action |
| Submitting | Disable duplicate action, preserve label width |
| Success | Updated server state + accessible status/toast |
| Archived/Unpublished | Read-only/visibility badge đúng |

## 15. Accessibility Requirements

- Logical heading hierarchy và landmarks.
- Form input có label, description/error linked bằng ARIA.
- Modal focus trap, initial focus, Escape/close, focus return.
- Reorder có keyboard alternative; drag-and-drop không là cách duy nhất.
- Status không chỉ dùng màu; text/icon semantic.
- Focus visible trên toàn bộ icon buttons/links/tabs.
- Screen reader announcement cho save/complete/error.
- Test với keyboard ở 390x844 và desktop 1440x900.

## 16. Responsive And Visual QA

- Course structure dùng grid/list responsive; không ép table tràn mobile.
- Long title/URL wrap và không làm action controls rời viewport.
- Fixed-format buttons/counters có min dimensions.
- Không scale font theo viewport width.
- Cards chỉ dùng cho repeated item/tool thật, radius tối đa 8px theo guidance.
- Review screenshots: Teacher Course, Lesson Editor, Student To-do, Lesson Player, Admin Course ở desktop/mobile.

## 17. Frontend Test Plan

- Route/RoleRoute/permission tests.
- Form validation, dirty navigation và 409 conflict tests.
- Lifecycle action visibility tests.
- Reorder keyboard and server canonical update tests.
- Markdown XSS rendering tests.
- Deadline timezone/reason tests.
- Lesson Player navigation/completion retry tests.
- To-do derived status/empty/error/pagination tests.
- Course Dashboard rank/label tests.
- Browser E2E full journey và visual overlap checks.

## 18. Frontend Definition Of Done

- Mọi Must API có user-facing surface hoặc được ghi rõ system/internal.
- Không placeholder cho Quiz/Assignment/Grade.
- Loading/empty/error/conflict/forbidden/success states hoàn chỉnh.
- Back/Previous/Next/breadcrumb hoạt động qua deep link và refresh.
- Keyboard/accessibility critical flow pass.
- Desktop/mobile visual review không overlap/overflow.
- Component tests và integrated browser E2E pass.
