[CmdletBinding()]
param(
  [string]$SiteUrl,
  [string]$ClientId,

  [ValidateSet("Interactive", "DeviceLogin")]
  [string]$AuthenticationMode = "Interactive",

  [string]$EnvironmentConfigPath,
  [string]$CsvPath = (Join-Path -Path $PSScriptRoot -ChildPath "..\..\samples\csv\rooms.sample.csv")
)

$modulePath = Join-Path -Path $PSScriptRoot -ChildPath "..\..\provisioning\powershell\common\MeetManager.Provisioning.psm1"
Import-Module -Name $modulePath -Force

Assert-MeetManagerPrerequisites
$environmentSettings = if (-not [string]::IsNullOrWhiteSpace($EnvironmentConfigPath)) { Import-MeetManagerEnvironmentSettings -Path $EnvironmentConfigPath } else { $null }
$resolvedSiteUrl = if (-not [string]::IsNullOrWhiteSpace($SiteUrl)) { $SiteUrl } elseif ($null -ne $environmentSettings) { $environmentSettings.siteUrl } else { $null }
$resolvedClientId = if (-not [string]::IsNullOrWhiteSpace($ClientId)) { $ClientId } elseif ($null -ne $environmentSettings) { $environmentSettings.clientId } else { $null }

Connect-MeetManagerSite -SiteUrl $resolvedSiteUrl -ClientId $resolvedClientId -AuthenticationMode $AuthenticationMode

foreach ($row in (Import-Csv -Path $CsvPath)) {
  $locationId = Resolve-MeetManagerLookupId -ListIdentity "MM_Locations" -KeyFieldInternalName "MMLocationCode" -KeyValue $row.MMLocationCode

  $values = @{
    Title = $row.Title
    MMRoomCode = $row.MMRoomCode
    MMLocationLookup = $locationId
    MMRoomMailbox = $row.MMRoomMailbox
    MMCapacity = [int]$row.MMCapacity
    MMRoomStatus = $row.MMRoomStatus
    MMFloor = $row.MMFloor
    MMZone = $row.MMZone
    MMHasTeamsDevice = ConvertTo-MeetManagerBoolean -Value $row.MMHasTeamsDevice
    MMDefaultEquipmentProfile = ConvertTo-MeetManagerChoiceArray -Value $row.MMDefaultEquipmentProfile
  }

  Ensure-MeetManagerListItem -ListIdentity "MM_MeetingRooms" -KeyFieldInternalName "MMRoomCode" -KeyValue $row.MMRoomCode -Values $values
}

Write-MeetManagerLog -Message "Room import completed." -Level INFO
