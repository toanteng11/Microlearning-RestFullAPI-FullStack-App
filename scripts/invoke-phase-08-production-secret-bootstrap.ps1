[CmdletBinding()]
param(
  [ValidateSet('Plan', 'Apply')]
  [string]$Mode = 'Plan',

  [string]$Confirmation = '',

  [string]$OutputDirectory = 'artifacts/phase-08/production-secret-bootstrap'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$expectedProject = 'microlearning-platform-502716'
$applyConfirmation = 'APPLY_PHASE_08_PRODUCTION_SECRET_CONTAINERS'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$terraformDirectory = Join-Path $repositoryRoot 'infrastructure/terraform/environments/production'
$resolvedOutputDirectory = Join-Path $repositoryRoot $OutputDirectory
$planPath = Join-Path $terraformDirectory 'phase-08-production-secret-bootstrap.tfplan'
$planJsonPath = Join-Path $resolvedOutputDirectory 'plan.json'
$policyReportPath = Join-Path $resolvedOutputDirectory 'policy-report.json'
$summaryPath = Join-Path $resolvedOutputDirectory 'summary.json'
$secretIds = @(
  'ml-production-access-token-secret',
  'ml-production-auth-identity-pepper',
  'ml-production-classroom-code-pepper',
  'ml-production-mongodb-uri'
)

function Invoke-Native {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Command failed with exit code $LASTEXITCODE."
  }
}

function Get-NativeText {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
  )

  $result = (& $Command @Arguments 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0) {
    throw "$Command failed with exit code $LASTEXITCODE. Output: $result"
  }
  return $result
}

function Resolve-ToolPath {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [string[]]$FallbackPaths = @()
  )

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if ($null -ne $command) {
    return $command.Source
  }

  foreach ($path in $FallbackPaths) {
    if (Test-Path -LiteralPath $path) {
      return $path
    }
  }

  throw "Required tool was not found: $Name."
}

if ($Mode -eq 'Apply' -and $Confirmation -ne $applyConfirmation) {
  throw "Apply requires -Confirmation $applyConfirmation."
}

$gcloud = Resolve-ToolPath 'gcloud' @(
  "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
)
$terraform = Resolve-ToolPath 'terraform' @('C:\Tools\terraform.exe')
$node = Resolve-ToolPath 'node'

$activeProject = Get-NativeText $gcloud config get-value project
if ($activeProject -ne $expectedProject) {
  throw "Active gcloud project must be $expectedProject; observed $activeProject."
}

$projectState = Get-NativeText $gcloud projects describe $expectedProject '--format=value(lifecycleState)'
if ($projectState -ne 'ACTIVE') {
  throw "Google Cloud project must be ACTIVE; observed $projectState."
}

$billingEnabled = Get-NativeText $gcloud billing projects describe $expectedProject '--format=value(billingEnabled)'
if ($billingEnabled -ne 'True') {
  throw 'Google Cloud billing must be enabled before Production secret bootstrap.'
}

$activeAccount = Get-NativeText $gcloud auth list '--filter=status:ACTIVE' '--format=value(account)'
if ([string]::IsNullOrWhiteSpace($activeAccount)) {
  throw 'No active gcloud account was found.'
}

if ($Mode -eq 'Apply') {
  $branch = Get-NativeText -Command git -Arguments @('-C', $repositoryRoot, 'branch', '--show-current')
  $status = Get-NativeText -Command git -Arguments @('-C', $repositoryRoot, 'status', '--porcelain')
  $head = Get-NativeText -Command git -Arguments @('-C', $repositoryRoot, 'rev-parse', 'HEAD')
  $originMain = Get-NativeText -Command git -Arguments @('-C', $repositoryRoot, 'rev-parse', 'origin/main')

  if ($branch -ne 'main') {
    throw "Secret bootstrap apply must run from main; observed $branch."
  }
  if (-not [string]::IsNullOrWhiteSpace($status)) {
    throw 'Secret bootstrap apply requires a clean working tree.'
  }
  if ($head -ne $originMain) {
    throw 'Secret bootstrap apply requires HEAD to equal the fetched origin/main commit.'
  }
}

New-Item -ItemType Directory -Force -Path $resolvedOutputDirectory | Out-Null

Push-Location $terraformDirectory
try {
  Invoke-Native $terraform fmt '-check' '-recursive'
  Invoke-Native $terraform init '-input=false' '-reconfigure'
  Invoke-Native $terraform validate
  Invoke-Native $terraform plan '-input=false' '-out=phase-08-production-secret-bootstrap.tfplan' '-var-file=terraform.tfvars.example' '-var=provision_service=false' '-var=provision_secret_containers=false' '-var=bootstrap_secret_containers=true' '-var=provision_monitoring=false'

  $planJson = Get-NativeText $terraform show '-json' $planPath
  [System.IO.File]::WriteAllText(
    $planJsonPath,
    $planJson,
    [System.Text.UTF8Encoding]::new($false)
  )
}
finally {
  Pop-Location
}

try {
  Invoke-Native $node (Join-Path $PSScriptRoot 'check-phase-08-production-secret-bootstrap-plan.mjs') $planJsonPath $policyReportPath
  $policy = Get-Content -LiteralPath $policyReportPath -Raw | ConvertFrom-Json
}
catch {
  Remove-Item -LiteralPath $planPath -Force -ErrorAction SilentlyContinue
  throw
}

$applied = $false
try {
  if ($Mode -eq 'Apply') {
    Push-Location $terraformDirectory
    try {
      Invoke-Native $terraform apply '-input=false' 'phase-08-production-secret-bootstrap.tfplan'
      $applied = $true
    }
    finally {
      Pop-Location
    }
  }
}
finally {
  Remove-Item -LiteralPath $planPath -Force -ErrorAction SilentlyContinue
}

$summary = [ordered]@{
  schemaVersion = 1
  phase = '08'
  recordType = 'PRODUCTION_SECRET_CONTAINER_BOOTSTRAP'
  recordedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
  mode = $Mode.ToUpperInvariant()
  projectId = $expectedProject
  actor = $activeAccount
  policyStatus = $policy.status
  planSha256 = $policy.planSha256
  counts = $policy.counts
  applied = $applied
  secretContainerIds = $secretIds
  secretContainersProvisioned = $applied
  secretVersionsCreated = $false
  secretValuesRead = $false
  productionServiceProvisioned = $false
  monitoringProvisioned = $false
}

[System.IO.File]::WriteAllText(
  $summaryPath,
  (($summary | ConvertTo-Json -Depth 5) + [Environment]::NewLine),
  [System.Text.UTF8Encoding]::new($false)
)

Write-Output "Phase 08 Production secret bootstrap $Mode completed. Summary: $summaryPath"
