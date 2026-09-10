import { useEffect, useState } from "react";
import {
  Trash2,
  SquareArrowOutUpRight,
  Plus,
  Loader2,
  Save,
  Eye,
  Code2,
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
  Full: {
    text: "Full",
    bg: "#dff2e1",
    color: "#007d21",
    border: "#8ccf90",
  },
  LimitedSlots: {
    text: "Limited Seats",
    bg: "#fff5d8",
    color: "#8a6c00",
    border: "#d7b441",
  },
  Open: {
    text: "Open",
    bg: "#eaf4fb",
    color: "#1b76bc",
    border: "#b8dcf2",
  },
  Waitlist: {
    text: "Waitlist",
    bg: "#f2eef8",
    color: "#5c3b7e",
    border: "#cfc0df",
  },
  ClosingSoon: {
    text: "Closing Soon",
    bg: "#fff0e7",
    color: "#9a4a16",
    border: "#efba98",
  },
};

const committeeOptions: Record<string, TagStyle> = {
  DEC: {
    text: "Decarbonisation",
    bg: "#8ede96",
    color: "#1d7d26",
    border: "#1d7d26",
  },
  DIG: {
    text: "Digitalisation",
    bg: "#9eb2de",
    color: "#103687",
    border: "#103687",
  },
  INT: {
    text: "International",
    bg: "#f2dc9d",
    color: "#8a6c00",
    border: "#bf9708",
  },
  TEC: {
    text: "Technical",
    bg: "#c78585",
    color: "#6d0808",
    border: "#871010",
  },
  LEG: {
    text: "Legal and Insurance",
    bg: "#b48fbd",
    color: "#510763",
    border: "#510763",
  },
  SVC: {
    text: "Services",
    bg: "#e9eba4",
    color: "#64660e",
    border: "#717312",
  },
  MFC: {
    text: "Marine Fuels",
    bg: "#91c4b5",
    color: "#17644f",
    border: "#238266",
  },
  YEG: {
    text: "YEG",
    bg: "#d498c1",
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

function renderTag(style: TagStyle) {
  return `
    <span style="display:inline-block;padding:4px 9px;border-radius:999px;border:1px solid ${style.border};background:${style.bg};color:${style.color};font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;line-height:16px;text-transform:uppercase;letter-spacing:.2px;">
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
        return `<span style="display:inline-block;margin:0 5px 5px 0;padding:4px 8px;border:1px solid #d1d5db;border-radius:999px;font-size:11px;color:#4b5563;">${esc(
          code
        )}</span>`;
      }

      return `<span style="display:inline-block;margin:0 5px 5px 0;padding:4px 8px;border:1px solid ${option.border};border-radius:999px;background:${option.bg};color:${option.color};font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;line-height:16px;">${esc(
        option.text
      )}</span>`;
    })
    .join("");
}

function getDateParts(event: EventItem) {
  if (!event.date) {
    return {
      main: "TBC",
      secondary: "",
      tertiary: "",
    };
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
    return {
      main: monthText || "TBC",
      secondary: year || "",
      tertiary: "",
    };
  }

  return {
    main: day ? String(Number(day)) : "TBC",
    secondary: monthText,
    tertiary: year || "",
  };
}

function renderDateCell(event: EventItem) {
  const date = getDateParts(event);

  return `
    <td width="105" valign="middle" align="center" style="width:105px;background:#281e7e;padding:18px 10px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
      <div style="font-size:${event.dateMode === "exact" ? "28px" : "18px"};font-weight:800;line-height:1.05;">${esc(
        date.main
      )}</div>
      ${
        date.secondary
          ? `<div style="font-size:13px;font-weight:700;line-height:18px;margin-top:4px;">${esc(
              date.secondary
            )}</div>`
          : ""
      }
      ${
        date.tertiary
          ? `<div style="font-size:11px;line-height:16px;opacity:.92;">${esc(
              date.tertiary
            )}</div>`
          : ""
      }
    </td>
  `;
}

function renderTentativeEvent(event: EventItem) {
  const eventStatus = eventStatusOptions.Tentative;
  const committees = renderCommitteeTags(event.committees ?? []);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;margin:0 0 18px 0;border:1px solid #d9dee7;border-radius:12px;overflow:hidden;background:#ffffff;">
      <tr>
        ${renderDateCell({ ...event, dateMode: "month" })}

        <td valign="middle" style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;">
          <div style="font-size:17px;line-height:24px;font-weight:800;color:#20253a;">
            ${esc(event.title || "Untitled Event")}
          </div>
          ${
            committees
              ? `<div style="margin-top:9px;line-height:1.6;">${committees}</div>`
              : ""
          }
        </td>

        <td width="125" valign="middle" align="center" style="width:125px;padding:18px 14px;border-left:1px solid #edf0f5;font-family:Arial,Helvetica,sans-serif;">
          ${renderTag(eventStatus)}
        </td>
      </tr>
    </table>
  `;
}

function renderSpeakers(speakers: SpeakerItems[]) {
  if (!speakers?.length) return "";

  return speakers
    .map((speaker, index) => {
      const name = esc(speaker?.name ?? "");
      const designation = esc(speaker?.designation ?? "");
      const company = esc(speaker?.company ?? "");

      const meta = [designation, company].filter(Boolean).join(", ");

      return `
        <div style="margin:${index === 0 ? "0" : "12px 0 0"};">
          ${
            name
              ? `<div style="font-size:13px;font-weight:700;line-height:19px;color:#20253a;">${name}</div>`
              : ""
          }
          ${
            meta
              ? `<div style="font-size:12px;line-height:18px;color:#687084;">${meta}</div>`
              : ""
          }
        </div>
      `;
    })
    .join("");
}

function renderConfirmedEvent(event: EventItem) {
  const eventStatus = eventStatusOptions.Confirmed;
  const registration =
    registrationStatusOpt[event.registrationStatus] ?? registrationStatusOpt.Open;
  const committees = renderCommitteeTags(event.committees ?? []);
  const speakersHtml = renderSpeakers(event.speakers ?? []);
  const detailsHtml = event.details?.trim() || "";
  const programmeHtml = event.programme?.trim() || "";

  const actionHtml =
    event.registrationStatus === "Full"
      ? `
        <div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#5f6676;">
          Registration is currently full. Please contact the SSA Secretariat for enquiries.
        </div>
        <div style="margin-top:12px;">
          <a href="mailto:sarah@ssa.org.sg" style="display:inline-block;background:#281e7e;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;">Email Secretariat</a>
        </div>
      `
      : `
        <div style="margin-top:12px;">
          <a href="${esc(
            event.registrationLink || "#"
          )}" style="display:inline-block;background:#281e7e;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;">Register Now</a>
        </div>
      `;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;margin:0 0 18px 0;border:1px solid #d9dee7;border-radius:12px;overflow:hidden;background:#ffffff;">
      <!-- ROW 1: DATE / EVENT NAME / EVENT STATUS -->
      <tr>
        ${renderDateCell({ ...event, dateMode: "exact" })}

        <td valign="middle" style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;">
          <div style="font-size:17px;line-height:24px;font-weight:800;color:#20253a;">
            ${esc(event.title || "Untitled Event")}
          </div>
        </td>

        <td width="125" valign="middle" align="center" style="width:125px;padding:18px 14px;border-left:1px solid #edf0f5;font-family:Arial,Helvetica,sans-serif;">
          ${renderTag(eventStatus)}
        </td>
      </tr>

      <!-- ROW 2: EVENT DETAILS / ACTIONS -->
      <tr>
        <td colspan="2" valign="top" style="padding:20px;border-top:1px solid #edf0f5;font-family:Arial,Helvetica,sans-serif;">
          <div style="font-size:11px;line-height:16px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:#281e7e;margin-bottom:8px;">Event Details</div>
          <div style="font-size:13px;line-height:20px;color:#3f4655;" class="rich-text">
            ${detailsHtml || "&nbsp;"}
          </div>
        </td>

        <td width="190" valign="top" style="width:190px;padding:20px;border-top:1px solid #edf0f5;border-left:1px solid #edf0f5;font-family:Arial,Helvetica,sans-serif;">
          ${
            committees
              ? `<div style="margin-bottom:10px;line-height:1.6;">${committees}</div>`
              : ""
          }
          <div>${renderTag(registration)}</div>
          ${actionHtml}
        </td>
      </tr>

      <!-- ROW 3: PROGRAMME / SPEAKERS -->
      <tr>
        <td colspan="2" valign="top" style="padding:20px;border-top:1px solid #edf0f5;font-family:Arial,Helvetica,sans-serif;">
          <div style="font-size:11px;line-height:16px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:#281e7e;margin-bottom:8px;">Programme Topics</div>
          <div style="font-size:13px;line-height:20px;color:#3f4655;" class="rich-text">
            ${programmeHtml || "&nbsp;"}
          </div>
        </td>

        <td width="190" valign="top" style="width:190px;padding:20px;border-top:1px solid #edf0f5;border-left:1px solid #edf0f5;font-family:Arial,Helvetica,sans-serif;">
          <div style="font-size:11px;line-height:16px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:#281e7e;margin-bottom:8px;">Speakers</div>
          ${speakersHtml || "&nbsp;"}
        </td>
      </tr>
    </table>
  `;
}

export default function EventsHome() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const { confirmDelete, deleteModal } = useConfirmDelete();
  const [issueRange, setIssueRange] = useState("Issue: ");
  const [greeting, setGreeting] = useState("Dear Member, below is...");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [tab, setTab] = useState<"builder" | "preview">("builder");

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
  }, [events, greeting, issueRange, loaded]);

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
  <title>SSA Upcoming Events</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #eef2f5;
      font-family: Arial, Helvetica, sans-serif;
    }

    table {
      border-spacing: 0;
    }

    .rich-text p {
      margin: 0 0 8px 0;
    }

    .rich-text ul,
    .rich-text ol {
      margin: 8px 0;
      padding-left: 20px;
    }

    .rich-text li {
      margin-bottom: 4px;
    }

    @media only screen and (max-width: 700px) {
      .email-shell {
        width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#eef2f5;">
    <tr>
      <td align="center" style="padding:28px 12px;">

        <table role="presentation" width="680" cellpadding="0" cellspacing="0" border="0" class="email-shell" style="width:680px;max-width:680px;background:#ffffff;border-collapse:separate;border-spacing:0;">

          <!-- BANNER -->
          <tr>
            <td style="padding:0;">
              <img
                src="https://raw.githubusercontent.com/Webster2316/SSA_Training_Bulletin/refs/heads/main/Banner4.png"
                alt="Singapore Shipping Association"
                width="680"
                style="display:block;width:100%;max-width:680px;height:auto;border:0;"
              />
            </td>
          </tr>

          <!-- ISSUE -->
          <tr>
            <td style="background:#281e7e;padding:14px 24px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;line-height:19px;color:#ffffff;">
              ${esc(issueRange)}
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td style="padding:26px 28px 16px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#343b4c;">
              ${safeGreeting}
            </td>
          </tr>

          <!-- SECTION TITLE -->
          <tr>
            <td style="padding:10px 28px 16px 28px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:20px;line-height:28px;font-weight:800;color:#281e7e;">Upcoming Events</div>
              <div style="width:48px;height:3px;background:#83479d;margin-top:7px;"></div>
            </td>
          </tr>

          <!-- EVENTS -->
          <tr>
            <td style="padding:0 28px 16px 28px;">
              ${
                eventsHtml ||
                `<div style="padding:28px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7b8190;">No upcoming events.</div>`
              }
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f5f6f8;padding:20px 28px;text-align:center;border-top:1px solid #e3e6eb;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:#737a89;">
              <strong style="color:#4b5261;">Singapore Shipping Association</strong><br>
              For enquiries, please contact
              <a href="mailto:sarah@ssa.org.sg" style="color:#281e7e;text-decoration:none;font-weight:700;">sarah@ssa.org.sg</a>.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const exportHtml = () => {
    const html = buildFullHtml();
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
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">
                  Email Preview
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  This preview uses the same HTML that will be exported.
                </p>
              </div>

              <button
                type="button"
                onClick={exportHtml}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 text-white text-sm font-medium rounded-md hover:bg-indigo-800"
              >
                <Code2 size={15} />
                Export HTML
              </button>
            </div>

            <div className="bg-gray-200 border border-gray-300 rounded-lg p-4 overflow-auto">
              <iframe
                title="Upcoming Events Preview"
                srcDoc={buildFullHtml()}
                className="w-full h-[1000px] bg-white border-0 rounded"
              />
            </div>
          </div>
        )}

        {deleteModal}
      </div>
    </div>
  );
}
