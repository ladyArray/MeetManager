# Integracion con Teams y Microsoft 365

## Objetivo

Extender Meet Manager para que pueda operar como experiencia SharePoint nativa y, al mismo tiempo, aprovechar capacidades reales de Microsoft Teams, calendarios y salas de Microsoft 365.

## Qué soporta la estructura actual

### Datos almacenados en SharePoint

- `MMTeamsMeetingUrl`
- `MMTeamsOnlineMeetingId`
- `MMTeamsTeamId`
- `MMTeamsChannelId`
- `MMCalendarEventId`
- `MMCalendarOwnerUpn`
- `MMSyncStatus`
- `MMLastSyncUtc`

Estos campos permiten:

- asociar una reunion de Teams existente;
- almacenar el join link;
- enlazar team/canal cuando aplique;
- registrar sincronizacion con calendario.

### Experiencia SPFx ya preparada

- dashboard principal con diferenciacion visual de reuniones virtuales e hibridas;
- panel compacto orientado a Teams;
- boton de acceso rapido a la reunion en curso;
- modelo y servicios listos para enriquecer datos desde Graph.

## Qué puede hacerse solo con SPFx

- mostrar enlaces Teams ya existentes;
- consumir datos delegados del usuario con Graph, si los permisos lo permiten;
- consultar disponibilidad de calendario del usuario y salas mediante Graph;
- mostrar reuniones, contexto de equipo o canal ya vinculados.

## Qué requiere apoyo adicional

### Recomendado con backend o automatizacion

- sincronizacion robusta cross-user de reuniones y asistentes;
- provisionamiento centralizado de reuniones de Teams para terceros;
- reconciliacion periodica con Exchange/Graph;
- reporting consolidado corporativo;
- notificaciones o alertas programadas.

### Opciones recomendadas

- Azure Function con Managed Identity
- API intermedia segura
- Power Automate para flujos simples

## Datos y configuracion necesarios

### Para enlaces de Teams

- `MMTeamsMeetingUrl`
- `MMRequiresTeams`
- `MMMeetingType`

### Para equipos y canales

- `MMTeamsTeamId`
- `MMTeamsChannelId`
- opcionalmente nombre visible en UI si se necesita cache

### Para calendario y disponibilidad

- `MMCalendarEventId`
- `MMCalendarOwnerUpn`
- mailbox de sala en `MMRoomMailbox`
- `MMExchangeResourceId` si se usa mapeo mas fuerte

## Limitaciones reales

- SPFx cliente no debe contener secretos para integraciones protegidas;
- algunas operaciones Graph solo son viables con permisos delegados del usuario actual;
- crear reuniones online para calendarios ajenos no es un escenario recomendable solo desde cliente;
- la ocupacion real de salas no debe derivarse exclusivamente de SharePoint.

## Recomendacion de fase 2

1. Azure Function para sincronizacion con Graph.
2. cola o temporizador para refresco de disponibilidad.
3. estado de sincronizacion mas rico (`Pending`, `Synced`, `Failed`, `Conflict`).
4. enriquecimiento de asistentes y evidencias de reunion.
