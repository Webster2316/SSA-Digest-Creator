import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

type Record = {
  id: number;
  issue_label: string;
  html: string;
  archived_at: string;
};

type RecordViewerProps = {
  recordId: number;
  onBack: () => void;
};

export default function RecordViewer({ recordId, onBack }: RecordViewerProps) {
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/get-record?id=${recordId}`);
        if (res.ok) {
          const data = await res.json();
          setRecord(data);
        }
      } catch (e) {
        console.error("Failed to load record:", e);
      }
      setLoading(false);
    })();
  }, [recordId]);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900 mb-3"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {loading && <p className="text-xs text-gray-400">Loading…</p>}

      {!loading && !record && (
        <p className="text-xs text-red-500">Couldn't load this record.</p>
      )}

      {record && (
        <>
          <p className="text-xs text-gray-500 mb-2">
            {record.issue_label} — archived {new Date(record.archived_at).toLocaleDateString()}
          </p>
          <iframe
            title="archived-record"
            srcDoc={record.html}
            className="w-full border border-gray-300 rounded"
            style={{ height: "600px" }}
          />
        </>
      )}
    </div>
  );
}