export type DataSourceMode = "mock" | "sharepoint";

export type MeetingType = "onsite" | "virtual" | "hybrid";

export type MeetingWorkflowStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "completed"
  | "cancelled";

export type MeetingEditableStatus = "draft" | "scheduled";

export type MeetingPriority = "low" | "normal" | "high" | "critical";

export type DashboardViewKey =
  | "agenda"
  | "calendar"
  | "board"
  | "rooms"
  | "teams"
  | "status"
  | "timeline";

export type RoomFeature =
  | "display"
  | "camera"
  | "microphone"
  | "whiteboard"
  | "speakerphone"
  | "recording"
  | "dualScreen"
  | "accessible"
  | "hybridKit";

export type RoomOperationalState = "available" | "busy" | "soon" | "maintenance";

export type IncidentSeverity = "low" | "medium" | "high";

export type IncidentStatus = "open" | "inProgress" | "resolved";

export type ValidationSeverity = "error" | "warning" | "info";

export interface DirectoryUser {
  id: string;
  displayName: string;
  email: string;
  title: string;
  department: string;
  teamId?: string;
  teamName?: string;
}

export interface TeamContextInfo {
  teamId: string;
  teamName: string;
  channelId?: string;
  channelName?: string;
}

export interface TeamsMeetingInfo {
  meetingId: string;
  joinUrl: string;
  dialInNumber?: string;
  joinWebUrlLabel?: string;
  provider: "teams";
  isProvisioned: boolean;
}

export interface MeetingAttendee {
  id: string;
  displayName: string;
  email: string;
  role: "organizer" | "required" | "optional";
  responseStatus: "accepted" | "tentative" | "pending" | "declined";
  isExternal: boolean;
}

export interface MeetingDocument {
  id: string;
  title: string;
  url: string;
  source: "sharepoint" | "onedrive" | "teams" | "link";
}

export interface MeetingChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  ownerName?: string;
}

export interface MeetingChangeLog {
  id: string;
  label: string;
  createdAtIso: string;
  actorName: string;
}

export interface MeetingNoteEntry {
  id: string;
  authorName: string;
  createdAtIso: string;
  text: string;
  kind: "preparation" | "operations" | "retrospective";
}

export interface MeetingIncident {
  id: string;
  meetingId?: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAtIso: string;
  ownerName: string;
}

export interface MeetingRoom {
  id: string;
  title: string;
  mailbox: string;
  capacity: number;
  building: string;
  floor: string;
  locationLabel: string;
  features: RoomFeature[];
  state: RoomOperationalState;
  notes?: string;
  mapUrl?: string;
}

export interface MeetingDraft {
  id?: string;
  title: string;
  description: string;
  organizerId: string;
  startIso: string;
  endIso: string;
  type: MeetingType;
  roomId?: string;
  teamsMeetingUrl?: string;
  teamId?: string;
  teamName?: string;
  channelId?: string;
  channelName?: string;
  attendeeEmails: string[];
  externalGuests: string[];
  priority: MeetingPriority;
  tagValues: string[];
  status: MeetingEditableStatus;
  equipmentRequirements: RoomFeature[];
  preMeetingNotes: string;
  agendaItems: string[];
  documentLinks: string[];
  checklistLabels: string[];
  isFavorite: boolean;
}

export interface MeetingRecord {
  id: string;
  title: string;
  description: string;
  organizer: DirectoryUser;
  startIso: string;
  endIso: string;
  type: MeetingType;
  roomId?: string;
  teamsMeeting?: TeamsMeetingInfo;
  teamContext?: TeamContextInfo;
  attendees: MeetingAttendee[];
  externalGuests: string[];
  priority: MeetingPriority;
  tags: string[];
  status: MeetingWorkflowStatus;
  equipmentRequirements: RoomFeature[];
  preMeetingNotes: string;
  agendaItems: string[];
  documents: MeetingDocument[];
  checklist: MeetingChecklistItem[];
  notes: MeetingNoteEntry[];
  recentChanges: MeetingChangeLog[];
  incidents: MeetingIncident[];
  isFavorite: boolean;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface MeetingTemplate {
  id: string;
  title: string;
  summary: string;
  defaults: MeetingDraft;
}

export interface DashboardFilters {
  selectedDateIso: string;
  meetingType: MeetingType | "all";
  status: MeetingWorkflowStatus | "all";
  organizerId: string | "all";
  roomId: string | "all";
  teamId: string | "all";
  searchText: string;
  favoritesOnly: boolean;
}

export interface SavedFilter {
  id: string;
  title: string;
  description: string;
  accentColor: string;
  filters: DashboardFilters;
}

export interface ValidationIssue {
  id: string;
  message: string;
  severity: ValidationSeverity;
  field?: keyof MeetingDraft;
}

export interface SuggestedSlot {
  id: string;
  label: string;
  startIso: string;
  endIso: string;
  roomId?: string;
  confidence: number;
}

export interface RoomRecommendation {
  roomId: string;
  score: number;
  reasons: string[];
}

export interface MeetingValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  roomRecommendations: RoomRecommendation[];
  suggestedSlots: SuggestedSlot[];
}

export interface DashboardSnapshot {
  generatedAtIso: string;
  currentUser: DirectoryUser;
  meetings: MeetingRecord[];
  rooms: MeetingRoom[];
  templates: MeetingTemplate[];
  savedFilters: SavedFilter[];
  incidents: MeetingIncident[];
}

export interface TeamsPanelSnapshot {
  generatedAtIso: string;
  activeMeeting?: MeetingRecord;
  meetings: MeetingRecord[];
  inferredTeamContext?: TeamContextInfo;
}

export interface MeetingMetric {
  id: string;
  label: string;
  value: string;
  helpText: string;
  tone: "neutral" | "positive" | "warning" | "critical";
}

export interface RoomOccupancySummary {
  room: MeetingRoom;
  state: RoomOperationalState;
  currentMeeting?: MeetingRecord;
  nextMeeting?: MeetingRecord;
}

export interface CalendarDayColumn {
  dayLabel: string;
  dateIso: string;
  meetings: MeetingRecord[];
}

export interface TimelineEntry {
  id: string;
  timeLabel: string;
  meeting?: MeetingRecord;
}

export interface TeamMeetingBucket {
  id: string;
  title: string;
  subtitle: string;
  meetings: MeetingRecord[];
}

export interface StatusMeetingBucket {
  status: MeetingWorkflowStatus;
  title: string;
  meetings: MeetingRecord[];
}
