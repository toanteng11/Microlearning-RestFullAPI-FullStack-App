$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$bootstrapDirectory = Join-Path $repositoryRoot 'infrastructure/terraform/bootstrap'
$templatePath = Join-Path $bootstrapDirectory 'backend.tf.template'
$backendPath = Join-Path $bootstrapDirectory 'backend.tf'

if (-not (Test-Path -LiteralPath $templatePath)) {
  throw "Missing backend template: $templatePath"
}

if (Test-Path -LiteralPath $backendPath) {
  throw 'backend.tf already exists. Inspect the current backend before attempting another migration.'
}

Copy-Item -LiteralPath $templatePath -Destination $backendPath

Push-Location $bootstrapDirectory
try {
  terraform init -migrate-state
  if ($LASTEXITCODE -ne 0) {
    throw "Terraform backend migration failed with exit code $LASTEXITCODE"
  }
}
finally {
  Pop-Location
}

Write-Output 'Bootstrap state backend migration completed. Verify the GCS state object before cleanup.'
