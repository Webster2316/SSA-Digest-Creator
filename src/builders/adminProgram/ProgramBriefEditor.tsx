import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Loader2, Save, Info, Users, CalendarClock, ClipboardList, Eye, Copy, Check } from "lucide-react";
import Field from "../../shared/field";
import { inputCls, uid } from "../../shared/utils";
import { buildFullHtml } from "./ProgramHome";
import type { AdminProgramme, InfoFields, SetupSection, SetupTask, ProgrammeRow } from "./ProgramHome";

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

const roleFields: { key: "role" | "assignedTo"; label: string }[] = [
  { key: "role", label: "Role" },
  { key: "assignedTo", label: "Assigned to" },
];

// shared button styles
const addBtn = "flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-900";
const delBtn = "rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600";

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

  /* ---------- UPDATERS (every edit goes through setProgrammes so Home can save) ---------- */

  const update = (patch: Partial<AdminProgramme>) =>
    setProgrammes((prev) => prev.map((p) => (p.id === programmeId ? { ...p, ...patch } : p)));

  const updateInfo = (field: keyof InfoFields, value: string) =>
    setProgrammes((prev) =>
      prev.map((p) => (p.id === programmeId ? { ...p, info: { ...p.info, [field]: value } } : p))
    );

  const updateRoles = (roleId: string, field: "role" | "assignedTo", value: string) =>
    setProgrammes((prev) =>
      prev.map((p) =>
        p.id === programmeId
          ? { ...p, roles: p.roles.map((r) => (r.id === roleId ? { ...r, [field]: value } : r)) }
          : p
      )
    );

  const addNewRole = () =>
    setProgrammes((prev) =>
      prev.map((p) =>
        p.id === programmeId
          ? { ...p, roles: [...p.roles, { id: crypto.randomUUID(), role: "", assignedTo: "" }] }
          : p
      )
    );

  // Set-Up & Briefing:functions 
  const updateSetup = (fn: (s: SetupSection) => SetupSection) =>
    setProgrammes((prev) => prev.map((p) => (p.id === programmeId ? { ...p, setup: fn(p.setup) } : p)));

  const patchTask = (id: string, patch: Partial<SetupTask>) =>
    updateSetup((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  const addTask = () =>
    updateSetup((s) => ({
      ...s,
      tasks: [...s.tasks, { id: uid(), title: "", bullets: [], checklistTitle: "", checklist: [] }],
    }));

  const removeTask = (id: string) =>
    updateSetup((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));


    //Program summary functions
    const patchRow = (id: string, patch: Partial<ProgrammeRow>) =>
    setProgrammes((prev) =>
      prev.map((p) =>
        p.id === programmeId
          ? { ...p, programme: p.programme.map((r) => (r.id === id ? { ...r, ...patch } : r)) }
          : p
      )
    );
  
  const addRow = () =>
    setProgrammes((prev) =>
      prev.map((p) =>
        p.id === programmeId
          ? { ...p, programme: [...p.programme, { id: uid(), time: "", activity: "", checks: "", owner: "" }] }
          : p
      )
    );
  
  const removeRow = (id: string) =>
    setProgrammes((prev) =>
      prev.map((p) =>
        p.id === programmeId
          ? { ...p, programme: p.programme.filter((r) => r.id !== id) }
          : p
      )
    );
  /* ---------- EXPORT ---------- */

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
          <img
            src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
            alt="SSA Logo"
            className="h-8 w-auto"
          />
          <h1 className="text-xl font-bold text-indigo-900">Admin Brief Builder</h1>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
            {saveStatus === "saving" && (<><Loader2 size={13} className="animate-spin" /> Saving…</>)}
            {saveStatus.startsWith("Saved at") && (<><Save size={13} /> {saveStatus}</>)}
            {saveStatus === "error" && <span className="text-red-600">Save failed</span>}
          </div>
        </div>
        <button type="button" onClick={onBack} className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-700">
          <ArrowLeft size={16} /> Back
        </button>

        {/* EVENT NAME */}
        <div className="mb-4 rounded-lg border bg-white p-4">
          <Field label="Event Name">
            <input className={inputCls} value={programme.eventName} onChange={(e) => update({ eventName: e.target.value })} />
          </Field>
        </div>

        {/* TABS */}
        <div className="flex rounded-t-lg border-b border-gray-200 bg-white px-2">
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

        {/* ROLES */}
        {tab === "roles" && (
          <div className="space-y-4 rounded-b-lg border bg-white p-4">
            {programme.roles.map((r) => (
              <div key={r.id} className="grid gap-4 sm:grid-cols-2">
                {roleFields.map((f) => (
                  <Field key={f.key} label={f.label}>
                    <input
                      className={inputCls}
                      value={r[f.key]}
                      onChange={(e) => updateRoles(r.id, f.key, e.target.value)}
                    />
                  </Field>
                ))}
              </div>
            ))}

            <button
              type="button"
              onClick={addNewRole}
              className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-900"
            >
              <Plus size={16} /> Add New Role
            </button>
          </div>
        )}

        {/* PROGRAMME: Set-Up & Briefing (+ Program Summary next) */}
        {tab === "programme" && (
          <div className="space-y-4 rounded-b-lg border bg-white p-4">
            <details open className="rounded-lg border border-gray-200">
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-indigo-900">
                Set-Up &amp; Briefing
              </summary>

              <div className="space-y-4 border-t border-gray-200 p-3">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Time range">
                    <input
                      className={inputCls}
                      placeholder="8.00am – 9.00am"
                      value={programme.setup.time}
                      onChange={(e) => updateSetup((s) => ({ ...s, time: e.target.value }))}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Main Task">
                      <textarea
                        className={inputCls}
                        rows={2}
                        value={programme.setup.intro}
                        onChange={(e) => updateSetup((s) => ({ ...s, intro: e.target.value }))}
                      />
                    </Field>
                  </div>
                </div>

                {programme.setup.tasks.map((t) => (
                  <div key={t.id} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    {/* task header */}
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Field label="Task header">
                          <input
                            className={inputCls}
                            value={t.title}
                            onChange={(e) => patchTask(t.id, { title: e.target.value })}
                          />
                        </Field>
                      </div>
                      <button type="button" className={delBtn} title="Delete task" onClick={() => removeTask(t.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* bullets: bold label + description */}
                    <div className="space-y-2">
                      {t.bullets.map((b) => (
                        <div key={b.id} className="flex gap-2">
                          <input
                            className={`${inputCls} w-1/3`}
                            placeholder="Bold label"
                            value={b.label}
                            onChange={(e) =>
                              patchTask(t.id, {
                                bullets: t.bullets.map((x) => (x.id === b.id ? { ...x, label: e.target.value } : x)),
                              })
                            }
                          />
                          <input
                            className={`${inputCls} flex-1`}
                            placeholder="Description"
                            value={b.text}
                            onChange={(e) =>
                              patchTask(t.id, {
                                bullets: t.bullets.map((x) => (x.id === b.id ? { ...x, text: e.target.value } : x)),
                              })
                            }
                          />
                          <button
                            type="button"
                            className={delBtn}
                            onClick={() => patchTask(t.id, { bullets: t.bullets.filter((x) => x.id !== b.id) })}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className={addBtn}
                        onClick={() => patchTask(t.id, { bullets: [...t.bullets, { id: uid(), label: "", text: "" }] })}
                      >
                        <Plus size={15} /> Add bullet
                      </button>
                    </div>

                    {/* checklist table */}
                    <div className="space-y-2 border-t border-gray-200 pt-3">
                      <Field label="Checklist title">
                        <input
                          className={inputCls}
                          value={t.checklistTitle}
                          onChange={(e) => patchTask(t.id, { checklistTitle: e.target.value })}
                        />
                      </Field>
                      {t.checklist.map((c) => (
                        <div key={c.id} className="flex gap-2">
                          <input
                            className={`${inputCls} flex-1`}
                            value={c.text}
                            onChange={(e) =>
                              patchTask(t.id, {
                                checklist: t.checklist.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)),
                              })
                            }
                          />
                          <button
                            type="button"
                            className={delBtn}
                            onClick={() => patchTask(t.id, { checklist: t.checklist.filter((x) => x.id !== c.id) })}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className={addBtn}
                        onClick={() => patchTask(t.id, { checklist: [...t.checklist, { id: uid(), text: "" }] })}
                      >
                        <Plus size={15} /> Add checklist item
                      </button>
                    </div>
                  </div>
                ))}

                <button type="button" className={addBtn} onClick={addTask}>
                  <Plus size={16} /> Add task
                </button>
              </div>
            </details>

            {/* Program Summary <details> goes here next */}
            <details open className="rounded-lg border border-gray-200">
            <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-indigo-900">
            Program Summary
            </summary>

            <div className="space-y-3 border-t border-gray-200 p-3">
            {programme.programme.map((r) => (
  <div key={r.id} className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
    {/* top line: time + activity + delete */}
    <div className="flex items-end gap-2">
      <div className="w-48">
        <Field label="Time">
          <input
            className={inputCls}
            placeholder="9.00am – 9.15am"
            value={r.time}
            onChange={(e) => patchRow(r.id, { time: e.target.value })}
          />
        </Field>
      </div>
      <div className="flex-1">
        <Field label="Activity">
          <input
            className={inputCls}
            value={r.activity}
            onChange={(e) => patchRow(r.id, { activity: e.target.value })}
          />
        </Field>
      </div>
      <button type="button" className={delBtn} title="Delete row" onClick={() => removeRow(r.id)}>
        <Trash2 size={16} />
      </button>
    </div>

    {/* checks + owner */}
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Technical & Programme Checks">
        <textarea
          className={inputCls}
          rows={3}
          value={r.checks}
          onChange={(e) => patchRow(r.id, { checks: e.target.value })}
        />
      </Field>
      <Field label="Speaker / Owner">
        <textarea
          className={inputCls}
          rows={3}
          value={r.owner}
          onChange={(e) => patchRow(r.id, { owner: e.target.value })}
        />
      </Field>
    </div>
  </div>
))}

<button type="button" className={addBtn} onClick={addRow}>
  <Plus size={16} /> Add row
</button>
            </div>
            </details>
          </div>
        )}

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