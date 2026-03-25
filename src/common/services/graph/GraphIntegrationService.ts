import { MSGraphClientV3 } from "@microsoft/sp-http";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { MeetingDraft, TeamContextInfo, TeamsMeetingInfo } from "../../models/meetManagerModels";
import { logger } from "../../telemetry/MeetManagerLogger";

interface IGraphJoinedTeamResponseItem {
  id: string;
  displayName: string;
}

interface IGraphEventResponse {
  id: string;
  onlineMeeting?: {
    joinUrl?: string;
  };
}

interface IGraphScheduleResponse {
  value?: Array<{
    scheduleId: string;
    availabilityView?: string;
  }>;
}

export class GraphIntegrationService {
  public constructor(private readonly context: WebPartContext) {}

  public async createOnlineMeetingLink(draft: MeetingDraft): Promise<TeamsMeetingInfo | undefined> {
    try {
      const client = await this.getClient();

      const payload: Record<string, unknown> = {
        subject: draft.title,
        body: {
          contentType: "HTML",
          content: draft.description,
        },
        start: {
          dateTime: new Date(draft.startIso).toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: new Date(draft.endIso).toISOString(),
          timeZone: "UTC",
        },
        isOnlineMeeting: true,
        onlineMeetingProvider: "teamsForBusiness",
      };

      const response = (await client.api("/me/events").post(payload)) as IGraphEventResponse;
      if (!response.onlineMeeting?.joinUrl) {
        return undefined;
      }

      return {
        meetingId: response.id,
        joinUrl: response.onlineMeeting.joinUrl,
        provider: "teams",
        isProvisioned: true,
        joinWebUrlLabel: "Abrir en Teams",
      };
    } catch (error) {
      logger.error("Graph online meeting provisioning failed.", error as Error);
      return undefined;
    }
  }

  public async getRoomAvailability(
    roomMailboxes: ReadonlyArray<string>,
    startIso: string,
    endIso: string
  ): Promise<Record<string, "free" | "busy">> {
    if (roomMailboxes.length === 0) {
      return {};
    }

    try {
      const client = await this.getClient();
      const payload: Record<string, unknown> = {
        schedules: roomMailboxes,
        startTime: {
          dateTime: new Date(startIso).toISOString(),
          timeZone: "UTC",
        },
        endTime: {
          dateTime: new Date(endIso).toISOString(),
          timeZone: "UTC",
        },
        availabilityViewInterval: 30,
      };

      const response = (await client.api("/me/calendar/getSchedule").post(payload)) as IGraphScheduleResponse;
      const result: Record<string, "free" | "busy"> = {};
      (response.value ?? []).forEach((item) => {
        result[item.scheduleId] = item.availabilityView?.includes("1") || item.availabilityView?.includes("2") ? "busy" : "free";
      });
      return result;
    } catch (error) {
      logger.error("Graph schedule lookup failed.", error as Error);
      return {};
    }
  }

  public async getJoinedTeams(): Promise<TeamContextInfo[]> {
    try {
      const client = await this.getClient();
      const response = (await client.api("/me/joinedTeams?$select=id,displayName").get()) as {
        value?: IGraphJoinedTeamResponseItem[];
      };

      return (response.value ?? []).map((team) => ({
        teamId: team.id,
        teamName: team.displayName,
      }));
    } catch (error) {
      logger.error("Graph joined teams lookup failed.", error as Error);
      return [];
    }
  }

  private async getClient(): Promise<MSGraphClientV3> {
    return this.context.msGraphClientFactory.getClient("3");
  }
}
