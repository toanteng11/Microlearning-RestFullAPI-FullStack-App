# Security Hardening

## 1. Mục tiêu

Xác minh deployment không làm suy giảm auth, RBAC, secret, network, artifact và data controls đã xây từ các
phase trước.

## 2. Threat surfaces

- public Cloud Run URL;
- Swagger/OpenAPI exposure;
- secure cookies/proxy/CORS;
- GitHub Actions/OIDC trust;
- Terraform state/IAM;
- Artifact Registry/image dependencies;
- Secret Manager/runtime environment;
- MongoDB Atlas network/user/data;
- logs, reports và evidence artifacts.

## 3. Required controls

### Application edge

- HTTPS only;
- secure headers và no stack trace;
- exact origin policy;
- rate limits hoạt động phía sau trusted proxy;
- auth cookies `Secure`, `HttpOnly`, appropriate `SameSite`;
- RBAC/resource ownership tests trên Cloud;
- request/body/upload limits giữ hiệu lực.

### Cloud/IAM

- dedicated runtime/deploy identities;
- đúng một intended public application service có unauthenticated Cloud Run invoker để phục vụ Web/login;
  private API vẫn do application auth/RBAC/ownership bảo vệ;
- WIF condition giới hạn repository/ref/environment;
- không active service-account key;
- least privilege và environment isolation;
- Terraform state private/versioned.

### Secrets/artifacts

- Secret Manager pinned versions;
- no secrets in image/state/log/browser bundle;
- image by digest;
- vulnerability scan/SBOM;
- third-party actions/version pinning.

### Data

- TLS Atlas connection;
- dedicated least-privilege user;
- synthetic Staging only;
- no broad network rule without waiver;
- backup/restore artifact access-controlled.

## 4. Swagger policy

Staging Swagger được bật để review API. Production decision thuộc Phase 08:

- có thể public nếu API document được chủ đích công khai và không chứa internal example/secret;
- hoặc giới hạn/disable bằng explicit config;
- OpenAPI không được liệt kê endpoint không thực thi hoặc example credential thật.

## 5. Security tests

- unauthenticated/role/ownership matrix;
- refresh-token rotation/reuse/revocation trên HTTPS;
- rate-limit/IP behavior qua Cloud Run proxy;
- CORS/origin rejection;
- cookie flags;
- security headers/CSP;
- secret canary redaction;
- WIF negative trust test;
- image/IaC/dependency/secret scan;
- Atlas old credential rejection;
- API docs/schema validation.

## 6. Exception policy

Mỗi exception phải có:

- control/finding bị ảnh hưởng;
- business/technical reason;
- blast radius;
- compensating controls;
- owner;
- expiry;
- remediation issue;
- approval.

Không cho exception Critical về auth bypass, exposed secret hoặc real data trên public Free Staging.

## 7. Pre-exit review

- IAM diff reviewed;
- public resources inventory reviewed;
- service-account keys list checked;
- secret/image/state/log/browser scans clean;
- Atlas user/network/data policy checked;
- vulnerability exceptions chưa hết hạn;
- security cloud E2E Pass;
- Production gaps được block trong P08 handoff.
