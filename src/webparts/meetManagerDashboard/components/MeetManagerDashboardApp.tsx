import * as React from "react";
import {
  DefaultButton,
  Link,
  MessageBar,
  MessageBarType,
  Panel,
  PanelType,
  PrimaryButton,
  Spinner,
  SpinnerSize,
} from "@fluentui/react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import styles from "./MeetManagerDashboardApp.module.scss";
import {
  DASHBOARD_VIEW_OPTIONS,
  MEETING_EDITABLE_STATUS_OPTIONS,
  MEETING_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  ROOM_FEATURE_OPTIONS,
  WORKFLOW_STATUS_OPTIONS,
} from "../../../common/constants/meetManagerConstants";
import { useMeetManagerDashboard } from "../../../common/hooks/useMeetManagerDashboard";
import { DashboardViewKey, MeetingDraft, MeetingRecord, MeetingRoom, RoomFeature } from "../../../common/models/meetManagerModels";
import { IMeetManagerServiceConfiguration } from "../../../common/services/interfaces/IMeetManagerService";
import { formatDateTimeRange, formatTimeLabel, fromLocalInputValue, toLocalInputValue } from "../../../common/utils/dateTime";
import { getMeetingTypeLabel, getStatusLabel } from "../../../common/utils/meetingComputations";

export interface IMeetManagerDashboardAppProps {
  title: string;
  context: WebPartContext;
  configuration: IMeetManagerServiceConfiguration;
  defaultView: DashboardViewKey;
  isInTeams: boolean;
}

const splitCsv = (value: string): string[] => value.split(",").map((item) => item.trim()).filter(Boolean);
const splitLines = (value: string): string[] => value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
const slugify = (value: string): string => value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const getTypeClass = (type: MeetingRecord["type"]): string => (type === "onsite" ? styles.typeOnsite : type === "virtual" ? styles.typeVirtual : styles.typeHybrid);
const getStatusClass = (status: MeetingRecord["status"]): string =>
  status === "active" ? styles.statusActive : status === "completed" ? styles.statusCompleted : status === "cancelled" ? styles.statusCancelled : status === "draft" ? styles.statusDraft : styles.statusScheduled;

export default function MeetManagerDashboardApp(props: IMeetManagerDashboardAppProps): JSX.Element {
  const dashboard = useMeetManagerDashboard({
    context: props.context,
    configuration: props.configuration,
    defaultView: props.defaultView,
  });
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string }>();
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const roomsById = (dashboard.snapshot?.rooms ?? []).reduce<Record<string, MeetingRoom>>((current, room) => {
    current[room.id] = room;
    return current;
  }, {});
  const organizers = Array.from(new Map((dashboard.snapshot?.meetings ?? []).map((meeting) => [meeting.organizer.id, meeting.organizer])).values());

  const setDraftCsvField = (field: "attendeeEmails" | "externalGuests" | "tagValues" | "documentLinks", value: string): void => dashboard.updateDraft(field, splitCsv(value));
  const setDraftLineField = (field: "agendaItems" | "checklistLabels", value: string): void => dashboard.updateDraft(field, splitLines(value));
  const toggleFeature = (feature: RoomFeature): void => dashboard.updateDraft("equipmentRequirements", dashboard.draft.equipmentRequirements.indexOf(feature) >= 0 ? dashboard.draft.equipmentRequirements.filter((item) => item !== feature) : [...dashboard.draft.equipmentRequirements, feature]);

  const runAction = async (action: () => Promise<void>, successText: string): Promise<void> => {
    setFeedback(undefined);
    try {
      await action();
      setFeedback({ type: "success", text: successText });
    } catch (error) {
      setFeedback({ type: "error", text: (error as Error).message });
    }
  };

  const saveDraft = async (): Promise<void> => {
    setIsSaving(true);
    await runAction(async () => {
      await dashboard.saveDraft();
    }, dashboard.composerMode === "create" ? "La reunion se ha guardado correctamente." : "La reunion se ha actualizado correctamente.");
    setIsSaving(false);
  };

  const meetingCard = (meeting: MeetingRecord): JSX.Element => (
    <button key={meeting.id} type="button" className={`${styles.meetingCard} ${dashboard.selectedMeeting?.id === meeting.id ? styles.meetingCardSelected : ""}`} onClick={() => dashboard.selectMeeting(meeting.id)}>
      <div className={styles.cardHead}>
        <div>
          <strong>{meeting.title}</strong>
          <div className={styles.muted}>{formatDateTimeRange(meeting.startIso, meeting.endIso)}</div>
        </div>
        <div className={styles.badgeRow}>
          <span className={`${styles.badge} ${getTypeClass(meeting.type)}`}>{getMeetingTypeLabel(meeting.type)}</span>
          <span className={`${styles.badge} ${getStatusClass(meeting.status)}`}>{getStatusLabel(meeting.status)}</span>
        </div>
      </div>
      <div className={styles.metaGrid}>
        <span>{meeting.organizer.displayName}</span>
        <span>{meeting.roomId ? roomsById[meeting.roomId]?.title ?? "Sala" : "Sin sala"}</span>
        <span>{meeting.teamContext?.teamName ?? "Sin equipo"}</span>
        <span>{meeting.teamsMeeting?.joinUrl ? "Teams listo" : "Sin Teams"}</span>
      </div>
      <div className={styles.tagRow}>{meeting.tags.map((tag) => <span key={tag} className={styles.tag}>{tag}</span>)}</div>
    </button>
  );

  const renderView = (): JSX.Element => {
    if (dashboard.meetings.length === 0) {
      return <div className={styles.emptyState}><strong>No hay reuniones para los filtros actuales</strong><span className={styles.muted}>Ajusta fecha, filtros o crea una reunion nueva.</span></div>;
    }

    if (dashboard.view === "calendar") {
      return <div className={styles.grid}>{dashboard.calendarColumns.map((column) => <section key={column.dateIso} className={styles.column}><strong>{column.dayLabel}</strong>{column.meetings.length === 0 ? <span className={styles.muted}>Sin reuniones</span> : column.meetings.map(meetingCard)}</section>)}</div>;
    }

    if (dashboard.view === "rooms") {
      return <div className={styles.grid}>{dashboard.roomSummaries.map((summary) => <div key={summary.room.id} className={styles.roomCard}><div className={styles.cardHead}><strong>{summary.room.title}</strong><span className={`${styles.badge} ${summary.state === "busy" ? styles.statusActive : summary.state === "soon" ? styles.typeHybrid : summary.state === "maintenance" ? styles.statusCancelled : styles.typeOnsite}`}>{summary.state === "busy" ? "Ocupada" : summary.state === "soon" ? "Proxima" : summary.state === "maintenance" ? "Mantenimiento" : "Disponible"}</span></div><span className={styles.muted}>{summary.room.building} · Planta {summary.room.floor} · Capacidad {summary.room.capacity}</span><div className={styles.tagRow}>{summary.room.features.map((feature) => <span key={feature} className={styles.tag}>{feature}</span>)}</div>{summary.currentMeeting ? <button type="button" className={styles.linkButton} onClick={() => dashboard.selectMeeting(summary.currentMeeting!.id)}>En uso por {summary.currentMeeting.title}</button> : summary.nextMeeting ? <button type="button" className={styles.linkButton} onClick={() => dashboard.selectMeeting(summary.nextMeeting!.id)}>Siguiente: {summary.nextMeeting.title}</button> : <span className={styles.muted}>Sin reservas cercanas</span>}</div>)}</div>;
    }

    if (dashboard.view === "timeline") {
      return <div className={styles.timeline}>{dashboard.timelineEntries.map((entry) => <div key={entry.id} className={styles.timelineRow}><span className={styles.muted}>{entry.timeLabel}</span>{entry.meeting ? <button type="button" className={styles.timelineMeeting} onClick={() => dashboard.selectMeeting(entry.meeting!.id)}><strong>{entry.meeting.title}</strong><span className={styles.muted}>{entry.meeting.organizer.displayName}</span></button> : <span className={styles.muted}>Libre</span>}</div>)}</div>;
    }

    if (dashboard.view === "teams") {
      return <div className={styles.grid}>{dashboard.teamBuckets.map((bucket) => <section key={bucket.id} className={styles.column}><strong>{bucket.title}</strong><span className={styles.muted}>{bucket.subtitle}</span>{bucket.meetings.map(meetingCard)}</section>)}</div>;
    }

    if (dashboard.view === "status") {
      return <div className={styles.grid}>{dashboard.statusBuckets.map((bucket) => <section key={bucket.status} className={styles.column}><strong>{bucket.title}</strong>{bucket.meetings.length === 0 ? <span className={styles.muted}>Sin reuniones</span> : bucket.meetings.map(meetingCard)}</section>)}</div>;
    }

    if (dashboard.view === "board") {
      return <div className={styles.grid}>{["onsite", "virtual", "hybrid"].map((group) => <section key={group} className={styles.column}><strong>{group === "onsite" ? "Presenciales" : group === "virtual" ? "Virtuales" : "Hibridas"}</strong>{dashboard.meetings.filter((meeting) => meeting.type === group).map(meetingCard)}</section>)}</div>;
    }

    return <div className={styles.stack}>{dashboard.meetings.map(meetingCard)}</div>;
  };

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>{props.isInTeams ? "Contexto Teams habilitado" : "Centro de operaciones de reuniones"}</div>
          <h2 className={styles.title}>{props.title}</h2>
          <p className={styles.subtitle}>Planifica, controla y ejecuta reuniones presenciales, virtuales e hibridas desde un unico punto en SharePoint.</p>
          <div className={styles.heroPills}>
            <span className={styles.heroPill}>{props.configuration.dataSourceMode === "mock" ? "Modo demo realista" : "Modo SharePoint conectado"}</span>
            <span className={styles.heroPill}>{props.configuration.enableGraphAssist ? "Teams y Graph preparados" : "Graph opcional"}</span>
          </div>
        </div>
        <div className={styles.heroActions}>
          <PrimaryButton text="Nueva reunion" onClick={dashboard.openCreate} />
          <DefaultButton text="Refrescar" onClick={() => void dashboard.refresh()} />
        </div>
      </section>

      {feedback ? <MessageBar messageBarType={feedback.type === "success" ? MessageBarType.success : MessageBarType.error}>{feedback.text}</MessageBar> : null}
      {dashboard.errorMessage ? <MessageBar messageBarType={MessageBarType.error}>{dashboard.errorMessage}</MessageBar> : null}

      <div className={styles.metrics}>
        {dashboard.metrics.map((metric) => <article key={metric.id} className={styles.metric}><span className={styles.metricLabel}>{metric.label}</span><strong className={styles.metricValue}>{metric.value}</strong><span className={styles.muted}>{metric.helpText}</span></article>)}
      </div>

      <section className={styles.surface}>
        <div className={styles.filters}>
          <label className={styles.field}><span>Fecha</span><input className={styles.input} type="date" value={dashboard.filters.selectedDateIso.slice(0, 10)} onChange={(event) => dashboard.setFilters({ selectedDateIso: new Date(`${event.target.value}T00:00:00`).toISOString() })} /></label>
          <label className={styles.field}><span>Buscar</span><input className={styles.input} type="search" value={dashboard.filters.searchText} onChange={(event) => dashboard.setFilters({ searchText: event.target.value })} placeholder="Titulo, etiqueta o organizador" /></label>
          <label className={styles.field}><span>Tipo</span><select className={styles.select} value={dashboard.filters.meetingType} onChange={(event) => dashboard.setFilters({ meetingType: event.target.value as typeof dashboard.filters.meetingType })}><option value="all">Todos</option>{MEETING_TYPE_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.text}</option>)}</select></label>
          <label className={styles.field}><span>Estado</span><select className={styles.select} value={dashboard.filters.status} onChange={(event) => dashboard.setFilters({ status: event.target.value as typeof dashboard.filters.status })}>{WORKFLOW_STATUS_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.text}</option>)}</select></label>
          <label className={styles.field}><span>Organizador</span><select className={styles.select} value={dashboard.filters.organizerId} onChange={(event) => dashboard.setFilters({ organizerId: event.target.value })}><option value="all">Todos</option>{organizers.map((organizer) => <option key={organizer.id} value={organizer.id}>{organizer.displayName}</option>)}</select></label>
          <label className={styles.check}><input type="checkbox" checked={dashboard.filters.favoritesOnly} onChange={(event) => dashboard.setFilters({ favoritesOnly: event.target.checked })} /><span>Solo favoritos</span></label>
        </div>
        <div className={styles.viewRow}>{DASHBOARD_VIEW_OPTIONS.map((option) => <button key={option.key} type="button" className={`${styles.viewButton} ${dashboard.view === option.key ? styles.viewButtonActive : ""}`} onClick={() => dashboard.setView(option.key)}>{option.text}</button>)}</div>
        <div className={styles.chipRow}>{(dashboard.snapshot?.savedFilters ?? []).map((filter) => <button key={filter.id} type="button" className={styles.chip} style={{ borderColor: filter.accentColor }} onClick={() => dashboard.applySavedFilter(filter)}><strong>{filter.title}</strong><span className={styles.muted}>{filter.description}</span></button>)}</div>
        <div className={styles.chipRow}>{(dashboard.snapshot?.templates ?? []).map((template) => <button key={template.id} type="button" className={styles.chip} onClick={() => dashboard.applyTemplate(template)}><strong>{template.title}</strong><span className={styles.muted}>{template.summary}</span></button>)}</div>
      </section>

      {dashboard.isLoading ? <div className={styles.loading}><Spinner size={SpinnerSize.large} label="Cargando estado operativo..." /></div> : <div className={styles.layout}><section className={styles.surface}>{renderView()}</section><aside className={styles.side}><section className={styles.surface}><strong className={styles.sectionTitle}>Centro operativo</strong>{dashboard.selectedMeeting ? <><div className={styles.cardHead}><div><strong>{dashboard.selectedMeeting.title}</strong><div className={styles.muted}>{formatDateTimeRange(dashboard.selectedMeeting.startIso, dashboard.selectedMeeting.endIso)}</div></div><div className={styles.badgeRow}><span className={`${styles.badge} ${getTypeClass(dashboard.selectedMeeting.type)}`}>{getMeetingTypeLabel(dashboard.selectedMeeting.type)}</span><span className={`${styles.badge} ${getStatusClass(dashboard.selectedMeeting.status)}`}>{getStatusLabel(dashboard.selectedMeeting.status)}</span></div></div><div className={styles.linkRow}>{dashboard.selectedMeeting.teamsMeeting?.joinUrl ? <Link href={dashboard.selectedMeeting.teamsMeeting.joinUrl} target="_blank" rel="noreferrer">Unirse a Teams</Link> : null}<button type="button" className={styles.linkButton} onClick={() => dashboard.openEdit(dashboard.selectedMeeting!)}>Editar</button><button type="button" className={styles.linkButton} onClick={() => void runAction(() => dashboard.duplicateMeeting(dashboard.selectedMeeting!.id), "Se preparo una copia editable.")}>Duplicar</button><button type="button" className={styles.linkButton} onClick={() => void runAction(() => dashboard.completeMeeting(dashboard.selectedMeeting!.id), "Reunion marcada como finalizada.")}>Finalizar</button><button type="button" className={styles.linkButton} onClick={() => void runAction(() => dashboard.releaseRoom(dashboard.selectedMeeting!.id), "Sala liberada.")}>Liberar sala</button><button type="button" className={styles.linkButton} onClick={() => void runAction(() => dashboard.cancelMeeting(dashboard.selectedMeeting!.id), "Reunion cancelada.")}>Cancelar</button></div><div className={styles.section}><strong>Datos principales</strong><div className={styles.metaGrid}><span>{dashboard.selectedMeeting.organizer.displayName}</span><span>{dashboard.selectedMeeting.roomId ? roomsById[dashboard.selectedMeeting.roomId]?.title ?? "Sala" : "Sin sala"}</span><span>{dashboard.selectedMeeting.teamContext?.teamName ?? "Sin equipo"}</span><span>{dashboard.selectedMeeting.priority}</span></div></div><div className={styles.section}><strong>Checklist</strong>{dashboard.selectedMeeting.checklist.length === 0 ? <span className={styles.muted}>Sin checklist</span> : dashboard.selectedMeeting.checklist.map((item) => <label key={item.id} className={styles.checklist}><input type="checkbox" checked={item.completed} readOnly /><span>{item.label}</span></label>)}</div><div className={styles.section}><strong>Incidencias</strong>{dashboard.selectedMeeting.incidents.length === 0 ? <span className={styles.muted}>Sin incidencias registradas.</span> : dashboard.selectedMeeting.incidents.map((incident) => <div key={incident.id} className={styles.note}><strong>{incident.title}</strong><span className={styles.muted}>{incident.description}</span></div>)}</div><div className={styles.section}><strong>Cambios recientes</strong>{dashboard.selectedMeeting.recentChanges.map((change) => <div key={change.id} className={styles.note}><strong>{change.label}</strong><span className={styles.muted}>{change.actorName} · {formatTimeLabel(change.createdAtIso)}</span></div>)}</div></> : <span className={styles.muted}>Selecciona una reunion para ver su detalle.</span>}</section><section className={styles.surface}><strong className={styles.sectionTitle}>Estado de salas</strong><div className={styles.stack}>{dashboard.roomSummaries.map((summary) => <div key={summary.room.id} className={styles.roomCard}><div className={styles.cardHead}><strong>{summary.room.title}</strong><span className={`${styles.badge} ${summary.state === "busy" ? styles.statusActive : summary.state === "soon" ? styles.typeHybrid : summary.state === "maintenance" ? styles.statusCancelled : styles.typeOnsite}`}>{summary.state === "busy" ? "Ocupada" : summary.state === "soon" ? "Proxima" : summary.state === "maintenance" ? "Mantenimiento" : "Disponible"}</span></div><span className={styles.muted}>{summary.room.locationLabel}</span>{summary.currentMeeting ? <button type="button" className={styles.linkButton} onClick={() => dashboard.selectMeeting(summary.currentMeeting!.id)}>En uso por {summary.currentMeeting.title}</button> : summary.nextMeeting ? <button type="button" className={styles.linkButton} onClick={() => dashboard.selectMeeting(summary.nextMeeting!.id)}>Siguiente: {summary.nextMeeting.title}</button> : <span className={styles.muted}>Sin reservas cercanas</span>}</div>)}</div></section></aside></div>}

      <Panel isOpen={dashboard.isComposerOpen} type={PanelType.large} onDismiss={dashboard.closeComposer} headerText={dashboard.composerMode === "create" ? "Nueva reunion" : "Editar reunion"} closeButtonAriaLabel="Cerrar panel">
        <div className={styles.composer}>
          <div className={styles.composerMain}>
            {dashboard.validation?.errors.map((issue) => <MessageBar key={issue.id} messageBarType={MessageBarType.error}>{issue.message}</MessageBar>)}
            {dashboard.validation?.warnings.map((issue) => <MessageBar key={issue.id} messageBarType={MessageBarType.warning}>{issue.message}</MessageBar>)}
            <label className={styles.field}><span>Titulo</span><input className={styles.input} value={dashboard.draft.title} onChange={(event) => dashboard.updateDraft("title", event.target.value)} /></label>
            <label className={styles.field}><span>Descripcion</span><textarea className={styles.textarea} rows={3} value={dashboard.draft.description} onChange={(event) => dashboard.updateDraft("description", event.target.value)} /></label>
            <div className={styles.formGrid}><label className={styles.field}><span>Organizador</span><select className={styles.select} value={dashboard.draft.organizerId} onChange={(event) => dashboard.updateDraft("organizerId", event.target.value)}>{organizers.map((organizer) => <option key={organizer.id} value={organizer.id}>{organizer.displayName}</option>)}</select></label><label className={styles.field}><span>Estado</span><select className={styles.select} value={dashboard.draft.status} onChange={(event) => dashboard.updateDraft("status", event.target.value as MeetingDraft["status"])}>{MEETING_EDITABLE_STATUS_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.text}</option>)}</select></label><label className={styles.field}><span>Tipo</span><select className={styles.select} value={dashboard.draft.type} onChange={(event) => dashboard.updateDraft("type", event.target.value as MeetingDraft["type"])}>{MEETING_TYPE_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.text}</option>)}</select></label><label className={styles.field}><span>Prioridad</span><select className={styles.select} value={dashboard.draft.priority} onChange={(event) => dashboard.updateDraft("priority", event.target.value as MeetingDraft["priority"])}>{PRIORITY_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.text}</option>)}</select></label></div>
            <div className={styles.formGrid}><label className={styles.field}><span>Inicio</span><input className={styles.input} type="datetime-local" value={toLocalInputValue(dashboard.draft.startIso)} onChange={(event) => dashboard.updateDraft("startIso", fromLocalInputValue(event.target.value))} /></label><label className={styles.field}><span>Fin</span><input className={styles.input} type="datetime-local" value={toLocalInputValue(dashboard.draft.endIso)} onChange={(event) => dashboard.updateDraft("endIso", fromLocalInputValue(event.target.value))} /></label><label className={styles.field}><span>Sala</span><select className={styles.select} value={dashboard.draft.roomId ?? ""} onChange={(event) => dashboard.updateDraft("roomId", event.target.value || undefined)}><option value="">Sin sala asignada</option>{(dashboard.snapshot?.rooms ?? []).map((room) => <option key={room.id} value={room.id}>{room.title}</option>)}</select></label><label className={styles.field}><span>Enlace Teams</span><input className={styles.input} value={dashboard.draft.teamsMeetingUrl ?? ""} onChange={(event) => dashboard.updateDraft("teamsMeetingUrl", event.target.value)} placeholder="https://teams.microsoft.com/..." /></label></div>
            <div className={styles.formGrid}><label className={styles.field}><span>Equipo de Teams</span><input className={styles.input} value={dashboard.draft.teamName ?? ""} onChange={(event) => { dashboard.updateDraft("teamName", event.target.value); dashboard.updateDraft("teamId", slugify(event.target.value)); }} /></label><label className={styles.field}><span>Canal</span><input className={styles.input} value={dashboard.draft.channelName ?? ""} onChange={(event) => { dashboard.updateDraft("channelName", event.target.value); dashboard.updateDraft("channelId", slugify(event.target.value)); }} /></label></div>
            <label className={styles.field}><span>Asistentes internos</span><textarea className={styles.textarea} rows={2} value={dashboard.draft.attendeeEmails.join(", ")} onChange={(event) => setDraftCsvField("attendeeEmails", event.target.value)} /></label>
            <label className={styles.field}><span>Invitados externos</span><textarea className={styles.textarea} rows={2} value={dashboard.draft.externalGuests.join(", ")} onChange={(event) => setDraftCsvField("externalGuests", event.target.value)} /></label>
            <label className={styles.field}><span>Etiquetas</span><input className={styles.input} value={dashboard.draft.tagValues.join(", ")} onChange={(event) => setDraftCsvField("tagValues", event.target.value)} /></label>
            <label className={styles.field}><span>Notas previas</span><textarea className={styles.textarea} rows={3} value={dashboard.draft.preMeetingNotes} onChange={(event) => dashboard.updateDraft("preMeetingNotes", event.target.value)} /></label>
            <label className={styles.field}><span>Agenda</span><textarea className={styles.textarea} rows={4} value={dashboard.draft.agendaItems.join("\n")} onChange={(event) => setDraftLineField("agendaItems", event.target.value)} /></label>
            <label className={styles.field}><span>Documentacion</span><textarea className={styles.textarea} rows={2} value={dashboard.draft.documentLinks.join(", ")} onChange={(event) => setDraftCsvField("documentLinks", event.target.value)} /></label>
            <label className={styles.field}><span>Checklist</span><textarea className={styles.textarea} rows={3} value={dashboard.draft.checklistLabels.join("\n")} onChange={(event) => setDraftLineField("checklistLabels", event.target.value)} /></label>
            <div className={styles.field}><span>Equipamiento</span><div className={styles.checkGrid}>{ROOM_FEATURE_OPTIONS.map((option) => <label key={option.key} className={styles.check}><input type="checkbox" checked={dashboard.draft.equipmentRequirements.indexOf(option.key) >= 0} onChange={() => toggleFeature(option.key)} /><span>{option.text}</span></label>)}</div></div>
            <div className={styles.footer}><PrimaryButton text={isSaving ? "Guardando..." : "Guardar reunion"} onClick={() => void saveDraft()} disabled={isSaving} /><DefaultButton text="Cerrar" onClick={dashboard.closeComposer} /></div>
          </div>
          <aside className={styles.composerSide}>
            <strong className={styles.sectionTitle}>Sugerencias de sala</strong>
            {(dashboard.validation?.roomRecommendations ?? []).length === 0 ? <span className={styles.muted}>No hay recomendaciones disponibles.</span> : (dashboard.validation?.roomRecommendations ?? []).map((recommendation) => <div key={recommendation.roomId} className={styles.note}><strong>{roomsById[recommendation.roomId]?.title ?? recommendation.roomId}</strong>{recommendation.reasons.map((reason) => <span key={reason} className={styles.muted}>{reason}</span>)}<button type="button" className={styles.linkButton} onClick={() => dashboard.updateDraft("roomId", recommendation.roomId)}>Aplicar sala</button></div>)}
            <strong className={styles.sectionTitle}>Sugerencias de horario</strong>
            {(dashboard.validation?.suggestedSlots ?? []).length === 0 ? <span className={styles.muted}>No hay huecos sugeridos.</span> : (dashboard.validation?.suggestedSlots ?? []).map((slot) => <div key={slot.id} className={styles.note}><strong>{slot.label}</strong><span className={styles.muted}>{formatDateTimeRange(slot.startIso, slot.endIso)}</span><button type="button" className={styles.linkButton} onClick={() => { dashboard.updateDraft("startIso", slot.startIso); dashboard.updateDraft("endIso", slot.endIso); if (slot.roomId) { dashboard.updateDraft("roomId", slot.roomId); } }}>Aplicar franja</button></div>)}
          </aside>
        </div>
      </Panel>
    </div>
  );
}
