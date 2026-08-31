import { useState, useEffect } from "react";
import { Plus, Copy, Check, Save, Eye, Code2, BookOpen, GraduationCap, TrendingUp, Archive, Loader2, RotateCcw } from "lucide-react";
import Field from "../shared/field";
import TagBlock, { renderTagBlockHTML } from "../shared/tagBlock";
import MoveButtons from "../shared/moveButtons";
import RecordsPanel from "../shared/recordsPanel";
import RecordViewer from "../shared/recordViewer";
import RichTextEditor from "../shared/richTextEditor";
import { uid, esc, inputCls } from "../shared/utils";

const FONT = "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

// ---------- factories ----------

function makeAwarenessItem(overrides = {}) {
  return Object.assign(
    { id: uid(), header: "", body: "", tag: null, isPreset: false },
    overrides
  );
}

function makeTrainingItem(overrides = {}) {
  return Object.assign(
    { id: uid(), name: "", partnershipLine: "", body: "", summaryTag: null },
    overrides
  );
}

function makeAdoptionItem(overrides = {}) {
  return Object.assign(
    { id: uid(), header: "", body: "", tag: null },
    overrides
  );
}

// ---------- seed data ----------

const defaultAwarenessItems = () => [
  makeAwarenessItem({
    header: "Emerging AI Use Cases Across the Maritime Industry",
    body: "<p>As organisations move beyond early AI adoption, attention is increasingly shifting towards implementing practical, scalable use cases across maritime operations.</p>",
    isPreset: true,
  }),
  makeAwarenessItem({
    header: "Examples of AI Applications Currently Being Explored",
    body: "<ul><li>Regulatory compliance and policy summarisation</li><li>Voyage and operational reporting assistance</li></ul>",
    isPreset: true,
  }),
];

const defaultTrainingItems = () => [
  makeTrainingItem({
    name: "Anchoring AI: Transforming Shipping with GenAI",
    partnershipLine: "Conducted in partnership with PwC",
    body: "<ul><li>Understanding GenAI fundamentals</li><li>Maritime AI use cases</li></ul>",
  }),
  makeTrainingItem({
    name: "Navigating the Journey: Managing AI-Related Risk",
    partnershipLine: "Conducted in partnership with PwC",
    body: "<ul><li>Explore principles of responsible AI adoption</li></ul>",
  }),
];

const defaultAdoption = () => ({
  funding: { body: "<p>Various grants and funding schemes are available to support companies exploring digitalisation and AI adoption initiatives.</p>", tag: null },
  challenges: { body: "<p>As organisations progress beyond pilot projects, several operational challenges are emerging.</p>", tag: null },
  suggestedAction: { body: "<p>Practical priorities identified through ongoing industry engagement.</p>", tag: null },
  extraItems: [],
});

const ADOPTION_SECTIONS = [
  { key: "funding", header: "Funding Support for AI Adoption", color: "navy" },
  { key: "challenges", header: "Common AI Adoption Challenges Observed", color: "navy" },
  { key: "suggestedAction", header: "Suggested Action This Month", color: "cyan" },
];

// ---------- HTML builders ----------

function buildAwarenessItemHTML(item) {
  const tagHtml = renderTagBlockHTML(item.tag, "navy", `awareness-tag-${item.id}`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" data-block="awareness-item" data-id="${esc(item.id)}">
<tr><td style="padding:0 0 14px 0">
<p data-f="header" style="margin:0 0 14px 0;font-family:${FONT};font-size:22px;line-height:28px;font-weight:bold;color:#1b75bc;">${esc(item.header)}</p>
<div data-f="body" style="font-family:${FONT};font-size:14px;line-height:24px;color:#2d3748;">${item.body}</div>
${tagHtml}
</td></tr>
</table>`;
}

function buildTrainingItemHTML(item) {
  const partnershipHtml = (item.partnershipLine || "").trim()
    ? `<p data-f="partnership" style="margin:0 0 14px 0;font-family:${FONT};font-size:14px;line-height:22px;font-style:italic;color:#5f6b7a;">${esc(item.partnershipLine)}</p>`
    : "";
  const tagHtml = renderTagBlockHTML(item.summaryTag, "blue", `training-tag-${item.id}`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" data-block="training-item" data-id="${esc(item.id)}">
<tr><td style="padding:0 0 14px 0">
<p data-f="name" style="margin:0 0 10px 0;font-family:${FONT};font-size:17px;line-height:23px;font-weight:bold;color:#262261;">${esc(item.name)}</p>
${partnershipHtml}
<div data-f="body" style="font-family:${FONT};font-size:14px;line-height:24px;color:#2d3748;">${item.body}</div>
${tagHtml}
</td></tr>
</table>`;
}

function buildAdoptionSectionHTML(key, header, color, data) {
  const tagHtml = renderTagBlockHTML(data.tag, color, `adoption-${key}-tag`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" data-block="adoption-section" data-key="${key}">
<tr><td style="padding:0 0 20px 0">
<p style="margin:0 0 14px 0;font-family:${FONT};font-size:22px;line-height:28px;font-weight:bold;color:#1b75bc;">${esc(header)}</p>
<div data-f="body" style="font-family:${FONT};font-size:14px;line-height:24px;color:#2d3748;">${data.body}</div>
${tagHtml}
</td></tr>
</table>`;
}

function buildAdoptionExtraItemHTML(item) {
  const tagHtml = renderTagBlockHTML(item.tag, "navy", `adoption-extra-tag-${item.id}`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" data-block="adoption-extra-item" data-id="${esc(item.id)}">
<tr><td style="padding:0 0 20px 0">
<p data-f="header" style="margin:0 0 14px 0;font-family:${FONT};font-size:22px;line-height:28px;font-weight:bold;color:#1b75bc;">${esc(item.header)}</p>
<div data-f="body" style="font-family:${FONT};font-size:14px;line-height:24px;color:#2d3748;">${item.body}</div>
${tagHtml}
</td></tr>
</table>`;
}

function buildFullHTML({ issueTag, awarenessItems, trainingItems, adoption }) {
  const awarenessHtml = awarenessItems.map(buildAwarenessItemHTML).join("\n\n");
  const trainingHtml = trainingItems.map(buildTrainingItemHTML).join("\n\n");
  const adoptionFixedHtml = ADOPTION_SECTIONS.map(({ key, header, color }) =>
    buildAdoptionSectionHTML(key, header, color, adoption[key])
  ).join("\n\n");
  const adoptionExtraHtml = (adoption.extraItems || []).map(buildAdoptionExtraItemHTML).join("\n\n");
  const adoptionHtml = [adoptionFixedHtml, adoptionExtraHtml].filter(Boolean).join("\n\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SSA AI Bulletin</title>
<style>
body,table,td,p,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;display:block;}
table{border-collapse:collapse;}
body{margin:0!important;padding:0!important;width:100%!important;background-color:#eef2f5;font-family:${FONT};}
a{text-decoration:none;}
@media screen and (max-width:620px){
.email-container{width:100%!important;max-width:100%!important;}
.content-padding{padding-left:16px!important;padding-right:16px!important;}
.issue-padding{padding-left:16px!important;padding-right:16px!important;}
.issue-title{font-size:24px!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef2f5" style="width:100%;background-color:#eef2f5">
<tr><td align="center" valign="top" style="padding:30px 10px">
<table role="presentation" width="680" cellpadding="0" cellspacing="0" border="0" class="email-container" bgcolor="#ffffff" style="width:680px;max-width:680px;background-color:#ffffff;border:1px solid #d4dde8;">

<tr><td align="center" valign="middle" bgcolor="#e4e7f2" style="background-color:#e4e7f2;padding:0">
<img src="https://raw.githubusercontent.com/Webster2316/AI_Bulletin_Draft/refs/heads/main/Banner3.png" width="680" height="183" alt="SSA AI bulletin Banner" class="banner-image" style="display:block;width:680px;height:183px;max-width:100%;border:0;" />
</td></tr>

<tr><td align="left" valign="top" bgcolor="#262261" class="issue-padding" style="padding:22px 24px;background-color:#262261">
<p class="issue-title" data-f="issue-tag" style="margin:0;font-family:${FONT};font-size:28px;line-height:34px;font-weight:bold;color:#ffffff;">${esc(issueTag)}</p>
</td></tr>

<tr><td bgcolor="#262261" align="center" style="padding:10px 16px;background-color:#262261;font-family:${FONT};font-size:18px;line-height:24px;text-align:center;font-weight:bold;color:#ffffff;">Awareness</td></tr>
<tr><td align="left" valign="top" bgcolor="#ffffff" class="content-padding" style="padding:22px 24px 0 24px;background-color:#ffffff" data-section="awareness">
${awarenessHtml}
</td></tr>

<tr><td bgcolor="#1b75bc" align="center" style="padding:10px 16px;background-color:#1b75bc;font-family:${FONT};font-size:18px;line-height:24px;text-align:center;font-weight:bold;color:#ffffff;">Training</td></tr>
<tr><td align="left" valign="top" bgcolor="#ffffff" class="content-padding" style="padding:22px 24px 0 24px;background-color:#ffffff" data-section="training">
${trainingHtml}
</td></tr>

<tr><td bgcolor="#810e17" align="center" style="padding:10px 16px;background-color:#810e17;font-family:${FONT};font-size:18px;line-height:24px;text-align:center;font-weight:bold;color:#ffffff;">Adoption</td></tr>
<tr><td align="left" valign="top" bgcolor="#ffffff" class="content-padding" style="padding:22px 24px 28px 24px;background-color:#ffffff" data-section="adoption">
${adoptionHtml}
</td></tr>

<tr><td align="center" bgcolor="#262261" style="padding:22px;background-color:#262261;font-family:${FONT};font-size:12px;line-height:20px;color:#dbe7f4;">
<p style="margin:0;font-family:${FONT};font-size:14px;line-height:20px;font-weight:bold;color:#ffffff;">Singapore Shipping Association</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ---------- main component ----------

export default function AIBulletinBuilder() {
  const [tab, setTab] = useState("awareness");
  const [issueTag, setIssueTag] = useState("Issue 04 | Sep 2026");
  const [awarenessItems, setAwarenessItems] = useState(defaultAwarenessItems);
  const [trainingItems, setTrainingItems] = useState(defaultTrainingItems);
  const [adoption, setAdoption] = useState(defaultAdoption);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [copied, setCopied] = useState(false);
  const [rawHtmlEdit, setRawHtmlEdit] = useState(null);
  const [viewingRecordId, setViewingRecordId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/load-digest?key=ai-bulletin-data");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.issueTag) setIssueTag(data.issueTag);
            if (data.awarenessItems) setAwarenessItems(data.awarenessItems.map((it) => makeAwarenessItem(it)));
            if (data.trainingItems) setTrainingItems(data.trainingItems.map((it) => makeTrainingItem(it)));
            if (data.adoption) {
              setAdoption({
                ...defaultAdoption(),
                ...data.adoption,
                extraItems: (data.adoption.extraItems || []).map((it) => makeAdoptionItem(it)),
              });
            }
            if (typeof data.rawHtmlEdit === "string") setRawHtmlEdit(data.rawHtmlEdit);
          }
        }
      } catch (e) {
        console.error("Failed to load saved AI bulletin:", e);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/save-digest?key=ai-bulletin-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ issueTag, awarenessItems, trainingItems, adoption, rawHtmlEdit, builtHtml: html }),
        });
        setSaveStatus(res.ok ? "saved" : "error");
      } catch (e) {
        console.error("Failed to save AI bulletin:", e);
        setSaveStatus("error");
      }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueTag, awarenessItems, trainingItems, adoption, rawHtmlEdit, loaded]);

  const move = (list, setList, index, dir) => {
    const arr = [...list];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    setList(arr);
  };

  const updateItem = (list, setList, id, patch) => {
    setList(list.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  // helpers scoped to adoption.extraItems, since it's nested one level inside `adoption`
  const updateExtraItem = (id, patch) => {
    setAdoption({
      ...adoption,
      extraItems: adoption.extraItems.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    });
  };
  const moveExtraItem = (index, dir) => {
    const arr = [...adoption.extraItems];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    setAdoption({ ...adoption, extraItems: arr });
  };
  const removeExtraItem = (id) => {
    setAdoption({ ...adoption, extraItems: adoption.extraItems.filter((x) => x.id !== id) });
  };

  const generatedHtml = buildFullHTML({ issueTag, awarenessItems, trainingItems, adoption });
  const isEdited = rawHtmlEdit !== null;
  const html = isEdited ? rawHtmlEdit : generatedHtml;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      setCopied(false);
    }
  };

  const tabBtn = (key, label, Icon) => (
    <button
      onClick={() => setTab(key)}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 ${
        tab === key ? "border-indigo-700 text-indigo-800" : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-3">
        <img
              src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
              alt="SSA Logo"
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-bold text-indigo-900">AI Bulletin Builder</h1>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {saveStatus === "saving" && <><Loader2 size={13} className="animate-spin" /> Saving…</>}
            {saveStatus === "saved" && <><Save size={13} /> Saved</>}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 mb-3 p-3">
          <Field label="Issue tag">
            <input className={inputCls} value={issueTag} onChange={(e) => setIssueTag(e.target.value)} placeholder="Issue 04 | Sep 2026" />
          </Field>
        </div>

        {viewingRecordId === null ? (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 bg-white rounded-t-lg px-2">
              <div className="flex">
                {tabBtn("awareness", "Awareness", BookOpen)}
                {tabBtn("training", "Training", GraduationCap)}
                {tabBtn("adoption", "Adoption", TrendingUp)}
                {tabBtn("preview", "Preview & Export", Eye)}
              </div>
              <button
                onClick={() => setViewingRecordId(-1)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-700 px-2"
              >
                <Archive size={15} /> Issue Archive
              </button>
            </div>

            <div className="bg-white rounded-b-lg border border-t-0 border-gray-200 p-4">

              {tab === "awareness" && (
                <div className="space-y-4">
                  {awarenessItems.map((item, i) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-indigo-700">
                          {item.header.trim() || `Item ${i + 1} (untitled)`}
                          {item.isPreset && <span className="ml-2 text-gray-400 font-normal">(preset)</span>}
                        </span>
                        <MoveButtons
                          index={i}
                          length={awarenessItems.length}
                          onMove={(index, dir) => move(awarenessItems, setAwarenessItems, index, dir)}
                          onRemove={() => setAwarenessItems(awarenessItems.filter((x) => x.id !== item.id))}
                        />
                      </div>

                      <Field label="Item block header">
                        <input
                          className={inputCls}
                          value={item.header}
                          onChange={(e) => updateItem(awarenessItems, setAwarenessItems, item.id, { header: e.target.value })}
                        />
                      </Field>

                      <Field label="Body">
                        <RichTextEditor
                          value={item.body}
                          onChange={(htmlVal) => updateItem(awarenessItems, setAwarenessItems, item.id, { body: htmlVal })}
                        />
                      </Field>

                      <TagBlock
                        value={item.tag}
                        onChange={(htmlVal) => updateItem(awarenessItems, setAwarenessItems, item.id, { tag: htmlVal })}
                        color="navy"
                        label="Add optional tag block (e.g. Call for Participation)"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setAwarenessItems([...awarenessItems, makeAwarenessItem()])}
                    className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900"
                  >
                    <Plus size={16} /> Add awareness item
                  </button>
                </div>
              )}

              {tab === "training" && (
                <div className="space-y-4">
                  {trainingItems.map((item, i) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-indigo-700">
                          {item.name.trim() || `Training ${i + 1} (untitled)`}
                        </span>
                        <MoveButtons
                          index={i}
                          length={trainingItems.length}
                          onMove={(index, dir) => move(trainingItems, setTrainingItems, index, dir)}
                          onRemove={() => setTrainingItems(trainingItems.filter((x) => x.id !== item.id))}
                        />
                      </div>

                      <Field label="Event / training name">
                        <input
                          className={inputCls}
                          value={item.name}
                          onChange={(e) => updateItem(trainingItems, setTrainingItems, item.id, { name: e.target.value })}
                        />
                      </Field>

                      <Field label="Partnership line (optional)">
                        <input
                          className={inputCls}
                          placeholder="Conducted in partnership with PwC"
                          value={item.partnershipLine}
                          onChange={(e) => updateItem(trainingItems, setTrainingItems, item.id, { partnershipLine: e.target.value })}
                        />
                      </Field>

                      <Field label="Programme details">
                        <RichTextEditor
                          value={item.body}
                          onChange={(htmlVal) => updateItem(trainingItems, setTrainingItems, item.id, { body: htmlVal })}
                        />
                      </Field>

                      <TagBlock
                        value={item.summaryTag}
                        onChange={(htmlVal) => updateItem(trainingItems, setTrainingItems, item.id, { summaryTag: htmlVal })}
                        color="blue"
                        label="Add optional brief summary tag"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setTrainingItems([...trainingItems, makeTrainingItem()])}
                    className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900"
                  >
                    <Plus size={16} /> Add training item
                  </button>
                </div>
              )}

              {tab === "adoption" && (
                <div className="space-y-4">
                  {ADOPTION_SECTIONS.map(({ key, header, color }) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-800 mb-2">{header}</p>
                      <Field label="Body">
                        <RichTextEditor
                          value={adoption[key].body}
                          onChange={(htmlVal) => setAdoption({ ...adoption, [key]: { ...adoption[key], body: htmlVal } })}
                        />
                      </Field>
                      <TagBlock
                        value={adoption[key].tag}
                        onChange={(htmlVal) => setAdoption({ ...adoption, [key]: { ...adoption[key], tag: htmlVal } })}
                        color={color}
                        label="Add optional tag block"
                      />
                    </div>
                  ))}

                  {/* extra, non-fixed items */}
                  {(adoption.extraItems || []).map((item, i) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-indigo-700">
                          {item.header.trim() || `Extra item ${i + 1} (untitled)`}
                        </span>
                        <MoveButtons
                          index={i}
                          length={adoption.extraItems.length}
                          onMove={moveExtraItem}
                          onRemove={() => removeExtraItem(item.id)}
                        />
                      </div>

                      <Field label="Item block header">
                        <input
                          className={inputCls}
                          value={item.header}
                          onChange={(e) => updateExtraItem(item.id, { header: e.target.value })}
                        />
                      </Field>

                      <Field label="Body">
                        <RichTextEditor
                          value={item.body}
                          onChange={(htmlVal) => updateExtraItem(item.id, { body: htmlVal })}
                        />
                      </Field>

                      <TagBlock
                        value={item.tag}
                        onChange={(htmlVal) => updateExtraItem(item.id, { tag: htmlVal })}
                        color="navy"
                        label="Add optional tag block"
                      />
                    </div>
                  ))}

                  <button
                    onClick={() => setAdoption({ ...adoption, extraItems: [...(adoption.extraItems || []), makeAdoptionItem()] })}
                    className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900"
                  >
                    <Plus size={16} /> Add adoption item
                  </button>
                </div>
              )}

              {tab === "preview" && (
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-800 text-white text-sm rounded font-medium hover:bg-indigo-900">
                      {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied!" : "Copy HTML"}
                    </button>
                    {isEdited && (
                      <button
                        onClick={() => setRawHtmlEdit(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded font-medium hover:bg-gray-50"
                      >
                        <RotateCcw size={15} /> Discard edits
                      </button>
                    )}
                  </div>
                  {isEdited && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-3">
                      Showing your manual edits. Other tabs won't reflect this — hand edits are export-only. Click <strong>Discard edits</strong> to go back to the generated version.
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mb-2">Live preview:</p>
                  <iframe title="preview" srcDoc={html} className="w-full border border-gray-300 rounded" style={{ height: "500px" }} />
                  <p className="text-xs text-gray-500 mt-4 mb-2 flex items-center gap-1">
                    <Code2 size={13} /> Raw HTML (editable — changes here update the preview and copy button above):
                  </p>
                  <textarea
                    className="w-full border border-gray-300 rounded p-2 text-xs font-mono"
                    style={{ height: "220px" }}
                    value={html}
                    onChange={(e) => setRawHtmlEdit(e.target.value)}
                    spellCheck={false}
                  />
                </div>
              )}
            </div>
          </>
        ) : viewingRecordId === -1 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <RecordsPanel builderKey="ai-bulletin-data" onSelect={(id) => setViewingRecordId(id)} />
            <button onClick={() => setViewingRecordId(null)} className="mt-3 text-sm text-gray-500 hover:text-indigo-700">
              ← Back to builder
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <RecordViewer recordId={viewingRecordId} onBack={() => setViewingRecordId(null)} />
          </div>
        )}
      </div>
    </div>
  );
}