[CmdletBinding()]
param(
  [string]$SolutionSchemaPath = (Join-Path -Path $PSScriptRoot -ChildPath "..\schema\meet-manager.solution.json"),
  [string]$EnvironmentConfigPath
)

$modulePath = Join-Path -Path $PSScriptRoot -ChildPath "common\MeetManager.Provisioning.psm1"
Import-Module -Name $modulePath -Force

Assert-MeetManagerPrerequisites

if (-not (Test-Path -LiteralPath $SolutionSchemaPath)) {
  throw "Solution schema file '$SolutionSchemaPath' does not exist."
}

$solutionSchema = Import-MeetManagerSolutionSchema -Path $SolutionSchemaPath
Write-MeetManagerLog -Message "Loaded solution schema '$($solutionSchema.solutionName)' with $($solutionSchema.containers.Count) containers." -Level INFO

if (-not [string]::IsNullOrWhiteSpace($EnvironmentConfigPath)) {
  $environmentSettings = Import-MeetManagerEnvironmentSettings -Path $EnvironmentConfigPath
  Write-MeetManagerLog -Message "Loaded environment settings for '$($environmentSettings.environmentName)'." -Level INFO
}

Write-MeetManagerLog -Message "Prerequisite validation completed successfully." -Level INFO
