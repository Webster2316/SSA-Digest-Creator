import { useEffect, useState } from "react";
import {
  Trash2,
  SquareArrowOutUpRight,
  Plus,
  Loader2,
  Save,
  Eye,
  Code2,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import useConfirmDelete from "../../shared/useConfirmDelete";
import Field from "../../shared/field";
import { uid, esc, inputCls } from "../../shared/utils";
import NamePopUp from "./NamePopUpModal";
import EventsEditor from "./EventsEditor";

interface SpeakerItems {
  id: string;
  name: string;
  designation: string;
  company: string;
}

interface EventItem {
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
  shortDescription: string;
  registrationLink: string;
  committees: string[];
  details: string;
  programme: string;
  speakers: SpeakerItems[];
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
    color: "#8a6c00",
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
    registrationStatus,
    eventStatus: ev?.eventStatus === "Confirmed" ? "Confirmed" : "Tentative",
    shortDescription: ev?.shortDescription ?? "",
    registrationLink: ev?.registrationLink ?? "",
    committees: Array.isArray(ev?.committees) ? ev.committees : [],
    details: ev?.details ?? "",
    programme: ev?.programme ?? "",
    speakers: Array.isArray(ev?.speakers) ? ev.speakers : [],
  };
}

/* =====================================================
   BADGE / TAG RENDERING — sharp corners (radius:3px),
   matches the template's "Open" / "Marine Fuels" tags
====================================================== */

function renderStatusTag(style: TagStyle) {
  return `
    <span style="display:inline-block;padding:4px 9px;border-radius:3px;background:${style.bg};border:1px solid ${style.border};font-family:${FONT_STACK};font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${style.color};white-space:nowrap;">
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

function getDateParts(event: EventItem) {
  if (!event.date) {
    return { day: "TBC", monthYear: "" };
  }

  const [year, month, day] = event.date.split("-");
  const monthNumber = Number(month);
  const monthText =
    monthNumber >= 1 && monthNumber <= 12
      ? new Date(2000, monthNumber - 1, 1)
          .toLocaleString("en-US", { month: "short" })
          .toUpperCase()
      : "";

  if (event.dateMode === "month") {
    return { day: monthText || "TBC", monthYear: year || "" };
  }

  return {
    day: day ? String(Number(day)) : "TBC",
    monthYear: [monthText, year].filter(Boolean).join(" "),
  };
}

// Matches the template's date block: big day number + "SEP 2026" underneath.
function renderDateCell(event: EventItem) {
  const { day, monthYear } = getDateParts(event);

  return `
    <td class="event-date-cell" width="110" valign="middle" align="center" style="width:110px;background:${COLOR_DATE_BG};padding:14px 8px;text-align:center;">
      <span style="display:block;font-family:${FONT_STACK};font-size:20px;font-weight:700;color:#ffffff;line-height:1.15;">${esc(
        day
      )}</span>
      ${
        monthYear
          ? `<span style="display:block;margin-top:3px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#d9ecfb;">${esc(
              monthYear
            )}</span>`
          : ""
      }
    </td>
  `;
}

function renderSpeakers(speakers: SpeakerItems[]) {
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
   CONFIRMED EVENT — mirrors the reference template
   exactly: date/title/registration-status row, then
   details+committee/register row, then programme+speakers
====================================================== */

function renderConfirmedEvent(event: EventItem) {
  const registration =
    registrationStatusOpt[event.registrationStatus] ?? registrationStatusOpt.Open;
  const committees = renderCommitteeTags(event.committees ?? []);
  const speakersHtml = renderSpeakers(event.speakers ?? []);
  const detailsHtml = event.details?.trim() || "&nbsp;";
  const programmeHtml = event.programme?.trim() || "&nbsp;";

  const actionHtml =
    event.registrationStatus === "Full"
      ? `
        <div style="margin-top:12px;font-family:${FONT_STACK};font-size:11px;line-height:16px;color:${COLOR_BODY};">
          Registration is full. Please contact the Secretariat.
        </div>
        <div style="margin-top:10px;">
          <a href="mailto:sarah@ssa.org.sg" style="display:inline-block;padding:8px 12px;background:#1b76bc;border-radius:3px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#ffffff;text-decoration:none;white-space:nowrap;mso-padding-alt:8px 12px;">Email Secretariat</a>
        </div>
      `
      : `
        <table class="register-table" cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td>
              <a class="register-link" href="${esc(
                event.registrationLink || "#"
              )}" target="_blank" style="display:inline-block;padding:8px 12px;background:#1b76bc;border-radius:3px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#ffffff;text-decoration:none;white-space:nowrap;mso-padding-alt:8px 12px;">Register Now</a>
            </td>
          </tr>
        </table>
      `;

  return `
    <tr data-block="event" data-id="${esc(event.id)}">
      <td style="padding:0;border-bottom:8px solid ${COLOR_PAGE_BG};">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#ffffff;border-top:1px solid ${COLOR_BORDER};">

          <!-- ROW 1: DATE | TITLE | REGISTRATION STATUS -->
          <tr>
            ${renderDateCell(event)}

            <td class="event-title-cell" valign="middle" style="padding:14px 18px;">
              <span style="font-family:${FONT_STACK};font-size:16px;font-weight:700;color:${COLOR_TITLE};line-height:1.4;">
                ${esc(event.title || "Untitled Event")}
              </span>
            </td>

            <td class="event-status-cell" width="125" valign="middle" align="right" style="padding:14px 18px 14px 8px;">
              ${renderStatusTag(registration)}
            </td>
          </tr>
        </table>

        <!-- ROW 2: EVENT DETAILS | COMMITTEE + REGISTER -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-top:1px solid ${COLOR_ROW_BORDER};">
          <tr>
            <td class="event-details-cell" valign="top" style="padding:20px 22px;background:${COLOR_DETAILS_BG};">
              <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${COLOR_LABEL};">Event Details</p>
              <div class="rich-text" style="font-family:${FONT_STACK};font-size:13px;color:${COLOR_BODY};line-height:1.65;">
                ${detailsHtml}
              </div>
            </td>

            <td class="event-actions-cell" width="160" valign="middle" align="center" style="padding:18px 14px;background:${COLOR_ACTIONS_BG};border-left:1px solid ${COLOR_ROW_BORDER};text-align:center;">
              ${
                committees
                  ? `<div style="width:100%;text-align:center;margin-bottom:10px;">${committees}</div>`
                  : ""
              }
              <div style="width:100%;border-top:1px solid #dde4ec;margin-bottom:14px;font-size:1px;line-height:1px;">&nbsp;</div>
              ${actionHtml}
            </td>
          </tr>
        </table>

        <!-- ROW 3: PROGRAMME TOPICS | SPEAKERS -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-top:1px solid ${COLOR_ROW_BORDER};">
          <tr>
            <td class="programme-cell" valign="top" style="padding:20px 22px;background:#ffffff;">
              <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:10pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${COLOR_LABEL};">Programme Topics</p>
              <div class="rich-text" style="font-family:${FONT_STACK};font-size:10pt;color:${COLOR_BODY};line-height:1.65;">
                ${programmeHtml}
              </div>
            </td>

            <td class="speakers-cell" width="200" valign="top" style="padding:20px 22px;background:${COLOR_DETAILS_BG};border-left:1px solid ${COLOR_ROW_BORDER};">
              <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:10pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${COLOR_LABEL};">Speakers</p>
              <div style="font-family:${FONT_STACK};font-size:10pt;color:${COLOR_BODY};line-height:1.6;">
                ${speakersHtml}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/* =====================================================
   TENTATIVE EVENT — condensed one-row version of the
   same design language (no reference template supplied
   for this state yet — flag if you have one to match)
====================================================== */

function renderTentativeEvent(event: EventItem) {
  const eventStatus = eventStatusOptions.Tentative;
  const committees = renderCommitteeTags(event.committees ?? []);

  return `
    <tr data-block="event" data-id="${esc(event.id)}">
      <td style="padding:0;border-bottom:8px solid ${COLOR_PAGE_BG};">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#ffffff;border-top:1px solid ${COLOR_BORDER};">
          <tr>
            ${renderDateCell(event)}

            <td class="event-title-cell" valign="middle" style="padding:14px 18px;">
              <span style="font-family:${FONT_STACK};font-size:16px;font-weight:700;color:${COLOR_TITLE};line-height:1.4;">
                ${esc(event.title || "Untitled Event")}
              </span>
              ${
                committees
                  ? `<div style="margin-top:8px;line-height:1.6;">${committees}</div>`
                  : ""
              }
            </td>

            <td class="event-status-cell" width="125" valign="middle" align="right" style="padding:14px 18px 14px 8px;">
              ${renderStatusTag(eventStatus)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

export default function EventsHome() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const { confirmDelete, deleteModal } = useConfirmDelete();
  const [issueRange, setIssueRange] = useState("Monthly Issue: September 2026");
  const [greeting, setGreeting] = useState(
    "Dear Members,\n\nWe are pleased to invite you to our upcoming and future planned events."
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [tab, setTab] = useState<"builder" | "preview">("builder");
  const [copied, setCopied] = useState(false);
  const [rawHtmlEdit, setRawHtmlEdit] = useState<string | null>(null);

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
            rawHtmlEdit,
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
  }, [events, greeting, issueRange, rawHtmlEdit, loaded]);

  const handleAddEvents = (title: string) => {
    setEvents((prev) => [
      ...prev,
      {
        id: uid(),
        title,
        dateMode: "month",
        date: "",
        eventStatus: "Tentative",
        registrationStatus: "Open",
        shortDescription: "",
        registrationLink: "",
        committees: [],
        details: "",
        programme: "",
        speakers: [],
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

  const exportHtml = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "SSA-Upcoming-Events.html";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  if (selectedEventId) {
    return (
      <EventsEditor
        eventId={selectedEventId}
        events={events}
        setEvents={setEvents}
        onBack={() => setSelectedEventId(null)}
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
                <Save size={13} />
                {saveStatus}
              </>
            )}

            {saveStatus === "error" && (
              <span className="text-red-600">Save failed</span>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-5 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab("builder")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 ${
              tab === "builder"
                ? "border-indigo-700 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Builder
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
            <Eye size={15} />
            Preview & Export
          </button>
        </div>

        {/* BUILDER TAB */}
        {tab === "builder" && (
          <div>
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
                  rows={3}
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
                sortedEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">
                        {ev.title || "Untitled Event"}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {ev.date || "No date set"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={ev.eventStatus ?? "Tentative"}
                        onChange={(e) =>
                          setEvents((prev) =>
                            prev.map((item) =>
                              item.id === ev.id
                                ? {
                                    ...item,
                                    eventStatus: e.target
                                      .value as EventItem["eventStatus"],
                                    dateMode:
                                      e.target.value === "Confirmed"
                                        ? "exact"
                                        : "month",
                                  }
                                : item
                            )
                          )
                        }
                        className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-300 bg-gray-100 text-gray-700 cursor-pointer"
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
                              setEvents((prev) =>
                                prev.filter((e) => e.id !== ev.id)
                              ),
                          })
                        }
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete event"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ADD EVENT */}
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

              <button
                type="button"
                onClick={exportHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded font-medium hover:bg-gray-50"
              >
                <Code2 size={15} />
                Export HTML
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
                Showing your manual edits. The Builder tab won't reflect this — hand edits are export-only. Click{" "}
                <strong>Discard edits</strong> to go back to the generated version.
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
              <Code2 size={13} /> Raw HTML (editable — changes here update the preview and copy button above):
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

        {deleteModal}
      </div>
    </div>
  );
}