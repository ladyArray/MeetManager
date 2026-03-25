# Permisos y dependencias

## Dependencias tecnicas

### SPFx

- `SPFx 1.22.1`
- `Node.js 22.x`
- `Heft`
- `React 17`

### Provisioning y migracion

- `PowerShell 7`
- `PnP.PowerShell`

## Permisos para la app SPFx

### SharePoint

- lectura/escritura sobre listas operativas segun rol del usuario;
- acceso a bibliotecas documentales segun sensibilidad.

### Microsoft Graph

Segun fase funcional:

- lectura de calendario para disponibilidad;
- creacion/actualizacion de eventos online si se habilita;
- lectura de equipos/canales y contexto del usuario.

## Permisos para scripts

- propietario del sitio o equivalente;
- capacidad de crear listas, bibliotecas, columnas, vistas y content types;
- capacidad de romper herencia y asignar permisos si se usa el script de seguridad.

## Recomendaciones de seguridad

- usar autenticacion moderna con `ClientId` externo;
- no almacenar secretos ni tokens en el repositorio;
- restringir `MM_MeetingConfigurations` y `MM_MeetingIncidents`;
- revisar si `MM_MeetingDocuments` requiere permisos diferenciados;
- no registrar PII innecesaria en logs.

## Roles sugeridos

- `Meet Manager Owners`
- `Meet Manager Members`
- `Meet Manager Visitors`

Los nombres son orientativos y deben parametrizarse por entorno.
