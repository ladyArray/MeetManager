import { DEFAULT_FILTERS } from "../../constants/meetManagerConstants";
import {
  DashboardSnapshot,
  DirectoryUser,
  MeetingIncident,
  MeetingRecord,
  MeetingRoom,
  MeetingTemplate,
  SavedFilter,
  TeamContextInfo,
} from "../../models/meetManagerModels";
import { addMinutes, getTodayIso, startOfDay, toIso } from "../../utils/dateTime";

export interface IMockStore extends DashboardSnapshot {
  directoryUsers: DirectoryUser[];
}

const buildTime = (base: Date, dayOffset: number, hour: number, minute: number): string =>
  toIso(new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, hour, minute, 0, 0));

const createCurrentUser = (): DirectoryUser => ({
  id: "user-ana",
  displayName: "Ana Torres",
  email: "ana.torres@contoso.com",
  title: "Head of Corporate Collaboration",
  department: "Modern Work",
  teamId: "team-ops",
  teamName: "Operations Hub",
});

const createDirectoryUsers = (): DirectoryUser[] => [
  createCurrentUser(),
  {
    id: "user-diego",
    displayName: "Diego Martin",
    email: "diego.martin@contoso.com",
    title: "Facilities Lead",
    department: "Facilities",
    teamId: "team-facilities",
    teamName: "Facilities & Events",
  },
  {
    id: "user-lucia",
    displayName: "Lucia Serrano",
    email: "lucia.serrano@contoso.com",
    title: "Product Operations",
    department: "Digital Workplace",
    teamId: "team-product",
    teamName: "Product Board",
  },
  {
    id: "user-pablo",
    displayName: "Pablo Ruiz",
    email: "pablo.ruiz@contoso.com",
    title: "M365 Architect",
    department: "IT",
    teamId: "team-ops",
    teamName: "Operations Hub",
  },
  {
    id: "user-ines",
    displayName: "Ines Vega",
    email: "ines.vega@contoso.com",
    title: "Communication Manager",
    department: "Corporate Communications",
    teamId: "team-comms",
    teamName: "Comms Studio",
  },
];

const createRooms = (): MeetingRoom[] => [
  {
    id: "room-atrium",
    title: "Atrium 3.2",
    mailbox: "atrium32@contoso.com",
    capacity: 18,
    building: "HQ Castellana",
    floor: "3",
    locationLabel: "Sala con vista al atrio principal",
    features: ["display", "camera", "microphone", "speakerphone", "hybridKit", "accessible"],
    state: "available",
    notes: "Preparada para sesiones hibridas con dos micros de techo.",
  },
  {
    id: "room-nexus",
    title: "Nexus 5.1",
    mailbox: "nexus51@contoso.com",
    capacity: 10,
    building: "HQ Castellana",
    floor: "5",
    locationLabel: "Sala de proyecto junto a PMO",
    features: ["display", "whiteboard", "camera", "microphone"],
    state: "available",
  },
  {
    id: "room-forum",
    title: "Forum 2.4",
    mailbox: "forum24@contoso.com",
    capacity: 24,
    building: "HQ Castellana",
    floor: "2",
    locationLabel: "Sala de comite y reuniones ampliadas",
    features: ["display", "camera", "microphone", "dualScreen", "recording", "hybridKit"],
    state: "available",
  },
  {
    id: "room-atelier",
    title: "Atelier Lab",
    mailbox: "atelierlab@contoso.com",
    capacity: 8,
    building: "Innovation Center",
    floor: "1",
    locationLabel: "Espacio creativo para talleres y retrospectivas",
    features: ["whiteboard", "display", "accessible"],
    state: "available",
  },
  {
    id: "room-studio",
    title: "Studio Broadcast",
    mailbox: "studiobroadcast@contoso.com",
    capacity: 6,
    building: "Innovation Center",
    floor: "0",
    locationLabel: "Sala preparada para webinars y grabacion",
    features: ["camera", "microphone", "recording", "display", "hybridKit"],
    state: "maintenance",
    notes: "En calibracion de audio hasta nuevo aviso.",
  },
];

const createTeamContext = (teamId: string, teamName: string, channelId: string, channelName: string): TeamContextInfo => ({
  teamId,
  teamName,
  channelId,
  channelName,
});

const createMeeting = (
  id: string,
  title: string,
  organizer: DirectoryUser,
  startIso: string,
  endIso: string,
  overrides: Partial<MeetingRecord> = {}
): MeetingRecord => ({
  id,
  title,
  description: "Seguimiento operativo de reuniones con foco en coordinacion, decisiones y acciones.",
  organizer,
  startIso,
  endIso,
  type: "hybrid",
  roomId: "room-atrium",
  teamsMeeting: {
    meetingId: `${id}-teams`,
    joinUrl: `https://teams.microsoft.com/l/meetup-join/${id}`,
    provider: "teams",
    isProvisioned: true,
    joinWebUrlLabel: "Abrir en Teams",
  },
  teamContext: createTeamContext("team-ops", "Operations Hub", "channel-daily", "Daily Coordination"),
  attendees: [],
  externalGuests: [],
  priority: "normal",
  tags: ["operaciones", "seguimiento"],
  status: "scheduled",
  equipmentRequirements: ["display", "camera", "microphone"],
  preMeetingNotes: "Revisar acciones abiertas y preparar evidencias para decisiones.",
  agendaItems: ["Repaso de bloqueos", "Ajustes de capacidad", "Acciones del dia"],
  documents: [
    {
      id: `${id}-doc`,
      title: "Resumen operativo",
      url: "https://contoso.sharepoint.com/sites/meetings/Shared%20Documents/operativa.docx",
      source: "sharepoint",
    },
  ],
  checklist: [
    {
      id: `${id}-check-1`,
      label: "Confirmar asistencia de ponentes",
      completed: true,
      ownerName: organizer.displayName,
    },
    {
      id: `${id}-check-2`,
      label: "Comprobar sala o kit hibrido",
      completed: false,
      ownerName: "Facilities Desk",
    },
  ],
  notes: [
    {
      id: `${id}-note-1`,
      authorName: organizer.displayName,
      createdAtIso: addMinutes(new Date(startIso), -90).toISOString(),
      text: "Hay que confirmar disponibilidad del equipo de videoconferencia antes de la reunion.",
      kind: "preparation",
    },
  ],
  recentChanges: [
    {
      id: `${id}-change-1`,
      actorName: organizer.displayName,
      createdAtIso: addMinutes(new Date(startIso), -120).toISOString(),
      label: "Se actualizo la agenda y el bloque de decisiones.",
    },
  ],
  incidents: [],
  isFavorite: false,
  createdAtIso: addMinutes(new Date(startIso), -180).toISOString(),
  updatedAtIso: addMinutes(new Date(startIso), -30).toISOString(),
  ...overrides,
});

export const createMockStore = (): IMockStore => {
  const todayBase = startOfDay(new Date());
  const currentUser = createCurrentUser();
  const directoryUsers = createDirectoryUsers();
  const rooms = createRooms();
  const [ana, diego, lucia, pablo, ines] = directoryUsers;

  const operationsIncident: MeetingIncident = {
    id: "incident-war-room",
    meetingId: "meeting-war-room",
    title: "Latencia alta en microfono de techo",
    description: "La sala ha reportado eco intermitente durante reuniones hibridas.",
    severity: "medium",
    status: "open",
    createdAtIso: buildTime(todayBase, 0, 8, 25),
    ownerName: "Facilities Desk",
  };

  const completedIncident: MeetingIncident = {
    id: "incident-review",
    meetingId: "meeting-review",
    title: "Presentacion sin permisos",
    description: "Se resolvio compartiendo la presentacion desde OneDrive corporativo.",
    severity: "low",
    status: "resolved",
    createdAtIso: buildTime(todayBase, 0, 10, 0),
    ownerName: "Lucia Serrano",
  };

  const meetings: MeetingRecord[] = [
    createMeeting(
      "meeting-war-room",
      "Centro operativo de lanzamiento",
      ana,
      addMinutes(new Date(), -25).toISOString(),
      addMinutes(new Date(), 35).toISOString(),
      {
        roomId: "room-atrium",
        priority: "critical",
        tags: ["lanzamiento", "war room", "hibrida"],
        attendees: [ana, diego, pablo].map((user, index) => ({
          id: `${user.id}-attendee-${index}`,
          displayName: user.displayName,
          email: user.email,
          role: user.id === ana.id ? "organizer" : "required",
          responseStatus: "accepted",
          isExternal: false,
        })),
        externalGuests: ["partner.ops@fabricam.com"],
        incidents: [operationsIncident],
        isFavorite: true,
      }
    ),
    createMeeting(
      "meeting-standup",
      "Daily de coordinacion M365",
      pablo,
      addMinutes(new Date(), 20).toISOString(),
      addMinutes(new Date(), 50).toISOString(),
      {
        type: "virtual",
        roomId: undefined,
        teamContext: createTeamContext("team-ops", "Operations Hub", "channel-standup", "Standups"),
        attendees: [ana, pablo, lucia].map((user, index) => ({
          id: `${user.id}-attendee-standup-${index}`,
          displayName: user.displayName,
          email: user.email,
          role: user.id === pablo.id ? "organizer" : "required",
          responseStatus: "accepted",
          isExternal: false,
        })),
        tags: ["daily", "teams", "soporte"],
      }
    ),
    createMeeting(
      "meeting-steering",
      "Steering presencial de salas y aforo",
      diego,
      buildTime(todayBase, 0, 12, 30),
      buildTime(todayBase, 0, 13, 30),
      {
        type: "onsite",
        roomId: "room-forum",
        teamsMeeting: undefined,
        teamContext: createTeamContext("team-facilities", "Facilities & Events", "channel-rooms", "Room Control"),
        attendees: [diego, ana, ines].map((user, index) => ({
          id: `${user.id}-attendee-steering-${index}`,
          displayName: user.displayName,
          email: user.email,
          role: user.id === diego.id ? "organizer" : "required",
          responseStatus: "accepted",
          isExternal: false,
        })),
        tags: ["presencial", "salas", "facilities"],
        equipmentRequirements: ["display", "whiteboard"],
      }
    ),
    createMeeting(
      "meeting-review",
      "Review de retrospectiva hibrida",
      lucia,
      buildTime(todayBase, 0, 9, 0),
      buildTime(todayBase, 0, 10, 0),
      {
        roomId: "room-nexus",
        status: "completed",
        teamContext: createTeamContext("team-product", "Product Board", "channel-launch", "Launch"),
        attendees: [lucia, ana, ines].map((user, index) => ({
          id: `${user.id}-attendee-review-${index}`,
          displayName: user.displayName,
          email: user.email,
          role: user.id === lucia.id ? "organizer" : "required",
          responseStatus: "accepted",
          isExternal: false,
        })),
        incidents: [completedIncident],
        tags: ["retrospectiva", "hibrida"],
      }
    ),
    createMeeting(
      "meeting-townhall",
      "Townhall del equipo de comunicacion",
      ines,
      buildTime(todayBase, 1, 11, 0),
      buildTime(todayBase, 1, 12, 30),
      {
        type: "hybrid",
        roomId: "room-forum",
        teamContext: createTeamContext("team-comms", "Comms Studio", "channel-townhall", "Townhalls"),
        priority: "high",
        attendees: [ines, ana].map((user, index) => ({
          id: `${user.id}-attendee-townhall-${index}`,
          displayName: user.displayName,
          email: user.email,
          role: user.id === ines.id ? "organizer" : "required",
          responseStatus: "accepted",
          isExternal: false,
        })),
        externalGuests: ["agency@partner.com"],
        tags: ["townhall", "comunicacion"],
      }
    ),
    createMeeting(
      "meeting-template-run",
      "Borrador de plantilla de onboarding",
      ana,
      buildTime(todayBase, 2, 10, 0),
      buildTime(todayBase, 2, 11, 0),
      {
        status: "draft",
        roomId: "room-atelier",
        tags: ["borrador", "plantilla"],
        attendees: [],
        teamContext: createTeamContext("team-product", "Product Board", "channel-discovery", "Discovery"),
      }
    ),
  ];

  const templates: MeetingTemplate[] = [
    {
      id: "template-hybrid",
      title: "Comite hibrido semanal",
      summary: "Plantilla con sala, checklist y agenda para comites recurrentes.",
      defaults: {
        title: "Comite hibrido semanal",
        description: "Revision semanal de iniciativas, riesgos y dependencias.",
        organizerId: ana.id,
        startIso: buildTime(todayBase, 0, 16, 0),
        endIso: buildTime(todayBase, 0, 17, 0),
        type: "hybrid",
        roomId: "room-atrium",
        teamsMeetingUrl: "",
        teamId: "team-ops",
        teamName: "Operations Hub",
        channelId: "channel-comite",
        channelName: "Comites",
        attendeeEmails: [pablo.email, lucia.email],
        externalGuests: [],
        priority: "high",
        tagValues: ["comite", "semanal"],
        status: "scheduled",
        equipmentRequirements: ["camera", "microphone", "display"],
        preMeetingNotes: "Adjuntar materiales antes de las 15:00.",
        agendaItems: ["Avances", "Riesgos", "Bloqueos", "Acciones"],
        documentLinks: [],
        checklistLabels: ["Reservar sala", "Verificar enlace de Teams", "Compartir agenda"],
        isFavorite: false,
      },
    },
    {
      id: "template-onsite",
      title: "Workshop presencial",
      summary: "Sesion enfocada en dinamicas de sala y pizarra.",
      defaults: {
        title: "Workshop presencial",
        description: "Sesion colaborativa de trabajo presencial con dinamicas visuales.",
        organizerId: diego.id,
        startIso: buildTime(todayBase, 0, 15, 0),
        endIso: buildTime(todayBase, 0, 17, 0),
        type: "onsite",
        roomId: "room-atelier",
        attendeeEmails: [ana.email, ines.email],
        externalGuests: [],
        priority: "normal",
        tagValues: ["workshop", "presencial"],
        status: "scheduled",
        equipmentRequirements: ["whiteboard", "display"],
        preMeetingNotes: "Configurar material fungible y paneles visuales.",
        agendaItems: ["Contexto", "Ideacion", "Priorizar", "Cierre"],
        documentLinks: [],
        checklistLabels: ["Preparar pizarra", "Comprobar aforo"],
        isFavorite: false,
      },
    },
    {
      id: "template-virtual",
      title: "Sync virtual de equipo",
      summary: "Reunion ligera pensada para Teams y seguimiento rapido.",
      defaults: {
        title: "Sync virtual de equipo",
        description: "Alineacion rapida sobre entregables y soporte.",
        organizerId: pablo.id,
        startIso: buildTime(todayBase, 0, 9, 30),
        endIso: buildTime(todayBase, 0, 10, 0),
        type: "virtual",
        attendeeEmails: [ana.email, lucia.email],
        externalGuests: [],
        priority: "normal",
        tagValues: ["sync", "virtual"],
        status: "scheduled",
        equipmentRequirements: [],
        preMeetingNotes: "Llevar puntos claros y decisiones esperadas.",
        agendaItems: ["Estado", "Riesgos", "Siguientes pasos"],
        documentLinks: [],
        checklistLabels: ["Adjuntar backlog", "Compartir enlace"],
        isFavorite: false,
      },
    },
  ];

  const savedFilters: SavedFilter[] = [
    {
      id: "filter-critical",
      title: "Operativo critico",
      description: "Foco en reuniones de alta prioridad del dia.",
      accentColor: "#b42318",
      filters: {
        ...DEFAULT_FILTERS(getTodayIso()),
        status: "active",
        favoritesOnly: true,
      },
    },
    {
      id: "filter-hybrid",
      title: "Modo hibrido",
      description: "Solo reuniones hibridas con dependencia de sala y Teams.",
      accentColor: "#175cd3",
      filters: {
        ...DEFAULT_FILTERS(getTodayIso()),
        meetingType: "hybrid",
      },
    },
    {
      id: "filter-facilities",
      title: "Control de salas",
      description: "Vista orientada a aforo, estado y reservas fisicas.",
      accentColor: "#027a48",
      filters: {
        ...DEFAULT_FILTERS(getTodayIso()),
        organizerId: diego.id,
      },
    },
  ];

  return {
    generatedAtIso: new Date().toISOString(),
    currentUser,
    meetings,
    rooms,
    templates,
    savedFilters,
    incidents: [operationsIncident, completedIncident],
    directoryUsers,
  };
};
