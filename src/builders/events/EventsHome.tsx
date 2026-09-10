import { useState, useEffect } from "react";
import { Trash2, SquareArrowOutUpRight, ChevronDown, ChevronUp, Plus,  Archive, Loader2, Save} from "lucide-react";
import useConfirmDelete from "../../shared/useConfirmDelete";
import Field from "../../shared/field";
import { uid, esc, inputCls } from "../../shared/utils";
import NamePopUp from "./NamePopUpModal";
import RecordsPanel from "../shared/recordsPanel";
import RecordViewer from "../shared/recordViewer";
import EventsEditor from "./EventsEditor";

const FONT = "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

//FUNCTIONS//
function makeEventItem(overrides = {}) {
return Object.assign(
    { id: uid(), title: "", status: "onGoing"},
overrides
)
};

interface SpeakerItems{
  id: string;
  name: string;
  designation: string;
  company: string;
};

interface EventItem {
  id: string;
  title: string;
  date: string
  dateMode: "exact" | "month",
registrationStatus: "Open"
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
speakers:SpeakerItems[];
};


const registrationStatusOpt: Record<string, { text: string; bg: string; color: string; border: string }> = {
    Full: { text: "Full", bg: "#8ccf90", color: "#007d21", border: "#007d21" }, // email secretariat
    LimitedSlots: { text: "Limited Seats", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708" },
    Open: { text: "Open", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708" }, 
    Waitlist: {text: "Waitlist", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708"},
    ClosingSoon: { text: "Closing Soon", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708" }
  };
  
const eventStatus:  Record<string, { text: string; bg: string; color: string; border: string }> = {
  Confirmed: { text: "Confirmed", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708" }, 
  Tentative: { text: "Tentative", bg: "#f2bbbf", color: "#700710", border: "#700710" },
}
//Open, Tentative, Confirmed, //separate registration status and event status
const committeOptions:  Record<string, { text: string; bg: string; color: string; border: string }> = {
  DEC : {text: "Decarbonisation", bg: "#8ede96", color: "#1d7d26", border: "#1d7d26"},
  DIG : {text: "Digitalisation", bg: "#9eb2de", color: "#103687", border: "#103687"},
  INT : {text: "International", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708"},
  TEC : {text: "Technical", bg: "#c78585", color: "#871010", border: "#871010"},
  LEG : {text: "Legal and Insurance", bg: "#b48fbd", color: "#510763", border: "#510763"},
  SVC : {text: "Services", bg: "#e9eba4", color: "#717312", border: "#717312"},
  MFC : {text: "Marine Fuels", bg: "#91c4b5", color: "#238266", border: "#238266"},
  YEG : {text: "YEG", bg: "#d498c1", color: "#7a0b57", border: "#7a0b57"},
}

  function getDateTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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


    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    //loading
    useEffect(() => {
      (async () => {
        try {
          const res = await fetch("/api/load-digest?key=events-builder-data");
          if (res.ok) {
            const data = await res.json();
           if(data?.events) {
            setEvents(data.events);
           }
          }
        } catch (e) {
          console.error("Failed to load events builder:", e);
        }
        setLoaded(true);
      })();
    }, []);
  
    ///Saving
    useEffect(() => {
      if (!loaded) return;
    
      setSaveStatus("saving");
    
      const t = setTimeout(async () => {
        try {
          const res = await fetch(
            "/api/save-digest?key=events-builder-data",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                events,
                greeting

              }),
            }
          );
    
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
    }, [events, loaded, greeting]);

    const handleAddEvents = (title:string) => {
      setEvents((prev) => [
        ...prev,
        {
          id: uid(),
          title,
          dateMode: "exact" | "month",
          date: "",
          eventStatus: "Tentative",
          registrationStatus: "Open",
          registrationLink: "",
          committees: [],
          details: "",
          programme: "",
          speakers: [],
        },
      ]);
    }

    const sortedEvents = [...events].sort((a,b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;

      const aDate = a.dateMode === "month" ? `${a.date}-01`: a.date;
      const bDate = b.dateMode === "month" ? `${b.date}-01`: b.date;

      return aDate.localCompare(bDate);
    })

    //////////////////////////////////////////////////////////////////////////////////////////////
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
    
            <h1 className="text-xl font-bold text-indigo-900">
              Upcoming Events
            </h1>

            <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
            {saveStatus === "saving" && <><Loader2 size={13} className="animate-spin" /> Saving…</>}
            {saveStatus.startsWith("Saved at") && (
  <>
    <Save size={13} />
    {saveStatus}
  </>
)}
{saveStatus === "error" && (
  <span className="text-red-600">
    Save failed
  </span>
)}
          </div>
          </div>
<div>
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
                <p className="text-sm text-gray-500">
                  No upcoming events yet.
                </p>
              </div>
            ) : (
              sortedEvents.map((ev) => {
                const badge = eventStatus[ev.eventStatus];
    
                return (
                  <div
                    key={ev.id}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between"
                  >
                    <span className="text-sm font-semibold text-gray-800">
                      {ev.title}
                    </span>
    
                    <div className="flex items-center gap-2">
                    

                    <select
  value={ev.eventStatus}
  onChange={(e) =>
    setEvents((prev) =>
      prev.map((item) =>
        item.id === ev.id
          ? {
              ...item,
              registrationStatusOpt: e.target.value as EventItem["registrationStatus"],
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
                );
              })
            )}
          </div>
    
    
          {/* ADD EVENT */}
          <button
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
    
          {deleteModal}
        </div>
      </div>
    );
    <DocumentUploadModal
    isOpen={docModalTarget !== null}
    onClose={() => setDocModalTarget(null)}
    onAdd={handleAddDocs}
  />
      {deleteModal}
    
}