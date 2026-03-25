[CmdletBinding()]
param(
  [string]$SiteUrl,
  [string]$ClientId,

  [ValidateSet("Interactive", "DeviceLogin")]
  [string]$AuthenticationMode = "Interactive",

  [string]$EnvironmentConfigPath,
  [string]$CsvPath = (Join-Path -Path $PSScriptRoot -ChildPath "..\..\samples\csv\meetings.sample.csv")
)

$modulePath = Join-Path -Path $PSScriptRoot -ChildPath "..\..\provisioning\powershell\common\MeetManager.Provisioning.psm1"
Import-Module -Name $modulePath -Force

Assert-MeetManagerPrerequisites
$environmentSettings = if (-not [string]::IsNullOrWhiteSpace($EnvironmentConfigPath)) { Import-MeetManagerEnvironmentSettings -Path $EnvironmentConfigPath } else { $null }
$resolvedSiteUrl = if (-not [string]::IsNullOrWhiteSpace($SiteUrl)) { $SiteUrl } elseif ($null -ne $environmentSettings) { $environmentSettings.siteUrl } else { $null }
$resolvedClientId = if (-not [string]::IsNullOrWhiteSpace($ClientId)) { $ClientId } elseif ($null -ne $environmentSettings) { $environmentSettings.clientId } else { $null }

Connect-MeetManagerSite -SiteUrl $resolvedSiteUrl -ClientId $resolvedClientId -AuthenticationMode $AuthenticationMode

foreach ($row in (Import-Csv -Path $CsvPath)) {
  $roomId = if ([string]::IsNullOrWhiteSpace($row.MMRoomCode)) { $null } else { Resolve-MeetManagerLookupId -ListIdentity "MM_MeetingRooms" -KeyFieldInternalName "MMRoomCode" -KeyValue $row.MMRoomCode }
  $locationId = if ([string]::IsNullOrWhiteSpace($row.MMLocationCode)) { $null } else { Resolve-MeetManagerLookupId -ListIdentity "MM_Locations" -KeyFieldInternalName "MMLocationCode" -KeyValue $row.MMLocationCode }

  $values = @{
    Title = $row.Title
    MMMeetingCode = $row.MMMeetingCode
    MMOrganizer = $row.MMOrganizerEmail
    MMOrganizerEmail = $row.MMOrganizerEmail
    MMStartDate = [datetime]$row.MMStartDate
    MMEndDate = [datetime]$row.MMEndDate
    MMMeetingType = $row.MMMeetingType
    MMWorkflowStatus = $row.MMWorkflowStatus
    MMPriority = $row.MMPriority
    MMRoomLookup = $roomId
    MMLocationLookup = $locationId
    MMTeamsMeetingUrl = $row.MMTeamsMeetingUrl
    MMRequiresRoom = ConvertTo-MeetManagerBoolean -Value $row.MMRequiresRoom
    MMRequiresTeams = ConvertTo-MeetManagerBoolean -Value $row.MMRequiresTeams
    MMHasConflicts = ConvertTo-MeetManagerBoolean -Value $row.MMHasConflicts
    MMSyncStatus = $row.MMSyncStatus
  }

  Ensure-MeetManagerListItem -ListIdentity "MM_Meetings" -KeyFieldInternalName "MMMeetingCode" -KeyValue $row.MMMeetingCode -Values $values
}

Write-MeetManagerLog -Message "Meeting import completed. Ensure organizer accounts already exist in the site collection." -Level INFO
