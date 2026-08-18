terraform {
  backend "gcs" {
    bucket = "microlearning-tfstate-759791798260"
    prefix = "phase-07/production"
  }
}
