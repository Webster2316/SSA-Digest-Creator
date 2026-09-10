import { useState, type Dispatch, type SetStateAction } from "react";
import {
  Plus,
  Save,
  ArrowLeft,
  Loader2,
  Trash2,
  FilePlus2,
  ExternalLink,
} from "lucide-react";
import Field from "../../shared/field";
import RichTextEditor from "../../shared/richTextEditor";
import { uid, inputCls } from "../../shared/utils";
import DocumentUploadModal from "../../shared/documentUploadModal";
import type { EventItem, EventDocument } from "./EventsHome";

interface EventsEditorProps {
  eventId: string;
  events: EventItem[];
  setEvents: Dispatch<SetStateAction<EventItem[]>>;
  onBack: () => void;
  saveStatus: string;
}

type TagStyle = {
  text: string;
  bg: string;
  color: string;
  border: string;
};

const eventStatusOptions: Record<EventItem["eventStatus"], TagStyle> = {
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

export default function EventsEditor({
  eventId,
  events,
  setEvents,
  onBack,
  saveStatus,
}: EventsEditorProps) {
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const event = events.find((ev) => ev.id === eventId);

  if (!event) {
    return <div className="p-6">Event not found.</div>;
  }

  const committees = event.committees ?? [];
  const documents = event.documents ?? [];
  const eventBadge = eventStatusOptions[event.eventStatus] ?? eventStatusOptions.Tentative;
  const registrationBadge =
    registrationStatusOpt[event.registrationStatus] ?? registrationStatusOpt.Open;

  const updateEvent = (updates: Partial<EventItem>) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, ...updates } : ev))
    );
  };

  const addDocuments = (docs: EventDocument[]) => {
    updateEvent({
      documents: [...documents, ...docs],
    });
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

          <h1 className="text-xl font-bold text-indigo-900">Edit Event</h1>

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

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900 mb-5"
        >
          <ArrowLeft size={16} /> Back to Events
        </button>

        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
          <Field label="Event Title">
            <input
              className={inputCls}
              value={event.title ?? ""}
              onChange={(e) => updateEvent({ title: e.target.value })}
            />
          </Field>

          {/* Event Status remains controlled from EventsHome. */}
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
              TENTATIVE
          ====================================================== */}
          {event.eventStatus === "Tentative" && (
            <>
              <Field label="Month & Year">
                <input
                  type="month"
                  className={inputCls}
                  value={event.date ?? ""}
                  onChange={(e) =>
                    updateEvent({
                      date: e.target.value,
                      dateMode: "month",
                    })
                  }
                />
              </Field>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Committee(s) <span className="font-normal text-gray-400">(optional)</span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {Object.entries(committeeOptions).map(([key, option]) => {
                    const selected = committees.includes(key);

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          updateEvent({
                            committees: selected
                              ? committees.filter((item) => item !== key)
                              : [...committees, key],
                          })
                        }
                        className={`px-3 py-1.5 rounded border text-xs font-medium transition ${
                          selected
                            ? "ring-2 ring-indigo-300 opacity-100"
                            : "opacity-55 hover:opacity-100"
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
                  })}
                </div>
              </div>
            </>
          )}

          {/* =====================================================
              CONFIRMED
          ====================================================== */}
          {event.eventStatus === "Confirmed" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Event Date">
                  <input
                    type="date"
                    className={inputCls}
                    value={event.date ?? ""}
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
                    value={event.registrationStatus ?? "Open"}
                    onChange={(e) =>
                      updateEvent({
                        registrationStatus: e.target
                          .value as EventItem["registrationStatus"],
                      })
                    }
                    style={{
                      backgroundColor: registrationBadge.bg,
                      color: registrationBadge.color,
                      borderColor: registrationBadge.border,
                    }}
                  >
                    <option value="Open">Open</option>
                    <option value="LimitedSlots">Limited Seats</option>
                    <option value="ClosingSoon">Closing Soon</option>
                    <option value="Waitlist">Waitlist</option>
                    <option value="Full">Full</option>
                  </select>
                </Field>
              </div>

              {/* Registration link and documents are kept together. */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  {event.registrationStatus !== "Full" ? (
                    <Field label="Registration Link">
                      <input
                        className={inputCls}
                        placeholder="https://..."
                        value={event.registrationLink ?? ""}
                        onChange={(e) =>
                          updateEvent({ registrationLink: e.target.value })
                        }
                      />
                    </Field>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Registration Link
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                        <p className="text-xs text-gray-500 leading-5">
                          Full events will show “Email Secretariat” instead of Register Now.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-600">
                      Documents / Links
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDocModalOpen(true)}
                      className="flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900"
                    >
                      <FilePlus2 size={14} /> Add Document
                    </button>
                  </div>

                  {documents.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-md px-3 py-3 text-xs text-gray-400">
                      No documents added.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc, index) => (
                        <div
                          key={`${doc.url}-${index}`}
                          className="flex items-center gap-2 border border-gray-200 bg-gray-50 rounded-md px-3 py-2"
                        >
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="min-w-0 flex-1 flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:underline"
                          >
                            <ExternalLink size={12} className="shrink-0" />
                            <span className="truncate">{doc.label || "Document"}</span>
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              updateEvent({
                                documents: documents.filter((_, i) => i !== index),
                              })
                            }
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Remove document"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Committee(s) <span className="font-normal text-gray-400">(optional)</span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {Object.entries(committeeOptions).map(([key, option]) => {
                    const selected = committees.includes(key);

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          updateEvent({
                            committees: selected
                              ? committees.filter((item) => item !== key)
                              : [...committees, key],
                          })
                        }
                        className={`px-3 py-1.5 rounded border text-xs font-medium transition ${
                          selected
                            ? "ring-2 ring-indigo-300 opacity-100"
                            : "opacity-55 hover:opacity-100"
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
                  })}
                </div>
              </div>

              <Field label="Event Details">
                <RichTextEditor
                  value={event.details ?? ""}
                  onChange={(html) => updateEvent({ details: html })}
                />
              </Field>

              <Field label="Programme Topics">
                <RichTextEditor
                  value={event.programme ?? ""}
                  onChange={(html) => updateEvent({ programme: html })}
                />
              </Field>

              <Field label="Speakers">
  <RichTextEditor
    value={event.speakers ?? ""}
    onChange={(html) =>
      updateEvent({
        speakers: html,
      })
    }
  />
</Field>
            </>
          )}
        </div>
      </div>

      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onAdd={addDocuments}
      />
    </div>
  );
}
