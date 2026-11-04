import { Plus, Trash2, Copy } from "lucide-react";
import { UpcomingEvent } from "./EventsHome";
import { uid } from "../../shared/utils";

type UpcomingListProps = {
  upcomingList: UpcomingEvent[];
  setUpcomingList: React.Dispatch<
    React.SetStateAction<UpcomingEvent[]>
  >;
};

type TagStyle = {
  text: string;
  bg: string;
  color: string;
  border: string;
};
const organiserOptions: { value: EventOrganiser; label: string }[] = [
  { value: "Organising", label: "SSA" },
  { value: "Industry", label: "External" },
];
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

/* ================================================================ */
/* SORTING                                                          */
/* ================================================================ */

// Convert different date formats into a comparable date string.
// Exact:   2026-11-15
// Range:   2026-11-15 (uses start date)
// Month:   2026-11
// Quarter: 2026-Q1
// TBC:     sorted last

function getSortDate(event: UpcomingEvent): string {
  const { date, dateMode } = event;

  if (!date || dateMode === "tbc") {
    return "9999-99-99";
  }

  if (dateMode === "quarter") {
    const [year, quarter] = date.split("-");

    const quarterMonths: Record<string, string> = {
      Q1: "01",
      Q2: "04",
      Q3: "07",
      Q4: "10",
    };

    return `${year}-${quarterMonths[quarter] ?? "99"}-01`;
  }

  if (dateMode === "month") {
    return `${date}-01`;
  }

  // Exact dates and date ranges both use their start date.
  return date;
}

function sortEventsByDate(events: UpcomingEvent[]) {
  return [...events].sort((a, b) => {
    return getSortDate(a).localeCompare(getSortDate(b));
  });
}

/* ================================================================ */
/* COMPONENT                                                        */
/* ================================================================ */

export default function UpcomingList({
  upcomingList,
  setUpcomingList,
}: UpcomingListProps) {

  const sortedEv = sortEventsByDate(upcomingList);
  const organiserType: EventOrganiser = event.organiserType ?? "Industry";
  /* ---------------- ADD EVENT ---------------- */

  function handleAddEvent() {
    setUpcomingList((prev) => [
      ...prev,
      {
        id: uid(),
        title: "",
        date: "",
        endDate: "",
        dateMode: "exact",
        eventStatus: "Tentative",
      },
    ]);
  }

  /* ---------------- UPDATE EVENT ---------------- */

  function updateEvent(
    id: string,
    changes: Partial<UpcomingEvent>
  ) {
    setUpcomingList((prev) =>
      prev.map((event) =>
        event.id === id
          ? { ...event, ...changes }
          : event
      )
    );
  }

  /* ---------------- CHANGE DATE MODE ---------------- */

  function setMode(
    id: string,
    dateMode: UpcomingEvent["dateMode"]
  ) {
    updateEvent(id, {
      dateMode,
      date: "",
      endDate: "",
    });
  }

  /* ---------------- COPY EVENT ---------------- */

  function copyItem(item: UpcomingEvent) {
    const copy = {
      ...item,
      id: uid(),
    };

    setUpcomingList((prev) => [...prev, copy]);
  }

  /* ---------------- DELETE EVENT ---------------- */

  function handleDeleteEvent(id: string) {
    setUpcomingList((prev) =>
      prev.filter((event) => event.id !== id)
    );
  }

  /* ================================================================ */
  /* UI                                                               */
  /* ================================================================ */

  return (
    <div className="space-y-4">

      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Upcoming Events List
          </h2>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-500">
          Events will be sorted by date in the final output.
        </p>
      </div>

      {/* EMPTY STATE */}

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

        /* EVENT CARDS */

        <div className="space-y-3">

          {sortedEv.map((event, index) => {

            const statusStyle =
              eventStatusOptions[event.eventStatus];

            return (

              <div
                key={event.id}
                className="rounded-lg border bg-white p-4"
              >

                {/* CARD HEADER */}

                <div className="mb-3 flex items-center justify-between">

                  <span className="text-sm font-medium text-gray-500">
                    Event {index + 1}
                  </span>

                  <div className="flex items-center">

                    {/* COPY */}

                    <button
                      type="button"
                      onClick={() => copyItem(event)}
                      className="rounded-md p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-700"
                      aria-label={`Copy ${event.title || "event"}`}
                      title="Copy event"
                    >
                      <Copy size={16} />
                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${event.title || "event"}`}
                      title="Delete event"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>
                </div>

                {/* EVENT FIELDS */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                  {/* EVENT TITLE */}

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

                  {/* DATE DISPLAY */}

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Date Display
                    </label>

                    <div className="flex flex-wrap gap-4">

                      {/* EXACT DATE */}

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`dateMode-${event.id}`}
                          value="exact"
                          checked={event.dateMode === "exact"}
                          onChange={() =>
                            setMode(event.id, "exact")
                          }
                        />
                        Exact Date
                      </label>

                      {/* DATE RANGE */}

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`dateMode-${event.id}`}
                          value="range"
                          checked={event.dateMode === "range"}
                          onChange={() =>
                            setMode(event.id, "range")
                          }
                        />
                        Date Range
                      </label>

                      {/* MONTH */}

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`dateMode-${event.id}`}
                          value="month"
                          checked={event.dateMode === "month"}
                          onChange={() =>
                            setMode(event.id, "month")
                          }
                        />
                        Month &amp; Year
                      </label>

                      {/* QUARTER */}

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`dateMode-${event.id}`}
                          value="quarter"
                          checked={event.dateMode === "quarter"}
                          onChange={() =>
                            setMode(event.id, "quarter")
                          }
                        />
                        Quarter &amp; Year
                      </label>

                      {/* TBC */}

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`dateMode-${event.id}`}
                          value="tbc"
                          checked={event.dateMode === "tbc"}
                          onChange={() =>
                            setMode(event.id, "tbc")
                          }
                        />
                        TBC
                      </label>

                    </div>
                  </div>

                  {/* DATE INPUT */}

                  <div>

                    <label className="mb-1 block text-sm font-medium">
                      Date
                    </label>

                    {/* EXACT DATE */}

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

                    {/* DATE RANGE */}

                    {event.dateMode === "range" && (

                      <div className="space-y-2">

                        <div>
                          <label className="mb-1 block text-xs text-gray-500">
                            Start date
                          </label>

                          <input
                            type="date"
                            value={event.date}
                            onChange={(e) => {
                              const value = e.target.value;

                              updateEvent(event.id, {
                                date: value,
                                endDate:
                                  event.endDate &&
                                  value > event.endDate
                                    ? ""
                                    : event.endDate,
                              });
                            }}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-gray-500">
                            End date
                          </label>

                          <input
                            type="date"
                            value={event.endDate ?? ""}
                            min={
                              event.date
                                ? new Date(
                                    new Date(event.date + "T12:00:00").getTime() +
                                    86400000
                                  ).toISOString().slice(0, 10)
                                : undefined
                            }
                            disabled={!event.date}
                            onChange={(e) =>
                              updateEvent(event.id, {
                                endDate: e.target.value,
                              })
                            }
                            className="w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100"
                          />
                        </div>

                      </div>

                    )}

                    {/* MONTH & YEAR */}

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

                    {/* QUARTER & YEAR */}

                    {event.dateMode === "quarter" && (

                      <div className="flex gap-2">

                        <select
                          value={event.date.split("-")[1] ?? ""}
                          onChange={(e) => {
                            const year =
                              event.date.split("-")[0] ||
                              new Date().getFullYear().toString();

                            updateEvent(event.id, {
                              date: e.target.value
                                ? `${year}-${e.target.value}`
                                : "",
                            });
                          }}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        >
                          <option value="">
                            Select quarter
                          </option>

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
                            const quarter =
                              event.date.split("-")[1] || "Q1";

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

                    {/* TBC */}

                    {event.dateMode === "tbc" && (

                      <p className="text-sm text-gray-500">
                        Date to be confirmed.
                      </p>

                    )}

                  </div>

                  {/* EVENT STATUS */}

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
                      <option value="Tentative">
                        Tentative
                      </option>

                      <option value="Confirmed">
                        Confirmed
                      </option>
                    </select>

                  </div>
                  <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Organiser Type
                </label>

                <div className="inline-flex rounded border border-gray-300 overflow-hidden">
                  {organiserOptions.map((option) => {
                    const active = organiserType === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateEvent({ organiserType: option.value })
                        }
                        className={`px-3 py-1 text-xs font-semibold transition ${
                          active
                            ? "bg-indigo-700 text-white"
                            : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
                </div>

              </div>

            );

          })}

        </div>

      )}

      {/* ADD EVENT BUTTON */}

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
