import { useEffect, useState } from "react";
import { Trash2, Plus, Eye, Save, Loader2, Pencil, ListStart, ListEnd, PackagePlus, Copy, Check, RotateCcw, Code2 } from "lucide-react";
import RichTextEditor from "../shared/richTextEditor";
import useConfirmDelete from "../shared/useConfirmDelete";

type SponsorshipPackage = {
  id: string;
  name: string;
  contribution: string;
  tickets: string;
  linkedin: boolean;
  onsite: boolean;
  corporateVideo: boolean;
  nameColor: string;
  nameBackground: string;
};
type SponsorshipTable = {
  id: string;
  name: string;
  packages: SponsorshipPackage[];
}

interface SponsorItem {
  id: string;
  header: string;
  salutation: string;
  opening: string;
  tables: SponsorshipTable[];
  selectedTableId: string;
  closing: string;
}

const emptySponsor = (): SponsorItem => {
  const tableId = crypto.randomUUID();
  return {
    id: crypto.randomUUID(),
    header: "",
    salutation: "",
    opening: "",
    tables: [
      {
        id: tableId,
        name: "Standard Sponsorship Packages",
        packages: defaultPackages.map((p) => ({ ...p })),
      },
    ],
    selectedTableId: tableId,
    closing: "",
  };
};

const defaultPackages: SponsorshipPackage[] = [
  { id: "gold", name: "Gold Sponsor", contribution: "S$5,000", tickets: "8", linkedin: true, onsite: true, corporateVideo: true, nameColor: "#bf9708", nameBackground: "#f2f0fa" },
  { id: "silver", name: "Silver Sponsor", contribution: "S$3,000", tickets: "5", linkedin: true, onsite: true, corporateVideo: false, nameColor: "#6b7280", nameBackground: "#f7f8fa" },
  { id: "bronze", name: "Bronze Sponsor", contribution: "S$2,000", tickets: "3", linkedin: true, onsite: true, corporateVideo: false, nameColor: "#b45309", nameBackground: "#faf5f0" },
];

// options for the "add package" dropdown
const tierPresets: Record<string, Omit<SponsorshipPackage, "id">> = {
  gold: { ...defaultPackages[0] },
  silver: { ...defaultPackages[1] },
  bronze: { ...defaultPackages[2] },
  custom: { name: "New Sponsor", contribution: "", tickets: "0", linkedin: false, onsite: false, corporateVideo: false, nameColor: "#374151", nameBackground: "#f7f8fa" },
};


/* ---------- HTML BUILDER ---------- */

const FONT = "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// rich text editor gives bare <p>; email needs the inline margin
const stylePs = (html: string) =>
  html.replace(/<p>/g, `<p style="margin:0 0 14px;">`);

const th = (label: string, center = true) =>
  `<td ${center ? 'align="center"' : ""} style="background:#262261;padding:10px 12px;border:1px solid #262261;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#ffffff;">${label}</td>`;

const tick = (on: boolean) =>
  `<td align="center" style="padding:10px 12px;border:1px solid #d4dde8;font-family:${FONT};font-size:13px;${
    on ? "color:#1d7d26;font-weight:700;" : "color:#9ca3af;"
  }">${on ? "&#10003;" : "&#8211;"}</td>`;

function buildPackageRows(packages: SponsorshipPackage[]) {
  return packages
    .map(
      (p) => `
<tr>
  <td style="background:${p.nameBackground};padding:10px 12px;border:1px solid #d4dde8;font-family:${FONT};font-size:13px;font-weight:700;color:${p.nameColor};white-space:nowrap;">${escapeHtml(p.name)}</td>
  <td style="padding:10px 12px;border:1px solid #d4dde8;font-family:${FONT};font-size:13px;color:#374151;">${escapeHtml(p.contribution)}</td>
  <td align="center" style="padding:10px 12px;border:1px solid #d4dde8;font-family:${FONT};font-size:13px;color:#374151;">${escapeHtml(p.tickets)}</td>
  ${tick(p.linkedin)}${tick(p.onsite)}${tick(p.corporateVideo)}
</tr>`
    )
    .join("");
}

function buildFullHtml(s: SponsorItem) {
  const table = s.tables.find((t) => t.id === s.selectedTableId) ?? s.tables[0];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if !mso]><!-->
  <meta name="x-apple-disable-message-reformatting">
  <!--<![endif]-->
  <title>${escapeHtml(s.header) || "Sponsorship Invitation"}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
    img{-ms-interpolation-mode:bicubic;border:0;display:block;outline:none;text-decoration:none;}
    body{margin:0 !important;padding:0 !important;background-color:#f0f4f8;}
    a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;}
    .table-scroll{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .tier-table{min-width:600px;}
    @media only screen and (max-width:620px){
      .email-container{width:100% !important;max-width:100% !important;}
      .header-img{width:100% !important;height:auto !important;}
      .pad-sides{padding-left:16px !important;padding-right:16px !important;}
      .title-cell{padding:16px 16px !important;}
      .title-text{font-size:17px !important;}
      .footer-cell{padding:20px 16px !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:${FONT};color:#000000;font-size:15px;line-height:1.6;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#f0f4f8;">
<tr><td align="center" style="padding:32px 20px;">
<!--[if mso]><table width="962" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center"><tr><td width="962"><![endif]-->
<table class="email-container" width="962" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="width:100%;max-width:962px;background:#ffffff;border:1px solid #d4dde8;">

  <tr><td style="padding:0;font-size:0;line-height:0;">
    <img class="header-img" src="https://raw.githubusercontent.com/Webster2316/AI_Bulletin_Draft/refs/heads/main/Banner5.png" width="962" alt="SSA" style="display:block;width:100%;max-width:962px;height:auto;border:0;">
  </td></tr>

  <tr><td class="title-cell" style="background:#262261;padding:20px 28px;">
    <span class="title-text" style="font-family:${FONT};font-size:19px;font-weight:700;line-height:1.4;color:#ffffff;">${escapeHtml(s.header)}</span>
  </td></tr>

  <tr><td class="pad-sides" style="background:#ffffff;padding:26px 28px 4px 28px;">
    <p style="margin:0 0 16px;font-family:${FONT};font-size:14px;color:#281e7e;font-weight:700;">${escapeHtml(s.salutation)},</p>
    <div style="font-family:${FONT};font-size:13.5px;color:#374151;line-height:1.7;">${stylePs(s.opening)}</div>
  </td></tr>

  <tr><td class="pad-sides" style="background:#ffffff;padding:16px 28px 6px 28px;">
    <div class="table-scroll">
      <table class="tier-table" width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;border:1px solid #d4dde8;">
        <tr>
          ${th("Sponsorship Tier", false)}${th("Contribution", false)}${th("Complimentary Tickets*")}${th("Post-Event LinkedIn Acknowledgement")}${th("On-Site Acknowledgement")}${th("Corporate Video")}
        </tr>
        ${buildPackageRows(table.packages)}
      </table>
    </div>
    <p style="margin:8px 0 0;font-family:${FONT};font-size:11px;color:#8492a6;font-style:italic;">*Complimentary tickets are in addition to the complimentary event passes accorded to each SSA member company.</p>
  </td></tr>

  <tr><td class="pad-sides" style="background:#ffffff;padding:18px 28px 28px 28px;">
    <div style="font-family:${FONT};font-size:13.5px;color:#374151;line-height:1.7;">${stylePs(s.closing)}</div>
  </td></tr>

  <tr><td class="footer-cell" style="background:#281e7e;padding:24px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td align="center">
      <p style="margin:0;font-family:${FONT};font-size:12px;color:#ffffff;line-height:1.7;">This sponsorship invitation was sent to you by the Singapore Shipping Association (SSA). If you have any questions, please email <a href="mailto:sarah@ssa.org.sg" style="color:#81bce9;text-decoration:none;">sarah@ssa.org.sg</a>.</p>
    </td></tr></table>
  </td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>`;
}

/* ---------- COMPONENT ---------- */

const inputCls = "w-full rounded border border-gray-300 p-1.5 text-sm";

//for internal use mainly
export default function Sponsors() {
  const [tab, setTab] = useState("intro");
  const { confirmDelete, deleteModal } = useConfirmDelete();
  const [sponsor, setSponsor] = useState<SponsorItem>(emptySponsor);
  const [editingPackages, setEditingPackages] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [newTier, setNewTier] = useState("custom");
  const [copied, setCopied] = useState(false);
  const [rawHtmlEdit, setRawHtmlEdit] = useState<string | null>(null);

  const generatedHtml = buildFullHtml(sponsor);
  const html = rawHtmlEdit ?? generatedHtml;
  const isEdited = rawHtmlEdit !== null;


  function getDateTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/load-digest?key=sponsor-email-data");
        if (res.ok) {
          const data = await res.json();
         
          if (data && Array.isArray(data.tables) && data.tables.length > 0) {
            setSponsor({
              ...data,
              selectedTableId: data.tables.some((t: SponsorshipTable) => t.id === data.selectedTableId)
                ? data.selectedTableId
                : data.tables[0].id,
            });
          }
          setLoaded(true);
        } else if (res.status === 404) {
          setLoaded(true); 
        } else {
          setSaveStatus("error"); 
        }
      } catch (e) {
        console.error("Load failed", e);
        setSaveStatus("error");
      }
    })();
  }, []);
  
 
  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/Save-digest?key=sponsor-email-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sponsor),
        });
        setSaveStatus(res.ok ? "saved" : "error");
      } catch {
        setSaveStatus("error");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [sponsor, loaded]);


  const updateSponsor = (
    field: "header" | "salutation" | "opening" | "closing",
    value: string
  ) => setSponsor((prev) => ({ ...prev, [field]: value }));

  const selectedTable =
  sponsor.tables.find((t) => t.id === sponsor.selectedTableId) ?? sponsor.tables[0];
const tiers = selectedTable.packages;
const onlyOneTier = tiers.length <= 1;
const onlyOneTable = sponsor.tables.length <= 1;

const updateSelectedTable = (fn: (t: SponsorshipTable) => SponsorshipTable) =>
  setSponsor((prev) => ({
    ...prev,
    tables: prev.tables.map((t) => (t.id === prev.selectedTableId ? fn(t) : t)),
  }));

// --- tiers (rows) in the selected table ---
const updateTier = (id: string, field: keyof SponsorshipPackage, value: string | boolean) =>
  updateSelectedTable((t) => ({
    ...t,
    packages: t.packages.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
  }));

const addTier = () =>
  updateSelectedTable((t) => ({
    ...t,
    packages: [...t.packages, { ...tierPresets[newTier], id: crypto.randomUUID() }],
  }));

const removeTier = (id: string) =>
  updateSelectedTable((t) =>
    t.packages.length <= 1 ? t : { ...t, packages: t.packages.filter((p) => p.id !== id) }
  );

// --- whole tables ---
const selectTable = (id: string) =>
  setSponsor((prev) => ({ ...prev, selectedTableId: id }));

const renameTable = (name: string) => updateSelectedTable((t) => ({ ...t, name }));

const addTable = () => {
  const id = crypto.randomUUID();
  setSponsor((prev) => ({
    ...prev,
    tables: [
      ...prev.tables,
      {
        id,
        name: `Package Option ${prev.tables.length + 1}`,
        packages: [{ ...tierPresets.custom, id: crypto.randomUUID() }],
      },
    ],
    selectedTableId: id,
  }));
  setEditingPackages(true);
};

const removeTable = () =>
  setSponsor((prev) => {
    if (prev.tables.length <= 1) return prev; // always keep at least one
    const remaining = prev.tables.filter((t) => t.id !== prev.selectedTableId);
    return { ...prev, tables: remaining, selectedTableId: remaining[0].id };
  });
  const handleCopy = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tabBtn = (key: string, label: string, Icon: any) => (
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
      <div className="mx-auto max-w-5xl p-4">
        {/* HEADER */}
        <div className="mb-5 flex items-center gap-3">
          <img
            src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
            alt="SSA Logo"
            className="h-8 w-auto"
          />
          <h1 className="text-xl font-bold text-indigo-900">Sponsor Email Builder</h1>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
            {saveStatus === "saving" && (
              <>
                <Loader2 size={13} className="animate-spin" /> Saving…
              </>
            )}
            {saveStatus.startsWith("Saved at") && (
              <>
                <Save size={13} /> {saveStatus}
              </>
            )}
            {saveStatus === "error" && <span className="text-red-600">Save failed</span>}
          </div>
        </div>
        {/* HEADING + SALUTATION */}
        <div className="mb-4 rounded-lg border bg-white p-4">
          <label className="mb-1 block text-sm font-medium">Email Heading</label>
          <input className="w-full rounded border border-gray-300 p-2 text-sm" value={sponsor.header} onChange={(e) => updateSponsor("header", e.target.value)} />
          <label className="mb-1 mt-4 block text-sm font-medium">Salutation</label>
          <input className="w-full rounded border border-gray-300 p-2 text-sm" value={sponsor.salutation} onChange={(e) => updateSponsor("salutation", e.target.value)} />
        </div>

        {/* TABS */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white rounded-t-lg px-2">
          <div className="flex">
            {tabBtn("intro", "Intro", ListStart)}
            {tabBtn("package", "Package", PackagePlus)}
            {tabBtn("closing", "Closing", ListEnd)}
            {tabBtn("preview", "Preview & Export", Eye)}
          </div>
        </div>

        {/* INTRO */}
        {tab === "intro" && (
          <div className="rounded-b-lg border bg-white p-4">
            <RichTextEditor value={sponsor.opening} onChange={(v: string) => updateSponsor("opening", v)} />
          </div>
        )}

        {/* CLOSING */}
        {tab === "closing" && (
          <div className="rounded-b-lg border bg-white p-4">
            <RichTextEditor value={sponsor.closing} onChange={(v: string) => updateSponsor("closing", v)} />
          </div>
        )}

{tab === "package" && (
  <div className="rounded-b-lg border bg-white p-4">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-700">Sponsorship Packages</h2>
      <button
        onClick={() => setEditingPackages((v) => !v)}
        className="flex items-center gap-1.5 rounded bg-indigo-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-900"
      >
        <Pencil size={14} /> {editingPackages ? "Done" : "Edit"}
      </button>
    </div>

    {/* TABLE PICKER */}
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Package used in email:</label>
      <select
        value={selectedTable.id}
        onChange={(e) => selectTable(e.target.value)}
        className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
      >
        {sponsor.tables.map((t) => (
          <option key={t.id} value={t.id}>{t.name || "Untitled package"}</option>
        ))}
      </select>

      {editingPackages && (
        <>
          <input
            className={inputCls + " max-w-xs"}
            placeholder="Package name"
            value={selectedTable.name}
            onChange={(e) => renameTable(e.target.value)}
          />
          <button
            onClick={addTable}
            className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PackagePlus size={15} /> Add package
          </button>
          <button
            disabled={onlyOneTable}
            title={onlyOneTable ? "At least one package is required" : "Delete this package"}
            onClick={() =>
              confirmDelete({
                itemType: "package",
                itemName: selectedTable.name || "this package",
                action: () => removeTable(),
              })
            }
            className="flex items-center gap-1.5 rounded border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:border-gray-200 disabled:hover:bg-white"
          >
            <Trash2 size={15} /> Delete package
          </button>
        </>
      )}
    </div>

    <p className="mb-2 text-sm text-gray-500">(Headers differ in output)</p>

    {/* TIERS TABLE */}
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-indigo-900 text-left text-xs uppercase text-white">
            <th className="border p-2">Tier</th>
            <th className="border p-2">Contribution</th>
            <th className="border p-2 text-center">Tickets</th>
            <th className="border p-2 text-center">LinkedIn</th>
            <th className="border p-2 text-center">On-site</th>
            <th className="border p-2 text-center">Video</th>
            {editingPackages && <th className="border p-2" />}
          </tr>
        </thead>
        <tbody>
          {tiers.map((p) => (
            <tr key={p.id}>
              {editingPackages ? (
                <>
                  <td className="border p-1"><input className={inputCls} value={p.name} onChange={(e) => updateTier(p.id, "name", e.target.value)} /></td>
                  <td className="border p-1"><input className={inputCls} value={p.contribution} onChange={(e) => updateTier(p.id, "contribution", e.target.value)} /></td>
                  <td className="border p-1"><input className={inputCls + " text-center"} inputMode="numeric" value={p.tickets} onChange={(e) => updateTier(p.id, "tickets", e.target.value.replace(/\D/g, ""))} /></td>
                  {(["linkedin", "onsite", "corporateVideo"] as const).map((f) => (
                    <td key={f} className="border p-1 text-center">
                      <input type="checkbox" checked={p[f]} onChange={(e) => updateTier(p.id, f, e.target.checked)} />
                    </td>
                  ))}
                  <td className="border p-1 text-center">
                    <button
                      disabled={onlyOneTier}
                      title={onlyOneTier ? "At least one tier is required" : "Delete tier"}
                      onClick={() =>
                        confirmDelete({
                          itemType: "tier",
                          itemName: p.name || "this tier",
                          action: () => removeTier(p.id),
                        })
                      }
                      className="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="border p-2 font-bold" style={{ color: p.nameColor, background: p.nameBackground }}>{p.name}</td>
                  <td className="border p-2">{p.contribution}</td>
                  <td className="border p-2 text-center">{p.tickets}</td>
                  {[p.linkedin, p.onsite, p.corporateVideo].map((v, i) => (
                    <td key={i} className={`border p-2 text-center ${v ? "font-bold text-green-700" : "text-gray-400"}`}>{v ? "✓" : "–"}</td>
                  ))}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {editingPackages && (
      <div className="mt-3 flex items-center gap-2">
        <select
          value={newTier}
          onChange={(e) => setNewTier(e.target.value)}
          className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
          <option value="bronze">Bronze</option>
          <option value="custom">Custom</option>
        </select>
        <button onClick={addTier} className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Plus size={15} /> Add new tier
        </button>
      </div>
    )}
  </div>
)}
        {/* PREVIEW */}
        {tab === "preview" && (
          <div className="rounded-b-lg border bg-white p-4">
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
                Showing your manual edits. The other tabs won't reflect this — hand edits are export-only. Click <strong>Discard edits</strong> to go back to the generated version.
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

        {deleteModal}
      </div>
    </div>
  );
}