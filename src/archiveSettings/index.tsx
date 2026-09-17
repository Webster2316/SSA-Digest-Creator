import { useEffect, useState } from "react";
import {
  Archive,
  CalendarDays,
  Database,
  Filter,
  RefreshCcw,
  Trash2,
  X,
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

type IssueCleanupAge =
  | "6months"
  | "1year"
  | "custom";

type EventCleanupAge =
  | "3months"
  | "6months"
  | "9months"
  | "1year"
  | "custom";

export default function Admin() {
  const { confirmDelete, deleteModal } = useConfirmDelete();

  // =====================================================
  // GENERAL STATE
  // =====================================================

  const [tab, setTab] =
    useState<"Issues" | "Events">("Issues");

  // =====================================================
  // ISSUE STATE
  // =====================================================

  const [issueRecords, setIssueRecords] = useState<IssueArchive[]>([]);

  const [selectedIssueIds, setSelectedIssueIds] =
    useState<number[]>([]);

  const [issueFiltersEnabled, setIssueFiltersEnabled] =
    useState(false);

  const [issueBuilderFilter, setIssueBuilderFilter] =
    useState("all");

  const [issueCleanUpAge, setIssueCleanUpAge] =
    useState<IssueCleanupAge>("6months");

  const [issueCustomStartDate, setIssueCustomStartDate] =
    useState("");

  const [issueCustomEndDate, setIssueCustomEndDate] =
    useState("");

  // =====================================================
  // EVENT STATE
  // =====================================================

  const [eventRecords, setEventRecords] = useState<EventArchive[]>([]);

  const [selectedEventIds, setSelectedEventIds] =
    useState<number[]>([]);

  const [eventFiltersEnabled, setEventFiltersEnabled] =
    useState(false);

  const [eventCleanUpAge, setEventCleanUpAge] =
    useState<EventCleanupAge>("3months");

  const [eventCustomStartDate, setEventCustomStartDate] =
    useState("");

  const [eventCustomEndDate, setEventCustomEndDate] =
    useState("");

  // =====================================================
  // LOADING STATE
  // =====================================================

  const [loadingIssues, setLoadingIssues] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // =====================================================
  // NORMALISE API RESPONSE
  //
  // Supports:
  // [...]
  // { records: [...] }
  // { rows: [...] }
  // =====================================================

  const extractRecords = <T,>(data: any): T[] => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.records)) {
      return data.records;
    }

    if (Array.isArray(data?.rows)) {
      return data.rows;
    }

    console.warn("Unexpected archive API response:", data);

    return [];
  };

  // =====================================================
  // LOAD ISSUE ARCHIVES
  //
  // Always retrieve ALL issue records.
  // Filtering is performed locally.
  // =====================================================

  const loadIssueArchives = async () => {
    setLoadingIssues(true);

    try {
      const res = await fetch(
        "/api/dataManagement?type=issues"
      );

      if (!res.ok) {
        const text = await res.text();

        console.error(
          "Failed to load issue archives:",
          res.status,
          text
        );

        return;
      }

      const data = await res.json();

      console.log("Issue archive response:", data);

      const records =
        extractRecords<IssueArchive>(data);

      console.log(
        "Loaded issue archive records:",
        records.length
      );

      setIssueRecords(records);
    } catch (e) {
      console.error(
        "Failed to load issue archives:",
        e
      );
    } finally {
      setLoadingIssues(false);
    }
  };

  // =====================================================
  // LOAD EVENT ARCHIVES
  //
  // Always retrieve ALL events.
  // Filtering is performed locally.
  // =====================================================

  const loadEventsArchive = async () => {
    setLoadingEvents(true);

    try {
      const res = await fetch(
        "/api/dataManagement?type=events"
      );

      if (!res.ok) {
        const text = await res.text();

        console.error(
          "Failed to load event archives:",
          res.status,
          text
        );

        return;
      }

      const data = await res.json();

      console.log("Event archive response:", data);

      const records =
        extractRecords<EventArchive>(data);

      console.log(
        "Loaded event archive records:",
        records.length
      );

      setEventRecords(records);
    } catch (e) {
      console.error(
        "Failed to load event archives:",
        e
      );
    } finally {
      setLoadingEvents(false);
    }
  };

  // =====================================================
  // LOAD CURRENT TAB
  // =====================================================

  useEffect(() => {
    if (tab === "Issues") {
      loadIssueArchives();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "Events") {
      loadEventsArchive();
    }
  }, [tab]);

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
  // CUSTOM DATE HELPERS
  // =====================================================

  const getCustomDateRange = (
    startDate: string,
    endDate: string
  ) => {
    if (!startDate || !endDate) {
      return null;
    }

    /*
      Using explicit times avoids the date-input / UTC parsing
      issue that can make custom ranges behave unexpectedly.
    */

    const start = new Date(
      `${startDate}T00:00:00`
    );

    const end = new Date(
      `${endDate}T23:59:59.999`
    );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return null;
    }

    if (start > end) {
      return null;
    }

    return {
      start,
      end,
    };
  };

  // =====================================================
  // CUSTOM RANGE VALIDATION
  // =====================================================

  const issueCustomRange =
    issueCleanUpAge === "custom"
      ? getCustomDateRange(
          issueCustomStartDate,
          issueCustomEndDate
        )
      : null;

  const eventCustomRange =
    eventCleanUpAge === "custom"
      ? getCustomDateRange(
          eventCustomStartDate,
          eventCustomEndDate
        )
      : null;

  const issueCustomRangeInvalid =
    issueCleanUpAge === "custom" &&
    issueCustomStartDate !== "" &&
    issueCustomEndDate !== "" &&
    !issueCustomRange;

  const eventCustomRangeInvalid =
    eventCleanUpAge === "custom" &&
    eventCustomStartDate !== "" &&
    eventCustomEndDate !== "" &&
    !eventCustomRange;

  // =====================================================
  // CHECK IF CLEANUP FILTER IS READY
  //
  // Preset filters are always ready.
  // Custom only becomes active after both valid dates exist.
  // =====================================================

  const isCleanupFilterReady = (
    range: string,
    startDate: string,
    endDate: string
  ) => {
    if (range !== "custom") {
      return true;
    }

    return Boolean(
      getCustomDateRange(
        startDate,
        endDate
      )
    );
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

    // -----------------------------------------------------
    // CUSTOM RANGE
    // -----------------------------------------------------

    if (range === "custom") {
      const customRange =
        getCustomDateRange(
          startDate,
          endDate
        );

      /*
        Custom range isn't ready yet.
        Don't consider anything a match.
      */

      if (!customRange) {
        return false;
      }

      return (
        archived >= customRange.start &&
        archived <= customRange.end
      );
    }

    // -----------------------------------------------------
    // PRESET RANGE
    // -----------------------------------------------------

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

    cutoff.setMonth(
      cutoff.getMonth() - months
    );

    /*
      Example:
      "6 months or older"

      = archived date is BEFORE or EQUAL
        to six months ago.
    */

    return archived <= cutoff;
  };

  // =====================================================
  // ISSUE BUILDER FILTER
  // =====================================================

  const builderFilteredIssueRecords =
    issueBuilderFilter === "all"
      ? issueRecords
      : issueRecords.filter(
          (record) =>
            record.builder_key ===
            issueBuilderFilter
        );

  // =====================================================
  // ISSUE FILTERING
  //
  // Filters OFF:
  //   show everything
  //
  // Filters ON:
  //   builder filter always applies
  //
  //   cleanup age applies only when ready
  // =====================================================

  const issueCleanupReady =
    isCleanupFilterReady(
      issueCleanUpAge,
      issueCustomStartDate,
      issueCustomEndDate
    );

  const filteredIssueRecords =
    !issueFiltersEnabled
      ? issueRecords
      : !issueCleanupReady
      ? builderFilteredIssueRecords
      : builderFilteredIssueRecords.filter(
          (record) =>
            matchesCleanupRange(
              record.archived_at,
              issueCleanUpAge,
              issueCustomStartDate,
              issueCustomEndDate
            )
        );

  // =====================================================
  // EVENT FILTERING
  // =====================================================

  const eventCleanupReady =
    isCleanupFilterReady(
      eventCleanUpAge,
      eventCustomStartDate,
      eventCustomEndDate
    );

  const filteredEventRecords =
    !eventFiltersEnabled
      ? eventRecords
      : !eventCleanupReady
      ? eventRecords
      : eventRecords.filter(
          (record) =>
            matchesCleanupRange(
              record.archived_at,
              eventCleanUpAge,
              eventCustomStartDate,
              eventCustomEndDate
            )
        );

  // =====================================================
  // AUTO-SELECT FILTERED ISSUES
  //
  // Only happens while filtering is enabled.
  // =====================================================

  useEffect(() => {
    if (!issueFiltersEnabled) {
      setSelectedIssueIds([]);
      return;
    }

    if (!issueCleanupReady) {
      setSelectedIssueIds([]);
      return;
    }

    const matchingIds =
      builderFilteredIssueRecords
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
    issueFiltersEnabled,
    issueBuilderFilter,
    issueCleanUpAge,
    issueCustomStartDate,
    issueCustomEndDate,
    issueRecords,
  ]);

  // =====================================================
  // AUTO-SELECT FILTERED EVENTS
  // =====================================================

  useEffect(() => {
    if (!eventFiltersEnabled) {
      setSelectedEventIds([]);
      return;
    }

    if (!eventCleanupReady) {
      setSelectedEventIds([]);
      return;
    }

    const matchingIds =
      eventRecords
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
    eventFiltersEnabled,
    eventCleanUpAge,
    eventCustomStartDate,
    eventCustomEndDate,
    eventRecords,
  ]);

  // =====================================================
  // TOGGLE ISSUE FILTERS
  // =====================================================

  const toggleIssueFilters = () => {
    if (issueFiltersEnabled) {
      setIssueFiltersEnabled(false);

      setIssueBuilderFilter("all");

      setIssueCleanUpAge("6months");

      setIssueCustomStartDate("");
      setIssueCustomEndDate("");

      setSelectedIssueIds([]);
    } else {
      setIssueFiltersEnabled(true);
    }
  };

  // =====================================================
  // TOGGLE EVENT FILTERS
  // =====================================================

  const toggleEventFilters = () => {
    if (eventFiltersEnabled) {
      setEventFiltersEnabled(false);

      setEventCleanUpAge("3months");

      setEventCustomStartDate("");
      setEventCustomEndDate("");

      setSelectedEventIds([]);
    } else {
      setEventFiltersEnabled(true);
    }
  };

  // =====================================================
  // TOGGLE ONE ISSUE
  // =====================================================

  const toggleIssueSelection = (
    id: number
  ) => {
    setSelectedIssueIds((prev) =>
      prev.includes(id)
        ? prev.filter(
            (selectedId) =>
              selectedId !== id
          )
        : [...prev, id]
    );
  };

  // =====================================================
  // TOGGLE ONE EVENT
  // =====================================================

  const toggleEventSelection = (
    id: number
  ) => {
    setSelectedEventIds((prev) =>
      prev.includes(id)
        ? prev.filter(
            (selectedId) =>
              selectedId !== id
          )
        : [...prev, id]
    );
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
        const text = await res.text();

        console.error(
          "Failed to delete archive record:",
          res.status,
          text
        );

        return;
      }

      if (type === "issues") {
        setIssueRecords((prev) =>
          prev.filter(
            (record) =>
              record.id !== id
          )
        );

        setSelectedIssueIds((prev) =>
          prev.filter(
            (selectedId) =>
              selectedId !== id
          )
        );
      } else {
        setEventRecords((prev) =>
          prev.filter(
            (record) =>
              record.id !== id
          )
        );

        setSelectedEventIds((prev) =>
          prev.filter(
            (selectedId) =>
              selectedId !== id
          )
        );
      }
    } catch (e) {
      console.error(
        "Failed to delete archive record:",
        e
      );
    }
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
      const results =
        await Promise.all(
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

      const successfullyDeletedIds =
        results
          .filter(
            (result) => result.ok
          )
          .map(
            (result) => result.id
          );

      if (type === "issues") {
        setIssueRecords((prev) =>
          prev.filter(
            (record) =>
              !successfullyDeletedIds.includes(
                record.id
              )
          )
        );

        setSelectedIssueIds([]);
      } else {
        setEventRecords((prev) =>
          prev.filter(
            (record) =>
              !successfullyDeletedIds.includes(
                record.id
              )
          )
        );

        setSelectedEventIds([]);
      }

      const failedCount =
        ids.length -
        successfullyDeletedIds.length;

      if (failedCount > 0) {
        console.error(
          `${failedCount} archive record(s) could not be deleted`
        );
      }
    } catch (e) {
      console.error(
        "Failed to delete selected archives:",
        e
      );
    }
  };

  // =====================================================
  // BUILDER LABEL
  // =====================================================

  const getBuilderLabel = (
    builderKey: string
  ) => {
    const labels: Record<string, string> = {
      "ssa-digest-data":
        "Weekly Digest",

      "training-bulletin-data":
        "Training Bulletin",

      "ai-bulletin-data":
        "AI Bulletin",

      "events-builder-data":
        "Events",
    };

    return (
      labels[builderKey] ??
      builderKey
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

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
            onClick={
              refreshCurrentTab
            }
            disabled={
              loadingIssues ||
              loadingEvents
            }
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 bg-white rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCcw
              size={14}
              className={
                loadingIssues ||
                loadingEvents
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* =====================================================
            TABS
        ====================================================== */}

        <div className="flex gap-1 mb-5 border-b border-gray-200">

          <button
            type="button"
            onClick={() =>
              setTab("Issues")
            }
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
            onClick={() =>
              setTab("Events")
            }
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

            {/* FILTER / CLEANUP CONTROLS */}

            <div className="bg-white border border-gray-200 rounded-lg p-4">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    Archived Issues
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    All archived issues are shown by default.
                    Enable filters to find records for cleanup.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    toggleIssueFilters
                  }
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded border ${
                    issueFiltersEnabled
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {issueFiltersEnabled ? (
                    <X size={14} />
                  ) : (
                    <Filter size={14} />
                  )}

                  {issueFiltersEnabled
                    ? "Show All"
                    : "Filter Records"}
                </button>

              </div>

              {/* ISSUE FILTERS */}

              {issueFiltersEnabled && (
                <div className="mt-4 pt-4 border-t border-gray-100">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* BUILDER TYPE */}

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Builder Type
                      </label>

                      <select
                        value={
                          issueBuilderFilter
                        }
                        onChange={(e) =>
                          setIssueBuilderFilter(
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                      >
                        <option value="all">
                          All Issues
                        </option>

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
                        value={
                          issueCleanUpAge
                        }
                        onChange={(e) =>
                          setIssueCleanUpAge(
                            e.target
                              .value as IssueCleanupAge
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
                          Custom date range
                        </option>
                      </select>
                    </div>

                  </div>

                  {/* CUSTOM ISSUE DATE RANGE */}

                  {issueCleanUpAge ===
                    "custom" && (
                    <div className="mt-4">

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            From
                          </label>

                          <input
                            type="date"
                            value={
                              issueCustomStartDate
                            }
                            onChange={(e) =>
                              setIssueCustomStartDate(
                                e.target.value
                              )
                            }
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            To
                          </label>

                          <input
                            type="date"
                            value={
                              issueCustomEndDate
                            }
                            onChange={(e) =>
                              setIssueCustomEndDate(
                                e.target.value
                              )
                            }
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                          />
                        </div>

                      </div>

                      {!issueCustomStartDate ||
                      !issueCustomEndDate ? (
                        <p className="text-xs text-gray-400 mt-2">
                          Select both dates to apply the custom range.
                        </p>
                      ) : issueCustomRangeInvalid ? (
                        <p className="text-xs text-red-600 mt-2">
                          The From date must be before or equal to the To date.
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-2">
                          Records archived between these dates,
                          including both selected dates, will be shown.
                        </p>
                      )}

                    </div>
                  )}

                </div>
              )}

            </div>

            {/* ISSUE LIST HEADER */}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">

              <div>
                <p className="text-xs text-gray-500">
                  {issueRecords.length} total archived issue
                  {issueRecords.length === 1
                    ? ""
                    : "s"}

                  {issueFiltersEnabled && (
                    <>
                      {" · "}
                      {filteredIssueRecords.length} shown
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">

                <p className="text-xs text-gray-500">
                  {selectedIssueIds.length} selected
                </p>

                <button
                  type="button"
                  disabled={
                    selectedIssueIds.length ===
                    0
                  }
                  onClick={() =>
                    confirmDelete({
                      itemType:
                        "archived issues",

                      itemName: `${
                        selectedIssueIds.length
                      } selected record${
                        selectedIssueIds.length ===
                        1
                          ? ""
                          : "s"
                      }`,

                      action: () =>
                        deleteSelectedArchives(
                          "issues"
                        ),
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />

                  Delete Selected
                </button>

              </div>

            </div>

            {/* ISSUE LIST */}

            <div className="space-y-2">

              {loadingIssues ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-400">
                    Loading archived issues...
                  </p>
                </div>
              ) : filteredIssueRecords.length ===
                0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-400">
                    {issueFiltersEnabled
                      ? "No archived issues match the current filters."
                      : "No archived issues found."}
                  </p>
                </div>
              ) : (
                filteredIssueRecords.map(
                  (record) => (
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
                            toggleIssueSelection(
                              record.id
                            )
                          }
                          className="h-4 w-4 shrink-0 rounded border-gray-300"
                        />

                        <div className="min-w-0">

                          <div className="text-sm font-semibold text-gray-800 truncate">
                            {record.issue_label ||
                              "Untitled Issue"}
                          </div>

                          <div className="text-xs text-gray-400 mt-1">
                            {getBuilderLabel(
                              record.builder_key
                            )}

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
                            itemType:
                              "archived issue",

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
                        <Trash2
                          size={16}
                        />
                      </button>

                    </div>
                  )
                )
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

            {/* EVENT FILTERS */}

            <div className="bg-white border border-gray-200 rounded-lg p-4">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    Archived Events
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    All archived events are shown by default.
                    Enable filters to find records for cleanup.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    toggleEventFilters
                  }
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded border ${
                    eventFiltersEnabled
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {eventFiltersEnabled ? (
                    <X size={14} />
                  ) : (
                    <Filter size={14} />
                  )}

                  {eventFiltersEnabled
                    ? "Show All"
                    : "Filter Records"}
                </button>

              </div>

              {eventFiltersEnabled && (
                <div className="mt-4 pt-4 border-t border-gray-100">

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Cleanup Range
                    </label>

                    <select
                      value={
                        eventCleanUpAge
                      }
                      onChange={(e) =>
                        setEventCleanUpAge(
                          e.target
                            .value as EventCleanupAge
                        )
                      }
                      className="w-full md:w-72 border border-gray-300 rounded px-3 py-2 text-sm bg-white"
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
                        Custom date range
                      </option>
                    </select>
                  </div>

                  {/* CUSTOM EVENT RANGE */}

                  {eventCleanUpAge ===
                    "custom" && (
                    <div className="mt-4">

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            From
                          </label>

                          <input
                            type="date"
                            value={
                              eventCustomStartDate
                            }
                            onChange={(e) =>
                              setEventCustomStartDate(
                                e.target.value
                              )
                            }
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            To
                          </label>

                          <input
                            type="date"
                            value={
                              eventCustomEndDate
                            }
                            onChange={(e) =>
                              setEventCustomEndDate(
                                e.target.value
                              )
                            }
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                          />
                        </div>

                      </div>

                      {!eventCustomStartDate ||
                      !eventCustomEndDate ? (
                        <p className="text-xs text-gray-400 mt-2">
                          Select both dates to apply the custom range.
                        </p>
                      ) : eventCustomRangeInvalid ? (
                        <p className="text-xs text-red-600 mt-2">
                          The From date must be before or equal to the To date.
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-2">
                          Records archived between these dates,
                          including both selected dates, will be shown.
                        </p>
                      )}

                    </div>
                  )}

                </div>
              )}

            </div>

            {/* EVENT LIST HEADER */}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">

              <p className="text-xs text-gray-500">
                {eventRecords.length} total archived event
                {eventRecords.length === 1
                  ? ""
                  : "s"}

                {eventFiltersEnabled && (
                  <>
                    {" · "}
                    {filteredEventRecords.length} shown
                  </>
                )}
              </p>

              <div className="flex items-center gap-3">

                <p className="text-xs text-gray-500">
                  {selectedEventIds.length} selected
                </p>

                <button
                  type="button"
                  disabled={
                    selectedEventIds.length ===
                    0
                  }
                  onClick={() =>
                    confirmDelete({
                      itemType:
                        "archived events",

                      itemName: `${
                        selectedEventIds.length
                      } selected record${
                        selectedEventIds.length ===
                        1
                          ? ""
                          : "s"
                      }`,

                      action: () =>
                        deleteSelectedArchives(
                          "events"
                        ),
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />

                  Delete Selected
                </button>

              </div>

            </div>

            {/* EVENT LIST */}

            <div className="space-y-2">

              {loadingEvents ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-400">
                    Loading archived events...
                  </p>
                </div>
              ) : filteredEventRecords.length ===
                0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-400">
                    {eventFiltersEnabled
                      ? "No archived events match the current filters."
                      : "No archived events found."}
                  </p>
                </div>
              ) : (
                filteredEventRecords.map(
                  (record) => (
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
                            toggleEventSelection(
                              record.id
                            )
                          }
                          className="h-4 w-4 shrink-0 rounded border-gray-300"
                        />

                        <div className="min-w-0">

                          <div className="text-sm font-semibold text-gray-800 truncate">
                            {record.title ||
                              "Untitled Event"}
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
                            itemType:
                              "archived event",

                            itemName:
                              record.title ||
                              "Untitled Event",

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
                        <Trash2
                          size={16}
                        />
                      </button>

                    </div>
                  )
                )
              )}

            </div>

          </div>
        )}

        {deleteModal}

      </div>
    </div>
  );
}