# Meet Manager

Meet Manager es una solucion moderna en SharePoint Framework (SPFx) para centralizar la gestion de reuniones presenciales, virtuales e hibridas dentro de Microsoft 365, con una base completa de provisión, migracion y soporte operativo para SharePoint Online.

## Alcance del repositorio

Este repositorio ya no contiene solo los webparts. Incluye tambien:

- base SPFx con `Heft`, `TypeScript` y `React` funcional;
- modelo de datos corporativo para listas, bibliotecas y relaciones;
- esquema machine-readable en JSON para provisión repetible;
- scripts PowerShell con `PnP.PowerShell` para provisioning, permisos y seed data;
- scripts de migracion inicial desde `CSV` y `JSON`;
- documentacion tecnica, funcional, de despliegue, configuracion por entorno y soporte.

## Compatibilidad tecnica

La base SPFx queda alineada con:

- `SPFx 1.22.1`
- `React 17.0.1`
- `TypeScript ~5.8.0`
- `Heft`
- `Node.js 22.x`

Nota importante:

- la peticion original mencionaba `Node.js 23`, pero la compatibilidad oficial actual de SPFx `1.22.x` esta alineada con `Node.js 22 LTS`;
- por realismo tecnico, el proyecto documenta y declara `Node 22.x` como runtime recomendado.

## Estructura principal

```text
config/
docs/
  templates/
migration/
  mappings/
  powershell/
provisioning/
  powershell/
    common/
  schema/
    containers/
samples/
  csv/
  json/
src/
  common/
  webparts/
teams/
```

## Componentes funcionales

### SPFx

- `Meet Manager`: dashboard principal con agenda, calendario, tablero, salas, estado y detalle operativo.
- `Meet Manager Teams Panel`: panel compacto para zonas operativas y contexto Teams.

### Capa de soporte

- `provisioning/schema/`: definicion de listas, bibliotecas, columnas, vistas y content types.
- `provisioning/powershell/`: scripts de provision y seguridad.
- `migration/powershell/`: scripts de carga inicial y migracion.
- `samples/`: ejemplos de `CSV` y `JSON` para catálogos, entornos y reuniones.
- `docs/`: documentacion tecnica, funcional y operativa.

## Instalacion de la parte SPFx

1. Usa `Node.js 22.x`.
2. Situa la consola en `SPFx/`.
3. Ejecuta:

```powershell
npm install
npm run start
```

Comandos utiles:

```powershell
npm run build
npm run test
npm run package-solution
npm run clean
```

## Provisioning y migracion

### Validacion previa

```powershell
pwsh ./provisioning/powershell/Test-MeetManagerPrerequisites.ps1
```

### Provision completa del sitio

```powershell
pwsh ./provisioning/powershell/Invoke-MeetManagerProvisioning.ps1 `
  -SiteUrl "https://<tenant>.sharepoint.com/sites/<site>" `
  -ClientId "<entra-app-id>" `
  -ProvisionContentTypes `
  -ApplyPermissions `
  -EnvironmentConfigPath "./samples/json/environment.dev.sample.json"
```

### Seed data base

```powershell
pwsh ./migration/powershell/Initialize-MeetManagerSeedData.ps1 `
  -SiteUrl "https://<tenant>.sharepoint.com/sites/<site>" `
  -ClientId "<entra-app-id>"
```

### Cargas iniciales

```powershell
pwsh ./migration/powershell/Import-MeetManagerLocations.ps1
pwsh ./migration/powershell/Import-MeetManagerRooms.ps1
pwsh ./migration/powershell/Import-MeetManagerRoomResources.ps1
pwsh ./migration/powershell/Import-MeetManagerMeetingTemplates.ps1
pwsh ./migration/powershell/Import-MeetManagerMeetings.ps1
```

## Orden recomendado de implantacion

1. Ejecutar validaciones previas.
2. Provisionar listas, bibliotecas y vistas.
3. Provisionar content types documentales.
4. Aplicar permisos especificos.
5. Cargar ubicaciones, salas, recursos y plantillas.
6. Cargar configuraciones base.
7. Migrar reuniones iniciales si existen.
8. Construir y desplegar el paquete SPFx.
9. Configurar permisos API y validar la experiencia SharePoint / Teams.

## Documentacion incluida

- [Descripcion funcional](./docs/descripcion-funcional.md)
- [Arquitectura tecnica](./docs/arquitectura.md)
- [Modelo de datos](./docs/modelo-datos.md)
- [Inventario de listas y bibliotecas](./docs/inventario-listas-bibliotecas.md)
- [Especificacion de columnas](./docs/especificacion-columnas.md)
- [Provisioning](./docs/provisioning.md)
- [Despliegue](./docs/despliegue.md)
- [Migracion](./docs/migracion.md)
- [Configuracion por entorno](./docs/configuracion-por-entorno.md)
- [Permisos y dependencias](./docs/permisos-y-dependencias.md)
- [Integracion con Teams](./docs/integracion-teams.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Mantenimiento evolutivo](./docs/mantenimiento-evolutivo.md)
- [Checklist post-despliegue](./docs/checklist-post-despliegue.md)
- [Convenciones de nombre](./docs/convenciones-nombre.md)
- [Guia de administracion](./docs/guia-administracion.md)
- [Roadmap](./docs/roadmap.md)

## Permisos recomendados

### Para SPFx

- acceso de usuarios a las listas/bibliotecas del sitio;
- permisos delegados de Graph cuando se active disponibilidad, contexto Teams o creacion de eventos online;
- aprobacion de permisos de API desde el tenant cuando aplique.

### Para scripts

- permisos de propietario o administrador del sitio para crear listas, bibliotecas, columnas y vistas;
- permisos de administracion funcional o equivalente para romper herencia y aplicar permisos especificos;
- autenticacion mediante `Connect-PnPOnline` con `ClientId` externo, nunca embebido en codigo.

## Limitaciones conocidas

- la disponibilidad real de salas debe venir de Exchange Online / Graph, no solo de SharePoint;
- la creacion robusta de reuniones Teams para terceros y sincronizacion cross-user puede requerir backend o automatizacion adicional;
- la carga de reuniones asume que los usuarios organizadores ya existen y son resolubles en el sitio.
