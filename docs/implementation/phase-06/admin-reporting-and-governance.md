# Phase 06 Admin Reporting And Governance

## 1. Outcome

Admin hiểu trạng thái vận hành hệ thống để quản lý account, invitation, Classroom, Course và
AuditLog. Admin reporting không biến Admin thành người đọc bài làm/điểm nháp của Student.

## 2. Route Map

| Route | Purpose |
| --- | --- |
| `/admin/dashboard` | Governance summary và recent activity |
| `/admin/reports` | Report catalog/filter/result |
| `/admin/audit-logs` | Audit list/filter safe projection |

Role-specific user list hiện có tiếp tục được dùng; không tạo “all users” endpoint mặc định.

## 3. Admin Dashboard Metrics

### Must

- Student/Teacher/Admin/Super Admin count theo đúng từng `UserStatus`:
  `PENDING`, `ACTIVE`, `INACTIVE`, `BLOCKED`, `DELETED`;
- invitation pending/accepted/expired/revoked;
- Classroom active/archived/locked;
- Course draft/scheduled/published/unpublished/archived;
- enrollment active count;
- recent governance AuditLog metadata;
- definition/asOf/filter timezone.

Response luôn có đủ role/status key với giá trị `0` khi không có bản ghi. Không dùng nhãn
`disabled` vì runtime không có `DISABLED`, và không gộp `INACTIVE`, `BLOCKED`, `DELETED`.

### Conditional

- active user trend;
- new Classroom/enrollment trend;
- overall completion aggregate;
- export activity.

## 4. Report Catalog

| Report ID | Scope | Priority |
| --- | --- | --- |
| `RPT-ADM-001` | User/account status by role | Must |
| `RPT-ADM-002` | Teacher invitation lifecycle | Must |
| `RPT-ADM-003` | Classroom/Course governance | Must |
| `RPT-ADM-004` | Enrollment aggregate | Must |
| `RPT-ADM-005` | Audit activity metadata | Must |
| `RPT-ADM-006` | Learning outcome aggregate | Conditional |
| `ANA-OPS-001` | Reporting freshness/reconciliation health | Should |
| `ANA-OPS-002` | Export/event operational health | Conditional |

## 5. Filter Contract

- `from`, `to`, timezone;
- role allowlist;
- lifecycle/status allowlist;
- aggregation interval `DAY/WEEK/MONTH`;
- page/limit cho table;
- sort allowlist.

Admin không gửi organization scope tùy ý; server force current platform scope.

## 6. Data Minimization

| Data | Admin Dashboard/Report |
| --- | --- |
| User ID/count/role/status | Allowed theo permission |
| Email/fullName list | Chỉ existing user management route, không aggregate export mặc định |
| Classroom/Course title/status/owner ID | Allowed governance projection |
| Enrollment count | Allowed |
| Progress aggregate | Conditional + threshold |
| Individual Grade/feedback | Denied |
| Raw answer/Submission body | Denied |
| Invitation token/hash | Denied |
| Refresh/access token/session secret | Denied |
| Audit metadata | Chỉ canonical safe projection; omit `oldValue/newValue/raw metadata` |

## 7. Small-Group Protection

`REPORT_PRIVACY_MIN_GROUP_SIZE=5` baseline:

- Group count nhỏ hơn threshold không trả average/distribution.
- Response có `dataSuppressed=true`, `suppressionReason=SMALL_GROUP`.
- Không thể suy ngược bằng cách thay filter chồng lấn; query review cần test differencing cơ bản.
- Governance counts không nhạy cảm có thể được exempt bằng documented definition.

## 8. Audit Requirements

Các action phải AuditLog:

- sensitive Admin report view nếu có aggregate learning data;
- export requested/completed/failed;
- reporting rebuild/reconcile manual command;
- metric definition activation;
- privacy threshold/config change.

Audit payload chứa report ID, definition version, bounded filter summary, row count, result và
correlation ID; không chứa exported rows.

## 9. Empty/Partial/Error

- Không có records trong date range -> valid `NO_DATA`.
- Small group -> `SUPPRESSED`, không phải error.
- Một source collection lỗi -> `PARTIAL` nếu các metric khác vẫn hợp lệ.
- Definition mismatch -> không trộn số; trả controlled error/stale.
- Date range vượt giới hạn -> `422 REPORT_LIMIT_EXCEEDED`.

## 10. Admin Acceptance Journeys

1. Admin Dashboard counts đúng role/status source.
2. Role-specific lists vẫn tách Student/Teacher/Admin.
3. Admin không đọc individual Grade/Submission qua report filters.
4. Small group bị suppress.
5. Audit report filter/pagination/index hoạt động.
6. Export Conditional giữ đúng projection và có audit.
7. Super Admin không bypass redaction.
