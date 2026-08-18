# Cloud Run Service Module

Module provision `google_cloud_run_v2_service` bằng exact Artifact Registry digest, runtime service account,
bounded scaling/concurrency, request-based CPU, startup/liveness/readiness probes và exact Secret Manager
versions. Public invoker chỉ được tạo khi caller đặt `allow_public_invoker=true` rõ ràng.
