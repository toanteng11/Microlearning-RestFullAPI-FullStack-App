[CmdletBinding()]
param(
  [ValidateSet('Plan', 'Apply')]
  [string]$Mode = 'Plan',

  [string]$Confirmation = '',

  [switch]$ConfigureGitHubEnvironment,

  [string]$OutputDirectory = 'artifacts/phase-08/production-bootstrap'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$expectedProject = 'microlearning-platform-502716'
$expectedRegion = 'asia-southeast1'
$expectedRepository = 'toanteng11/Microlearning-RestFullAPI-FullStack-App'
$applyConfirmation = 'APPLY_PHASE_08_PRODUCTION_BOOTSTRAP'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$terraformDirectory = Join-Path $repositoryRoot 'infrastructure/terraform/environments/production'
$resolvedOutputDirectory = Join-Path $repositoryRoot $OutputDirectory
$planPath = Join-Path $terraformDirectory 'phase-08-production-bootstrap.tfplan'
$planJsonPath = Join-Path $resolvedOutputDirectory 'plan.json'
$policyReportPath = Join-Path $resolvedOutputDirectory 'policy-report.json'
$summaryPath = Join-Path $resolvedOutputDirectory 'summary.json'

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
if ($Mode -eq 'Plan' -and $ConfigureGitHubEnvironment) {
  throw '-ConfigureGitHubEnvironment is only valid with -Mode Apply.'
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
  throw 'Google Cloud billing must be enabled before Production bootstrap.'
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
    throw "Bootstrap apply must run from main; observed $branch."
  }
  if (-not [string]::IsNullOrWhiteSpace($status)) {
    throw 'Bootstrap apply requires a clean working tree.'
  }
  if ($head -ne $originMain) {
    throw 'Bootstrap apply requires HEAD to equal the fetched origin/main commit.'
  }
}

New-Item -ItemType Directory -Force -Path $resolvedOutputDirectory | Out-Null

Push-Location $terraformDirectory
try {
  Invoke-Native $terraform fmt '-check' '-recursive'
  Invoke-Native $terraform init '-input=false' '-reconfigure'
  Invoke-Native $terraform validate
  Invoke-Native $terraform plan '-input=false' '-out=phase-08-production-bootstrap.tfplan' '-var-file=terraform.tfvars.example' '-var=provision_service=false' '-var=provision_secret_containers=false' '-var=provision_monitoring=false'

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
  Invoke-Native $node (Join-Path $PSScriptRoot 'check-phase-08-production-bootstrap-plan.mjs') $planJsonPath $policyReportPath
  $policy = Get-Content -LiteralPath $policyReportPath -Raw | ConvertFrom-Json
}
catch {
  Remove-Item -LiteralPath $planPath -Force -ErrorAction SilentlyContinue
  throw
}

$applied = $false
$githubConfigured = $false
$provider = $null
$deployer = $null

try {
  if ($Mode -eq 'Apply') {
    Push-Location $terraformDirectory
    try {
      Invoke-Native $terraform apply '-input=false' 'phase-08-production-bootstrap.tfplan'
      $provider = Get-NativeText $terraform output '-raw' 'workload_identity_provider'
      $deployer = Get-NativeText $terraform output '-raw' 'deployer_service_account'
      $applied = $true
    }
    finally {
      Pop-Location
    }

    if ($ConfigureGitHubEnvironment) {
      $gh = Resolve-ToolPath 'gh' @('C:\Program Files\GitHub CLI\gh.exe')
      Invoke-Native $gh variable set 'GCP_PROJECT_ID' '--env' 'production' '--repo' $expectedRepository '--body' $expectedProject
      Invoke-Native $gh variable set 'GCP_REGION' '--env' 'production' '--repo' $expectedRepository '--body' $expectedRegion
      Invoke-Native $gh variable set 'GAR_REPOSITORY' '--env' 'production' '--repo' $expectedRepository '--body' 'microlearning'
      Invoke-Native $gh variable set 'CLOUD_RUN_SERVICE' '--env' 'production' '--repo' $expectedRepository '--body' 'microlearning-production'
      Invoke-Native $gh variable set 'TF_STATE_PREFIX' '--env' 'production' '--repo' $expectedRepository '--body' 'phase-08/production'
      Invoke-Native $gh variable set 'GCP_WORKLOAD_IDENTITY_PROVIDER_PRODUCTION' '--env' 'production' '--repo' $expectedRepository '--body' $provider
      Invoke-Native $gh variable set 'GCP_DEPLOY_SERVICE_ACCOUNT_PRODUCTION' '--env' 'production' '--repo' $expectedRepository '--body' $deployer
      $githubConfigured = $true
    }
  }
}
finally {
  Remove-Item -LiteralPath $planPath -Force -ErrorAction SilentlyContinue
}

$summary = [ordered]@{
  schemaVersion = 1
  phase = '08'
  recordType = 'PRODUCTION_BOOTSTRAP'
  recordedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
  mode = $Mode.ToUpperInvariant()
  projectId = $expectedProject
  region = $expectedRegion
  actor = $activeAccount
  policyStatus = $policy.status
  planSha256 = $policy.planSha256
  counts = $policy.counts
  applied = $applied
  githubEnvironmentConfigured = $githubConfigured
  workloadIdentityProvider = $provider
  deployerServiceAccount = $deployer
  secretValuesRead = $false
  productionServiceProvisioned = $false
}

[System.IO.File]::WriteAllText(
  $summaryPath,
  (($summary | ConvertTo-Json -Depth 5) + [Environment]::NewLine),
  [System.Text.UTF8Encoding]::new($false)
)

Write-Output "Phase 08 Production bootstrap $Mode completed. Summary: $summaryPath"
