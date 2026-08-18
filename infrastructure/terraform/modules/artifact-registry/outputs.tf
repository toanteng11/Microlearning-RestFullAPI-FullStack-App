output "repository_name" {
  description = "Full Artifact Registry repository resource name."
  value       = google_artifact_registry_repository.this.name
}

output "repository_url" {
  description = "Docker repository host/path without an image tag."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.repository_id}"
}

output "image_repository" {
  description = "Canonical image path without tag or digest."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.repository_id}/${var.image_name}"
}

output "cleanup_policy_dry_run" {
  description = "True until cleanup behavior has separate operational evidence."
  value       = google_artifact_registry_repository.this.cleanup_policy_dry_run
}
