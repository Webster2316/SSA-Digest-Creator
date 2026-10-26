import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Trash2,
  SquareArrowOutUpRight,
  CircleCheck,
  Plus,
  Loader2,
  Archive,
  Save,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import useConfirmDelete from "../../shared/useConfirmDelete";
import Field from "../../shared/field";
import { uid, esc, inputCls } from "../../shared/utils";
import NamePopUp from "../../shared/NamePopUpModal";
import RecordsPanel from "../../shared/recordsPanel";
import RecordViewer from "../../shared/recordViewer";
import EventsEditor from "./EventsEditor";
import EventsHistory from "./EventsHistory";
import UpcomingList from "./upcomingList";

/* ================================================================== */
/* TYPES                                                              */
/* ================================================================== */

export type EventStatus = "Tentative" | "Confirmed";
export type RegistrationStatus =
  | "Open"
  | "LimitedSlots"
  | "Waitlist"
  | "ClosingSoon"
  | "Full";
export type CompletionStatus = "InProgress" | "Completed";
export type DateMode = "exact" | "month";

export interface EventDocument {
  label: string;
  url: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD" (exact) or "YYYY-MM" (month)
  dateMode: DateMode;
  registrationStatus: RegistrationStatus;
  eventStatus: EventStatus;
  completionStatus: CompletionStatus;
  registrationLink: string;
  committees: string[];
  customCommitteeTags: string[];
  details: string;
  programme: string;
  speakers: string;
  sponsors: string;
  dressCode: string;
  registrationDeadline: string;
  remarks: string;
  documents: EventDocument[];
}

/** One line in the "Upcoming Events" list at the bottom of the email. */
export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  eventStatus: EventStatus;
}

export type TagStyle = {
  text: string;
  bg: string;
  color: string;
  border: string;
};

/** Everything needed to build the email HTML. */
export interface EmailData {
  events: EventItem[];
  upcomingList: UpcomingEvent[];
  greeting: string;
  issueRange: string;
}

/* ================================================================== */
/* CONFIG                                                             */
/* ================================================================== */

const EVENTS_BUILDER_KEY = "events-builder-data";

const FONT =
  "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

const NAVY = "#262261";
const PAGE_BG = "#f0f4f8";
const CONTACT_EMAIL = "sarah@ssa.org.sg";
const BANNER_URL =
  "https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/refs/heads/main/Banner4.png";

const DEFAULT_ISSUE_RANGE = "Monthly Issue: ";

const DEFAULT_GREETING = `Dear Members,

We are pleased to invite you to our upcoming and future planned events, designed to bring our members together and provide an opportunity to engage directly with our Chairs, Councillors and Committee Experts.

These in-person sessions will provide an overview of the work being undertaken across our committees, while creating opportunities for members to exchange insights, connect with fellow industry professionals and learn more about how to engage with our activities.

We encourage you to register your interest and join us at these upcoming sessions.

We look forward to bringing our members together and strengthening our collective engagement across the association.`;

const EVENT_STATUS_STYLES: Record<EventStatus, TagStyle> = {
  Confirmed: { text: "Confirmed", bg: "#e1ffba", color: "#416e07", border: "#416e07" },
  Tentative: { text: "Tentative", bg: "#f2bbbf", color: "#700710", border: "#700710" },
};

const REGISTRATION_STATUS_STYLES: Record<RegistrationStatus, TagStyle> = {
  Open: { text: "Open", bg: "#76914a", color: "#287333", border: "#384a1b" },
  LimitedSlots: { text: "Limited Seats", bg: "#dbd679", color: "#8a6c00", border: "#7d7704" },
  ClosingSoon: { text: "Closing Soon", bg: "#e6ad63", color: "#9a4a16", border: "#7d4804" },
  Waitlist: { text: "Waitlist", bg: "#c5e0eb", color: "#5c3b7e", border: "#042f40" },
  Full: { text: "Full", bg: "#f3f0f5", color: "#5a5f6d", border: "#c7ccd6" },
};

const COMMITTEE_STYLES: Record<string, TagStyle> = {
  DEC: { text: "Decarbonisation", bg: "#8ede96", color: "#1d7d26", border: "#1d7d26" },
  DIG: { text: "Digitalisation", bg: "#9eb2de", color: "#103687", border: "#103687" },
  INT: { text: "International", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708" },
  TEC: { text: "Technical", bg: "#c78585", color: "#871010", border: "#871010" },
  LEG: { text: "Legal and Insurance", bg: "#b48fbd", color: "#510763", border: "#510763" },
  SVC: { text: "Services", bg: "#e9eba4", color: "#717312", border: "#717312" },
  MFC: { text: "Marine Fuels", bg: "#91c4b5", color: "#238266", border: "#238266" },
  YEG: { text: "YEG", bg: "#d498c1", color: "#7a0b57", border: "#7a0b57" },
};

/* ================================================================== */
/* HELPERS                                                            */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function getTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** "2026-11-05" -> { day: "5", monthYear: "NOV 2026" }; "2026-11" -> { day: "TBC", ... } */
function getDateParts(date: string) {
  if (!date) return { day: "TBC", monthYear: "" };

  const [year, month, day] = date.split("-");
  const monthText = MONTHS[Number(month) - 1] ?? "";
  const dayNumber = Number(day);

  return {
    day: day && !Number.isNaN(dayNumber) ? String(dayNumber) : "TBC",
    monthYear: [monthText, year].filter(Boolean).join(" "),
  };
}

/** Defaults to 14 days before an exact event date, formatted DD/MM/YYYY. */
function getRegistrationDeadline(event: EventItem): string {
  if (event.registrationDeadline?.trim()) return event.registrationDeadline;
  if (!event.date || event.dateMode !== "exact") return "";

  const d = new Date(`${event.date}T12:00:00`);
  d.setDate(d.getDate() - 14);

  return [
    String(d.getDate()).padStart(2, "0"),
    String(d.getMonth() + 1).padStart(2, "0"),
    d.getFullYear(),
  ].join("/");
}

/* ------------------------------------------------------------------ */
/* Sorting (undated items go last)                                     */
/* ------------------------------------------------------------------ */

const sortKey = (date: string) => (date.length === 7 ? `${date}-01` : date);

function sortByDate<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return sortKey(a.date).localeCompare(sortKey(b.date));
  });
}

/* ------------------------------------------------------------------ */
/* Content checks                                                      */
/* ------------------------------------------------------------------ */

/** True if the HTML has visible text or an image. */
function hasContent(html?: string): boolean {
  if (!html) return false;
  if (/<img\b/i.test(html)) return true;
  return (
    html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim().length > 0
  );
}

/* ------------------------------------------------------------------ */
/* Normalisers (run once, at the data boundary)                        */
/* ------------------------------------------------------------------ */

const REGISTRATION_STATUSES: RegistrationStatus[] = [
  "Open",
  "LimitedSlots",
  "Waitlist",
  "ClosingSoon",
  "Full",
];

// `any` on purpose: this receives untrusted/legacy saved data.
function normaliseEvent(ev: any): EventItem {
  const registrationStatus: RegistrationStatus =
    ev?.registrationStatus === "Available"
      ? "Open"
      : REGISTRATION_STATUSES.includes(ev?.registrationStatus)
        ? ev.registrationStatus
        : "Open";

  // Older saves stored speakers as an array of objects.
  const speakers =
    typeof ev?.speakers === "string"
      ? ev.speakers
      : Array.isArray(ev?.speakers)
        ? ev.speakers
          .map(
            (s: any) =>
              `<p><strong>${esc(s?.name ?? "")}</strong><br>${esc(
                s?.designation ?? ""
              )}<br>${esc(s?.company ?? "")}</p>`
          )
          .join("")
        : "";

  return {
    id: ev?.id ?? uid(),
    title: ev?.title ?? "",
    date: ev?.date ?? "",
    dateMode: ev?.dateMode === "exact" ? "exact" : "month",
    registrationStatus,
    eventStatus: ev?.eventStatus === "Confirmed" ? "Confirmed" : "Tentative",
    completionStatus:
      ev?.completionStatus === "Completed" ? "Completed" : "InProgress",
    registrationLink: ev?.registrationLink ?? "",
    committees: Array.isArray(ev?.committees) ? [...ev.committees] : [],
    customCommitteeTags: Array.isArray(ev?.customCommitteeTags)
      ? [...ev.customCommitteeTags]
      : [],
    details: ev?.details ?? "",
    programme: ev?.programme ?? "",
    speakers,
    sponsors: ev?.sponsors ?? "",
    dressCode: ev?.dressCode ?? "",
    registrationDeadline: ev?.registrationDeadline ?? "",
    remarks: ev?.remarks ?? "",
    documents: Array.isArray(ev?.documents)
      ? ev.documents.map((d: any) => ({ label: d?.label ?? "", url: d?.url ?? "" }))
      : [],
  };
}

function normaliseUpcomingList(raw: unknown): UpcomingEvent[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item: any) => ({
    id: typeof item?.id === "string" && item.id ? item.id : uid(),
    title: typeof item?.title === "string" ? item.title : "",
    date: typeof item?.date === "string" ? item.date : "",
    eventStatus: item?.eventStatus === "Confirmed" ? "Confirmed" : "Tentative",
  }));
}

/* ================================================================== */
/* EMAIL TEMPLATE                                                     */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function renderBadge(
  style: TagStyle,
  dataField: string,
  dataStatus: string,
  align?: "left" | "center" | "right"
) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"${align ? ` align="${align}"` : ""
    } data-f="${esc(dataField)}" data-status="${esc(dataStatus)}"><tr><td bgcolor="${style.bg}" align="center" style="padding:4px 9px;background-color:${style.bg};border:1px solid ${style.border};border-radius:3px;font-family:${FONT};font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${style.color};white-space:nowrap;mso-line-height-rule:exactly;line-height:12px;"><span style="color:${style.color};">${esc(style.text)}</span></td></tr></table>`;
}

function renderInlineTag(text: string, { bg, color, border }: Omit<TagStyle, "text">) {
  return `<span style="display:inline-block;margin:0 0 4px 0;padding:5px 9px;border-radius:3px;background:${bg};background-color:${bg};border:1px solid ${border};font-family:${FONT};font-size:9px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${color};mso-line-height-rule:exactly;line-height:12px;"><!--[if mso]>&nbsp;&nbsp;<![endif]-->${esc(text)}<!--[if mso]>&nbsp;&nbsp;<![endif]--></span>`;
}

const CUSTOM_TAG_STYLE = { bg: "#f5f5f5", color: "#383838", border: "#383838" };

function renderTags(event: EventItem) {
  const committeeTags = (event.committees ?? [])
    .map((code) => COMMITTEE_STYLES[code])
    .filter((style): style is TagStyle => Boolean(style))
    .map((style) => renderInlineTag(style.text, style));

  const customTags = (event.customCommitteeTags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => renderInlineTag(tag, CUSTOM_TAG_STYLE));

  return [...committeeTags, ...customTags].join(" ");
}

function renderDocuments(documents: EventDocument[]) {
  if (!documents.length) return "";

  const links = documents
    .map(
      (doc, i) =>
        `<div style="margin:${i === 0 ? "0" : "6px"} 0 0;line-height:1.35;"><a href="${esc(doc.url)}" target="_blank" style="font-family:${FONT};font-size:9px;font-weight:700;color:#1b76bc;text-decoration:underline;">${esc(doc.label || "Document")}</a></div>`
    )
    .join("");

  return `<div data-f="documents" style="width:100%;border-top:1px solid #dde4ec;margin-top:14px;padding-top:12px;text-align:center;">${links}</div>`;
}

function renderButton(label: string, href: string, extraLinkAttrs: string, bg: string) {
  return `
    <table class="register-table" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
      <tr>
        <td align="center" bgcolor="${bg}" style="background-color:${bg};border-radius:3px;padding:8px 12px;mso-line-height-rule:exactly;line-height:14px;">
          <a class="register-link" ${extraLinkAttrs} href="${esc(href)}" target="_blank" style="font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#ffffff;text-decoration:none;white-space:nowrap;">
            <span style="color:#ffffff;">${esc(label)}</span>
          </a>
        </td>
      </tr>
    </table>`;
}

function renderDateCell(
  day: string,
  monthYear: string,
  opts: { className: string; width: number; daySize: number; padding: string; dataFields?: boolean }
) {
  const dayAttr = opts.dataFields ? ' data-f="date-day"' : "";
  const monthAttr = opts.dataFields ? ' data-f="date-month"' : "";

  return `
            <td class="${opts.className}" width="${opts.width}" valign="middle" align="center" bgcolor="#7c49bf" style="background:#7c49bf;padding:${opts.padding};text-align:center;">
              <span${dayAttr} style="display:block;font-family:${FONT};font-size:${opts.daySize}px;font-weight:700;color:#ffffff;line-height:1.15;">${esc(day)}</span>
              ${monthYear
      ? `<span${monthAttr} style="display:block;margin-top:3px;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#e6cffc;">${esc(monthYear)}</span>`
      : ""
    }
            </td>`;
}

/** Full-width navy bar used for the issue range and "Upcoming Events". */
function renderSectionBar(text: string, align: "left" | "center" = "left") {
  return `
        <tr>
          <td bgcolor="${NAVY}" align="${align}" style="background-color:${NAVY};padding:14px 24px;text-align:${align};">
            <span style="font-family:${FONT};font-size:12pt;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;">${esc(text)}</span>
          </td>
        </tr>`;
}

function renderGreeting(text: string) {
  const safe = esc(text ?? "").trim();
  if (!safe) return "";

  return safe
    .split(/\n\s*\n/)
    .map(
      (paragraph, i, all) =>
        `<p style="margin:0 0 ${i === all.length - 1 ? "0" : "12px"};">${paragraph.replace(/\n/g, "<br>")}</p>`
    )
    .join("");
}

/* ------------------------------------------------------------------ */
/* Label + body columns (details, programme, dress code, people, ...)  */
/* ------------------------------------------------------------------ */

interface ColumnSpec {
  label: string;
  body: string; // trusted HTML
  field?: string; // data-f attribute for the body
  padding?: string;
}

/** One row of 1-N equal columns. Columns stack on mobile (see EMAIL_STYLES). */
function renderColumnsRow(columns: ColumnSpec[]) {
  if (!columns.length) return "";

  const width = `${Math.floor(100 / columns.length)}%`;

  const cells = columns
    .map(({ label, body, field, padding = "16px 22px" }, i) => {
      const divided = i > 0;
      const bg = i % 2 === 0 ? "#fafbfd" : "#ffffff";

      return `
      <td class="col-cell${divided ? " col-divider" : ""}" width="${width}" valign="top" style="padding:${padding};background:${bg};${divided ? "border-left:1px solid #e2e8f0;" : ""}">
        <p style="margin:0 0 8px;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8492a6;">${esc(label)}</p>
        <div${field ? ` data-f="${field}"` : ""} style="font-family:${FONT};font-size:13px;color:#374151;line-height:1.65;">${body}</div>
      </td>`;
    })
    .join("");

  return `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-top:1px solid #e2e8f0;table-layout:fixed;">
          <tr>${cells}
          </tr>
        </table>`;
}

const callFor = (what: string) =>
  `Call for ${what}.<br />Please reach out to <a href="mailto:${CONTACT_EMAIL}" style="color:#1b76bc;">${CONTACT_EMAIL}</a>.`;

/* ------------------------------------------------------------------ */
/* Event block                                                         */
/* ------------------------------------------------------------------ */

function renderEvent(event: EventItem) {
  const { day, monthYear } = getDateParts(event.date);
  const tags = renderTags(event);
  const dressCode = event.dressCode?.trim();
  const deadline = getRegistrationDeadline(event);

  const statusStyle = EVENT_STATUS_STYLES[event.eventStatus] ?? EVENT_STATUS_STYLES.Tentative;
  const registrationStyle =
    REGISTRATION_STATUS_STYLES[event.registrationStatus] ?? REGISTRATION_STATUS_STYLES.Open;

  const registerButton =
    event.eventStatus === "Confirmed" && event.registrationLink
      ? renderButton(
        "Open for Registration",
        event.registrationLink,
        'data-f="registration-link"',
        registrationStyle.bg
      )
      : "";

  // ROW 1: date | title + committee tags | status (+ register button)
  const headerRow = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#ffffff;border-top:1px solid #d4dde8;">
          <tr>
            ${renderDateCell(day, monthYear, {
    className: "event-date-cell",
    width: 110,
    daySize: 20,
    padding: "14px 8px",
    dataFields: true,
  })}

            <td class="event-title-cell" valign="middle" style="padding:14px 18px;">
              <span data-f="title" style="font-family:${FONT};font-size:16px;font-weight:700;color:#281e7e;line-height:1.4;">${esc(event.title || "Untitled Event")}</span>
              ${tags
      ? `<div data-f="committees" style="margin-top:14px;padding-top:12px;border-top:1px solid #e2e8f0;">${tags}</div>`
      : ""
    }
            </td>

            <td class="event-status-cell" width="150" valign="middle" align="right" style="padding:14px 18px 14px 8px;">
              ${renderBadge(statusStyle, "event-status", event.eventStatus, "right")}
              ${registerButton
      ? `<div style="height:10px;line-height:10px;font-size:0;">&nbsp;</div>${registerButton}`
      : ""
    }
            </td>
          </tr>
        </table>`;

  // ROW 2: details | programme (+ documents)
  const detailsRow = renderColumnsRow([
    {
      label: "Event Details",
      body: event.details?.trim() || "&nbsp;",
      field: "event-details",
      padding: "20px 22px",
    },
    {
      label: "Programme Synopsis",
      body: `${event.programme?.trim() || "&nbsp;"}${renderDocuments(event.documents ?? [])}`,
      field: "programme",
      padding: "20px 22px",
    },
  ]);

  // ROW 3: dress code | registration deadline (either may be missing)
  const extraRow = renderColumnsRow([
    ...(dressCode ? [{ label: "Dress Code", body: esc(dressCode) }] : []),
    ...(deadline ? [{ label: "Registration Deadline", body: esc(deadline) }] : []),
  ]);

  // ROW 4: sponsors | speakers
  const peopleRow = renderColumnsRow([
    {
      label: "Sponsors",
      body: hasContent(event.sponsors) ? event.sponsors : callFor("Sponsors"),
      field: "sponsors",
    },
    {
      label: "Speakers",
      body: hasContent(event.speakers) ? event.speakers : callFor("Speakers"),
      field: "speakers",
    },
  ]);

  // ROW 5: remarks
  const remarksRow = hasContent(event.remarks)
    ? renderColumnsRow([{ label: "Remarks", body: event.remarks, field: "remarks" }])
    : "";

  return `
    <!-- EVENT BLOCK -->
    <tr data-block="event" data-event-status="${esc(event.eventStatus)}" data-id="${esc(event.id)}">
      <td style="padding:0;border-bottom:8px solid ${PAGE_BG};">
        ${headerRow}
        ${detailsRow}
        ${extraRow}
        ${peopleRow}
        ${remarksRow}
      </td>
    </tr>
    <!-- END EVENT BLOCK -->`;
}

/* ------------------------------------------------------------------ */
/* Upcoming events list                                                */
/* ------------------------------------------------------------------ */

function renderUpcomingRow(item: UpcomingEvent) {
  const { day, monthYear } = getDateParts(item.date);
  const statusStyle = EVENT_STATUS_STYLES[item.eventStatus] ?? EVENT_STATUS_STYLES.Tentative;

  return `
            <tr data-id="${esc(item.id)}" data-event-status="${esc(item.eventStatus)}">
              <td style="padding:0;border-top:1px solid #e2e8f0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#ffffff;">
                  <tr>
                    ${renderDateCell(day, monthYear, {
    className: "upcoming-date-cell",
    width: 90,
    daySize: 18,
    padding: "12px 8px",
  })}
                    <td valign="middle" style="padding:12px 18px;">
                      <span style="font-family:${FONT};font-size:14px;font-weight:700;color:#281e7e;line-height:1.4;">${esc(item.title || "Untitled Event")}</span>
                    </td>
                    <td class="upcoming-status-cell" width="130" valign="middle" align="right" style="padding:12px 18px 12px 8px;">
                      ${renderBadge(statusStyle, "upcoming-status", item.eventStatus, "right")}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`;
}

/** Heading + list. Returns "" when there's nothing to show, so no empty heading. */
function renderUpcomingEvents(items: UpcomingEvent[]) {
  if (!items.length) return "";

  return `
        ${renderSectionBar("Upcoming Events", "center")}
        <!-- UPCOMING EVENT LIST -->
        <tr data-block="upcomingList">
          <td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
${items.map(renderUpcomingRow).join("\n")}
            </table>
          </td>
        </tr>
        <!-- END UPCOMING EVENT LIST -->`;
}

/* ------------------------------------------------------------------ */
/* Page shell                                                          */
/* ------------------------------------------------------------------ */

const EMAIL_STYLES = `
    body, table, td, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      display: block;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: ${PAGE_BG};
    }
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
    }

    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .header-img { width: 100% !important; height: auto !important; }
      .pad-sides { padding-left: 16px !important; padding-right: 16px !important; }

      /* Cells that stack vertically on mobile */
      .event-date-cell,
      .event-title-cell,
      .event-status-cell,
      .col-cell {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .event-date-cell { text-align: left !important; padding: 10px 12px !important; }
      .event-title-cell { padding: 14px 16px 10px 16px !important; }
      .event-status-cell { text-align: left !important; padding: 0 16px 14px 16px !important; }
      .col-cell { padding-left: 16px !important; padding-right: 16px !important; }
      .col-divider { border-left: 0 !important; border-top: 1px solid #e2e8f0 !important; }

      /* Upcoming list stays as a single row, just tighter */
      .upcoming-date-cell { width: 64px !important; padding: 10px 6px !important; }
      .upcoming-status-cell { width: auto !important; padding-right: 12px !important; }

      .register-table { width: 100% !important; }
      .register-link {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
      .footer-cell { padding: 20px 16px !important; }
    }`;

function buildEmailHtml({
  events,
  upcomingList,
  greeting,
  issueRange,
}: EmailData): string {
  const eventsHtml = sortByDate(events).map(renderEvent).join("\n");
  const upcomingHtml = renderUpcomingEvents(sortByDate(upcomingList));

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!--[if !mso]><!-->
  <meta name="x-apple-disable-message-reformatting">
  <!--<![endif]-->

  <title>SSA Upcoming Events</title>

  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->

  <style type="text/css">${EMAIL_STYLES}
  </style>
</head>

<body style="margin:0;padding:0;background-color:${PAGE_BG};font-family:${FONT};color:#000000;font-size:15px;line-height:1.6;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:${PAGE_BG};">
  <tr>
    <td align="center" style="padding:32px 20px;">

      <!--[if mso]>
      <table width="680" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
        <tr>
          <td width="680">
      <![endif]-->

      <table class="email-container" width="680" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="width:100%;max-width:680px;background:#ffffff;border:1px solid #d4dde8;">

        <!-- BANNER -->
        <tr>
          <td style="padding:0;font-size:0;line-height:0;">
            <img class="header-img" src="${BANNER_URL}" width="680" alt="SSA Upcoming Events" style="display:block;width:100%;max-width:680px;height:auto;border:0;">
          </td>
        </tr>

        <!-- ISSUE RANGE -->
        ${renderSectionBar(issueRange)}

        <!-- GREETING -->
        <tr>
          <td class="pad-sides" style="background:#ffffff;padding:20px 24px;border-bottom:1px solid #d4dde8;">
            <div data-f="greeting" style="font-family:${FONT};font-size:10pt;color:#1f3b7a;line-height:1.6;">
              ${renderGreeting(greeting)}
            </div>
          </td>
        </tr>

${eventsHtml}
${upcomingHtml}

        <!-- FOOTER -->
        <tr>
          <td class="footer-cell" bgcolor="${NAVY}" style="background-color:${NAVY};padding:24px 28px;">
            <p style="margin:0;font-family:${FONT}Sfont-size:12px;color:#ffffff;line-height:1.7;text-align:center">
              You are receiving this Event Calendar because you are a Tier 1-4 member of an SSA Committee. This Calendar is circulated to keep committee members informed of all events hosted by or organised by SSA Committees. Members who wish to discontinue receiving the newsletter, please email <strong>"unsubscribe"</strong> to <a href="mailto:${CONTACT_EMAIL}" style="color:#81bce9;text-decoration:none;">${CONTACT_EMAIL}</a>.
            </p>
          </td>
        </tr>

      </table>

      <!--[if mso]>
          </td>
        </tr>
      </table>
      <![endif]-->

    </td>
  </tr>
</table>

</body>
</html>`;
}

/* ================================================================== */
/* COMPONENT                                                          */
/* ================================================================== */

// Re-exported so existing `import { EventItem } from "./EventsHome"` lines keep working.

type Tab = "events" | "Others" | "preview" | "history";

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

function TabButton({
  active,
  onClick,
  className = "",
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 ${active
          ? "border-indigo-700 text-indigo-700"
          : "border-transparent text-gray-500 hover:text-gray-700"
        } ${className}`}
    >
      {children}
    </button>
  );
}

function SaveIndicator({ status }: { status: string }) {
  if (status === "saving") {
    return (
      <>
        <Loader2 size={13} className="animate-spin" /> Saving…
      </>
    );
  }
  if (status.startsWith("Saved at")) {
    return (
      <>
        <Save size={13} /> {status}
      </>
    );
  }
  if (status === "error") return <span className="text-red-600">Save failed</span>;
  return null;
}

/** Renders the email in an iframe and grows it to fit the content. */
function EmailPreview({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);

  const fitHeight = () => {
    const frame = ref.current;
    const doc = frame?.contentDocument;
    if (frame && doc?.documentElement) {
      frame.style.height = `${doc.documentElement.scrollHeight}px`;
    }
  };

  return (
    <iframe
      ref={ref}
      title="SSA Upcoming Events Preview"
      srcDoc={html}
      onLoad={fitHeight}
      style={{ width: 680, minWidth: 680, height: 1100 }}
      className="block mx-auto bg-white border-0"
    />
  );
}

function EventRow({
  event,
  onStatusChange,
  onComplete,
  onOpen,
  onCopy,
  onDelete,
}: {
  event: EventItem;
  onStatusChange: (status: EventStatus) => void;
  onComplete: () => void;
  onOpen: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const badge = EVENT_STATUS_STYLES[event.eventStatus] ?? EVENT_STATUS_STYLES.Tentative;

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
      <span className="text-sm font-semibold text-gray-800">
        {event.title || "Untitled Event"}
      </span>

      <div className="flex items-center gap-2">
        <select
          value={event.eventStatus}
          onChange={(e) => onStatusChange(e.target.value as EventStatus)}
          className="px-2.5 py-1 text-xs font-semibold rounded border cursor-pointer"
          style={{
            backgroundColor: badge.bg,
            color: badge.color,
            borderColor: badge.border,
          }}
        >
          <option value="Tentative">Tentative</option>
          <option value="Confirmed">Confirmed</option>
        </select>

        <div className="relative group">
          <button
            type="button"
            onClick={onComplete}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
          >
            <CircleCheck size={16} />
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-100 z-50">
            Mark event as completed
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="p-1.5 text-gray-400 hover:text-indigo-700 hover:bg-gray-100 rounded"
          title="Open event"
        >
          <SquareArrowOutUpRight size={16} />
        </button>

        <button
          type="button"
          onClick={onCopy}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
          title="Copy event"
        >
          <Copy size={16} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
          title="Delete event"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function EventsHome() {
  // --- data ---
  const [events, setEvents] = useState<EventItem[]>([]);
  const [upcomingList, setUpcomingList] = useState<UpcomingEvent[]>([]);
  const [greeting, setGreeting] = useState(DEFAULT_GREETING);
  const [issueRange, setIssueRange] = useState(DEFAULT_ISSUE_RANGE);

  // --- load / save status ---
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  // --- ui ---
  const [tab, setTab] = useState<Tab>("events");
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedArchivedEvent, setSelectedArchivedEvent] = useState<EventItem | null>(null);
  // null = builder, "list" = issue archive, number = a specific archived issue
  const [recordsView, setRecordsView] = useState<"list" | number | null>(null);
  const { confirmDelete, deleteModal } = useConfirmDelete();

  const sortedEvents = useMemo(() => sortByDate(events), [events]);

  const emailHtml = useMemo(
    () => buildEmailHtml({ events, upcomingList, greeting, issueRange }),
    [events, upcomingList, greeting, issueRange]
  );

  /* ---------------- load ---------------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/load-digest?key=${EVENTS_BUILDER_KEY}`);

        // 404 = nothing saved yet, which is fine. Anything else is a real failure.
        if (!res.ok && res.status !== 404) {
          throw new Error(`Load failed with status ${res.status}`);
        }

        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;

          if (Array.isArray(data?.events)) setEvents(data.events.map(normaliseEvent));
          setUpcomingList(normaliseUpcomingList(data?.upcomingList));
          if (typeof data?.greeting === "string") setGreeting(data.greeting);
          if (typeof data?.issueRange === "string") setIssueRange(data.issueRange);
        }

        if (!cancelled) setLoaded(true);
      } catch (e) {
        console.error("Failed to load events builder:", e);
        // Leave `loaded` false so autosave can't overwrite the saved data with blanks.
        if (!cancelled) setLoadFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- autosave (Home owns saving; the editor only edits state) ---------------- */
  useEffect(() => {
    if (!loaded) return;

    setSaveStatus("saving");

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/save-digest?key=${EVENTS_BUILDER_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events,
            upcomingList,
            greeting,
            issueRange,
            builtHtml: emailHtml,
          }),
        });
        setSaveStatus(res.ok ? `Saved at ${getTimeLabel()}` : "error");
      } catch (e) {
        console.error("Failed to save events builder:", e);
        setSaveStatus("error");
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [loaded, events, upcomingList, greeting, issueRange, emailHtml]);

  /* ---------------- event actions ---------------- */
  const addEvent = (title: string) =>
    setEvents((prev) => [...prev, normaliseEvent({ title })]);

  const updateEventStatus = (id: string, eventStatus: EventStatus) =>
    setEvents((prev) =>
      prev.map((item) => (item.id === id ? { ...item, eventStatus } : item))
    );

  const duplicateEvent = (event: EventItem) =>
    setEvents((prev) => {
      const copy = normaliseEvent({ ...event, id: uid() });
      const index = prev.findIndex((item) => item.id === event.id);
      if (index === -1) return [...prev, copy];
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });

  const deleteEvent = (event: EventItem) =>
    confirmDelete({
      itemType: "event",
      itemName: event.title,
      action: () => setEvents((prev) => prev.filter((item) => item.id !== event.id)),
    });

  /** Archive an event: save it to history, then remove it from the current list. */
  const completeEvent = async (event: EventItem) => {
    try {
      const res = await fetch("/api/events-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          builderKey: EVENTS_BUILDER_KEY,
          event: { ...event, completionStatus: "Completed" },
        }),
      });

      if (!res.ok) {
        console.error("Failed to archive event:", res.status, await res.text());
        return;
      }

      setEvents((prev) => prev.filter((item) => item.id !== event.id));
    } catch (e) {
      console.error("Failed to archive event:", e);
    }
  };

  /** Copy an archived event back into the current list (keeps the archive entry). */
  const copyToCurrent = (eventData: unknown) => {
    setEvents((prev) => [
      ...prev,
      normaliseEvent({ ...(eventData as object), id: uid(), completionStatus: "InProgress" }),
    ]);
    setTab("events");
  };

  /** Move an archived event back into the current list (removes the archive entry). */
  const restoreEvent = async (archiveId: number, eventData: unknown) => {
    try {
      const res = await fetch(`/api/events-history?id=${archiveId}`, { method: "DELETE" });

      if (!res.ok) {
        console.error("Failed to restore event:", res.status);
        return;
      }

      setEvents((prev) => [
        ...prev,
        normaliseEvent({ ...(eventData as object), completionStatus: "InProgress" }),
      ]);
      setTab("events");
    } catch (e) {
      console.error("Failed to restore event:", e);
    }
  };

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(emailHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error("Failed to copy HTML:", e);
      setCopied(false);
    }
  };

  /* ---------------- full-screen sub-views ---------------- */
  if (selectedArchivedEvent) {
    return (
      <EventsEditor
        archivedEvent={selectedArchivedEvent}
        events={events}
        setEvents={setEvents}
        onBack={() => setSelectedArchivedEvent(null)}
        saveStatus={saveStatus}
        readOnly
      />
    );
  }

  if (selectedEventId) {
    return (
      <EventsEditor
        eventId={selectedEventId}
        events={events}
        setEvents={setEvents}
        onBack={() => setSelectedEventId(null)}
        saveStatus={saveStatus}
      />
    );
  }

  /* ---------------- main view ---------------- */
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
            alt="SSA Logo"
            className="h-8 w-auto"
          />
          <h1 className="text-xl font-bold text-indigo-900">Upcoming Events</h1>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
            <SaveIndicator status={saveStatus} />
          </div>
        </div>

        {loadFailed && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Couldn&apos;t load your saved events, so autosave is paused to avoid overwriting
            them. Refresh the page to try again.
          </div>
        )}

        {recordsView === "list" ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <RecordsPanel
              builderKey={EVENTS_BUILDER_KEY}
              onSelect={(id) => setRecordsView(id)}
            />
            <button
              type="button"
              onClick={() => setRecordsView(null)}
              className="mt-3 text-sm text-gray-500 hover:text-indigo-700"
            >
              ← Back to builder
            </button>
          </div>
        ) : typeof recordsView === "number" ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <RecordViewer recordId={recordsView} onBack={() => setRecordsView(null)} />
          </div>
        ) : (
          <>
            {/* TABS */}
            <div className="flex gap-1 mb-5 border-b border-gray-200">
              <TabButton active={tab === "events"} onClick={() => setTab("events")}>
                Events
              </TabButton>

              <TabButton active={tab === "upcoming"} onClick={() => setTab("upcoming")}
              >
                Upcoming List
              </TabButton>

              <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
                <Eye size={15} /> Preview &amp; Export
              </TabButton>

              <button
                type="button"
                onClick={() => setRecordsView("list")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-700 px-2"
              >
                <Archive size={15} /> Issue Archive
              </button>
              <TabButton
                active={tab === "history"}
                onClick={() => setTab("history")}
                className="ml-auto"
              >
                <Archive size={15} /> Event History
              </TabButton>
            </div>

            {/* EVENTS TAB */}
            {tab === "events" && (
              <>
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
                  <Field label="Issue Range">
                    <input
                      className={inputCls}
                      value={issueRange}
                      onChange={(e) => setIssueRange(e.target.value)}
                    />
                  </Field>
                  <Field label="Header Greeting">
                    <textarea
                      className={inputCls}
                      rows={8}
                      value={greeting}
                      onChange={(e) => setGreeting(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="space-y-2">
                  {sortedEvents.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                      <p className="text-sm text-gray-500">No upcoming events yet.</p>
                    </div>
                  ) : (
                    sortedEvents.map((ev) => (
                      <EventRow
                        key={ev.id}
                        event={ev}
                        onStatusChange={(status) => updateEventStatus(ev.id, status)}
                        onComplete={() => completeEvent(ev)}
                        onOpen={() => setSelectedEventId(ev.id)}
                        onCopy={() => duplicateEvent(ev)}
                        onDelete={() => deleteEvent(ev)}
                      />
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsNameModalOpen(true)}
                  className="mt-3 flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900"
                >
                  <Plus size={16} /> Add Event
                </button>

                <NamePopUp
                  isOpen={isNameModalOpen}
                  onClose={() => setIsNameModalOpen(false)}
                  onAdd={addEvent}
                  heading="Create New Event"
                  fieldLabel="Event Name"
                  placeholder="e.g. SSA Maritime Digitalisation Forum"
                  buttonText="Create Event"
                />
              </>
            )}

            {tab === "Others" && (
              <UpcomingList
              upcomingList={upcomingList}
              setUpcoming={setUpcomingList}
              />
            )}

            {/* PREVIEW TAB */}
            {tab === "preview" && (
              <div className="space-y-4">
                <div>
                  <button
                    type="button"
                    onClick={copyHtml}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-800 text-white text-sm rounded font-medium hover:bg-indigo-900"
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    {copied ? "Copied!" : "Copy HTML"}
                  </button>
                  <p className="mt-1 text-xs text-gray-500">Live Preview</p>
                </div>

                <div className="bg-gray-200 border border-gray-300 rounded-lg p-4 overflow-auto">
                  <EmailPreview html={emailHtml} />
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {tab === "history" && (
              <EventsHistory
                builderKey={EVENTS_BUILDER_KEY}
                viewPastEventDetails={setSelectedArchivedEvent}
                onCopyToCurrent={copyToCurrent}
                onRestoreEvent={restoreEvent}
              />
            )}

            {deleteModal}
          </>
        )}
      </div>
    </div>
  );
}