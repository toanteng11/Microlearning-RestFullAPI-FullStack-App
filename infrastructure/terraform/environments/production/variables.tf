variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
  default     = "microlearning-platform-502716"
}

variable "project_number" {
  description = "Immutable Google Cloud project number."
  type        = string
  default     = "759791798260"
}

variable "region" {
  description = "Canonical Google Cloud region."
  type        = string
  default     = "asia-southeast1"

  validation {
    condition     = var.region == "asia-southeast1"
    error_message = "Phase 07 resources must remain in asia-southeast1."
  }
}

variable "image_ref" {
  description = "Exact Staging-verified digest reserved for future Production promotion."
  type        = string
}

variable "github_repository" {
  description = "Exact GitHub owner/repository claim."
  type        = string
  default     = "toanteng11/Microlearning-RestFullAPI-FullStack-App"
}

variable "github_repository_id" {
  description = "Immutable GitHub repository ID."
  type        = string
  default     = "1298420607"
}

variable "github_repository_owner" {
  description = "Exact GitHub repository owner login."
  type        = string
  default     = "toanteng11"
}

variable "github_repository_owner_id" {
  description = "Immutable GitHub owner ID."
  type        = string
  default     = "237665091"
}
