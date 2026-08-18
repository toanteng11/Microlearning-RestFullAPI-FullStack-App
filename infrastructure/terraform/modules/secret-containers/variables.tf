variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "environment" {
  description = "Secret environment boundary."
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production."
  }
}

variable "secret_ids" {
  description = "Secret container IDs only. Secret values are forbidden in Terraform."
  type        = set(string)

  validation {
    condition = alltrue([
      for secret_id in var.secret_ids : can(regex("^ml-(staging|production)-[a-z0-9-]+$", secret_id))
    ])
    error_message = "Every secret ID must use the approved environment prefix."
  }
}

variable "secret_accessors" {
  description = "Secret-level accessor members keyed by secret ID. Values must be IAM member strings, never credentials."
  type        = map(set(string))
  default     = {}

  validation {
    condition = alltrue(flatten([
      for _, members in var.secret_accessors : [
        for member in members : can(regex("^serviceAccount:[a-z][a-z0-9-]+@[a-z][a-z0-9-]+\\.iam\\.gserviceaccount\\.com$", member))
      ]
    ]))
    error_message = "Every accessor must be a serviceAccount IAM member."
  }
}

variable "labels" {
  description = "Non-sensitive labels applied to each secret container."
  type        = map(string)
  default     = {}
}

variable "provision" {
  description = "Whether to provision containers and IAM. Production remains false until Phase 08 approval."
  type        = bool
  default     = true
}
