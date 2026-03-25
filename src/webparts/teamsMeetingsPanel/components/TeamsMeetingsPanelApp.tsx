import * as React from "react";
import { DefaultButton, Link, MessageBar, MessageBarType, Spinner, SpinnerSize } from "@fluentui/react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import styles from "./TeamsMeetingsPanelApp.module.scss";
import { useTeamsMeetingsPanel } from "../../../common/hooks/useTeamsMeetingsPanel";
import { IMeetManagerServiceConfiguration } from "../../../common/services/interfaces/IMeetManagerService";
import { formatDateTimeRange, formatTimeLabel } from "../../../common/utils/dateTime";
import { getMeetingTypeLabel, getStatusLabel } from "../../../common/utils/meetingComputations";

export interface ITeamsMeetingsPanelAppProps {
  title: string;
  context: WebPartContext;
  configuration: IMeetManagerServiceConfiguration;
  isInTeams: boolean;
  maxItems: number;
}

export default function TeamsMeetingsPanelApp(props: ITeamsMeetingsPanelAppProps): JSX.Element {
  const { snapshot, isLoading, errorMessage, refresh } = useTeamsMeetingsPanel({
    context: props.context,
    configuration: props.configuration,
  });

  const meetings = (snapshot?.meetings ?? []).slice(0, props.maxItems);

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>{props.isInTeams ? "Panel listo para Teams" : "Panel compacto para SharePoint y Teams"}</div>
          <h3 className={styles.title}>{props.title}</h3>
          <p className={styles.subtitle}>Acceso rapido a reuniones online, estado actual y contexto del equipo asociado.</p>
        </div>
        <DefaultButton text="Refrescar" onClick={() => void refresh()} />
      </section>

      {errorMessage ? <MessageBar messageBarType={MessageBarType.error}>{errorMessage}</MessageBar> : null}
      {isLoading ? <div className={styles.loading}><Spinner size={SpinnerSize.medium} label="Cargando reuniones..." /></div> : null}

      {snapshot?.activeMeeting ? (
        <section className={styles.activeCard}>
          <div className={styles.cardHeader}>
            <strong>En curso ahora</strong>
            <span className={styles.badge}>{getStatusLabel(snapshot.activeMeeting.status)}</span>
          </div>
          <div className={styles.activeTitle}>{snapshot.activeMeeting.title}</div>
          <div className={styles.meta}>{formatDateTimeRange(snapshot.activeMeeting.startIso, snapshot.activeMeeting.endIso)}</div>
          <div className={styles.meta}>{snapshot.activeMeeting.teamContext?.teamName ?? "Sin equipo"} · {getMeetingTypeLabel(snapshot.activeMeeting.type)}</div>
          {snapshot.activeMeeting.teamsMeeting?.joinUrl ? (
            <Link href={snapshot.activeMeeting.teamsMeeting.joinUrl} target="_blank" rel="noreferrer">
              Unirse a Teams
            </Link>
          ) : (
            <span className={styles.muted}>Sin enlace disponible</span>
          )}
        </section>
      ) : null}

      <section className={styles.listSurface}>
        <div className={styles.sectionHeader}>
          <strong>Proximas reuniones</strong>
          <span className={styles.muted}>{snapshot?.inferredTeamContext?.teamName ?? "Vista transversal"}</span>
        </div>
        {meetings.length === 0 ? <div className={styles.empty}>No hay reuniones online proximas.</div> : null}
        <div className={styles.list}>
          {meetings.map((meeting) => (
            <article key={meeting.id} className={styles.meetingCard}>
              <div className={styles.cardHeader}>
                <strong>{meeting.title}</strong>
                <span className={styles.badge}>{getMeetingTypeLabel(meeting.type)}</span>
              </div>
              <div className={styles.meta}>{formatDateTimeRange(meeting.startIso, meeting.endIso)}</div>
              <div className={styles.meta}>
                {meeting.teamContext?.teamName ?? "Sin equipo"} · {meeting.organizer.displayName}
              </div>
              <div className={styles.footer}>
                <span className={styles.timeChip}>{formatTimeLabel(meeting.startIso)}</span>
                {meeting.teamsMeeting?.joinUrl ? (
                  <Link href={meeting.teamsMeeting.joinUrl} target="_blank" rel="noreferrer">
                    Abrir
                  </Link>
                ) : (
                  <span className={styles.muted}>Sin Teams</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
