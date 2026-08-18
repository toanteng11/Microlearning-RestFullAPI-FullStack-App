variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "environment" {
  description = "Monitoring environment boundary."
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production."
  }
}

variable "resource_prefix" {
  description = "Canonical monitoring resource prefix."
  type        = string

  validation {
    condition     = can(regex("^microlearning-(staging|production)-$", var.resource_prefix))
    error_message = "resource_prefix must follow the canonical environment naming contract."
  }
}

variable "provision" {
  description = "Whether to create Monitoring resources for this environment."
  type        = bool
  default     = true
}

variable "service_name" {
  description = "Cloud Run service name used by metrics and dashboard filters."
  type        = string
  default     = ""
}

variable "service_host" {
  description = "HTTPS host used by the uptime check."
  type        = string
  default     = ""
}

variable "app_version" {
  description = "Release application version shown in the operations dashboard."
  type        = string
  default     = ""
}

variable "commit_sha" {
  description = "Trusted release commit shown in the operations dashboard."
  type        = string
  default     = ""

  validation {
    condition     = var.commit_sha == "" || can(regex("^[a-f0-9]{40}$", var.commit_sha))
    error_message = "commit_sha must be empty or a full lowercase Git SHA."
  }
}

variable "image_digest" {
  description = "Exact image digest shown in the operations dashboard."
  type        = string
  default     = ""

  validation {
    condition     = var.image_digest == "" || can(regex("^sha256:[a-f0-9]{64}$", var.image_digest))
    error_message = "image_digest must be empty or an exact SHA-256 digest."
  }
}

variable "notification_email" {
  description = "Optional owner email for Monitoring notifications; payload is never stored in application config."
  type        = string
  default     = null

  validation {
    condition     = var.notification_email == null || can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", var.notification_email))
    error_message = "notification_email must be a valid email address when provided."
  }
}
