export const toDate = (value: string): Date => new Date(value);

export const addDays = (value: Date, days: number): Date => {
  const clone = new Date(value);
  clone.setDate(clone.getDate() + days);
  return clone;
};

export const addMinutes = (value: Date, minutes: number): Date => {
  const clone = new Date(value);
  clone.setMinutes(clone.getMinutes() + minutes);
  return clone;
};

export const startOfDay = (value: Date): Date => new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);

export const endOfDay = (value: Date): Date => new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);

export const toIso = (value: Date): string => value.toISOString();

export const toLocalInputValue = (isoValue: string): string => {
  const date = new Date(isoValue);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

export const fromLocalInputValue = (value: string): string => new Date(value).toISOString();

export const formatDateLabel = (isoValue: string): string =>
  new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "2-digit", month: "short" }).format(new Date(isoValue));

export const formatDayLabel = (isoValue: string): string =>
  new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "2-digit", month: "long" }).format(new Date(isoValue));

export const formatTimeLabel = (isoValue: string): string =>
  new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(isoValue));

export const formatDateTimeRange = (startIso: string, endIso: string): string =>
  `${formatDateLabel(startIso)} · ${formatTimeLabel(startIso)} - ${formatTimeLabel(endIso)}`;

export const getMinutesBetween = (startIso: string, endIso: string): number =>
  Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);

export const isSameDay = (leftIso: string, rightIso: string): boolean =>
  startOfDay(new Date(leftIso)).getTime() === startOfDay(new Date(rightIso)).getTime();

export const overlaps = (
  leftStartIso: string,
  leftEndIso: string,
  rightStartIso: string,
  rightEndIso: string
): boolean => new Date(leftStartIso) < new Date(rightEndIso) && new Date(rightStartIso) < new Date(leftEndIso);

export const getTodayIso = (): string => startOfDay(new Date()).toISOString();

export const createDaySlotIso = (referenceIso: string, hour: number, minute = 0): string => {
  const reference = new Date(referenceIso);
  return new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(), hour, minute, 0, 0).toISOString();
};
