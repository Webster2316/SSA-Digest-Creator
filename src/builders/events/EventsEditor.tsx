import { useState, useEffect } from "react";
import { Plus, Copy, Check, Save, Eye, Code2, BookOpen, GraduationCap, TrendingUp, ArrowLeft, Archive, Loader2, RotateCcw, Trash2 } from "lucide-react";
import Field from "../../shared/field";
import MoveButtons from "../../shared/moveButtons";
import RecordsPanel from "../../shared/recordsPanel";
import RecordViewer from "../../shared/recordViewer";
import RichTextEditor from "../../shared/richTextEditor";
import { uid, esc, inputCls } from "../../shared/utils";
import DocumentUploadModal from "../../shared/documentUploadModal";
import useConfirmDelete from "../../shared/useConfirmDelete";

const FONT = "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

//=================================
//Functions and variables
//==================================
//for saving
function getDateTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

//
interface SpeakerItems{
    id: string;
    name: string;
    designation: string;
    company: string;
  };

  interface EventItem {
    id: string;
    title: string;
  date: string;
  registrationStatus: "Available"
  | "LimitedSlots"
  | "Waitlist"
  | "ClosingSoon"
  | "Full";
  registrationLink: string;
  committees: string[];
  details: string;
  programme: string;
  speakers: SpeakerItems[];
  };


  interface EventsEditorProps {
    eventId: string;
    events: EventsItem[];
    setEvents: React.Dispatch<RecordingState.SetStateAction<EventItem[]>>;
    onBack: () => void;
  }
  
  const statusOptions: Record<string, { text: string; bg: string; color: string; border: string }> = {
    Full: { text: "Full", bg: "#8ccf90", color: "#007d21", border: "#007d21" },
    LimitedSlots: { text: "Limited Seats", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708" },
    Available: { text: "Available", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708" },
    Waitlist: {text: "Waitlist", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708"},
    ClosingSoon: { text: "Closing Soon", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708" }
  };

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

  
export default function EventsHome({ eventId, events, setEvents, onBack }: EventsEditorProps) {
    const [loaded, setLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState("idle");
    const { confirmDelete, deleteModal } = useConfirmDelete();

//
const event = events.find((ev) => event.id === eventId);
if (!event) {
    return <div>Event not found.</div>;
  }
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    //loading
    useEffect(() => {
        (async () => {
          try {
            const res = await fetch("/api/load-digest?key=events-builder-data?uid={event.id}");
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
      }, [events, loaded]);
  
      const handleAddEvents = (title:string) => {
        setEvents((prev) => [
          ...prev,
          {
            id: uid(),
            title,
            date: "",
            registrationStatus: "Available",
            registrationLink: "",
            committees: [],
            details: "",
            programme: "",
            speakers: [],
          },
        ]);
      }

      const updateEvent = (updates: Partial<EventsItem>) => {
        setEvents((prev) => 
        prev.map((ev)=>
        ev.id === eventId ? { ...ev, ...updates } : ev
        )
        );
      };
  
    return (
        <div className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto p-4">
            {/* header */}
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
    <button
  type="button"
  onClick={onBack}
  className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900 mb-4"
>
  <ArrowLeft size={16} />
  Back to Events
</button>

{/* builder */}
<div>
<Field label="Event Title">
  <input
    className={inputCls}
    value={event.title}
    onChange={(e) => updateEvent({ title: e.target.value })}
  />
</Field>
    <input 
    type="date"
    value={event.date}
    onChange={(e) => updateEvent({ date: e.target.value})} 
    />

    <select
    value={event.registrationStatus}
    onChange={(e) =>
    updateEvent({
    registrationStatus: e.target.value as EventItem["registrationStatus"]
    })}
    >

    </select>

</div>

    </div>
</div>
    )
}