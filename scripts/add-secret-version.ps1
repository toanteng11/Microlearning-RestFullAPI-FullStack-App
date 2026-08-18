[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^ml-(staging|production)-[a-z0-9-]+$')]
  [string]$SecretId,

  [ValidatePattern('^[a-z][a-z0-9-]{4,28}[a-z0-9]$')]
  [string]$ProjectId = 'microlearning-platform-502716'
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command gcloud.cmd -ErrorAction SilentlyContinue)) {
  throw 'gcloud.cmd is not available on PATH.'
}

$configuredProject = (& gcloud.cmd config get-value project 2>$null).Trim()
if ($configuredProject -ne $ProjectId) {
  throw "Active gcloud project is '$configuredProject'; expected '$ProjectId'."
}

& gcloud.cmd secrets describe $SecretId --project $ProjectId --format='value(name)' *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Secret container '$SecretId' does not exist. Apply the reviewed Terraform secret-container plan first."
}

$secureValue = Read-Host "Enter a new value for $SecretId" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
$plainValue = $null

try {
  $plainValue = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  if ([Text.Encoding]::UTF8.GetByteCount($plainValue) -lt 32) {
    throw 'Secret values must contain at least 32 UTF-8 bytes.'
  }

  $gcloudPath = (Get-Command gcloud.cmd).Source
  $startInfo = [Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName = $env:ComSpec
  $startInfo.Arguments = "/d /s /c `"`"$gcloudPath`" secrets versions add $SecretId --project $ProjectId --data-file=- --quiet`""
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardInput = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true

  $process = [Diagnostics.Process]::Start($startInfo)
  $process.StandardInput.Write($plainValue)
  $process.StandardInput.Close()
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  if ($process.ExitCode -ne 0) {
    throw "gcloud failed to add the secret version: $stderr"
  }

  $version = (& gcloud.cmd secrets versions list $SecretId --project $ProjectId --limit 1 --sort-by='~createTime' --format='value(name)').Trim()
  [pscustomobject]@{
    event     = 'secret.version.created'
    projectId = $ProjectId
    secretId  = $SecretId
    version   = $version
  } | ConvertTo-Json -Compress
}
finally {
  $plainValue = $null
  if ($bstr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}
