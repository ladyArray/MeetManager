import { IMeetManagerService, IMeetManagerServiceDependencies } from "./interfaces/IMeetManagerService";
import { MockMeetManagerService } from "./mock/MockMeetManagerService";
import { SharePointMeetManagerService } from "./sharepoint/SharePointMeetManagerService";

export const createMeetManagerService = (dependencies: IMeetManagerServiceDependencies): IMeetManagerService => {
  if (dependencies.configuration.dataSourceMode === "sharepoint") {
    return new SharePointMeetManagerService(dependencies);
  }

  return new MockMeetManagerService();
};
