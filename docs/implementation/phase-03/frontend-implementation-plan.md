# Phase 03 Frontend Implementation Plan

## 1. UX Objective

Teacher tạo và vận hành Classroom nhanh; Student join trong ít thao tác nhưng luôn hiểu trạng thái; Admin thấy policy/governance rõ. UI dùng API thật, giữ navigation context và không để raw token/code tồn tại lâu hơn cần thiết.

## 2. Route Map

| Route                                       | Actor            | Page                                                                            |
| ------------------------------------------- | ---------------- | ------------------------------------------------------------------------------- |
| `/teacher/dashboard`                        | Teacher          | Owned Classroom list/empty/create action                                        |
| `/teacher/classrooms/new`                   | Teacher          | Create Classroom                                                                |
| `/teacher/classrooms/:classroomId`          | Teacher owner    | Classroom overview                                                              |
| `/teacher/classrooms/:classroomId/settings` | Teacher owner    | Metadata, join methods, credentials, enrollment status                          |
| `/teacher/classrooms/:classroomId/roster`   | Teacher owner    | Student roster                                                                  |
| `/student/dashboard`                        | Student          | Enrolled Classroom list + Join action                                           |
| `/join/code`                                | Student          | Join by Class Code                                                              |
| `/join/invite#token=...`                    | Guest/Student    | Shareable link; fragment không tới server, React capture/clean rồi preview/join |
| `/join/invite`                              | Guest/Student    | Clean invite workflow route sau capture                                         |
| `/student/classrooms`                       | Student          | Paginated enrolled list                                                         |
| `/student/classrooms/:classroomId`          | Enrolled Student | Classroom overview                                                              |
| `/admin/settings/enrollment`                | Admin            | Global Enrollment Policy                                                        |
| `/admin/classroom-governance`               | Admin            | Classroom governance list                                                       |
| `/admin/classroom-governance/:classroomId`  | Admin            | Governance detail                                                               |

## 3. Information Architecture

### Teacher Classroom

Header gồm Classroom name/status và action menu. P03 navigation chỉ hiển thị capability thật:

- Overview
- People
- Settings

Stream/Classwork/Grades được thêm khi Phase 04/05 có implementation; không tạo tab giả hoặc mô tả “coming soon”.

### Student Classroom

- Classroom summary, Teacher, subject/section, membership joined date/method.
- Back về Student Classroom list/dashboard giữ query context.
- Không hiển thị content giả.

## 4. Data And State Architecture

- Typed feature API adapters trên shared `api-client`.
- Query keys có actor/resource rõ: `['classrooms','teacher',query]`, `['classroom',id]`, `['roster',id,query]`.
- Mutation success invalidate đúng list/detail/roster; logout/account rejection clear toàn bộ private cache.
- URL query giữ page/filter/sort để Back/Forward hoạt động.
- Form state dùng schema chia sẻ shape nhưng backend vẫn validate authority.

Không thêm state library toàn cục nếu React Query/context hiện tại đủ.

## 5. Teacher Pages

### Dashboard/List

- Cards hoặc compact list, không nested cards.
- Search/status filter/sort/pagination.
- Empty state có primary create action.
- Archived/locked badge rõ, không chỉ dựa màu.
- Create button dùng icon + label; menu action dùng Lucide icons và tooltip khi cần.

### Create Classroom

Fields: name required, description, subject, section. States:

- pristine/dirty
- client validation
- submitting disabled
- API validation/conflict/error
- success redirect detail/settings
- navigation warning khi dirty

Không có owner/status/join code input.

### Settings

- Metadata section.
- Enrollment status segmented control.
- Toggle Class Code/Invite Link theo configured/effective policy.
- Khi global policy off, control disabled với trạng thái policy; Teacher không thể override.
- Class Code metadata + regenerate/disable confirm; raw code modal chỉ sau create/regenerate, copy feedback và warning one-time.
- Invite Link metadata + create/regenerate/disable; raw link copy one-time.
- Archive action trong danger area với confirm name/reason.
- Interaction mode control chỉ hiển thị nếu Conditional Should được phê duyệt và API/OpenAPI contract đã bổ sung field tương ứng.

### Roster

- Search, membership/account status filters, sort, pagination.
- Desktop table; mobile list rows/cards không overflow.
- Student row: safe identity + joined date/method/status + action menu.
- Remove confirm yêu cầu reason; optimistic removal không dùng vì transaction có thể fail.
- Loading skeleton, empty Classroom, empty filter, error/retry, forbidden, stale update states.

## 6. Student Join

### Join By Code

- Single input với label; auto uppercase/format display nhưng gửi normalized-compatible value.
- Submit disabled khi invalid/loading.
- Invalid/disabled/closed/archived/rate errors có message/action rõ nhưng không lộ internal state.
- Already enrolled hiển thị success và nút Open Classroom.
- Success redirect Classroom detail.

### Invite Link

1. Component đọc token từ URL fragment.
2. Xóa token bằng `replaceState` trước logging/analytics/other navigation.
3. Preview API; render loading/invalid/expired/joinable.
4. Anonymous user chọn Login/Register; join context được giữ bounded.
5. Sau auth, gọi preview lại; Student xác nhận Join.
6. Success xóa context và redirect.

Teacher/Admin đăng nhập mở Student invite link thấy message wrong role; không đổi account/Enrollment.

### Join Context

- Shape: method, ephemeral token hoặc safe intent, createdAt, returnPath.
- TTL ngắn tối đa 30 phút cho client context; backend token expiry vẫn authority.
- Clear on success, cancel, logout, malformed/expired.
- Không đưa token vào query string Login/Register, analytics hoặc console.

## 7. Student Classroom List/Detail

- Dashboard và `/student/classrooms` lấy role-scoped API.
- Join action luôn sẵn trong header/empty state.
- List pagination/sort; empty state phân biệt chưa join và load error.
- Detail 403/404/removed state rõ; Back về đúng query.

## 8. Admin Pages

### Enrollment Policy

- Hai toggles Class Code/Invite Link.
- Numeric input Invite TTL nếu scope approved.
- Save yêu cầu reason; hiển thị revision/updatedAt safe.
- Stale revision conflict tải lại và yêu cầu review, không overwrite.

### Classroom Governance

- List search/status/owner filter/pagination.
- Columns/cards: name, owner, status, enrollment status, member count, updatedAt.
- Detail read-only Must; lock/transfer action chỉ hiển thị khi Should permission/implementation tồn tại.

## 9. Navigation Requirements

- Tái sử dụng AppShell Back/Forward.
- Breadcrumb: workspace -> Classroom -> current page.
- Browser Back/Forward phục hồi query state.
- Không dùng `navigate(-1)` làm đường duy nhất khi deep link; có fallback route rõ.
- Action success không phá history bằng redirect vòng lặp.

## 10. Responsive And Accessibility

- Mobile width 320px trở lên không horizontal document overflow.
- Stable control dimensions; button text wrap/dynamic layout đúng.
- Native label/input, field error qua `aria-describedby`.
- Dialog focus trap, Escape/cancel, restore focus.
- Status không truyền đạt chỉ bằng màu.
- Copy feedback dùng visible status/live region, không alert blocking.
- Keyboard có thể thao tác tabs/menu/pagination/forms.

## 11. Frontend Security

- Route guards chỉ hỗ trợ UX; API vẫn authority.
- Raw invite token xóa khỏi URL trước network preview.
- Không persist access token/credential trong localStorage.
- Không log API body/response credential.
- 401 dùng auth refresh flow hiện có; 403 hiển thị Forbidden; 404 dùng safe not-found.
- One-time code/link state không cache trong React Query lâu dài.

## 12. Component/Test Matrix

| Component/Page      | Required tests                                                   |
| ------------------- | ---------------------------------------------------------------- |
| Teacher list/create | loading/empty/error/validation/success/dirty navigation          |
| Settings            | global override, copy, regenerate/disable confirm, stale update  |
| Roster              | pagination/filter/empty/remove success/failure/forbidden         |
| Join Code           | normalization, invalid, rate, duplicate, success                 |
| Invite Join         | URL cleanup, anonymous context, revalidation, wrong role, expiry |
| Student list/detail | enrolled scope, empty, removed/forbidden                         |
| Admin policy        | load/update/revision conflict/permission                         |
| Governance          | pagination/filter/detail/forbidden                               |

## 13. Frontend Definition Of Done

- API thật, không MSW/mock ở Production path.
- Loading/empty/error/forbidden/success/stale states.
- Route/auth/object errors đúng.
- Responsive/accessibility/browser navigation review pass.
- No token/code in URL/storage/console after required capture.
- Component tests + Playwright critical journeys pass.
