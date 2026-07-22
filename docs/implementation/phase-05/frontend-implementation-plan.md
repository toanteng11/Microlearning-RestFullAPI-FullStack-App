# Phase 05 Frontend Implementation Plan

## 1. UX Principle

- Work-focused LMS UI, dense but scannable.
- Status/action always explains why enabled/disabled.
- Never calculate authoritative score/deadline/status in React.
- Back/breadcrumb/return context required on deep flow.
- Unsaved Quiz answer/Assignment draft warning where data may be lost.
- No “coming soon” upload control presented as working capability.

File/component placement canonical nằm trong `source-file-blueprint.md`; mapping đầy đủ endpoint -> screen/action/state nằm trong `api-ui-integration-matrix.md`; component/E2E case IDs nằm trong `test-case-catalog.md`.

## 2. Proposed Routes

### Teacher

| Route | Screen |
| --- | --- |
| `/teacher/courses/:courseId/assessments` | Quiz/Assignment activity list |
| `/teacher/courses/:courseId/quizzes/new` | Quiz create |
| `/teacher/quizzes/:quizId/edit` | Quiz Builder |
| `/teacher/quizzes/:quizId/preview` | Student-like preview |
| `/teacher/quizzes/:quizId/results` | Result summary/table |
| `/teacher/quiz-attempts/:attemptId/review` | Manual review/regrade |
| `/teacher/courses/:courseId/assignments/new` | Assignment create |
| `/teacher/assignments/:assignmentId/edit` | Assignment editor |
| `/teacher/assignments/:assignmentId/submissions` | Submission roster |
| `/teacher/submissions/:submissionId` | Submission grading detail |
| `/teacher/activities/:type/:id/deadlines` | Deadline exception management |
| `/teacher/courses/:courseId/gradebook` | Conditional basic Gradebook |

### Student

| Route | Screen |
| --- | --- |
| `/student/quizzes/:quizId` | Quiz intro |
| `/student/quiz-attempts/:attemptId` | Quiz player |
| `/student/quiz-attempts/:attemptId/result` | Own result |
| `/student/assignments/:assignmentId` | Assignment detail/submission |
| `/student/grades` | Own Grade list |
| `/student/grades/:gradeId` | Own Grade/Feedback detail |

Existing Classwork/To-do/Deadline/Course routes thêm mixed activities, không tạo duplicate navigation shell.

## 3. Teacher Quiz Builder

### Layout

- Header: Back, breadcrumb, title, lifecycle badge, Save/Preview/Publish actions.
- Settings section: instruction, required, availability, due, attempts, time, result policy.
- Question list unframed; each repeated Question may be card <= 8px radius.
- Question toolbar dùng icon buttons cho move up/down, duplicate nếu future, archive; tooltip đầy đủ.
- Add Question command rõ, type menu.

### Question Editor

- Prompt textarea/editor.
- Segmented/menu Question type.
- Numeric points input with min/max.
- Options list với text, correct checkbox/radio và stable controls.
- Short answer rubric private panel, label rõ “Student không thấy”.
- Optional media section chỉ render khi feature enabled; swatch/preview/fallback/Remove.
- Validation inline và summary khi publish.

### States

- Loading skeleton không shift layout.
- Empty Questions có primary Add Question.
- Save pending/success/error/conflict.
- Publish blocked hiển thị prerequisite cụ thể.
- Unsaved navigation confirm cho Back, route change, refresh.
- Published lock hướng dẫn unpublish trước khi sửa scoring content.

## 4. Student Quiz Intro

- Title/instruction.
- Attempts used/remaining.
- Time limit, effective deadline và exception indicator.
- Result visibility policy bằng nội dung dễ hiểu.
- Active attempt resume action ưu tiên hơn start mới.
- Disabled start có lý do: not available/due passed/limit reached/unpublished.

## 5. Student Quiz Player

- Stable header: progress `x/y`, countdown từ server expiry, Save state.
- One question per page hoặc compact list; baseline chọn one-at-a-time để mobile rõ.
- Previous/Next icon+text; fixed dimensions tránh shift.
- Question type controls semantic radio/checkbox/textarea.
- Optional media không che prompt/options; error fallback text.
- Answer save debounced/manual with server acknowledgement; no false “Saved” before success.
- Submit review shows unanswered count and finality.
- Expiry from API overrides client timer; player transitions to reconciled result state.
- Keyboard: tab order, arrow/radio native behavior, focus after Next.

## 6. Quiz Result And Teacher Results

### Student

- Pending review state without fake zero final score.
- Released score/max score/status/feedback.
- No correct answer key by default.
- Return to Course/To-do.

### Teacher

- Summary metrics and paginated result table.
- Search/filter status.
- Needs Review prominent but not decorative.
- Student row action opens attempt review.
- Score sort uses backend query.

## 7. Assignment Editor

- Title/instruction/max score/due date/timezone.
- Submission methods as checkboxes/toggles.
- Late/unsubmit/resubmit switches with explanatory labels.
- FILE option absent or disabled with truthful “Chưa bật lưu trữ tệp”, not clickable fake.
- Preview, publish prerequisite, conflict and unsaved warning.

## 8. Student Assignment Detail

- Instruction, max score, default/effective deadline, status.
- Render only enabled submission controls.
- Draft save state with revision conflict recovery.
- Turn In as clear primary command with confirmation.
- Unsubmit/resubmit only when API `allowedActions` includes them.
- Late/missing/closed reason explicit.
- Returned Grade/Feedback in own context only.
- No client-only state transition after failed API.

## 9. Submission Roster And Grading

### Roster

- Columns: Student, derived status, effective due, submittedAt, grade/result, action.
- Search/status filter/server pagination.
- Default status priority and stable sort displayed.
- Empty state distinguishes no roster vs no matching filter.
- No nested cards; table/list responsive conversion on mobile.

### Grading Detail

- Back preserves filter/page context.
- Student/submission revision/effective due/content.
- Score numeric input constrained by max score.
- Feedback field with privacy label.
- Save Grade and Return Work are separate commands.
- Return disabled with visible requirement until Grade valid/saved.
- Regrade requires reason and confirmation.
- Revision conflict offers reload, does not discard local feedback silently.

## 10. Deadline Exception UI

- Current default/effective deadline.
- Student selector constrained to active roster or context preselected.
- New deadline and timezone.
- Mandatory reason with minimum counter.
- Preview affected derived status.
- Normal Teacher cannot choose shortening/past values; API remains authority.
- History table paginated.
- Confirmation states Student, activity, old/new deadline.

## 11. Own Grades

- Filters Classroom/Course/type.
- Only returned items from API.
- Score/max score, activity, returned date, feedback availability.
- Empty/loading/error states.
- Deep link denial never exposes other Student identity.

## 12. Cross-Feature Integration

- Classwork activity badge icons for Lesson/Quiz/Assignment.
- To-do action routes by `actionUrl`, not frontend string guessing.
- Deadline filter supports types from server contract.
- Completion refresh/invalidate after attempt submit, turn-in, unsubmit.
- Teacher Dashboard consumes versioned summary, does not recompute ranking.
- Existing Admin Course governance hiển thị Quiz/Assignment counts/status metadata; không thêm link tới private attempt/submission/grade detail.

## 13. State Management

- Reuse `useAuth().request` và page-local state pattern đang chạy ở Phase 04; P05 không đưa thêm React Query/data-fetching library mới.
- Mỗi page/hook giữ key truy vấn bằng dependency rõ: actor scope, resource ID, filter và page; `useEffect` phải có cancellation guard như các learning pages hiện tại.
- Sau mutation, dùng DTO response làm canonical state rồi refetch đúng read model bị ảnh hưởng; không giả lập cache invalidation của thư viện chưa được dùng.
- Quiz autosave giữ state machine cục bộ `IDLE -> DIRTY -> SAVING -> SAVED|ERROR|CONFLICT`, chỉ một request save đang chạy và luôn cập nhật server revision từ response.
- Draft form local state separated from server returned state.
- Do not cache correct answer in global/shared persistent storage.
- No attempt/submission private data in localStorage.

## 14. Error Mapping

Map stable API code to Vietnamese actionable message:

- Attempt expired/limit/finalized.
- Assignment closed/late disabled/method invalid.
- Revision conflict.
- Grade evidence changed.
- Deadline shortening denied.
- Feature not enabled.
- Generic safe fallback includes request ID when useful.

## 15. Responsive And Accessibility

- Verify desktop 1440x900, tablet 768x1024, mobile 390x844.
- No horizontal page overflow; wide table uses responsive pattern/controlled scroll with headers.
- Visible focus, labels, error association and `aria-live` for save/result state.
- Timer not color-only and announces only meaningful thresholds, not every second.
- Modal focus trap/escape/cancel; important submit/return explicit.
- Media alt/fallback.
- Reduced motion respected.
- Buttons retain stable dimensions when loading.

## 16. Component/Test Plan

- Builder question validation and reorder.
- Intro disabled reasons/resume.
- Quiz answer controls/save/expiry/submit review.
- Assignment method/policy-driven controls.
- Submission status filters and return context.
- Grade draft vs returned rendering.
- Deadline reason/button enable logic.
- API error mapping/conflict recovery.
- Route guards role/deep-link.

## 17. Frontend Definition Of Done

- No mock API in production path.
- Every Must endpoint integrated to screen/action.
- Loading/empty/error/forbidden/conflict/expired states implemented.
- Responsive/accessibility browser assertions Pass.
- No secret answer/private foreign data in DOM/network fixture.
- P04 screens regression Pass.
