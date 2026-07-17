# Docker Operations

Docker Compose ở root dùng cho Local/Integration, gồm `web`, `api`, `mongodb` và one-shot service `mongodb-init`. MongoDB chạy single-node replica set `rs0`; API chỉ start sau khi init exit `0` và primary healthcheck pass.

## Commands

```powershell
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs api
docker compose logs mongodb-init
docker compose down
```

Không dùng `docker compose down --volumes` trừ khi chủ động reset MongoDB local data.

Chạy transaction integration test qua host port chỉ bật trong CI override:

```powershell
docker compose -f docker-compose.yml -f infrastructure/ci/docker-compose.integration.yml up -d mongodb
docker compose -f docker-compose.yml -f infrastructure/ci/docker-compose.integration.yml run --rm mongodb-init
$env:MONGODB_INTEGRATION_URI='mongodb://127.0.0.1:27018/microlearning-ci?replicaSet=rs0&directConnection=true'
npm run test:integration --workspace @microlearning/api
```

## Smoke Checks

```powershell
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/ready
Invoke-RestMethod http://localhost:4000/api/v1/system/version
Invoke-WebRequest http://localhost:4000/api-docs
Invoke-WebRequest http://localhost:3000
```

API container chạy non-root. MongoDB container trong Compose không được dùng làm Production database.
