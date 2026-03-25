# Inventario de listas y bibliotecas

## Resumen

| Contenedor | Tipo | Clasificacion | Finalidad | Usuarios principales |
| --- | --- | --- | --- | --- |
| `MM_Locations` | Lista | Maestra | Ubicaciones corporativas | Administracion de espacios, soporte |
| `MM_MeetingRooms` | Lista | Maestra | Catalogo de salas | Administracion de espacios, organizadores |
| `MM_RoomResources` | Lista | Maestra | Catalogo de recursos/equipamientos | Soporte AV, administracion de espacios |
| `MM_RoomResourceAssignments` | Lista | Operativa | Relacion sala-recurso | Soporte AV |
| `MM_MeetingTemplates` | Lista | Maestra | Plantillas reutilizables | Organizadores, PMO |
| `MM_MeetingConfigurations` | Lista | Auxiliar | Configuracion funcional y filtros | Administradores funcionales |
| `MM_Meetings` | Lista | Transaccional | Registro principal de reuniones | Organizadores, coordinadores |
| `MM_MeetingAttendees` | Lista | Transaccional | Asistentes por reunion | Organizadores |
| `MM_MeetingNotes` | Lista | Transaccional | Notas, decisiones y checklist | Organizadores, participantes autorizados |
| `MM_MeetingIncidents` | Lista | Transaccional | Incidencias operativas | Soporte, coordinadores |
| `MM_MeetingDocuments` | Biblioteca | Operativa | Documentos de reunion | Organizadores, participantes |
| `MM_TemplateAssets` | Biblioteca | Maestra | Activos base de plantillas | Administradores funcionales |

## Detalle por contenedor

### `MM_Locations`

- nombre visible: `Locations`
- finalidad: catalogo de sedes, edificios y referencias de ubicacion
- permisos: lectura amplia; edicion restringida a administracion de espacios
- vistas recomendadas: `All active locations`
- indices: `MMLocationCode`, `MMActive`

### `MM_MeetingRooms`

- nombre visible: `Rooms`
- finalidad: catalogo maestro de salas
- permisos: lectura amplia; edicion restringida
- vistas recomendadas: `All active rooms`, `Maintenance`
- indices: `MMRoomCode`, `MMLocationLookup`, `MMCapacity`, `MMRoomStatus`

### `MM_RoomResources`

- nombre visible: `Room resources`
- finalidad: catalogo maestro de equipamiento
- permisos: lectura amplia; edicion restringida a soporte/administracion
- vistas recomendadas: `Active resources`
- indices: `MMResourceCode`, `MMActive`

### `MM_RoomResourceAssignments`

- nombre visible: `Room resource assignments`
- finalidad: asignacion n:n de recursos a salas
- permisos: soporte AV y administracion de espacios
- vistas recomendadas: `By room`
- indices: `MMRoomLookup`, `MMResourceLookup`, `MMIsOperational`

### `MM_MeetingTemplates`

- nombre visible: `Meeting templates`
- finalidad: alta acelerada y estandarizacion de reuniones
- permisos: lectura amplia; mantenimiento restringido
- vistas recomendadas: `Active templates`
- indices: `MMTemplateCode`, `MMActive`

### `MM_MeetingConfigurations`

- nombre visible: `Meeting configurations`
- finalidad: ajustes funcionales, filtros guardados, parametros por entorno
- permisos: acceso restringido; recomendable herencia rota
- vistas recomendadas: `By scope`
- indices: `MMConfigurationKey`, `MMEnvironmentName`, `MMActive`

### `MM_Meetings`

- nombre visible: `Meetings`
- finalidad: entidad principal de la solucion
- permisos: lectura/escritura para miembros; lectura selectiva para otros roles segun gobierno
- vistas recomendadas: `All meetings`, `Upcoming meetings`, `Conflicted meetings`
- indices: `MMMeetingCode`, `MMOrganizer`, `MMStartDate`, `MMEndDate`, `MMMeetingType`, `MMWorkflowStatus`, `MMRoomLookup`, `MMLocationLookup`, `MMHasConflicts`
- validacion recomendada:
  - lista/formulario: fin mayor que inicio
  - aplicacion: conflictos, Teams obligatorio si aplica, sala obligatoria si aplica

### `MM_MeetingAttendees`

- nombre visible: `Meeting attendees`
- finalidad: asistentes normalizados y estado de respuesta/asistencia
- permisos: controlados por equipo organizador
- vistas recomendadas: `By meeting`
- indices: `MMMeetingLookup`, `MMAttendeeEmail`

### `MM_MeetingNotes`

- nombre visible: `Meeting notes`
- finalidad: notas operativas, checklist, decisiones y seguimiento
- permisos: puede requerir restricciones adicionales segun sensibilidad
- vistas recomendadas: `Latest notes`
- indices: `MMMeetingLookup`, `MMCompleted`

### `MM_MeetingIncidents`

- nombre visible: `Meeting incidents`
- finalidad: incidencias de sala, equipos, Teams o conectividad
- permisos: recomendable herencia rota
- vistas recomendadas: `Open incidents`
- indices: `MMMeetingLookup`, `MMRoomLookup`, `MMSeverity`, `MMIncidentStatus`

### `MM_MeetingDocuments`

- nombre visible: `Meeting documents`
- finalidad: actas, material previo, soporte y logistica
- permisos: segun sensibilidad documental; puede compartir herencia del sitio o romperla por biblioteca
- vistas recomendadas: `By meeting`, `Final minutes`
- indices: `MMMeetingLookup`, `MMMeetingCode`, `MMDocumentCategory`
- versionado: mayor + menor

### `MM_TemplateAssets`

- nombre visible: `Template assets`
- finalidad: documentos base reutilizables por plantillas
- permisos: lectura amplia, mantenimiento restringido
- vistas recomendadas: `Active template assets`
- indices: `MMTemplateLookup`, `MMActive`
