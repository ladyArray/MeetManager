declare interface IMeetManagerDashboardWebPartStrings {
  PropertyPaneDescription: string;
  GeneralGroupName: string;
  ConfigurationGroupName: string;
  TitleFieldLabel: string;
  DataSourceFieldLabel: string;
  DataSourceMockLabel: string;
  DataSourceSharePointLabel: string;
  DefaultViewFieldLabel: string;
  GraphAssistFieldLabel: string;
  SiteUrlFieldLabel: string;
  MeetingListFieldLabel: string;
  RoomListFieldLabel: string;
  TemplateListFieldLabel: string;
  IncidentListFieldLabel: string;
  ConfigurationListFieldLabel: string;
}

declare module "MeetManagerDashboardWebPartStrings" {
  const strings: IMeetManagerDashboardWebPartStrings;
  export = strings;
}
