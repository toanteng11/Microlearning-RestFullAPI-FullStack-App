# Docker Operations

Docker Compose ở root dùng cho Local/Integration, gồm `web`, `api` và `mongodb`.

## Commands

```powershell
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs api
docker compose down
```

Không dùng `docker compose down --volumes` trừ khi chủ động reset MongoDB local data.

## Smoke Checks

```powershell
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/ready
Invoke-RestMethod http://localhost:4000/api/v1/system/version
Invoke-WebRequest http://localhost:4000/api-docs
Invoke-WebRequest http://localhost:3000
```

API container chạy non-root. MongoDB container trong Compose không được dùng làm Production database.
