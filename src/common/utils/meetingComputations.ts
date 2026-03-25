import {
  CalendarDayColumn,
  DashboardFilters,
  MeetingMetric,
  MeetingRecord,
  MeetingRoom,
  MeetingWorkflowStatus,
  RoomOccupancySummary,
  StatusMeetingBucket,
  TeamMeetingBucket,
  TimelineEntry,
} from "../models/meetManagerModels";
import { QUICK_TIME_WINDOWS } from "../constants/meetManagerConstants";
import {
  addDays,
  createDaySlotIso,
  formatDateLabel,
  formatDayLabel,
  formatTimeLabel,
  getMinutesBetween,
  isSameDay,
  overlaps,
  startOfDay,
  toIso,
} from "./dateTime";

const STATUS_TITLES: Record<MeetingWorkflowStatus, string> = {
  draft: "Borradores",
  scheduled: "Programadas",
  active: "En curso",
  completed: "Finalizadas",
  cancelled: "Canceladas",
};

export const normalizeMeetingStatus = (meeting: MeetingRecord, now: Date): MeetingWorkflowStatus => {
  if (meeting.status === "draft" || meeting.status === "cancelled" || meeting.status === "completed") {
    return meeting.status;
  }

  const start = new Date(meeting.startIso).getTime();
  const end = new Date(meeting.endIso).getTime();
  const current = now.getTime();

  if (current >= end) {
    return "completed";
  }

  if (current >= start && current < end) {
    return "active";
  }

  return "scheduled";
};

export const normalizeMeetings = (meetings: ReadonlyArray<MeetingRecord>, now: Date): MeetingRecord[] =>
  meetings
    .map((meeting) => ({
      ...meeting,
      status: normalizeMeetingStatus(meeting, now),
    }))
    .sort((left, right) => new Date(left.startIso).getTime() - new Date(right.startIso).getTime());

export const applyDashboardFilters = (
  meetings: ReadonlyArray<MeetingRecord>,
  filters: DashboardFilters
): MeetingRecord[] =>
  meetings.filter((meeting) => {
    const matchesDate = isSameDay(meeting.startIso, filters.selectedDateIso);
    const matchesType = filters.meetingType === "all" || meeting.type === filters.meetingType;
    const matchesStatus = filters.status === "all" || meeting.status === filters.status;
    const matchesOrganizer = filters.organizerId === "all" || meeting.organizer.id === filters.organizerId;
    const matchesRoom = filters.roomId === "all" || meeting.roomId === filters.roomId;
    const matchesTeam = filters.teamId === "all" || meeting.teamContext?.teamId === filters.teamId;
    const matchesFavorites = !filters.favoritesOnly || meeting.isFavorite;
    const query = filters.searchText.trim().toLocaleLowerCase();
    const matchesSearch =
      query.length === 0 ||
      meeting.title.toLocaleLowerCase().includes(query) ||
      meeting.organizer.displayName.toLocaleLowerCase().includes(query) ||
      meeting.tags.some((tag) => tag.toLocaleLowerCase().includes(query));

    return (
      matchesDate &&
      matchesType &&
      matchesStatus &&
      matchesOrganizer &&
      matchesRoom &&
      matchesTeam &&
      matchesFavorites &&
      matchesSearch
    );
  });

export const buildMetrics = (
  meetings: ReadonlyArray<MeetingRecord>,
  roomSummaries: ReadonlyArray<RoomOccupancySummary>,
  selectedDateIso: string
): MeetingMetric[] => {
  const dailyMeetings = meetings.filter((meeting) => isSameDay(meeting.startIso, selectedDateIso));
  const active = dailyMeetings.filter((meeting) => meeting.status === "active").length;
  const conflicts = dailyMeetings.filter((meeting) => meeting.incidents.some((incident) => incident.status !== "resolved")).length;
  const occupiedRooms = roomSummaries.filter((summary) => summary.state === "busy").length;

  return [
    {
      id: "today",
      label: "Reuniones del dia",
      value: dailyMeetings.length.toString(),
      helpText: "Incluye borradores, programadas y activas del dia seleccionado.",
      tone: "neutral",
    },
    {
      id: "active",
      label: "En curso",
      value: active.toString(),
      helpText: "Reuniones que se estan celebrando en este momento.",
      tone: active > 0 ? "positive" : "neutral",
    },
    {
      id: "conflicts",
      label: "Incidencias abiertas",
      value: conflicts.toString(),
      helpText: "Reuniones con incidencias de sala, conexion o soporte pendientes.",
      tone: conflicts > 0 ? "warning" : "positive",
    },
    {
      id: "rooms",
      label: "Salas ocupadas",
      value: occupiedRooms.toString(),
      helpText: "Salas actualmente reservadas o en uso.",
      tone: occupiedRooms > 0 ? "neutral" : "positive",
    },
  ];
};

export const buildRoomOccupancySummary = (
  rooms: ReadonlyArray<MeetingRoom>,
  meetings: ReadonlyArray<MeetingRecord>,
  now: Date
): RoomOccupancySummary[] =>
  rooms.map((room) => {
    const roomMeetings = meetings.filter((meeting) => meeting.roomId === room.id && meeting.status !== "cancelled");
    const currentMeeting = roomMeetings.find((meeting) => meeting.status === "active");
    const nextMeeting = roomMeetings.find((meeting) => new Date(meeting.startIso).getTime() > now.getTime());

    let state = room.state;
    if (room.state !== "maintenance") {
      if (currentMeeting) {
        state = "busy";
      } else if (
        nextMeeting &&
        getMinutesBetween(toIso(now), nextMeeting.startIso) <= QUICK_TIME_WINDOWS.soonThresholdMinutes
      ) {
        state = "soon";
      } else {
        state = "available";
      }
    }

    return {
      room,
      state,
      currentMeeting,
      nextMeeting,
    };
  });

export const buildAgendaByDay = (meetings: ReadonlyArray<MeetingRecord>, selectedDateIso: string): MeetingRecord[] =>
  meetings
    .filter((meeting) => isSameDay(meeting.startIso, selectedDateIso))
    .sort((left, right) => new Date(left.startIso).getTime() - new Date(right.startIso).getTime());

export const buildCalendarColumns = (
  meetings: ReadonlyArray<MeetingRecord>,
  selectedDateIso: string
): CalendarDayColumn[] => {
  const startDate = startOfDay(new Date(selectedDateIso));

  return new Array(7).fill(undefined).map((_, index) => {
    const currentDate = addDays(startDate, index);
    const currentIso = currentDate.toISOString();

    return {
      dayLabel: formatDayLabel(currentIso),
      dateIso: currentIso,
      meetings: meetings
        .filter((meeting) => isSameDay(meeting.startIso, currentIso))
        .sort((left, right) => new Date(left.startIso).getTime() - new Date(right.startIso).getTime()),
    };
  });
};

export const buildTimelineEntries = (
  meetings: ReadonlyArray<MeetingRecord>,
  selectedDateIso: string
): TimelineEntry[] => {
  const entries: TimelineEntry[] = [];

  for (let hour = 7; hour <= 19; hour += 1) {
    [0, 30].forEach((minute) => {
      const slotIso = createDaySlotIso(selectedDateIso, hour, minute);
      const slotEndIso = new Date(new Date(slotIso).getTime() + 30 * 60000).toISOString();
      const meeting = meetings.find((entry) => overlaps(slotIso, slotEndIso, entry.startIso, entry.endIso));

      entries.push({
        id: `${hour}-${minute}`,
        timeLabel: formatTimeLabel(slotIso),
        meeting,
      });
    });
  }

  return entries;
};

export const buildTeamBuckets = (meetings: ReadonlyArray<MeetingRecord>): TeamMeetingBucket[] => {
  const buckets = new Map<string, TeamMeetingBucket>();

  meetings.forEach((meeting) => {
    const key = meeting.teamContext?.teamId ?? "sin-equipo";
    const title = meeting.teamContext?.teamName ?? "Sin equipo asociado";
    const subtitle = meeting.teamContext?.channelName ?? "Uso transversal";
    const currentBucket = buckets.get(key);

    if (currentBucket) {
      currentBucket.meetings.push(meeting);
      return;
    }

    buckets.set(key, {
      id: key,
      title,
      subtitle,
      meetings: [meeting],
    });
  });

  return Array.from(buckets.values()).sort((left, right) => left.title.localeCompare(right.title, "es"));
};

export const buildStatusBuckets = (meetings: ReadonlyArray<MeetingRecord>): StatusMeetingBucket[] =>
  (["active", "scheduled", "draft", "completed", "cancelled"] as MeetingWorkflowStatus[]).map((status) => ({
    status,
    title: STATUS_TITLES[status],
    meetings: meetings.filter((meeting) => meeting.status === status),
  }));

export const getMeetingTypeLabel = (meetingType: MeetingRecord["type"]): string => {
  if (meetingType === "onsite") {
    return "Presencial";
  }

  if (meetingType === "virtual") {
    return "Virtual";
  }

  return "Hibrida";
};

export const getStatusLabel = (status: MeetingWorkflowStatus): string => STATUS_TITLES[status];

export const getRelativeAlertLabel = (meeting: MeetingRecord, now: Date): string => {
  const minutesUntilStart = getMinutesBetween(toIso(now), meeting.startIso);
  if (meeting.status === "active") {
    return "En curso";
  }

  if (minutesUntilStart <= QUICK_TIME_WINDOWS.alertThresholdMinutes && minutesUntilStart >= 0) {
    return "Empieza pronto";
  }

  if (minutesUntilStart < 0) {
    return "Ya finalizada";
  }

  return formatDateLabel(meeting.startIso);
};
