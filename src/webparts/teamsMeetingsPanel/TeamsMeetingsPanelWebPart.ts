import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import * as strings from "TeamsMeetingsPanelWebPartStrings";
import TeamsMeetingsPanelApp from "./components/TeamsMeetingsPanelApp";
import { DataSourceMode } from "../../common/models/meetManagerModels";
import { DEFAULT_SITE_RELATIVE_LISTS } from "../../common/constants/meetManagerConstants";

export interface ITeamsMeetingsPanelWebPartProps {
  title: string;
  dataSourceMode: DataSourceMode;
  siteUrl: string;
  meetingListTitle: string;
  roomListTitle: string;
  templateListTitle: string;
  incidentListTitle: string;
  configurationListTitle: string;
  enableGraphAssist: boolean;
  maxItems: number;
}

export default class TeamsMeetingsPanelWebPart extends BaseClientSideWebPart<ITeamsMeetingsPanelWebPartProps> {
  public override render(): void {
    const element: React.ReactElement = React.createElement(TeamsMeetingsPanelApp, {
      title: this.properties.title,
      context: this.context,
      isInTeams: Boolean(this.context.sdks.microsoftTeams),
      maxItems: this.properties.maxItems,
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
    this.properties.title = this.properties.title || "Meet Manager Teams Panel";
    this.properties.dataSourceMode = this.properties.dataSourceMode || "mock";
    this.properties.meetingListTitle = this.properties.meetingListTitle || DEFAULT_SITE_RELATIVE_LISTS.meetings;
    this.properties.roomListTitle = this.properties.roomListTitle || DEFAULT_SITE_RELATIVE_LISTS.rooms;
    this.properties.templateListTitle = this.properties.templateListTitle || DEFAULT_SITE_RELATIVE_LISTS.templates;
    this.properties.incidentListTitle = this.properties.incidentListTitle || DEFAULT_SITE_RELATIVE_LISTS.incidents;
    this.properties.configurationListTitle = this.properties.configurationListTitle || DEFAULT_SITE_RELATIVE_LISTS.configuration;
    this.properties.enableGraphAssist = this.properties.enableGraphAssist ?? true;
    this.properties.maxItems = this.properties.maxItems || 5;
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
                PropertyPaneToggle("enableGraphAssist", {
                  label: strings.GraphAssistFieldLabel,
                  onText: "Activado",
                  offText: "Desactivado",
                }),
                PropertyPaneSlider("maxItems", {
                  label: strings.MaxItemsFieldLabel,
                  min: 3,
                  max: 10,
                  step: 1,
                  showValue: true,
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
