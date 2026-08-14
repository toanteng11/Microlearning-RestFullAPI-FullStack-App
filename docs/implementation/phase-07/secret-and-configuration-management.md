# Secret And Configuration Management

## 1. Phân loại

| Loại | Ví dụ | Nơi lưu |
| --- | --- | --- |
| Secret | Mongo URI, access-token signing secret và hashing peppers | Google Secret Manager |
| Sensitive test secret | cloud smoke actor password | GitHub Environment secret hoặc Secret Manager theo use case |
| Non-secret runtime config | region, log level, max pool | Terraform variables |
| Build metadata | commit, version, build time | GitHub Actions/CD |
| Local-only secret | developer Mongo URI | ignored `.env`, không commit |

## 2. Source of truth

- Runtime config schema trong API là source of truth về type/range/required.
- Terraform là source of truth về mapping config vào Cloud Run.
- Secret Manager là source of truth về secret values và versions.
- `.env.example` mô tả tên/placeholder, không chứa real value.
- GitHub variables chỉ giữ identifier không bí mật.

Mọi biến mới phải cập nhật đồng thời schema, example, Terraform, test và tài liệu.

## 3. Secret naming/versioning

Mỗi environment có secret riêng, ví dụ:

```text
ml-stg-mongodb-uri
ml-stg-access-token-secret
ml-stg-auth-identity-pepper
ml-stg-classroom-code-pepper
ml-stg-seed-demo-password
```

Cloud Run tham chiếu version cụ thể, không dùng alias `latest` cho Production-like deployment. Deployment
record ghi version number nhưng không ghi value.

`ml-stg-seed-demo-password` chỉ cấp cho dedicated seed Job identity và gắn vào private Job; public
application runtime identity không được quyền đọc hoặc mount secret này. Dedicated E2E identity được đọc
đúng secret này để đăng nhập synthetic accounts, phải mask ngay và không được đọc Mongo URI/signing peppers.

## 4. Secret lifecycle

1. Terraform tạo secret container và IAM.
2. Owner thêm version qua kênh bảo mật.
3. Deploy workflow nhận version number đã duyệt.
4. Cloud Run revision mới tham chiếu version đó.
5. Smoke/auth test Pass.
6. Giữ version trước trong rollback window.
7. Disable/destroy version cũ sau khi window kết thúc và không còn revision cần rollback.

## 5. Rotation runbook

### MongoDB credential

1. tạo Atlas user/password mới;
2. thêm Secret Manager version mới;
3. deploy revision mới;
4. smoke toàn bộ database flows;
5. rollback nếu fail;
6. revoke Atlas user/password cũ;
7. kiểm tra credential cũ fail;
8. đóng old secret version sau rollback window.

### Token and hashing secrets

Rotation của `ACCESS_TOKEN_SECRET` hoặc `AUTH_IDENTITY_PEPPER` có thể làm mất session hiện hành; rotation
của `CLASSROOM_CODE_PEPPER` có thể ảnh hưởng việc đối chiếu class code theo implementation hiện hữu. Phải:

- thông báo maintenance impact;
- deploy đồng bộ đúng contract auth;
- kiểm tra login/refresh/logout;
- không rotate đồng thời nhiều secret nếu không cần;
- ghi thời điểm và blast radius.

## 6. Redaction requirements

Redaction áp dụng cho:

- logger serializers;
- HTTP headers/cookies;
- error objects;
- GitHub Actions output;
- Terraform plan output;
- screenshots/evidence;
- diagnostics bundle.

Patterns tối thiểu gồm `Authorization`, cookie headers, password fields, token/invitation fields và URI có
userinfo.

## 7. Configuration validation

Production mode phải fail fast khi:

- dùng default/example secret;
- secret quá ngắn hoặc trùng nhau khi contract cấm;
- `ALLOWED_ORIGINS=*`;
- cookie secure flag không tương thích HTTPS;
- missing build metadata;
- pool/concurrency/limit không phải số hợp lệ;
- environment name ngoài allowlist.

## 8. Negative tests

- inject known canary secret rồi xác minh secret scan block;
- log error có URI/token rồi xác minh output đã che;
- inspect `docker history` và image filesystem;
- inspect Terraform state/plan không chứa secret value;
- inspect browser bundle không chứa config server-side;
- khởi động với placeholder secret phải fail.

## 9. Incident response

Khi secret có khả năng lộ:

1. không chỉ xóa commit hoặc log;
2. revoke/rotate credential ngay;
3. disable affected secret version;
4. audit GitHub/GCP/Atlas access;
5. purge artifact/log nếu khả thi nhưng xem credential là đã compromise;
6. mở incident và root-cause action;
7. cập nhật scanner/redaction regression test.

## 10. Acceptance evidence

- secret inventory chỉ có resource name/version;
- IAM access matrix;
- rotation rehearsal với synthetic credential;
- no-secret scan/image/state/log results;
- config fail-fast tests;
- owner và next rotation date.
