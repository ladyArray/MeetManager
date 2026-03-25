# Provisioning

## Objetivo

Provisionar la estructura base de Meet Manager en un sitio de SharePoint Online de forma repetible y controlada.

## Dependencias

- PowerShell 7 recomendado
- modulo `PnP.PowerShell`
- permisos de propietario del sitio o equivalentes
- `ClientId` de una app de Entra ID apta para `Connect-PnPOnline`

## Fuente de verdad

- `provisioning/schema/meet-manager.solution.json`
- `provisioning/schema/containers/*.json`
- `provisioning/schema/meet-manager.content-types.json`

## Scripts incluidos

### `Test-MeetManagerPrerequisites.ps1`

- proposito: validar modulo, rutas y lectura de configuracion
- parametros: `SolutionSchemaPath`, `EnvironmentConfigPath`
- ejemplo:

```powershell
pwsh ./provisioning/powershell/Test-MeetManagerPrerequisites.ps1
```

### `Invoke-MeetManagerProvisioning.ps1`

- proposito: crear listas, bibliotecas, columnas y vistas
- parametros clave:
  - `SiteUrl`
  - `ClientId`
  - `AuthenticationMode`
  - `EnvironmentConfigPath`
  - `ProvisionContentTypes`
  - `ApplyPermissions`
- ejemplo:

```powershell
pwsh ./provisioning/powershell/Invoke-MeetManagerProvisioning.ps1 `
  -SiteUrl "https://<tenant>.sharepoint.com/sites/<site>" `
  -ClientId "<entra-app-id>" `
  -ProvisionContentTypes `
  -ApplyPermissions `
  -EnvironmentConfigPath "./samples/json/environment.dev.sample.json"
```

### `Initialize-MeetManagerDocumentContentTypes.ps1`

- proposito: crear site columns y content types documentales
- uso: despues de provisionar bibliotecas

### `Set-MeetManagerPermissions.ps1`

- proposito: romper herencia y aplicar permisos segun fichero de entorno
- uso: cuando exista definicion `security` en el JSON de entorno

## Orden recomendado

1. `Test-MeetManagerPrerequisites.ps1`
2. `Invoke-MeetManagerProvisioning.ps1`
3. `Initialize-MeetManagerDocumentContentTypes.ps1` si se separa la ejecucion
4. `Set-MeetManagerPermissions.ps1`

## Consideraciones

- los scripts son aditivos e idempotentes a nivel de creacion;
- si un campo ya existe, se omite y se registra en log;
- no se eliminan estructuras automaticamente;
- cambios destructivos o renombrados deben tratarse como migracion controlada.
