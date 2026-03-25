import {
  DashboardFilters,
  DashboardViewKey,
  MeetingEditableStatus,
  MeetingPriority,
  MeetingType,
  MeetingWorkflowStatus,
  RoomFeature,
} from "../models/meetManagerModels";

export const DEFAULT_SITE_RELATIVE_LISTS = {
  meetings: "MM_Meetings",
  attendees: "MM_MeetingAttendees",
  notes: "MM_MeetingNotes",
  rooms: "MM_MeetingRooms",
  roomResources: "MM_RoomResources",
  roomResourceAssignments: "MM_RoomResourceAssignments",
  locations: "MM_Locations",
  templates: "MM_MeetingTemplates",
  incidents: "MM_MeetingIncidents",
  configuration: "MM_MeetingConfigurations",
} as const;

export const DEFAULT_SITE_RELATIVE_LIBRARIES = {
  meetingDocuments: "MM_MeetingDocuments",
  templateAssets: "MM_TemplateAssets",
} as const;

export const SHAREPOINT_FIELD_NAMES = {
  meetingId: "MMMeetingId",
  description: "MMDescription",
  organizerId: "MMOrganizerId",
  organizerName: "MMOrganizerName",
  organizerEmail: "MMOrganizerEmail",
  organizerTitle: "MMOrganizerTitle",
  organizerDepartment: "MMOrganizerDepartment",
  startDate: "MMStartDate",
  endDate: "MMEndDate",
  meetingType: "MMMeetingType",
  roomId: "MMRoomId",
  roomName: "MMRoomName",
  teamsMeetingUrl: "MMTeamsMeetingUrl",
  teamsMeetingId: "MMTeamsMeetingId",
  teamId: "MMTeamId",
  teamName: "MMTeamName",
  channelId: "MMChannelId",
  channelName: "MMChannelName",
  attendeesJson: "MMAttendeesJson",
  externalGuestsJson: "MMExternalGuestsJson",
  priority: "MMPriority",
  tagsJson: "MMTagsJson",
  workflowStatus: "MMWorkflowStatus",
  equipmentJson: "MMEquipmentJson",
  preMeetingNotes: "MMPreMeetingNotes",
  agendaJson: "MMAgendaJson",
  documentsJson: "MMDocumentsJson",
  checklistJson: "MMChecklistJson",
  notesJson: "MMNotesJson",
  changesJson: "MMChangesJson",
  incidentsJson: "MMIncidentsJson",
  isFavorite: "MMIsFavorite",
  roomMailbox: "MMRoomMailbox",
  capacity: "MMCapacity",
  building: "MMBuilding",
  floor: "MMFloor",
  locationLabel: "MMLocationLabel",
  featuresJson: "MMFeaturesJson",
  roomState: "MMRoomState",
  roomNotes: "MMRoomNotes",
  mapUrl: "MMMapUrl",
  summary: "MMSummary",
  defaultsJson: "MMDefaultsJson",
  incidentMeetingId: "MMIncidentMeetingId",
  incidentSeverity: "MMIncidentSeverity",
  incidentStatus: "MMIncidentStatus",
  ownerName: "MMOwnerName",
  accentColor: "MMAccentColor",
  savedFilterJson: "MMSavedFilterJson",
} as const;

export const MEETING_TYPE_OPTIONS: ReadonlyArray<{ key: MeetingType; text: string }> = [
  { key: "onsite", text: "Presencial" },
  { key: "virtual", text: "Virtual" },
  { key: "hybrid", text: "Hibrida" },
];

export const MEETING_EDITABLE_STATUS_OPTIONS: ReadonlyArray<{ key: MeetingEditableStatus; text: string }> = [
  { key: "scheduled", text: "Programada" },
  { key: "draft", text: "Borrador" },
];

export const WORKFLOW_STATUS_OPTIONS: ReadonlyArray<{ key: MeetingWorkflowStatus | "all"; text: string }> = [
  { key: "all", text: "Todos los estados" },
  { key: "scheduled", text: "Programadas" },
  { key: "active", text: "En curso" },
  { key: "completed", text: "Finalizadas" },
  { key: "cancelled", text: "Canceladas" },
  { key: "draft", text: "Borradores" },
];

export const PRIORITY_OPTIONS: ReadonlyArray<{ key: MeetingPriority; text: string }> = [
  { key: "low", text: "Baja" },
  { key: "normal", text: "Normal" },
  { key: "high", text: "Alta" },
  { key: "critical", text: "Critica" },
];

export const ROOM_FEATURE_OPTIONS: ReadonlyArray<{ key: RoomFeature; text: string }> = [
  { key: "display", text: "Pantalla" },
  { key: "camera", text: "Camara" },
  { key: "microphone", text: "Microfono" },
  { key: "whiteboard", text: "Pizarra" },
  { key: "speakerphone", text: "Altavoz" },
  { key: "recording", text: "Grabacion" },
  { key: "dualScreen", text: "Doble pantalla" },
  { key: "accessible", text: "Accesible" },
  { key: "hybridKit", text: "Kit hibrido" },
];

export const DASHBOARD_VIEW_OPTIONS: ReadonlyArray<{ key: DashboardViewKey; text: string }> = [
  { key: "agenda", text: "Agenda" },
  { key: "calendar", text: "Calendario" },
  { key: "board", text: "Tablero" },
  { key: "rooms", text: "Salas" },
  { key: "teams", text: "Equipos" },
  { key: "status", text: "Estado" },
  { key: "timeline", text: "Timeline" },
];

export const DEFAULT_FILTERS = (dateIso: string): DashboardFilters => ({
  selectedDateIso: dateIso,
  meetingType: "all",
  status: "all",
  organizerId: "all",
  roomId: "all",
  teamId: "all",
  searchText: "",
  favoritesOnly: false,
});

export const MINIMUM_MEETING_DURATION_MINUTES = 15;

export const QUICK_TIME_WINDOWS = {
  soonThresholdMinutes: 30,
  alertThresholdMinutes: 15,
} as const;
