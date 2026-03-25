import { useEffect, useRef, useState } from "react";
import { createMeetManagerService } from "../services/MeetManagerServiceFactory";
import { IMeetManagerService } from "../services/interfaces/IMeetManagerService";
import {
  CalendarDayColumn,
  DashboardFilters,
  DashboardSnapshot,
  DashboardViewKey,
  MeetingDraft,
  MeetingMetric,
  MeetingRecord,
  MeetingTemplate,
  MeetingValidationResult,
  RoomOccupancySummary,
  StatusMeetingBucket,
  TeamMeetingBucket,
  TimelineEntry,
} from "../models/meetManagerModels";
import { DEFAULT_FILTERS } from "../constants/meetManagerConstants";
import {
  applyDashboardFilters,
  buildCalendarColumns,
  buildMetrics,
  buildRoomOccupancySummary,
  buildStatusBuckets,
  buildTeamBuckets,
  buildTimelineEntries,
} from "../utils/meetingComputations";
import { addMinutes, getTodayIso } from "../utils/dateTime";
import { IMeetManagerServiceConfiguration } from "../services/interfaces/IMeetManagerService";
import { WebPartContext } from "@microsoft/sp-webpart-base";

type ComposerMode = "create" | "edit";

interface IUseMeetManagerDashboardProps {
  context: WebPartContext;
  configuration: IMeetManagerServiceConfiguration;
  defaultView: DashboardViewKey;
}

export interface IMeetManagerDashboardState {
  snapshot?: DashboardSnapshot;
  isLoading: boolean;
  errorMessage?: string;
  view: DashboardViewKey;
  filters: DashboardFilters;
  meetings: MeetingRecord[];
  metrics: MeetingMetric[];
  roomSummaries: RoomOccupancySummary[];
  calendarColumns: CalendarDayColumn[];
  timelineEntries: TimelineEntry[];
  teamBuckets: TeamMeetingBucket[];
  statusBuckets: StatusMeetingBucket[];
  selectedMeeting?: MeetingRecord;
  isComposerOpen: boolean;
  composerMode: ComposerMode;
  draft: MeetingDraft;
  validation?: MeetingValidationResult;
  setView: (view: DashboardViewKey) => void;
  setFilters: (patch: Partial<DashboardFilters>) => void;
  applyTemplate: (template: MeetingTemplate) => void;
  applySavedFilter: (filter: DashboardSnapshot["savedFilters"][number]) => void;
  refresh: () => Promise<void>;
  openCreate: () => void;
  openEdit: (meeting: MeetingRecord) => void;
  closeComposer: () => void;
  updateDraft: <K extends keyof MeetingDraft>(field: K, value: MeetingDraft[K]) => void;
  saveDraft: () => Promise<void>;
  cancelMeeting: (meetingId: string) => Promise<void>;
  completeMeeting: (meetingId: string) => Promise<void>;
  releaseRoom: (meetingId: string) => Promise<void>;
  duplicateMeeting: (meetingId: string) => Promise<void>;
  toggleFavorite: (meetingId: string) => Promise<void>;
  selectMeeting: (meetingId: string) => void;
}

const createEmptyDraft = (organizerId: string): MeetingDraft => {
  const start = addMinutes(new Date(), 30);
  const end = addMinutes(start, 60);

  return {
    title: "",
    description: "",
    organizerId,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    type: "hybrid",
    attendeeEmails: [],
    externalGuests: [],
    priority: "normal",
    tagValues: [],
    status: "scheduled",
    equipmentRequirements: [],
    preMeetingNotes: "",
    agendaItems: [],
    documentLinks: [],
    checklistLabels: [],
    isFavorite: false,
  };
};

const mapMeetingToDraft = (meeting: MeetingRecord): MeetingDraft => ({
  id: meeting.id,
  title: meeting.title,
  description: meeting.description,
  organizerId: meeting.organizer.id,
  startIso: meeting.startIso,
  endIso: meeting.endIso,
  type: meeting.type,
  roomId: meeting.roomId,
  teamsMeetingUrl: meeting.teamsMeeting?.joinUrl,
  teamId: meeting.teamContext?.teamId,
  teamName: meeting.teamContext?.teamName,
  channelId: meeting.teamContext?.channelId,
  channelName: meeting.teamContext?.channelName,
  attendeeEmails: meeting.attendees.map((attendee) => attendee.email),
  externalGuests: meeting.externalGuests,
  priority: meeting.priority,
  tagValues: meeting.tags,
  status: meeting.status === "draft" ? "draft" : "scheduled",
  equipmentRequirements: meeting.equipmentRequirements,
  preMeetingNotes: meeting.preMeetingNotes,
  agendaItems: meeting.agendaItems,
  documentLinks: meeting.documents.map((document) => document.url),
  checklistLabels: meeting.checklist.map((entry) => entry.label),
  isFavorite: meeting.isFavorite,
});

export const useMeetManagerDashboard = ({
  context,
  configuration,
  defaultView,
}: IUseMeetManagerDashboardProps): IMeetManagerDashboardState => {
  const serviceRef = useRef<IMeetManagerService | undefined>(undefined);
  if (!serviceRef.current) {
    serviceRef.current = createMeetManagerService({
      context,
      configuration,
    });
  }

  const service = serviceRef.current;
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [view, setView] = useState<DashboardViewKey>(defaultView);
  const [filters, setFiltersState] = useState<DashboardFilters>(DEFAULT_FILTERS(getTodayIso()));
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>();
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>("create");
  const [draft, setDraft] = useState<MeetingDraft>(createEmptyDraft(context.pageContext.user.loginName));
  const [validation, setValidation] = useState<MeetingValidationResult>();

  const refresh = async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const nextSnapshot = await service.getDashboardSnapshot();
      setSnapshot(nextSnapshot);
      if (!selectedMeetingId && nextSnapshot.meetings.length > 0) {
        setSelectedMeetingId(nextSnapshot.meetings[0].id);
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!isComposerOpen) {
      return;
    }

    let isActive = true;
    void service.validateMeeting(draft).then((result) => {
      if (isActive) {
        setValidation(result);
      }
    });

    return () => {
      isActive = false;
    };
  }, [draft, isComposerOpen]);

  const meetings = snapshot ? applyDashboardFilters(snapshot.meetings, filters) : [];
  const roomSummaries = snapshot ? buildRoomOccupancySummary(snapshot.rooms, snapshot.meetings, new Date()) : [];
  const metrics = buildMetrics(snapshot?.meetings ?? [], roomSummaries, filters.selectedDateIso);
  const calendarColumns = buildCalendarColumns(snapshot?.meetings ?? [], filters.selectedDateIso);
  const timelineEntries = buildTimelineEntries(meetings, filters.selectedDateIso);
  const teamBuckets = buildTeamBuckets(meetings);
  const statusBuckets = buildStatusBuckets(meetings);
  const selectedMeeting = meetings.find((meeting) => meeting.id === selectedMeetingId) ?? snapshot?.meetings.find((meeting) => meeting.id === selectedMeetingId) ?? meetings[0];

  const setFilters = (patch: Partial<DashboardFilters>): void => {
    setFiltersState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const openCreate = (): void => {
    setComposerMode("create");
    setDraft(createEmptyDraft(snapshot?.currentUser.id ?? context.pageContext.user.loginName));
    setValidation(undefined);
    setIsComposerOpen(true);
  };

  const openEdit = (meeting: MeetingRecord): void => {
    setComposerMode("edit");
    setDraft(mapMeetingToDraft(meeting));
    setValidation(undefined);
    setIsComposerOpen(true);
  };

  const closeComposer = (): void => {
    setIsComposerOpen(false);
  };

  const updateDraft = <K extends keyof MeetingDraft>(field: K, value: MeetingDraft[K]): void => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveDraft = async (): Promise<void> => {
    await service.saveMeeting(draft);
    setIsComposerOpen(false);
    await refresh();
  };

  const cancelMeeting = async (meetingId: string): Promise<void> => {
    await service.cancelMeeting(meetingId);
    await refresh();
  };

  const completeMeeting = async (meetingId: string): Promise<void> => {
    await service.completeMeeting(meetingId);
    await refresh();
  };

  const releaseRoom = async (meetingId: string): Promise<void> => {
    await service.releaseRoom(meetingId);
    await refresh();
  };

  const duplicateMeeting = async (meetingId: string): Promise<void> => {
    const duplicated = await service.duplicateMeeting(meetingId);
    setComposerMode("create");
    setDraft(duplicated);
    setValidation(undefined);
    setIsComposerOpen(true);
  };

  const toggleFavorite = async (meetingId: string): Promise<void> => {
    await service.toggleFavorite(meetingId);
    await refresh();
  };

  const applyTemplate = (template: MeetingTemplate): void => {
    setComposerMode("create");
    setDraft(template.defaults);
    setValidation(undefined);
    setIsComposerOpen(true);
  };

  const applySavedFilter = (filter: DashboardSnapshot["savedFilters"][number]): void => {
    setFiltersState(filter.filters);
  };

  return {
    snapshot,
    isLoading,
    errorMessage,
    view,
    filters,
    meetings,
    metrics,
    roomSummaries,
    calendarColumns,
    timelineEntries,
    teamBuckets,
    statusBuckets,
    selectedMeeting,
    isComposerOpen,
    composerMode,
    draft,
    validation,
    setView,
    setFilters,
    applyTemplate,
    applySavedFilter,
    refresh,
    openCreate,
    openEdit,
    closeComposer,
    updateDraft,
    saveDraft,
    cancelMeeting,
    completeMeeting,
    releaseRoom,
    duplicateMeeting,
    toggleFavorite,
    selectMeeting: (meetingId: string) => setSelectedMeetingId(meetingId),
  };
};
