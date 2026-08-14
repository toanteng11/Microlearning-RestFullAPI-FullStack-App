# Production Container Contract

## 1. Mục tiêu

Tạo một OCI image nhỏ, tái lập, không chạy root và chứa đúng artifact cần cho React, API và Swagger.

## 2. Multi-stage build

Image phải có các stage logic sau:

1. `deps`: cài dependency bằng lockfile và `npm ci`;
2. `build`: build workspace API/Web, tạo OpenAPI artifact và kiểm tra bundle;
3. `production-deps`: chỉ giữ runtime dependencies cần thiết;
4. `runtime`: copy compiled API, React `dist`, production dependencies và metadata.

Không copy `.git`, test report, coverage, local `.env`, BA docs hoặc source map chứa secret vào runtime image.

## 3. Runtime requirements

- Base image được pin theo Node major và image digest khi baseline ổn định.
- Chạy bằng user/group không phải root.
- `WORKDIR` cố định và chỉ thư mục cần thiết có quyền ghi.
- Không cài compiler/package manager phụ trong runtime nếu không cần.
- `NODE_ENV=production`.
- `EXPOSE` chỉ mang tính mô tả; process vẫn đọc `PORT`.
- Entrypoint dùng exec form để nhận `SIGTERM` trực tiếp.
- Container không nhúng secret hoặc credential.

## 4. Build metadata

Build nhận:

- `APP_VERSION`;
- `COMMIT_SHA`;
- `BUILD_TIME`.

OCI labels tối thiểu:

- `org.opencontainers.image.title`;
- `org.opencontainers.image.version`;
- `org.opencontainers.image.revision`;
- `org.opencontainers.image.created`;
- `org.opencontainers.image.source`.

Digest do registry sinh là release identity cuối cùng; tag chỉ hỗ trợ tìm kiếm.

## 5. Tagging convention

Mỗi build hợp lệ có:

- immutable lookup tag `sha-<12-char-commit>`;
- optional human tag `phase-07-rc.<number>`;
- không deploy `latest`;
- deployment workflow chuyển tag thành exact digest trước khi apply.

## 6. `.dockerignore` minimum

Loại trừ:

- `.git`, `.github`;
- `node_modules` của host;
- `.env*` ngoại trừ template không chứa secret;
- coverage, Playwright report, logs, temp files;
- `artifacts/` và tài liệu không cần runtime;
- IDE/OS metadata.

CI có negative test chứng minh `.env` hoặc known canary secret không xuất hiện trong image layers.

## 7. Container tests

1. build image hai lần từ cùng commit/inputs và so sánh hành vi/artifact metadata;
2. inspect user không phải `0`;
3. start với MongoDB test, đợi `/ready`;
4. kiểm tra `/`, API, Swagger, health/version;
5. chạy browser smoke tối thiểu;
6. gửi `docker stop` và kiểm tra graceful shutdown;
7. scan vulnerabilities theo severity policy;
8. sinh SBOM SPDX hoặc CycloneDX;
9. inspect layers không chứa secret/local `.env`;
10. kiểm tra kích thước so với budget đã ghi nhận.

## 8. Vulnerability policy

| Severity | Gate |
| --- | --- |
| Critical | Block tuyệt đối nếu không có approved exception |
| High exploitable/runtime | Block |
| High không reachable | Cần owner, evidence và expiry |
| Medium/Low | Ghi backlog và review định kỳ |

Scanner finding phải gắn với image digest. Exception không được vô thời hạn.

## 9. Rollback compatibility

- Image revision N và N-1 phải cùng đọc được schema dữ liệu trong cửa sổ rollback.
- Phase 07 không chạy destructive migration tự động khi container start.
- Seed/demo command tách khỏi entrypoint.
- Runtime image chứa compiled seed CLI cần cho private Staging Job nhưng không chứa `tsx`, source hoặc dev
  dependencies; Job phải override command một cách tường minh.
- Rollback dùng prior digest, không rebuild commit cũ.

## 10. Acceptance evidence

- Docker build command và run ID;
- image repository, digest, labels và size;
- non-root inspection;
- SBOM và scan report;
- local production smoke result;
- graceful shutdown result;
- negative secret-in-image check.
