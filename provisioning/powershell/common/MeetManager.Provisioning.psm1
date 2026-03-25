Set-StrictMode -Version Latest

function Write-MeetManagerLog {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string]$Message,

    [ValidateSet("INFO", "WARN", "ERROR", "DEBUG")]
    [string]$Level = "INFO"
  )

  $timestamp = Get-Date -Format "s"
  Write-Information "[$timestamp][$Level] $Message" -InformationAction Continue
}

function Assert-MeetManagerPrerequisites {
  [CmdletBinding()]
  param()

  if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
    throw "PnP.PowerShell module was not found. Install it with: Install-Module PnP.PowerShell -Scope CurrentUser"
  }
}

function Import-MeetManagerJsonFile {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "The file '$Path' does not exist."
  }

  return Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -Depth 100
}

function Import-MeetManagerSolutionSchema {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string]$Path
  )

  $solutionSchema = Import-MeetManagerJsonFile -Path $Path
  $baseFolder = Split-Path -Path $Path -Parent
  $containers = [System.Collections.Generic.List[object]]::new()

  foreach ($schemaFile in $solutionSchema.schemaFiles) {
    $fullSchemaPath = Join-Path -Path $baseFolder -ChildPath $schemaFile
    $partialContainers = Import-MeetManagerJsonFile -Path $fullSchemaPath

    foreach ($container in $partialContainers) {
      $containers.Add($container)
    }
  }

  return [PSCustomObject]@{
    solutionName = $solutionSchema.solutionName
    fieldGroup = $solutionSchema.fieldGroup
    contentTypeSchemaPath = Join-Path -Path $baseFolder -ChildPath $solutionSchema.contentTypeSchemaFile
    containers = $containers
  }
}

function Import-MeetManagerEnvironmentSettings {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string]$Path
  )

  return Import-MeetManagerJsonFile -Path $Path
}

function Connect-MeetManagerSite {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string]$SiteUrl,

    [ValidateSet("Interactive", "DeviceLogin")]
    [string]$AuthenticationMode = "Interactive",

    [string]$ClientId
  )

  $resolvedClientId = $ClientId
  if ([string]::IsNullOrWhiteSpace($resolvedClientId)) {
    $resolvedClientId = $env:ENTRAID_APP_ID
  }

  if ([string]::IsNullOrWhiteSpace($resolvedClientId)) {
    throw "A ClientId is required. Pass -ClientId or set the ENTRAID_APP_ID environment variable."
  }

  Write-MeetManagerLog -Message "Connecting to site '$SiteUrl' using mode '$AuthenticationMode'." -Level INFO

  if ($AuthenticationMode -eq "DeviceLogin") {
    Connect-PnPOnline -Url $SiteUrl -ClientId $resolvedClientId -DeviceLogin | Out-Null
    return
  }

  Connect-PnPOnline -Url $SiteUrl -ClientId $resolvedClientId -Interactive | Out-Null
}

function ConvertTo-MeetManagerXmlBoolean {
  [CmdletBinding()]
  param(
    [AllowNull()]
    [object]$Value
  )

  if ($null -eq $Value) {
    return "FALSE"
  }

  return ([bool]$Value).ToString().ToUpperInvariant()
}

function ConvertTo-MeetManagerChoiceArray {
  [CmdletBinding()]
  param(
    [AllowNull()]
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $null
  }

  return @(
    $Value -split ";" |
      ForEach-Object { $_.Trim() } |
      Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
  )
}

function ConvertTo-MeetManagerBoolean {
  [CmdletBinding()]
  param(
    [AllowNull()]
    [object]$Value
  )

  if ($null -eq $Value) {
    return $false
  }

  if ($Value -is [bool]) {
    return $Value
  }

  $normalized = $Value.ToString().Trim().ToLowerInvariant()
  return $normalized -in @("1", "true", "yes", "y", "si", "sí")
}

function Escape-MeetManagerXmlValue {
  [CmdletBinding()]
  param(
    [AllowNull()]
    [object]$Value
  )

  if ($null -eq $Value) {
    return ""
  }

  return [System.Security.SecurityElement]::Escape($Value.ToString())
}

function Get-MeetManagerContainer {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string]$Identity
  )

  $lists = Get-PnPList
  return $lists | Where-Object {
    $_.Title -eq $Identity -or $_.RootFolder.Name -eq $Identity
  } | Select-Object -First 1
}

function Resolve-MeetManagerLookupListId {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string]$ListIdentity
  )

  $list = Get-MeetManagerContainer -Identity $ListIdentity
  if ($null -eq $list) {
    throw "Lookup list '$ListIdentity' was not found."
  }

  return $list.Id.ToString("B")
}

function New-MeetManagerFieldXml {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [pscustomobject]$Field,

    [Parameter(Mandatory)]
    [string]$FieldGroup
  )

  $fieldId = [guid]::NewGuid().ToString("B")
  $name = $Field.internalName
  $displayName = Escape-MeetManagerXmlValue -Value $Field.displayName
  $description = if ($Field.PSObject.Properties.Name -contains "description") {
    " Description=""$(Escape-MeetManagerXmlValue -Value $Field.description)"""
  }
  else {
    ""
  }
  $required = ConvertTo-MeetManagerXmlBoolean -Value ($Field.required)
  $indexed = ConvertTo-MeetManagerXmlBoolean -Value ($Field.indexed)
  $group = Escape-MeetManagerXmlValue -Value $FieldGroup

  switch ($Field.type) {
    "Text" {
      $maxLength = if ($Field.PSObject.Properties.Name -contains "maxLength") {
        " MaxLength=""$($Field.maxLength)"""
      }
      else {
        ""
      }
      return "<Field Type=""Text"" ID=""$fieldId"" Name=""$name"" StaticName=""$name"" DisplayName=""$displayName"" Group=""$group"" Required=""$required"" Indexed=""$indexed""$maxLength$description />"
    }
    "Note" {
      $numberOfLines = if ($Field.PSObject.Properties.Name -contains "numberOfLines") { $Field.numberOfLines } else { 6 }
      $richText = if ($Field.PSObject.Properties.Name -contains "plainText" -and [bool]$Field.plainText) { "FALSE" } else { "TRUE" }
      return "<Field Type=""Note"" ID=""$fieldId"" Name=""$name"" StaticName=""$name"" DisplayName=""$displayName"" Group=""$group"" Required=""$required"" RichText=""$richText"" NumLines=""$numberOfLines"" Indexed=""$indexed""$description />"
    }
    "Choice" {
      $choices = foreach ($choice in $Field.choices) {
        "<CHOICE>$(Escape-MeetManagerXmlValue -Value $choice)</CHOICE>"
      }
      $joinedChoices = $choices -join ""
      $defaultFragment = if ($Field.PSObject.Properties.Name -contains "defaultValue") {
        "<Default>$(Escape-MeetManagerXmlValue -Value $Field.defaultValue)</Default>"
      }
      else {
        ""
      }
      return "<Field Type=""Choice"" ID=""$fieldId"" Name=""$name"" StaticName=""$name"" DisplayName=""$displayName"" Group=""$group"" Required=""$required"" Indexed=""$indexed"" FillInChoice=""FALSE""$description><CHOICES>$joinedChoices</CHOICES>$defaultFragment</Field>"
    }
    "MultiChoice" {
      $choices = foreach ($choice in $Field.choices) {
        "<CHOICE>$(Escape-MeetManagerXmlValue -Value $choice)</CHOICE>"
      }
      $joinedChoices = $choices -join ""
      return "<Field Type=""MultiChoice"" ID=""$fieldId"" Name=""$name"" StaticName=""$name"" DisplayName=""$displayName"" Group=""$group"" Required=""$required"" Indexed=""$indexed"" FillInChoice=""FALSE""$description><CHOICES>$joinedChoices</CHOICES></Field>"
    }
    "Number" {
      $minValue = if ($Field.PSObject.Properties.Name -contains "minValue") { " Min=""$($Field.minValue)""" } else { "" }
      $maxValue = if ($Field.PSObject.Properties.Name -contains "maxValue") { " Max=""$($Field.maxValue)""" } else { "" }
      $decimals = if ($Field.PSObject.Properties.Name -contains "decimals") { $Field.decimals } else { 0 }
      $defaultFragment = if ($Field.PSObject.Properties.Name -contains "defaultValue") {
        "<Default>$($Field.defaultValue)</Default>"
      }
      else {
        ""
      }
      return "<Field Type=""Number"" ID=""$fieldId"" Name=""$name"" StaticName=""$name"" DisplayName=""$displayName"" Group=""$group"" Required=""$required"" Indexed=""$indexed"" Decimals=""$decimals""$minValue$maxValue$description>$defaultFragment</Field>"
    }
    "Boolean" {
      $defaultValue = if ($Field.PSObject.Properties.Name -contains "defaultValue" -and (ConvertTo-MeetManagerBoolean -Value $Field.defaultValue)) { 1 } else { 0 }
      return "<Field Type=""Boolean"" ID=""$fieldId"" Name=""$name"" StaticName=""$name"" DisplayName=""$displayName"" Group=""$group"" Required=""$required"" Indexed=""$indexed""$description><Default>$defaultValue</Default></Field>"
    }
    "DateTime" {
      $displayFormat = if ($Field.PSObject.Properties.Name -contains "displayFormat") { $Field.displayFormat } else { "DateTime" }
      return "<Field Type=""DateTime"" ID=""$fieldId"" Name=""$name"" StaticName=""$name"" DisplayName=""$displayName"" Group=""$group"" Required=""$required"" Indexed=""$indexed"" Format=""$displayFormat""$description />"
    }
    "URL" {
      return "<Field Type=""URL"" ID=""$fieldId"" Name=""$name"" StaticName=""$name"" DisplayName=""$displayName"" Group=""$group"" Required=""$required"" Indexed=""$indexed"" Format=""Hyperlink""$description />"
    }
    "User" {
      $selectionMode = if ($Field.PSObject.Properties.Name -contains "selectionMode") { $Field.selectionMode } else { "PeopleOnly" }
      $mult = if ($Field.PSObject.Properties.Name -contains "allowMultiple" -and [bool]$Field.allowMultiple) { "TRUE" } else { "FALSE" }
      return "<Field Type=""User"" ID=""$fieldId"" Name=""$name"" StaticName=""$name"" DisplayName=""$displayName"" Group=""$group"" Required=""$required"" Indexed=""$indexed"" UserSelectionMode=""$selectionMode"" Mult=""$mult""$description />"
    }
    "Lookup" {
      $lookupListId = Resolve-MeetManagerLookupListId -ListIdentity $Field.lookupList
      $lookupField = if ($Field.PSObject.Properties.Name -contains "lookupField") { $Field.lookupField } else { "Title" }
      $mult = if ($Field.PSObject.Properties.Name -contains "allowMultiple" -and [bool]$Field.allowMultiple) { "TRUE" } else { "FALSE" }
      return "<Field Type=""Lookup"" ID=""$fieldId"" Name=""$name"" StaticName=""$name"" DisplayName=""$displayName"" Group=""$group"" Required=""$required"" Indexed=""$indexed"" List=""$lookupListId"" ShowField=""$lookupField"" Mult=""$mult""$description />"
    }
    default {
      throw "Field type '$($Field.type)' is not supported by the provisioning module."
    }
  }
}

function Set-MeetManagerContainerSettings {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [object]$List,

    [Parameter(Mandatory)]
    [pscustomobject]$Container
  )

  $settings = $Container.settings
  if ($null -eq $settings) {
    return
  }

  $setListParameters = @{
    Identity = $List
  }

  if ($settings.PSObject.Properties.Name -contains "enableAttachments") {
    $setListParameters.EnableAttachments = [bool]$settings.enableAttachments
  }
  if ($settings.PSObject.Properties.Name -contains "enableVersioning") {
    $setListParameters.EnableVersioning = [bool]$settings.enableVersioning
  }
  if ($settings.PSObject.Properties.Name -contains "enableMinorVersions") {
    $setListParameters.EnableMinorVersions = [bool]$settings.enableMinorVersions
  }
  if ($settings.PSObject.Properties.Name -contains "majorVersions") {
    $setListParameters.MajorVersions = [uint32]$settings.majorVersions
  }
  if ($settings.PSObject.Properties.Name -contains "minorVersions") {
    $setListParameters.MinorVersions = [uint32]$settings.minorVersions
  }
  if ($settings.PSObject.Properties.Name -contains "enableContentTypes") {
    $setListParameters.EnableContentTypes = [bool]$settings.enableContentTypes
  }
  if ($settings.PSObject.Properties.Name -contains "enableFolderCreation") {
    $setListParameters.EnableFolderCreation = [bool]$settings.enableFolderCreation
  }

  Set-PnPList @setListParameters | Out-Null
}

function Ensure-MeetManagerField {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [object]$List,

    [Parameter(Mandatory)]
    [pscustomobject]$Field,

    [Parameter(Mandatory)]
    [string]$FieldGroup
  )

  $existingField = Get-PnPField -List $List -Identity $Field.internalName -ErrorAction SilentlyContinue
  if ($null -ne $existingField) {
    Write-MeetManagerLog -Message "Field '$($Field.internalName)' already exists in '$($List.Title)'." -Level DEBUG
    return
  }

  $fieldXml = New-MeetManagerFieldXml -Field $Field -FieldGroup $FieldGroup
  Add-PnPFieldFromXml -List $List -FieldXml $fieldXml | Out-Null
  Write-MeetManagerLog -Message "Created field '$($Field.internalName)' in '$($List.Title)'." -Level INFO
}

function Ensure-MeetManagerView {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [object]$List,

    [Parameter(Mandatory)]
    [pscustomobject]$ViewDefinition
  )

  $existingView = Get-PnPView -List $List -Identity $ViewDefinition.title -ErrorAction SilentlyContinue
  if ($null -ne $existingView) {
    Write-MeetManagerLog -Message "View '$($ViewDefinition.title)' already exists in '$($List.Title)'." -Level DEBUG
    return
  }

  $parameters = @{
    List = $List
    Title = $ViewDefinition.title
    Fields = @($ViewDefinition.fields)
    Query = $ViewDefinition.query
    RowLimit = [uint32]$ViewDefinition.rowLimit
    Paged = $true
  }

  if ($ViewDefinition.PSObject.Properties.Name -contains "setAsDefault" -and [bool]$ViewDefinition.setAsDefault) {
    $parameters.SetAsDefault = $true
  }

  Add-PnPView @parameters | Out-Null
  Write-MeetManagerLog -Message "Created view '$($ViewDefinition.title)' in '$($List.Title)'." -Level INFO
}

function Ensure-MeetManagerContainer {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [pscustomobject]$Container,

    [Parameter(Mandatory)]
    [string]$FieldGroup
  )

  $existing = Get-MeetManagerContainer -Identity $Container.internalName
  if ($null -eq $existing) {
    $listUrl = if ($Container.kind -eq "Library") {
      $Container.internalName
    }
    else {
      "Lists/$($Container.internalName)"
    }

    $newListParameters = @{
      Title = $Container.title
      Template = $Container.template
      Url = $listUrl
    }

    if ($Container.settings.PSObject.Properties.Name -contains "enableVersioning" -and [bool]$Container.settings.enableVersioning) {
      $newListParameters.EnableVersioning = $true
    }
    if ($Container.settings.PSObject.Properties.Name -contains "enableContentTypes" -and [bool]$Container.settings.enableContentTypes) {
      $newListParameters.EnableContentTypes = $true
    }

    New-PnPList @newListParameters | Out-Null
    $existing = Get-MeetManagerContainer -Identity $Container.internalName
    Write-MeetManagerLog -Message "Created container '$($Container.internalName)'." -Level INFO
  }
  else {
    Write-MeetManagerLog -Message "Container '$($Container.internalName)' already exists." -Level DEBUG
  }

  Set-MeetManagerContainerSettings -List $existing -Container $Container

  foreach ($field in $Container.fields) {
    Ensure-MeetManagerField -List $existing -Field $field -FieldGroup $FieldGroup
  }

  foreach ($view in $Container.views) {
    Ensure-MeetManagerView -List $existing -ViewDefinition $view
  }
}

function Ensure-MeetManagerSiteColumn {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [pscustomobject]$Field,

    [Parameter(Mandatory)]
    [string]$FieldGroup
  )

  $existingField = Get-PnPField -Identity $Field.internalName -ErrorAction SilentlyContinue
  if ($null -ne $existingField) {
    Write-MeetManagerLog -Message "Site column '$($Field.internalName)' already exists." -Level DEBUG
    return
  }

  $fieldXml = New-MeetManagerFieldXml -Field $Field -FieldGroup $FieldGroup
  Add-PnPFieldFromXml -FieldXml $fieldXml | Out-Null
  Write-MeetManagerLog -Message "Created site column '$($Field.internalName)'." -Level INFO
}

function Ensure-MeetManagerContentTypes {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string]$Path
  )

  $contentTypeSchema = Import-MeetManagerJsonFile -Path $Path

  foreach ($siteColumn in $contentTypeSchema.siteColumns) {
    Ensure-MeetManagerSiteColumn -Field $siteColumn -FieldGroup $contentTypeSchema.siteColumnGroup
  }

  foreach ($contentTypeDefinition in $contentTypeSchema.contentTypes) {
    $existingContentType = Get-PnPContentType -Identity $contentTypeDefinition.name -ErrorAction SilentlyContinue
    if ($null -eq $existingContentType) {
      $parentContentType = Get-PnPContentType -Identity $contentTypeDefinition.parentContentTypeId
      Add-PnPContentType -Name $contentTypeDefinition.name -Description $contentTypeDefinition.description -Group $contentTypeSchema.group -ParentContentType $parentContentType | Out-Null
      $existingContentType = Get-PnPContentType -Identity $contentTypeDefinition.name
      Write-MeetManagerLog -Message "Created content type '$($contentTypeDefinition.name)'." -Level INFO
    }

    foreach ($siteColumnName in $contentTypeDefinition.siteColumns) {
      try {
        Add-PnPFieldToContentType -Field $siteColumnName -ContentType $existingContentType | Out-Null
      }
      catch {
        Write-MeetManagerLog -Message "Field '$siteColumnName' is already attached to content type '$($contentTypeDefinition.name)' or could not be added twice." -Level DEBUG
      }
    }

    $targetLibrary = Get-MeetManagerContainer -Identity $contentTypeDefinition.targetLibrary
    if ($null -eq $targetLibrary) {
      throw "The target library '$($contentTypeDefinition.targetLibrary)' for content type '$($contentTypeDefinition.name)' does not exist."
    }

    Set-PnPList -Identity $targetLibrary -EnableContentTypes $true | Out-Null

    try {
      if ($contentTypeDefinition.default) {
        Add-PnPContentTypeToList -List $targetLibrary -ContentType $existingContentType -DefaultContentType | Out-Null
      }
      else {
        Add-PnPContentTypeToList -List $targetLibrary -ContentType $existingContentType | Out-Null
      }
    }
    catch {
      Write-MeetManagerLog -Message "Content type '$($contentTypeDefinition.name)' is already attached to '$($targetLibrary.Title)' or could not be added twice." -Level DEBUG
    }
  }
}

function Get-MeetManagerListItemByTextField {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string]$ListIdentity,

    [Parameter(Mandatory)]
    [string]$FieldInternalName,

    [Parameter(Mandatory)]
    [string]$Value
  )

  $escapedValue = Escape-MeetManagerXmlValue -Value $Value
  $query = "<View><Query><Where><Eq><FieldRef Name='$FieldInternalName' /><Value Type='Text'>$escapedValue</Value></Eq></Where></Query><RowLimit>1</RowLimit></View>"
  return Get-PnPListItem -List $ListIdentity -Query $query | Select-Object -First 1
}

function Resolve-MeetManagerLookupId {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string]$ListIdentity,

    [Parameter(Mandatory)]
    [string]$KeyFieldInternalName,

    [AllowNull()]
    [string]$KeyValue
  )

  if ([string]::IsNullOrWhiteSpace($KeyValue)) {
    return $null
  }

  $item = Get-MeetManagerListItemByTextField -ListIdentity $ListIdentity -FieldInternalName $KeyFieldInternalName -Value $KeyValue
  if ($null -eq $item) {
    throw "Lookup value '$KeyValue' was not found in '$ListIdentity' by field '$KeyFieldInternalName'."
  }

  return $item.Id
}

function Ensure-MeetManagerListItem {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string]$ListIdentity,

    [Parameter(Mandatory)]
    [string]$KeyFieldInternalName,

    [Parameter(Mandatory)]
    [string]$KeyValue,

    [Parameter(Mandatory)]
    [hashtable]$Values
  )

  $existing = Get-MeetManagerListItemByTextField -ListIdentity $ListIdentity -FieldInternalName $KeyFieldInternalName -Value $KeyValue

  if ($null -eq $existing) {
    Add-PnPListItem -List $ListIdentity -Values $Values | Out-Null
    Write-MeetManagerLog -Message "Created item '$KeyValue' in '$ListIdentity'." -Level INFO
    return
  }

  Set-PnPListItem -List $ListIdentity -Identity $existing.Id -Values $Values | Out-Null
  Write-MeetManagerLog -Message "Updated item '$KeyValue' in '$ListIdentity'." -Level INFO
}

function Set-MeetManagerContainerPermissions {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [pscustomobject]$EnvironmentSettings
  )

  if ($null -eq $EnvironmentSettings.security) {
    Write-MeetManagerLog -Message "No security section was found in environment settings. Skipping permissions." -Level WARN
    return
  }

  foreach ($containerName in $EnvironmentSettings.security.breakInheritance) {
    $container = Get-MeetManagerContainer -Identity $containerName
    if ($null -eq $container) {
      Write-MeetManagerLog -Message "Container '$containerName' was not found while applying permissions." -Level WARN
      continue
    }

    Set-PnPList -Identity $container -BreakRoleInheritance -CopyRoleAssignments:$false -ClearSubScopes | Out-Null
    Write-MeetManagerLog -Message "Broke role inheritance for '$containerName'." -Level INFO
  }

  foreach ($groupRole in $EnvironmentSettings.security.groupRoles) {
    foreach ($containerName in $groupRole.lists) {
      $container = Get-MeetManagerContainer -Identity $containerName
      if ($null -eq $container) {
        Write-MeetManagerLog -Message "Container '$containerName' was not found while granting permissions to '$($groupRole.groupName)'." -Level WARN
        continue
      }

      Set-PnPListPermission -Identity $container -Group $groupRole.groupName -AddRole $groupRole.role | Out-Null
      Write-MeetManagerLog -Message "Assigned role '$($groupRole.role)' to group '$($groupRole.groupName)' on '$containerName'." -Level INFO
    }
  }
}

Export-ModuleMember -Function @(
  "Assert-MeetManagerPrerequisites",
  "Connect-MeetManagerSite",
  "ConvertTo-MeetManagerBoolean",
  "ConvertTo-MeetManagerChoiceArray",
  "Ensure-MeetManagerContainer",
  "Ensure-MeetManagerContentTypes",
  "Ensure-MeetManagerListItem",
  "Get-MeetManagerContainer",
  "Import-MeetManagerEnvironmentSettings",
  "Import-MeetManagerJsonFile",
  "Import-MeetManagerSolutionSchema",
  "Resolve-MeetManagerLookupId",
  "Set-MeetManagerContainerPermissions",
  "Write-MeetManagerLog"
)
