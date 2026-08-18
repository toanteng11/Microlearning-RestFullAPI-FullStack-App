output "job_name" {
  description = "Private Staging seed job name."
  value       = var.job_name
}

output "job_resource_name" {
  description = "Applied Cloud Run job resource name."
  value       = var.provision ? google_cloud_run_v2_job.this[0].name : null
}

output "secret_versions" {
  description = "Metadata-only exact versions mounted by the seed job."
  value = {
    for name, reference in var.secret_environment_variables : name => reference.version
  }
}
