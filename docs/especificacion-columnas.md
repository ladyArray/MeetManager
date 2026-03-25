# Especificacion de columnas

## Nota de uso

La definicion exhaustiva, ejecutable y sin ambiguedades vive en:

- `provisioning/schema/containers/01-master-data.json`
- `provisioning/schema/containers/02-operational-data.json`
- `provisioning/schema/containers/03-libraries.json`
- `provisioning/schema/meet-manager.content-types.json`

Este documento ofrece una lectura humana compacta de la especificacion.

El esquema tambien incluye campos `snapshot` de compatibilidad para que la provisión nueva no rompa la integracion SharePoint actual del proyecto. Cuando un campo principal y uno snapshot conviven, el principal es la referencia funcional de futuro.

## `MM_Locations`

| Visible | Interno | Tipo | Obl. | Predet. | Index | Formularios | Origen | Ejemplo | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Title | `Title` | Single line | Si | - | No | Si | Usuario/admin | Madrid HQ | Nombre visible |
| Location code | `MMLocationCode` | Text | Si | - | Si | Si | Maestro | `MAD-HQ` | Clave funcional |
| Campus | `MMCampus` | Text | No | - | No | Si | Maestro | `Madrid Campus` | Agrupacion corporativa |
| Building | `MMBuilding` | Text | No | - | No | Si | Maestro | `Torre Norte` | Edificio |
| City | `MMCity` | Text | No | - | No | Si | Maestro | `Madrid` | Ciudad |
| Country | `MMCountry` | Text | No | - | No | Si | Maestro | `Spain` | Pais |
| Time zone | `MMTimezone` | Text | No | - | No | Si | Maestro | `Romance Standard Time` | Zona horaria |
| Address | `MMAddress` | Note | No | - | No | Si | Maestro | `Paseo de la Castellana...` | Direccion postal |
| Map URL | `MMMapUrl` | Hyperlink | No | - | No | Si | Maestro | `https://...` | Plano o mapa |
| Active | `MMActive` | Yes/No | Si | `true` | Si | Si | Maestro | `true` | Baja logica |

## `MM_MeetingRooms`

| Visible | Interno | Tipo | Obl. | Predet. | Index | Formularios | Origen | Ejemplo | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Title | `Title` | Single line | Si | - | No | Si | Maestro | Sala Horizonte | Nombre visible |
| Room code | `MMRoomCode` | Text | Si | - | Si | Si | Maestro | `R-MAD-101` | Clave funcional |
| Location | `MMLocationLookup` | Lookup | Si | - | Si | Si | Maestro | Madrid HQ | A `MM_Locations` |
| Room mailbox | `MMRoomMailbox` | Text | No | - | No | Si | Maestro/Exchange | `room@contoso.com` | Recomendado para Graph |
| Capacity | `MMCapacity` | Number | Si | - | Si | Si | Maestro | `12` | Aforo |
| Room status | `MMRoomStatus` | Choice | Si | `Available` | Si | Si | Maestro | `Available` | Estado operativo |
| Floor | `MMFloor` | Text | No | - | No | Si | Maestro | `1` | Planta |
| Zone | `MMZone` | Text | No | - | No | Si | Maestro | Norte | Zona interna |
| Map URL | `MMMapUrl` | Hyperlink | No | - | No | Si | Maestro | `https://...` | Plano |
| Has Teams device | `MMHasTeamsDevice` | Yes/No | Si | `false` | No | Si | Maestro | `true` | Teams Rooms |
| Default equipment profile | `MMDefaultEquipmentProfile` | MultiChoice | No | - | No | Si | Maestro | `Display;Camera` | Capacidades base |
| Accessibility notes | `MMAccessibilityNotes` | Note | No | - | No | Si | Maestro | Texto libre | Accesibilidad |
| Operational notes | `MMOperationalNotes` | Note | No | - | No | Si | Si | Texto libre | Soporte |
| Managed by | `MMManagedBy` | Person | No | - | No | Si | Maestro | `ana.lopez@contoso.com` | Responsable |
| Exchange resource id | `MMExchangeResourceId` | Text | No | - | No | Tecnico | Integracion | `...` | Snapshot tecnico |

## `MM_RoomResources` y `MM_RoomResourceAssignments`

| Contenedor | Visible | Interno | Tipo | Obl. | Ejemplo | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `MM_RoomResources` | Resource code | `MMResourceCode` | Text | Si | `RES-CAM-PTZ` | Clave funcional |
| `MM_RoomResources` | Resource type | `MMResourceType` | Choice | Si | `Camera` | Tipo de recurso |
| `MM_RoomResources` | Category | `MMCategory` | Choice | Si | `AV` | Categoria administrativa |
| `MM_RoomResources` | Default quantity | `MMDefaultQuantity` | Number | Si | `1` | Cantidad sugerida |
| `MM_RoomResources` | Is bookable | `MMIsBookable` | Yes/No | Si | `false` | Reserva individual |
| `MM_RoomResources` | Active | `MMActive` | Yes/No | Si | `true` | Baja logica |
| `MM_RoomResourceAssignments` | Room | `MMRoomLookup` | Lookup | Si | Sala Horizonte | Relacion con sala |
| `MM_RoomResourceAssignments` | Resource | `MMResourceLookup` | Lookup | Si | Camera PTZ | Relacion con recurso |
| `MM_RoomResourceAssignments` | Quantity | `MMQuantity` | Number | Si | `1` | Cantidad instalada |
| `MM_RoomResourceAssignments` | Is operational | `MMIsOperational` | Yes/No | Si | `true` | Estado operativo |
| `MM_RoomResourceAssignments` | Inventory code | `MMInventoryCode` | Text | No | `INV-1002` | Inventario |

## `MM_MeetingTemplates`

| Visible | Interno | Tipo | Obl. | Predet. | Ejemplo | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| Title | `Title` | Single line | Si | - | Comite Operativo | Nombre visible |
| Template code | `MMTemplateCode` | Text | Si | - | `TPL-OPS-001` | Clave funcional |
| Description | `MMDescription` | Note | No | - | Texto libre | Descripcion |
| Default meeting type | `MMMeetingTypeDefault` | Choice | Si | `Hybrid` | `Virtual` | Tipo sugerido |
| Duration minutes | `MMDurationMinutes` | Number | Si | `60` | `30` | Duracion |
| Default priority | `MMDefaultPriority` | Choice | Si | `Normal` | `High` | Prioridad |
| Default equipment needs | `MMDefaultEquipmentNeeds` | MultiChoice | No | - | `Display;HybridKit` | Equipamiento |
| Agenda template | `MMAgendaTemplate` | Note | No | - | Texto libre | Agenda base |
| Checklist template JSON | `MMChecklistTemplateJson` | Note | No | - | `[{...}]` | Serializado UI |
| Default Teams enabled | `MMDefaultTeamsEnabled` | Yes/No | Si | `false` | `true` | Requiere Teams |
| Default room required | `MMDefaultRoomRequired` | Yes/No | Si | `false` | `true` | Requiere sala |
| Category | `MMCategory` | Text | No | - | Operaciones | Categoria |
| Related template asset URL | `MMRelatedTemplateAssetUrl` | Hyperlink | No | - | `https://...` | Activo base |
| Active | `MMActive` | Yes/No | Si | `true` | `true` | Baja logica |

## `MM_MeetingConfigurations`

| Visible | Interno | Tipo | Obl. | Predet. | Ejemplo | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| Title | `Title` | Single line | Si | - | Default Working Hours | Nombre visible |
| Configuration key | `MMConfigurationKey` | Text | Si | - | `calendar.workingHours` | Clave unica |
| Configuration scope | `MMConfigurationScope` | Choice | Si | `Solution` | `Environment` | Ambito |
| Configuration type | `MMConfigurationType` | Choice | Si | `Json` | `Json` | Tipo de dato |
| JSON value | `MMJsonValue` | Note | No | - | `{...}` | Valor JSON |
| Text value | `MMTextValue` | Text | No | - | Texto | Valor corto |
| Number value | `MMNumberValue` | Number | No | - | `2` | Valor numerico |
| Boolean value | `MMBooleanValue` | Yes/No | No | `false` | `true` | Valor booleano |
| Environment name | `MMEnvironmentName` | Choice | No | - | `dev` | Entorno |
| Owner email | `MMOwnerEmail` | Text | No | - | `owner@contoso.com` | Propietario |
| Active | `MMActive` | Yes/No | Si | `true` | `true` | Baja logica |

## `MM_Meetings`

| Visible | Interno | Tipo | Obl. | Predet. | Index | Origen | Ejemplo | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Title | `Title` | Single line | Si | - | No | Usuario | Revision de Proyecto | Nombre visible |
| Meeting code | `MMMeetingCode` | Text | Si | - | Si | Negocio | `MTG-2026-001` | Clave funcional |
| Description | `MMDescription` | Note | No | - | No | Usuario | Texto libre | Descripcion |
| Organizer | `MMOrganizer` | Person | Si | - | Si | Usuario/M365 | `ana.lopez@contoso.com` | Campo principal |
| Organizer email snapshot | `MMOrganizerEmail` | Text | No | - | No | Integracion | `ana.lopez@...` | Snapshot tecnico |
| Start date | `MMStartDate` | DateTime | Si | - | Si | Usuario | `2026-04-02T09:00` | Inicio |
| End date | `MMEndDate` | DateTime | Si | - | Si | Usuario | `2026-04-02T10:00` | Fin |
| Actual start date | `MMActualStartDate` | DateTime | No | - | No | Operacion | `2026-04-02T09:03` | Inicio real |
| Actual end date | `MMActualEndDate` | DateTime | No | - | No | Operacion | `2026-04-02T10:05` | Fin real |
| Meeting type | `MMMeetingType` | Choice | Si | `Hybrid` | Si | Usuario | `Virtual` | Tipo |
| Workflow status | `MMWorkflowStatus` | Choice | Si | `Draft` | Si | Sistema/usuario | `Scheduled` | Estado |
| Priority | `MMPriority` | Choice | Si | `Normal` | No | Usuario | `High` | Prioridad |
| Room | `MMRoomLookup` | Lookup | No | - | Si | Maestro | Sala Horizonte | Sala reservada |
| Location | `MMLocationLookup` | Lookup | No | - | Si | Maestro | Madrid HQ | Ubicacion |
| Teams meeting URL | `MMTeamsMeetingUrl` | Hyperlink | No | - | No | Teams/usuario | `https://teams...` | Join URL |
| Teams online meeting id | `MMTeamsOnlineMeetingId` | Text | No | - | No | Graph | `19:meeting_...` | Snapshot tecnico |
| Teams team id | `MMTeamsTeamId` | Text | No | - | No | Graph | GUID | Team asociado |
| Teams channel id | `MMTeamsChannelId` | Text | No | - | No | Graph | GUID | Canal asociado |
| Calendar event id | `MMCalendarEventId` | Text | No | - | No | Graph | GUID | Evento calendario |
| Calendar owner UPN | `MMCalendarOwnerUpn` | Text | No | - | No | Graph | `owner@...` | Buzon propietario |
| Requires room | `MMRequiresRoom` | Yes/No | Si | `false` | No | UI | `true` | Regla funcional |
| Requires Teams | `MMRequiresTeams` | Yes/No | Si | `false` | No | UI | `true` | Regla funcional |
| Has conflicts | `MMHasConflicts` | Yes/No | Si | `false` | Si | Sistema | `true` | Conflictos detectados |
| Conflict summary | `MMConflictSummary` | Note | No | - | No | Sistema | Texto libre | Detalle conflicto |
| Equipment needs | `MMEquipmentNeeds` | MultiChoice | No | - | No | Usuario | `Display;Camera` | Necesidades |
| Category | `MMCategory` | Text | No | - | No | Usuario | Operaciones | Categoria |
| Tags | `MMTags` | Text | No | - | No | Usuario | `comite;q2` | Etiquetas |
| Agenda | `MMAgenda` | Note | No | - | No | Usuario | Texto libre | Agenda |
| Pre-meeting notes | `MMPreMeetingNotes` | Note | No | - | No | Usuario | Texto libre | Notas previas |
| Checklist JSON | `MMChecklistJson` | Note | No | - | No | UI | `[{...}]` | Control UI |
| External guests | `MMExternalGuests` | Note | No | - | No | Usuario | `guest@external.com` | Invitados externos |
| Sync status | `MMSyncStatus` | Choice | Si | `NotSynced` | No | Sistema | `Pending` | Estado sync |
| Last sync UTC | `MMLastSyncUtc` | DateTime | No | - | No | Sistema | `2026-04-02T08:55Z` | Ultima sync |

## `MM_MeetingAttendees`, `MM_MeetingNotes`, `MM_MeetingIncidents`

| Contenedor | Visible | Interno | Tipo | Obl. | Predet. | Ejemplo | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `MM_MeetingAttendees` | Meeting | `MMMeetingLookup` | Lookup | Si | - | Revision de Proyecto | Reunion padre |
| `MM_MeetingAttendees` | Attendee type | `MMAttendeeType` | Choice | Si | `Required` | `Presenter` | Rol |
| `MM_MeetingAttendees` | Attendee | `MMAttendee` | Person | No | - | `ana.lopez@...` | Interno |
| `MM_MeetingAttendees` | Attendee email | `MMAttendeeEmail` | Text | Si | - | `guest@ext.com` | Clave de importacion |
| `MM_MeetingAttendees` | Attendee name | `MMAttendeeName` | Text | Si | - | Ana Lopez | Nombre visible |
| `MM_MeetingAttendees` | Response status | `MMResponseStatus` | Choice | Si | `Pending` | `Accepted` | Respuesta |
| `MM_MeetingAttendees` | Is external | `MMIsExternal` | Yes/No | Si | `false` | `true` | Externo |
| `MM_MeetingAttendees` | Attendance status | `MMAttendanceStatus` | Choice | Si | `NotTracked` | `Attended` | Asistencia final |
| `MM_MeetingNotes` | Meeting | `MMMeetingLookup` | Lookup | Si | - | Revision de Proyecto | Reunion padre |
| `MM_MeetingNotes` | Note type | `MMNoteType` | Choice | Si | `Operational` | `Decision` | Tipo de nota |
| `MM_MeetingNotes` | Note text | `MMNoteText` | Note | Si | - | Texto libre | Cuerpo |
| `MM_MeetingNotes` | Is private | `MMIsPrivate` | Yes/No | Si | `false` | `true` | Privacidad |
| `MM_MeetingNotes` | Is pinned | `MMIsPinned` | Yes/No | Si | `false` | `true` | Destacada |
| `MM_MeetingNotes` | Due date | `MMDueDate` | Date | No | - | `2026-04-05` | Seguimiento |
| `MM_MeetingNotes` | Completed | `MMCompleted` | Yes/No | Si | `false` | `true` | Checklist |
| `MM_MeetingIncidents` | Meeting | `MMMeetingLookup` | Lookup | Si | - | Revision de Proyecto | Reunion padre |
| `MM_MeetingIncidents` | Room | `MMRoomLookup` | Lookup | No | - | Sala Horizonte | Sala afectada |
| `MM_MeetingIncidents` | Incident type | `MMIncidentType` | Choice | Si | - | `Teams` | Tipo |
| `MM_MeetingIncidents` | Severity | `MMSeverity` | Choice | Si | `Medium` | `High` | Severidad |
| `MM_MeetingIncidents` | Incident status | `MMIncidentStatus` | Choice | Si | `Open` | `Resolved` | Estado |
| `MM_MeetingIncidents` | Reported by | `MMReportedBy` | Person | Si | - | `carlos@...` | Reporta |
| `MM_MeetingIncidents` | Owned by | `MMOwnedBy` | Person | No | - | `support@...` | Responsable |
| `MM_MeetingIncidents` | Occurred at | `MMOccurredAt` | DateTime | Si | - | `2026-04-02T09:10` | Momento |
| `MM_MeetingIncidents` | Description | `MMDescription` | Note | Si | - | Texto libre | Incidencia |
| `MM_MeetingIncidents` | Resolution | `MMResolution` | Note | No | - | Texto libre | Resolucion |
| `MM_MeetingIncidents` | External ticket id | `MMExternalTicketId` | Text | No | - | `INC-1234` | Ticket externo |

## Bibliotecas documentales

| Contenedor | Visible | Interno | Tipo | Obl. | Predet. | Ejemplo | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `MM_MeetingDocuments` | Meeting | `MMMeetingLookup` | Lookup | No | - | Revision de Proyecto | Reunion asociada |
| `MM_MeetingDocuments` | Meeting code | `MMMeetingCode` | Text | No | - | `MTG-2026-001` | Busqueda |
| `MM_MeetingDocuments` | Document category | `MMDocumentCategory` | Choice | Si | `PreRead` | `Minutes` | Categoria |
| `MM_MeetingDocuments` | Document status | `MMDocumentStatus` | Choice | Si | `Draft` | `Final` | Estado |
| `MM_MeetingDocuments` | Document date | `MMDocumentDate` | Date | No | - | `2026-04-02` | Fecha funcional |
| `MM_MeetingDocuments` | Confidentiality | `MMConfidentiality` | Choice | Si | `Internal` | `Restricted` | Sensibilidad |
| `MM_MeetingDocuments` | Related room | `MMRelatedRoomLookup` | Lookup | No | - | Sala Horizonte | Sala asociada |
| `MM_MeetingDocuments` | Template | `MMTemplateLookup` | Lookup | No | - | Comite Operativo | Plantilla origen |
| `MM_MeetingDocuments` | External document URL | `MMExternalDocumentUrl` | Hyperlink | No | - | `https://...` | Documento externo |
| `MM_TemplateAssets` | Template | `MMTemplateLookup` | Lookup | No | - | Comite Operativo | Plantilla asociada |
| `MM_TemplateAssets` | Asset type | `MMTemplateAssetType` | Choice | Si | `Document` | `Checklist` | Tipo de activo |
| `MM_TemplateAssets` | Category | `MMCategory` | Text | No | - | Operaciones | Categoria |
| `MM_TemplateAssets` | Confidentiality | `MMConfidentiality` | Choice | Si | `Internal` | `Restricted` | Sensibilidad |
| `MM_TemplateAssets` | Active | `MMActive` | Yes/No | Si | `true` | `true` | Baja logica |
