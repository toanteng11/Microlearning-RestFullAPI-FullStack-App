output "validated_contract" {
  description = "Validated inputs reserved for Part 08 resource implementation."
  value = {
    project_id                    = var.project_id
    region                        = var.region
    environment                   = var.environment
    service_name                  = var.service_name
    image_ref                     = var.image_ref
    runtime_service_account_email = var.runtime_service_account_email
    max_instances                 = var.max_instances
    container_concurrency         = var.container_concurrency
    secret_versions = {
      for name, reference in var.secret_environment_variables : name => reference.version
    }
  }
}

output "service_uri" {
  description = "Applied Cloud Run service URI."
  value       = var.provision ? google_cloud_run_v2_service.this[0].uri : null
}

output "latest_ready_revision" {
  description = "Latest ready Cloud Run revision after apply."
  value       = var.provision ? google_cloud_run_v2_service.this[0].latest_ready_revision : null
}

output "service_name" {
  description = "Stable Cloud Run service name."
  value       = var.service_name
}
