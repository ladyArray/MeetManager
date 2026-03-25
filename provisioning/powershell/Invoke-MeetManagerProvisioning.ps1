[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$SiteUrl,
  [string]$ClientId,

  [ValidateSet("Interactive", "DeviceLogin")]
  [string]$AuthenticationMode = "Interactive",

  [string]$SolutionSchemaPath = (Join-Path -Path $PSScriptRoot -ChildPath "..\schema\meet-manager.solution.json"),
  [string]$EnvironmentConfigPath,

  [switch]$ProvisionContentTypes,
  [switch]$ApplyPermissions
)

$modulePath = Join-Path -Path $PSScriptRoot -ChildPath "common\MeetManager.Provisioning.psm1"
Import-Module -Name $modulePath -Force

Assert-MeetManagerPrerequisites
$solutionSchema = Import-MeetManagerSolutionSchema -Path $SolutionSchemaPath

$environmentSettings = $null
if (-not [string]::IsNullOrWhiteSpace($EnvironmentConfigPath)) {
  $environmentSettings = Import-MeetManagerEnvironmentSettings -Path $EnvironmentConfigPath
}

$resolvedSiteUrl = if (-not [string]::IsNullOrWhiteSpace($SiteUrl)) { $SiteUrl } elseif ($null -ne $environmentSettings) { $environmentSettings.siteUrl } else { $null }
$resolvedClientId = if (-not [string]::IsNullOrWhiteSpace($ClientId)) { $ClientId } elseif ($null -ne $environmentSettings) { $environmentSettings.clientId } else { $null }

if ([string]::IsNullOrWhiteSpace($resolvedSiteUrl)) {
  throw "A SiteUrl is required. Pass -SiteUrl or provide it in the environment settings file."
}

Connect-MeetManagerSite -SiteUrl $resolvedSiteUrl -ClientId $resolvedClientId -AuthenticationMode $AuthenticationMode

foreach ($container in $solutionSchema.containers) {
  if ($PSCmdlet.ShouldProcess($container.internalName, "Provision container")) {
    Ensure-MeetManagerContainer -Container $container -FieldGroup $solutionSchema.fieldGroup
  }
}

if ($ProvisionContentTypes.IsPresent -and $PSCmdlet.ShouldProcess($solutionSchema.contentTypeSchemaPath, "Provision content types")) {
  Ensure-MeetManagerContentTypes -Path $solutionSchema.contentTypeSchemaPath
}

if ($ApplyPermissions.IsPresent) {
  if ($null -eq $environmentSettings) {
    throw "Environment settings are required when -ApplyPermissions is used."
  }

  if ($PSCmdlet.ShouldProcess($environmentSettings.environmentName, "Apply list and library permissions")) {
    Set-MeetManagerContainerPermissions -EnvironmentSettings $environmentSettings
  }
}

Write-MeetManagerLog -Message "Provisioning completed successfully." -Level INFO
