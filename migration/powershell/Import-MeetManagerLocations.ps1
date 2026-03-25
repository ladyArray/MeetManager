[CmdletBinding()]
param(
  [string]$SiteUrl,
  [string]$ClientId,

  [ValidateSet("Interactive", "DeviceLogin")]
  [string]$AuthenticationMode = "Interactive",

  [string]$EnvironmentConfigPath,
  [string]$CsvPath = (Join-Path -Path $PSScriptRoot -ChildPath "..\..\samples\csv\locations.sample.csv")
)

$modulePath = Join-Path -Path $PSScriptRoot -ChildPath "..\..\provisioning\powershell\common\MeetManager.Provisioning.psm1"
Import-Module -Name $modulePath -Force

Assert-MeetManagerPrerequisites
$environmentSettings = if (-not [string]::IsNullOrWhiteSpace($EnvironmentConfigPath)) { Import-MeetManagerEnvironmentSettings -Path $EnvironmentConfigPath } else { $null }
$resolvedSiteUrl = if (-not [string]::IsNullOrWhiteSpace($SiteUrl)) { $SiteUrl } elseif ($null -ne $environmentSettings) { $environmentSettings.siteUrl } else { $null }
$resolvedClientId = if (-not [string]::IsNullOrWhiteSpace($ClientId)) { $ClientId } elseif ($null -ne $environmentSettings) { $environmentSettings.clientId } else { $null }

Connect-MeetManagerSite -SiteUrl $resolvedSiteUrl -ClientId $resolvedClientId -AuthenticationMode $AuthenticationMode

foreach ($row in (Import-Csv -Path $CsvPath)) {
  $values = @{
    Title = $row.Title
    MMLocationCode = $row.MMLocationCode
    MMCampus = $row.MMCampus
    MMBuilding = $row.MMBuilding
    MMCity = $row.MMCity
    MMCountry = $row.MMCountry
    MMTimezone = $row.MMTimezone
    MMActive = ConvertTo-MeetManagerBoolean -Value $row.MMActive
  }

  Ensure-MeetManagerListItem -ListIdentity "MM_Locations" -KeyFieldInternalName "MMLocationCode" -KeyValue $row.MMLocationCode -Values $values
}

Write-MeetManagerLog -Message "Location import completed." -Level INFO
