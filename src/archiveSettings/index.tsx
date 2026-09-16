import { useState, useEffect } from "react";
import { Archive, CalendarDays, Database, Loader2, RefreshCcw, Trash2  } from "lucide-react";
import useConfirmDelete from "../shared/useConfirmDelete";

type IssueArchive = {
    id: number;
    builder_key: string;
    issue_label: string;
    html: string;
    archived_at:  string;
};

type EventArchive = {
    id: number;
    builder_key: string;
   title: string;
    event_data: string;
    archived_at:  string;
}

export default function Admin() {
    const { confirmDelete, deleteModal } = useConfirmDelete();  
    const [tab, setTab] = useState<"Issues" | "Events">("Issues");
    const [issueCleanUpAge, setIssueCleanUpAge] = useState<"6months" | "1year" | "custom">("6months");
    const [eventCleanUpAge, setEventCleanUpAge] = useState<"3months" |"6months" | "9months" |"1year" | "custom">("3months");
    const [issueRecords, setIssueRecords] = useState<IssueArchive[]>([]);
    const [eventRecords, setEventRecords] = useState<EventArchive[]>([]);
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [issueBuilderFilter, setIssueBuilderFilter] = useState("all");

const loadIssueArchives = async() => {
try {
    const res = await fetch(`/api/dataManagement?type=issues&builderKey=${issueBuilderFilter}`,
    {
      method: "GET",
    });

    if (!res.ok) {
        console.error("Failed to load issue archive");
        return;
    }

    const data = await res.json();
    setIssueRecords(data);
} catch(e) {
    console.error("Failed to load issue archives:", e);
}
}

const loadEventsArchive = async() => {
    try {
        const res = await fetch(   `/api/dataManagement?type=events&builderKey=all`,
        {
          method: "GET",
        });

        if (!res.ok) {
            console.error("Failed to load event archive");
            return;
        }

        const data = await res.json();
        setEventRecords(data);
    } catch(e) {
        console.error("Failed to load event archive:", e);
    }
    }

useEffect(() => 
{
    if (tab === "Issues") {
        loadIssueArchives();
    } else if( tab === "Events") {
        loadEventsArchive();
    }
},  [tab, issueBuilderFilter]
);

    const refereshCurrentTab = async() => {
        if (tab === "Issues") {
            loadIssueArchives();
        } else if( tab === "Events") {
            loadEventsArchive();
        }
    };
    
const  deleteArchiveRecord = async(type: "issues" | "events", id: number) => {
     try {

        const res = await fetch(`/api/dataManagement?type=${type}&id=${id}}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            console.error("Failed to delete item(s)");
            return;
        }

        if (type === "issues") {
            setIssueRecords((prev) => 
                prev.filter((record) => record.id !== id)
            );
        } else {
            setEventRecords((prev) => 
            prev.filter((record) => record.id !== id));
        }
     } catch(e) {
            console.error("Failed to delete item(s):", e);
     }
 };


 return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto p-4">
  
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-5">
          <img
            src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
            alt="SSA Logo"
            className="h-8 w-auto"
          />
  
          <div>
            <h1 className="text-xl font-bold text-indigo-900">
              Data Management
            </h1>
          </div>
  
          <button
            type="button"
            onClick={refereshCurrentTab}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 bg-white rounded hover:bg-gray-50"
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
  
  
        {/* TABS */}
        <div className="flex gap-1 mb-5 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab("Issues")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 ${
              tab === "Issues"
                ? "border-indigo-700 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Archive size={15} />
            Issue Management
          </button>
  
          <button
            type="button"
            onClick={() => setTab("Events")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 ${
              tab === "Events"
                ? "border-indigo-700 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <CalendarDays size={15} />
            Event Management
          </button>
        </div>
  
  
        {/* =============================
            ISSUE MANAGEMENT
        ============================== */}
        {tab === "Issues" && (
          <div className="space-y-4">
  
            {/* AUTOMATIC RETENTION */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Database
                  size={18}
                  className="text-indigo-700 mt-0.5"
                />
  
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    Automatic Retention
                  </h2>
  
                  <p className="text-xs text-gray-500 mt-1">
                    Archived issues that are 2 years old or older
                    are automatically deleted.
                  </p>
                </div>
              </div>
            </div>
  
  
            {/* CLEANUP CONTROLS */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">
                Manual Cleanup
              </h2>
  
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  
                {/* Builder filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Builder Type
                  </label>
  
                  <select
                    value={issueBuilderFilter}
                    onChange={(e) =>
                      setIssueBuilderFilter(e.target.value)
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="all">All Issues</option>
                    <option value="ssa-digest-data">
                      Weekly Digest
                    </option>
                    <option value="training-bulletin-data">
                      Training Bulletin
                    </option>
                    <option value="ai-bulletin-data">
                      AI Bulletin
                    </option>
                  </select>
                </div>
  
  
                {/* Age filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Delete Records
                  </label>
  
                  <select
                    value={issueCleanUpAge}
                    onChange={(e) =>
                      setIssueCleanUpAge(
                        e.target.value as
                          | "6months"
                          | "1year"
                          | "custom"
                      )
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="6months">
                      6 months or older
                    </option>
                    <option value="1year">
                      1 year or older
                    </option>
                    <option value="custom">
                      Custom range
                    </option>
                  </select>
                </div>
              </div>
  
  
              {/* CUSTOM RANGE */}
              {issueCleanUpAge === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      From
                    </label>
  
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) =>
                        setCustomStartDate(e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      To
                    </label>
  
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) =>
                        setCustomEndDate(e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
  
  
            {/* ISSUE LIST */}
            <div className="space-y-2">
              {issueRecords.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-400">
                    No archived issues found.
                  </p>
                </div>
              ) : (
                issueRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">
                        {record.issue_label || "Untitled Issue"}
                      </div>
  
                      <div className="text-xs text-gray-400 mt-1">
                        {record.builder_key}
                        {" · "}
                        Archived{" "}
                        {new Date(
                          record.archived_at
                        ).toLocaleDateString()}
                      </div>
                    </div>
  
                    <button
                      type="button"
                      onClick={() =>
                        confirmDelete({
                          itemType: "archived issue",
                          itemName:
                            record.issue_label || "Untitled Issue",
                          action: () =>
                            deleteArchiveRecord(
                              "issues",
                              record.id
                            ),
                        })
                      }
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete archived issue"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
  
  
        {/* =============================
            EVENT MANAGEMENT
        ============================== */}
        {tab === "Events" && (
          <div className="space-y-4">
  
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Database
                  size={18}
                  className="text-indigo-700 mt-0.5"
                />
  
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    Automatic Retention
                  </h2>
  
                  <p className="text-xs text-gray-500 mt-1">
                    Completed events that are 2 years old or older
                    are automatically deleted.
                  </p>
                </div>
              </div>
            </div>
  
  
            {/* EVENT CLEANUP */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">
                Manual Cleanup
              </h2>
  
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Delete Records
                </label>
  
                <select
                  value={eventCleanUpAge}
                  onChange={(e) =>
                    setEventCleanUpAge(
                      e.target.value as
                        | "3months"
                        | "6months"
                        | "9months"
                        | "1year"
                        | "custom"
                    )
                  }
                  className="w-full md:w-64 border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                >
                  <option value="3months">
                    3 months or older
                  </option>
                  <option value="6months">
                    6 months or older
                  </option>
                  <option value="9months">
                    9 months or older
                  </option>
                  <option value="1year">
                    1 year or older
                  </option>
                  <option value="custom">
                    Custom range
                  </option>
                </select>
              </div>
  
  
              {eventCleanUpAge === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) =>
                      setCustomStartDate(e.target.value)
                    }
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  />
  
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) =>
                      setCustomEndDate(e.target.value)
                    }
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
  
  
            {/* EVENT LIST */}
            <div className="space-y-2">
              {eventRecords.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-400">
                    No archived events found.
                  </p>
                </div>
              ) : (
                eventRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">
                        {record.title || "Untitled Event"}
                      </div>
  
                      <div className="text-xs text-gray-400 mt-1">
                        Archived{" "}
                        {new Date(
                          record.archived_at
                        ).toLocaleDateString()}
                      </div>
                    </div>
  
                    <button
                      type="button"
                      onClick={() =>
                        confirmDelete({
                          itemType: "archived event",
                          itemName:
                            record.title || "Untitled Event",
                          action: () =>
                            deleteArchiveRecord(
                              "events",
                              record.id
                            ),
                        })
                      }
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete archived event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
  
        {deleteModal}
      </div>
    </div>
  );


}