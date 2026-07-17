# Phase 02 Frontend Implementation Plan

## 1. Mục tiêu

Xây dựng React UI cho register/login/session restore/profile, role workspace, Admin user management và Teacher Invitation bằng API thật. Trải nghiệm phải có loading, empty, error, forbidden, success và thao tác quay lại phù hợp.

## 2. Dependency Dự Kiến

| Package | Mục đích |
| --- | --- |
| `@tanstack/react-query` | Server state/cache/invalidation |
| `react-hook-form` | Form state/submission |
| `@hookform/resolvers` + `zod` | Shared client validation shape |
| `lucide-react` | Icon trong button/navigation |
| `msw` (dev) | Component/integration API mocking theo contract |

Không thêm Redux/Zustand trong P02. Auth/access token nằm trong AuthProvider memory, server data ở Query Client.

## 3. Route Catalog P02

| Route | Access | Page | Outcome |
| --- | --- | --- | --- |
| `/login` | Public/anonymous preferred | LoginPage | Login và role redirect |
| `/register` | Public/anonymous preferred | RegisterPage | Student create -> Login |
| `/teacher/invite` | Public | TeacherInvitationPage | Preview/accept token query |
| `/profile` | Any ACTIVE user | ProfilePage | View/update own profile |
| `/student/dashboard` | STUDENT | StudentHomePage | P02 role shell/next action |
| `/teacher/dashboard` | TEACHER | TeacherHomePage | P02 role shell/next action |
| `/admin/dashboard` | ADMIN/SUPER_ADMIN | AdminHomePage | Navigation to users/invitations |
| `/admin/users` | Admin permission | UserManagementPage | Entry, không tải all users |
| `/admin/users/students` | `user.view_students` | StudentListPage | Student-only list |
| `/admin/users/teachers` | `user.view_teachers` | TeacherListPage | Teacher-only list |
| `/admin/users/admins` | `user.view_admins` | AdminListPage | Admin/Super Admin list |
| `/admin/users/:userId` | target view permission | UserDetailPage | Role-aware detail/actions |
| `/admin/teacher-invitations` | invitation permissions | TeacherInvitationManagementPage | Create/copy/list/revoke |
| `/forbidden` | Public | ForbiddenPage | Safe denial + back dashboard |

Forgot/reset routes chỉ thêm khi conditional Should được phê duyệt.

## 4. AuthProvider State Machine

```text
BOOTSTRAPPING -> AUTHENTICATED
              -> ANONYMOUS
AUTHENTICATED -> REFRESHING -> AUTHENTICATED
                            -> ANONYMOUS
AUTHENTICATED -> LOGGING_OUT -> ANONYMOUS
```

State tối thiểu:

- `status`: bootstrapping/authenticated/anonymous/refreshing.
- `accessToken`: memory only.
- `user`: safe current-user DTO.
- `login`, `refresh`, `logout`, `hasPermission` methods.
- Single-flight refresh promise.

Khi logout/account disabled/refresh fail, xóa toàn bộ private Query Cache để user sau không thấy dữ liệu user trước.

## 5. API Client Rules

- Base URL từ `VITE_API_BASE_URL`, không hard-code Production.
- `credentials: include` chỉ cho auth cookie flow cần thiết; bearer set từ memory.
- Parse success/error envelope một lần.
- 401: single refresh + retry một lần; 403 không refresh loop.
- `REFRESH_RACE_RETRY`: chờ cross-tab signal hoặc jitter 100-300 ms rồi refresh lại đúng một lần; không logout hoặc revoke giả.
- Field error map từ `error.details` vào React Hook Form.
- Request abort khi component/query bị hủy.
- Không console log request body/auth headers.

## 6. Page Details

### LoginPage

- Email/password, show/hide icon, submit loading.
- Generic invalid credential; account unavailable message không lộ thêm detail.
- Link Register; Forgot Password chỉ hiển thị khi capability được triển khai.
- Sau login, chỉ dùng role từ response/current user để redirect.
- `returnUrl` chỉ nhận internal route và phải tương thích role; không open redirect.

### RegisterPage

- fullName/email/password/confirmPassword.
- Hiển thị password rule 12-128 và không khoảng trắng đầu/cuối.
- Không có role/status selector.
- Success chuyển Login với notification; không coi user authenticated.
- Preserve safe future join context nhưng P03 mới dùng join.

### TeacherInvitationPage

- Đọc token query một lần, không log; lưu trong memory rồi xóa token khỏi address bar bằng safe history replace trước khi POST token trong body tới preview API.
- Preview loading/expired/revoked/accepted/error states.
- Form fullName, email, password, confirm; email prefill nhưng vẫn validate exact normalized match.
- Success chuyển Login; không tự tạo session.

### ProfilePage

- Hiển thị fullName/email/role/status; email/role/status read-only.
- Chỉ submit allowlisted editable fields.
- Save feedback và refetch current user.

### Admin User Lists

- URL query là source cho page/limit/keyword/status/sort.
- Search debounce hợp lý; đổi filter reset page 1.
- Table desktop, card list mobile; status bằng text + badge.
- Loading skeleton, initial empty, filter empty, error/retry.
- Row action derive từ capabilities nhưng backend quyết định cuối.
- Back từ detail giữ nguyên query/list context.

### Teacher Invitation Management

- Create form email + expiry.
- Sau create hiển thị one-time link panel với Copy icon/button và cảnh báo copy ngay.
- Copy dùng Clipboard API; fallback chọn text. Sau clipboard success, POST copy event với UUID `eventId`; chỉ hiện success hoàn chỉnh khi audit được ghi, nếu audit lỗi hiển thị cảnh báo link đã copy và action retry audit.
- Danh sách chỉ có metadata/status; không có nút “xem lại link”.
- Revoke confirm dialog + reason; invalidate list/detail.

## 7. Shared Components P02

| Component | Requirement |
| --- | --- |
| `AppShell` | Role navigation, profile menu, logout |
| `ProtectedRoute` | Wait bootstrap, redirect anonymous, preserve safe returnUrl |
| `RoleRoute` | Role/permission check, render Forbidden |
| `FormField`/`PasswordField` | Label, error, accessibility, show/hide icon |
| `DataTable`/`Pagination` | Stable dimensions, keyboard/accessibility, URL state |
| `StatusBadge` | Text + color, enum-safe |
| `ConfirmDialog` | Focus trap, destructive warning, reason when required |
| `EmptyState`/`ErrorState`/`LoadingSkeleton` | Consistent behavior |
| `CopyLinkControl` | Familiar copy icon, tooltip, one-time link warning |

## 8. Accessibility And Responsive

- Form label liên kết input; error dùng `aria-describedby`; focus field đầu tiên có lỗi.
- Dialog focus management và Escape behavior.
- Icon-only actions có accessible name/tooltip.
- Table không tràn viewport; mobile chuyển card list hoặc controlled horizontal region.
- Keyboard có thể Login, Copy, Filter, Paginate, Confirm/Cancel.
- Không dùng chỉ màu để phân biệt account/invitation status.
- Không để loading text hoặc long email làm thay đổi kích thước button/table bất thường.

## 9. Frontend Tests

- AuthProvider bootstrap success/fail, single-flight refresh và logout cache clear.
- Hai tab bootstrap/401 đồng thời chỉ có một refresh owner; race grace không revoke family; access token chỉ truyền ephemeral qua BroadcastChannel.
- ProtectedRoute/RoleRoute anonymous/wrong role/allowed role.
- Register validation, privilege fields không tồn tại, success redirect.
- Login generic error và role redirect.
- Invitation state variants, copy feedback, no-link-after-list behavior.
- User list URL filters, role-separated response rendering, pagination/empty/error.
- Status/role confirm and API error mapping.
- Browser test bảo đảm localStorage/sessionStorage không chứa access/refresh token.

## 10. Frontend Definition Of Done

- Không mock data trong Production path.
- Không persistent token storage hoặc raw token console output.
- Mọi page P02 có loading/error/empty/success/forbidden phù hợp.
- Button destructive có confirm; copy có feedback; Back giữ context.
- API/field error mapping nhất quán.
- Web Locks/BroadcastChannel có feature detection và fallback được test.
- Responsive/accessibility/browser tests pass.
