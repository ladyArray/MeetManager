import { MINIMUM_MEETING_DURATION_MINUTES } from "../constants/meetManagerConstants";
import {
  MeetingDraft,
  MeetingRecord,
  MeetingRoom,
  MeetingValidationResult,
  SuggestedSlot,
  ValidationIssue,
} from "../models/meetManagerModels";
import { getMinutesBetween, overlaps } from "../utils/dateTime";
import { buildRoomRecommendations } from "../utils/roomRecommendation";

interface IValidationContext {
  meetings: ReadonlyArray<MeetingRecord>;
  rooms: ReadonlyArray<MeetingRoom>;
}

const createIssue = (
  id: string,
  message: string,
  severity: ValidationIssue["severity"],
  field?: keyof MeetingDraft
): ValidationIssue => ({
  id,
  message,
  severity,
  field,
});

const buildSlotSuggestions = (
  draft: MeetingDraft,
  rooms: ReadonlyArray<MeetingRoom>,
  meetings: ReadonlyArray<MeetingRecord>
): SuggestedSlot[] => {
  const duration = Math.max(MINIMUM_MEETING_DURATION_MINUTES, getMinutesBetween(draft.startIso, draft.endIso));
  const startDate = new Date(draft.startIso);
  const dayBase = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 8, 0, 0, 0);

  return new Array(10)
    .fill(undefined)
    .map((_, index) => {
      const slotStart = new Date(dayBase.getTime() + index * 60 * 60000);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);
      const roomRecommendation = buildRoomRecommendations(
        { ...draft, startIso: slotStart.toISOString(), endIso: slotEnd.toISOString() },
        rooms,
        meetings
      )[0];

      return {
        id: `slot-${index}`,
        label: `${slotStart.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} · ${
          roomRecommendation?.reasons[0] ?? "Sin recomendacion"
        }`,
        startIso: slotStart.toISOString(),
        endIso: slotEnd.toISOString(),
        roomId: roomRecommendation?.roomId,
        confidence: roomRecommendation ? Math.max(0.1, roomRecommendation.score / 100) : 0.1,
      };
    })
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 3);
};

export const validateMeetingDraft = (draft: MeetingDraft, context: IValidationContext): MeetingValidationResult => {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];

  if (!draft.title.trim()) {
    errors.push(createIssue("title-required", "El titulo es obligatorio.", "error", "title"));
  }

  if (!draft.startIso || !draft.endIso) {
    errors.push(createIssue("datetime-required", "La fecha de inicio y fin son obligatorias.", "error", "startIso"));
  } else if (new Date(draft.startIso) >= new Date(draft.endIso)) {
    errors.push(createIssue("datetime-order", "La fecha de fin debe ser posterior al inicio.", "error", "endIso"));
  } else if (getMinutesBetween(draft.startIso, draft.endIso) < MINIMUM_MEETING_DURATION_MINUTES) {
    errors.push(
      createIssue(
        "minimum-duration",
        `La reunion debe durar al menos ${MINIMUM_MEETING_DURATION_MINUTES} minutos.`,
        "error",
        "endIso"
      )
    );
  }

  if ((draft.type === "onsite" || draft.type === "hybrid") && !draft.roomId) {
    warnings.push(createIssue("room-recommended", "Conviene asignar una sala para reuniones presenciales o hibridas.", "warning", "roomId"));
  }

  if ((draft.type === "virtual" || draft.type === "hybrid") && !draft.teamsMeetingUrl) {
    warnings.push(
      createIssue(
        "teams-recommended",
        "Conviene registrar un enlace de Teams para reuniones virtuales o hibridas.",
        "warning",
        "teamsMeetingUrl"
      )
    );
  }

  const organizerConflicts = context.meetings.filter(
    (meeting) =>
      meeting.organizer.id === draft.organizerId &&
      meeting.id !== draft.id &&
      meeting.status !== "cancelled" &&
      overlaps(draft.startIso, draft.endIso, meeting.startIso, meeting.endIso)
  );

  if (organizerConflicts.length > 0) {
    warnings.push(
      createIssue(
        "organizer-overlap",
        `El organizador ya tiene ${organizerConflicts.length} reunion(es) en esa franja.`,
        "warning",
        "organizerId"
      )
    );
  }

  if (draft.roomId) {
    const room = context.rooms.find((candidate) => candidate.id === draft.roomId);
    const roomConflicts = context.meetings.filter(
      (meeting) =>
        meeting.roomId === draft.roomId &&
        meeting.id !== draft.id &&
        meeting.status !== "cancelled" &&
        overlaps(draft.startIso, draft.endIso, meeting.startIso, meeting.endIso)
    );

    if (roomConflicts.length > 0) {
      errors.push(
        createIssue(
          "room-conflict",
          `La sala seleccionada ya esta reservada por ${roomConflicts[0].title}.`,
          "error",
          "roomId"
        )
      );
    }

    if (room && draft.attendeeEmails.length + draft.externalGuests.length + 1 > room.capacity) {
      warnings.push(
        createIssue(
          "room-capacity",
          `La sala ${room.title} puede quedarse corta para el numero de asistentes esperado.`,
          "warning",
          "roomId"
        )
      );
    }
  }

  if (draft.attendeeEmails.length === 0) {
    info.push(createIssue("attendees-empty", "Todavia no has indicado asistentes internos.", "info", "attendeeEmails"));
  }

  const roomRecommendations = buildRoomRecommendations(draft, context.rooms, context.meetings).slice(0, 3);
  const suggestedSlots = buildSlotSuggestions(draft, context.rooms, context.meetings);

  if (roomRecommendations.length > 0) {
    info.push(createIssue("room-suggestion", "Se han calculado recomendaciones de sala segun aforo y equipamiento.", "info", "roomId"));
  }

  return {
    errors,
    warnings,
    info,
    roomRecommendations,
    suggestedSlots,
  };
};
