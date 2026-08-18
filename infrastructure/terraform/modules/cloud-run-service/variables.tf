variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "region" {
  description = "Cloud Run region."
  type        = string
}

variable "environment" {
  description = "Deployment environment."
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production."
  }
}

variable "service_name" {
  description = "Stable Cloud Run service name."
  type        = string
}

variable "image_ref" {
  description = "Immutable Artifact Registry image reference. Tags are forbidden."
  type        = string

  validation {
    condition = can(regex(
      "^[a-z0-9-]+-docker\\.pkg\\.dev/[a-z][a-z0-9-]+/[a-z][a-z0-9-]+/[a-z][a-z0-9-]+@sha256:[a-f0-9]{64}$",
      var.image_ref,
    ))
    error_message = "image_ref must be an Artifact Registry reference ending in @sha256:<64-hex>."
  }
}

variable "runtime_service_account_email" {
  description = "Environment-specific runtime service-account email."
  type        = string
}

variable "max_instances" {
  description = "Bounded maximum instance count."
  type        = number
  default     = 2

  validation {
    condition     = var.max_instances >= 1 && var.max_instances <= 2
    error_message = "Phase 07 max_instances must remain between 1 and 2."
  }
}

variable "container_concurrency" {
  description = "Maximum concurrent requests per instance."
  type        = number
  default     = 20

  validation {
    condition     = var.container_concurrency == 20
    error_message = "Phase 07 baseline requires container_concurrency=20."
  }
}

variable "environment_variables" {
  description = "Explicit non-secret runtime environment variables."
  type        = map(string)
  default     = {}
}

variable "secret_environment_variables" {
  description = "Runtime environment variables mapped to exact Secret Manager versions."
  type = map(object({
    secret_id = string
    version   = string
  }))
  default = {}

  validation {
    condition = alltrue([
      for reference in values(var.secret_environment_variables) : can(regex("^[1-9][0-9]*$", reference.version))
    ])
    error_message = "Every Cloud Run secret reference must use an exact numeric version."
  }
}

variable "labels" {
  description = "Non-sensitive labels applied to the service."
  type        = map(string)
  default     = {}
}

variable "allow_public_invoker" {
  description = "Explicit approval for the public Web/login Cloud Run entry point."
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Protect the stable Cloud Run service from accidental deletion."
  type        = bool
  default     = true
}

variable "provision" {
  description = "Whether to provision the Cloud Run service."
  type        = bool
  default     = true
}
