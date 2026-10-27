import { Dispatch, SetStateAction, useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { UpcomingEvent } from "./EventsHome";
import { uid } from "../../shared/utils"; 

type UpcomingListProps = {
    upcomingList: UpcomingEvent[];
    setUpcomingList: React.Dispatch<React.SetStateAction<UpcomingEvent[]>
    >;
}
type TagStyle = {
    text: string;
    bg: string;
    color: string;
    border: string;
  };
  
  const eventStatusOptions: Record<
  UpcomingEvent["eventStatus"],
  TagStyle
> = {
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

//Auto order by date!
function sortEventsByDate(event: UpcomingEvent[]) {
    return [...event].sort((a,b) => {
        if (!a.date && !b.date) return 0;
        //checks for empty fields
        if(!a.date) return 1;
        if(!b.date)return -1;

        //compare method
        return a.date.localeCompare(b.date);
    })
}

export default function UpcomingList({ upcomingList, setUpcomingList }: UpcomingListProps) {
    const sortedEv = sortEventsByDate(upcomingList);
    function handleAddEvent() {
        setUpcomingList((prev) => [
            ...prev,
            {
                id:uid(),
                title: "",
                date: "",
                eventStatus: "Tentative",
            },
        ]);
    }

    function updateEvent(id: string, changes: Partial<UpcomingEvent>) {
setUpcomingList((prev) =>
prev.map((event) =>
event.id === id
  ? { ...event, ...changes }
  : event
)
);
    }

    const copyItem = (item: any) => {
      const copy = { ...item, id: uid() };
    
      setUpcomingList((prev) => [...prev, copy]);
    };
    
    function handleDeleteEvent(id: string) {
      setUpcomingList((prev) =>
        prev.filter((event) => event.id !== id)
        );

    }
    return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Upcoming Events List
              </h2>
            </div>
          </div>
          <div>
          <p>events will be sorted by date in the final output.</p>
          </div>
    
          {sortedEv.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-gray-500">
                No upcoming events added yet.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Click Add Event to create your first entry.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedEv.map((event, index) => {
                const statusStyle =
                  eventStatusOptions[event.eventStatus];
    
                return (
                  <div
                    key={event.id}
                    className="rounded-lg border bg-white p-4"
                  >
                 <div className="mb-3 flex items-center justify-between">
  <span className="text-sm font-medium text-gray-500">
    Event {index + 1}
  </span>

  <div className="flex items-center">
    <button
      type="button"
      onClick={() => copyItem(event)}
      className="rounded-md p-2 text-red-600 hover:bg-red-50"
      aria-label={`Copy ${event.title || "event"}`}
      title="Copy event"
    >
      <Copy size={16} />
    </button>

    <button
      type="button"
      onClick={() => handleDeleteEvent(event.id)}
      className="rounded-md p-2 text-red-600 hover:bg-red-50"
      aria-label={`Delete ${event.title || "event"}`}
      title="Delete event"
    >
      <Trash2 size={16} />
    </button>
  </div>
</div>
    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Event Title
                        </label>
                        <input
                          type="text"
                          value={event.title}
                          onChange={(e) =>
                            updateEvent(event.id, {
                              title: e.target.value,
                            })
                          }
                          placeholder="Enter event title"
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
  <label className="mb-2 block text-sm font-medium">
    Date Display
  </label>

  <div className="flex flex-wrap gap-4">
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="dateMode"
        value="exact"
        checked={event.dateMode === "exact"}
        onChange={() => updateEvent(event.id, { dateMode: "exact" })}
      />
      Exact Date
    </label>

    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="dateMode"
        value="month"
        checked={event.dateMode === "month"}
        onChange={() => updateEvent(event.id,{ dateMode: "month" })}
      />
      Month & Year
    </label>

    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="dateMode"
        value="quarter"
        checked={event.dateMode === "quarter"}
        onChange={() => updateEvent(event.id,{ dateMode: "quarter" })}
      />
      Quarter & Year
    </label>
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="dateMode"
        value="tbc"
        checked={event.dateMode === "tbc"}
        onChange={() => updateEvent(event.id,{ dateMode: "tbc" })}
      />
     TBC
    </label>
  </div>
</div>
                      
<div>
  <label className="mb-1 block text-sm font-medium">
    Date
  </label>

  {event.dateMode === "exact" && (
    <input
      type="date"
      value={event.date}
      onChange={(e) =>
        updateEvent(event.id, {
          date: e.target.value,
        })
      }
      className="w-full rounded-md border px-3 py-2 text-sm"
    />
  )}

  {event.dateMode === "month" && (
    <input
      type="month"
      value={event.date}
      onChange={(e) =>
        updateEvent(event.id, {
          date: e.target.value,
        })
      }
      className="w-full rounded-md border px-3 py-2 text-sm"
    />
  )}

  {event.dateMode === "quarter" && (
    <div className="flex gap-2">
      <select
        value={event.date.split("-")[1] ?? ""}
        onChange={(e) => {
          const year = event.date.split("-")[0] || new Date().getFullYear().toString();

          updateEvent(event.id, {
            date: `${year}-${e.target.value}`,
          });
        }}
        className="w-full rounded-md border px-3 py-2 text-sm"
      >
        <option value="">Select quarter</option>
        <option value="Q1">Q1</option>
        <option value="Q2">Q2</option>
        <option value="Q3">Q3</option>
        <option value="Q4">Q4</option>
      </select>

      <input
        type="number"
        min="2020"
        max="2100"
        placeholder="Year"
        value={event.date.split("-")[0] ?? ""}
        onChange={(e) => {
          const quarter = event.date.split("-")[1] || "Q1";

          updateEvent(event.id, {
            date: e.target.value
              ? `${e.target.value}-${quarter}`
              : "",
          });
        }}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
  )}

  {event.dateMode === "tbc" && (
    <p className="text-sm text-gray-500">
      Date to be confirmed.
    </p>
  )}
</div>
    
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Event Status
                        </label>
                        <select
                          value={event.eventStatus}
                          onChange={(e) =>
                            updateEvent(event.id, {
                              eventStatus: e.target.value as UpcomingEvent["eventStatus"],
                            })
                          }
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                            borderColor: statusStyle.border,
                          }}
                        >
                          <option value="Tentative">Tentative</option>
                          <option value="Confirmed">Confirmed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            <button
              type="button"
              onClick={handleAddEvent}
              className="rounded-md bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-800"
            >
              <Plus size={16} className="mr-2 inline" />
              Add Event
            </button>
        </div>
      );
    }