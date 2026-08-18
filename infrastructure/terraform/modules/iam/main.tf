check "deployer_exists" {
  assert {
    condition     = contains(keys(var.service_accounts), var.deployer_account_id)
    error_message = "deployer_account_id must exist in service_accounts."
  }
}

check "act_as_accounts_exist" {
  assert {
    condition = alltrue([
      for account_id in var.deployer_act_as_account_ids : contains(keys(var.service_accounts), account_id)
    ])
    error_message = "Every deployer actAs target must exist in service_accounts."
  }
}

check "deployer_cannot_act_as_itself" {
  assert {
    condition     = !contains(var.deployer_act_as_account_ids, var.deployer_account_id)
    error_message = "The deployer must not receive an unnecessary self actAs binding."
  }
}

resource "google_service_account" "this" {
  for_each = var.service_accounts

  project      = var.project_id
  account_id   = each.key
  display_name = each.value.display_name
  description  = each.value.description
  disabled     = false

  deletion_policy = "PREVENT"

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_project_iam_member" "deployer_project_roles" {
  for_each = var.deployer_project_roles

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.this[var.deployer_account_id].email}"
}

resource "google_service_account_iam_member" "deployer_act_as" {
  for_each = var.deployer_act_as_account_ids

  service_account_id = google_service_account.this[each.value].name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.this[var.deployer_account_id].email}"
}
