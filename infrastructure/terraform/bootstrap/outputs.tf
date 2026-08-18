output "state_bucket_name" {
  description = "Private GCS bucket used by Terraform remote backends."
  value       = google_storage_bucket.terraform_state.name
}

output "enabled_services" {
  description = "Required Google APIs managed by this bootstrap root."
  value       = sort([for service in google_project_service.required : service.service])
}
