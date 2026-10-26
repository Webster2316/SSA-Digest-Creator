import { Dispatch, SetStateAction, useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { UpcomingEvent } from "./EventsHome";
import { uid } from "../../shared/utils"; 

type UpcomingListProps = {
    upcomingList: UpcomingEvent[];
    setUpcominList: React.Dispatch<React.SetStateAction<UpcomingEvent[]>
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
        //checks for empty fields
        if(!a.date) return 1;
        if(!b.date)return -1;

        //compare method
        return a.date.localCompare(b.date);
    })
}

export default function UpcomingList({ upcomingList, setUpcomingList }: UpcomingListProps) {
    const sortedEv = sortEventsByDate(upcomingList);
    // const registrationBadge =
    // eventStatusOptions[upcomingList.eventStatus] ?? eventStatusOptions.Open;

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
              <p className="text-sm text-gray-500">
                Manage upcoming events displayed in your email.
              </p>
            </div>
    
            <button
              type="button"
              onClick={handleAddEvent}
              className="rounded-md bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-800"
            >
              <Plus size={16} className="mr-2 inline" />
              Add Event
            </button>
          </div>
    
          {sortedEvents.length === 0 ? (
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
              {sortedEvents.map((event, index) => {
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
                        <label className="mb-1 block text-sm font-medium">
                          Date
                        </label>
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
        </div>
      );
    }