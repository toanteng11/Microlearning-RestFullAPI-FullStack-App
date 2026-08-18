output "pool_name" {
  description = "Full Workload Identity Pool resource name."
  value       = google_iam_workload_identity_pool.github.name
}

output "provider_name" {
  description = "Full provider resource name consumed by google-github-actions/auth."
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "expected_subject" {
  description = "Exact GitHub OIDC subject admitted by this provider."
  value       = local.expected_subject
}

output "attribute_condition" {
  description = "Auditable trust condition. Contains identifiers but no credentials."
  value       = local.attribute_condition
}
