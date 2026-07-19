# Phase 01 Docker Local Environment

## 1. Service Inventory

| Service | Image | Host Port | Persistence | Health |
| --- | --- | --- | --- | --- |
| `web` | Multi-stage Node build + Nginx | `3000` | None | Nginx `/health` |
| `api` | Multi-stage Node Alpine | `4000` | None | API `/ready` |
| `mongodb` | `mongo:8.0` | Không publish | Named volume | `mongosh ping` |

## 2. Build Principles

- Node version được pin cùng local/CI.
- `npm ci` dùng lock file trong build stage.
- Web chỉ copy static `dist` vào Nginx runtime.
- API runtime chỉ có production dependencies và compiled output.
- API chạy non-root.
- `.dockerignore` loại secret, Git, docs, build và local dependency.

## 3. Runtime Flow

```text
Browser :3000
  -> Web container
  -> API :4000
  -> internal mongodb:27017
```

Compose `depends_on` dùng health condition để MongoDB sẵn sàng trước API và API sẵn sàng trước Web.

## 4. Commands

```powershell
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs api
docker compose down
```

Không chạy `down --volumes` trừ khi chủ động reset dữ liệu local.

## 5. Verified Result

- Web/API images build thành công.
- `mongodb`, `api`, `web` cùng đạt `healthy`.
- Health, readiness, version, Swagger, Web root và direct SPA route trả HTTP 200.
- MongoDB host port mapping đã được bỏ sau khi phát hiện port `27017` bị chiếm; đây là hardening phù hợp internal network boundary.

## 6. Production Boundary

Compose không phải Production architecture. Theo ADR-010, Phase 07 dùng một Google Cloud Run application container phục vụ React/API/Swagger cùng origin, MongoDB Atlas, Artifact Registry, Secret Manager và Cloud Logging/Monitoring.
