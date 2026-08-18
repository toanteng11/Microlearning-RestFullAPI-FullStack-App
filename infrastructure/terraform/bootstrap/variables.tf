variable "project_id" {
  description = "Google Cloud project ID that owns the Microlearning resources."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "project_id must be a valid Google Cloud project ID."
  }
}

variable "project_number" {
  description = "Numeric Google Cloud project number used for globally unique resource names."
  type        = string

  validation {
    condition     = can(regex("^[0-9]{6,20}$", var.project_number))
    error_message = "project_number must contain only 6 to 20 digits."
  }
}

variable "region" {
  description = "Primary Google Cloud region."
  type        = string
  default     = "asia-southeast1"

  validation {
    condition     = var.region == "asia-southeast1"
    error_message = "Phase 07 is approved only for asia-southeast1."
  }
}

variable "labels" {
  description = "Non-sensitive labels applied to bootstrap resources."
  type        = map(string)
  default = {
    app                 = "microlearning"
    environment         = "shared"
    managed_by          = "terraform"
    phase               = "phase-07"
    owner               = "project-owner"
    cost_center         = "student-project"
    data_classification = "synthetic"
  }
}
