

import { useState, useEffect } from "react";
import { Archive } from "lucide-react";

type Record = {
  id: number;
  issue_label: string;
  archived_at: string;
};

type RecordsPanelProps = {
  builderKey: string;
  onSelect: (id: number) => void;
};

export default function RecordsPanel({ builderKey, onSelect }: RecordsPanelProps) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/list-records?key=${builderKey}`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data);
        }
      } catch (e) {
        console.error("Failed to load records:", e);
      }
      setLoading(false);
    })();
  }, [builderKey]);

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center gap-1.5 mb-2">
        <Archive size={14} className="text-gray-500" />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Past Issues</span>
      </div>

      {loading && <p className="text-xs text-gray-400">Loading…</p>}

      {!loading && records.length === 0 && (
        <p className="text-xs text-gray-400">No archived issues yet.</p>
      )}

      <div className="space-y-1">
        {records.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className="w-full text-left px-2 py-1.5 rounded text-xs text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200"
          >
            <div className="font-medium truncate">{r.issue_label}</div>
            <div className="text-gray-400">{new Date(r.archived_at).toLocaleDateString()}</div>
          </button>
        ))}
      </div>
    </div>
  );
}