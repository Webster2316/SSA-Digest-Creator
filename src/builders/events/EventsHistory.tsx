import { useState, useEffect } from "react";
import { Archive, RotateCcw, Copy, SquareArrowOutUpRight, } from "lucide-react";


type EventArchive = {
  id: number;
  builder_key: string;
  title: string;
  event_data: string | Record<string, any>;
  archived_at: string;
};

type EventHistoryProps = {
  builderKey: string;
  viewPastEventDetails: (eventData: any) => void;
  onCopyToCurrent: (eventData: any) => void;
  onRestoreEvent: (archiveId: number, eventData: any) => void;
};

export default function EventsHistory({
  builderKey,
  onCopyToCurrent,
  onRestoreEvent,
  viewPastEventDetails,
}: EventHistoryProps) {
  const [records, setRecords] = useState<EventArchive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/events-history?key=${builderKey}`
        );

        if (res.ok) {
          const data = await res.json();
          setRecords(data);
        }
      } catch (e) {
        console.error("Failed to load event history:", e);
      }

      setLoading(false);
    };

    loadHistory();
  }, [builderKey]);

  const getEventData = (record: EventArchive) => {
    if (!record.event_data) return null;
  
    if (typeof record.event_data === "object") {
      return record.event_data;
    }
  
    try {
      return JSON.parse(record.event_data);
    } catch (e) {
      console.error("Failed to parse archived event:", e);
      return null;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center gap-1.5 mb-3">
        <Archive size={14} className="text-gray-500" />

        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Event History
        </span>
      </div>

      {loading && (
        <p className="text-xs text-gray-400">
          Loading…
        </p>
      )}

      {!loading && records.length === 0 && (
        <p className="text-xs text-gray-400">
          No completed events yet.
        </p>
      )}

      <div className="space-y-2">
        {records.map((record) => {
          const eventData = getEventData(record);

          return (
            <div
              key={record.id}
              className="border border-gray-200 rounded-md bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {record.title || "Untitled Event"}
                  </div>

                  <div className="text-xs text-gray-400 mt-1">
                    Completed{" "}
                    {new Date(
                      record.archived_at
                    ).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                <button
                          type="button"
                          onClick={() => {
                          if (eventData) {
                            viewPastEventDetails(eventData);
                          }}}

                          className="p-1.5 text-gray-400 hover:text-indigo-700 hover:bg-gray-100 rounded"
                          title="View event"
                        >
                          <SquareArrowOutUpRight size={16} />
                        </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (eventData) {
                        onCopyToCurrent(eventData);
                      }
                    }}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                    title="Copy to current"
                  >
                    <Copy size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (eventData) {
                        onRestoreEvent(
                          record.id,
                          eventData
                        );
                      }
                    }}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                    title="Restore event"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}