check "secret_environment_boundary" {
  assert {
    condition = alltrue([
      for secret_id in var.secret_ids : startswith(secret_id, "ml-${var.environment}-")
    ])
    error_message = "Every secret ID must match the selected environment."
  }
}

check "accessor_secret_boundary" {
  assert {
    condition = alltrue([
      for secret_id in keys(var.secret_accessors) : contains(var.secret_ids, secret_id)
    ])
    error_message = "Every secret_accessors key must exist in secret_ids."
  }
}

locals {
  accessor_bindings = {
    for binding in flatten([
      for secret_id, members in var.secret_accessors : [
        for member in members : {
          secret_id = secret_id
          member    = member
        }
      ]
    ]) : "${binding.secret_id}|${binding.member}" => binding
  }
}

resource "google_secret_manager_secret" "this" {
  for_each = var.provision ? var.secret_ids : toset([])

  project   = var.project_id
  secret_id = each.value
  labels    = var.labels

  replication {
    auto {}
  }

  deletion_protection = true

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_secret_manager_secret_iam_member" "accessor" {
  for_each = var.provision ? local.accessor_bindings : {}

  project   = var.project_id
  secret_id = google_secret_manager_secret.this[each.value.secret_id].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = each.value.member
}
