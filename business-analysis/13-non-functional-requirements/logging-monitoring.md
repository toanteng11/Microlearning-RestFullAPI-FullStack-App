# Logging And Monitoring Requirements

## Mục Đích

Tài liệu này xác định yêu cầu logging, audit logging, monitoring và alerting foundation cho hệ thống. Mục tiêu là khi có lỗi, Dev/QA/DevOps có thể biết lỗi xảy ra ở đâu, khi nào, với request nào, nhưng không làm lộ dữ liệu nhạy cảm.

## Logging Scope

| Log type | Mục đích |
| --- | --- |
| Application log | Theo dõi service start/stop, config environment không nhạy cảm. |
| API request log | Trace request, latency, status code, requestId. |
| Error log | Debug lỗi backend/frontend/dependency. |
| Authentication log | Login success/failure, logout, reset password events. |
| Audit log | Ghi action nghiệp vụ quan trọng: admin, teacher, grading, deadline reset. |
| Deployment log | Trace build/deploy/rollback version. |

## Logging Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-LOG-001 | Mỗi API request nên có requestId/correlationId. | Should | Error response/log có requestId. |
| NFR-LOG-002 | API request log nên ghi method, path, status, duration, actorId nếu có. | Should | Log sample có field chính. |
| NFR-LOG-003 | Error log phải ghi stack trace ở server log nhưng không trả stack trace cho user production. | Must | 500 response an toàn; server log đủ debug. |
| NFR-LOG-004 | Log không được chứa password, raw token, secret, full file content. | Must | Log review. |
| NFR-LOG-005 | Authentication failure spike phải có log để điều tra. | Should | Failed login event count được log/monitor. |
| NFR-LOG-006 | Deployment version/commit nên ghi khi service start. | Should | Startup log có version/commit/environment. |
| NFR-LOG-007 | Frontend production không được để console debug nhạy cảm. | Must | Console không log token/API secret. |

## Audit Log Requirements

AuditLog là log nghiệp vụ, không chỉ là log kỹ thuật. Các action sau phải có AuditLog:

| ID | Action | Actor | Required fields |
| --- | --- | --- | --- |
| AUD-001 | Create Teacher Invitation | Admin | actorId, invitationId, email, status, timestamp |
| AUD-002 | Copy Teacher Invitation Link | Admin | actorId, invitationId, timestamp nếu tracking bật |
| AUD-003 | Revoke Teacher Invitation | Admin | actorId, invitationId, reason nếu có, timestamp |
| AUD-004 | Accept Teacher Invitation | Teacher | teacherId, invitationId, timestamp |
| AUD-005 | Change user status | Admin | actorId, targetUserId, oldStatus, newStatus, reason nếu có |
| AUD-006 | Change role/permission | Admin/Super Admin | actorId, targetUserId, oldRole, newRole, reason |
| AUD-007 | Reset Lesson Deadline | Teacher | actorId, lessonId, oldDeadline, newDeadline, reason |
| AUD-008 | Grade Submission | Teacher | actorId, submissionId, studentId, grade summary, timestamp |
| AUD-009 | Return Submission | Teacher | actorId, submissionId, studentId, timestamp |
| AUD-010 | Export Report/Audit | Admin | actorId, reportType, filters summary, timestamp |
| AUD-011 | Update System Settings | Admin/Super Admin | actorId, settingKey, oldValue/newValue nếu không nhạy cảm |

AuditLog không được chứa:

- Plain password.
- Raw token.
- Secret values.
- Full uploaded file content.
- Sensitive stack trace.

## Monitoring Requirements

| ID | Metric | Priority | Target/Alert Direction |
| --- | --- | --- | --- |
| NFR-MON-001 | API uptime | Must | `/health` monitored. |
| NFR-MON-002 | API latency | Should | Track p50/p95 response time. |
| NFR-MON-003 | Error rate | Should | Alert nếu 5xx tăng bất thường. |
| NFR-MON-004 | MongoDB health | Should | Connection DOWN/DEGRADED alert. |
| NFR-MON-005 | CPU/memory container | Should | Alert nếu vượt ngưỡng lâu. |
| NFR-MON-006 | Failed login spike | Could | Alert brute-force suspicion. |
| NFR-MON-007 | Invitation accept failure spike | Could | Alert token abuse/misconfiguration. |
| NFR-MON-008 | Deployment health | Must | Smoke test sau deploy. |
| NFR-MON-009 | Disk/storage usage | Should nếu upload/storage local | Alert gần đầy. |
| NFR-MON-010 | Backup success/failure | Should | Alert backup fail nếu backup tự động. |

## Suggested Log Fields

### API Request Log

```json
{
  "level": "info",
  "type": "api_request",
  "requestId": "req_123",
  "method": "GET",
  "path": "/api/v1/students/me/todo",
  "statusCode": 200,
  "durationMs": 120,
  "actorId": "user_123",
  "role": "STUDENT",
  "timestamp": "2026-07-10T10:00:00.000Z"
}
```

### Error Log

```json
{
  "level": "error",
  "type": "api_error",
  "requestId": "req_123",
  "path": "/api/v1/teacher/courses/course_1/dashboard",
  "statusCode": 500,
  "errorCode": "INTERNAL_SERVER_ERROR",
  "message": "Unexpected server error",
  "actorId": "teacher_123",
  "timestamp": "2026-07-10T10:00:00.000Z"
}
```

### Audit Log

```json
{
  "actorId": "teacher_123",
  "action": "RESET_LESSON_DEADLINE",
  "resourceType": "Lesson",
  "resourceId": "lesson_123",
  "oldValue": {
    "completionDeadline": "2026-07-18T16:59:00.000Z"
  },
  "newValue": {
    "completionDeadline": "2026-07-20T16:59:00.000Z"
  },
  "reason": "Gia hạn vì lớp nghỉ đột xuất.",
  "timestamp": "2026-07-10T10:00:00.000Z"
}
```

## Alerting Direction

| Alert | Trigger gợi ý | Action |
| --- | --- | --- |
| API Down | `/health` DOWN nhiều lần liên tiếp | DevOps kiểm tra deployment/logs/MongoDB. |
| High 5xx Rate | 5xx vượt ngưỡng trong 5-10 phút | Dev kiểm tra recent deploy và error logs. |
| MongoDB Down | Detailed health báo MongoDB DOWN | DevOps kiểm tra database/network/secrets. |
| Login Failure Spike | Failed login tăng bất thường | Kiểm tra brute force/rate limit. |
| Registration Spike | Student registration tăng đột biến hoặc nhiều request bị rate limit | Kiểm tra abuse/bot, IP pattern và registration endpoint health; không log password. |
| Backup Failed | Backup job fail | DevOps chạy lại/điều tra storage. |
| Disk/Storage High | Storage gần đầy | Dọn log/backup cũ hoặc tăng storage. |

## Retention For Logs

| Log type | MVP/Staging Direction | Production Direction |
| --- | --- | --- |
| Application logs | Giữ theo khả năng storage | 7-30 ngày hoặc theo policy |
| Error logs | Giữ đủ để debug sprint/release | 30-90 ngày hoặc theo policy |
| Audit logs | Giữ lâu hơn log kỹ thuật | Theo policy tổ chức |
| Deployment logs | Giữ theo CI/CD provider | Theo release history |

## Acceptance Criteria

- Critical errors được log đủ để debug.
- Logs không chứa password/raw token/secrets.
- AuditLog có cho teacher invitation, role/status change, deadline reset và grading.
- `/health` được dùng cho monitoring/smoke test.
- DevOps có thể xác định version/commit/environment khi cần.
