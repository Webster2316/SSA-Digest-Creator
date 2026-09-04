import { useState, useEffect } from "react";
import { Plus, Trash2, Copy, Check, Save, Eye, Code2, CalendarDays, Archive,  FileText, Loader2, RotateCcw, Files,  ArrowRightLeft, } from "lucide-react";
import Field from "../shared/field";
import MoveButtons from "../shared/moveButtons";
import RichTextEditor from "../shared/richTextEditor";
import RecordsPanel from "../shared/recordsPanel";
import RecordViewer from "../shared/recordViewer";
import { uid, esc, tagPills, formatDeadline, inputCls } from "../shared/utils";
import DocumentUploadModal from "../shared/documentUploadModal";
import useConfirmDelete from "../shared/useConfirmDelete";

const badgePresets = {
  Review: "#d0a523",
  PublicComments: "#81bce9",
  Advisory: "#730303",
  ICS: "#281e7e",
  UNCTAD: "#281e7e",
  Info: "#308acf",
};

const defaultEvents = [
  {
    id: uid(), day: "3", month: "Jul",
    title: "ICS - Efficient and Quiet Technologies for Ships",
    location: "Online", timeText: "12:00 – 13:00 BST | 13:00 – 14:00 CET",
    tags: "All Members, Webinar",
    venue: "Online",
    regText: "Registration here", regLink: "https://register.gotowebinar.com/",
    description: "Efficient and quiet technologies for ships are becoming increasingly important as the industry seeks to improve performance and reduce environmental impact. Join us for this insightful discussion highlighting the opportunities available to readily achieve reductions in underwater radiated noise as a co-benefit of efficiency improvements. The session will place particular emphasis on propeller design and operation, highlighting the care needed to improve efficiency while simultaneously reducing noise."
  }
];

//NEVER CHANGE
const defaultAction = [
  {
    id: uid(), badge: "Review", badgeColor: badgePresets.Review,
    title: "Joint Maritime Information Center (JMIC) Advisory Notes",
    deadline: "",
    docs: [{ label: "SSA Knowledge Hub – JMIC Advisory Notes", url: "https://ssaorgsg.sharepoint.com/sites/SSAKnowledgeHub/Bulletin/Forms/AllItems.aspx" }],
    tags: "All Members",
    content: "<p><strong>Action Required:</strong></p><p>Members are requested to note that the JMIC Advisory Notes are being uploaded regularly to the attached folder. Members are encouraged to:</p><ul><li>Exercise heightened vigilance,</li><li>Review contingency plans,</li><li>Maintain close communication with charterers and relevant authorities, and</li><li>Comply with all recommended reporting procedures.</li></ul><p><strong>Background:</strong></p><p>The JMIC is a multinational information-sharing and analysis centre that monitors and assesses maritime security developments across key shipping corridors. The Secretariat is sharing the attached advisories to ensure members remain informed of the evolving situation.</p><p>Kindly direct any questions or comments to anis@ssa.org.sg.</p>"
  }
];

const defaultNoting = [
  {
    id: uid(), badge: "Advisory", badgeColor: badgePresets.Advisory,
    title: "MC(26)78 - UNITED KINGDOM'S EMISSIONS TRADING SCHEME FOR SHIPPING",
    tags: "Committee 1, Committee 2",
    docs: [{ label: "MC(26)78 - UNITED KINGDOM'S EMISSIONS TRADING SCHEME FOR SHIPPING.docx", url: "#" }],
    content: "<p><strong>Action Required:</strong> ACTION TO EDIT</p><p><strong>Background:</strong> Background details</p>"
  }
];

function buildEventBlock(ev) {
  return `
  <tr data-block="event" data-id="${esc(ev.id)}">
    <td style="border-bottom:1px solid #e8e3da;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td class="pad-sides" style="padding:14px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td class="event-date-cell" width="52" valign="top" style="background-color:#281e7e;text-align:center;padding:6px 4px;width:52px;">
                  <span data-f="day" style="display:block;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:20px;font-weight:700;color:#ffffff;line-height:1;">${esc(ev.day)}</span>
                  <span data-f="month" style="display:block;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#f9f6ff;margin-top:3px;">${esc(ev.month)}</span>
                </td>
                <td class="event-spacer-cell" width="16">&nbsp;</td>
                <td class="event-title-cell" valign="top">
                  <p data-f="title" style="margin:0 0 3px;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:15px;font-weight:700;color:#281e7e;line-height:1.3;">${esc(ev.title)}</p>
                  <p style="margin:0;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:12px;color:#000000;letter-spacing:0.5px;"><span data-f="location">${esc(ev.location)}</span> &nbsp;&#183;&nbsp; <span data-f="time">${esc(ev.timeText)}</span></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="body-indented pad-sides" style="padding:0 28px 16px 96px;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:14px;line-height:1.7;color:#000000;border-top:1px solid #e8e3da;word-wrap:break-word;word-break:break-word;">
            <p data-f="tags" style="margin:10px 0 8px;">${tagPills(ev.tags)}</p>
            <p style="margin:0 0 6px;${ev.venue ? "" : "display:none;"}"><strong>Venue:</strong> <span data-f="venue">${esc(ev.venue)}</span></p>
            <p style="margin:0 0 6px;${ev.regLink ? "" : "display:none;"}">Registration: <a data-f="reg-link" href="${esc(ev.regLink)}" style="color:#81bce9;text-decoration:underline;">${esc(ev.regText || "Register here")}</a></p>
            <p data-f="description" style="margin:0;${ev.description ? "" : "display:none;"}">${esc(ev.description)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function buildActionBlock(it) {
  const docs = it.docs || [];
  const docLinks = docs.map((d) => `<p style="margin:0;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:12px;color:#000000;"><a href="${esc(d.url)}" style="color:#81bce9;text-decoration:underline;">${esc(d.label)}</a></p>`).join("");
  const deadlineDisplay = formatDeadline(it.deadline);
  return `
  <tr data-block="action" data-id="${esc(it.id)}">
    <td style="border-bottom:1px solid #e8e3da;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td class="pad-sides" style="padding:14px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td class="badge-cell" valign="top" style="white-space:nowrap;width:1%;padding-right:14px;">
                  <span data-f="badge" data-color="${esc(it.badgeColor)}" style="white-space:nowrap;background:${it.badgeColor};font-family:'Yu Gothic UI',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#ffffff;padding:3px 8px;">${esc(it.badge)}</span>
                </td>
                <td valign="top">
                  <p data-f="title" style="margin:0 0 2px;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:14px;font-weight:700;color:#281e7e;line-height:1.3;">${esc(it.title)}</p>
                  <div data-f="docs">${docLinks}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad-sides" style="padding:0 28px 16px 28px;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:14px;line-height:1.7;color:#000000;background:#faf9f6;border-top:1px solid #e8e3da;word-wrap:break-word;word-break:break-word;">
            <p data-f="tags" style="margin:10px 0 6px;">${tagPills(it.tags)}</p>
            <p style="margin:0 0 8px;font-weight:700;color:#730303;${it.deadline ? "" : "display:none;"}">Deadline: <span data-f="deadline" data-raw="${esc(it.deadline || "")}">${esc(deadlineDisplay)}</span></p>
            <div data-f="content">${it.content || ""}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function buildNotingBlock(it) {
  const docLinks = (it.docs || []).map((d) => `<p style="margin:0;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:12px;color:#000000;"><a href="${esc(d.url)}" style="color:#81bce9;text-decoration:underline;">${esc(d.label)}</a></p>`).join("");
  return `
  <tr data-block="noting" data-id="${esc(it.id)}">
    <td style="border-bottom:1px solid #e8e3da;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td class="pad-sides" style="padding:14px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td class="badge-cell" valign="top" style="white-space:nowrap;width:1%;padding-right:14px;">
                  <span data-f="badge" data-color="${esc(it.badgeColor)}" style="white-space:nowrap;background:${it.badgeColor};font-family:'Yu Gothic UI',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#f9f6ff;padding:3px 8px;">${esc(it.badge)}</span>
                </td>
                <td valign="top">
                  <p data-f="title" style="margin:0 0 2px;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:14px;font-weight:700;color:#281e7e;line-height:1.3;">${esc(it.title)}</p>
                  <div data-f="docs">${docLinks}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad-sides" style="padding:0 28px 16px 28px;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:14px;line-height:1.7;color:#000000;background:#faf9f6;border-top:1px solid #e8e3da;word-wrap:break-word;word-break:break-word;">
            <p data-f="tags" style="margin:10px 0 8px;">${tagPills(it.tags)}</p>
            <div data-f="content">${it.content || ""}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function buildFullHTML({ issueRange, events, actionItems, notingItems }) {
  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SSA Weekly Digest</title>
<style type="text/css">
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
img{-ms-interpolation-mode:bicubic;border:0;display:block;}
p,span,div,a,td,li{word-wrap:break-word;overflow-wrap:break-word;word-break:break-word;}
body{margin:0!important;padding:0!important;background-color:#f4f1ec;}
@media only screen and (max-width:620px){
.email-container{width:100%!important;max-width:100%!important;}
.header-img{width:100%!important;height:auto!important;}
.event-date-cell{display:block!important;width:100%!important;text-align:left!important;padding-bottom:8px!important;}
.event-spacer-cell{display:none!important;}
.event-title-cell{display:block!important;width:100%!important;}
.body-indented{padding-left:28px!important;}
.badge-cell{display:block!important;margin-bottom:6px!important;}
.pad-sides{padding-left:16px!important;padding-right:16px!important;}
.footer-cell{padding:20px 16px!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#f4f1ec;font-family:'Yu Gothic UI',Arial,sans-serif;color:#000000;font-size:15px;line-height:1.6;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#f4f1ec;">
<tr><td align="center" style="padding:32px 20px;">
<table class="email-container" width="680" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="max-width:680px;width:100%;background:#ffffff;border:1px solid #e8e3da;">
<tr><td style="padding:0;font-size:0;line-height:0;">
<img class="header-img" src="https://raw.githubusercontent.com/Webster2316/AI_Bulletin_Draft/refs/heads/main/Banner.png" width="680" alt="SSA Weekly Digest" style="display:block;width:100%;max-width:680px;border:0;height:auto;">
</td></tr>
<tr><td data-f="issue-range" style="background-color:#1b76bc;padding:12px 24px;text-align:right;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ffffff;">${esc(issueRange)}</td></tr>

<tr><td style="background-color:#281e7e;padding:14px 28px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td align="center" style="font-family:'Yu Gothic UI',Arial,sans-serif;font-size:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#f9f6ff;">Upcoming Events for the Next Three Months</td></tr></table>
</td></tr>
${events.map(buildEventBlock).join("")}

<tr><td style="background-color:#281e7e;padding:14px 28px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td align="center" style="font-family:'Yu Gothic UI',Arial,sans-serif;font-size:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#f9f6ff;">Papers, Circulars &amp; Surveys</td></tr></table>
</td></tr>

<tr><td style="background-color:#281e7e;padding:12px 28px;border-bottom:1px solid #e8e3da;">
<table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
<td width="8" height="8" style="background-color:#308acf;width:8px;height:8px;font-size:1px;line-height:1px;">&nbsp;</td>
<td style="padding-left:10px;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#f9f6ff;">For Action</td>
</tr></table>
</td></tr>
${actionItems.map(buildActionBlock).join("")}

<tr><td style="background-color:#281e7e;padding:12px 28px;border-top:1px solid #e8e3da;border-bottom:1px solid #e8e3da;">
<table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
<td width="8" height="8" style="background-color:#931bb1;width:8px;height:8px;font-size:1px;line-height:1px;">&nbsp;</td>
<td style="padding-left:10px;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#f9f6ff;">For Noting</td>
</tr></table>
</td></tr>
${notingItems.map(buildNotingBlock).join("")}

<tr><td class="footer-cell" style="background-color:#281e7e;padding:24px 28px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td align="center">
<p style="margin:0;font-family:'Yu Gothic UI',Arial,sans-serif;font-size:12px;color:#ffffff;line-height:1.7;">You are receiving this Weekly Digest because you are a Tier 1 member of an SSA Committee. This Weekly Digest is circulated to keep committee members informed of developments and matters under consideration across SSA Committees. As this distribution is tied to committee membership, members who wish to discontinue receiving the Digest will need to resign from their committee appointment by contacting <a href="mailto:ssa.admin@ssa.org.sg" style="color:#81bce9;text-decoration:none;">ssa.admin@ssa.org.sg</a>.</p>
</td></tr></table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function parseTagsContainer(container) {
  if (!container) return "";
  const spans = Array.from(container.querySelectorAll("span"));
  if (spans.length) return spans.map((s) => s.textContent.trim()).filter(Boolean).join(", ");
  return container.textContent.trim();
}

function parseHtmlToState(htmlStr) {
  const doc = new DOMParser().parseFromString(htmlStr, "text/html");

  const issueRangeEl = doc.querySelector('[data-f="issue-range"]');
  const issueRange = issueRangeEl ? issueRangeEl.textContent.trim() : "";

  const events = Array.from(doc.querySelectorAll('[data-block="event"]')).map((block) => {
    const q = (f) => block.querySelector(`[data-f="${f}"]`);
    const regA = q("reg-link");
    return {
      id: block.getAttribute("data-id") || uid(),
      day: q("day")?.textContent.trim() || "",
      month: q("month")?.textContent.trim() || "",
      title: q("title")?.textContent.trim() || "",
      location: q("location")?.textContent.trim() || "",
      timeText: q("time")?.textContent.trim() || "",
      tags: parseTagsContainer(q("tags")),
      venue: q("venue")?.textContent.trim() || "",
      regLink: regA ? (regA.getAttribute("href") || "") : "",
      regText: regA ? regA.textContent.trim() : "",
      description: q("description")?.textContent.trim() || "",
    };
  });

  const actionItems = Array.from(doc.querySelectorAll('[data-block="action"]')).map((block) => {
    const q = (f) => block.querySelector(`[data-f="${f}"]`);
    const badgeEl = q("badge");
    const docsEl = q("docs");
    const contentEl = q("content");
    const deadlineEl = q("deadline");
    const docs = docsEl
      ? Array.from(docsEl.querySelectorAll("a")).map((a) => ({ label: a.textContent.trim(), url: a.getAttribute("href") || "" }))
      : [];
    return {
      id: block.getAttribute("data-id") || uid(),
      badge: badgeEl?.textContent.trim() || "",
      badgeColor: badgeEl?.getAttribute("data-color") || "#281e7e",
      title: q("title")?.textContent.trim() || "",
      deadline: deadlineEl ? (deadlineEl.getAttribute("data-raw") || "") : "",
      docs,
      tags: parseTagsContainer(q("tags")),
      content: contentEl ? contentEl.innerHTML.trim() : "",
    };
  });

  const notingItems = Array.from(doc.querySelectorAll('[data-block="noting"]')).map((block) => {
    const q = (f) => block.querySelector(`[data-f="${f}"]`);
    const badgeEl = q("badge");
    const docsEl = q("docs");
    const contentEl = q("content");
    const docs = docsEl
      ? Array.from(docsEl.querySelectorAll("a")).map((a) => ({ label: a.textContent.trim(), url: a.getAttribute("href") || "" }))
      : [];
    return {
      id: block.getAttribute("data-id") || uid(),
      badge: badgeEl?.textContent.trim() || "",
      badgeColor: badgeEl?.getAttribute("data-color") || "#281e7e",
      title: q("title")?.textContent.trim() || "",
      tags: parseTagsContainer(q("tags")),
      docs,
      content: contentEl ? contentEl.innerHTML.trim() : "",
    };
  });

  return { issueRange, events, actionItems, notingItems };
}
function getDateTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}


export default function WeeklyDigestBuilder() {
  const [tab, setTab] = useState("events");
  const [issueRange, setIssueRange] = useState("Issue: ");
  const [events, setEvents] = useState(defaultEvents);
  const [actionItems, setActionItems] = useState(defaultAction);
  const [notingItems, setNotingItems] = useState(defaultNoting);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [copied, setCopied] = useState(false);
  const [rawHtmlEdit, setRawHtmlEdit] = useState(null);
  const [syncMessage, setSyncMessage] = useState(null);
  const [viewingRecordId, setViewingRecordId] = useState<number | null>(null);
  const [docModalTarget, setDocModalTarget] = useState<{ type: "action" | "noting"; id: string } | null>(null);
  const { confirmDelete, deleteModal } = useConfirmDelete();



  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/load-digest?key=ssa-digest-data");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.issueRange) setIssueRange(data.issueRange);
            if (data.events) setEvents(data.events);
            if (data.actionItems) {
              const migrated = data.actionItems.map((it) => {
                if (it.docs) return { deadline: "", ...it };
                return {
                  ...it,
                  deadline: it.deadline || "",
                  docs: it.docLink || it.docLabel ? [{ label: it.docLabel || "", url: it.docLink || "" }] : [],
                };
              });
              setActionItems(migrated);
            }
            if (data.notingItems) setNotingItems(data.notingItems);
            if (typeof data.rawHtmlEdit === "string") setRawHtmlEdit(data.rawHtmlEdit);
          }
        }
      } catch (e) {
        console.error("Failed to load saved digest:", e);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/save-digest?key=ssa-digest-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ issueRange, events, actionItems, notingItems, rawHtmlEdit, builtHtml: html }),
        });
        if (res.ok) {
  setSaveStatus(`Saved at ${getDateTime()}`);
} else {
  setSaveStatus("error");
}
      } catch (e) {
        console.error("Failed to save digest:", e);
        setSaveStatus("error");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [issueRange, events, actionItems, notingItems, rawHtmlEdit, loaded]);

  const move = (list, setList) => (index, dir) => {
    const arr = [...list];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    setList(arr);
  };

  const copyItem = (item: any, target: "here" | "other") => {
    const copy = { ...item, id: uid() };
  
    const inAction = tab === "action";
  
    if (target === "here") {
      const list = inAction ? actionItems : notingItems;
      const setList = inAction ? setActionItems : setNotingItems;
      const index = list.findIndex((x) => x.id === item.id);
      setList([...list.slice(0, index + 1), copy, ...list.slice(index + 1)]);
    } else {
      // MOVE to the other tab
      if (inAction) {
        //action -> noting
        setNotingItems([...notingItems, copy]);
        setActionItems(actionItems.filter((x) => x.id !== item.id));
      } else {
        // noting -> action
        setActionItems([...actionItems, copy]);
        setNotingItems(notingItems.filter((x) => x.id !== item.id));
      }
    }
  };
  const generatedHtml = buildFullHTML({ issueRange, events, actionItems, notingItems });
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

  const handleAddDocs = (newDocs: { label: string; url: string }[]) => {
    if (!docModalTarget) return;
    const {type, id } = docModalTarget;

    if (type === "action") {
      setActionItems(actionItems.map((x) => (x.id === id ? { ...x, docs: [...(x.docs || []), ...newDocs]} : x)));
    } else {
      setNotingItems(notingItems.map((x) => (x.id === id ? { ...x, docs: [...(x.docs || []), ...newDocs]} : x)));
    }
  };

  const handleResetHtml = () => {
    setRawHtmlEdit(null);
    setSyncMessage(null);
  };

  const handleApplyHtmlToFields = () => {
    try {
      const parsed = parseHtmlToState(html);
      const foundAnything = parsed.events.length || parsed.actionItems.length || parsed.notingItems.length || parsed.issueRange;
      if (!foundAnything) {
        setSyncMessage({ type: "error", text: "Couldn't find any recognizable fields in that HTML — the data markers may have been removed or the structure changed too much." });
        return;
      }
      setIssueRange(parsed.issueRange || issueRange);
      setEvents(parsed.events);
      setActionItems(parsed.actionItems);
      setNotingItems(parsed.notingItems);
      setRawHtmlEdit(null);
      setSyncMessage({ type: "success", text: "Fields updated from your HTML edits." });
    } catch (e) {
      setSyncMessage({ type: "error", text: "Couldn't parse that HTML: " + e.message });
    }
  };

  const tabBtn = (key, label, Icon) => (
    <button
      onClick={() => setTab(key)}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 ${tab === key ? "border-indigo-700 text-indigo-800" : "border-transparent text-gray-500 hover:text-gray-700"}`}
    >
      <Icon size={15} />{label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <img src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png" alt="SSA Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold text-indigo-900">Weekly Digest Builder</h1>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {saveStatus === "saving" && <><Loader2 size={13} className="animate-spin" /> Saving…</>}
            {saveStatus.startsWith("Saved at") && (
  <>
    <Save size={13} />
    {saveStatus}
  </>
)}
{saveStatus === "error" && (
  <span className="text-red-600">
    Save failed
  </span>
)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 mb-3 p-3">
          <Field label="Issue Range (shown in blue meta bar)">
            <input className={inputCls} value={issueRange} onChange={(e) => setIssueRange(e.target.value)} />
          </Field>
        </div>

        {viewingRecordId === null ? (
  <>
    <div className="flex items-center justify-between border-b border-gray-200 bg-white rounded-t-lg px-2">
      <div className="flex">
        {tabBtn("events", "Events", CalendarDays)}
        {tabBtn("action", "For Action", FileText)}
        {tabBtn("noting", "For Noting", FileText)}
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
      {tab === "events" && (
        <div className="space-y-4">
          {events.map((ev, i) => (
            <div key={ev.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-indigo-700">Event {i + 1}</span>
                <MoveButtons index={i} length={events.length} onMove={move(events, setEvents)} onRemove={() =>
  confirmDelete({
    itemType: "event",
    itemName: ev.title,
    action: () =>
      setEvents((prev) =>
        prev.filter((e) => e.id !== ev.id)
      ),
  })
}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Day"><input className={inputCls} value={ev.day} onChange={(e) => setEvents(events.map((x) => x.id === ev.id ? { ...x, day: e.target.value } : x))} /></Field>
                <Field label="Month"><input className={inputCls} value={ev.month} onChange={(e) => setEvents(events.map((x) => x.id === ev.id ? { ...x, month: e.target.value } : x))} /></Field>
              </div>
              <Field label="Title"><input className={inputCls} value={ev.title} onChange={(e) => setEvents(events.map((x) => x.id === ev.id ? { ...x, title: e.target.value } : x))} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Location"><input className={inputCls} value={ev.location} onChange={(e) => setEvents(events.map((x) => x.id === ev.id ? { ...x, location: e.target.value } : x))} /></Field>
                <Field label="Time"><input className={inputCls} value={ev.timeText} onChange={(e) => setEvents(events.map((x) => x.id === ev.id ? { ...x, timeText: e.target.value } : x))} /></Field>
              </div>
              <Field label="Tags (comma separated)"><input className={inputCls} value={ev.tags} onChange={(e) => setEvents(events.map((x) => x.id === ev.id ? { ...x, tags: e.target.value } : x))} /></Field>
              <Field label="Venue"><input className={inputCls} value={ev.venue} onChange={(e) => setEvents(events.map((x) => x.id === ev.id ? { ...x, venue: e.target.value } : x))} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Registration Link Text"><input className={inputCls} value={ev.regText} onChange={(e) => setEvents(events.map((x) => x.id === ev.id ? { ...x, regText: e.target.value } : x))} /></Field>
                <Field label="Registration Link URL"><input className={inputCls} value={ev.regLink} onChange={(e) => setEvents(events.map((x) => x.id === ev.id ? { ...x, regLink: e.target.value } : x))} /></Field>
              </div>
              <Field label="Description"><textarea className={inputCls} rows={3} value={ev.description} onChange={(e) => setEvents(events.map((x) => x.id === ev.id ? { ...x, description: e.target.value } : x))} /></Field>
            </div>
          ))}
          <button onClick={() => setEvents([...events, { id: uid(), day: "1", month: "Jan", title: "New Event", location: "", timeText: "", tags: "All Members", venue: "", regText: "", regLink: "", description: "" }])} className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900">
            <Plus size={16} /> Add Event
          </button>
        </div>
      )}

      {tab === "action" && (
        <div className="space-y-4">
          {actionItems.map((it, i) => (
            <div key={it.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
  <span className="text-xs font-semibold text-indigo-700">Item {i + 1}</span>

  <div className="flex items-center gap-1">
    <button
      onClick={() => copyItem(it, "here")}
      className="p-1 rounded hover:bg-gray-100 text-gray-500"
      title="Copy here"
    >
      <Copy size={16} />
    </button>

    <button
      onClick={() => copyItem(it, "other")}
      className="p-1 rounded hover:bg-gray-100 text-gray-500"
      title="Copy to Noting"
    >
      <ArrowRightLeft size={16} />
    </button>

    <MoveButtons
      index={i}
      length={actionItems.length}
      onMove={move(actionItems, setActionItems)}
      onRemove={() =>
        confirmDelete({
          itemType: "action item",
          itemName: it.title,
          action: () =>
            setActionItems((prev) =>
              prev.filter((x) => x.id !== it.id)
            ),
        })
      }
    />
  </div>
</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Badge Label"><input className={inputCls} value={it.badge} onChange={(e) => setActionItems(actionItems.map((x) => x.id === it.id ? { ...x, badge: e.target.value } : x))} /></Field>
                <Field label="Badge Color"><input type="color" className="w-full h-9 border border-gray-300 rounded" value={it.badgeColor} onChange={(e) => setActionItems(actionItems.map((x) => x.id === it.id ? { ...x, badgeColor: e.target.value } : x))} /></Field>
              </div>
              <Field label="Title"><input className={inputCls} value={it.title} onChange={(e) => setActionItems(actionItems.map((x) => x.id === it.id ? { ...x, title: e.target.value } : x))} /></Field>
              <Field label="Deadline (optional)">
                <div className="flex items-center gap-2">
                  <input type="date" className={inputCls} value={it.deadline || ""} onChange={(e) => setActionItems(actionItems.map((x) => x.id === it.id ? { ...x, deadline: e.target.value } : x))} />
                  {it.deadline && (
                    <button type="button" onClick={() => setActionItems(actionItems.map((x) => x.id === it.id ? { ...x, deadline: "" } : x))} className="text-xs text-gray-500 hover:text-red-600 whitespace-nowrap">Clear</button>
                  )}
                </div>
              </Field>
              <Field label="Documents">
                <div className="space-y-2">
                  {(it.docs || []).map((d, di) => (
                    <div key={di} className="flex gap-2">
                      <input className={inputCls} placeholder="Link text" value={d.label} onChange={(e) => setActionItems(actionItems.map((x) => x.id === it.id ? { ...x, docs: x.docs.map((dd, ddi) => ddi === di ? { ...dd, label: e.target.value } : dd) } : x))} />
                      <input className={inputCls} placeholder="URL" value={d.url} onChange={(e) => setActionItems(actionItems.map((x) => x.id === it.id ? { ...x, docs: x.docs.map((dd, ddi) => ddi === di ? { ...dd, url: e.target.value } : dd) } : x))} />
                      <button onClick={() => setActionItems(actionItems.map((x) => x.id === it.id ? { ...x, docs: x.docs.filter((_, ddi) => ddi !== di) } : x))} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                    </div>
                  ))}
                <button onClick={() => setDocModalTarget({ type: "action", id: it.id })} className="text-xs text-indigo-700 font-medium flex items-center gap-1"><Plus size={13} /> Add Document</button>
                </div>
              </Field>
              <Field label="Tags (comma separated)"><input className={inputCls} value={it.tags} onChange={(e) => setActionItems(actionItems.map((x) => x.id === it.id ? { ...x, tags: e.target.value } : x))} /></Field>
              <Field label="Content">
                <RichTextEditor value={it.content} onChange={(html) => setActionItems(actionItems.map((x) => x.id === it.id ? { ...x, content: html } : x))} />
              </Field>
            </div>
          ))}
          <button onClick={() => setActionItems([...actionItems, { id: uid(), badge: "Public Comments", badgeColor: badgePresets.PublicComments, title: "New Action Item", deadline: "", docs: [], tags: "All Members", content: "" }])} className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900">
            <Plus size={16} /> Add Action Item
          </button>
        </div>
      )}

      {tab === "noting" && (
        <div className="space-y-4">
          {notingItems.map((it, i) => (
            <div key={it.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
  <span className="text-xs font-semibold text-indigo-700">Item {i + 1}</span>

  <div className="flex items-center gap-1">
  <button
  onClick={() => copyItem(it, "here")}
  className="p-1 rounded hover:bg-gray-100 text-gray-500"
  title="Copy here"
>
  <Files size={16} />
</button>

<button
  onClick={() => copyItem(it, "other")}
  className="p-1 rounded hover:bg-gray-100 text-gray-500"
  title="Copy to Action"
>  <ArrowRightLeft size={16} />
    </button>

    <MoveButtons index={i} length={notingItems.length} onMove={move(notingItems, setNotingItems)} onRemove={() =>
  confirmDelete({
    itemType: "noting item",
    itemName: it.title,
    action: () =>
      setNotingItems((prev) =>
        prev.filter((x) => x.id !== it.id)
      ),
  })
} />
  </div>
</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Badge Label"><input className={inputCls} value={it.badge} onChange={(e) => setNotingItems(notingItems.map((x) => x.id === it.id ? { ...x, badge: e.target.value } : x))} /></Field>
                <Field label="Badge Color"><input type="color" className="w-full h-9 border border-gray-300 rounded" value={it.badgeColor} onChange={(e) => setNotingItems(notingItems.map((x) => x.id === it.id ? { ...x, badgeColor: e.target.value } : x))} /></Field>
              </div>
              <Field label="Title"><input className={inputCls} value={it.title} onChange={(e) => setNotingItems(notingItems.map((x) => x.id === it.id ? { ...x, title: e.target.value } : x))} /></Field>
              <Field label="Tags (comma separated)"><input className={inputCls} value={it.tags} onChange={(e) => setNotingItems(notingItems.map((x) => x.id === it.id ? { ...x, tags: e.target.value } : x))} /></Field>
              <Field label="Documents">
                <div className="space-y-2">
                  {it.docs.map((d, di) => (
                    <div key={di} className="flex gap-2">
                      <input className={inputCls} placeholder="Link text" value={d.label} onChange={(e) => setNotingItems(notingItems.map((x) => x.id === it.id ? { ...x, docs: x.docs.map((dd, ddi) => ddi === di ? { ...dd, label: e.target.value } : dd) } : x))} />
                      <input className={inputCls} placeholder="URL" value={d.url} onChange={(e) => setNotingItems(notingItems.map((x) => x.id === it.id ? { ...x, docs: x.docs.map((dd, ddi) => ddi === di ? { ...dd, url: e.target.value } : dd) } : x))} />
                      <button onClick={() => setNotingItems(notingItems.map((x) => x.id === it.id ? { ...x, docs: x.docs.filter((_, ddi) => ddi !== di) } : x))} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                    </div>
                  ))}
                <button onClick={() => setDocModalTarget({ type: "noting", id: it.id })} className="text-xs text-indigo-700 font-medium flex items-center gap-1"><Plus size={13} /> Add Document</button>
                </div>
              </Field>
              <Field label="Content">
                <RichTextEditor value={it.content} onChange={(html) => setNotingItems(notingItems.map((x) => x.id === it.id ? { ...x, content: html } : x))} />
              </Field>
            </div>
          ))}
          <button onClick={() => setNotingItems([...notingItems, { id: uid(), badge: "ICS", badgeColor: badgePresets.ICS, title: "New Noting Item", tags: "Committee 1, Committee 2", docs: [], content: "" }])} className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900">
            <Plus size={16} /> Add Noting Item
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
              <button onClick={handleApplyHtmlToFields} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white text-sm rounded font-medium hover:bg-emerald-800">
                <Save size={15} /> Apply HTML changes to fields
              </button>
            )}
            {isEdited && (
              <button onClick={handleResetHtml} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded font-medium hover:bg-gray-50">
                <RotateCcw size={15} /> Discard edits
              </button>
            )}
          </div>
          {isEdited && !syncMessage && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-3">
              Showing your manual edits. The Events / For Action / For Noting tabs won't reflect this until you click <strong>Apply HTML changes to fields</strong> — text edits inside existing fields sync fine, but new blocks you hand-write from scratch won't be recognized.
            </p>
          )}
          {syncMessage && (
            <p className={`text-xs rounded px-2 py-1.5 mb-3 border ${syncMessage.type === "success" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"}`}>
              {syncMessage.text}
            </p>
          )}
          <p className="text-xs text-gray-500 mb-2">Live preview:</p>
          <iframe title="preview" srcDoc={html} className="w-full border border-gray-300 rounded" style={{ height: "500px" }} />
          <p className="text-xs text-gray-500 mt-4 mb-2 flex items-center gap-1"><Code2 size={13} /> Raw HTML (editable — changes here update the preview and copy button above):</p>
          <textarea
            className="w-full border border-gray-300 rounded p-2 text-xs font-mono"
            style={{ height: "220px" }}
            value={html}
            onChange={(e) => { setRawHtmlEdit(e.target.value); setSyncMessage(null); }}
            spellCheck={false}
          />
        </div>
      )}
    </div>
    <DocumentUploadModal
  isOpen={docModalTarget !== null}
  onClose={() => setDocModalTarget(null)}
  onAdd={handleAddDocs}
/>
    {deleteModal}
  </>
) : viewingRecordId === -1 ? (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <RecordsPanel
      builderKey="ssa-digest-data"
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
