# Phase 01 Environment And Security

## 1. Environment Contract

| Variable | App | Secret | Required | Mục tiêu |
| --- | --- | --- | --- | --- |
| `APP_ENV` | API | No | Yes/default local | Runtime environment |
| `APP_VERSION` | API | No | Yes | Artifact version |
| `COMMIT_SHA` | API | No | CI/release | Artifact traceability |
| `BUILD_TIME` | API | No | CI/release | Build identity |
| `PORT` | API | No | Yes | HTTP port |
| `MONGODB_URI` | API | Yes | Yes | Database connection |
| `ALLOWED_ORIGINS` | API | No | Yes | CORS allowlist |
| `LOG_LEVEL` | API | No | No | Structured log level |
| `VITE_API_BASE_URL` | Web | Public | Yes | Browser API base URL |

## 2. Loading Strategy

- Local `npm run dev`: Web/API đọc `.env` tại repository root.
- `.env` bị Git ignore; `.env.example` là contract được commit.
- Docker Compose inject environment vào container.
- CI inject public build value; Production secret phải tới từ protected environment/secret manager ở Phase 07.

## 3. Security Baseline

- Helmet security headers và Express `x-powered-by` disabled.
- CORS exact allowlist; untrusted origin không nhận allow header.
- JSON body limit `1mb` cho foundation.
- Request ID được sanitize hoặc tạo UUID mới.
- Structured logger redact authorization, cookie, password, token và secret.
- Production error không trả stack trace.
- API container chạy non-root.
- MongoDB không publish ra host trong Compose.
- Docker context bỏ `.env`, `.git`, dependency/build artifacts.

## 4. Secret Rules

- Không commit `.env`, private key, access token hoặc connection string có credential.
- Không dùng `VITE_*` cho secret vì mọi giá trị được bundle công khai.
- Không log full request body ở authentication/invitation endpoint tương lai.
- Credential rotation và Cloud secret manager thuộc Phase 07 nhưng design Phase 02 phải tương thích.

## 5. Phase 02 Security Decisions Còn Thiếu

Token storage, refresh rotation/revocation, password hashing/policy, account lock/rate limit và invitation token hashing/expiry phải được chốt trước khi code authentication.
