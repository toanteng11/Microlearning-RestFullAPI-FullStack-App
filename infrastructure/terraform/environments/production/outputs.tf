output "artifact_repository" {
  description = "Shared private Artifact Registry repository path."
  value       = local.repository_path
}

output "deployer_service_account" {
  description = "Protected Production deployment service-account email."
  value       = module.iam.deployer_email
}

output "runtime_service_account" {
  description = "Production runtime service-account email."
  value       = module.iam.service_account_emails[local.runtime_account_id]
}

output "workload_identity_provider" {
  description = "Full Production WIF provider resource name."
  value       = module.workload_identity.provider_name
}

output "terraform_state_prefix" {
  description = "Production-isolated state location."
  value       = "gs://${local.state_bucket_name}/phase-08/production"
}

output "validated_runtime_contract" {
  description = "Production Cloud Run runtime contract."
  value       = module.cloud_run_service.validated_contract
}

output "validated_secret_ids" {
  description = "Production-only Secret Manager container IDs."
  value       = module.secret_contract.validated_secret_ids
}

output "cloud_run_service_name" {
  description = "Stable Production Cloud Run service name when provisioned."
  value       = module.cloud_run_service.service_name
}

output "cloud_run_service_uri" {
  description = "Production Cloud Run URI when provisioned."
  value       = module.cloud_run_service.service_uri
}

output "canonical_service_uri" {
  description = "Deterministic Production origin configured in the application."
  value       = local.canonical_url
}

check "applied_service_uri_matches_canonical_origin" {
  assert {
    condition     = !var.provision_service || module.cloud_run_service.service_uri == local.canonical_url
    error_message = "Applied Cloud Run URI differs from the configured Production origin."
  }
}
