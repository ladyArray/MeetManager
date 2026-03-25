# Convenciones de nombre

## Listas y bibliotecas

- prefijo obligatorio: `MM_`
- nombres tecnicos en ingles
- listas: `MM_Meetings`, `MM_MeetingRooms`
- bibliotecas: `MM_MeetingDocuments`, `MM_TemplateAssets`

## Columnas internas

- prefijo obligatorio: `MM`
- `PascalCase`
- ejemplo: `MMMeetingCode`, `MMWorkflowStatus`, `MMLocationLookup`

## Scripts

- verbos en infinitivo tecnico PowerShell
- formato: `Invoke-MeetManagerProvisioning.ps1`, `Import-MeetManagerRooms.ps1`

## Documentos

- Markdown en espanol
- nombres en kebab-case cuando sean guias: `configuracion-por-entorno.md`

## Variables de configuracion

- JSON en camelCase
- ejemplo: `environmentName`, `siteUrl`, `clientId`

## Artefactos por entorno

- sufijos: `dev`, `int`, `pre`, `prod`
- ejemplo: `environment.dev.sample.json`
