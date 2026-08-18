output "artifact_repository" {
  description = "Shared private Artifact Registry repository path."
  value       = local.repository_path
}

output "deployer_service_account" {
  description = "Protected Production deployment service-account email."
  value       = module.iam.deployer_email
}

output "runtime_service_account" {
  description = "Future Production runtime service-account email."
  value       = module.iam.service_account_emails[local.runtime_account_id]
}

output "workload_identity_provider" {
  description = "Full Production WIF provider resource name."
  value       = module.workload_identity.provider_name
}

output "terraform_state_prefix" {
  description = "Production-isolated state location."
  value       = "gs://${local.state_bucket_name}/phase-07/production"
}

output "validated_runtime_contract" {
  description = "Validation-only Production Cloud Run contract."
  value       = module.cloud_run_contract.validated_contract
}
