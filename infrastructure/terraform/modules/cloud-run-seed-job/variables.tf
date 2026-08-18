variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "region" {
  description = "Cloud Run job region."
  type        = string
}

variable "environment" {
  description = "Seed environment; Phase 07 permits Staging only."
  type        = string

  validation {
    condition     = var.environment == "staging"
    error_message = "The Phase 07 seed job is Staging-only."
  }
}

variable "job_name" {
  description = "Stable private Cloud Run job name."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,47}[a-z0-9]$", var.job_name))
    error_message = "job_name must be a valid Cloud Run job name no longer than 49 characters."
  }
}

variable "image_ref" {
  description = "The exact immutable digest used by the application service."
  type        = string

  validation {
    condition = can(regex(
      "^[a-z0-9-]+-docker\\.pkg\\.dev/[a-z][a-z0-9-]+/[a-z][a-z0-9-]+/[a-z][a-z0-9-]+@sha256:[a-f0-9]{64}$",
      var.image_ref,
    ))
    error_message = "image_ref must be an Artifact Registry reference ending in @sha256:<64-hex>."
  }
}

variable "service_account_email" {
  description = "Dedicated Staging seed-job service account."
  type        = string
}

variable "environment_variables" {
  description = "Explicit non-secret seed runtime variables."
  type        = map(string)
}

variable "secret_environment_variables" {
  description = "Seed variables mapped to exact Secret Manager versions."
  type = map(object({
    secret_id = string
    version   = string
  }))

  validation {
    condition = alltrue([
      for reference in values(var.secret_environment_variables) : can(regex("^[1-9][0-9]*$", reference.version))
    ])
    error_message = "Every seed secret reference must use an exact numeric version."
  }
}

variable "labels" {
  description = "Non-sensitive job labels."
  type        = map(string)
  default     = {}
}

variable "provision" {
  description = "Whether to provision the private seed job."
  type        = bool
  default     = true
}
