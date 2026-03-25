import { MeetingDraft, MeetingRecord, MeetingRoom, RoomRecommendation } from "../models/meetManagerModels";
import { overlaps } from "./dateTime";

export const buildRoomRecommendations = (
  draft: MeetingDraft,
  rooms: ReadonlyArray<MeetingRoom>,
  meetings: ReadonlyArray<MeetingRecord>
): RoomRecommendation[] => {
  const attendeeCount = draft.attendeeEmails.length + draft.externalGuests.length + 1;

  return rooms
    .map((room) => {
      const reasons: string[] = [];
      let score = 0;

      if (room.state === "maintenance") {
        return {
          roomId: room.id,
          score: -100,
          reasons: ["La sala esta en mantenimiento."],
        };
      }

      const conflictingMeeting = meetings.find(
        (meeting) =>
          meeting.roomId === room.id &&
          meeting.status !== "cancelled" &&
          meeting.status !== "completed" &&
          overlaps(draft.startIso, draft.endIso, meeting.startIso, meeting.endIso) &&
          meeting.id !== draft.id
      );

      if (conflictingMeeting) {
        reasons.push(`Conflicto con ${conflictingMeeting.title}.`);
        score -= 80;
      } else {
        reasons.push("Disponible en la franja seleccionada.");
        score += 50;
      }

      const capacityDelta = room.capacity - attendeeCount;
      if (capacityDelta >= 0) {
        score += Math.max(0, 25 - capacityDelta);
        reasons.push(`Capacidad adecuada para ${attendeeCount} asistentes.`);
      } else {
        score -= 40;
        reasons.push(`Capacidad insuficiente para ${attendeeCount} asistentes.`);
      }

      const missingRequirements = draft.equipmentRequirements.filter((feature) => room.features.indexOf(feature) === -1);
      if (missingRequirements.length === 0) {
        score += 30;
        reasons.push("Cumple todos los requisitos de equipamiento.");
      } else {
        score -= missingRequirements.length * 10;
        reasons.push(`Faltan ${missingRequirements.length} requisitos de equipamiento.`);
      }

      if (draft.type === "hybrid" && room.features.indexOf("hybridKit") >= 0) {
        score += 15;
        reasons.push("Preparada para reunion hibrida.");
      }

      return {
        roomId: room.id,
        score,
        reasons,
      };
    })
    .sort((left, right) => right.score - left.score);
};
