# API Health And DevOps Requirements

## Mục Đích

Tài liệu này mô tả các API và yêu cầu hỗ trợ DevOps cho hệ thống **Microlearning Classroom LMS Platform**. Các API này giúp kiểm tra hệ thống sau khi chạy Docker, CI/CD và Cloud deployment.

## Health Check Goals

| Goal | Mô tả |
| --- | --- |
| Verify service is alive | Biết backend API còn chạy không |
| Verify dependencies | Kiểm tra kết nối MongoDB và dependency cơ bản |
| Support deployment smoke test | CI/CD kiểm tra sau deploy |
| Avoid exposing secrets | Health response không trả secrets/config nhạy cảm |

## Health Endpoints

| Method | Endpoint | Auth | Mục đích |
| --- | --- | --- | --- |
| GET | `/health` | Public-safe hoặc restricted | Health check đơn giản |
| GET | `/api/v1/system/health` | Admin/DevOps | Health check chi tiết hơn |
| GET | `/api/v1/system/version` | Public-safe hoặc Admin/DevOps | Xem app version/build metadata |

## API Documentation Endpoints

| Method | Endpoint | Auth / exposure | Mục đích |
| --- | --- | --- | --- |
| GET | `/api-docs` | Theo Swagger exposure policy | Hiển thị Swagger UI cho Developer/QA/authorized operator. |
| GET | `/api/v1/openapi.json` | Theo Swagger exposure policy | Cung cấp OpenAPI contract cho Swagger UI, contract test và API consumer. |
| GET | `/api/v1/openapi.yaml` | Optional, theo Swagger exposure policy | Cung cấp YAML specification nếu team publish format này. |

`/api-docs` không phải health endpoint và không được xem là public end-user feature. CI/Staging smoke nên xác nhận Swagger UI/spec route trả đúng policy, đúng version/contract và không expose secret/token.

## Basic Health Response

```json
{
  "success": true,
  "data": {
    "status": "UP",
    "service": "microlearning-api",
    "timestamp": "2026-07-10T10:00:00.000Z"
  }
}
```

## Detailed Health Response

```json
{
  "success": true,
  "data": {
    "status": "UP",
    "service": "microlearning-api",
    "dependencies": {
      "mongodb": "UP",
      "storage": "UP"
    },
    "uptimeSeconds": 3600,
    "timestamp": "2026-07-10T10:00:00.000Z"
  }
}
```

## Version Response

```json
{
  "success": true,
  "data": {
    "appName": "Microlearning Classroom LMS API",
    "version": "1.0.0",
    "environment": "staging",
    "commitSha": "abc123",
    "buildTime": "2026-07-10T10:00:00.000Z"
  }
}
```

## Status Values

| Value | Ý nghĩa |
| --- | --- |
| UP | Service và dependency chính hoạt động |
| DEGRADED | Service chạy nhưng dependency phụ lỗi |
| DOWN | Service không sẵn sàng |

## CI/CD Usage

Pipeline có thể dùng:

```text
GET /health
```

Sau deploy:

1. Deploy backend.
2. Gọi `/health`.
3. Nếu status không `UP`, pipeline fail hoặc rollback.
4. Gọi smoke test API cơ bản như login test account nếu environment cho phép.
5. Validate OpenAPI JSON và kiểm tra `/api-docs` load được specification ở Local/Staging theo exposure policy.

## Security Requirements

- `/health` public chỉ trả thông tin tối thiểu.
- `/api/v1/system/health` chi tiết nên yêu cầu Admin/DevOps permission nếu chứa dependency details.
- Không trả database URL, credentials, secret keys, token, stack trace.
- Version endpoint không nên expose thông tin infrastructure nhạy cảm.
- Swagger UI/JSON không prefill/persist Bearer token, không chứa real credential/raw invitation URL/secret và không bypass auth/authorization của API runtime.
- Staging/Cloud Swagger access phải theo environment exposure policy; public technical docs không được coi là permission để gọi mutation API.

## Monitoring Notes

Monitoring có thể kiểm tra:

- API uptime.
- MongoDB connectivity.
- Error rate.
- Response time.
- Failed login spike.
- API 5xx spike.

## Backup And Rollback API Notes

MVP không bắt buộc có API để trigger backup/rollback từ web app. Backup/rollback có thể là DevOps process/script. Nếu có API sau này:

- Chỉ Super Admin/DevOps được gọi.
- Phải ghi AuditLog.
- Không expose backup file public.
- Cần confirm và reason.
