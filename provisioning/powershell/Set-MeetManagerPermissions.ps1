[CmdletBinding()]
param(
  [string]$SiteUrl,
  [string]$ClientId,

  [ValidateSet("Interactive", "DeviceLogin")]
  [string]$AuthenticationMode = "Interactive",

  [Parameter(Mandatory)]
  [string]$EnvironmentConfigPath
)

$modulePath = Join-Path -Path $PSScriptRoot -ChildPath "common\MeetManager.Provisioning.psm1"
Import-Module -Name $modulePath -Force

Assert-MeetManagerPrerequisites
$environmentSettings = Import-MeetManagerEnvironmentSettings -Path $EnvironmentConfigPath

$resolvedSiteUrl = if (-not [string]::IsNullOrWhiteSpace($SiteUrl)) { $SiteUrl } else { $environmentSettings.siteUrl }
$resolvedClientId = if (-not [string]::IsNullOrWhiteSpace($ClientId)) { $ClientId } else { $environmentSettings.clientId }

Connect-MeetManagerSite -SiteUrl $resolvedSiteUrl -ClientId $resolvedClientId -AuthenticationMode $AuthenticationMode
Set-MeetManagerContainerPermissions -EnvironmentSettings $environmentSettings
Write-MeetManagerLog -Message "Permission application completed." -Level INFO
