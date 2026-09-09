import { useState, useEffect } from "react";
import { Trash2, SquareArrowOutUpRight, ChevronDown, ChevronUp, Plus,  Archive, Loader2} from "lucide-react";
import useConfirmDelete from "../../shared/useConfirmDelete";
import Field from "../../shared/field";
import { uid, esc, inputCls } from "../../shared/utils";
import NamePopUp from "./NamePopUpModal";
import RecordsPanel from "../shared/recordsPanel";
import RecordViewer from "../shared/recordViewer";

const FONT = "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

//FUNCTIONS//
function makeEventItem(overrides = {}) {
return Object.assign(
    { id: uid(), title: "", status: "onGoing"},
overrides
)
};

interface EventItem {
  id: string;
  title: string;
  status: "onGoing" | "completed";
}


const statusOptions: Record<string, { text: string; bg: string; color: string; border: string }> = {
    completed: { text: "Completed", bg: "#8ccf90", color: "#007d21", border: "#007d21" },
    onGoing: { text: "On Going", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708" },
  };

export default function EventsHome() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState("idle");
    const { confirmDelete, deleteModal } = useConfirmDelete();


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
          status: "onGoing",
        },
      ]);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////
  
    const upcomingEvents =events.filter((ev) => ev.status === "onGoing");
    const completedEvents = events.filter((ev) => ev.status === "completed");

    const toggleEventStatus = (id: string) => {
      setEvents((prev) =>
      prev.map((ev) => 
      ev.id === id ? {
        ...ev,
        status: ev.status === "onGoing" ? "completed" : "onGoing",
      } : ev
      )
      );
    };


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
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
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
    
          {/* EVENT LIST */}
          <div className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-500">
                  No upcoming events yet.
                </p>
              </div>
            ) : (
              upcomingEvents.map((ev) => {
                const badge = statusOptions[ev.status];
    
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
  value={ev.status}
  onChange={(e) =>
    setEvents((prev) =>
      prev.map((item) =>
        item.id === ev.id
          ? {
              ...item,
              status: e.target.value as "onGoing" | "completed",
            }
          : item
      )
    )
  }
  style={{
    backgroundColor: badge.bg,
    color: badge.color,
    borderColor: badge.border,
  }}
  className="px-2.5 py-1 text-xs font-semibold rounded border cursor-pointer"
>
  <option value="onGoing">On Going</option>
  <option value="completed">Completed</option>
</select>

            <button
              type="button"
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
}