variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "service_accounts" {
  description = "Service accounts keyed by their stable account_id."
  type = map(object({
    display_name = string
    description  = string
  }))

  validation {
    condition = alltrue([
      for account_id in keys(var.service_accounts) : can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", account_id))
    ])
    error_message = "Every service-account key must be a valid Google account_id."
  }
}

variable "deployer_account_id" {
  description = "Account ID that receives bounded deployment permissions."
  type        = string
}

variable "deployer_project_roles" {
  description = "Reviewed predefined project roles granted to the deployer."
  type        = set(string)
  default     = []

  validation {
    condition = alltrue([
      for role in var.deployer_project_roles : startswith(role, "roles/")
      ]) && alltrue([
      for forbidden_role in [
        "roles/editor",
        "roles/owner",
        "roles/secretmanager.admin",
        "roles/secretmanager.secretAccessor",
        "roles/secretmanager.secretVersionAdder",
      ] : !contains(var.deployer_project_roles, forbidden_role)
    ])
    error_message = "Only reviewed predefined roles are accepted; broad roles and secret-payload roles are forbidden."
  }
}

variable "deployer_act_as_account_ids" {
  description = "Service account IDs the deployer may attach to Cloud Run resources."
  type        = set(string)
  default     = []
}
