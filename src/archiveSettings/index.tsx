import { useEffect, useState } from "react";
import {
  Archive,
  CalendarDays,
  Database,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import useConfirmDelete from "../shared/useConfirmDelete";

type IssueArchive = {
  id: number;
  builder_key: string;
  issue_label: string;
  html: string;
  archived_at: string;
};

type EventArchive = {
  id: number;
  builder_key: string;
  title: string;
  event_data: string;
  archived_at: string;
};

type IssueCleanupAge = "6months" | "1year" | "custom";

type EventCleanupAge =
  | "3months"
  | "6months"
  | "9months"
  | "1year"
  | "custom";

export default function Admin() {
  const { confirmDelete, deleteModal } = useConfirmDelete();

  const [tab, setTab] = useState<"Issues" | "Events">("Issues");

  const [issueCleanUpAge, setIssueCleanUpAge] =
    useState<IssueCleanupAge>("6months");

  const [eventCleanUpAge, setEventCleanUpAge] =
    useState<EventCleanupAge>("3months");

  const [issueRecords, setIssueRecords] = useState<IssueArchive[]>([]);
  const [eventRecords, setEventRecords] = useState<EventArchive[]>([]);

  const [selectedIssueIds, setSelectedIssueIds] = useState<number[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);

  const [issueCustomStartDate, setIssueCustomStartDate] = useState("");
  const [issueCustomEndDate, setIssueCustomEndDate] = useState("");

  const [eventCustomStartDate, setEventCustomStartDate] = useState("");
  const [eventCustomEndDate, setEventCustomEndDate] = useState("");

  const [issueBuilderFilter, setIssueBuilderFilter] = useState("all");

  // =====================================================
  // LOAD ISSUE ARCHIVES
  // =====================================================

  const loadIssueArchives = async () => {
    try {
      const res = await fetch(
        `/api/dataManagement?type=issues&builderKey=${encodeURIComponent(
          issueBuilderFilter
        )}`
      );

      if (!res.ok) {
        console.error("Failed to load issue archive");
        return;
      }

      const data = await res.json();
      setIssueRecords(data);
    } catch (e) {
      console.error("Failed to load issue archives:", e);
    }
  };

  // =====================================================
  // LOAD EVENT ARCHIVES
  // =====================================================

  const loadEventsArchive = async () => {
    try {
      const res = await fetch(
        "/api/dataManagement?type=events&builderKey=all"
      );

      if (!res.ok) {
        console.error("Failed to load event archive");
        return;
      }

      const data = await res.json();
      setEventRecords(data);
    } catch (e) {
      console.error("Failed to load event archive:", e);
    }
  };

  // =====================================================
  // LOAD CURRENT TAB
  // =====================================================

  useEffect(() => {
    if (tab === "Issues") {
      loadIssueArchives();
    } else {
      loadEventsArchive();
    }
  }, [tab, issueBuilderFilter]);

  // =====================================================
  // REFRESH
  // =====================================================

  const refreshCurrentTab = async () => {
    if (tab === "Issues") {
      await loadIssueArchives();
    } else {
      await loadEventsArchive();
    }
  };

  // =====================================================
  // DELETE ONE RECORD
  // =====================================================

  const deleteArchiveRecord = async (
    type: "issues" | "events",
    id: number
  ) => {
    try {
      const res = await fetch(
        `/api/dataManagement?type=${type}&id=${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        console.error("Failed to delete archive record");
        return;
      }

      if (type === "issues") {
        setIssueRecords((prev) =>
          prev.filter((record) => record.id !== id)
        );

        setSelectedIssueIds((prev) =>
          prev.filter((selectedId) => selectedId !== id)
        );
      } else {
        setEventRecords((prev) =>
          prev.filter((record) => record.id !== id)
        );

        setSelectedEventIds((prev) =>
          prev.filter((selectedId) => selectedId !== id)
        );
      }
    } catch (e) {
      console.error("Failed to delete archive record:", e);
    }
  };

  // =====================================================
  // CHECK WHETHER RECORD MATCHES CLEANUP RANGE
  // =====================================================

  const matchesCleanupRange = (
    archivedAt: string,
    range: string,
    startDate: string,
    endDate: string
  ) => {
    const archived = new Date(archivedAt);

    if (Number.isNaN(archived.getTime())) {
      return false;
    }

    // Custom range
    if (range === "custom") {
      if (!startDate || !endDate) {
        return false;
      }

      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59.999`);

      return archived >= start && archived <= end;
    }

    const monthsMap: Record<string, number> = {
      "3months": 3,
      "6months": 6,
      "9months": 9,
      "1year": 12,
    };

    const months = monthsMap[range];

    if (!months) {
      return false;
    }

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    // "6 months or older" means archived before/equal cutoff
    return archived <= cutoff;
  };

  // =====================================================
  // FILTERED RECORDS
  // =====================================================

  const filteredIssueRecords = issueRecords.filter((record) =>
    matchesCleanupRange(
      record.archived_at,
      issueCleanUpAge,
      issueCustomStartDate,
      issueCustomEndDate
    )
  );

  const filteredEventRecords = eventRecords.filter((record) =>
    matchesCleanupRange(
      record.archived_at,
      eventCleanUpAge,
      eventCustomStartDate,
      eventCustomEndDate
    )
  );

  // =====================================================
  // AUTOMATICALLY SELECT ISSUE RANGE
  // =====================================================

  useEffect(() => {
    const matchingIds = issueRecords
      .filter((record) =>
        matchesCleanupRange(
          record.archived_at,
          issueCleanUpAge,
          issueCustomStartDate,
          issueCustomEndDate
        )
      )
      .map((record) => record.id);

    setSelectedIssueIds(matchingIds);
  }, [
    issueCleanUpAge,
    issueRecords,
    issueCustomStartDate,
    issueCustomEndDate,
  ]);

  // =====================================================
  // AUTOMATICALLY SELECT EVENT RANGE
  // =====================================================

  useEffect(() => {
    const matchingIds = eventRecords
      .filter((record) =>
        matchesCleanupRange(
          record.archived_at,
          eventCleanUpAge,
          eventCustomStartDate,
          eventCustomEndDate
        )
      )
      .map((record) => record.id);

    setSelectedEventIds(matchingIds);
  }, [
    eventCleanUpAge,
    eventRecords,
    eventCustomStartDate,
    eventCustomEndDate,
  ]);

  // =====================================================
  // TOGGLE ONE ISSUE
  // =====================================================

  const toggleIssueSelection = (id: number) => {
    setSelectedIssueIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  // =====================================================
  // TOGGLE ONE EVENT
  // =====================================================

  const toggleEventSelection = (id: number) => {
    setSelectedEventIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  // =====================================================
  // DELETE MULTIPLE SELECTED RECORDS
  // =====================================================

  const deleteSelectedArchives = async (
    type: "issues" | "events"
  ) => {
    const ids =
      type === "issues"
        ? selectedIssueIds
        : selectedEventIds;

    if (ids.length === 0) {
      return;
    }

    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(
              `/api/dataManagement?type=${type}&id=${id}`,
              {
                method: "DELETE",
              }
            );

            return {
              id,
              ok: res.ok,
            };
          } catch {
            return {
              id,
              ok: false,
            };
          }
        })
      );

      const successfullyDeletedIds = results
        .filter((result) => result.ok)
        .map((result) => result.id);

      if (type === "issues") {
        setIssueRecords((prev) =>
          prev.filter(
            (record) =>
              !successfullyDeletedIds.includes(record.id)
          )
        );

        setSelectedIssueIds([]);
      } else {
        setEventRecords((prev) =>
          prev.filter(
            (record) =>
              !successfullyDeletedIds.includes(record.id)
          )
        );

        setSelectedEventIds([]);
      }

      const failedCount =
        ids.length - successfullyDeletedIds.length;

      if (failedCount > 0) {
        console.error(
          `${failedCount} archive record(s) could not be deleted`
        );
      }
    } catch (e) {
      console.error("Failed to delete selected archives:", e);
    }
  };

  // =====================================================
  // BUILDER LABEL
  // =====================================================

  const getBuilderLabel = (builderKey: string) => {
    const labels: Record<string, string> = {
      "ssa-digest-data": "Weekly Digest",
      "training-bulletin-data": "Training Bulletin",
      "ai-bulletin-data": "AI Bulletin",
      "events-builder-data": "Events",
    };

    return labels[builderKey] ?? builderKey;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto p-4">
        {/* =====================================================
            HEADER
        ====================================================== */}

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
            onClick={refreshCurrentTab}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 bg-white rounded hover:bg-gray-50"
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>

        {/* =====================================================
            TABS
        ====================================================== */}

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

        {/* =====================================================
            ISSUE MANAGEMENT
        ====================================================== */}

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
                    Archived issues will be automatically deleted
                    once they are 2 years old or older.
                  </p>
                </div>
              </div>
            </div>

            {/* CLEANUP CONTROLS */}

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    Manual Cleanup
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    Matching records are automatically selected.
                    Uncheck any records you want to keep.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={selectedIssueIds.length === 0}
                  onClick={() =>
                    confirmDelete({
                      itemType: "archived issues",
                      itemName: `${selectedIssueIds.length} selected record${
                        selectedIssueIds.length === 1 ? "" : "s"
                      }`,
                      action: () =>
                        deleteSelectedArchives("issues"),
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                  Delete Selected ({selectedIssueIds.length})
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BUILDER FILTER */}

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

                {/* CLEANUP RANGE */}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Cleanup Range
                  </label>

                  <select
                    value={issueCleanUpAge}
                    onChange={(e) =>
                      setIssueCleanUpAge(
                        e.target.value as IssueCleanupAge
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

              {/* CUSTOM ISSUE RANGE */}

              {issueCleanUpAge === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      From
                    </label>

                    <input
                      type="date"
                      value={issueCustomStartDate}
                      onChange={(e) =>
                        setIssueCustomStartDate(e.target.value)
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
                      value={issueCustomEndDate}
                      onChange={(e) =>
                        setIssueCustomEndDate(e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ISSUE LIST */}

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-gray-500">
                  {filteredIssueRecords.length} matching record
                  {filteredIssueRecords.length === 1 ? "" : "s"}
                </p>

                <p className="text-xs text-gray-500">
                  {selectedIssueIds.length} selected
                </p>
              </div>

              {filteredIssueRecords.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-400">
                    No archived issues match this cleanup range.
                  </p>
                </div>
              ) : (
                filteredIssueRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIssueIds.includes(
                          record.id
                        )}
                        onChange={() =>
                          toggleIssueSelection(record.id)
                        }
                        className="h-4 w-4 shrink-0 rounded border-gray-300"
                      />

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">
                          {record.issue_label ||
                            "Untitled Issue"}
                        </div>

                        <div className="text-xs text-gray-400 mt-1">
                          {getBuilderLabel(record.builder_key)}
                          {" · "}
                          Archived{" "}
                          {new Date(
                            record.archived_at
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        confirmDelete({
                          itemType: "archived issue",
                          itemName:
                            record.issue_label ||
                            "Untitled Issue",
                          action: () =>
                            deleteArchiveRecord(
                              "issues",
                              record.id
                            ),
                        })
                      }
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded shrink-0"
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

        {/* =====================================================
            EVENT MANAGEMENT
        ====================================================== */}

        {tab === "Events" && (
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
                    Completed events will be automatically deleted
                    once they are 2 years old or older.
                  </p>
                </div>
              </div>
            </div>

            {/* EVENT CLEANUP */}

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    Manual Cleanup
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    Matching records are automatically selected.
                    Uncheck any records you want to keep.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={selectedEventIds.length === 0}
                  onClick={() =>
                    confirmDelete({
                      itemType: "archived events",
                      itemName: `${selectedEventIds.length} selected record${
                        selectedEventIds.length === 1 ? "" : "s"
                      }`,
                      action: () =>
                        deleteSelectedArchives("events"),
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                  Delete Selected ({selectedEventIds.length})
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Cleanup Range
                </label>

                <select
                  value={eventCleanUpAge}
                  onChange={(e) =>
                    setEventCleanUpAge(
                      e.target.value as EventCleanupAge
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

              {/* CUSTOM EVENT RANGE */}

              {eventCleanUpAge === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      From
                    </label>

                    <input
                      type="date"
                      value={eventCustomStartDate}
                      onChange={(e) =>
                        setEventCustomStartDate(e.target.value)
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
                      value={eventCustomEndDate}
                      onChange={(e) =>
                        setEventCustomEndDate(e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* EVENT LIST */}

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-gray-500">
                  {filteredEventRecords.length} matching record
                  {filteredEventRecords.length === 1 ? "" : "s"}
                </p>

                <p className="text-xs text-gray-500">
                  {selectedEventIds.length} selected
                </p>
              </div>

              {filteredEventRecords.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-400">
                    No archived events match this cleanup range.
                  </p>
                </div>
              ) : (
                filteredEventRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedEventIds.includes(
                          record.id
                        )}
                        onChange={() =>
                          toggleEventSelection(record.id)
                        }
                        className="h-4 w-4 shrink-0 rounded border-gray-300"
                      />

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
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded shrink-0"
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