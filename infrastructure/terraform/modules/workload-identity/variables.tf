variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "pool_id" {
  description = "Stable Workload Identity Pool ID."
  type        = string
}

variable "provider_id" {
  description = "Stable GitHub OIDC provider ID."
  type        = string
}

variable "deployer_service_account_name" {
  description = "Full resource name of the service account trusted by this provider."
  type        = string
}

variable "github_repository" {
  description = "Exact owner/repository claim."
  type        = string
}

variable "github_repository_id" {
  description = "Immutable numeric GitHub repository ID."
  type        = string

  validation {
    condition     = can(regex("^[0-9]+$", var.github_repository_id))
    error_message = "github_repository_id must be numeric."
  }
}

variable "github_repository_owner" {
  description = "Exact GitHub repository owner login."
  type        = string
}

variable "github_repository_owner_id" {
  description = "Immutable numeric GitHub repository owner ID."
  type        = string

  validation {
    condition     = can(regex("^[0-9]+$", var.github_repository_owner_id))
    error_message = "github_repository_owner_id must be numeric."
  }
}

variable "github_environment" {
  description = "Protected GitHub environment included in the OIDC subject."
  type        = string
}

variable "github_ref" {
  description = "Only Git ref admitted by the provider."
  type        = string
  default     = "refs/heads/main"
}

variable "allowed_workflow_refs" {
  description = "Exact workflow_ref claims admitted by the provider."
  type        = set(string)

  validation {
    condition = length(var.allowed_workflow_refs) > 0 && alltrue([
      for workflow_ref in var.allowed_workflow_refs : endswith(workflow_ref, "@refs/heads/main")
    ])
    error_message = "At least one workflow on refs/heads/main must be admitted."
  }
}
