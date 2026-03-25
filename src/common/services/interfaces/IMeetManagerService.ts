import { WebPartContext } from "@microsoft/sp-webpart-base";
import {
  DashboardSnapshot,
  DataSourceMode,
  MeetingDraft,
  MeetingRecord,
  MeetingValidationResult,
  TeamsMeetingInfo,
  TeamsPanelSnapshot,
} from "../../models/meetManagerModels";

export interface IMeetManagerServiceConfiguration {
  dataSourceMode: DataSourceMode;
  siteUrl?: string;
  meetingListTitle: string;
  roomListTitle: string;
  templateListTitle: string;
  incidentListTitle: string;
  configurationListTitle: string;
  enableGraphAssist: boolean;
}

export interface IMeetManagerServiceDependencies {
  context: WebPartContext;
  configuration: IMeetManagerServiceConfiguration;
}

export interface IMeetManagerService {
  getDashboardSnapshot(): Promise<DashboardSnapshot>;
  getTeamsPanelSnapshot(): Promise<TeamsPanelSnapshot>;
  validateMeeting(draft: MeetingDraft): Promise<MeetingValidationResult>;
  saveMeeting(draft: MeetingDraft): Promise<MeetingRecord>;
  cancelMeeting(meetingId: string): Promise<void>;
  completeMeeting(meetingId: string): Promise<void>;
  releaseRoom(meetingId: string): Promise<void>;
  duplicateMeeting(meetingId: string): Promise<MeetingDraft>;
  toggleFavorite(meetingId: string): Promise<void>;
  getMeetingById(meetingId: string): Promise<MeetingRecord | undefined>;
  createOnlineMeetingLink?(draft: MeetingDraft): Promise<TeamsMeetingInfo | undefined>;
}
