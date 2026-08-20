import { useState, useEffect } from "react";
import { Plus, Trash2, Copy, Check, Save, Eye, Code2, BookOpen, Archive, Loader2, RotateCcw, Files } from "lucide-react";
import Field from "../shared/field";
import MoveButtons from "../shared/moveButtons";
import RecordsPanel from "../shared/recordsPanel";
import RecordViewer from "../shared/recordViewer";
import { uid, esc, inputCls } from "../shared/utils";

const FONT = "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

const badgeStyles: Record<string, { text: string; bg: string; color: string; border: string }> = {
  confirmed: { text: "Confirmed", bg: "#eaf4fb", color: "#1b76bc", border: "#b8dcf2" },
  limited: { text: "Limited Seats", bg: "#fff3f3", color: "#993c1d", border: "#f0997b" },
  waitlist: { text: "Waitlist", bg: "#fff8e6", color: "#8a6d1d", border: "#eecf7a" },
  cancelled: { text: "Cancelled", bg: "#fbeaea", color: "#a12a2a", border: "#eeb4b4" },
};
const neutralBadge = { bg: "#f7f9fc", color: "#5f6a7d", border: "#dde4ec" };

function makeCourse(overrides = {}) {
  return Object.assign(
    {
      id: uid(),
      title: "",
      description: "", 
      dateRange: "",
      dateMonth: "MM YYYY",
      status: "confirmed",
      statusCustom: "",
      mode: "In-Person",
      modeCustom: "",
      extraTags: "",
      ctaLink: "https://www.ssa.org.sg/courses-calendar/",
      footnote: "Fee, venue &amp; enquiry options on the SSA Training page.",
    },
    overrides
  );
}

const defaultCourses = [

];

function buildBadgeSpan(badge: { text: string; bg: string; color: string; border: string }) {
  return `<span style="display:inline-block;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:3px 10px;border-radius:3px;background:${badge.bg};color:${badge.color};border:1px solid ${badge.border};margin-right:6px;">${esc(badge.text)}</span>`;
}

function buildCourseRow(course: any) {
  const title = course.title.trim() || "Untitled Course";
  const dateRange = course.dateRange.trim() || "TBC";
  const dateMonth = course.dateMonth.trim();

  const statusBadge = course.status === "custom"
    ? Object.assign({ text: course.statusCustom.trim() || "Status" }, neutralBadge)
    : badgeStyles[course.status];

  const modeBadge = course.mode === "custom"
    ? Object.assign({ text: course.modeCustom.trim() || "Mode" }, neutralBadge)
    : Object.assign({ text: course.mode }, neutralBadge);

  const extraBadges = course.extraTags
    .split(",")
    .map((t: string) => t.trim())
    .filter(Boolean)
    .map((t: string) => Object.assign({ text: t }, neutralBadge));

  const badgesHtml = [statusBadge, modeBadge, ...extraBadges].map(buildBadgeSpan).join("\n            ");

  const ctaLink = course.ctaLink.trim() || "https://www.ssa.org.sg/courses-calendar/";
  const footnote = course.footnote.trim() || "Fee, venue &amp; enquiry options on the SSA Training page.";

  return `  <!-- ── COURSE ROW ── -->
  <tr data-block="course" data-id="${esc(course.id)}">
    <td class="pad-sides" style="border-bottom:1px solid #e2e8f0;padding:16px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td class="course-date-cell" width="90" valign="middle" align="center" style="background-color:#281e7e;text-align:center;padding:10px 6px;width:90px;">
            <span data-f="date-range" style="display:block;font-family:${FONT};font-size:14px;font-weight:700;color:#ffffff;line-height:1.25;">${esc(dateRange)}</span>
            <span data-f="date-month" style="display:block;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#d9ecfb;margin-top:2px;">${esc(dateMonth)}</span>
          </td>

          <td width="16" style="font-size:0;line-height:0;">&nbsp;</td>

          <td class="course-content-cell" valign="middle">
            <p data-f="title" style="margin:0 0 8px;font-family:${FONT};font-size:15px;font-weight:700;color:#1a1464;line-height:1.3;"> ${esc(title)}</p>

${(course.description|| "").trim() ? `
<p data-f="description"
   style="margin:0 0 8px;
          font-family:${FONT};
          font-size:13px;
          color:#4b5563;
          line-height:1.45;">
  ${esc(course.description || "")}
</p>` : ""}

${badgesHtml}
          </td>

          <td width="16" style="font-size:0;line-height:0;">&nbsp;</td>

          <td class="course-cta-cell" width="176" valign="middle" align="right">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" class="cta-table" align="right">
              <tr>
                <td style="border-radius:3px;background-color:#1b76bc;" bgcolor="#1b76bc">
                  <a data-f="cta-link" href="${esc(ctaLink)}" target="_blank" class="cta-link" style="display:inline-block;padding:5px 8px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:3px;white-space:nowrap;">View Details &amp; Enrol</a><br>
                </td>
              </tr>
            </table><br>
            <p data-f="footnote" style="margin:8px 0 0;font-family:${FONT};font-size:10px;color:#8492a6;line-height:1.5;text-align:right;">${footnote}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- ── END COURSE ROW ── -->`;
}

function buildFullHTML({ greeting, courses }: { greeting: string; courses: any[] }) {
  const rowsHtml = courses.map(buildCourseRow).join("\n\n");
  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if !mso]><!-->
  <meta name="x-apple-disable-message-reformatting" />
  <!--<![endif]-->
  <title>SSA Training Emails</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; display: block; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; background-color: #f0f4f8; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .header-img { width: 100% !important; height: auto !important; }
      .pad-sides { padding-left: 16px !important; padding-right: 16px !important; }
      .meta-cell { display: block !important; width: 100% !important; text-align: left !important; padding-bottom: 4px !important; }
      .course-date-cell { display: block !important; width: auto !important; text-align: left !important; padding: 8px 12px !important; margin-bottom: 10px; }
      .course-content-cell { display: block !important; width: 100% !important; padding: 0 0 12px 0 !important; }
      .course-cta-cell { display: block !important; width: 100% !important; text-align: center !important; padding: 0 0 4px 0 !important; }
      .cta-table { width: 100% !important; }
      .cta-link { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
      .footer-cell { padding: 20px 16px !important; }
    }
  </style>
</head>
<!--[if mso]>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Yu Gothic UI',Arial,sans-serif;color:#000000;font-size:15px;line-height:1.6;">
<![endif]-->
<!--[if !mso]><!-->
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Yu Gothic UI',Arial,sans-serif;color:#000000;font-size:15px;line-height:1.6;">
<!--<![endif]-->

<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#f0f4f8;">
<tr>
<td align="center" style="padding-top:32px;padding-bottom:32px;padding-left:20px;padding-right:20px;">

<!--[if mso]>
<table width="680" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
<tr>
<td width="680">
<![endif]-->

<table class="email-container" width="680" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="max-width:680px;width:100%;background:#ffffff;border:1px solid #d4dde8;">

<tr>
  <td style="padding:0;font-size:0;line-height:0;">
    <div style="position:relative;">
      <img class="header-img" src="https://raw.githubusercontent.com/Webster2316/SSA_Training_Bulletin/refs/heads/main/Banner2.png" width="680" alt="SSA Training Bulletin" style="display:block;width:100%;max-width:680px;border:0;height:auto;">
      <!--[if !mso]><!-->
      <div style="position:absolute;left:0;left:24px;right:24px;bottom:-20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td style="background:#ffffff;border-left:4px solid #1b76bc;padding:14px 18px;">
              <p data-f="greeting" style="margin:0;font-family:${FONT};font-size:14px;color:#2d3748;line-height:1.5;text-align:left;">${greeting}</p>
            </td>
          </tr>
        </table>
      </div>
      <!--<![endif]-->
    </div>
  </td>
</tr>

<!--[if mso]>
<tr>
  <td class="pad-sides" style="padding:16px 24px;background:#1b76bc;">
    <p style="margin:0;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:13px;color:#ffffff;line-height:1.4;text-align:left;">${greeting.replace(/<\/?strong>/g, "")}</p>
  </td>
</tr>
<![endif]-->

  <tr>
    <td class="pad-sides" style="padding:34px 24px 10px;background:#f7f9fc;border-bottom:1px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td width="90" style="font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8492a6;">Date(s)</td>
          <td width="16" style="font-size:0;line-height:0;">&nbsp;</td>
          <td style="font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8492a6;">Course / Details</td>
          <td width="16" style="font-size:0;line-height:0;">&nbsp;</td>
          <td width="176" align="right" style="font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8492a6;"></td>
        </tr>
      </table>
    </td>
  </tr>

${rowsHtml}

  <tr>
    <td class="footer-cell" style="background-color:#281e7e;padding:24px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td align="center">
            <p style="margin:0 0 8px;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:12px;color:#ffffff;line-height:1.7;">
              You are receiving this Training Digest because you are a Tier 1 member of SSA. If you wish to unsubscribe, please email
              <a href="mailto:ssa.admin@ssa.org.sg?subject=Unsubscribe" style="color:#e3f2fc;text-decoration:underline;">ssa.admin@ssa.org.sg</a>
              with the subject line <strong>"Unsubscribe"</strong>.
            </p>
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

export default function TrainingBulletinBuilder() {
  const [tab, setTab] = useState("courses");
  const [greeting, setGreeting] = useState("Dear Member, below is the list of the upcoming training courses by SSA.");
  const [courses, setCourses] = useState(defaultCourses);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [copied, setCopied] = useState(false);
  const [rawHtmlEdit, setRawHtmlEdit] = useState<string | null>(null);
  const [viewingRecordId, setViewingRecordId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/load-digest?key=training-bulletin-data");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.greeting) setGreeting(data.greeting);
           if (data.courses) {
  setCourses(data.courses.map((c: any) => ({ ...makeCourse(), ...c })));
}
            if (typeof data.rawHtmlEdit === "string") setRawHtmlEdit(data.rawHtmlEdit);
          }
        }
      } catch (e) {
        console.error("Failed to load saved training bulletin:", e);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/save-digest?key=training-bulletin-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ greeting, courses, rawHtmlEdit, builtHtml: html }),
        });
        setSaveStatus(res.ok ? "saved" : "error");
      } catch (e) {
        console.error("Failed to save training bulletin:", e);
        setSaveStatus("error");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [greeting, courses, rawHtmlEdit, loaded]);

  const move = (index: number, dir: number) => {
    const arr = [...courses];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    setCourses(arr);
  };

  const updateCourse = (id: string, patch: Partial<(typeof defaultCourses)[0]>) => {
    setCourses(courses.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const generatedHtml = buildFullHTML({ greeting, courses });
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
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <img
              src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
              alt="SSA Logo"
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-bold text-indigo-900">Training Bulletin Builder</h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {saveStatus === "saving" && (
              <>
                <Loader2 size={13} className="animate-spin" /> Saving…
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Save size={13} /> Saved
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 mb-3 p-3">
          <Field label="Header greeting (HTML like <strong> is fine)">
            <input className={inputCls} value={greeting} onChange={(e) => setGreeting(e.target.value)} />
          </Field>
        </div>

        {viewingRecordId === null ? (
  <>
    <div className="flex items-center justify-between border-b border-gray-200 bg-white rounded-t-lg px-2">
      <div className="flex">
        {tabBtn("courses", "Courses", BookOpen)}
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
      {tab === "courses" && (
        <div className="space-y-4">
          {courses.map((c, i) => (
            <div key={c.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-indigo-700">
                  {c.title.trim() || `Course ${i + 1} (untitled)`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCourses([...courses.slice(0, i + 1), makeCourse({ ...c, id: uid() }), ...courses.slice(i + 1)])}
                    className="p-1 rounded hover:bg-gray-100 text-gray-500"
                    title="Duplicate"
                  >
                    <Files size={16} />
                  </button>
                  <MoveButtons
                    index={i}
                    length={courses.length}
                    onMove={move}
                    onRemove={() => setCourses(courses.filter((x) => x.id !== c.id))}
                  />
                </div>
              </div>

              <Field label="Course title">
                <input className={inputCls} value={c.title} onChange={(e) => updateCourse(c.id, { title: e.target.value })} />
              </Field>
              <Field label="Description">
  <textarea
    className={inputCls}
    rows={2}
    value={c.description || ""}
    onChange={(e) =>
      updateCourse(c.id, { description: e.target.value })
    }
  />
</Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Date range">
                  <input className={inputCls} placeholder="e.g. 8-9" value={c.dateRange} onChange={(e) => updateCourse(c.id, { dateRange: e.target.value })} />
                </Field>
                <Field label="Date month">
                  <input className={inputCls} placeholder="e.g. July 2026" value={c.dateMonth} onChange={(e) => updateCourse(c.id, { dateMonth: e.target.value })} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Status badge">
                  <select className={inputCls} value={c.status} onChange={(e) => updateCourse(c.id, { status: e.target.value })}>
                    <option value="confirmed">Confirmed</option>
                    <option value="limited">Limited Seats</option>
                    <option value="waitlist">Waitlist</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="custom">Custom…</option>
                  </select>
                </Field>
                <Field label="Custom status text">
                  <input className={inputCls} value={c.statusCustom} onChange={(e) => updateCourse(c.id, { statusCustom: e.target.value })} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Delivery mode badge">
                  <select className={inputCls} value={c.mode} onChange={(e) => updateCourse(c.id, { mode: e.target.value })}>
                    <option value="In-Person">In-Person</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="custom">Custom…</option>
                  </select>
                </Field>
                <Field label="Custom mode text">
                  <input className={inputCls} value={c.modeCustom} onChange={(e) => updateCourse(c.id, { modeCustom: e.target.value })} />
                </Field>
              </div>

              <Field label="Extra tags (comma-separated)">
                <input className={inputCls} placeholder="On-going, New" value={c.extraTags} onChange={(e) => updateCourse(c.id, { extraTags: e.target.value })} />
              </Field>

              <Field label="Course link">
                <input className={inputCls} value={c.ctaLink} onChange={(e) => updateCourse(c.id, { ctaLink: e.target.value })} />
              </Field>

              <Field label="Footnote under the button">
                <input className={inputCls} value={c.footnote} onChange={(e) => updateCourse(c.id, { footnote: e.target.value })} />
              </Field>
            </div>
          ))}
          <button
            onClick={() => setCourses([...courses, makeCourse()])}
            className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900"
          >
            <Plus size={16} /> Add course
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
              Showing your manual edits. The Courses tab won't reflect this — hand edits are export-only. Click <strong>Discard edits</strong> to go back to the generated version.
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
    <RecordsPanel
      builderKey="training-bulletin-data"
      onSelect={(id) => setViewingRecordId(id)}
    />
    <button
      onClick={() => setViewingRecordId(null)}
      className="mt-3 text-sm text-gray-500 hover:text-indigo-700"
    >
      ← Back to builder
    </button>
  </div>
) : (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <RecordViewer
      recordId={viewingRecordId}
      onBack={() => setViewingRecordId(null)}
    />
  </div>
)}
      </div>
    </div>
  );
}
