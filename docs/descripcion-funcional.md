# Descripcion funcional

## Objetivo

Meet Manager actua como centro de operaciones de reuniones dentro de Microsoft 365. Unifica gestion de reuniones presenciales, virtuales e hibridas desde SharePoint, con integracion progresiva con Teams, calendarios, salas y documentacion operativa.

## Modulos funcionales

### Dashboard principal

- resumen del dia;
- proximas reuniones;
- reuniones activas;
- reuniones recientes;
- KPIs y accesos rapidos;
- filtros por fecha, tipo, estado, organizador, sala, equipo y conflicto.

### Formularios avanzados

- alta y edicion de reuniones;
- validaciones de fechas, duracion y conflictos;
- gestion de requisitos de sala y Teams;
- agenda, notas previas, checklist y documentacion asociada.

### Gestion de salas

- catalogo maestro;
- capacidad, ubicacion y equipamiento;
- estado operativo;
- recomendacion de sala en base a aforo y necesidades.

### Centro operativo de reunion

- ficha completa de reunion;
- asistentes;
- notas;
- incidencias;
- documentos;
- acciones rapidas de edicion, cancelacion, reprogramacion o union a Teams.

### Panel orientado a Teams

- reuniones proximas;
- reunion en curso;
- acceso directo al enlace online;
- contexto ligero para paginas o zonas de trabajo.

## Roles de usuario

### Organizador

- crea, actualiza y cancela reuniones;
- define sala, asistentes, agenda y enlace Teams;
- consulta conflictos y recomendaciones.

### Coordinador operativo

- revisa ocupacion de salas;
- da seguimiento a reuniones activas;
- gestiona incidencias y documentacion de soporte.

### Soporte M365 / Soporte AV

- mantiene catalogos de salas y recursos;
- administra incidencias;
- valida provisioning, permisos e integraciones.

### Administrador funcional

- mantiene configuraciones;
- gestiona plantillas;
- valida convenciones, despliegues y seed data.

## Casos de uso clave

1. Crear una reunion hibrida con sala, enlace Teams y asistentes.
2. Detectar conflicto de sala o de franja antes de guardar.
3. Consultar reuniones activas del dia y unirse rapidamente a Teams.
4. Registrar incidencias de sala o conectividad durante una reunion.
5. Subir acta, material previo o soporte logistico a la biblioteca documental.
6. Aplicar una plantilla reutilizable para acelerar el alta.

## Reglas de negocio

- la fecha de fin debe ser posterior a la fecha de inicio;
- reuniones `Onsite` y `Hybrid` deben advertir si no tienen sala o ubicacion;
- reuniones `Virtual` y `Hybrid` deben advertir si no tienen enlace Teams cuando se requiera;
- los conflictos no bloquean siempre el guardado, pero deben quedar visibles;
- la disponibilidad real de salas debe contrastarse con Graph/Exchange cuando se active esa integracion;
- asistentes externos se controlan por email y se separan de usuarios internos cuando conviene.

## Ciclo de vida de una reunion

1. `Draft`
2. `Scheduled`
3. `Active`
4. `Completed`
5. `Cancelled`

El estado puede cambiar:

- por accion del usuario;
- por automatismo basado en fecha/hora;
- por sincronizacion con calendarios o procesos backend en fases posteriores.

## Reuniones presenciales, virtuales e hibridas

### Presenciales

- prioridad en sala, ubicacion, aforo y equipamiento;
- foco en ocupacion, soporte logistico e incidencias de espacio.

### Virtuales

- prioridad en enlace Teams, asistentes, acceso rapido y contexto digital.

### Hibridas

- combinan ambos mundos;
- requieren mas validaciones y recomendacion de sala/equipamiento.
