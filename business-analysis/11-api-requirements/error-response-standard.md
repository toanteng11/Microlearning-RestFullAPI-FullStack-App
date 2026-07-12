# Error Response Standard

## Mục Đích

Tài liệu này chuẩn hóa cách API trả lỗi để Frontend hiển thị rõ ràng, QA test được và Backend xử lý nhất quán. Mọi endpoint trong `/api/v1` phải tuân thủ error response standard này.

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [
      {
        "field": "email",
        "code": "EMAIL_INVALID",
        "message": "Email không đúng định dạng"
      }
    ]
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-07-10T10:00:00.000Z",
    "path": "/api/v1/auth/register"
  }
}
```

## Error Object Fields

| Field | Required | Mô tả |
| --- | --- | --- |
| success | Có | Luôn là `false` với error |
| error.code | Có | Mã lỗi cấp cao |
| error.message | Có | Message có thể hiển thị cho user hoặc log |
| error.details | Không | Lỗi chi tiết theo field/rule |
| meta.requestId | Should | Trace request |
| meta.timestamp | Có | Thời điểm xảy ra lỗi |
| meta.path | Có | API path |

## Common Error Codes

| HTTP Status | Error Code | Khi nào dùng |
| --- | --- | --- |
| 400 | BAD_REQUEST | Request sai format |
| 401 | AUTHENTICATION_REQUIRED | Chưa login/token thiếu |
| 401 | TOKEN_INVALID | Token sai/hết hạn |
| 403 | ACCESS_DENIED | Không đủ quyền |
| 403 | ACCOUNT_NOT_ACTIVE | Account không active |
| 404 | RESOURCE_NOT_FOUND | Resource không tồn tại hoặc không được phép biết |
| 409 | DUPLICATE_RESOURCE | Duplicate email/enrollment/code |
| 409 | BUSINESS_RULE_CONFLICT | Vi phạm rule nghiệp vụ |
| 422 | VALIDATION_ERROR | Field không hợp lệ |
| 429 | RATE_LIMITED | Quá nhiều request |
| 500 | INTERNAL_SERVER_ERROR | Lỗi server |
| 503 | SERVICE_UNAVAILABLE | Dependency/service unavailable |

## Domain Error Codes

### Auth

| Code | Mô tả |
| --- | --- |
| INVALID_CREDENTIALS | Sai email/password |
| PASSWORD_POLICY_FAILED | Password không đạt policy |
| RESET_TOKEN_INVALID | Reset token sai/hết hạn |
| ACCOUNT_BLOCKED | Account bị khóa |
| ACCOUNT_INACTIVE | Account inactive |

### Teacher Invitation

| Code | Mô tả |
| --- | --- |
| INVITATION_NOT_FOUND | Không tìm thấy invitation |
| INVITATION_EXPIRED | Invitation hết hạn |
| INVITATION_REVOKED | Invitation bị revoke |
| INVITATION_ALREADY_ACCEPTED | Invitation đã accept |
| INVITATION_EMAIL_MISMATCH | Email nhập không khớp email được mời |
| TEACHER_ALREADY_ACTIVE | Teacher account đã active |

### Classroom Join

| Code | Mô tả |
| --- | --- |
| CLASS_CODE_INVALID | Class Code không hợp lệ |
| JOIN_METHOD_DISABLED | Admin/Teacher đã tắt phương thức join |
| CLASSROOM_NOT_ACTIVE | Classroom không active |
| DUPLICATE_ENROLLMENT | Student đã tham gia Classroom |
| ENROLLMENT_LIMIT_REACHED | Classroom đã đủ số lượng Student nếu có giới hạn |

### Content / Assessment

| Code | Mô tả |
| --- | --- |
| CONTENT_NOT_PUBLISHED | Content chưa publish hoặc đã unpublish |
| QUIZ_HAS_NO_QUESTION | Quiz chưa có câu hỏi hợp lệ |
| ATTEMPT_LIMIT_REACHED | Hết lượt làm Quiz |
| ATTEMPT_ALREADY_SUBMITTED | Attempt đã submit |
| ASSIGNMENT_CLOSED | Assignment đã đóng |
| SUBMISSION_TYPE_NOT_ALLOWED | Loại nộp bài không được cho phép |
| RESUBMIT_NOT_ALLOWED | Không được nộp lại |

### Admin / Governance

| Code | Mô tả |
| --- | --- |
| USER_PERMISSION_DENIED | Admin không có permission |
| ROLE_CHANGE_NOT_ALLOWED | Không được đổi role này |
| SELF_PRIVILEGE_ESCALATION_DENIED | Không được tự nâng quyền |
| TEACHER_HAS_ACTIVE_CLASSROOM | Teacher còn Classroom active |
| INVALID_NEW_OWNER | Owner mới không hợp lệ |
| AUDIT_LOG_IMMUTABLE | Không được sửa/xóa AuditLog |

## Frontend Handling Rules

| Error | UI behavior |
| --- | --- |
| 401 | Redirect login hoặc refresh token |
| 403 | Hiển thị không đủ quyền và nút quay lại |
| 404 | Hiển thị not found/empty state phù hợp |
| 409 | Hiển thị conflict message và hướng xử lý |
| 422 | Hiển thị lỗi theo field |
| 500/503 | Hiển thị error state, retry hoặc thông báo thử lại sau |

## Security Notes

- Không trả stack trace trong production.
- Không tiết lộ email có tồn tại hay không trong forgot password.
- Login sai nên dùng message chung.
- Resource không có quyền có thể trả 404 thay vì 403 nếu cần tránh lộ resource tồn tại.
- Không trả raw token trong error response.
