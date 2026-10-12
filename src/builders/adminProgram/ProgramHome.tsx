import { useEffect, useState } from "react";
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
import AdminBriefEditor from "./ProgramBriefEditor";
// import EventsHistory from "./EventsHistory";
import RecordsPanel from "../../shared/recordsPanel";
import RecordViewer from "../../shared/recordViewer";

const PROGRAM_BUILDER_KEY = "program-brief-data";

type InfoFields = { 
  date;
  time;
  venue;
  dressCode;
  audienceSize;
  Catering;
}

type RoleNRes = { 
  id;
role;
assignedTo;
}

type ProgrammeRow = {
   id; 
   time; 
   activity; 
   checks; 
   owner; 
}

type Guest = {
  id;
  name;
  row: "" | "first" | "second"
}
type GuestList  = { 
  id; 
  name; 
  guests: Guest[]
 }
type PackingItem = { 
  id; 
  text; 
}

interface AdminProgramme {
  id; eventName;
  info: InfoFields;
  roles: RoleRow[];
  programme: ProgrammeRow[];
  guestLists: GuestList[];   selectedGuestListId: string;   
  packing: PackingItem[];    // set default 
}

const defaultPacking: Record<string, string> = {
  laptops: "2 laptops with chargers",
  clickers: "2 slide clickers – ensure fully charged",
  moderatorTablet: "Tablet for moderator – ensure fully charged",
  regLists: "2 x registration lists",
  lanyards: "Lanyard and conference card + extras for walk-ins",
  speakerLabels: "Speaker labels for seating arrangement",
  timekeeper: "Bell & placard (red, yellow, green) for timekeeper",
  printedProgramme: "2 x printed admin programme, on standby",
  stationery: "Stationery (markers, pens, etc.)",
  ssaBanner: "SSA pull-up banner",
  sponsorBanners: "Sponsor pull-up banners & brochures",
  tablets: "2 tablets",
};

const FONT = "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

function getDateTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProgramHome() {
  const [tab, setTab] = useState<"Events" | "preview" | "EventsHistory">("Events");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [viewingRecordId, setViewingRecordId] = useState(null);
  const { confirmDelete, deleteModal } = useConfirmDelete();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedArchivedEvent, setSelectedArchivedEvent] = useState<EventItem | null>(null)
  const [copied, setCopied] = useState(false);
  const [issueRange, setIssueRange] = useState("Monthly Issue: September 2026");
  const [greeting, setGreeting] = useState(`Dear Members,

We are pleased to invite you to our upcoming and future planned events, designed to bring our members together and provide an opportunity to engage directly with our Chairs, Councillors and Committee Experts.

These in-person sessions will provide an overview of the work being undertaken across our committees, while creating opportunities for members to exchange insights, connect with fellow industry professionals and learn more about how to engage with our activities.

We encourage you to register your interest and join us at these upcoming sessions.

We look forward to bringing our members together and strengthening our collective engagement across the association.`);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/load-digest?key=program-brief-data");
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
        const res = await fetch("/api/save-digest?key=program-brief-data", {
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
        completionStatus: "InProgress",
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

        <!-- FOOTER - follow weekly digest-->
        <tr>
          <td class="footer-cell" style="background:#281e7e;padding:24px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td align="center">
                  <p style="margin:0;font-family:${FONT};font-size:12px;color:#ffffff;line-height:1.7;">
                  You are receiving this Event Calendar because you are a Tier 1-4 member of an SSA Committee. This Calendar is circulated to keep committee members informed of all events hosted by or organised by SSA Committees. Members who wish to discontinue receiving the newsletter, please email <strong>"unsubscribe"</strong> to <a href="mailto:sarah@ssa.org.sg" style="color:#81bce9;text-decoration:none;">sarah@ssa.org.sg</a>.
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

  //copy event item
  const copyEvent = (event: any) => {
    const copy = { ...event, id: uid() };
  
      const index = events.findIndex((x) => x.id === event.id);
  
      setEvents([
        ...events.slice(0, index + 1),
        copy,
        ...events.slice(index + 1),
      ])
  
  };

  //handles copy for HTML
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

const handleMovetoCurrent = (eventData: any) => {
  const copy = normaliseEvent({
    ...eventData,
    id: uid(),
    completionStatus: "InProgress",
  });

  setEvents((prev) => [
    ...prev,
    copy,
  ]);

  setTab("Events");
};

const handleRestoreEvent = async (archiveId: number, eventData: any) => {
  try {
    const res = await fetch(`/api/events-history?id=${archiveId}`,
    {
      method: "DELETE",
    });

    if(!res.ok) {
      console.error("Failed to restore event");
      return;
    }
    const restored = normaliseEvent({
      ...eventData,
      completionStatus: "InProgress",
    });

    setEvents((prev) => [
      ...prev,
      restored,
    ]);

    setTab("Events");
  } catch (e) {
console.error("Failed to restore event:", e)
  }
};


const completedEvent = async (event: EventItem) => {
  try {
    const res = await fetch("/api/events-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        builderKey: PROGRAM_BUILDER_KEY,
        event: {
          ...event,
          completionStatus: "Completed",
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Failed to move event into archive:", res.status, errorText);
      return;
    }

    setEvents((prev) => prev.filter((item) => item.id !== event.id));
  } catch (e) {
    console.error("Failed to move to archive", e);
  }
};

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
        {viewingRecordId === null ? (
          <>
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
          <button
                onClick={() => setViewingRecordId(-1)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-700 px-2"
              >
                <Archive size={15} /> Issue Archive
              </button>
          <button
  type="button"
  onClick={() => setTab("history")}
  className={`ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 ${
    tab === "history"
      ? "border-indigo-700 text-gray-700"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  <Archive size={15} />
  Event History
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
                        <div className="relative group">
  <button
    type="button"
    onClick={() => completedEvent(ev)}
    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
  >
    <CircleCheck size={16} />
  </button>

  <div
    className="
      absolute bottom-full left-1/2 -translate-x-1/2 mb-2
      whitespace-nowrap
      rounded bg-gray-800 px-2 py-1
      text-xs text-white
      opacity-0 pointer-events-none
      group-hover:opacity-100
      transition-opacity duration-100
      z-50
    "
  >
    Mark event as completed
  </div>
</div>
                        <button
                          type="button"
                          onClick={() => setSelectedEventId(ev.id)}
                          className="p-1.5 text-gray-400 hover:text-indigo-700 hover:bg-gray-100 rounded"
                          title="Open event"
                        >
                          <SquareArrowOutUpRight size={16} />
                        </button>

                        <button
  onClick={() => copyEvent(ev)}
  className="p-1 rounded hover:bg-gray-100 text-gray-500"
  title="Copy event"
>
  <Copy size={16} /></button>


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
  heading="Create New Event"
  fieldLabel="Event Name"
  placeholder="e.g. SSA Maritime Digitalisation Forum"
  buttonText="Create Event"
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

{/* {tab === "history" && (
  <EventsHistory
    builderKey={PROGRAM_BUILDER_KEY}
    viewPastEventDetails={setSelectedArchivedEvent}
    onCopyToCurrent={handleMovetoCurrent}
    onRestoreEvent={handleRestoreEvent}
  />
)} */}
   {deleteModal}
          </>
        ) : viewingRecordId === -1 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <RecordsPanel builderKey="program-brief-data" onSelect={(id) => setViewingRecordId(id)} />
            <button onClick={() => setViewingRecordId(null)} className="mt-3 text-sm text-gray-500 hover:text-indigo-700">
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