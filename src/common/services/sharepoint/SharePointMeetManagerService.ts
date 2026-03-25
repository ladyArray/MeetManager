import { ISPHttpClientOptions, SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import {
  DashboardSnapshot,
  MeetingDraft,
  MeetingIncident,
  MeetingRecord,
  MeetingRoom,
  MeetingTemplate,
  MeetingWorkflowStatus,
  SavedFilter,
  TeamsPanelSnapshot,
} from "../../models/meetManagerModels";
import { SHAREPOINT_FIELD_NAMES } from "../../constants/meetManagerConstants";
import { normalizeMeetings } from "../../utils/meetingComputations";
import { validateMeetingDraft } from "../../validators/meetingValidator";
import { logger } from "../../telemetry/MeetManagerLogger";
import { IMeetManagerService, IMeetManagerServiceDependencies } from "../interfaces/IMeetManagerService";
import { GraphIntegrationService } from "../graph/GraphIntegrationService";

type SharePointListItem = Record<string, unknown> & { Id: number; Title?: string };

interface ISharePointListResponse {
  value?: SharePointListItem[];
}

const parseJsonValue = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const toBoolean = (value: unknown): boolean => Boolean(value);

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  return fallback;
};

const toStringValue = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback);

const toWorkflowStatus = (value: unknown): MeetingWorkflowStatus => {
  const candidate = toStringValue(value, "scheduled") as MeetingWorkflowStatus;
  return ["draft", "scheduled", "active", "completed", "cancelled"].indexOf(candidate) >= 0 ? candidate : "scheduled";
};

const getFieldValues = <T extends Record<string, string>>(fieldMap: T): string[] =>
  Object.keys(fieldMap).map((key) => fieldMap[key as keyof T]);

export class SharePointMeetManagerService implements IMeetManagerService {
  private readonly graphService: GraphIntegrationService;

  public constructor(private readonly dependencies: IMeetManagerServiceDependencies) {
    this.graphService = new GraphIntegrationService(this.dependencies.context);
  }

  public async getDashboardSnapshot(): Promise<DashboardSnapshot> {
    logger.info("Loading dashboard snapshot from SharePoint.");

    const [meetings, rooms, templates, incidents, savedFilters] = await Promise.all([
      this.loadMeetings(),
      this.loadRooms(),
      this.safeLoad(this.dependencies.configuration.templateListTitle, () => this.loadTemplates(), []),
      this.safeLoad(this.dependencies.configuration.incidentListTitle, () => this.loadIncidents(), []),
      this.safeLoad(this.dependencies.configuration.configurationListTitle, () => this.loadSavedFilters(), []),
    ]);

    const incidentMap = new Map<string, MeetingIncident[]>();
    incidents.forEach((incident) => {
      if (!incident.meetingId) {
        return;
      }

      const currentIncidents = incidentMap.get(incident.meetingId) ?? [];
      currentIncidents.push(incident);
      incidentMap.set(incident.meetingId, currentIncidents);
    });

    const normalizedMeetings = normalizeMeetings(
      meetings.map((meeting) => ({
        ...meeting,
        incidents: incidentMap.get(meeting.id) ?? meeting.incidents,
      })),
      new Date()
    );

    return {
      generatedAtIso: new Date().toISOString(),
      currentUser: {
        id: this.dependencies.context.pageContext.user.loginName,
        displayName: this.dependencies.context.pageContext.user.displayName,
        email: this.dependencies.context.pageContext.user.email,
        title: "Current User",
        department: "Unknown",
      },
      meetings: normalizedMeetings,
      rooms,
      templates,
      savedFilters,
      incidents,
    };
  }

  public async getTeamsPanelSnapshot(): Promise<TeamsPanelSnapshot> {
    const dashboard = await this.getDashboardSnapshot();
    const meetings = dashboard.meetings.filter((meeting) => meeting.type !== "onsite" || Boolean(meeting.teamsMeeting));
    const activeMeeting = meetings.find((meeting) => meeting.status === "active");

    return {
      generatedAtIso: dashboard.generatedAtIso,
      activeMeeting,
      meetings: meetings.slice(0, 8),
      inferredTeamContext: activeMeeting?.teamContext ?? meetings[0]?.teamContext,
    };
  }

  public async validateMeeting(draft: MeetingDraft): Promise<ReturnType<typeof validateMeetingDraft>> {
    const snapshot = await this.getDashboardSnapshot();
    return validateMeetingDraft(draft, {
      meetings: snapshot.meetings,
      rooms: snapshot.rooms,
    });
  }

  public async saveMeeting(draft: MeetingDraft): Promise<MeetingRecord> {
    const validation = await this.validateMeeting(draft);
    if (validation.errors.length > 0) {
      throw new Error(validation.errors.map((issue) => issue.message).join(" "));
    }

    const graphMeeting =
      this.dependencies.configuration.enableGraphAssist && draft.type !== "onsite" && !draft.teamsMeetingUrl
        ? await this.graphService.createOnlineMeetingLink(draft)
        : undefined;

    const enrichedDraft: MeetingDraft = {
      ...draft,
      teamsMeetingUrl: graphMeeting?.joinUrl ?? draft.teamsMeetingUrl,
    };

    const existingItem = enrichedDraft.id ? await this.getMeetingListItemByMeetingId(enrichedDraft.id) : undefined;
    const payload = this.buildMeetingPayload(enrichedDraft);

    if (existingItem) {
      await this.updateListItem(this.dependencies.configuration.meetingListTitle, existingItem.Id, payload);
    } else {
      await this.createListItem(this.dependencies.configuration.meetingListTitle, payload);
    }

    const savedMeeting = await this.getMeetingById(payload[SHAREPOINT_FIELD_NAMES.meetingId] as string);
    if (!savedMeeting) {
      throw new Error("Unable to load saved meeting.");
    }

    return savedMeeting;
  }

  public async cancelMeeting(meetingId: string): Promise<void> {
    await this.updateMeetingFields(meetingId, {
      [SHAREPOINT_FIELD_NAMES.workflowStatus]: "cancelled",
    });
  }

  public async completeMeeting(meetingId: string): Promise<void> {
    await this.updateMeetingFields(meetingId, {
      [SHAREPOINT_FIELD_NAMES.workflowStatus]: "completed",
    });
  }

  public async releaseRoom(meetingId: string): Promise<void> {
    await this.updateMeetingFields(meetingId, {
      [SHAREPOINT_FIELD_NAMES.roomId]: null,
      [SHAREPOINT_FIELD_NAMES.roomName]: null,
    });
  }

  public async duplicateMeeting(meetingId: string): Promise<MeetingDraft> {
    const meeting = await this.getMeetingById(meetingId);
    if (!meeting) {
      throw new Error("Meeting not found.");
    }

    return {
      id: undefined,
      title: `${meeting.title} (copia)`,
      description: meeting.description,
      organizerId: meeting.organizer.id,
      startIso: new Date(new Date(meeting.startIso).getTime() + 24 * 60 * 60000).toISOString(),
      endIso: new Date(new Date(meeting.endIso).getTime() + 24 * 60 * 60000).toISOString(),
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
    };
  }

  public async toggleFavorite(meetingId: string): Promise<void> {
    const meeting = await this.getMeetingById(meetingId);
    if (!meeting) {
      return;
    }

    await this.updateMeetingFields(meetingId, {
      [SHAREPOINT_FIELD_NAMES.isFavorite]: !meeting.isFavorite,
    });
  }

  public async getMeetingById(meetingId: string): Promise<MeetingRecord | undefined> {
    const item = await this.getMeetingListItemByMeetingId(meetingId);
    if (!item) {
      return undefined;
    }

    return this.mapMeetingItem(item);
  }

  public async createOnlineMeetingLink(draft: MeetingDraft): Promise<Awaited<ReturnType<GraphIntegrationService["createOnlineMeetingLink"]>>> {
    return this.graphService.createOnlineMeetingLink(draft);
  }

  private async loadMeetings(): Promise<MeetingRecord[]> {
    const items = await this.getListItems(this.dependencies.configuration.meetingListTitle, [
      "Id",
      "Title",
      ...getFieldValues(SHAREPOINT_FIELD_NAMES),
    ]);

    return items.map((item) => this.mapMeetingItem(item));
  }

  private async loadRooms(): Promise<MeetingRoom[]> {
    const items = await this.getListItems(this.dependencies.configuration.roomListTitle, [
      "Id",
      "Title",
      SHAREPOINT_FIELD_NAMES.roomId,
      SHAREPOINT_FIELD_NAMES.roomMailbox,
      SHAREPOINT_FIELD_NAMES.capacity,
      SHAREPOINT_FIELD_NAMES.building,
      SHAREPOINT_FIELD_NAMES.floor,
      SHAREPOINT_FIELD_NAMES.locationLabel,
      SHAREPOINT_FIELD_NAMES.featuresJson,
      SHAREPOINT_FIELD_NAMES.roomState,
      SHAREPOINT_FIELD_NAMES.roomNotes,
      SHAREPOINT_FIELD_NAMES.mapUrl,
    ]);

    return items.map((item) => ({
      id: toStringValue(item[SHAREPOINT_FIELD_NAMES.roomId], `room-${item.Id}`),
      title: toStringValue(item.Title),
      mailbox: toStringValue(item[SHAREPOINT_FIELD_NAMES.roomMailbox]),
      capacity: toNumber(item[SHAREPOINT_FIELD_NAMES.capacity], 0),
      building: toStringValue(item[SHAREPOINT_FIELD_NAMES.building]),
      floor: toStringValue(item[SHAREPOINT_FIELD_NAMES.floor]),
      locationLabel: toStringValue(item[SHAREPOINT_FIELD_NAMES.locationLabel]),
      features: parseJsonValue(item[SHAREPOINT_FIELD_NAMES.featuresJson], []),
      state: toStringValue(item[SHAREPOINT_FIELD_NAMES.roomState], "available") as MeetingRoom["state"],
      notes: toStringValue(item[SHAREPOINT_FIELD_NAMES.roomNotes]),
      mapUrl: toStringValue(item[SHAREPOINT_FIELD_NAMES.mapUrl]),
    }));
  }

  private async loadTemplates(): Promise<MeetingTemplate[]> {
    const items = await this.getListItems(this.dependencies.configuration.templateListTitle, [
      "Id",
      "Title",
      SHAREPOINT_FIELD_NAMES.summary,
      SHAREPOINT_FIELD_NAMES.defaultsJson,
    ]);

    return items.map((item) => ({
      id: `template-${item.Id}`,
      title: toStringValue(item.Title),
      summary: toStringValue(item[SHAREPOINT_FIELD_NAMES.summary]),
      defaults: parseJsonValue(item[SHAREPOINT_FIELD_NAMES.defaultsJson], {
        title: "",
        description: "",
        organizerId: this.dependencies.context.pageContext.user.loginName,
        startIso: new Date().toISOString(),
        endIso: new Date().toISOString(),
        type: "virtual",
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
      }),
    }));
  }

  private async loadIncidents(): Promise<MeetingIncident[]> {
    const items = await this.getListItems(this.dependencies.configuration.incidentListTitle, [
      "Id",
      "Title",
      SHAREPOINT_FIELD_NAMES.incidentMeetingId,
      SHAREPOINT_FIELD_NAMES.description,
      SHAREPOINT_FIELD_NAMES.incidentSeverity,
      SHAREPOINT_FIELD_NAMES.incidentStatus,
      "Created",
      SHAREPOINT_FIELD_NAMES.ownerName,
    ]);

    return items.map((item) => ({
      id: `incident-${item.Id}`,
      meetingId: toStringValue(item[SHAREPOINT_FIELD_NAMES.incidentMeetingId]),
      title: toStringValue(item.Title),
      description: toStringValue(item[SHAREPOINT_FIELD_NAMES.description]),
      severity: toStringValue(item[SHAREPOINT_FIELD_NAMES.incidentSeverity], "low") as MeetingIncident["severity"],
      status: toStringValue(item[SHAREPOINT_FIELD_NAMES.incidentStatus], "open") as MeetingIncident["status"],
      createdAtIso: toStringValue(item.Created, new Date().toISOString()),
      ownerName: toStringValue(item[SHAREPOINT_FIELD_NAMES.ownerName]),
    }));
  }

  private async loadSavedFilters(): Promise<SavedFilter[]> {
    const items = await this.getListItems(this.dependencies.configuration.configurationListTitle, [
      "Id",
      "Title",
      SHAREPOINT_FIELD_NAMES.description,
      SHAREPOINT_FIELD_NAMES.accentColor,
      SHAREPOINT_FIELD_NAMES.savedFilterJson,
    ]);

    return items
      .filter((item) => typeof item[SHAREPOINT_FIELD_NAMES.savedFilterJson] === "string")
      .map((item) => ({
        id: `saved-filter-${item.Id}`,
        title: toStringValue(item.Title),
        description: toStringValue(item[SHAREPOINT_FIELD_NAMES.description]),
        accentColor: toStringValue(item[SHAREPOINT_FIELD_NAMES.accentColor], "#175cd3"),
        filters: parseJsonValue(item[SHAREPOINT_FIELD_NAMES.savedFilterJson], {
          selectedDateIso: new Date().toISOString(),
          meetingType: "all",
          status: "all",
          organizerId: "all",
          roomId: "all",
          teamId: "all",
          searchText: "",
          favoritesOnly: false,
        }),
      }));
  }

  private mapMeetingItem(item: SharePointListItem): MeetingRecord {
    return {
      id: toStringValue(item[SHAREPOINT_FIELD_NAMES.meetingId], `meeting-${item.Id}`),
      title: toStringValue(item.Title),
      description: toStringValue(item[SHAREPOINT_FIELD_NAMES.description]),
      organizer: {
        id: toStringValue(item[SHAREPOINT_FIELD_NAMES.organizerId], this.dependencies.context.pageContext.user.loginName),
        displayName: toStringValue(item[SHAREPOINT_FIELD_NAMES.organizerName], this.dependencies.context.pageContext.user.displayName),
        email: toStringValue(item[SHAREPOINT_FIELD_NAMES.organizerEmail], this.dependencies.context.pageContext.user.email),
        title: toStringValue(item[SHAREPOINT_FIELD_NAMES.organizerTitle]),
        department: toStringValue(item[SHAREPOINT_FIELD_NAMES.organizerDepartment]),
      },
      startIso: toStringValue(item[SHAREPOINT_FIELD_NAMES.startDate], new Date().toISOString()),
      endIso: toStringValue(item[SHAREPOINT_FIELD_NAMES.endDate], new Date().toISOString()),
      type: toStringValue(item[SHAREPOINT_FIELD_NAMES.meetingType], "virtual") as MeetingRecord["type"],
      roomId: toStringValue(item[SHAREPOINT_FIELD_NAMES.roomId]) || undefined,
      teamsMeeting: toStringValue(item[SHAREPOINT_FIELD_NAMES.teamsMeetingUrl])
        ? {
            meetingId: toStringValue(item[SHAREPOINT_FIELD_NAMES.teamsMeetingId], `teams-${item.Id}`),
            joinUrl: toStringValue(item[SHAREPOINT_FIELD_NAMES.teamsMeetingUrl]),
            provider: "teams",
            isProvisioned: true,
            joinWebUrlLabel: "Abrir en Teams",
          }
        : undefined,
      teamContext: toStringValue(item[SHAREPOINT_FIELD_NAMES.teamId])
        ? {
            teamId: toStringValue(item[SHAREPOINT_FIELD_NAMES.teamId]),
            teamName: toStringValue(item[SHAREPOINT_FIELD_NAMES.teamName]),
            channelId: toStringValue(item[SHAREPOINT_FIELD_NAMES.channelId]) || undefined,
            channelName: toStringValue(item[SHAREPOINT_FIELD_NAMES.channelName]) || undefined,
          }
        : undefined,
      attendees: parseJsonValue(item[SHAREPOINT_FIELD_NAMES.attendeesJson], []),
      externalGuests: parseJsonValue(item[SHAREPOINT_FIELD_NAMES.externalGuestsJson], []),
      priority: toStringValue(item[SHAREPOINT_FIELD_NAMES.priority], "normal") as MeetingRecord["priority"],
      tags: parseJsonValue(item[SHAREPOINT_FIELD_NAMES.tagsJson], []),
      status: toWorkflowStatus(item[SHAREPOINT_FIELD_NAMES.workflowStatus]),
      equipmentRequirements: parseJsonValue(item[SHAREPOINT_FIELD_NAMES.equipmentJson], []),
      preMeetingNotes: toStringValue(item[SHAREPOINT_FIELD_NAMES.preMeetingNotes]),
      agendaItems: parseJsonValue(item[SHAREPOINT_FIELD_NAMES.agendaJson], []),
      documents: parseJsonValue(item[SHAREPOINT_FIELD_NAMES.documentsJson], []),
      checklist: parseJsonValue(item[SHAREPOINT_FIELD_NAMES.checklistJson], []),
      notes: parseJsonValue(item[SHAREPOINT_FIELD_NAMES.notesJson], []),
      recentChanges: parseJsonValue(item[SHAREPOINT_FIELD_NAMES.changesJson], []),
      incidents: parseJsonValue(item[SHAREPOINT_FIELD_NAMES.incidentsJson], []),
      isFavorite: toBoolean(item[SHAREPOINT_FIELD_NAMES.isFavorite]),
      createdAtIso: toStringValue(item.Created, new Date().toISOString()),
      updatedAtIso: toStringValue(item.Modified, new Date().toISOString()),
    };
  }

  private buildMeetingPayload(draft: MeetingDraft): Record<string, unknown> {
    const currentUser = this.dependencies.context.pageContext.user;
    const meetingId = draft.id ?? `meeting-${Date.now()}`;

    return {
      Title: draft.title,
      [SHAREPOINT_FIELD_NAMES.meetingId]: meetingId,
      [SHAREPOINT_FIELD_NAMES.description]: draft.description,
      [SHAREPOINT_FIELD_NAMES.organizerId]: draft.organizerId,
      [SHAREPOINT_FIELD_NAMES.organizerName]: currentUser.displayName,
      [SHAREPOINT_FIELD_NAMES.organizerEmail]: currentUser.email,
      [SHAREPOINT_FIELD_NAMES.organizerTitle]: "",
      [SHAREPOINT_FIELD_NAMES.organizerDepartment]: "",
      [SHAREPOINT_FIELD_NAMES.startDate]: draft.startIso,
      [SHAREPOINT_FIELD_NAMES.endDate]: draft.endIso,
      [SHAREPOINT_FIELD_NAMES.meetingType]: draft.type,
      [SHAREPOINT_FIELD_NAMES.roomId]: draft.roomId ?? null,
      [SHAREPOINT_FIELD_NAMES.roomName]: draft.roomId ?? null,
      [SHAREPOINT_FIELD_NAMES.teamsMeetingUrl]: draft.teamsMeetingUrl ?? null,
      [SHAREPOINT_FIELD_NAMES.teamsMeetingId]: draft.id ? `${draft.id}-teams` : null,
      [SHAREPOINT_FIELD_NAMES.teamId]: draft.teamId ?? null,
      [SHAREPOINT_FIELD_NAMES.teamName]: draft.teamName ?? null,
      [SHAREPOINT_FIELD_NAMES.channelId]: draft.channelId ?? null,
      [SHAREPOINT_FIELD_NAMES.channelName]: draft.channelName ?? null,
      [SHAREPOINT_FIELD_NAMES.attendeesJson]: JSON.stringify(draft.attendeeEmails.map((email) => ({
        id: email,
        displayName: email,
        email,
        role: "required",
        responseStatus: "accepted",
        isExternal: false,
      }))),
      [SHAREPOINT_FIELD_NAMES.externalGuestsJson]: JSON.stringify(draft.externalGuests),
      [SHAREPOINT_FIELD_NAMES.priority]: draft.priority,
      [SHAREPOINT_FIELD_NAMES.tagsJson]: JSON.stringify(draft.tagValues),
      [SHAREPOINT_FIELD_NAMES.workflowStatus]: draft.status,
      [SHAREPOINT_FIELD_NAMES.equipmentJson]: JSON.stringify(draft.equipmentRequirements),
      [SHAREPOINT_FIELD_NAMES.preMeetingNotes]: draft.preMeetingNotes,
      [SHAREPOINT_FIELD_NAMES.agendaJson]: JSON.stringify(draft.agendaItems),
      [SHAREPOINT_FIELD_NAMES.documentsJson]: JSON.stringify(
        draft.documentLinks.map((documentUrl, index) => ({
          id: `${meetingId}-doc-${index}`,
          title: `Documento ${index + 1}`,
          url: documentUrl,
          source: "link",
        }))
      ),
      [SHAREPOINT_FIELD_NAMES.checklistJson]: JSON.stringify(
        draft.checklistLabels.map((label, index) => ({
          id: `${meetingId}-check-${index}`,
          label,
          completed: false,
          ownerName: currentUser.displayName,
        }))
      ),
      [SHAREPOINT_FIELD_NAMES.notesJson]: JSON.stringify([]),
      [SHAREPOINT_FIELD_NAMES.changesJson]: JSON.stringify([]),
      [SHAREPOINT_FIELD_NAMES.incidentsJson]: JSON.stringify([]),
      [SHAREPOINT_FIELD_NAMES.isFavorite]: draft.isFavorite,
    };
  }

  private async updateMeetingFields(meetingId: string, fields: Record<string, unknown>): Promise<void> {
    const existingItem = await this.getMeetingListItemByMeetingId(meetingId);
    if (!existingItem) {
      throw new Error("Meeting not found.");
    }

    // Se usa MERGE para minimizar el riesgo de sobrescribir columnas no gestionadas por este webpart.
    await this.updateListItem(this.dependencies.configuration.meetingListTitle, existingItem.Id, fields);
  }

  private async getMeetingListItemByMeetingId(meetingId: string): Promise<SharePointListItem | undefined> {
    const items = await this.getListItems(
      this.dependencies.configuration.meetingListTitle,
      ["Id", "Title", ...getFieldValues(SHAREPOINT_FIELD_NAMES)],
      `$filter=${SHAREPOINT_FIELD_NAMES.meetingId} eq '${meetingId.replace(/'/g, "''")}'`
    );

    return items[0];
  }

  private async getListItems(listTitle: string, selectFields: string[], extraQuery?: string): Promise<SharePointListItem[]> {
    const select = Array.from(new Set(selectFields)).join(",");
    const query = [`$select=${select}`];
    if (extraQuery) {
      query.push(extraQuery);
    }

    const url = `${this.getSiteUrl()}/_api/web/lists/getbytitle('${this.escapeListTitle(listTitle)}')/items?${query.join("&")}`;
    const response = await this.dependencies.context.spHttpClient.get(url, SPHttpClient.configurations.v1, {
      headers: {
        Accept: "application/json;odata=nometadata",
      },
    });

    await this.ensureSuccess(response, `Unable to load items from ${listTitle}.`);
    const payload = (await response.json()) as ISharePointListResponse;
    return payload.value ?? [];
  }

  private async createListItem(listTitle: string, payload: Record<string, unknown>): Promise<void> {
    const url = `${this.getSiteUrl()}/_api/web/lists/getbytitle('${this.escapeListTitle(listTitle)}')/items`;
    const options: ISPHttpClientOptions = {
      headers: {
        Accept: "application/json;odata=nometadata",
        "Content-Type": "application/json;odata=nometadata",
      },
      body: JSON.stringify(payload),
    };

    const response = await this.dependencies.context.spHttpClient.post(url, SPHttpClient.configurations.v1, options);
    await this.ensureSuccess(response, `Unable to create item in ${listTitle}.`);
  }

  private async updateListItem(listTitle: string, itemId: number, payload: Record<string, unknown>): Promise<void> {
    const url = `${this.getSiteUrl()}/_api/web/lists/getbytitle('${this.escapeListTitle(listTitle)}')/items(${itemId})`;
    const options: ISPHttpClientOptions = {
      headers: {
        Accept: "application/json;odata=nometadata",
        "Content-Type": "application/json;odata=nometadata",
        "IF-MATCH": "*",
        "X-HTTP-Method": "MERGE",
      },
      body: JSON.stringify(payload),
    };

    const response = await this.dependencies.context.spHttpClient.post(url, SPHttpClient.configurations.v1, options);
    await this.ensureSuccess(response, `Unable to update item ${itemId} in ${listTitle}.`);
  }

  private async ensureSuccess(response: SPHttpClientResponse, message: string): Promise<void> {
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`${message} ${details}`);
    }
  }

  private escapeListTitle(listTitle: string): string {
    return listTitle.replace(/'/g, "''");
  }

  private getSiteUrl(): string {
    return this.dependencies.configuration.siteUrl ?? this.dependencies.context.pageContext.web.absoluteUrl;
  }

  private async safeLoad<T>(listTitle: string, factory: () => Promise<T>, fallback: T): Promise<T> {
    if (!listTitle) {
      return fallback;
    }

    try {
      return await factory();
    } catch {
      logger.warn(`Optional list '${listTitle}' is unavailable.`);
      return fallback;
    }
  }
}
