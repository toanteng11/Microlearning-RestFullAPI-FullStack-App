locals {
  required_services = toset([
    "artifactregistry.googleapis.com",
    "billingbudgets.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "serviceusage.googleapis.com",
    "sts.googleapis.com",
    "storage.googleapis.com",
  ])

  state_bucket_name = "microlearning-tfstate-${var.project_number}"
}

resource "google_project_service" "required" {
  for_each = local.required_services

  project                    = var.project_id
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
}

resource "google_storage_bucket" "terraform_state" {
  project                     = var.project_id
  name                        = local.state_bucket_name
  location                    = upper(var.region)
  storage_class               = "STANDARD"
  force_destroy               = false
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  labels                      = var.labels

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [google_project_service.required["storage.googleapis.com"]]
}
