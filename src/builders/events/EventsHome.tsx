import { useEffect, useState } from "react";
import {
  Trash2,
  Plus,
  Loader2,
  Save,
  Eye,
  Code2,
  Copy,
  Check,
  RotateCcw,
  Archive,
  CalendarDays,
  Pin,
} from "lucide-react";
import Field from "../../shared/field";
import RichTextEditor from "../../shared/richTextEditor";
import RecordsPanel from "../../shared/recordsPanel";
import RecordViewer from "../../shared/recordViewer";
import useConfirmDelete from "../../shared/useConfirmDelete";
import { uid, esc, inputCls } from "../../shared/utils";

interface SpeakerItem {
  id: string;
  name: string;
  designation: string;
  company: string;
}

interface EventItem {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD" when dateMode is "exact", "YYYY-MM" when "month"
  dateMode: "exact" | "month";
  eventStatus: "Tentative" | "Confirmed";
  registrationStatus:
    | "Open"
    | "LimitedSlots"
    | "Waitlist"
    | "ClosingSoon"
    | "Full";
  registrationLink: string;
  committees: string[];
  details: string;
  programme: string;
  speakers: SpeakerItem[];
  customOrder: boolean;
}

type TagStyle = {
  text: string;
  bg: string;
  color: string;
  border: string;
};

/* =====================================================
   DESIGN TOKENS — matched to the SSA email template
====================================================== */

const FONT_STACK =
  "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

const COLOR_DATE_BG = "#220550";
const COLOR_TITLE = "#281e7e";
const COLOR_ISSUE_BAR_BG = "#262261";
const COLOR_FOOTER_BG = "#281e7e";
const COLOR_GREETING_TEXT = "#1f3b7a";
const COLOR_BORDER = "#d4dde8";
const COLOR_ROW_BORDER = "#e2e8f0";
const COLOR_LABEL = "#8492a6";
const COLOR_BODY = "#374151";
const COLOR_PAGE_BG = "#f0f4f8";
const COLOR_DETAILS_BG = "#fafbfd";
const COLOR_ACTIONS_BG = "#f7f9fc";

const BANNER_URL =
  "https://raw.githubusercontent.com/Webster2316/SSA_Training_Bulletin/refs/heads/main/Banner4.png";

const eventStatusOptions: Record<string, TagStyle> = {
  Confirmed: {
    text: "Confirmed",
    bg: "#f2dc9d",
    color: "#bf9708",
    border: "#bf9708",
  },
  Tentative: {
    text: "Tentative",
    bg: "#f2bbbf",
    color: "#700710",
    border: "#700710",
  },
};

const registrationStatusOpt: Record<string, TagStyle> = {
  Open: {
    text: "Open",
    bg: "#e7f5e9",
    color: "#287333",
    border: "#76b77c",
  },
  LimitedSlots: {
    text: "Limited Seats",
    bg: "#fff5d8",
    color: "#8a6c00",
    border: "#d7b441",
  },
  ClosingSoon: {
    text: "Closing Soon",
    bg: "#fff0e7",
    color: "#9a4a16",
    border: "#efba98",
  },
  Waitlist: {
    text: "Waitlist",
    bg: "#f2eef8",
    color: "#5c3b7e",
    border: "#cfc0df",
  },
  Full: {
    text: "Full",
    bg: "#f3f0f5",
    color: "#5a5f6d",
    border: "#c7ccd6",
  },
};

const committeeOptions: Record<string, TagStyle> = {
  DEC: {
    text: "Decarbonisation",
    bg: "#d8f3dc",
    color: "#1d7d26",
    border: "#1d7d26",
  },
  DIG: {
    text: "Digitalisation",
    bg: "#dbe3f7",
    color: "#103687",
    border: "#103687",
  },
  INT: {
    text: "International",
    bg: "#f7ecc9",
    color: "#8a6c00",
    border: "#bf9708",
  },
  TEC: {
    text: "Technical",
    bg: "#f2d9d9",
    color: "#6d0808",
    border: "#871010",
  },
  LEG: {
    text: "Legal and Insurance",
    bg: "#e6d9ea",
    color: "#510763",
    border: "#510763",
  },
  SVC: {
    text: "Services",
    bg: "#f2f4cf",
    color: "#64660e",
    border: "#717312",
  },
  MFC: {
    text: "Marine Fuels",
    bg: "#b5e2d4",
    color: "#238266",
    border: "#238266",
  },
  YEG: {
    text: "YEG",
    bg: "#f2dcec",
    color: "#7a0b57",
    border: "#7a0b57",
  },
};

function getDateTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function makeEvent(overrides: Partial<EventItem> = {}): EventItem {
  return Object.assign(
    {
      id: uid(),
      title: "",
      date: "",
      dateMode: "month" as const,
      eventStatus: "Tentative" as const,
      registrationStatus: "Open" as const,
      registrationLink: "",
      committees: [] as string[],
      details: "",
      programme: "",
      speakers: [] as SpeakerItem[],
      customOrder: false,
    },
    overrides
  );
}

function normaliseEvent(ev: any): EventItem {
  const allowedRegistrationStatuses: EventItem["registrationStatus"][] = [
    "Open",
    "LimitedSlots",
    "Waitlist",
    "ClosingSoon",
    "Full",
  ];

  const registrationStatus =
    ev?.registrationStatus === "Available"
      ? "Open"
      : allowedRegistrationStatuses.includes(ev?.registrationStatus)
      ? ev.registrationStatus
      : "Open";

  return {
    id: ev?.id ?? uid(),
    title: ev?.title ?? "",
    date: ev?.date ?? "",
    dateMode: ev?.dateMode === "exact" ? "exact" : "month",
    eventStatus: ev?.eventStatus === "Confirmed" ? "Confirmed" : "Tentative",
    registrationStatus,
    registrationLink: ev?.registrationLink ?? "",
    committees: Array.isArray(ev?.committees) ? ev.committees : [],
    details: ev?.details ?? "",
    programme: ev?.programme ?? "",
    speakers: Array.isArray(ev?.speakers) ? ev.speakers : [],
    customOrder: !!ev?.customOrder,
  };
}

/* =====================================================
   SORTING — pinned events keep their slot, everything
   else auto-sorts by date (mirrors Training Bulletin's
   course sorting/pin behaviour)
====================================================== */

function getSortableDate(event: EventItem) {
  if (!event.date) return null;
  return event.dateMode === "month" ? `${event.date}-01` : event.date;
}

function sortWithPinned(list: EventItem[]) {
  const sorted = [...list].sort((a, b) => {
    const da = getSortableDate(a);
    const db = getSortableDate(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.localeCompare(db);
  });

  const pinned = sorted.filter((e) => e.customOrder);
  const normal = sorted.filter((e) => !e.customOrder);

  return [...pinned, ...normal];
}

/* =====================================================
   BADGE RENDERING
====================================================== */

function renderEventStatusBadge(status: EventItem["eventStatus"]) {
  const style = eventStatusOptions[status];
  return `
    <span data-f="event-status" data-status="${esc(status)}" style="display:inline-block;padding:4px 9px;border-radius:3px;background:${style.bg};border:1px solid ${style.border};font-family:${FONT_STACK};font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${style.color};white-space:nowrap;">
      ${esc(style.text)}
    </span>
  `;
}

function renderRegistrationStatusBadge(status: EventItem["registrationStatus"]) {
  const style = registrationStatusOpt[status] ?? registrationStatusOpt.Open;
  return `
    <span data-f="registration-status" data-status="${esc(status)}" style="display:inline-block;padding:4px 9px;border-radius:3px;background:${style.bg};border:1px solid ${style.border};font-family:${FONT_STACK};font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${style.color};white-space:nowrap;">
      ${esc(style.text)}
    </span>
  `;
}

function renderCommitteeTags(codes: string[]) {
  if (!codes?.length) return "";

  return codes
    .map((code) => {
      const option = committeeOptions[code];
      if (!option) {
        return `<span style="display:inline-block;margin:0 4px 6px 0;padding:5px 9px;border-radius:3px;border:1px solid #d1d5db;font-family:${FONT_STACK};font-size:9px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#4b5563;">${esc(
          code
        )}</span>`;
      }

      return `<span style="display:inline-block;margin:0 4px 6px 0;padding:5px 9px;border-radius:3px;background:${option.bg};border:1px solid ${option.border};font-family:${FONT_STACK};font-size:9px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${option.color};">${esc(
        option.text
      )}</span>`;
    })
    .join("");
}

/* =====================================================
   DATE CELLS — confirmed events show an exact day number;
   tentative events show a smaller month/year, matching
   the reference template
====================================================== */

function getExactDateParts(dateStr: string) {
  if (!dateStr) return { day: "TBC", monthYear: "" };

  const [year, month, day] = dateStr.split("-");
  const monthNumber = Number(month);
  const monthText =
    monthNumber >= 1 && monthNumber <= 12
      ? new Date(2000, monthNumber - 1, 1)
          .toLocaleString("en-US", { month: "short" })
          .toUpperCase()
      : "";

  return {
    day: day ? String(Number(day)) : "TBC",
    monthYear: [monthText, year].filter(Boolean).join(" "),
  };
}

function getMonthYearParts(dateStr: string) {
  if (!dateStr) return { month: "TBC", year: "" };

  const [year, month] = dateStr.split("-");
  const monthNumber = Number(month);
  const monthText =
    monthNumber >= 1 && monthNumber <= 12
      ? new Date(2000, monthNumber - 1, 1)
          .toLocaleString("en-US", { month: "short" })
          .toUpperCase()
      : "TBC";

  return { month: monthText, year: year || "" };
}

function renderConfirmedDateCell(event: EventItem) {
  const { day, monthYear } = getExactDateParts(event.date);

  return `
    <td class="event-date-cell" width="110" valign="middle" align="center" style="background:${COLOR_DATE_BG};padding:14px 8px;text-align:center;">
      <span data-f="date-day" style="display:block;font-family:${FONT_STACK};font-size:20px;font-weight:700;color:#ffffff;line-height:1.15;">${esc(
        day
      )}</span>
      ${
        monthYear
          ? `<span data-f="date-month" style="display:block;margin-top:3px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#d9ecfb;">${esc(
              monthYear
            )}</span>`
          : ""
      }
    </td>
  `;
}

function renderTentativeDateCell(event: EventItem) {
  const { month, year } = getMonthYearParts(event.date);

  return `
    <td class="event-date-cell" width="110" valign="middle" align="center" style="background:${COLOR_DATE_BG};padding:14px 8px;text-align:center;">
      <span data-f="date-month" style="display:block;font-family:${FONT_STACK};font-size:14px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#ffffff;line-height:1.2;">${esc(
        month
      )}</span>
      ${
        year
          ? `<span data-f="date-year" style="display:block;margin-top:3px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:1.2px;color:#d9ecfb;">${esc(
              year
            )}</span>`
          : ""
      }
    </td>
  `;
}

function renderSpeakers(speakers: SpeakerItem[]) {
  if (!speakers?.length) return "&nbsp;";

  return speakers
    .map((speaker, index) => {
      const name = esc(speaker?.name ?? "");
      const designation = esc(speaker?.designation ?? "");
      const company = esc(speaker?.company ?? "");
      const meta = [designation, company].filter(Boolean).join("<br>");

      return `
        <p style="margin:0 0 ${index === speakers.length - 1 ? "0" : "12px"};">
          ${name ? `<strong>${name}</strong><br>` : ""}
          ${meta}
        </p>
      `;
    })
    .join("");
}

/* =====================================================
   EVENT BLOCKS
   Row 1 badge is always the EVENT status (Tentative /
   Confirmed) — registration status lives in the actions
   box for confirmed events, with a Full → "Email
   Secretariat" fallback, matching the reference template.
====================================================== */

function renderConfirmedEvent(event: EventItem) {
  const committees = renderCommitteeTags(event.committees ?? []);
  const speakersHtml = renderSpeakers(event.speakers ?? []);
  const detailsHtml = event.details?.trim() || "&nbsp;";
  const programmeHtml = event.programme?.trim() || "&nbsp;";
  const isFull = event.registrationStatus === "Full";

  const actionHtml = isFull
    ? `
      <p data-f="full-registration-note" style="margin:0 0 10px;font-family:${FONT_STACK};font-size:9px;color:#6b7280;line-height:1.45;text-align:center;">
        Registration is currently full.<br>Please contact the SSA Secretariat for enquiries.
      </p>
      <table class="register-table" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
        <tr>
          <td>
            <a class="register-link" data-f="registration-link" href="mailto:sarah@ssa.org.sg" style="display:inline-block;padding:8px 12px;background:#1b76bc;border-radius:3px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#ffffff;text-decoration:none;white-space:nowrap;mso-padding-alt:8px 12px;">Email Secretariat</a>
          </td>
        </tr>
      </table>
    `
    : `
      <table class="register-table" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
        <tr>
          <td>
            <a class="register-link" data-f="registration-link" href="${esc(
              event.registrationLink || "#"
            )}" target="_blank" style="display:inline-block;padding:8px 12px;background:#1b76bc;border-radius:3px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#ffffff;text-decoration:none;white-space:nowrap;mso-padding-alt:8px 12px;">Register Now</a>
          </td>
        </tr>
      </table>
    `;

  return `
    <tr data-block="event" data-event-status="Confirmed" data-id="${esc(event.id)}">
      <td style="padding:0;border-bottom:8px solid ${COLOR_PAGE_BG};">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#ffffff;border-top:1px solid ${COLOR_BORDER};">
          <tr>
            ${renderConfirmedDateCell(event)}

            <td class="event-title-cell" valign="middle" style="padding:14px 18px;">
              <span data-f="title" style="font-family:${FONT_STACK};font-size:16px;font-weight:700;color:${COLOR_TITLE};line-height:1.4;">
                ${esc(event.title || "Untitled Event")}
              </span>
            </td>

            <td class="event-status-cell" width="125" valign="middle" align="right" style="padding:14px 18px 14px 8px;">
              ${renderEventStatusBadge("Confirmed")}
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-top:1px solid ${COLOR_ROW_BORDER};">
          <tr>
            <td class="event-details-cell" valign="top" style="padding:20px 22px;background:${COLOR_DETAILS_BG};">
              <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${COLOR_LABEL};">Event Details</p>
              <div data-f="event-details" class="rich-text" style="font-family:${FONT_STACK};font-size:13px;color:${COLOR_BODY};line-height:1.65;">
                ${detailsHtml}
              </div>
            </td>

            <td class="event-actions-cell" width="160" valign="middle" align="center" style="padding:18px 14px;background:${COLOR_ACTIONS_BG};border-left:1px solid ${COLOR_ROW_BORDER};text-align:center;">
              ${
                committees
                  ? `<div data-f="committees" style="width:100%;text-align:center;margin-bottom:14px;">${committees}</div>`
                  : ""
              }
              <div style="margin-bottom:10px;">${renderRegistrationStatusBadge(
                event.registrationStatus
              )}</div>
              ${actionHtml}
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-top:1px solid ${COLOR_ROW_BORDER};">
          <tr>
            <td class="programme-cell" valign="top" style="padding:20px 22px;background:#ffffff;">
              <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:10pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${COLOR_LABEL};">Programme Topics</p>
              <div data-f="programme" class="rich-text" style="font-family:${FONT_STACK};font-size:10pt;color:${COLOR_BODY};line-height:1.65;">
                ${programmeHtml}
              </div>
            </td>

            <td class="speakers-cell" width="200" valign="top" style="padding:20px 22px;background:${COLOR_DETAILS_BG};border-left:1px solid ${COLOR_ROW_BORDER};">
              <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:10pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${COLOR_LABEL};">Speakers</p>
              <div data-f="speakers" style="font-family:${FONT_STACK};font-size:10pt;color:${COLOR_BODY};line-height:1.6;">
                ${speakersHtml}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderTentativeEvent(event: EventItem) {
  const committees = renderCommitteeTags(event.committees ?? []);

  return `
    <tr data-block="event" data-event-status="Tentative" data-id="${esc(event.id)}">
      <td style="padding:0;border-bottom:8px solid ${COLOR_PAGE_BG};">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#ffffff;border-top:1px solid ${COLOR_BORDER};">
          <tr>
            ${renderTentativeDateCell(event)}

            <td class="event-title-cell" valign="middle" style="padding:14px 18px;">
              <span data-f="title" style="display:block;font-family:${FONT_STACK};font-size:16px;font-weight:700;color:${COLOR_TITLE};line-height:1.4;">
                ${esc(event.title || "Untitled Event")}
              </span>
              ${
                committees
                  ? `<div data-f="committees" style="margin-top:8px;">${committees}</div>`
                  : ""
              }
            </td>

            <td class="event-status-cell" width="125" valign="middle" align="right" style="padding:14px 18px 14px 8px;">
              ${renderEventStatusBadge("Tentative")}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

export default function EventsHome() {
  const [tab, setTab] = useState<"events" | "preview">("events");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [issueRange, setIssueRange] = useState("Monthly Issue: September 2026");
  const [greeting, setGreeting] = useState(
    "Dear Members,\n\nWe are pleased to invite you to our upcoming and future planned events."
  );
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [copied, setCopied] = useState(false);
  const [rawHtmlEdit, setRawHtmlEdit] = useState<string | null>(null);
  const [viewingRecordId, setViewingRecordId] = useState<number | null>(null);
  const [collapsedItem, setCollapsedItem] = useState<Record<string, boolean>>({});
  const { confirmDelete, deleteModal } = useConfirmDelete();

  // LOAD
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/load-digest?key=events-builder-data");

        if (res.ok) {
          const data = await res.json();

          if (data?.events) {
            setEvents(data.events.map(normaliseEvent));
          }

          if (typeof data?.greeting === "string") {
            setGreeting(data.greeting);
          }

          if (typeof data?.issueRange === "string") {
            setIssueRange(data.issueRange);
          }

          if (data?.collapsedItem) {
            setCollapsedItem(data.collapsedItem);
          }

          if (typeof data?.rawHtmlEdit === "string") {
            setRawHtmlEdit(data.rawHtmlEdit);
          }
        }
      } catch (e) {
        console.error("Failed to load events builder:", e);
      }

      setLoaded(true);
    })();
  }, []);

  // AUTOSAVE
  useEffect(() => {
    if (!loaded) return;

    setSaveStatus("saving");

    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/save-digest?key=events-builder-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            events,
            greeting,
            issueRange,
            collapsedItem,
            rawHtmlEdit,
            builtHtml: html,
          }),
        });

        if (res.ok) {
          setSaveStatus(`Saved at ${getDateTime()}`);
        } else {
          setSaveStatus("error");
        }
      } catch (e) {
        console.error("Failed to save events builder:", e);
        setSaveStatus("error");
      }
    }, 700);

    return () => clearTimeout(t);
  }, [events, greeting, issueRange, collapsedItem, rawHtmlEdit, loaded]);

  const toggleCollapsed = (id: string) => {
    setCollapsedItem((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateEvent = (id: string, patch: Partial<EventItem>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const toggleCommittee = (id: string, code: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const has = e.committees.includes(code);
        return {
          ...e,
          committees: has
            ? e.committees.filter((c) => c !== code)
            : [...e.committees, code],
        };
      })
    );
  };

  const addSpeaker = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              speakers: [
                ...(e.speakers || []),
                { id: uid(), name: "", designation: "", company: "" },
              ],
            }
          : e
      )
    );
  };

  const updateSpeaker = (eventId: string, speakerId: string, patch: Partial<SpeakerItem>) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              speakers: (e.speakers || []).map((s) =>
                s.id === speakerId ? { ...s, ...patch } : s
              ),
            }
          : e
      )
    );
  };

  const removeSpeaker = (eventId: string, speakerId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, speakers: (e.speakers || []).filter((s) => s.id !== speakerId) }
          : e
      )
    );
  };

  const sortedEvents = sortWithPinned(events);

  const buildFullHtml = () => {
    const eventsHtml = sortedEvents
      .map((event) =>
        event.eventStatus === "Tentative"
          ? renderTentativeEvent(event)
          : renderConfirmedEvent(event)
      )
      .join("");

    const safeGreeting = esc(greeting).replace(/\n/g, "<br>");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>SSA Upcoming Events</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; display:block; outline:none; text-decoration:none; }
    body { margin:0 !important; padding:0 !important; background-color:${COLOR_PAGE_BG}; }
    .rich-text p { margin:0 0 8px 0; }
    .rich-text ul, .rich-text ol { margin:8px 0; padding-left:18px; }
    .rich-text li { margin-bottom:5px; }

    @media only screen and (max-width: 620px) {
      .email-container { width:100% !important; max-width:100% !important; }
      .header-img { width:100% !important; height:auto !important; }
      .pad-sides { padding-left:16px !important; padding-right:16px !important; }
      .event-date-cell, .event-title-cell, .event-status-cell,
      .event-details-cell, .event-actions-cell,
      .programme-cell, .speakers-cell {
        display:block !important; width:100% !important; box-sizing:border-box !important;
      }
      .event-date-cell { text-align:left !important; padding:10px 12px !important; }
      .event-title-cell { padding:14px 16px 10px 16px !important; }
      .event-status-cell { text-align:left !important; padding:0 16px 14px 16px !important; }
      .event-details-cell { padding:18px 16px !important; }
      .event-actions-cell { padding:0 16px 18px 16px !important; border-left:0 !important; border-top:1px solid ${COLOR_ROW_BORDER} !important; }
      .programme-cell { padding:18px 16px !important; }
      .speakers-cell { padding:18px 16px !important; border-left:0 !important; border-top:1px solid ${COLOR_ROW_BORDER} !important; }
      .register-table { width:100% !important; }
      .register-link { display:block !important; width:100% !important; box-sizing:border-box !important; text-align:center !important; }
      .footer-cell { padding:20px 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${COLOR_PAGE_BG};font-family:${FONT_STACK};color:#000000;font-size:15px;line-height:1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:${COLOR_PAGE_BG};">
    <tr>
      <td align="center" style="padding:32px 20px;">

        <table class="email-container" width="680" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="width:100%;max-width:680px;background:#ffffff;border:1px solid ${COLOR_BORDER};">

          <!-- BANNER -->
          <tr>
            <td style="padding:0;font-size:0;line-height:0;">
              <img class="header-img" src="${BANNER_URL}" width="680" alt="SSA Upcoming Events" style="display:block;width:100%;max-width:680px;height:auto;border:0;">
            </td>
          </tr>

          <!-- ISSUE BAR -->
          <tr>
            <td style="background:${COLOR_ISSUE_BAR_BG};padding:14px 24px;">
              <span style="font-family:${FONT_STACK};font-size:14pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;">
                ${esc(issueRange)}
              </span>
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td class="pad-sides" style="background:#ffffff;padding:20px 24px;border-bottom:1px solid ${COLOR_BORDER};">
              <div style="font-family:${FONT_STACK};font-size:10pt;color:${COLOR_GREETING_TEXT};line-height:1.6;">
                ${safeGreeting}
              </div>
            </td>
          </tr>

          <!-- EVENTS -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            ${
              eventsHtml ||
              `<tr><td style="padding:28px 24px;text-align:center;font-family:${FONT_STACK};font-size:13px;color:${COLOR_LABEL};">No upcoming events.</td></tr>`
            }
          </table>

          <!-- FOOTER -->
          <tr>
            <td class="footer-cell" style="background:${COLOR_FOOTER_BG};padding:24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td align="center">
                    <p style="margin:0;font-family:${FONT_STACK};font-size:12px;color:#ffffff;line-height:1.7;">
                      Singapore Shipping Association
                      <br>
                      For enquiries, please contact sarah@ssa.org.sg
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generatedHtml = buildFullHtml();
  const isEdited = rawHtmlEdit !== null;
  const html = isEdited ? rawHtmlEdit : generatedHtml;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      setCopied(false);
    }
  };

  const tabBtn = (key: "events" | "preview", label: string, Icon: any) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 ${
        tab === key
          ? "border-indigo-700 text-indigo-800"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <img
              src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
              alt="SSA Logo"
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-bold text-indigo-900">Upcoming Events</h1>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {saveStatus === "saving" && (
              <>
                <Loader2 size={13} className="animate-spin" /> Saving…
              </>
            )}
            {saveStatus.startsWith("Saved at") && (
              <>
                <Save size={13} />
                {saveStatus}
              </>
            )}
            {saveStatus === "error" && (
              <span className="text-red-600">Save failed</span>
            )}
          </div>
        </div>

        {/* ISSUE RANGE + GREETING */}
        <div className="bg-white rounded-lg border border-gray-200 mb-3 p-3 space-y-4">
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
              rows={3}
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
            />
          </Field>
        </div>

        {viewingRecordId === null ? (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 bg-white rounded-t-lg px-2">
              <div className="flex">
                {tabBtn("events", "Events", CalendarDays)}
                {tabBtn("preview", "Preview & Export", Eye)}
              </div>
              <button
                onClick={() => setViewingRecordId(-1)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-700 px-2"
              >
                <Archive size={15} /> Issue Archive
              </button>
            </div>

            <div className="bg-white rounded-b-lg border border-t-0 border-gray-200 p-4">

              {/* EVENTS TAB */}
              {tab === "events" && (
                <div className="space-y-4">
                  {sortedEvents.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                      <p className="text-sm text-gray-500">No upcoming events yet.</p>
                    </div>
                  ) : (
                    sortedEvents.map((ev) => (
                      <div key={ev.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2 gap-2">
                          <span className="text-xs font-semibold text-indigo-700 truncate">
                            {ev.title.trim() || "Untitled Event"}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleCollapsed(ev.id)}
                              className="px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-500"
                            >
                              {collapsedItem[ev.id] ? "Expand" : "Collapse"}
                            </button>

                            <button
                              type="button"
                              onClick={() => updateEvent(ev.id, { customOrder: !ev.customOrder })}
                              className={`p-1 rounded hover:bg-gray-100 ${
                                ev.customOrder ? "text-indigo-700" : "text-gray-400"
                              }`}
                              title={
                                ev.customOrder
                                  ? "Locked in place — click to auto-sort by date"
                                  : "Auto-sorted — click to lock position"
                              }
                            >
                              <Pin size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                confirmDelete({
                                  itemType: "event",
                                  itemName: ev.title,
                                  action: () =>
                                    setEvents((prev) => prev.filter((e) => e.id !== ev.id)),
                                })
                              }
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete event"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {!collapsedItem[ev.id] && (
                          <>
                            <Field label="Title">
                              <input
                                className={inputCls}
                                value={ev.title}
                                onChange={(e) => updateEvent(ev.id, { title: e.target.value })}
                              />
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                              <Field label="Event Status">
                                <select
                                  className={inputCls}
                                  value={ev.eventStatus}
                                  onChange={(e) => {
                                    const val = e.target.value as EventItem["eventStatus"];
                                    updateEvent(ev.id, {
                                      eventStatus: val,
                                      dateMode: val === "Confirmed" ? "exact" : "month",
                                    });
                                  }}
                                >
                                  <option value="Tentative">Tentative</option>
                                  <option value="Confirmed">Confirmed</option>
                                </select>
                              </Field>

                              <Field label="Date Type">
                                <select
                                  className={inputCls}
                                  value={ev.dateMode}
                                  onChange={(e) =>
                                    updateEvent(ev.id, {
                                      dateMode: e.target.value as EventItem["dateMode"],
                                      date: "",
                                    })
                                  }
                                >
                                  <option value="month">Month &amp; Year</option>
                                  <option value="exact">Exact Date</option>
                                </select>
                              </Field>
                            </div>

                            <Field label={ev.dateMode === "exact" ? "Date" : "Month & Year"}>
                              <input
                                type={ev.dateMode === "exact" ? "date" : "month"}
                                className={inputCls}
                                value={ev.date}
                                onChange={(e) => updateEvent(ev.id, { date: e.target.value })}
                              />
                            </Field>

                            <Field label="Committees">
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(committeeOptions).map(([code, opt]) => {
                                  const active = ev.committees.includes(code);
                                  return (
                                    <button
                                      key={code}
                                      type="button"
                                      onClick={() => toggleCommittee(ev.id, code)}
                                      className={`px-2.5 py-1 text-xs font-semibold rounded border ${
                                        active
                                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                          : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                                      }`}
                                    >
                                      {opt.text}
                                    </button>
                                  );
                                })}
                              </div>
                            </Field>

                            {ev.eventStatus === "Confirmed" && (
                              <>
                                <Field label="Registration Status">
                                  <select
                                    className={inputCls}
                                    value={ev.registrationStatus}
                                    onChange={(e) =>
                                      updateEvent(ev.id, {
                                        registrationStatus: e.target
                                          .value as EventItem["registrationStatus"],
                                      })
                                    }
                                  >
                                    <option value="Open">Open</option>
                                    <option value="LimitedSlots">Limited Seats</option>
                                    <option value="ClosingSoon">Closing Soon</option>
                                    <option value="Waitlist">Waitlist</option>
                                    <option value="Full">Full</option>
                                  </select>
                                </Field>

                                {ev.registrationStatus !== "Full" && (
                                  <Field label="Registration Link">
                                    <input
                                      className={inputCls}
                                      value={ev.registrationLink}
                                      onChange={(e) =>
                                        updateEvent(ev.id, { registrationLink: e.target.value })
                                      }
                                    />
                                  </Field>
                                )}

                                <Field label="Event Details">
                                  <RichTextEditor
                                    value={ev.details}
                                    onChange={(htmlVal: string) =>
                                      updateEvent(ev.id, { details: htmlVal })
                                    }
                                  />
                                </Field>

                                <Field label="Programme Topics">
                                  <RichTextEditor
                                    value={ev.programme}
                                    onChange={(htmlVal: string) =>
                                      updateEvent(ev.id, { programme: htmlVal })
                                    }
                                  />
                                </Field>

                                <Field label="Speakers">
                                  <div className="space-y-2">
                                    {(ev.speakers || []).map((sp) => (
                                      <div key={sp.id} className="flex gap-2 items-center">
                                        <input
                                          className={inputCls}
                                          placeholder="Name"
                                          value={sp.name}
                                          onChange={(e) =>
                                            updateSpeaker(ev.id, sp.id, { name: e.target.value })
                                          }
                                        />
                                        <input
                                          className={inputCls}
                                          placeholder="Designation"
                                          value={sp.designation}
                                          onChange={(e) =>
                                            updateSpeaker(ev.id, sp.id, {
                                              designation: e.target.value,
                                            })
                                          }
                                        />
                                        <input
                                          className={inputCls}
                                          placeholder="Company"
                                          value={sp.company}
                                          onChange={(e) =>
                                            updateSpeaker(ev.id, sp.id, {
                                              company: e.target.value,
                                            })
                                          }
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeSpeaker(ev.id, sp.id)}
                                          className="p-1.5 text-red-500 hover:bg-red-50 rounded shrink-0"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </div>
                                    ))}

                                    <button
                                      type="button"
                                      onClick={() => addSpeaker(ev.id)}
                                      className="text-xs text-indigo-700 font-medium flex items-center gap-1"
                                    >
                                      <Plus size={13} /> Add Speaker
                                    </button>
                                  </div>
                                </Field>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  )}

                  <button
                    type="button"
                    onClick={() => setEvents([...events, makeEvent()])}
                    className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900"
                  >
                    <Plus size={16} /> Add Event
                  </button>
                </div>
              )}

              {/* PREVIEW + EXPORT TAB */}
              {tab === "preview" && (
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-800 text-white text-sm rounded font-medium hover:bg-indigo-900"
                    >
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                      {copied ? "Copied!" : "Copy HTML"}
                    </button>

                    {isEdited && (
                      <button
                        type="button"
                        onClick={() => setRawHtmlEdit(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded font-medium hover:bg-gray-50"
                      >
                        <RotateCcw size={15} /> Discard edits
                      </button>
                    )}
                  </div>

                  {isEdited && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-3">
                      Showing your manual edits. The Events tab won't reflect this — hand edits
                      are copy-only. Click <strong>Discard edits</strong> to go back to the
                      generated version.
                    </p>
                  )}

                  <p className="text-xs text-gray-500 mb-2">Live preview:</p>
                  <iframe
                    title="Upcoming Events Preview"
                    srcDoc={html}
                    className="w-full border border-gray-300 rounded"
                    style={{ height: "700px" }}
                  />

                  <p className="text-xs text-gray-500 mt-4 mb-2 flex items-center gap-1">
                    <Code2 size={13} /> Raw HTML (editable — changes here update the preview and
                    copy button above):
                  </p>
                  <textarea
                    className="w-full border border-gray-300 rounded p-2 text-xs font-mono"
                    style={{ height: "220px" }}
                    value={html}
                    onChange={(e) => setRawHtmlEdit(e.target.value)}
                    spellCheck={false}
                  />
                </div>
              )}
            </div>

            {deleteModal}
          </>
        ) : viewingRecordId === -1 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <RecordsPanel
              builderKey="events-builder-data"
              onSelect={(id: number) => setViewingRecordId(id)}
            />
            <button
              onClick={() => setViewingRecordId(null)}
              className="mt-3 text-sm text-gray-500 hover:text-indigo-700"
            >
              ← Back to builder
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <RecordViewer recordId={viewingRecordId} onBack={() => setViewingRecordId(null)} />
          </div>
        )}
      </div>
    </div>
  );
}