import { useState } from "react";
import { ArrowLeft, Loader2, Save, Info, Users, CalendarClock, ClipboardList, Eye, Copy, Check } from "lucide-react";
import Field from "../../shared/field";
import { inputCls } from "../../shared/utils";
import { buildFullHtml, type AdminProgramme, type InfoFields } from "./ProgramHome";

type Tab = "info" | "roles" | "programme" | "lists" | "preview";

type Props = {
  programmeId: string;
  programmes: AdminProgramme[];
  setProgrammes: React.Dispatch<React.SetStateAction<AdminProgramme[]>>;
  onBack: () => void;
  saveStatus: string;
};

const infoFields: { key: keyof InfoFields; label: string; multiline?: boolean }[] = [
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "venue", label: "Venue", multiline: true },
  { key: "dressCode", label: "Dress code" },
  { key: "audienceSize", label: "Audience size", multiline: true },
  { key: "catering", label: "Catering arrangement", multiline: true },
];

export default function ProgramBriefEditor({ programmeId, programmes, setProgrammes, onBack, saveStatus }: Props) {
  const [tab, setTab] = useState<Tab>("info");
  const [copied, setCopied] = useState(false);

  const programme = programmes.find((p) => p.id === programmeId);

  if (!programme) {
    return (
      <div className="p-4">
        <button onClick={onBack} className="text-sm text-indigo-700">← Back</button>
        <p className="mt-2 text-sm text-gray-500">Programme not found.</p>
      </div>
    );
  }

  // every edit goes through these two so the Home (the save owner) sees it
  const update = (patch: Partial<AdminProgramme>) =>
    setProgrammes((prev) => prev.map((p) => (p.id === programmeId ? { ...p, ...patch } : p)));

  const updateInfo = (field: keyof InfoFields, value: string) =>
    setProgrammes((prev) =>
      prev.map((p) => (p.id === programmeId ? { ...p, info: { ...p.info, [field]: value } } : p))
    );

  const html = buildFullHtml(programme);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const tabBtn = (key: Tab, label: string, Icon: any) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
        tab === key ? "border-indigo-700 text-indigo-800" : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      <Icon size={15} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-5xl p-4">
        {/* HEADER */}
        <div className="mb-4 flex items-center gap-3">
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-700">
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-xl font-bold text-indigo-900">Admin Brief Builder</h1>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
            {saveStatus === "saving" && (<><Loader2 size={13} className="animate-spin" /> Saving…</>)}
            {saveStatus.startsWith("Saved at") && (<><Save size={13} /> {saveStatus}</>)}
            {saveStatus === "error" && <span className="text-red-600">Save failed</span>}
          </div>
        </div>

        {/* EVENT NAME */}
        <div className="mb-4 rounded-lg border bg-white p-4">
          <Field label="Event Name">
            <input className={inputCls} value={programme.eventName} onChange={(e) => update({ eventName: e.target.value })} />
          </Field>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-200 rounded-t-lg bg-white px-2">
          {tabBtn("info", "Event Information", Info)}
          {tabBtn("roles", "Roles & Responsibilities", Users)}
          {tabBtn("programme", "Programme", CalendarClock)}
          {tabBtn("lists", "Lists", ClipboardList)}
          {tabBtn("preview", "Preview & Export", Eye)}
        </div>

        {/* EVENT INFORMATION */}
        {tab === "info" && (
          <div className="space-y-4 rounded-b-lg border bg-white p-4">
            {infoFields.map((f) => (
              <Field key={f.key} label={f.label}>
                {f.multiline ? (
                  <textarea className={inputCls} rows={3} value={programme.info[f.key]} onChange={(e) => updateInfo(f.key, e.target.value)} />
                ) : (
                  <input className={inputCls} value={programme.info[f.key]} onChange={(e) => updateInfo(f.key, e.target.value)} />
                )}
              </Field>
            ))}
          </div>
        )}

        {tab === "roles" && <div className="rounded-b-lg border bg-white p-4 text-sm text-gray-500">Roles — next step</div>}
        {tab === "programme" && <div className="rounded-b-lg border bg-white p-4 text-sm text-gray-500">Programme — next step</div>}
        {tab === "lists" && <div className="rounded-b-lg border bg-white p-4 text-sm text-gray-500">Lists — next step</div>}

        {/* PREVIEW */}
        {tab === "preview" && (
          <div className="space-y-3 rounded-b-lg border bg-white p-4">
            <button type="button" onClick={handleCopy} className="flex items-center gap-1.5 rounded bg-indigo-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-900">
              {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied!" : "Copy HTML"}
            </button>
            <div className="overflow-auto rounded border border-gray-300 bg-gray-200 p-3">
              <iframe title="Admin programme preview" srcDoc={html} style={{ width: 962, minWidth: 962, height: 1100 }} className="mx-auto block border-0 bg-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}