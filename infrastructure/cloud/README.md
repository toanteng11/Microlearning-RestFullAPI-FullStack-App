# Cloud Implementation Boundary

Phase 01 chỉ bảo đảm application Cloud-ready thông qua stateless API container, static Web artifact, environment validation và health/version endpoints.

Cloud baseline đã được chốt ngày `2026-07-17`:

- Google Cloud Run: một application container phục vụ React, API và Swagger cùng origin.
- MongoDB Atlas: managed MongoDB.
- GitHub Actions: CI/CD.
- Google Artifact Registry, Secret Manager và Cloud Logging/Monitoring: supporting services.
- Firebase không được sử dụng.

Kế hoạch thực thi nằm tại `../../docs/implementation/phase-07/cloud-provider-baseline.md`. Hạ tầng/config thực tế chỉ được thêm trong Phase 07 qua Pull Request, không lưu Cloud credential, Atlas URI, service-account key hoặc secret trong thư mục này.
