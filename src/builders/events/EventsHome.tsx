import { useEffect, useState } from "react";
import {
  Trash2,
  SquareArrowOutUpRight,
  Plus,
  Loader2,
  Save,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import useConfirmDelete from "../../shared/useConfirmDelete";
import Field from "../../shared/field";
import { uid, esc, inputCls } from "../../shared/utils";
import NamePopUp from "./NamePopUpModal";
import EventsEditor from "./EventsEditor";


export interface EventDocument {
  label: string;
  url: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  dateMode: "exact" | "month";
  registrationStatus:
    | "Open"
    | "LimitedSlots"
    | "Waitlist"
    | "ClosingSoon"
    | "Full";
  eventStatus: "Tentative" | "Confirmed";
  registrationLink: string;
  committees: string[];
  customCommitteeTags: string[];
  details: string;
  programme: string;
  speakers: string;
  documents: EventDocument[];
}

type TagStyle = {
  text: string;
  bg: string;
  color: string;
  border: string;
};

const FONT = "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

// Keep the builder's original colour system.
const eventStatusOptions: Record<EventItem["eventStatus"], TagStyle> = {
  Confirmed: {
    text: "Confirmed",
    bg: "#e1ffba",
    color: "#416e07",
    border: "#416e07",
  },
  Tentative: {
    text: "Tentative",
    bg: "#f2bbbf",
    color: "#700710",
    border: "#700710",
  },
};

const registrationStatusOpt: Record<
  EventItem["registrationStatus"],
  TagStyle
> = {
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
  DEC: { text: "Decarbonisation", bg: "#8ede96", color: "#1d7d26", border: "#1d7d26" },
  DIG: { text: "Digitalisation", bg: "#9eb2de", color: "#103687", border: "#103687" },
  INT: { text: "International", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708" },
  TEC: { text: "Technical", bg: "#c78585", color: "#871010", border: "#871010" },
  LEG: { text: "Legal and Insurance", bg: "#b48fbd", color: "#510763", border: "#510763" },
  SVC: { text: "Services", bg: "#e9eba4", color: "#717312", border: "#717312" },
  MFC: { text: "Marine Fuels", bg: "#91c4b5", color: "#238266", border: "#238266" },
  YEG: { text: "YEG", bg: "#d498c1", color: "#7a0b57", border: "#7a0b57" },
};

function getDateTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normaliseEvent(ev: any): EventItem {
  const allowedRegistrationStatuses: EventItem["registrationStatus"][] = [
    "Open",
    "LimitedSlots",
    "Waitlist",
    "ClosingSoon",
    "Full",
  ];

  const registrationStatus: EventItem["registrationStatus"] =
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
    registrationStatus,
    eventStatus: ev?.eventStatus === "Confirmed" ? "Confirmed" : "Tentative",
    registrationLink: ev?.registrationLink ?? "",
    committees: Array.isArray(ev?.committees) ? ev.committees : [],
    customCommitteeTags: Array.isArray(ev?.customCommitteeTags) ? ev.customCommitteeTags : [],
    details: ev?.details ?? "",
    programme: ev?.programme ?? "",
    speakers: typeof ev?.speakers === "string"
    ? ev.speakers
    : Array.isArray(ev?.speakers)
      ? ev.speakers
          .map(
            (s: any) =>
              `<p><strong>${esc(s.name ?? "")}</strong><br>${esc(
                s.designation ?? ""
              )}<br>${esc(s.company ?? "")}</p>`
          )
          .join("")
      : "",
    documents: Array.isArray(ev?.documents) ? ev.documents : [],
  };
}

function getDateParts(date: string) {
  if (!date) return { day: "TBC", monthYear: "" };

  const [year, month, day] = date.split("-");
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

function getMonthYearParts(date: string) {
  if (!date) return { month: "TBC", year: "" };

  const [year, month] = date.split("-");
  const monthNumber = Number(month);
  const monthText =
    monthNumber >= 1 && monthNumber <= 12
      ? new Date(2000, monthNumber - 1, 1)
          .toLocaleString("en-US", { month: "short" })
          .toUpperCase()
      : "TBC";

  return { month: monthText, year: year || "" };
}

function renderBadge(style: TagStyle, dataField: string, dataStatus: string) {
  return `<span data-f="${esc(dataField)}" data-status="${esc(dataStatus)}" style="display:inline-block;padding:4px 9px;border-radius:3px;background:${style.bg};border:1px solid ${style.border};font-family:${FONT};font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${style.color};white-space:nowrap;">${esc(style.text)}</span>`;
}

function renderCommitteeTags(codes: string[]) {
  if (!codes.length) return "";

  return codes
    .map((code) => {
      const option = committeeOptions[code];
      if (!option) return "";

      return `<span style="display:inline-block;margin:0 4px 4px 0;padding:5px 9px;border-radius:3px;background:${option.bg};border:1px solid ${option.border};font-family:${FONT};font-size:9px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${option.color};">${esc(option.text)}</span>`;
    })
    .join("");
}


function rendercustomCommitteeTags(tags: string[]) {

if (!tags.length) return "";

return tags.filter((tag) => tag.trim()).map((tag) => `<span style="
display:inline-block;
margin:0 4px 4px 0;
padding:5px 9px;
border-radius:3px;
background:#f5f5f5;
border:1px solid #383838;
font-family:${FONT};
font-size:9px;
font-weight:700;
letter-spacing:0.8px;
text-transform:uppercase;
color:#383838;
">${esc(tag.trim())}</span>`
)
.join("");
};

function renderDocuments(documents: EventDocument[]) {
  if (!documents.length) return "";

  const links = documents
    .map(
      (doc, index) => `<div style="margin:${index === 0 ? "0" : "6px"} 0 0;line-height:1.35;"><a href="${esc(doc.url)}" target="_blank" style="font-family:${FONT};font-size:9px;font-weight:700;color:#1b76bc;text-decoration:underline;">${esc(doc.label || "Document")}</a></div>`
    )
    .join("");

  return `<div data-f="documents" style="width:100%;border-top:1px solid #dde4ec;margin-top:14px;padding-top:12px;text-align:center;">${links}</div>`;
}

function renderSpeakers(speakers: SpeakerItem[]) {
  if (!speakers.length) return "&nbsp;";

  return speakers
    .map((speaker, index) => {
      const name = esc(speaker.name ?? "");
      const designation = esc(speaker.designation ?? "");
      const company = esc(speaker.company ?? "");
      const lines = [designation, company].filter(Boolean).join("<br>");

      return `<p style="margin:0 0 ${index === speakers.length - 1 ? "0" : "12px"};">${name ? `<strong>${name}</strong>${lines ? "<br>" : ""}` : ""}${lines}</p>`;
    })
    .join("");
}

function renderTentativeEvent(event: EventItem) {
  const { day, monthYear } = getDateParts(event.date);

  const committees =
    renderCommitteeTags(event.committees ?? []) +
    rendercustomCommitteeTags(event.customCommitteeTags ?? []);

  const status = eventStatusOptions.Tentative;

  return `
    <!-- =====================================================
         TENTATIVE EVENT BLOCK
    ====================================================== -->
    <tr
      data-block="event"
      data-event-status="Tentative"
      data-id="${esc(event.id)}"
    >
      <td style="padding:0;border-bottom:8px solid #f0f4f8;">

        <!-- ROW 1: DATE | TITLE + COMMITTEE | STATUS -->
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          role="presentation"
          style="background:#ffffff;border-top:1px solid #d4dde8;"
        >
          <tr>

            <td
              class="event-date-cell"
              width="110"
              valign="middle"
              align="center"
              style="background:#220550;padding:14px 8px;text-align:center;"
            >
              <span
                data-f="date-day"
                style="
                  display:block;
                  font-family:${FONT};
                  font-size:20px;
                  font-weight:700;
                  color:#ffffff;
                  line-height:1.15;
                "
              >
                ${esc(day)}
              </span>

              ${
                monthYear
                  ? `
                    <span
                      data-f="date-month"
                      style="
                        display:block;
                        margin-top:3px;
                        font-family:${FONT};
                        font-size:10px;
                        font-weight:700;
                        letter-spacing:1.5px;
                        text-transform:uppercase;
                        color:#d9ecfb;
                      "
                    >
                      ${esc(monthYear)}
                    </span>
                  `
                  : ""
              }
            </td>

            <td
              class="event-title-cell"
              valign="middle"
              style="padding:14px 18px;"
            >
              <span
                data-f="title"
                style="
                  font-family:${FONT};
                  font-size:16px;
                  font-weight:700;
                  color:#281e7e;
                  line-height:1.4;
                "
              >
                ${esc(event.title || "Untitled Event")}
              </span>

              ${
                committees
                  ? `
                    <div
                      data-f="committees"
                      style="margin-top:7px;"
                    >
                      ${committees}
                    </div>
                  `
                  : ""
              }
            </td>

            <td
              class="event-status-cell"
              width="125"
              valign="middle"
              align="right"
              style="padding:14px 18px 14px 8px;"
            >
              ${renderBadge(status, "event-status", "Tentative")}
            </td>

          </tr>
        </table>


        <!-- ROW 2: EVENT DETAILS | DRAFT PROGRAMME -->
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          role="presentation"
          style="border-top:1px solid #e2e8f0;"
        >
          <tr>

            <!-- EVENT DETAILS -->
            <td
              class="event-details-cell"
              width="50%"
              valign="top"
              style="
                padding:20px 22px;
                background:#fafbfd;
              "
            >
              <p
                style="
                  margin:0 0 10px;
                  font-family:${FONT};
                  font-size:10px;
                  font-weight:700;
                  letter-spacing:1.5px;
                  text-transform:uppercase;
                  color:#8492a6;
                "
              >
                Event Details
              </p>

              <div
                data-f="event-details"
                style="
                  font-family:${FONT};
                  font-size:13px;
                  color:#374151;
                  line-height:1.65;
                "
              >
                ${event.details?.trim() || "&nbsp;"}
              </div>
            </td>


            <!-- DRAFT PROGRAMME SYNOPSIS -->
            <td
              class="programme-cell"
              width="50%"
              valign="top"
              style="
                padding:20px 22px;
                background:#ffffff;
                border-left:1px solid #e2e8f0;
              "
            >
              <p
                style="
                  margin:0 0 10px;
                  font-family:${FONT};
                  font-size:10px;
                  font-weight:700;
                  letter-spacing:1.5px;
                  text-transform:uppercase;
                  color:#8492a6;
                "
              >
                Draft Programme Synopsis
              </p>

              <div
                data-f="programme"
                style="
                  font-family:${FONT};
                  font-size:13px;
                  color:#374151;
                  line-height:1.65;
                "
              >
                ${event.programme?.trim() || "&nbsp;"}
              </div>
            </td>

          </tr>
        </table>

      </td>
    </tr>

    <!-- =====================================================
         END TENTATIVE EVENT BLOCK
    ====================================================== -->
  `;
}

function renderConfirmedEvent(event: EventItem) {
  const { day, monthYear } = getDateParts(event.date);
  const committees = renderCommitteeTags(event.committees ?? []) + rendercustomCommitteeTags(event.customCommitteeTags ?? []);
  const speakersHtml = event.speakers?.trim() || "&nbsp;";
  const documents = renderDocuments(event.documents ?? []);
  const eventBadge = renderBadge(eventStatusOptions.Confirmed, "event-status", "Confirmed");
  const registrationBadge = renderBadge(
    registrationStatusOpt[event.registrationStatus] ?? registrationStatusOpt.Open,
    "registration-status",
    event.registrationStatus
  );

  const registerAction =
    event.registrationStatus === "Full"
      ? `<p style="margin:0 0 10px;font-family:${FONT};font-size:9px;color:#6b7280;line-height:1.45;text-align:center;">Registration is currently full.<br>Please contact the SSA Secretariat for enquiries.</p>
         <table class="register-table" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
           <tr><td>
             <a class="register-link" href="mailto:sarah@ssa.org.sg" style="display:inline-block;padding:8px 12px;background:#1b76bc;border-radius:3px;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#ffffff;text-decoration:none;white-space:nowrap;mso-padding-alt:8px 12px;">Email Secretariat</a>
           </td></tr>
         </table>`
      : event.registrationLink
        ? `<table class="register-table" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
             <tr><td>
               <a class="register-link" data-f="registration-link" href="${esc(event.registrationLink)}" target="_blank" style="display:inline-block;padding:8px 12px;background:#1b76bc;border-radius:3px;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#ffffff;text-decoration:none;white-space:nowrap;mso-padding-alt:8px 12px;">Register Now</a>
             </td></tr>
           </table>`
        : "";

  return `
        <!-- =====================================================
             CONFIRMED EVENT BLOCK
        ====================================================== -->
        <tr data-block="event" data-event-status="Confirmed" data-id="${esc(event.id)}">
          <td style="padding:0;border-bottom:8px solid #f0f4f8;">

            <!-- ROW 1: DATE | TITLE | EVENT STATUS -->
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              role="presentation"
              style="background:#ffffff;border-top:1px solid #d4dde8;"
            >
              <tr>
                <td
                  class="event-date-cell"
                  width="110"
                  valign="middle"
                  align="center"
                  style="background:#220550;padding:14px 8px;text-align:center;"
                >
                  <span data-f="date-day" style="display:block;font-family:${FONT};font-size:20px;font-weight:700;color:#ffffff;line-height:1.15;">${esc(day)}</span>
                  ${monthYear ? `<span data-f="date-month" style="display:block;margin-top:3px;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#d9ecfb;">${esc(monthYear)}</span>` : ""}
                </td>

                <td
                  class="event-title-cell"
                  valign="middle"
                  style="padding:14px 18px;"
                >
                  <span data-f="title" style="font-family:${FONT};font-size:16px;font-weight:700;color:#281e7e;line-height:1.4;">${esc(event.title || "Untitled Event")}</span>
                </td>

                <td
                  class="event-status-cell"
                  width="125"
                  valign="middle"
                  align="right"
                  style="padding:14px 18px 14px 8px;"
                >
                  ${eventBadge}
                </td>
              </tr>
            </table>

            <!-- ROW 2: EVENT DETAILS | COMMITTEE + REGISTRATION + DOCUMENTS -->
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              role="presentation"
              style="border-top:1px solid #e2e8f0;"
            >
              <tr>
                <td
                  class="event-details-cell"
                  valign="top"
                  style="padding:20px 22px;background:#fafbfd;"
                >
                  <p style="margin:0 0 10px;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8492a6;">Event Details</p>
                  <div data-f="event-details" style="font-family:${FONT};font-size:13px;color:#374151;line-height:1.65;">
                    ${event.details?.trim() || "&nbsp;"}
                  </div>
                </td>

                <td
                  class="event-actions-cell"
                  width="160"
                  valign="middle"
                  align="center"
                  style="padding:18px 14px;background:#f7f9fc;border-left:1px solid #e2e8f0;text-align:center;"
                >
                  ${committees ? `<div data-f="committees" style="width:100%;text-align:center;margin-bottom:14px;">${committees}</div><div style="width:100%;border-top:1px solid #dde4ec;margin-bottom:14px;font-size:1px;line-height:1px;">&nbsp;</div>` : ""}
                  <div style="margin-bottom:${registerAction ? "10px" : "0"};">${registrationBadge}</div>
                  ${registerAction}
                  ${documents}
                </td>
              </tr>
            </table>

            <!-- ROW 3: PROGRAMME TOPICS | SPEAKERS -->
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              role="presentation"
              style="border-top:1px solid #e2e8f0;"
            >
              <tr>
                <td
                  class="programme-cell"
                  valign="top"
                  style="padding:20px 22px;background:#ffffff;"
                >
                  <p style="margin:0 0 10px;font-family:${FONT};font-size:10pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8492a6;">Programme Topics</p>
                  <div data-f="programme" style="font-family:${FONT};font-size:10pt;color:#374151;line-height:1.65;">
                    ${event.programme?.trim() || "&nbsp;"}
                  </div>
                </td>

                <td
                  class="speakers-cell"
                  width="200"
                  valign="top"
                  style="padding:20px 22px;background:#fafbfd;border-left:1px solid #e2e8f0;"
                >
                  <p style="margin:0 0 10px;font-family:${FONT};font-size:10pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8492a6;">Speakers</p>
                  <div data-f="speakers" style="font-family:${FONT};font-size:10pt;color:#374151;line-height:1.6;">
                    ${speakersHtml}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- =====================================================
             END CONFIRMED EVENT BLOCK
        ====================================================== -->`;
}

function renderGreeting(text: string) {
  const safe = esc(text ?? "").trim();
  if (!safe) return "";

  return safe
    .split(/\n\s*\n/)
    .map(
      (paragraph, index, all) =>
        `<p style="margin:0 0 ${index === all.length - 1 ? "0" : "12px"};">${paragraph.replace(/\n/g, "<br>")}</p>`
    )
    .join("");
}

export default function EventsHome() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const { confirmDelete, deleteModal } = useConfirmDelete();
  const [issueRange, setIssueRange] = useState("Monthly Issue: September 2026");
  const [greeting, setGreeting] = useState(`Dear Members,

We are pleased to invite you to our upcoming and future planned events, designed to bring our members together and provide an opportunity to engage directly with our Chairs, Councillors and Committee Experts.

These in-person sessions will provide an overview of the work being undertaken across our committees, while creating opportunities for members to exchange insights, connect with fellow industry professionals and learn more about how to engage with our activities.

We encourage you to register your interest and join us at these upcoming sessions.

We look forward to bringing our members together and strengthening our collective engagement across the association.`);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [tab, setTab] = useState<"Events" | "preview">("Events");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/load-digest?key=events-builder-data");
        if (res.ok) {
          const data = await res.json();

          if (Array.isArray(data?.events)) {
            setEvents(data.events.map(normaliseEvent));
          }
          if (typeof data?.greeting === "string") {
            setGreeting(data.greeting);
          }
          if (typeof data?.issueRange === "string") {
            setIssueRange(data.issueRange);
          }
        }
      } catch (e) {
        console.error("Failed to load events builder:", e);
      }
      setLoaded(true);
    })();
  }, []);

  // Home is the single save owner. Editor only updates this events state.
  useEffect(() => {
    if (!loaded) return;

    setSaveStatus("saving");

    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/save-digest?key=events-builder-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events, greeting, issueRange }),
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
  }, [events, greeting, issueRange, loaded]);

  const handleAddEvents = (title: string) => {
    setEvents((prev) => [
      ...prev,
      {
        id: uid(),
        title,
        date: "",
        dateMode: "month",
        eventStatus: "Tentative",
        registrationStatus: "Open",
        registrationLink: "",
        committees: [],
        customCommitteeTags: [],
        details: "",
        programme: "",
        speakers: "",
        documents: [],
      },
    ]);
  };

  const sortedEvents = [...events].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;

    const aDate = a.dateMode === "month" ? `${a.date}-01` : a.date;
    const bDate = b.dateMode === "month" ? `${b.date}-01` : b.date;

    return aDate.localeCompare(bDate);
  });

  const buildFullHtml = () => {
    const eventHtml = sortedEvents
      .map((event) =>
        event.eventStatus === "Tentative"
          ? renderTentativeEvent(event)
          : renderConfirmedEvent(event)
      )
      .join("\n");

    // This shell intentionally keeps the original 680px email sizing and
    // Outlook conditional wrapper from the supplied reference HTML.
    return `<!DOCTYPE html>
<html lang="en">
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
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->

  <style type="text/css">
    body,
    table,
    td,
    a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table,
    td {
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
      background-color: #f0f4f8;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
    }

    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }

      .header-img {
        width: 100% !important;
        height: auto !important;
      }

      .pad-sides {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }

      .event-date-cell,
      .event-title-cell,
      .event-status-cell,
      .event-details-cell,
      .event-actions-cell,
      .programme-cell,
      .speakers-cell {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      .event-date-cell {
        text-align: left !important;
        padding: 10px 12px !important;
      }

      .event-title-cell {
        padding: 14px 16px 10px 16px !important;
      }

      .event-status-cell {
        text-align: left !important;
        padding: 0 16px 14px 16px !important;
      }

      .event-details-cell {
        padding: 18px 16px !important;
      }

      .event-actions-cell {
        padding: 0 16px 18px 16px !important;
        border-left: 0 !important;
        border-top: 1px solid #e2e8f0 !important;
      }

      .programme-cell {
        padding: 18px 16px !important;
      }

      .speakers-cell {
        padding: 18px 16px !important;
        border-left: 0 !important;
        border-top: 1px solid #e2e8f0 !important;
      }

      .register-table {
        width: 100% !important;
      }

      .register-link {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }

      .footer-cell {
        padding: 20px 16px !important;
      }
    }
  </style>
</head>

<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:${FONT};color:#000000;font-size:15px;line-height:1.6;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#f0f4f8;">
  <tr>
    <td align="center" style="padding-top:32px;padding-bottom:32px;padding-left:20px;padding-right:20px;">

      <!--[if mso]>
      <table width="680" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
        <tr>
          <td width="680">
      <![endif]-->

      <table
        class="email-container"
        width="680"
        cellpadding="0"
        cellspacing="0"
        border="0"
        role="presentation"
        align="center"
        style="width:100%;max-width:680px;background:#ffffff;border:1px solid #d4dde8;"
      >

        <!-- BANNER -->
        <tr>
          <td style="padding:0;font-size:0;line-height:0;">
            <img
              class="header-img"
              src="https://raw.githubusercontent.com/Webster2316/SSA_Training_Bulletin/refs/heads/main/Banner4.png"
              width="680"
              alt="SSA Upcoming Events"
              style="display:block;width:100%;max-width:680px;height:auto;border:0;"
            >
          </td>
        </tr>

        <!-- SECTION TITLE -->
        <tr>
          <td style="background:#262261;padding:14px 24px;">
            <span style="font-family:${FONT};font-size:12pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;">${esc(issueRange)}</span>
          </td>
        </tr>

        <!-- GREETING -->
        <tr>
          <td class="pad-sides" style="background:#ffffff;padding:20px 24px;border-bottom:1px solid #d4dde8;">
            <div data-f="greeting" style="font-family:${FONT};font-size:10pt;color:#1f3b7a;line-height:1.6;">
              ${renderGreeting(greeting)}
            </div>
          </td>
        </tr>

${eventHtml}

        <!-- FOOTER -->
        <tr>
          <td class="footer-cell" style="background:#281e7e;padding:24px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td align="center">
                  <p style="margin:0;font-family:${FONT};font-size:12px;color:#ffffff;line-height:1.7;">
                    Singapore Shipping Association<br>
                    For enquiries, please contact sarah@ssa.org.sg
                  </p>
                </td>
              </tr>
            </table>
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
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildFullHtml());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error("Failed to copy HTML:", e);
      setCopied(false);
    }
  };

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
            {saveStatus === "saving" && (
              <>
                <Loader2 size={13} className="animate-spin" /> Saving…
              </>
            )}
            {saveStatus.startsWith("Saved at") && (
              <>
                <Save size={13} /> {saveStatus}
              </>
            )}
            {saveStatus === "error" && <span className="text-red-600">Save failed</span>}
          </div>
        </div>

        {/* HOME TABS ONLY — editor remains a separate component/file */}
        <div className="flex gap-1 mb-5 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab("Events")}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              tab === "Events"
                ? "border-indigo-700 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Events
          </button>

          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 ${
              tab === "preview"
                ? "border-indigo-700 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Eye size={15} /> Preview & Export
          </button>
        </div>

        {tab === "Events" && (
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

            {/* EVENT LIST */}
            <div className="space-y-2">
              {events.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-500">No upcoming events yet.</p>
                </div>
              ) : (
                sortedEvents.map((ev) => {
                  const badge = eventStatusOptions[ev.eventStatus]; //?? eventStatusOptions.Tentative;

                  return (
                    <div
                      key={ev.id}
                      className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between"
                    >
                      <span className="text-sm font-semibold text-gray-800">
                        {ev.title || "Untitled Event"}
                      </span>

                      <div className="flex items-center gap-2">
                        <select
                          value={ev.eventStatus}
                          onChange={(e) => {
                            const nextStatus = e.target.value as EventItem["eventStatus"];
                            setEvents((prev) =>
                              prev.map((item) =>
                                item.id === ev.id
                                  ? {
                                      ...item,
                                      eventStatus: nextStatus,
                                      // dateMode: nextStatus === "Tentative" ? "month" : "exact",
                                    }
                                  : item
                              )
                            );
                          }}
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

                        <button
                          type="button"
                          onClick={() => setSelectedEventId(ev.id)}
                          className="p-1.5 text-gray-400 hover:text-indigo-700 hover:bg-gray-100 rounded"
                          title="Open event"
                        >
                          <SquareArrowOutUpRight size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            confirmDelete({
                              itemType: "event",
                              itemName: ev.title,
                              action: () =>
                                setEvents((prev) => prev.filter((item) => item.id !== ev.id)),
                            })
                          }
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete event"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
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
              onAdd={handleAddEvents}
            />
          </>
        )}

        {tab === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Email Preview</h2>
            <div>
            <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-800 text-white text-sm rounded font-medium hover:bg-indigo-900"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copied!" : "Copy HTML"}
              </button>
                <p className="text-xs text-gray-500">
                 Live Preview 
                </p>
            </div>
              </div>

            </div>

            <div className="bg-gray-200 border border-gray-300 rounded-lg p-4 overflow-auto">
              <iframe
                title="SSA Upcoming Events Preview"
                srcDoc={buildFullHtml()}
                style={{ width: 680, minWidth: 680, height: 1100 }}
                className="block mx-auto bg-white border-0"
              />
            </div>
          </div>
        )}

        {deleteModal}
      </div>
    </div>
  );
}
