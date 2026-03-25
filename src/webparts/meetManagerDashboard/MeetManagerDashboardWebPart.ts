import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneTextField,
  PropertyPaneToggle,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import * as strings from "MeetManagerDashboardWebPartStrings";
import MeetManagerDashboardApp from "./components/MeetManagerDashboardApp";
import { DashboardViewKey, DataSourceMode } from "../../common/models/meetManagerModels";
import { DEFAULT_SITE_RELATIVE_LISTS } from "../../common/constants/meetManagerConstants";

export interface IMeetManagerDashboardWebPartProps {
  title: string;
  dataSourceMode: DataSourceMode;
  defaultView: DashboardViewKey;
  siteUrl: string;
  meetingListTitle: string;
  roomListTitle: string;
  templateListTitle: string;
  incidentListTitle: string;
  configurationListTitle: string;
  enableGraphAssist: boolean;
}

export default class MeetManagerDashboardWebPart extends BaseClientSideWebPart<IMeetManagerDashboardWebPartProps> {
  public override render(): void {
    const element: React.ReactElement = React.createElement(MeetManagerDashboardApp, {
      title: this.properties.title,
      context: this.context,
      defaultView: this.properties.defaultView,
      isInTeams: Boolean(this.context.sdks.microsoftTeams),
      configuration: {
        dataSourceMode: this.properties.dataSourceMode,
        siteUrl: this.properties.siteUrl || undefined,
        meetingListTitle: this.properties.meetingListTitle,
        roomListTitle: this.properties.roomListTitle,
        templateListTitle: this.properties.templateListTitle,
        incidentListTitle: this.properties.incidentListTitle,
        configurationListTitle: this.properties.configurationListTitle,
        enableGraphAssist: this.properties.enableGraphAssist,
      },
    });

    ReactDom.render(element, this.domElement);
  }

  protected override async onInit(): Promise<void> {
    this.properties.title = this.properties.title || "Meet Manager";
    this.properties.dataSourceMode = this.properties.dataSourceMode || "mock";
    this.properties.defaultView = this.properties.defaultView || "agenda";
    this.properties.meetingListTitle = this.properties.meetingListTitle || DEFAULT_SITE_RELATIVE_LISTS.meetings;
    this.properties.roomListTitle = this.properties.roomListTitle || DEFAULT_SITE_RELATIVE_LISTS.rooms;
    this.properties.templateListTitle = this.properties.templateListTitle || DEFAULT_SITE_RELATIVE_LISTS.templates;
    this.properties.incidentListTitle = this.properties.incidentListTitle || DEFAULT_SITE_RELATIVE_LISTS.incidents;
    this.properties.configurationListTitle =
      this.properties.configurationListTitle || DEFAULT_SITE_RELATIVE_LISTS.configuration;
    this.properties.enableGraphAssist = this.properties.enableGraphAssist ?? true;
    await super.onInit();
  }

  protected override onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected override get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected override getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription,
          },
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField("title", {
                  label: strings.TitleFieldLabel,
                }),
                PropertyPaneDropdown("dataSourceMode", {
                  label: strings.DataSourceFieldLabel,
                  options: [
                    { key: "mock", text: strings.DataSourceMockLabel },
                    { key: "sharepoint", text: strings.DataSourceSharePointLabel },
                  ],
                }),
                PropertyPaneDropdown("defaultView", {
                  label: strings.DefaultViewFieldLabel,
                  options: [
                    { key: "agenda", text: "Agenda" },
                    { key: "calendar", text: "Calendario" },
                    { key: "board", text: "Tablero" },
                    { key: "rooms", text: "Salas" },
                    { key: "teams", text: "Equipos" },
                    { key: "status", text: "Estado" },
                    { key: "timeline", text: "Timeline" },
                  ],
                }),
                PropertyPaneToggle("enableGraphAssist", {
                  label: strings.GraphAssistFieldLabel,
                  onText: "Activado",
                  offText: "Desactivado",
                }),
              ],
            },
            {
              groupName: strings.ConfigurationGroupName,
              groupFields: [
                PropertyPaneTextField("siteUrl", {
                  label: strings.SiteUrlFieldLabel,
                }),
                PropertyPaneTextField("meetingListTitle", {
                  label: strings.MeetingListFieldLabel,
                }),
                PropertyPaneTextField("roomListTitle", {
                  label: strings.RoomListFieldLabel,
                }),
                PropertyPaneTextField("templateListTitle", {
                  label: strings.TemplateListFieldLabel,
                }),
                PropertyPaneTextField("incidentListTitle", {
                  label: strings.IncidentListFieldLabel,
                }),
                PropertyPaneTextField("configurationListTitle", {
                  label: strings.ConfigurationListFieldLabel,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
