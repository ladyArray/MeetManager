import {
  DashboardSnapshot,
  MeetingAttendee,
  MeetingDraft,
  MeetingRecord,
  MeetingValidationResult,
  TeamsMeetingInfo,
  TeamsPanelSnapshot,
} from "../../models/meetManagerModels";
import { normalizeMeetings } from "../../utils/meetingComputations";
import { addDays } from "../../utils/dateTime";
import { validateMeetingDraft } from "../../validators/meetingValidator";
import { logger } from "../../telemetry/MeetManagerLogger";
import { IMeetManagerService } from "../interfaces/IMeetManagerService";
import { createMockStore, IMockStore } from "./mockData";

const mockStore: IMockStore = createMockStore();

const cloneValue = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const findUserByEmail = (email: string): IMockStore["directoryUsers"][number] | undefined =>
  mockStore.directoryUsers.find((user) => user.email.toLocaleLowerCase() === email.toLocaleLowerCase());

const findUserById = (userId: string): IMockStore["directoryUsers"][number] | undefined =>
  mockStore.directoryUsers.find((user) => user.id === userId);

const createAttendees = (draft: MeetingDraft): MeetingAttendee[] =>
  draft.attendeeEmails.map((email, index) => {
    const user = findUserByEmail(email);
    return {
      id: `attendee-${draft.id ?? "new"}-${index}`,
      displayName: user?.displayName ?? email,
      email,
      role: user?.id === draft.organizerId ? "organizer" : "required",
      responseStatus: "accepted",
      isExternal: false,
    };
  });

const createTeamsMeeting = (draft: MeetingDraft): TeamsMeetingInfo | undefined => {
  if (draft.type === "onsite" && !draft.teamsMeetingUrl) {
    return undefined;
  }

  const joinUrl =
    draft.teamsMeetingUrl && draft.teamsMeetingUrl.trim().length > 0
      ? draft.teamsMeetingUrl
      : `https://teams.microsoft.com/l/meetup-join/${draft.id ?? "new"}-${Date.now()}`;

  return {
    meetingId: `${draft.id ?? "new"}-teams`,
    joinUrl,
    provider: "teams",
    isProvisioned: true,
    joinWebUrlLabel: "Abrir en Teams",
  };
};

const createMeetingRecordFromDraft = (draft: MeetingDraft, existing?: MeetingRecord): MeetingRecord => {
  const organizer = findUserById(draft.organizerId) ?? mockStore.currentUser;
  const meetingId = draft.id ?? `meeting-${Date.now()}`;
  const nowIso = new Date().toISOString();
  const existingNotes = existing?.notes ?? [];
  const existingIncidents = existing?.incidents ?? [];

  return {
    id: meetingId,
    title: draft.title,
    description: draft.description,
    organizer,
    startIso: draft.startIso,
    endIso: draft.endIso,
    type: draft.type,
    roomId: draft.roomId,
    teamsMeeting: createTeamsMeeting({ ...draft, id: meetingId }),
    teamContext:
      draft.teamId && draft.teamName
        ? {
            teamId: draft.teamId,
            teamName: draft.teamName,
            channelId: draft.channelId,
            channelName: draft.channelName,
          }
        : undefined,
    attendees: createAttendees({ ...draft, id: meetingId }),
    externalGuests: draft.externalGuests,
    priority: draft.priority,
    tags: draft.tagValues,
    status: draft.status,
    equipmentRequirements: draft.equipmentRequirements,
    preMeetingNotes: draft.preMeetingNotes,
    agendaItems: draft.agendaItems,
    documents: draft.documentLinks.map((link, index) => ({
      id: `${meetingId}-doc-${index}`,
      title: `Documento ${index + 1}`,
      url: link,
      source: "link",
    })),
    checklist: draft.checklistLabels.map((label, index) => ({
      id: `${meetingId}-check-${index}`,
      label,
      completed: existing?.checklist[index]?.completed ?? false,
      ownerName: organizer.displayName,
    })),
    notes:
      draft.preMeetingNotes.trim().length > 0
        ? [
            ...existingNotes,
            {
              id: `${meetingId}-note-${Date.now()}`,
              authorName: organizer.displayName,
              createdAtIso: nowIso,
              text: draft.preMeetingNotes,
              kind: "preparation",
            },
          ]
        : existingNotes,
    recentChanges: [
      ...(existing?.recentChanges ?? []),
      {
        id: `${meetingId}-change-${Date.now()}`,
        actorName: organizer.displayName,
        createdAtIso: nowIso,
        label: existing ? "Se actualizaron datos operativos de la reunion." : "Se creo una nueva reunion desde el panel operativo.",
      },
    ],
    incidents: existingIncidents,
    isFavorite: draft.isFavorite,
    createdAtIso: existing?.createdAtIso ?? nowIso,
    updatedAtIso: nowIso,
  };
};

const getNormalizedStoreSnapshot = (): DashboardSnapshot => ({
  ...cloneValue(mockStore),
  generatedAtIso: new Date().toISOString(),
  meetings: normalizeMeetings(cloneValue(mockStore.meetings), new Date()),
});

export class MockMeetManagerService implements IMeetManagerService {
  public async getDashboardSnapshot(): Promise<DashboardSnapshot> {
    logger.info("Loading dashboard snapshot from mock store.");
    return getNormalizedStoreSnapshot();
  }

  public async getTeamsPanelSnapshot(): Promise<TeamsPanelSnapshot> {
    const meetings = normalizeMeetings(cloneValue(mockStore.meetings), new Date()).filter(
      (meeting) => meeting.type !== "onsite" || Boolean(meeting.teamsMeeting)
    );
    const activeMeeting = meetings.find((meeting) => meeting.status === "active");

    return {
      generatedAtIso: new Date().toISOString(),
      activeMeeting,
      meetings: meetings.slice(0, 8),
      inferredTeamContext: activeMeeting?.teamContext ?? meetings[0]?.teamContext,
    };
  }

  public async validateMeeting(draft: MeetingDraft): Promise<MeetingValidationResult> {
    return validateMeetingDraft(draft, {
      meetings: normalizeMeetings(cloneValue(mockStore.meetings), new Date()),
      rooms: cloneValue(mockStore.rooms),
    });
  }

  public async saveMeeting(draft: MeetingDraft): Promise<MeetingRecord> {
    const validation = await this.validateMeeting(draft);
    if (validation.errors.length > 0) {
      throw new Error(validation.errors.map((issue) => issue.message).join(" "));
    }

    const existing = draft.id ? mockStore.meetings.find((meeting) => meeting.id === draft.id) : undefined;
    const nextRecord = createMeetingRecordFromDraft(draft, existing);

    if (existing) {
      mockStore.meetings = mockStore.meetings.map((meeting) => (meeting.id === existing.id ? nextRecord : meeting));
    } else {
      mockStore.meetings = [...mockStore.meetings, nextRecord];
    }

    return cloneValue(nextRecord);
  }

  public async cancelMeeting(meetingId: string): Promise<void> {
    mockStore.meetings = mockStore.meetings.map((meeting) =>
      meeting.id === meetingId
        ? {
            ...meeting,
            status: "cancelled",
            updatedAtIso: new Date().toISOString(),
            recentChanges: [
              ...meeting.recentChanges,
              {
                id: `${meetingId}-cancel-${Date.now()}`,
                actorName: mockStore.currentUser.displayName,
                createdAtIso: new Date().toISOString(),
                label: "La reunion se ha cancelado desde el centro operativo.",
              },
            ],
          }
        : meeting
    );
  }

  public async completeMeeting(meetingId: string): Promise<void> {
    mockStore.meetings = mockStore.meetings.map((meeting) =>
      meeting.id === meetingId
        ? {
            ...meeting,
            status: "completed",
            updatedAtIso: new Date().toISOString(),
            recentChanges: [
              ...meeting.recentChanges,
              {
                id: `${meetingId}-complete-${Date.now()}`,
                actorName: mockStore.currentUser.displayName,
                createdAtIso: new Date().toISOString(),
                label: "Se marco la reunion como finalizada.",
              },
            ],
          }
        : meeting
    );
  }

  public async releaseRoom(meetingId: string): Promise<void> {
    mockStore.meetings = mockStore.meetings.map((meeting) =>
      meeting.id === meetingId
        ? {
            ...meeting,
            roomId: undefined,
            updatedAtIso: new Date().toISOString(),
            recentChanges: [
              ...meeting.recentChanges,
              {
                id: `${meetingId}-room-release-${Date.now()}`,
                actorName: mockStore.currentUser.displayName,
                createdAtIso: new Date().toISOString(),
                label: "Se libero la sala fisica asociada.",
              },
            ],
          }
        : meeting
    );
  }

  public async duplicateMeeting(meetingId: string): Promise<MeetingDraft> {
    const meeting = mockStore.meetings.find((entry) => entry.id === meetingId);
    if (!meeting) {
      throw new Error("Meeting not found.");
    }

    return {
      id: undefined,
      title: `${meeting.title} (copia)`,
      description: meeting.description,
      organizerId: meeting.organizer.id,
      startIso: addDays(new Date(meeting.startIso), 1).toISOString(),
      endIso: addDays(new Date(meeting.endIso), 1).toISOString(),
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
      checklistLabels: meeting.checklist.map((item) => item.label),
      isFavorite: meeting.isFavorite,
    };
  }

  public async toggleFavorite(meetingId: string): Promise<void> {
    mockStore.meetings = mockStore.meetings.map((meeting) =>
      meeting.id === meetingId
        ? {
            ...meeting,
            isFavorite: !meeting.isFavorite,
            updatedAtIso: new Date().toISOString(),
          }
        : meeting
    );
  }

  public async getMeetingById(meetingId: string): Promise<MeetingRecord | undefined> {
    const meeting = mockStore.meetings.find((entry) => entry.id === meetingId);
    return meeting ? cloneValue(meeting) : undefined;
  }

  public async createOnlineMeetingLink(draft: MeetingDraft): Promise<TeamsMeetingInfo | undefined> {
    return createTeamsMeeting(draft);
  }
}
