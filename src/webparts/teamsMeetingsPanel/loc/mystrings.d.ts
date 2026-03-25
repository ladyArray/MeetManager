declare interface ITeamsMeetingsPanelWebPartStrings {
  PropertyPaneDescription: string;
  GeneralGroupName: string;
  ConfigurationGroupName: string;
  TitleFieldLabel: string;
  DataSourceFieldLabel: string;
  DataSourceMockLabel: string;
  DataSourceSharePointLabel: string;
  GraphAssistFieldLabel: string;
  MaxItemsFieldLabel: string;
  SiteUrlFieldLabel: string;
  MeetingListFieldLabel: string;
  RoomListFieldLabel: string;
  TemplateListFieldLabel: string;
  IncidentListFieldLabel: string;
  ConfigurationListFieldLabel: string;
}

declare module "TeamsMeetingsPanelWebPartStrings" {
  const strings: ITeamsMeetingsPanelWebPartStrings;
  export = strings;
}
