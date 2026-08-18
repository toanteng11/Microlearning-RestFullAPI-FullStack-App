resource "google_artifact_registry_repository" "this" {
  project       = var.project_id
  location      = var.region
  repository_id = var.repository_id
  description   = "Private immutable OCI images for the Microlearning platform"
  format        = "DOCKER"
  mode          = "STANDARD_REPOSITORY"
  labels        = var.labels

  cleanup_policy_dry_run = true
  deletion_policy        = "PREVENT"

  docker_config {
    immutable_tags = true
  }

  cleanup_policies {
    id     = "keep-rollback-window"
    action = "KEEP"

    most_recent_versions {
      package_name_prefixes = [var.image_name]
      keep_count            = 20
    }
  }

  cleanup_policies {
    id     = "candidate-delete-untagged"
    action = "DELETE"

    condition {
      tag_state  = "UNTAGGED"
      older_than = "2592000s"
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_artifact_registry_repository_iam_member" "writer" {
  for_each = var.writer_members

  project    = var.project_id
  location   = google_artifact_registry_repository.this.location
  repository = google_artifact_registry_repository.this.name
  role       = "roles/artifactregistry.writer"
  member     = each.value
}
