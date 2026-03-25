import { Log } from "@microsoft/sp-core-library";

const LOGGER_SOURCE = "MeetManager";

export const logger = {
  info: (message: string): void => {
    Log.info(LOGGER_SOURCE, message);
  },
  warn: (message: string): void => {
    Log.warn(LOGGER_SOURCE, message);
  },
  error: (message: string, error?: Error): void => {
    Log.error(LOGGER_SOURCE, error ?? new Error(message));
  },
};
