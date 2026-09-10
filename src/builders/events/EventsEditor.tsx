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
  speakers: SpeakerItems[];
  };


  interface EventsEditorProps {
    eventId: string;
    events: EventItem[];
    setEvents: React.Dispatch<React.SetStateAction<EventItem[]>>;
    onBack: () => void;
  }
  const eventStatus:  Record<string, { text: string; bg: string; color: string; border: string }> = {
    Confirmed: { text: "Confirmed", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708" }, 
    Tentative: { text: "Tentative", bg: "#f2bbbf", color: "#700710", border: "#700710" },
  }
  const statusOptions: Record<string, { text: string; bg: string; color: string; border: string }> = {
    Full: { text: "Full", bg: "#8ccf90", color: "#007d21", border: "#007d21" },
    LimitedSlots: { text: "Limited Seats", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708" },
    Open: { text: "Open", bg: "#f2dc9d", color: "#bf9708", border: "#bf9708" },
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


export default function EventsEditor({ eventId, events, setEvents, onBack }: EventsEditorProps) {
    const [loaded, setLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState("idle");
    const { confirmDelete, deleteModal } = useConfirmDelete();

//
const event = events.find((ev) => ev.id === eventId);
if (!event) {
    return <div>Event not found.</div>;
  }

  const eventBadge = eventStatus[event.eventStatus ?? "Tentative"] ?? eventStatus.Tentative;
  const isTentative = event.eventStatus === "Tentative";

  const committees = event.committees ?? [];
  const speakers = event.speakers ?? [];
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
            date: "",
            registrationStatus: "Open",
            registrationLink: "",
            committees: [],
            details: "",
            programme: "",
            speakers: [],
          },
        ]);
      }

      const updateEvent = (updates: Partial<EventItem>) => {
        setEvents((prev) => 
        prev.map((ev)=>
        ev.id === eventId ? { ...ev, ...updates } : ev
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
                Edit Event
              </h1>
      
              {/* SAVE STATUS */}
              <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
                {saveStatus === "saving" && (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Saving…
                  </>
                )}
      
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
      
      
            {/* BACK */}
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900 mb-5"
            >
              <ArrowLeft size={16} />
              Back to Events
            </button>
      
      
            {/* MAIN EDITOR CARD */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
      
              {/* EVENT TITLE */}
              <Field label="Event Title">
                <input
                  className={inputCls}
                  value={event.title}
                  onChange={(e) =>
                    updateEvent({ title: e.target.value })
                  }
                />
              </Field>
      
      
              {/* EVENT STATUS - DISPLAY ONLY */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Event Status
                </label>
      
                <span
                  className="inline-block px-2.5 py-1 rounded border text-xs font-semibold"
                  style={{
                    backgroundColor: eventBadge.bg,
                    color: eventBadge.color,
                    borderColor: eventBadge.border,
                  }}
                >
                  {eventBadge.text}
                </span>
              </div>
      
      
              {/* =====================================================
                  TENTATIVE EVENT
              ====================================================== */}
      
              {event.eventStatus === "Tentative" && (
                <>
                  {/* MONTH + YEAR */}
                  <Field label="Month & Year">
                    <input
                      type="month"
                      className={inputCls}
                      value={event.date}
                      onChange={(e) =>
                        updateEvent({
                          date: e.target.value,
                          dateMode: "month",
                        })
                      }
                    />
                  </Field>
      
      
                  {/* COMMITTEES */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      Committee(s){" "}
                      <span className="font-normal text-gray-400">
                        (optional)
                      </span>
                    </label>
      
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(committeOptions).map(
                        ([key, option]) => {
                          const selected =
                          (event.committees ?? []).includes(key);
      
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() =>
                                updateEvent({
                                  committees: selected
                                    ?   (event.committees ?? []).filter(
                                        (x) => x !== key
                                      )
                                    : [...event.committees, key],
                                })
                              }
                              className={`px-3 py-1.5 rounded border text-xs font-medium transition ${
                                selected
                                  ? "ring-2 ring-indigo-300 opacity-100"
                                  : "opacity-60 hover:opacity-100"
                              }`}
                              style={{
                                backgroundColor: option.bg,
                                color: option.color,
                                borderColor: option.border,
                              }}
                            >
                              {option.text}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </>
              )}
      
      
              {/* =====================================================
                  CONFIRMED EVENT
              ====================================================== */}
      
              {event.eventStatus === "Confirmed" && (
                <>
                  {/* DATE + REGISTRATION STATUS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
                    <Field label="Event Date">
                      <input
                        type="date"
                        className={inputCls}
                        value={event.date}
                        onChange={(e) =>
                          updateEvent({
                            date: e.target.value,
                            dateMode: "exact",
                          })
                        }
                      />
                    </Field>
      
      
                    <Field label="Registration Status">
                      <select
                        className={inputCls}
                        value={event.registrationStatus}
                        onChange={(e) =>
                          updateEvent({
                            registrationStatus:
                              e.target
                                .value as EventItem["registrationStatus"],
                          })
                        }
                      >
                        <option value="Open">
                          Open
                        </option>
      
                        <option value="LimitedSlots">
                          Limited Seats
                        </option>
      
                        <option value="ClosingSoon">
                          Closing Soon
                        </option>
      
                        <option value="Waitlist">
                          Waitlist
                        </option>
      
                        <option value="Full">
                          Full
                        </option>
                      </select>
                    </Field>
      
                  </div>
      
      
                  {/* REGISTRATION LINK */}
                  {event.registrationStatus !== "Full" ? (
                    <Field label="Registration Link">
                      <input
                        className={inputCls}
                        placeholder="https://..."
                        value={event.registrationLink}
                        onChange={(e) =>
                          updateEvent({
                            registrationLink: e.target.value,
                          })
                        }
                      />
                    </Field>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <p className="text-xs text-gray-500 leading-5">
                        Registration is marked as full. The
                        bulletin will show the Secretariat contact
                        option instead of the normal registration
                        button.
                      </p>
                    </div>
                  )}
      
      
                  {/* COMMITTEES */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      Committee(s){" "}
                      <span className="font-normal text-gray-400">
                        (optional)
                      </span>
                    </label>
      
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(committeOptions).map(
                        ([key, option]) => {
                          const selected =
                          (event.committees ?? []).includes(key);
      
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() =>
                                updateEvent({
                                  committees: selected
                                    ? e   (event.committees ?? []).filter(
                                        (x) => x !== key
                                      )
                                    : [...(event.committees ?? []), key],
                                })
                              }
                              className={`px-3 py-1.5 rounded border text-xs font-medium transition ${
                                selected
                                  ? "ring-2 ring-indigo-300 opacity-100"
                                  : "opacity-60 hover:opacity-100"
                              }`}
                              style={{
                                backgroundColor: option.bg,
                                color: option.color,
                                borderColor: option.border,
                              }}
                            >
                              {option.text}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
      
      
                  {/* EVENT DETAILS */}
                  <Field label="Event Details">
                    <RichTextEditor
                      value={event.details}
                      onChange={(html) =>
                        updateEvent({
                          details: html,
                        })
                      }
                    />
                  </Field>
      
      
                  {/* PROGRAMME */}
                  <Field label="Programme Topics">
                    <RichTextEditor
                      value={event.programme}
                      onChange={(html) =>
                        updateEvent({
                          programme: html,
                        })
                      }
                    />
                  </Field>
      
      
                  {/* =====================================================
                      SPEAKERS
                  ====================================================== */}
      
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-600">
                        Speakers
                      </label>
      
                      <button
                        type="button"
                        onClick={() =>
                          updateEvent({
                            speakers: [
                              ...event.speakers,
                              {
                                id: uid(),
                                name: "",
                                designation: "",
                                company: "",
                              },
                            ],
                          })
                        }
                        className="flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900"
                      >
                        <Plus size={14} />
                        Add Speaker
                      </button>
                    </div>
      
      
                    {event.speakers.length === 0 ? (
                      <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                        <p className="text-xs text-gray-400">
                          No speakers added yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {event.speakers.map(
                          (speaker, index) => (
                            <div
                              key={speaker.id}
                              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                            >
                              {/* SPEAKER HEADER */}
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-indigo-700">
                                  Speaker {index + 1}
                                </span>
      
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateEvent({
                                      speakers:
                                        event.speakers.filter(
                                          (x) =>
                                            x.id !==
                                            speaker.id
                                        ),
                                    })
                                  }
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Delete speaker"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
      
      
                              {/* NAME */}
                              <Field label="Name">
                                <input
                                  className={inputCls}
                                  value={speaker.name}
                                  onChange={(e) =>
                                    updateEvent({
                                      speakers:
                                        event.speakers.map(
                                          (x) =>
                                            x.id ===
                                            speaker.id
                                              ? {
                                                  ...x,
                                                  name: e
                                                    .target
                                                    .value,
                                                }
                                              : x
                                        ),
                                    })
                                  }
                                />
                              </Field>
      
      
                              {/* DESIGNATION */}
                              <Field label="Designation">
                                <input
                                  className={inputCls}
                                  value={
                                    speaker.designation
                                  }
                                  onChange={(e) =>
                                    updateEvent({
                                      speakers:
                                        event.speakers.map(
                                          (x) =>
                                            x.id ===
                                            speaker.id
                                              ? {
                                                  ...x,
                                                  designation:
                                                    e
                                                      .target
                                                      .value,
                                                }
                                              : x
                                        ),
                                    })
                                  }
                                />
                              </Field>
      
      
                              {/* COMPANY */}
                              <Field label="Company">
                                <input
                                  className={inputCls}
                                  value={speaker.company}
                                  onChange={(e) =>
                                    updateEvent({
                                      speakers:
                                        event.speakers.map(
                                          (x) =>
                                            x.id ===
                                            speaker.id
                                              ? {
                                                  ...x,
                                                  company:
                                                    e
                                                      .target
                                                      .value,
                                                }
                                              : x
                                        ),
                                    })
                                  }
                                />
                              </Field>
      
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
      
            </div>
          </div>
        </div>
      );
}