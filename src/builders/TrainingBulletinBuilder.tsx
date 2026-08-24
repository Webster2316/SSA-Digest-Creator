import { useState, useEffect } from "react";
import { Plus, Trash2, Copy, Check, Save, Eye, Code2, BookOpen, Archive, Megaphone, Loader2, RotateCcw, Files, ArrowRightLeft, Pin } from "lucide-react";
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
  highDemand: {text: "High Demand", bg: "#fbeaea", color: "#a12a2a", border: "#eeb4b4"},
};
const neutralBadge = { bg: "#f7f9fc", color: "#5f6a7d", border: "#dde4ec" };

function makeCourse(overrides = {}) {
  return Object.assign(
    {
      id: uid(),
      title: "",
      description: "", 
      dateRange: "",
      dateMonth: "MONTH YYYY",
      status: "confirmed",
      statusCustom: "",
      statusCustomColor: "#331bbf",
      mode: "In-Person",
      modeCustom: "",
      modeCustomColor: "#331bbf",
      customOrder: false,
      extraTags: "",
      ctaLink: "https://www.ssa.org.sg/courses-calendar/",
      footnote: "Contact ariel@ssa.org.sg for details",
    },
    overrides
  );
}

const defaultCourses = [

];
function escWithBreaks(text: string) {
  return esc(text).replace(/\n/g, "<br>");
}
function buildBadgeSpan(badge: { text: string; bg: string; color: string; border: string }) {
  return `<span style="display:inline-block;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:3px 10px;border-radius:3px;background:${badge.bg};color:${badge.color};border:1px solid ${badge.border};margin-right:6px;">${esc(badge.text)}</span>`;
}

//concats dates 
function getSortDate(course: any) {
  const firstDay = course.dateRange.split("-")[0];
  const dateStr =  `${firstDay} ${course.dateMonth}` ;
  return new Date(dateStr);
}

// non-pinned items sort by date; pinned - NEW items/customOrder items keep their exact slot
function sortWithPinned(list: any[]) {
  const sorted = [...list].sort((a, b) =>
    getSortDate(a).getTime() - getSortDate(b).getTime()
  );

  const pinned = sorted.filter(c => c.customOrder);
  const normal = sorted.filter(c => !c.customOrder);

  return [...pinned, ...normal];
}
function buildCourseRow(course: any) {
  const title = course.title.trim() || "Untitled Course";
  const dateRange = course.dateRange.trim() || "TBC";
  const dateMonth = course.dateMonth.trim();
  const isNewCourse = /NEW/i.test(title);
  const dateBoxColor = isNewCourse ? "#4f0615" : "#281e7e";

  const statusBadge = course.status === "custom"
    ?  {
      text: course.statusCustom.trim() || "Status",
      bg: course.statusCustomColor || "#331bbf",
      color: "#ffffff",
      border: course.statusCustomColor || "#331bbf",
    } 
    : badgeStyles[course.status];

  const modeBadge = course.mode === "custom"
    ?{
      text: course.modeCustom.trim() || "Mode",
      bg: course.modeCustomColor || "#331bbf",
      color: "#ffffff",
      border: course.modeCustomColor || "#331bbf",
    }
   : Object.assign({ text: course.mode }, neutralBadge);

  const extraBadges = course.extraTags
    .split(",")
    .map((t: string) => t.trim())
    .filter(Boolean)
    .map((t: string) => Object.assign({ text: t }, neutralBadge));

  const badgesHtml = [statusBadge, modeBadge, ...extraBadges].map(buildBadgeSpan).join("\n            ");

  // Button and footnote are now independent — each shows only if its own field is filled in
  const ctaLink = course.ctaLink.trim();
  const showCta = ctaLink.length > 0;
  const footnote = course.footnote.trim();
  const showFootnote = footnote.length > 0;
  const emailLink = `mailto:Ariel@ssa.org.sg?subject=Enquiry on ${encodeURIComponent(course.title)}`;

  return `  <!-- ── COURSE ROW ── -->
  <tr data-block="course" data-id="${esc(course.id)}">
    <td class="pad-sides" style="border-bottom:1px solid #e2e8f0;padding:16px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td class="course-date-cell" width="90" valign="middle" align="center"style="background-color:${dateBoxColor};text-align:center;padding:10px 6px;width:90px;">
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
  ${escWithBreaks(course.description || "")}
</p>` : ""}

${badgesHtml}
          </td>

          <td width="16" style="font-size:0;line-height:0;">&nbsp;</td>

          <td class="course-cta-cell" width="176" valign="middle" align="right">
${showCta ? `           
 <table cellpadding="0" cellspacing="0" border="0" role="presentation" class="cta-table" align="right">
              <tr>
                <td style="border-radius:3px;background-color:#1b76bc;" bgcolor="#1b76bc">
                  <a data-f="cta-link" href="${esc(ctaLink)}" target="_blank" class="cta-link" style="display:inline-block;padding:5px 8px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:3px;white-space:nowrap;">View Details &amp; Enrol</a><br>
                </td>
              </tr>
            </table><br>` : ""}

            ${showCta ? `           
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" class="cta-table" align="right" style="margin-top:8px;padding-right:10px">
                         <tr>
                           <td style="border-radius:3px;background-color:#1b76bc;" bgcolor="#1b76bc">
                           <a data-f="email-link" href="${esc(emailLink)}" target="_blank" class="cta-link" style="display:inline-block;padding:5px 8px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:3px;white-space:nowrap;">Email For Details</a><br>
                           </td>
                         </tr>
                       </table><br>` : ""}
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- ── END COURSE ROW ── -->`;
}

function buildFullHTML({ issueRange, greeting, courses, eobItems}: { issueRange: string; greeting: string; courses: any[]; eobItems: any[] }) {
  const rowsHtml = courses.map(buildCourseRow).join("\n\n");
  const eobRowsHtml = eobItems.map(buildCourseRow).join("\n\n");
  const eobSectionHtml = eobItems.length > 0 ? `<tr>
  <td class="pad-sides" style="padding:12px 24px;background:#2e468c;border-bottom:1px solid #0098ce;">
    <p style="margin:0;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;">EOB Programme for Support Staffs</p>
  </td>
</tr>
${eobRowsHtml}` : "";
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
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
      <tr>
        <td data-f="issue-range" style="background-color:#0098ce;padding:12px 24px;text-align:center;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ffffff;">${esc(issueRange)}</td>
      </tr>
    </table>
    <tr>
  <tr>
<td style="background:#ffffff;padding:14px 24px;border:1px solid #2e468c;">
  <p data-f="greeting" style="margin:0;font-family:${FONT};font-size:14px;color:#1f3b7a;line-height:1.5;text-align:left;">
    ${escWithBreaks(greeting)}
  </p>
</td>
</tr>
    </div>
  </td>
</tr>

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
${eobSectionHtml}

  <tr>
    <td class="footer-cell" style="background-color:#281e7e;padding:24px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td align="center">
            <p style="margin:0 0 8px;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:12px;color:#ffffff;line-height:1.7;">
             You are receiving the SSA Member Learning Calendar because you have previously enrolled in SSA courses. <br>
 
As part of our learning community, you are on a shared learning journey with SSA. The Member Learning Calendar brings together upcoming SSA training, learning opportunities and professional development activities to support your continued learning and development.
 
We look forward to continuing this learning journey with you. <br>
 
 
If you wish to unsubscribe from the Member Learning Calendar, please email ariel@ssa.org.sg 
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
  const[eobItems, setEobItems] = useState<any[]>([]);
  const [courses, setCourses] = useState(defaultCourses);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [copied, setCopied] = useState(false);
  const [issueRange, setIssueRange] = useState("Issue: ");
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
            if (data.issueRange) setIssueRange(data.issueRange);
            if (data.eobItems) {
              setEobItems(data.eobItems.map((c: any) => ({...makeCourse(), ...c})));
            }
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
          body: JSON.stringify({ greeting, issueRange, courses, eobItems, rawHtmlEdit, builtHtml: html }),
        });
        setSaveStatus(res.ok ? "saved" : "error");
      } catch (e) {
        console.error("Failed to save training bulletin:", e);
        setSaveStatus("error");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [greeting, issueRange, courses, eobItems, rawHtmlEdit, loaded]);

  const move = (list: any[], setList: (v: any[]) => void, index: number, dir: number) => {
    const arr = [...list];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    setList(arr);
  };
  
  const updateItem = (list: any[], setList: (v: any[]) => void, id: string, patch: any) => {
    setList(list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const updateCourse = (id: string, patch: Partial<(typeof defaultCourses)[0]>) => {
    setCourses(courses.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const copyItem = (item: any, target: "here" | "other") => {
    const copy = { ...item, id: uid() };
  
    const inCourses = tab === "courses";
  
    if (target === "here") {
      // Duplicate within the current tab
      const list = inCourses ? courses : eobItems;
      const setList = inCourses ? setCourses : setEobItems;
  
      const index = list.findIndex((x) => x.id === item.id);
  
      setList([
        ...list.slice(0, index + 1),
        copy,
        ...list.slice(index + 1),
      ]);
    } else {
      // MOVE to the other tab
      if (inCourses) {
        // Courses → EOB
        setEobItems([...eobItems, copy]);
        setCourses(courses.filter((x) => x.id !== item.id));
      } else {
        // EOB → Courses shift
        setCourses([...courses, copy]);
        setEobItems(eobItems.filter((x) => x.id !== item.id));
      }
    }
  };
  const sortedCourses = sortWithPinned(courses);
  const generatedHtml = buildFullHTML({ issueRange, greeting, courses: sortedCourses, eobItems });
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
<Field label="Header greeting ">
  <textarea
    className={inputCls}
    rows={3}
    value={greeting}
    onChange={(e) => setGreeting(e.target.value)}
  />
</Field>
          <Field label="Issue date range ">
  <input
    className={inputCls}
    value={issueRange}
    onChange={(e) => setIssueRange(e.target.value)}
  />
</Field>
        </div>

        {viewingRecordId === null ? (
  <>
    <div className="flex items-center justify-between border-b border-gray-200 bg-white rounded-t-lg px-2">
      <div className="flex">
        {tabBtn("courses", "Courses", BookOpen)}
        {tabBtn("eob", "EOB", Megaphone)}
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

      {/* courses tab */}
      {tab === "courses" && (
        <div className="space-y-4">
          {sortedCourses.map((c) => {
  const i = courses.findIndex((x) => x.id === c.id);
  return (
    <div key={c.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-indigo-700">
          {c.title.trim() || `Course ${i + 1} (untitled)`}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => copyItem(c, "here")} className="p-1 rounded hover:bg-gray-100 text-gray-500" title="Copy here">
            <Files size={16} />
          </button>
          <button onClick={() => copyItem(c, "other")} className="p-1 rounded hover:bg-gray-100 text-gray-500" title="Copy to EOB">
            <ArrowRightLeft size={16} />
          </button>
          <button
            onClick={() => updateCourse(c.id, { customOrder: !c.customOrder })}
            className={`p-1 rounded hover:bg-gray-100 ${c.customOrder ? "text-indigo-700" : "text-gray-400"}`}
            title={c.customOrder ? "Locked in place — click to auto-sort by date" : "Auto-sorted — click to lock position"}
          >
            <Pin size={16} />
          </button>
<button
  onClick={() => setCourses(courses.filter((x) => x.id !== c.id))}
  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
  title="Delete course"
>
  <Trash2 size={16} />
</button>
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
                  <div className="flex gap-2">
                  <input className={inputCls} value={c.statusCustom} onChange={(e) => updateCourse(c.id, { statusCustom: e.target.value })} />
    <input
      type="color"
      value={c.statusCustomColor}
      onChange={(e) => updateCourse(c.id, { statusCustomColor: e.target.value })}
      className="h-9 w-12 rounded border border-gray-300 cursor-pointer shrink-0"
      title="Badge color"
    /> 
                  </div>
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
                  <div className="flex gap-2">
                  <input className={inputCls} value={c.modeCustom} onChange={(e) => updateCourse(c.id, { modeCustom: e.target.value })} />
                  <input
      type="color"
      value={c.modeCustomColor}
      onChange={(e) => updateCourse(c.id, { modeCustomColor: e.target.value })}
      className="h-9 w-12 rounded border border-gray-300 cursor-pointer shrink-0"
      title="Badge color"
    /> 
                  </div>
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
          )})}
          <button
            onClick={() => setCourses([...courses, makeCourse()])}
            className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900"
          >
            <Plus size={16} /> Add course
          </button>
        </div>
   )}

{tab === "eob" && (
  <div className="space-y-4">
    {eobItems.map((c, i) => (
      <div key={c.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-indigo-700">
            {c.title.trim() || `EOB Item ${i + 1} (untitled)`}
          </span>

          <div className="flex items-center gap-1">
          <button
  onClick={() => copyItem(c, "here")}
  className="p-1 rounded hover:bg-gray-100 text-gray-500"
  title="Copy here"
>
  <Files size={16} />
</button>

<button
  onClick={() => copyItem(c, "other")}
  className="p-1 rounded hover:bg-gray-100 text-gray-500"
  title="Copy to Courses"
>
  <ArrowRightLeft size={16} />
</button>

          <MoveButtons
  index={i}
  length={eobItems.length}
  onMove={(index, dir) => move(eobItems, setEobItems, index, dir)}
  onRemove={() => setEobItems(eobItems.filter((x) => x.id !== c.id))}
/>
          </div>
        </div>

        <Field label="Course title">
          <input
            className={inputCls}
            value={c.title}
            onChange={(e) =>
              updateItem(eobItems, setEobItems, c.id, { title: e.target.value })
            }
          />
        </Field>

        <Field label="Description">
          <textarea
            className={inputCls}
            rows={2}
            value={c.description || ""}
            onChange={(e) =>
              updateItem(eobItems, setEobItems, c.id, {
                description: e.target.value,
              })
            }
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date range">
            <input
              className={inputCls}
              value={c.dateRange}
              onChange={(e) =>
                updateItem(eobItems, setEobItems, c.id, {
                  dateRange: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Date month">
            <input
              className={inputCls}
              value={c.dateMonth}
              onChange={(e) =>
                updateItem(eobItems, setEobItems, c.id, {
                  dateMonth: e.target.value,
                })
              }
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status badge">
            <select
              className={inputCls}
              value={c.status}
              onChange={(e) =>
                updateItem(eobItems, setEobItems, c.id, {
                  status: e.target.value,
                })
              }
            >
              <option value="confirmed">Confirmed</option>
              <option value="limited">Limited Seats</option>
              <option value="waitlist">Waitlist</option>
              <option value="cancelled">Cancelled</option>
              <option value="custom">Custom…</option>
            </select>
          </Field>

          <Field label="Custom status text">
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={c.statusCustom}
                onChange={(e) =>
                  updateItem(eobItems, setEobItems, c.id, {
                    statusCustom: e.target.value,
                  })
                }
              />
              <input
                type="color"
                value={c.statusCustomColor}
                onChange={(e) =>
                  updateItem(eobItems, setEobItems, c.id, {
                    statusCustomColor: e.target.value,
                  })
                }
                className="h-9 w-12 rounded border border-gray-300 cursor-pointer shrink-0"
              />
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Delivery mode badge">
            <select
              className={inputCls}
              value={c.mode}
              onChange={(e) =>
                updateItem(eobItems, setEobItems, c.id, {
                  mode: e.target.value,
                })
              }
            >
              <option value="In-Person">In-Person</option>
              <option value="Online">Online</option>
              <option value="Hybrid">Hybrid</option>
              <option value="custom">Custom…</option>
            </select>
          </Field>

          <Field label="Custom mode text">
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={c.modeCustom}
                onChange={(e) =>
                  updateItem(eobItems, setEobItems, c.id, {
                    modeCustom: e.target.value,
                  })
                }
              />
              <input
                type="color"
                value={c.modeCustomColor}
                onChange={(e) =>
                  updateItem(eobItems, setEobItems, c.id, {
                    modeCustomColor: e.target.value,
                  })
                }
                className="h-9 w-12 rounded border border-gray-300 cursor-pointer shrink-0"
              />
            </div>
          </Field>
        </div>

        <Field label="Extra tags (comma-separated)">
          <input
            className={inputCls}
            value={c.extraTags}
            onChange={(e) =>
              updateItem(eobItems, setEobItems, c.id, {
                extraTags: e.target.value,
              })
            }
          />
        </Field>

        <Field label="Course link">
          <input
            className={inputCls}
            value={c.ctaLink}
            onChange={(e) =>
              updateItem(eobItems, setEobItems, c.id, {
                ctaLink: e.target.value,
              })
            }
          />
        </Field>

        <Field label="Footnote under the button">
          <input
            className={inputCls}
            value={c.footnote}
            onChange={(e) =>
              updateItem(eobItems, setEobItems, c.id, {
                footnote: e.target.value,
              })
            }
          />
        </Field>
      </div>
    ))}

    <button
      onClick={() => setEobItems([...eobItems, makeCourse()])}
      className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900"
    >
      <Plus size={16} /> Add EOB item
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
