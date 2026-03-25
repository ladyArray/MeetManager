[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$SiteUrl,

  [string]$ClientId,

  [ValidateSet("Interactive", "DeviceLogin")]
  [string]$AuthenticationMode = "Interactive",

  [string]$ContentTypeSchemaPath = (Join-Path -Path $PSScriptRoot -ChildPath "..\schema\meet-manager.content-types.json")
)

$modulePath = Join-Path -Path $PSScriptRoot -ChildPath "common\MeetManager.Provisioning.psm1"
Import-Module -Name $modulePath -Force

Assert-MeetManagerPrerequisites
Connect-MeetManagerSite -SiteUrl $SiteUrl -ClientId $ClientId -AuthenticationMode $AuthenticationMode
Ensure-MeetManagerContentTypes -Path $ContentTypeSchemaPath
Write-MeetManagerLog -Message "Content type provisioning completed." -Level INFO
