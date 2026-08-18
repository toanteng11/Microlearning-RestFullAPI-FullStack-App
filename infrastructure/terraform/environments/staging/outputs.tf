output "artifact_repository" {
  description = "Private Artifact Registry repository path."
  value       = module.artifact_registry.image_repository
}

output "deployer_service_account" {
  description = "Staging deployment service-account email."
  value       = module.iam.deployer_email
}

output "runtime_service_account" {
  description = "Staging runtime service-account email."
  value       = module.iam.service_account_emails[local.runtime_account_id]
}

output "workload_identity_provider" {
  description = "Full WIF provider resource name for GitHub configuration."
  value       = module.workload_identity.provider_name
}

output "e2e_workload_identity_provider" {
  description = "Dedicated WIF provider for the bounded Cloud E2E identity."
  value       = module.e2e_workload_identity.provider_name
}

output "e2e_service_account" {
  description = "Cloud E2E service account with synthetic-password-only secret access."
  value       = module.iam.service_account_emails[local.e2e_account_id]
}

output "terraform_state_prefix" {
  description = "Environment-isolated state location."
  value       = "gs://${local.state_bucket_name}/phase-07/staging"
}

output "validated_runtime_contract" {
  description = "Applied Cloud Run runtime contract with metadata-only secret versions."
  value       = module.cloud_run_service.validated_contract
}

output "validated_secret_ids" {
  description = "Metadata-only secret container IDs reserved for Part 06."
  value       = module.secret_contract.validated_secret_ids
}

output "cloud_run_service_name" {
  description = "Stable Staging Cloud Run service name."
  value       = module.cloud_run_service.service_name
}

output "cloud_run_service_uri" {
  description = "Applied Staging Cloud Run URI."
  value       = module.cloud_run_service.service_uri
}

output "cloud_run_latest_ready_revision" {
  description = "Latest ready Staging revision."
  value       = module.cloud_run_service.latest_ready_revision
}

output "canonical_service_uri" {
  description = "Predicted deterministic HTTPS origin configured in the application."
  value       = local.canonical_url
}

output "seed_job_name" {
  description = "Private on-demand Staging seed job."
  value       = module.cloud_run_seed_job.job_name
}

check "applied_service_uri_matches_canonical_origin" {
  assert {
    condition     = !var.provision_service || module.cloud_run_service.service_uri == local.canonical_url
    error_message = "Applied Cloud Run URI differs from PUBLIC_WEB_URL/ALLOWED_ORIGINS canonical origin."
  }
}
