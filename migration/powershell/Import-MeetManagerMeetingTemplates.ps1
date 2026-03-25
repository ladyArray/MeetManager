[CmdletBinding()]
param(
  [string]$SiteUrl,
  [string]$ClientId,

  [ValidateSet("Interactive", "DeviceLogin")]
  [string]$AuthenticationMode = "Interactive",

  [string]$EnvironmentConfigPath,
  [string]$CsvPath = (Join-Path -Path $PSScriptRoot -ChildPath "..\..\samples\csv\meeting-templates.sample.csv")
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
    MMTemplateCode = $row.MMTemplateCode
    MMMeetingTypeDefault = $row.MMMeetingTypeDefault
    MMDurationMinutes = [int]$row.MMDurationMinutes
    MMDefaultPriority = $row.MMDefaultPriority
    MMDefaultTeamsEnabled = ConvertTo-MeetManagerBoolean -Value $row.MMDefaultTeamsEnabled
    MMDefaultRoomRequired = ConvertTo-MeetManagerBoolean -Value $row.MMDefaultRoomRequired
    MMCategory = $row.MMCategory
    MMActive = ConvertTo-MeetManagerBoolean -Value $row.MMActive
  }

  Ensure-MeetManagerListItem -ListIdentity "MM_MeetingTemplates" -KeyFieldInternalName "MMTemplateCode" -KeyValue $row.MMTemplateCode -Values $values
}

Write-MeetManagerLog -Message "Meeting template import completed." -Level INFO
