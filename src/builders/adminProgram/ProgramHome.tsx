import { useEffect, useState } from "react";
import { Archive, Trash2, SquareArrowOutUpRight,   CircleCheck, Plus, Loader2, Save, Eye, Copy, Check } from "lucide-react";
import useConfirmDelete from "../../shared/useConfirmDelete";
import { uid, esc } from "../../shared/utils";
import NamePopUp from "../../shared/NamePopUpModal";
import ProgramBriefEditor from "./ProgramBriefEditor";
import ProgramHistory from "./programHistory";

const PROGRAM_BUILDER_KEY = "program-brief-data";

/* ---------- TYPES ---------- */

export type InfoFields = {
  date: string;
  time: string;
  venue: string;
  dressCode: string;
  audienceSize: string;
  catering: string;
};
export type RoleRow = { id: string; role: string; assignedTo: string };
export type ProgrammeRow = { id: string; time: string; activity: string; checks: string; owner: string };
export type Guest = { id: string; name: string; row: "" | "first" | "second" };
export type GuestList = { id: string; name: string; guests: Guest[] };
export type PackingItem = { id: string; text: string };
export type SetupBullet = { id: string; label: string; text: string};
export type CheckListItem = { id: string; text: string};
export type SetupTask = { id: string; title: string; bullets: SetupBullet[]; checklistTitle: string; checklist: CheckListItem[];};
export type SetupSection = { time: string; intro: string; tasks: SetupTask[] };


export interface AdminProgramme {
  id: string;
  eventName: string;
  info: InfoFields;
  roles: RoleRow[];
  setup: SetupSection[];
  programme: ProgrammeRow[];
  guestLists: GuestList[];
  selectedGuestListId: string;
  packing: PackingItem[];
}

/* ---------- DEFAULTS ---------- */

export const defaultPacking: PackingItem[] = Object.entries({
  laptops: "2 laptops with chargers",
  clickers: "2 slide clickers – ensure fully charged",
  moderatorTablet: "Tablet for moderator – ensure fully charged",
  regLists: "2 x registration lists",
  lanyards: "Lanyard and conference card + extras for walk-ins",
  speakerLabels: "Speaker labels for seating arrangement",
  timekeeper: "Bell & placard (red, yellow, green) for timekeeper",
  printedProgramme: "2 x printed admin programme, on standby",
  stationery: "Stationery (markers, pens, etc.)",
  ssaBanner: "SSA pull-up banner",
  sponsorBanners: "Sponsor pull-up banners & brochures",
  tablets: "2 tablets",
}).map(([id, text]) => ({ id, text }));

export const programTemplate = (eventName: string): AdminProgramme => {
  const listId = uid();
  return {
    id: uid(),
    eventName,
    info: { date: "", time: "", venue: "", dressCode: "", audienceSize: "", catering: "" },
    roles: [],
    setup: { time: "", intro: "", tasks: [] },
    programme: [],
    guestLists: [{ id: listId, name: "Guest List 1", guests: [] }],
    selectedGuestListId: listId,
    packing: defaultPacking.map((p) => ({ ...p })),
  };
};

// guards against missing/old fields in saved data
const str = (v: unknown) => (typeof v === "string" ? v : "");

export function normaliseProgramme(raw: any): AdminProgramme {
  const guestLists: GuestList[] =
    Array.isArray(raw?.guestLists) && raw.guestLists.length
      ? raw.guestLists.map((l: any) => ({
          id: l?.id ?? uid(),
          name: str(l?.name),
          guests: Array.isArray(l?.guests)
            ? l.guests.map((g: any) => ({
                id: g?.id ?? uid(),
                name: str(g?.name),
                row: g?.row === "first" || g?.row === "second" ? g.row : "",
              }))
            : [],
        }))
      : [{ id: uid(), name: "Guest List 1", guests: [] }];

  return {
    id: raw?.id ?? uid(),
    eventName: str(raw?.eventName),
    info: {
      date: str(raw?.info?.date),
      time: str(raw?.info?.time),
      venue: str(raw?.info?.venue),
      dressCode: str(raw?.info?.dressCode),
      audienceSize: str(raw?.info?.audienceSize),
      catering: str(raw?.info?.catering),
    },
    roles: Array.isArray(raw?.roles)
      ? raw.roles.map((r: any) => ({ id: r?.id ?? uid(), role: str(r?.role), assignedTo: str(r?.assignedTo) }))
      : [],
      setup: {
        time: str(raw?.setup?.time),
        intro: str(raw?.setup?.intro),
        tasks: Array.isArray(raw?.setup?.tasks)
          ? raw.setup.tasks.map((t: any) => ({
              id: t?.id ?? uid(),
              title: str(t?.title),
              bullets: Array.isArray(t?.bullets)
                ? t.bullets.map((b: any) => ({ id: b?.id ?? uid(), label: str(b?.label), text: str(b?.text) }))
                : [],
              checklistTitle: str(t?.checklistTitle),
              checklist: Array.isArray(t?.checklist)
                ? t.checklist.map((c: any) => ({ id: c?.id ?? uid(), text: str(c?.text) }))
                : [],
            }))
          : [],
      },
    programme: Array.isArray(raw?.programme)
      ? raw.programme.map((r: any) => ({
          id: r?.id ?? uid(),
          time: str(r?.time),
          activity: str(r?.activity),
          checks: str(r?.checks),
          owner: str(r?.owner),
        }))
      : [],
    guestLists,
    selectedGuestListId: guestLists.some((l) => l.id === raw?.selectedGuestListId)
      ? raw.selectedGuestListId
      : guestLists[0].id,
    packing: Array.isArray(raw?.packing)
      ? raw.packing.map((i: any) => ({ id: i?.id ?? uid(), text: str(i?.text) }))
      : defaultPacking.map((p) => ({ ...p })),
  };
}

/* ---------- HTML BUILDER ---------- */

const FONT = "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

const nl2br = (s: string) => esc(s).replace(/\r?\n/g, "<br>");

const LABEL = `font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8492a6;`;
const NOTE = `margin:10px 0 0;font-family:${FONT};font-size:11.5px;color:#8492a6;font-style:italic;`;

// heading text is passed already escaped
const heading = (html: string) => `<p style="margin:0 0 14px;${LABEL}">${html}</p>`;

const section = (inner: string, last = false) => `
        <tr>
          <td class="pad-sides" style="background:#ffffff;padding:24px 28px;${last ? "" : "border-bottom:1px solid #e2e8f0;"}">
${inner}
          </td>
        </tr>`;

const infoRow = (label: string, value: string) => `
              <tr>
                <td class="info-label-cell" width="190" valign="top" style="background:#f7f8fc;border:1px solid #d4dde8;padding:10px 14px;font-family:${FONT};font-size:12.5px;font-weight:700;color:#281e7e;">${label}</td>
                <td valign="top" style="background:#ffffff;border:1px solid #d4dde8;padding:10px 14px;font-family:${FONT};font-size:13px;color:#374151;">${value || "&nbsp;"}</td>
              </tr>`;

const thDark = (label: string) =>
  `<td style="background:#262261;border:1px solid #262261;padding:9px 12px;font-family:${FONT};font-size:10.5px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#ffffff;">${label}</td>`;

// Set-Up & Briefing is fixed text for now (edit here)


const bulletRows = (items: [string, string][]) =>
  items
    .map(
      ([b, t]) =>
        `<tr><td width="6" valign="top" style="padding:4px 8px 4px 0;color:#8492a6;">•</td><td style="padding:4px 0;font-family:${FONT};font-size:12.5px;color:#374151;"><strong>${esc(b)}</strong> – ${esc(t)}</td></tr>`
    )
    .join("");

const checklistTable = (title: string, items: string[], margin: string) => `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;border:1px solid #d4dde8;${margin}">
              <tr><td style="background:#f7f8fc;border:1px solid #d4dde8;padding:7px 12px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:#8492a6;">${esc(title)}</td></tr>
              ${items
                .map(
                  (i) =>
                    `<tr><td style="border:1px solid #d4dde8;padding:7px 12px;font-family:${FONT};font-size:12.5px;color:#374151;">${esc(i)}</td></tr>`
                )
                .join("\n              ")}
            </table>`;

export function buildFullHtml(p: AdminProgramme) {
  const list = p.guestLists.find((l) => l.id === p.selectedGuestListId) ?? p.guestLists[0];

  /* EVENT INFO */
  const eventInfo = section(`
            ${heading("Event Information")}
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
              ${infoRow("Date:", nl2br(p.info.date))}
              ${infoRow("Time:", nl2br(p.info.time))}
              ${infoRow("Venue:", nl2br(p.info.venue))}
              ${infoRow("Dress code:", nl2br(p.info.dressCode))}
              ${infoRow("Audience size:", nl2br(p.info.audienceSize))}
              ${infoRow("Catering arrangement:", nl2br(p.info.catering))}
            </table>`);

  /* ROLES */
  const roleRows = p.roles
    .map((r, i) => {
      const cell = `style="${i % 2 ? "background:#fafbfd;" : ""}border:1px solid #d4dde8;padding:8px 12px;font-family:${FONT};font-size:12.5px;color:#374151;"`;
      return `<tr><td ${cell}>${esc(r.role)}</td><td ${cell}>${nl2br(r.assignedTo)}</td></tr>`;
    })
    .join("\n                ");

  const rolesHead = (label: string, width = "") =>
    `<td ${width} style="background:#f7f8fc;border:1px solid #d4dde8;padding:8px 12px;font-family:${FONT};font-size:12.5px;font-weight:700;color:#281e7e;">${label}</td>`;

  const roles = section(`
            ${heading("Roles &amp; Responsibilities (During Event)")}
            <div class="table-scroll">
              <table class="wide-table" width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;border:1px solid #d4dde8;">
                <tr>${rolesHead("Role", 'width="35%"')}${rolesHead("Assigned To")}</tr>
                ${roleRows}
              </table>
            </div>
            <p style="${NOTE}">All technical department to STANDBY at their respective station once registration is over.</p>`);

  /* SET-UP & BRIEFING (static) */
  const setup = section(`
  ${heading(`Set-Up &amp; Briefing${p.setup.time.trim() ? ` — ${esc(p.setup.time)}` : ""}`)}
  ${p.setup.intro.trim() ? `<p style="margin:0 0 16px;font-family:${FONT};font-size:13px;color:#374151;">${nl2br(p.setup.intro)}</p>` : ""}
${p.setup.tasks
.map((t, i) => {
const last = i === p.setup.tasks.length - 1;
return `
  <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;font-weight:700;color:#281e7e;">${esc(t.title)}</p>
  ${t.bullets.length ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 14px;">
    ${bulletRows(t.bullets.map((b): [string, string] => [b.label, b.text]))}
  </table>` : ""}
  ${t.checklist.length ? checklistTable(t.checklistTitle, t.checklist.map((c) => c.text), last ? "" : "margin:0 0 20px;") : ""}`;
})
.join("\n")}`);

  /* PROGRAMME */
  const progRows = p.programme
    .map((r, i) => {
      const bg = i % 2 ? "#fafbfd" : "#ffffff";
      const cell = (extra: string, v: string) =>
        `<td style="background:${bg};border:1px solid #d4dde8;padding:9px 12px;font-family:${FONT};${extra}">${v}</td>`;
      return `<tr>${cell("font-size:12.5px;font-weight:700;color:#281e7e;white-space:nowrap;", esc(r.time))}${cell("font-size:12.5px;color:#374151;", nl2br(r.activity))}${cell("font-size:12px;color:#6b7280;", nl2br(r.checks))}${cell("font-size:12.5px;color:#374151;", nl2br(r.owner) || "–")}</tr>`;
    })
    .join("\n                ");

  const programme = section(`
            ${heading(`Program Summary${p.info.time.trim() ? ` — ${esc(p.info.time)}` : ""}`)}
            <div class="table-scroll">
              <table class="wide-table" width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;border:1px solid #d4dde8;">
                <tr>${thDark("Time")}${thDark("Activity")}${thDark("Technical &amp; Programme Checks")}${thDark("Speaker")}</tr>
                ${progRows}
              </table>
            </div>`);

  /* FLOOR PLAN (placeholder for now) */
  const floorPlan = section(`
            ${heading("Floor Plan")}
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td align="center" style="border:1px solid #c7d0e0;background:#fafbfd;padding:28px;font-family:${FONT};font-size:12.5px;color:#8492a6;">
                  [ <Insert />
                  <paste></paste> floor plan image here ]
                </td>
              </tr>
            </table>`);

  /* GUEST LIST */
  const guestRows = (list?.guests ?? [])
    .map((g, i) => {
      const tag = g.row
        ? ` <span style="color:#b45309;font-weight:700;">– ${g.row} row</span>`
        : "";
      return `<tr><td width="30" valign="top" style="padding:6px 12px;border-bottom:1px solid #eef1f6;font-family:${FONT};font-size:12.5px;font-weight:700;color:#8492a6;">${i + 1}.</td><td style="padding:6px 12px;border-bottom:1px solid #eef1f6;font-family:${FONT};font-size:12.5px;color:#374151;">${esc(g.name)}${tag}</td></tr>`;
    })
    .join("\n                ");

  const guests = section(`
            ${heading("Guest List for Seating Arrangement")}
            <div class="table-scroll">
              <table class="wide-table" width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                ${guestRows}
              </table>
            </div>`);

  /* PACKING LIST */
  const packRows = p.packing
    .map(
      (it) =>
        `<tr><td width="26" align="center" valign="top" style="padding:7px 6px;border-bottom:1px solid #eef1f6;"><table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td width="13" height="13" style="width:13px;height:13px;border:1.5px solid #281e7e;font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td><td style="padding:7px 12px;border-bottom:1px solid #eef1f6;font-family:${FONT};font-size:12.5px;color:#374151;">${esc(it.text)}</td></tr>`
    )
    .join("\n                ");

  const packing = section(
    `
            ${heading("Technical Department Packing List")}
            <div class="table-scroll">
              <table class="wide-table" width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                ${packRows}
              </table>
            </div>
            <p style="${NOTE}">Remove / add items where necessary.</p>`,
    true
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!--[if !mso]><!-->
  <meta name="x-apple-disable-message-reformatting">
  <!--<![endif]-->

  <title>SSA Admin Programme</title>

  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
        <o:AllowPNG/>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->

  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; display: block; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; background-color: #f0f4f8; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }

    /* wide tables scroll instead of squeezing columns on small screens */
    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .wide-table { min-width: 560px; }

    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .header-img { width: 100% !important; height: auto !important; }
      .pad-sides { padding-left: 16px !important; padding-right: 16px !important; }
      .title-cell { padding: 16px 16px !important; }
      .title-text { font-size: 17px !important; }
      .info-label-cell { width: 120px !important; font-size: 11.5px !important; }
      .footer-cell { padding: 16px 16px !important; }
    }
  </style>
</head>

<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:${FONT};color:#374151;font-size:14px;line-height:1.6;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#f0f4f8;">
  <tr>
    <td align="center" style="padding-top:32px;padding-bottom:32px;padding-left:20px;padding-right:20px;">

      <!--[if mso]>
      <table width="962" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
        <tr>
          <td width="962">
      <![endif]-->

      <table class="email-container" width="962" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="width:100%;max-width:962px;background:#ffffff;border:1px solid #d4dde8;">

        <!-- BANNER -->
        <tr>
          <td style="padding:0;font-size:0;line-height:0;">
            <img class="header-img" src="https://raw.githubusercontent.com/Webster2316/SSA_Training_Bulletin/refs/heads/main/Banner6.png" width="962" alt="SSA" style="display:block;width:100%;max-width:962px;height:auto;border:0;">
          </td>
        </tr>

        <!-- TITLE BAND -->
        <tr>
          <td class="title-cell" style="background:#262261;padding:20px 28px;">
            <span style="display:block;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9aa3e0;margin:0 0 6px;">Admin Programme</span>
            <span class="title-text" style="display:block;font-family:${FONT};font-size:21px;font-weight:700;line-height:1.4;color:#ffffff;">${esc(p.eventName)}</span>
          </td>
        </tr>
${eventInfo}
${roles}
${setup}
${programme}
${floorPlan}
${guests}
${packing}

        <!-- FOOTER -->
        <tr>
          <td class="footer-cell" style="background:#281e7e;padding:20px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td align="center">
                  <p style="margin:0;font-family:${FONT};font-size:11px;color:#ffffff;line-height:1.7;">Singapore Shipping Association</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

      <!--[if mso]>
          </td>
        </tr>
      </table>
      <![endif]-->

    </td>
  </tr>
</table>

</body>
</html>`;
}

/* ---------- HOME ---------- */

function getDateTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ProgramHome() {
  const [tab, setTab] = useState<"programmes" | "preview" | "history">("programmes");
  const [programmes, setProgrammes] = useState<AdminProgramme[]>([]);
  const [selectedArchivedBrief, setSelectedArchivedBrief] = useState<AdminProgramme | null>(null)
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const { confirmDelete, deleteModal } = useConfirmDelete();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);


  const handleMovetoCurrent = (p: any) => {
    const copy = normaliseProgramme({
      ...p,
      id: uid(),
    });
  
    setProgrammes((prev) => [
      ...prev,
      copy,
    ]);
  
    setTab("programmes");
  };
  
  const handleRestoreEvent = async (archiveId: number, p: any) => {
    try {
      const res = await fetch(`/api/recordsAndHistory?type=program&id=${archiveId}`,
      {
        method: "DELETE",
      });
  
      if(!res.ok) {
        console.error("Failed to restore event");
        return;
      }
      const restored = normaliseProgramme({
        ...p,

      });
  
      setProgrammes((prev) => [
        ...prev,
        p,
      ]);
  
      setTab("programmes");
    } catch (e) {
  console.error("Failed to restore event:", e)
    }
  };
  
  const completedProgram = async (p: AdminProgramme) => {
    try {
      const res = await fetch("/api/recordsAndHistory?type=program", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          builderKey: PROGRAM_BUILDER_KEY,
          programmes: {
            ...p,
          },
        }),
      });
 
      if (res.ok) {
        setProgrammes((prev) => prev.filter((item) => item.id !== p.id));
      } else if (!res.ok){
        const errorText = await res.text();
        console.error("Failed to move brief into archive:", res.status, errorText);
        return;
        } 
 
    } catch (e) {
      console.error("Failed to move to archive", e);
    }
  };


  // LOAD once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/digest?key=${PROGRAM_BUILDER_KEY}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.programmes)) {
            setProgrammes(data.programmes.map(normaliseProgramme));
          }
          setLoaded(true);
        } else if (res.status === 404) {
          setLoaded(true); // nothing saved yet
        } else {
          setSaveStatus("error"); // don't enable saving or we could overwrite real data
        }
      } catch (e) {
        console.error("Failed to load programme builder:", e);
        setSaveStatus("error");
      }
    })();
  }, []);

  // Home is the single save owner. The editor only updates `programmes`.
  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/digest?key=${PROGRAM_BUILDER_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programmes }),
        });
        setSaveStatus(res.ok ? `Saved at ${getDateTime()}` : "error");
      } catch (e) {
        console.error("Failed to save programme builder:", e);
        setSaveStatus("error");
      }
    }, 700);

    return () => clearTimeout(t);
  }, [programmes, loaded]);

  const handleAdd = (name: string) => setProgrammes((prev) => [...prev, programTemplate(name)]);

  const duplicateProgramme = (p: AdminProgramme) =>
    setProgrammes((prev) => {
      const copy: AdminProgramme = {
        ...JSON.parse(JSON.stringify(p)),
        id: uid(),
        eventName: `${p.eventName} (copy)`,
      };
      const i = prev.findIndex((x) => x.id === p.id);
      return [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)];
    });

  const previewProgramme = programmes.find((p) => p.id === previewId) ?? programmes[0];
  const html = previewProgramme ? buildFullHtml(previewProgramme) : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error("Failed to copy HTML:", e);
      setCopied(false);
    }
  };

  if (selectedId) {
    return (
      <ProgramBriefEditor
        programmeId={selectedId}
        programmes={programmes}
        setProgrammes={setProgrammes}
        onBack={() => setSelectedId(null)}
        saveStatus={saveStatus}
      />
    );
  }
  if (selectedArchivedBrief) {
    return (
      <ProgramBriefEditor
        archivedProgramme={selectedArchivedBrief}
        programmes={programmes}
        setProgrammes={setProgrammes}
        onBack={() => setSelectedArchivedBrief(null)}
        saveStatus={saveStatus}
        readOnly
      />
    );
  }
  const tabCls = (active: boolean) =>
    `flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 ${
      active
        ? "border-indigo-700 text-indigo-700"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-4xl p-4">
        {/* HEADER */}
        <div className="mb-4 flex items-center gap-3">
          <img
            src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
            alt="SSA Logo"
            className="h-8 w-auto"
          />
          <h1 className="text-xl font-bold text-indigo-900">Admin Brief Builder</h1>

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

        {/* TABS */}
       {/* TABS */}
<div className="mb-5 flex gap-1 border-b border-gray-200">
  <button
    type="button"
    onClick={() => setTab("programmes")}
    className={tabCls(tab === "programmes")}
  >
    Programmes
  </button>

  <button
    type="button"
    onClick={() => setTab("history")}
    className={tabCls(tab === "history")}
  >
    <Archive size={15} />
    History
  </button>
</div>

        {/* PROGRAMME LIST */}
        {tab === "programmes" && (
          <>
            <div className="space-y-2">
              {programmes.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
                  <p className="text-sm text-gray-500">No admin programmes yet.</p>
                </div>
              ) : (
                programmes.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-gray-800">
                      {p.eventName || "Untitled Programme"}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(p.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-700"
                        title="Open programme"
                      >
                        <SquareArrowOutUpRight size={16} />
                      </button>
                      <button
    type="button"
    onClick={() => completedProgram(p)}
    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
  >
    <CircleCheck size={16} />
  </button>
                      <button
                        type="button"
                        onClick={() => duplicateProgramme(p)}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                        title="Duplicate programme"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          confirmDelete({
                            itemType: "programme",
                            itemName: p.eventName || "this programme",
                            action: () =>
                              setProgrammes((prev) => prev.filter((x) => x.id !== p.id)),
                          })
                        }
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete programme"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsNameModalOpen(true)}
              className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-900"
            >
              <Plus size={16} /> Add Programme
            </button>

            <NamePopUp
              isOpen={isNameModalOpen}
              onClose={() => setIsNameModalOpen(false)}
              onAdd={handleAdd}
              heading="Create New Admin Programme"
              fieldLabel="Event Name"
              placeholder="e.g.Event Name - Admin Program"
              buttonText="Create Programme"
            />
          </>
        )}
{tab === "history" && (
  <ProgramHistory
    builderKey={PROGRAM_BUILDER_KEY}
    viewPastEventDetails={setSelectedArchivedBrief}
    onCopyToCurrent={handleMovetoCurrent}
    onRestoreEvent={handleRestoreEvent}
  />
)}
        {deleteModal}
      </div>
    </div>
  );
}
