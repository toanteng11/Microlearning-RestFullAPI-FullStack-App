# Phase 07 - DevOps and Deployment

## Trạng thái

`PROVIDER_BASELINE_ACCEPTED`; Phase 07 vẫn `Planned` và chưa có deployment evidence.

Cloud/provider decision đã được chốt ngày `2026-07-17`:

- Google Cloud Run cho một application service phục vụ React, REST API và Swagger cùng origin.
- MongoDB Atlas cho managed MongoDB.
- GitHub Actions cho CI/CD.
- Google Artifact Registry, Secret Manager và Cloud Logging/Monitoring là supporting services.
- Không sử dụng Firebase.

Implementation baseline: [cloud-provider-baseline.md](cloud-provider-baseline.md).

## Mục tiêu sơ bộ

Nâng CI baseline thành CI/CD hoàn chỉnh, đóng gói artifact bất biến, triển khai Staging và Production lên Cloud, đồng thời thiết lập secret management, observability, backup, recovery và rollback.

## Capability chính

- Container registry và immutable image tagging.
- Staging/Production environment configuration.
- Deploy, health/version/smoke verification và approval gates.
- Logging, metrics, error tracking và alerting.
- Managed MongoDB backup/restore và rollback runbook.
- Deployment/release evidence.

## Dependency

Provider architecture đã resolved. Dependency còn lại là Google Cloud/Atlas account, billing/budget, domain/TLS decision, Production Atlas tier/backup/network policy, service identity, registry/runtime configuration và toàn bộ application increment.
