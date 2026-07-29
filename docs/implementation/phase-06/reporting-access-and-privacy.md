# Phase 06 Reporting Access And Privacy

## 1. Security Principle

Report, filter, sort, drill-down và export đều là protected business actions. UI ẩn button chỉ là
trải nghiệm; backend phải tự xác thực actor, account status, permission, ownership/enrollment,
filter subset và output projection cho mọi request.

## 2. Permission Baseline

| Permission | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- |
| `learning.view_enrolled` | Existing: own Dashboard/Progress | No | No | Yes |
| `grade.view_own` | Existing: own returned Grade | No | No | Yes |
| `course.progress_view_owned` | No | Existing: owned Dashboard/Analytics | No | Yes |
| `grade.manage_owned` | No | Existing: owned Gradebook | No | Yes |
| `report.view_governance` | No | No | Yes | Yes |
| `report.export_owned` | No | Static grant; runtime Conditional | No | Yes |
| `report.export_governance` | No | No | Static grant; runtime Conditional | Yes |
| `report.audit_view` | No | No | Yes | Yes |

Existing domain permissions vẫn áp dụng khi route dẫn sang grading/content detail.
Export permission nằm trong static role capabilities; feature flag + scope + `allowedActions`
quyết định runtime availability. Bật/tắt export flag không yêu cầu auth refresh.

Analytics event endpoint, nếu bật, chỉ yêu cầu authenticated active actor và schema/rate limit;
không thêm capability giống nhau cho mọi role. Rebuild/reconcile là operations command, không
được expose thành normal role permission trong P06.

## 3. Authorization Pipeline

1. Verify access token/session.
2. Reject non-active actor.
3. Require route permission.
4. Resolve Classroom/Course/Student object scope.
5. Validate requested filter là subset của resolved scope.
6. Apply row/field projection.
7. Apply pagination/export bounds.
8. Query.
9. Redact/suppress.
10. Audit action khi policy yêu cầu.

Không query Grade/Progress trước bước 4.

## 4. Object Scope Rules

### Student

- Actor ID tự lấy từ token.
- Course phải thuộc active Enrollment hoặc historical access policy được định nghĩa.
- Không chấp nhận arbitrary Student ID.

### Teacher

- `courseId` phải thuộc owned Classroom/Course.
- `studentId` phải thuộc roster của resolved Course.
- Activity phải thuộc Course và type hợp lệ.

### Admin

- Chỉ platform governance scope.
- Learning aggregate không có row-level Student detail.
- Existing user detail endpoint dùng permission riêng, không được lách qua report.

## 5. Field Projection

| Projection | Allowed |
| --- | --- |
| Student self | Own identity, own progress, own returned Grade/feedback |
| Teacher course | Safe Student identity, progress, status, Grade context thuộc owned Course |
| Admin governance | IDs/count/status/timestamps/metadata; aggregate đã suppress |
| Export | Tập con rõ của projection tương ứng |
| Analytics event | Pseudonymous actor ID, safe context; không content/Grade/token |

## 6. Sensitive Data Denylist

Không đưa vào Admin report, event, log hoặc export ngoài authorized grading:

- password/hash, access/refresh/invitation/join token;
- token hash/pepper/secret/env;
- raw Quiz answer/answer key;
- Assignment Submission body/private attachment;
- draft Grade/private feedback;
- cookie/header authorization;
- full error stack trong client response.

## 7. Query Leakage Controls

- Filter field enum, unknown field rejected.
- Search normalized và length bounded.
- Object ID được validate; out-of-scope response theo anti-enumeration policy.
- Sort only allowlist; không cho arbitrary Mongo path/operator.
- Date range/limit bounded.
- Không nhận raw Mongo query/aggregation pipeline.
- Count/total phải dùng cùng scoped filter với items.

## 8. Small Group And Differencing

- Threshold baseline `5`.
- Suppress average/distribution nếu group nhỏ.
- Không trả numerator/denominator phụ có thể suy ra suppressed value.
- Kiểm thử các filter gần nhau để giảm differencing đơn giản.
- Threshold/config change phải audit.

## 9. Cache And Client Privacy

- Private response `Cache-Control: no-store` trừ khi security review cho phép khác.
- React Query key chứa actor/session scope và Course/filter.
- Logout/session invalidation xóa private cache.
- Forbidden response không giữ data từ actor trước.
- CSV không được lưu tự động vào server; browser download do user chủ động.

## 10. Audit Events

| Action | Audit |
| --- | --- |
| Normal Student self Dashboard | Không bắt buộc per-view |
| Teacher Course report view | Structured metric; audit nếu sensitive drill-down |
| Admin learning aggregate view | Required |
| CSV export | Required request/success/failure |
| Manual rebuild/reconcile | Required |
| Metric definition/config change | Required |
| Authorization denial spike | Security metric/log, không ghi secret |

## 11. Privacy Tests

- Student A/B horizontal access.
- Teacher owned/cross-owned Course.
- Teacher Student not in roster.
- Admin raw Grade/answer/submission query attempt.
- Super Admin redaction consistency.
- Filter scope widening.
- export projection parity.
- cache leakage after logout/role switch.
- small-group suppression/differencing.
- log/event denylist scan.
