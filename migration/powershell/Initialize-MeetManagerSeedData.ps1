[CmdletBinding()]
param(
  [string]$SiteUrl,
  [string]$ClientId,

  [ValidateSet("Interactive", "DeviceLogin")]
  [string]$AuthenticationMode = "Interactive",

  [string]$EnvironmentConfigPath,
  [string]$SeedDataPath = (Join-Path -Path $PSScriptRoot -ChildPath "..\..\samples\json\base-catalogs.sample.json")
)

$modulePath = Join-Path -Path $PSScriptRoot -ChildPath "..\..\provisioning\powershell\common\MeetManager.Provisioning.psm1"
Import-Module -Name $modulePath -Force

Assert-MeetManagerPrerequisites

$environmentSettings = if (-not [string]::IsNullOrWhiteSpace($EnvironmentConfigPath)) { Import-MeetManagerEnvironmentSettings -Path $EnvironmentConfigPath } else { $null }
$resolvedSiteUrl = if (-not [string]::IsNullOrWhiteSpace($SiteUrl)) { $SiteUrl } elseif ($null -ne $environmentSettings) { $environmentSettings.siteUrl } else { $null }
$resolvedClientId = if (-not [string]::IsNullOrWhiteSpace($ClientId)) { $ClientId } elseif ($null -ne $environmentSettings) { $environmentSettings.clientId } else { $null }

Connect-MeetManagerSite -SiteUrl $resolvedSiteUrl -ClientId $resolvedClientId -AuthenticationMode $AuthenticationMode

$seedData = Import-MeetManagerJsonFile -Path $SeedDataPath

foreach ($configuration in $seedData.configurations) {
  $values = @{
    Title = $configuration.Title
    MMConfigurationKey = $configuration.MMConfigurationKey
    MMConfigurationScope = $configuration.MMConfigurationScope
    MMConfigurationType = $configuration.MMConfigurationType
    MMJsonValue = $configuration.MMJsonValue
    MMTextValue = $configuration.MMTextValue
    MMNumberValue = $configuration.MMNumberValue
    MMBooleanValue = $configuration.MMBooleanValue
    MMEnvironmentName = $configuration.MMEnvironmentName
    MMActive = ConvertTo-MeetManagerBoolean -Value $configuration.MMActive
  }

  Ensure-MeetManagerListItem -ListIdentity "MM_MeetingConfigurations" -KeyFieldInternalName "MMConfigurationKey" -KeyValue $configuration.MMConfigurationKey -Values $values
}

Write-MeetManagerLog -Message "Seed data import completed." -Level INFO
