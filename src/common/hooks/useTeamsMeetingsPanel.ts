import { useEffect, useRef, useState } from "react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { createMeetManagerService } from "../services/MeetManagerServiceFactory";
import { IMeetManagerServiceConfiguration } from "../services/interfaces/IMeetManagerService";
import { IMeetManagerService } from "../services/interfaces/IMeetManagerService";
import { TeamsPanelSnapshot } from "../models/meetManagerModels";

interface IUseTeamsMeetingsPanelProps {
  context: WebPartContext;
  configuration: IMeetManagerServiceConfiguration;
}

export interface IUseTeamsMeetingsPanelState {
  snapshot?: TeamsPanelSnapshot;
  isLoading: boolean;
  errorMessage?: string;
  refresh: () => Promise<void>;
}

export const useTeamsMeetingsPanel = ({
  context,
  configuration,
}: IUseTeamsMeetingsPanelProps): IUseTeamsMeetingsPanelState => {
  const serviceRef = useRef<IMeetManagerService | undefined>(undefined);
  if (!serviceRef.current) {
    serviceRef.current = createMeetManagerService({
      context,
      configuration,
    });
  }

  const service = serviceRef.current;
  const [snapshot, setSnapshot] = useState<TeamsPanelSnapshot>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>();

  const refresh = async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const nextSnapshot = await service.getTeamsPanelSnapshot();
      setSnapshot(nextSnapshot);
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return {
    snapshot,
    isLoading,
    errorMessage,
    refresh,
  };
};
