# Modelo de datos

## Estrategia general

Meet Manager combina:

- listas y bibliotecas de SharePoint Online como capa operativa;
- Microsoft Graph para disponibilidad, calendario, contexto Teams y usuarios;
- configuracion externa por entorno para no hardcodear nombres, URLs ni permisos.

## Criterios de modelado

### Lo que vive en SharePoint

- reuniones y su estado operativo;
- asistentes normalizados;
- notas y checklist de seguimiento;
- incidencias;
- catalogos maestros de ubicaciones, salas, recursos y plantillas;
- configuraciones funcionales del sitio;
- documentacion asociada.

### Lo que debe venir de Graph o integracion externa

- disponibilidad real de salas y calendarios;
- provisionamiento de eventos online y join links de Teams;
- datos enriquecidos de equipos/canales;
- estado actualizado de reuniones online cuando se requiera consistencia cross-user.

### Lo que no se modela como lista en v1

- `MeetingType`, `WorkflowStatus`, `Priority`, `IncidentSeverity` y `DocumentCategory` se implementan como columnas `Choice`.
- se evita crear listas de catalogo para enums de baja variacion, reduciendo complejidad y lookups innecesarios.

## Entidades principales

### Maestros

- `MM_Locations`
- `MM_MeetingRooms`
- `MM_RoomResources`
- `MM_MeetingTemplates`
- `MM_MeetingConfigurations`
- `MM_TemplateAssets`

### Operativas

- `MM_Meetings`
- `MM_MeetingAttendees`
- `MM_MeetingNotes`
- `MM_MeetingIncidents`
- `MM_RoomResourceAssignments`
- `MM_MeetingDocuments`

## Relaciones funcionales

### Reuniones

- una reunion puede tener una sala opcional;
- una reunion puede tener una ubicacion opcional;
- una reunion puede tener cero o muchos asistentes;
- una reunion puede tener cero o muchas notas;
- una reunion puede tener cero o muchas incidencias;
- una reunion puede tener cero o muchos documentos.

### Salas y recursos

- una sala pertenece a una ubicacion;
- una sala puede tener muchos recursos asignados;
- un recurso puede estar asignado a muchas salas mediante `MM_RoomResourceAssignments`.

### Plantillas

- una plantilla puede apuntar a activos documentales base;
- los documentos operativos pueden referenciar una plantilla de origen.

## Relaciones tecnicas

| Origen | Campo | Destino | Tipo |
| --- | --- | --- | --- |
| `MM_MeetingRooms` | `MMLocationLookup` | `MM_Locations` | Lookup |
| `MM_RoomResourceAssignments` | `MMRoomLookup` | `MM_MeetingRooms` | Lookup |
| `MM_RoomResourceAssignments` | `MMResourceLookup` | `MM_RoomResources` | Lookup |
| `MM_Meetings` | `MMRoomLookup` | `MM_MeetingRooms` | Lookup |
| `MM_Meetings` | `MMLocationLookup` | `MM_Locations` | Lookup |
| `MM_MeetingAttendees` | `MMMeetingLookup` | `MM_Meetings` | Lookup |
| `MM_MeetingNotes` | `MMMeetingLookup` | `MM_Meetings` | Lookup |
| `MM_MeetingIncidents` | `MMMeetingLookup` | `MM_Meetings` | Lookup |
| `MM_MeetingIncidents` | `MMRoomLookup` | `MM_MeetingRooms` | Lookup |
| `MM_MeetingDocuments` | `MMMeetingLookup` | `MM_Meetings` | Lookup |
| `MM_MeetingDocuments` | `MMRelatedRoomLookup` | `MM_MeetingRooms` | Lookup |
| `MM_MeetingDocuments` | `MMTemplateLookup` | `MM_MeetingTemplates` | Lookup |
| `MM_TemplateAssets` | `MMTemplateLookup` | `MM_MeetingTemplates` | Lookup |

## Datos historicos y sincronizacion

### Historico

- `MM_MeetingNotes` conserva trazabilidad funcional.
- `MM_MeetingIncidents` conserva soporte y resoluciones.
- el versionado de listas y bibliotecas aporta auditoria adicional.

### Datos sincronizados

- `MMTeamsMeetingUrl`, `MMTeamsOnlineMeetingId`, `MMCalendarEventId` y `MMSyncStatus` son snapshots operativos;
- la fuente real sigue siendo Graph/Exchange cuando se active sincronizacion real.

## Documentos

Se recomienda una biblioteca documental central `MM_MeetingDocuments` con metadatos en lugar de muchas bibliotecas separadas. Motivos:

- mejor experiencia de busqueda;
- menos sobrecarga administrativa;
- vistas por categoria y reunion;
- gobierno documental y versionado consistentes.

`MM_TemplateAssets` queda separada porque responde a un uso distinto: activos base reutilizables, no documentos operativos de una reunion concreta.

## Excepciones razonadas

`MMChecklistJson` se mantiene en la lista de reuniones como artefacto UI/controlado porque:

- suele tener poco volumen por reunion;
- no requiere reporting complejo en fase inicial;
- simplifica una experiencia operativa rica en SPFx.

Si el checklist evoluciona a acciones auditables por usuario/equipo, debe normalizarse en una lista hija en fase 2.

Ademas, el esquema incluye varios campos `snapshot` o `compatibility` para convivir con el `SharePointMeetManagerService` actual mientras la capa de servicios migra completamente al modelo normalizado. Estos campos no sustituyen al modelo maestro; sirven como puente evolutivo y estan documentados en el esquema JSON.
