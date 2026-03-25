[CmdletBinding()]
param(
  [string]$SiteUrl,
  [string]$ClientId,

  [ValidateSet("Interactive", "DeviceLogin")]
  [string]$AuthenticationMode = "Interactive",

  [string]$EnvironmentConfigPath,
  [string]$ResourceCsvPath = (Join-Path -Path $PSScriptRoot -ChildPath "..\..\samples\csv\room-resources.sample.csv"),
  [string]$AssignmentCsvPath = (Join-Path -Path $PSScriptRoot -ChildPath "..\..\samples\csv\room-resource-assignments.sample.csv")
)

$modulePath = Join-Path -Path $PSScriptRoot -ChildPath "..\..\provisioning\powershell\common\MeetManager.Provisioning.psm1"
Import-Module -Name $modulePath -Force

Assert-MeetManagerPrerequisites
$environmentSettings = if (-not [string]::IsNullOrWhiteSpace($EnvironmentConfigPath)) { Import-MeetManagerEnvironmentSettings -Path $EnvironmentConfigPath } else { $null }
$resolvedSiteUrl = if (-not [string]::IsNullOrWhiteSpace($SiteUrl)) { $SiteUrl } elseif ($null -ne $environmentSettings) { $environmentSettings.siteUrl } else { $null }
$resolvedClientId = if (-not [string]::IsNullOrWhiteSpace($ClientId)) { $ClientId } elseif ($null -ne $environmentSettings) { $environmentSettings.clientId } else { $null }

Connect-MeetManagerSite -SiteUrl $resolvedSiteUrl -ClientId $resolvedClientId -AuthenticationMode $AuthenticationMode

foreach ($row in (Import-Csv -Path $ResourceCsvPath)) {
  $values = @{
    Title = $row.Title
    MMResourceCode = $row.MMResourceCode
    MMResourceType = $row.MMResourceType
    MMCategory = $row.MMCategory
    MMDescription = $row.MMDescription
    MMDefaultQuantity = [int]$row.MMDefaultQuantity
    MMIsBookable = ConvertTo-MeetManagerBoolean -Value $row.MMIsBookable
    MMActive = ConvertTo-MeetManagerBoolean -Value $row.MMActive
  }

  Ensure-MeetManagerListItem -ListIdentity "MM_RoomResources" -KeyFieldInternalName "MMResourceCode" -KeyValue $row.MMResourceCode -Values $values
}

foreach ($row in (Import-Csv -Path $AssignmentCsvPath)) {
  $roomId = Resolve-MeetManagerLookupId -ListIdentity "MM_MeetingRooms" -KeyFieldInternalName "MMRoomCode" -KeyValue $row.MMRoomCode
  $resourceId = Resolve-MeetManagerLookupId -ListIdentity "MM_RoomResources" -KeyFieldInternalName "MMResourceCode" -KeyValue $row.MMResourceCode

  $values = @{
    Title = $row.Title
    MMRoomLookup = $roomId
    MMResourceLookup = $resourceId
    MMQuantity = [int]$row.MMQuantity
    MMIsOperational = ConvertTo-MeetManagerBoolean -Value $row.MMIsOperational
    MMInventoryCode = $row.MMInventoryCode
  }

  Ensure-MeetManagerListItem -ListIdentity "MM_RoomResourceAssignments" -KeyFieldInternalName "Title" -KeyValue $row.Title -Values $values
}

Write-MeetManagerLog -Message "Room resource import completed." -Level INFO
