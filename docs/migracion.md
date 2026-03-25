# Migracion

## Objetivo

Cargar catalogos, configuraciones y reuniones iniciales desde fuentes externas de forma repetible y con minimo impacto.

## Fuentes soportadas

- `CSV` para ubicaciones, salas, recursos, asignaciones, plantillas y reuniones
- `JSON` para configuracion funcional base

## Scripts incluidos

- `Initialize-MeetManagerSeedData.ps1`
- `Import-MeetManagerLocations.ps1`
- `Import-MeetManagerRooms.ps1`
- `Import-MeetManagerRoomResources.ps1`
- `Import-MeetManagerMeetingTemplates.ps1`
- `Import-MeetManagerMeetings.ps1`

## Orden recomendado de carga

1. ubicaciones
2. salas
3. recursos
4. asignaciones sala-recurso
5. plantillas
6. configuraciones base
7. reuniones

## Idempotencia

- cada script hace `upsert` por clave funcional;
- si el registro ya existe, se actualiza;
- no se borran registros no presentes en el fichero origen.

## Validaciones previas

- las ubicaciones deben existir antes de importar salas;
- las salas y recursos deben existir antes de importar asignaciones;
- el organizador de una reunion debe ser resoluble en el sitio;
- los codigos funcionales deben ser unicos en el CSV.

## Rollback parcial

No se implementa rollback automatico destructivo. En caso de error:

- corregir el fichero de entrada;
- relanzar el script correspondiente;
- usar versionado de listas y logs como soporte de investigacion.

## Ficheros de ejemplo

- `samples/csv/locations.sample.csv`
- `samples/csv/rooms.sample.csv`
- `samples/csv/room-resources.sample.csv`
- `samples/csv/room-resource-assignments.sample.csv`
- `samples/csv/meeting-templates.sample.csv`
- `samples/csv/meetings.sample.csv`
- `samples/json/base-catalogs.sample.json`

## Mapeos

- `migration/mappings/rooms.import-map.json`
- `migration/mappings/meetings.import-map.json`
