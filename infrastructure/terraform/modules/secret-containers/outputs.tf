output "validated_secret_ids" {
  description = "Validated metadata-only secret IDs."
  value       = sort(tolist(var.secret_ids))
}

output "secret_names" {
  description = "Provisioned Secret Manager resource names keyed by secret ID; never contains values."
  value       = { for secret_id, secret in google_secret_manager_secret.this : secret_id => secret.name }
}

output "accessor_bindings" {
  description = "Metadata-only least-privilege accessor matrix."
  value = {
    for secret_id, members in var.secret_accessors : secret_id => sort(tolist(members))
  }
}
