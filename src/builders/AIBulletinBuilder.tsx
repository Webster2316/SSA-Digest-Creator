import { useState, useEffect } from "react";
import { Plus, Copy, Check, Save, Eye, Code2, BookOpen, GraduationCap, TrendingUp, Archive, Loader2, RotateCcw, Trash2 } from "lucide-react";
import Field from "../shared/field";
import TagBlock, { renderTagBlockHTML } from "../shared/tagBlock";
import MoveButtons from "../shared/moveButtons";
import RecordsPanel from "../shared/recordsPanel";
import RecordViewer from "../shared/recordViewer";
import RichTextEditor from "../shared/richTextEditor";
import { uid, esc, inputCls } from "../shared/utils";
import DocumentUploadModal from "../shared/documentUploadModal";


const FONT = "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

// ---------- factories ----------

function makeAwarenessItem(overrides = {}) {
  return Object.assign(
    { id: uid(), header: "", body: "", tag: null, status: "", statusColor: "", statusCustom: "", isPreset: false, subItems: [], docs: [] },
    overrides
  );
}

function makeAwarenessSubItem(overrides = {}) {
  return Object.assign(
    { id: uid(), header: "", body: "", tag: null, status: "", statusColor: "", statusCustom: "", docs: [] },
    overrides
  );
}

function makeTrainingItem(overrides = {}) {
  return Object.assign(
    { id: uid(), name: "", partnershipLine: "", status: "", statusColor: "", statusCustom: "", body: "", summaryTag: null, docs: [] },
    overrides
  );
}

function makeAdoptionItem(overrides = {}) {
  return Object.assign(
    { id: uid(), header: "", body: "", tag: null, status: "", statusColor: "", statusCustom: "", color: "navy", docs: [], isPreset: false },
    overrides
  );
}

// ---------- seed data ----------
const STATUS_PRESETS = {
  Ongoing: { label: "Ongoing", color: "#f59e0b" },
  Completed: { label: "Completed", color: "#10b981" },
  ITP: { label: "Invitation to Participate", color: "#1b75bc" },
  forNoting: { label: "For Noting", color: "#6b7280" },
}
const defaultAwarenessItems = () => [
  makeAwarenessItem({
    header: "Emerging AI Use Cases Across the Maritime Industry",
    body: "<p>As organisations move beyond early AI adoption, attention is increasingly shifting towards implementing practical, scalable use cases across maritime operations. Rather than viewing AI as a standalone technology, companies are exploring how it can be embedded into existing workflows to improve productivity, reduce repetitive tasks, strengthen governance and support more informed decision-making.</p><p><strong>Examples of AI applications currently being explored across the maritime sector include:</strong></p><ul><li>Regulatory compliance and policy summarisation</li><li>Voyage and operational reporting assistance</li><li>Safety and incident report analysis</li><li>Procurement and quotation comparisons</li><li>Internal knowledge management and document search</li><li>Meeting minutes and action tracking</li><li>Workflow automation for routine administrative processes</li></ul>",
    isPreset: true,
  }),
  makeAwarenessItem({
    header: "Maritime AI Readiness Assessment Ongoing",
    body: "<p>The Maritime and Port Authority of Singapore (MPA) is currently conducting the Maritime AI Readiness Assessment for the sea transport sector using the AI Readiness Index framework developed by AI Singapore.</p><p><strong>The assessment aims to help companies:</strong></p><ul><li>Understand their current AI readiness level</li><li>Identify gaps in digital and AI capabilities</li><li>Support future industry programme development</li></ul>",
    tag: "<p><strong>Call for Participation</strong></p><p>Companies are encouraged to nominate a representative familiar with the organisation's technology adoption status (e.g. CTO, CIO, digital lead, or senior management representative).</p><p>Maritime AI Readiness Assessment: <a href=\"https://go.gov.sg/maritime-airi\" target=\"_blank\" style=\"color:#1b75bc;text-decoration:underline;font-weight:bold;\">go.gov.sg/maritime-airi</a></p>",
    isPreset: true,
  }),
  makeAwarenessItem({
    header: "Building a Structured Maritime AI Learning Journey",
    body: "<p>SSA is currently curating a more structured AI learning journey to help maritime companies navigate the growing number of AI tools, concepts, and training programmes available in the market through:</p><ol><li>Whitelisting AI Service Providers (Ongoing)</li><li>Formalising the Use Cases Management Framework (Ongoing)</li></ol>",
    isPreset: true,
  }),
  makeAwarenessItem({
    header: "Whitelisting AI Service Providers Exercise",
    body: "<p>SSA is continuing its evaluation of AI service providers with the aim of establishing a pool of vendors that can support members in starting their AI adoption journey. The assessment process includes a structured review of vendor capabilities, relevant experience, proposed solutions and customer references, supported by vendor interviews and standardised evaluation criteria to ensure a consistent and transparent selection process.</p><p>Further information on the recommended or whitelisted service providers is expected to be available in the early fourth quarter of 2026.</p>",
    isPreset: true,
  }),
  makeAwarenessItem({
    header: "Formalising the Use Case Management Framework",
    body: "<p>SSA is also developing a structured framework to guide the identification, development, assessment and publication of AI use cases. Under the proposed approach, whitelisted implementation partners will work with participating companies to establish relevant use cases and assess opportunities for broader industry adoption.</p><p>The framework is being developed alongside the AI service provider whitelisting exercise. Further guidance on the use case submission, assessment and publication process is expected to be shared progressively from the fourth quarter of 2026.</p>",
    isPreset: true,
  }),
];

const defaultTrainingItems = () => [
  makeTrainingItem({
    name: "Anchoring AI: Transforming Shipping with GenAI",
    partnershipLine: "Conducted in partnership with PwC",
    body: "<p>The programme focuses on:</p><ul><li>Understanding GenAI fundamentals</li><li>Maritime AI use cases</li><li>Prompt engineering</li><li>AI implementation considerations</li><li>Change management</li></ul>",
    summaryTag: "<p>The training programme is designed to help maritime professionals better understand how AI tools can be applied practically within shipping operations and business workflows.</p>",
  }),
  makeTrainingItem({
    name: "Navigating the Journey: Managing AI-Related Risk",
    partnershipLine: "Conducted in partnership with PwC",
    body: "<p>The programme focuses on:</p><ul><li>Explore principles of responsible AI adoption</li><li>Understand AI and GenAI risks</li><li>Learn practical AI risk mitigation techniques</li><li>Identify AI-related cyber threats and security measures</li><li>Gain insights into AI governance frameworks</li></ul><p>For more information, please reach out to <a href=\"mailto:ariel@ssa.org.sg\" style=\"color:#10147e;\">ariel@ssa.org.sg</a>.</p>",
    summaryTag: "<p>The training programme is designed to help maritime professionals and their teams to adopt AI safely and responsibly.</p>",
  }),
];
const defaultAdoptionItems = () => [
  makeAdoptionItem({
    header: "Funding Support for AI Adoption",
    body: "<p>Various grants and funding schemes are available to support companies exploring digitalisation and AI adoption initiatives.</p><p><strong>Funding may support:</strong></p><ul><li>Digital transformation projects</li><li>AI solution implementation</li><li>Workforce upskilling</li><li>Innovation and capability development</li></ul><p>To better understand members' AI adoption journeys, SSA representatives may reach out to discuss your organisation's current AI initiatives, challenges and areas of interest.</p>",
    tag: "<p>Kindly refer to the attached grants summary for detailed funding information.</p>",
    color: "navy",
    isPreset: true,
  }),

  makeAdoptionItem({
    header: "Common AI Adoption Challenges Observed",
    body: "<p>As organisations progress beyond pilot projects, several operational challenges are emerging:</p><ul><li>Scaling successful pilots across multiple business functions</li><li>Ensuring data quality and consistency for reliable AI outputs</li><li>Defining governance, accountability and human oversight</li><li>Integrating AI tools into existing workflows without adding complexity</li><li>Measuring long-term business impact beyond initial productivity gains</li></ul>",
    tag: null,
    color: "navy",
    isPreset: true,
  }),

  makeAdoptionItem({
    header: "Suggested Action This Month",
    body: "<p>Practical priorities identified through ongoing industry engagement include:</p><ul><li>Prioritise low-risk, high-impact AI use cases</li><li>Map cross-departmental data dependencies</li><li>Establish governance for AI-generated outputs</li><li>Strengthen data quality and accessibility</li><li>Standardise AI workflows and best practices across teams</li></ul>",
    tag: "<p>Small, well-defined pilot projects often provide the strongest foundation for broader AI adoption across the organisation.</p>",
    color: "cyan",
    isPreset: true,
  }),
];

// ---------- email-safe bullet conversion ----------
// RichTextEditor's toolbar produces plain <ul>/<ol><li>, which Outlook desktop
// renders inconsistently. The template uses a two-column bulletproof table
// instead, so convert at export time — never touch what's stored in state.
function convertContentForEmail(html) {
  if (!html) return html;

  let output = html;

  // Normalise paragraphs for Outlook.
  output = output.replace(
    /<p(?:\s[^>]*)?>/gi,
    `<p style="margin:0 0 10px 0;font-family:${FONT};font-size:14px;line-height:24px;mso-line-height-rule:exactly;">`
  );

  // Convert lists to bulletproof tables.
  output = output.replace(
    /<(ul|ol)>([\s\S]*?)<\/\1>/gi,
    (match, tag, inner) => {
      const items = [...inner.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map(
        (m) => m[1].trim()
      );

      const isOrdered = tag.toLowerCase() === "ol";

      const rows = items
        .map((text, i) => {
          const marker = isOrdered ? `${i + 1}.` : "&bull;";

          return `
<tr>
  <td valign="top" width="20"
      style="font-family:${FONT};font-size:14px;line-height:24px;mso-line-height-rule:exactly;color:#2d3748;">
    ${marker}
  </td>
  <td valign="top"
      style="font-family:${FONT};font-size:14px;line-height:24px;mso-line-height-rule:exactly;color:#2d3748;padding:0 0 5px 0;">
    ${text}
  </td>
</tr>`;
        })
        .join("");

      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${rows}</table>`;
    }
  );

  return output;
}
function normalizeLinksForEmail(html) {
  if (!html) return html;
  return html.replace(
    /(<a\s+[^>]*href=")([^"]*)(")/gi,
    (match, pre, url, post) => {
      const trimmed = url.trim();
      if (
        !trimmed ||
        /^https?:\/\//i.test(trimmed) ||
        /^mailto:/i.test(trimmed) ||
        /^tel:/i.test(trimmed)
      ) {
        return match;
      }
      const cleaned = trimmed.replace(/^\/+/, "");
      return `${pre}https://${cleaned}${post}`;
    }
  );
}
// ---------- reverse of the above, for pulling hand-edited HTML back into the editor ----------
// Detects the specific two-column bulletproof tables produced by convertBulletsForEmail
// and turns them back into <ul>/<ol><li> so RichTextEditor's toolbar keeps working on them.
function convertEmailTablesToBullets(containerEl) {
  const tables = Array.from(containerEl.querySelectorAll("table"));
  tables.forEach((table) => {
    const rows = Array.from(table.querySelectorAll("tr"));
    if (!rows.length) return;
    let isOrdered = null;
    const items = [];
    for (const row of rows) {
      const tds = row.querySelectorAll("td");
      if (tds.length !== 2) {
        items.length = 0;
        break;
      }
      const marker = tds[0].textContent.trim();
      if (marker === "•" || marker === "\u2022") {
        if (isOrdered === true) {
          items.length = 0;
          break;
        }
        isOrdered = false;
      } else if (/^\d+\.$/.test(marker)) {
        if (isOrdered === false) {
          items.length = 0;
          break;
        }
        isOrdered = true;
      } else {
        items.length = 0;
        break;
      }
      items.push(tds[1].innerHTML.trim());
    }
    if (items.length && isOrdered !== null) {
      const tag = isOrdered ? "ol" : "ul";
      const wrapper = table.ownerDocument.createElement("div");
      wrapper.innerHTML = `<${tag}>${items.map((it) => `<li>${it}</li>`).join("")}</${tag}>`;
      table.replaceWith(...Array.from(wrapper.childNodes));
    }
  });
}

function dividerRow() {
  return `<tr><td style="padding:0 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="32" style="height:32px;border-bottom:1px solid #e5e7eb;font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td></tr>`;
}
function getStatusLabel(item) {
  if (!item.status) return "";
  if (item.status === "custom") return item.statusCustom || "";
  return STATUS_PRESETS[item.status]?.label || item.status;
}

function renderStatusBadgeHTML(item, font, bottomPad = 14) {
  const label = getStatusLabel(item);
  if (!label.trim()) return "";
  const color = item.statusColor || STATUS_PRESETS[item.status]?.color || "#262261";
  return `<td align="right" valign="top" style="white-space:nowrap;padding:2px 0 ${bottomPad}px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:${esc(color)};border-radius:12px;padding:4px 12px;font-family:${font};font-size:11px;line-height:14px;font-weight:bold;color:#ffffff;white-space:nowrap;" data-f="status-badge">${esc(label)}</td></tr></table>
</td>`;
}

function StatusBadgePicker({ item, onChange }) {
  const isCustom = item.status === "custom";
  const defaultColor = STATUS_PRESETS[item.status]?.color;

  const handleStatusChange = (e) => {
    const value = e.target.value;
    const patch = { status: value };
    if (value && value !== "custom" && !item.statusColor) {
      patch.statusColor = STATUS_PRESETS[value]?.color || "";
    }
    if (!value) {
      patch.statusColor = "";
      patch.statusCustom = "";
    }
    onChange(patch);
  };

  return (
    <div className="flex items-center gap-2 mb-3">
      <select className="text-sm border border-gray-300 rounded px-2 py-1" value={item.status || ""} onChange={handleStatusChange}>
        <option value="">No status</option>
        <option value="Ongoing">Ongoing</option>
        <option value="Completed">Completed</option>
        <option value="ITP">Invitation to Participate</option>
        <option value="forNoting">For Noting</option>
        <option value="custom">Custom</option>
      </select>

      {isCustom && (
        <input
          type="text"
          className="text-sm border border-gray-300 rounded px-2 py-1 flex-1"
          placeholder="Custom status label"
          value={item.statusCustom || ""}
          onChange={(e) => onChange({ statusCustom: e.target.value })}
        />
      )}

      {item.status && (
        <input
          type="color"
          className="h-7 w-9 border border-gray-300 rounded cursor-pointer p-0"
          value={item.statusColor || defaultColor || "#262261"}
          onChange={(e) => onChange({ statusColor: e.target.value })}
          title="Badge color"
        />
      )}
    </div>
  );
}
// ---------- HTML builders ----------

function buildAwarenessSubItemHTML(item) {
  const tagHtml = renderTagBlockHTML(item.tag, "navy", `awareness-subitem-tag-${item.id}`);
  const docsHtml = renderDocumentsHTML(item.docs || []);
  const badgeCell = renderStatusBadgeHTML(item, FONT, 10);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" data-block="awareness-subitem" data-id="${esc(item.id)}" data-status="${esc(item.status || "")}" data-status-color="${esc(item.statusColor || "")}" data-status-custom="${esc(item.statusCustom || "")}">
<tr><td style="padding:0 0 14px 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="left" valign="top" style="padding:0 0 8px 0"><p data-f="subheader" style="margin:0;font-family:${FONT};font-size:17px;line-height:23px;font-weight:bold;color:#262261;">${esc(item.header)}</p></td>
${badgeCell}
</tr></table>
<div data-f="subbody" style="font-family:${FONT};font-size:14px;line-height:24px;color:#2d3748;">${convertContentForEmail(item.body)}</div>

${docsHtml}
${tagHtml}
</td></tr>
</table>`;
}

function buildAwarenessItemHTML(item) {
  const tagHtml = renderTagBlockHTML(item.tag, "navy", `awareness-tag-${item.id}`);
  const docsHtml = renderDocumentsHTML(item.docs || []);
  const badgeCell = renderStatusBadgeHTML(item, FONT, 14);
  const subItemsHtml = (item.subItems || []).map(buildAwarenessSubItemHTML).join("\n");
  const subItemsBlock = subItemsHtml
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" data-block="awareness-subitems"><tr><td style="padding:4px 0 0 0">
${subItemsHtml}
</td></tr></table>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" data-block="awareness-item" data-id="${esc(item.id)}" data-status="${esc(item.status || "")}" data-status-color="${esc(item.statusColor || "")}" data-status-custom="${esc(item.statusCustom || "")}">
<tr><td style="padding:0 0 14px 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="left" valign="top" style="padding:0 0 14px 0"><p data-f="header" style="margin:0;font-family:${FONT};font-size:22px;line-height:28px;font-weight:bold;color:#1b75bc;">${esc(item.header)}</p></td>
${badgeCell}
</tr></table>
<div data-f="body" style="font-family:${FONT};font-size:14px;line-height:24px;color:#2d3748;">${convertContentForEmail(item.body)}</div>
${docsHtml}

${tagHtml}
${subItemsBlock}
</td></tr>
</table>`;
}

function buildTrainingItemHTML(item) {
  const docsHtml = renderDocumentsHTML(item.docs || []);
  const partnershipHtml = (item.partnershipLine || "").trim()
    ? `<p data-f="partnership" style="margin:0 0 14px 0;font-family:${FONT};font-size:14px;line-height:22px;font-style:italic;color:#5f6b7a;">${esc(item.partnershipLine)}</p>`
    : "";

  const tagHtml = renderTagBlockHTML(
    item.summaryTag,
    "blue",
    `training-tag-${item.id}`
  );

  const badgeCell = renderStatusBadgeHTML(item, FONT, 14);

  return `
<table
  role="presentation"
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  data-block="training-item"
  data-id="${esc(item.id)}"
  data-status="${esc(item.status || "")}"
  data-status-color="${esc(item.statusColor || "")}"
  data-status-custom="${esc(item.statusCustom || "")}"
>
  <tr>
    <td style="padding:0 0 14px 0">

      <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
      >
        <tr>
          <td
            align="left"
            valign="top"
            style="padding:0 0 10px 0"
          >
            <p
              data-f="name"
              style="margin:0;font-family:${FONT};font-size:17px;line-height:23px;font-weight:bold;color:#262261;"
            >
              ${esc(item.name)}
            </p>
          </td>

          ${badgeCell}
        </tr>
      </table>

      ${partnershipHtml}

      <div
        data-f="body"
        style="font-family:${FONT};font-size:14px;line-height:24px;color:#2d3748;"
      >
        ${convertContentForEmail(item.body)}
      </div>
      ${docsHtml}
      ${tagHtml}

    </td>
  </tr>
</table>`;
}

function buildAdoptionItemHTML(item) {
  const tagHtml = renderTagBlockHTML(item.tag, item.color || "navy", `adoption-tag-${item.id}`);
  const docsHtml = renderDocumentsHTML(item.docs || []);
  const badgeCell = renderStatusBadgeHTML(item, FONT, 14);

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" data-block="adoption-item" data-id="${esc(item.id)}" data-color="${esc(item.color || "navy")}" data-status="${esc(item.status || "")}" data-status-color="${esc(item.statusColor || "")}" data-status-custom="${esc(item.statusCustom || "")}">
  <tr>
  <td style="padding:0 0 6px 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td align="left" valign="top" style="padding:0 0 14px 0"><p data-f="header" style="margin:0;font-family:${FONT};font-size:22px;line-height:28px;font-weight:bold;color:#1b75bc;">${esc(item.header)}</p></td>
  ${badgeCell}
  </tr></table>
  <div data-f="body" style="font-family:${FONT};font-size:14px;line-height:24px;color:#2d3748;">${convertContentForEmail(item.body)}</div>

  ${docsHtml}
  ${tagHtml}
  </td>
  </tr>
  </table>`;
}

function renderDocumentsHTML(docs = []) {
  if (!docs.length) return "";

  return `
<div data-f="docs" style="margin:8px 0 12px 0;">
  ${docs
    .map(
      (doc) => `
<p style="margin:0 0 4px 0;font-family:${FONT};font-size:13px;line-height:20px;">
  <a
    href="${esc(doc.url)}"
    target="_blank"
    style="color:#1b75bc;text-decoration:underline;"
  >
    ${esc(doc.label)}
  </a>
</p>`
    )
    .join("")}
</div>`;
}
function buildFullHTML({
  issueTag,
  awarenessItems,
  trainingSectionTitle,
  trainingItems,
  adoptionItems,
}) {
  const awarenessHtml = awarenessItems.map(buildAwarenessItemHTML).join("\n\n");
  const trainingItemsHtml = trainingItems.map(buildTrainingItemHTML).join("\n\n");
  const trainingSectionTitleHtml = (trainingSectionTitle || "").trim()
    ? `<p data-f="training-section-title" style="margin:0 0 14px 0;font-family:${FONT};font-size:22px;line-height:28px;font-weight:bold;color:#1b75bc;">${esc(trainingSectionTitle)}</p>`
    : "";
  const trainingHtml = `${trainingSectionTitleHtml}\n${trainingItemsHtml}`;

  const adoptionHtml = adoptionItems
    .map(buildAdoptionItemHTML)
    .join("\n\n");
  return normalizeLinksForEmail(`<!doctype html>
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

<tr><td align="left" valign="top" bgcolor="#1b76bc" class="issue-padding" style="padding:22px 24px;background-color:#1b76bc">
<p class="issue-title" data-f="issue-tag" style="margin:0;font-family:${FONT};font-size:23px;line-height:34px;font-weight:bold;color:#ffffff;">${esc(issueTag)}</p>
</td></tr>

<tr><td bgcolor="#262261" align="center" style="padding:10px 16px;background-color:#262261;font-family:${FONT};font-size:18px;line-height:24px;text-align:center;font-weight:bold;color:#ffffff;">Awareness</td></tr>
<tr><td align="left" valign="top" bgcolor="#ffffff" class="content-padding" style="padding:22px 24px 0 24px;background-color:#ffffff" data-section="awareness">
${awarenessHtml}
</td></tr>
${dividerRow()}

<tr><td bgcolor="#1b75bc" align="center" style="padding:10px 16px;background-color:#1b75bc;font-family:${FONT};font-size:18px;line-height:24px;text-align:center;font-weight:bold;color:#ffffff;">Training</td></tr>
<tr><td align="left" valign="top" bgcolor="#ffffff" class="content-padding" style="padding:22px 24px 0 24px;background-color:#ffffff" data-section="training">
${trainingHtml}
</td></tr>
${dividerRow()}

<tr><td bgcolor="#810e17" align="center" style="padding:10px 16px;background-color:#810e17;font-family:${FONT};font-size:18px;line-height:24px;text-align:center;font-weight:bold;color:#ffffff;">Adoption</td></tr>
<tr><td align="left" valign="top" bgcolor="#ffffff" class="content-padding" style="padding:22px 24px 28px 24px;background-color:#ffffff" data-section="adoption">
${adoptionHtml}
</td></tr>

<tr><td align="center" bgcolor="#262261" style="padding:22px;background-color:#262261;font-family:${FONT};font-size:12px;line-height:20px;color:#dbe7f4;">
<p style="margin:0;font-family:${FONT};font-size:14px;line-height:20px;font-weight:bold;color:#ffffff;">Singapore Shipping Association</p>
<p style="margin:4px 0 12px 0;font-family:${FONT};font-size:12px;line-height:20px;color:#dbe7f4;">The bulletin is issued to recognise the member's participation in the AI Training Series and formally acknowledge them as the company's AI Champion. The AI Champion will serve as a focal point within the company to promote awareness, encourage practical adoption of AI tools, and support the sharing of knowledge and good practices in the workplace.</p>
<p style="margin:0;font-family:${FONT};font-size:12px;line-height:20px;color:#dbe7f4;">
  If you wish to unsubscribe, please email <a href="mailto:nurqistina@ssa.org.sg" style="color:#dbe7f4;text-decoration:underline;">nurqistina@ssa.org.sg</a>.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`);
}

// ---------- parse hand-edited HTML back into state ----------
function parseDocuments(block) {
  const docsEl = block.querySelector('[data-f="docs"]');

  if (!docsEl) return [];

  return Array.from(
    docsEl.querySelectorAll("a")
  ).map((a) => ({
    label: a.textContent?.trim() || "",
    url: a.getAttribute("href") || "",
  }));
}

function parseAwarenessSubItems(block) {
  return Array.from(block.querySelectorAll('[data-block="awareness-subitem"]')).map((sub) => {
    const id = sub.getAttribute("data-id") || uid();
    const docs = parseDocuments(block);
    const header = sub.querySelector('[data-f="subheader"]')?.textContent.trim() || "";
    const bodyEl = sub.querySelector('[data-f="subbody"]');
    if (bodyEl) convertEmailTablesToBullets(bodyEl);
    const body = bodyEl ? bodyEl.innerHTML.trim() : "";
    const tagField = sub.querySelector(`[data-field="awareness-subitem-tag-${id}"]`);
    const tag = tagField ? tagField.querySelector("td")?.innerHTML.trim() || null : null;
    const status = sub.getAttribute("data-status") || "";
    const statusColor = sub.getAttribute("data-status-color") || "";
    const statusCustom = sub.getAttribute("data-status-custom") || "";
    return { id, header, body, tag, status, statusColor, statusCustom };
  });
}

function parseAwarenessItems(doc) {
  return Array.from(doc.querySelectorAll('[data-block="awareness-item"]')).map((block) => {
    const id = block.getAttribute("data-id") || uid();
    const docs = parseDocuments(block);
    const header = block.querySelector('[data-f="header"]')?.textContent.trim() || "";
    const bodyEl = block.querySelector('[data-f="body"]');
    if (bodyEl) convertEmailTablesToBullets(bodyEl);
    const body = bodyEl ? bodyEl.innerHTML.trim() : "";
    const tagField = block.querySelector(`[data-field="awareness-tag-${id}"]`);
    const tag = tagField ? tagField.querySelector("td")?.innerHTML.trim() || null : null;
    const status = block.getAttribute("data-status") || "";
    const statusColor = block.getAttribute("data-status-color") || "";
    const statusCustom = block.getAttribute("data-status-custom") || "";
    const subItems = parseAwarenessSubItems(block);
    return { id, header, body, tag, status, statusColor, statusCustom, isPreset: false, subItems };
  });
}

function parseTrainingItems(doc) {
  return Array.from(doc.querySelectorAll('[data-block="training-item"]')).map((block) => {
    const id = block.getAttribute("data-id") || uid();
    const docs = parseDocuments(block);
    const name = block.querySelector('[data-f="name"]')?.textContent.trim() || "";
    const partnershipLine = block.querySelector('[data-f="partnership"]')?.textContent.trim() || "";
    const bodyEl = block.querySelector('[data-f="body"]');
    if (bodyEl) convertEmailTablesToBullets(bodyEl);
    const body = bodyEl ? bodyEl.innerHTML.trim() : "";
    const tagField = block.querySelector(`[data-field="training-tag-${id}"]`);
    const status = block.getAttribute("data-status") || "";
    const statusColor = block.getAttribute("data-status-color") || "";
    const statusCustom = block.getAttribute("data-status-custom") || "";
    const summaryTag = tagField ? tagField.querySelector("td")?.innerHTML.trim() || null : null;
    return { id, name, partnershipLine, status, statusColor, statusCustom, body, summaryTag };
  });
}

function parseAdoptionItems(doc) {
  return Array.from(
    doc.querySelectorAll('[data-block="adoption-item"]')
  ).map((block) => {
    const id = block.getAttribute("data-id") || uid();

    const header =
      block.querySelector('[data-f="header"]')?.textContent.trim() || "";
      const docs = parseDocuments(block);
    const bodyEl = block.querySelector('[data-f="body"]');

    if (bodyEl) {
      convertEmailTablesToBullets(bodyEl);
    }

    const body = bodyEl
      ? bodyEl.innerHTML.trim()
      : "";

    const tagField = block.querySelector(
      `[data-field="adoption-tag-${id}"]`
    );

    const tag = tagField
      ? tagField.querySelector("td")?.innerHTML.trim() || null
      : null;

    const color =
      block.getAttribute("data-color") || "navy";
    const status = block.getAttribute("data-status") || "";
    const statusColor = block.getAttribute("data-status-color") || "";
    const statusCustom = block.getAttribute("data-status-custom") || "";

    return {
      id,
      header,
      body,
      tag,
      color,
      status,
      statusColor,
      statusCustom,
      isPreset: false,
    };
  });
}

function parseHtmlToState(htmlStr) {
  const doc = new DOMParser().parseFromString(htmlStr, "text/html");

  const issueTagEl = doc.querySelector('[data-f="issue-tag"]');
  const issueTag = issueTagEl ? issueTagEl.textContent.trim() : "";
  const docs = parseDocuments(block);
  const trainingSectionTitleEl = doc.querySelector('[data-f="training-section-title"]');
  const trainingSectionTitle = trainingSectionTitleEl ? trainingSectionTitleEl.textContent.trim() : "";

  const awarenessItems = parseAwarenessItems(doc);
  const trainingItems = parseTrainingItems(doc);
  const adoptionItems = parseAdoptionItems(doc);

  return {
    issueTag,
    trainingSectionTitle,
    awarenessItems,
    trainingItems,
    adoptionItems,
  };
}
function DocumentsField({
  docs = [],
  onChange,
  onAdd,
}) {
  return (
    <Field label="Documents">
      <div className="space-y-2">
        {docs.map((doc, index) => (
          <div
            key={index}
            className="flex gap-2 items-center"
          >
            <input
              className={inputCls}
              placeholder="Document name"
              value={doc.label || ""}
              onChange={(e) =>
                onChange(
                  docs.map((d, i) =>
                    i === index
                      ? { ...d, label: e.target.value }
                      : d
                  )
                )
              }
            />

            <input
              className={inputCls}
              placeholder="Document URL"
              value={doc.url || ""}
              onChange={(e) =>
                onChange(
                  docs.map((d, i) =>
                    i === index
                      ? { ...d, url: e.target.value }
                      : d
                  )
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                onChange(
                  docs.filter((_, i) => i !== index)
                )
              }
              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
              title="Remove document"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="text-xs text-indigo-700 font-medium flex items-center gap-1"
        >
          <Plus size={13} />
          Add Document
        </button>
      </div>
    </Field>
  );
}
// ---------- main component ----------

export default function AIBulletinBuilder() {
  const [tab, setTab] = useState("awareness");
  const [issueTag, setIssueTag] = useState("Issue 04 | Sep 2026");
  const [awarenessItems, setAwarenessItems] = useState(defaultAwarenessItems);
  const [trainingSectionTitle, setTrainingSectionTitle] = useState("SSA AI Training & Industry Activities");
  const [trainingItems, setTrainingItems] = useState(defaultTrainingItems);
  const [adoptionItems, setAdoptionItems] = useState(defaultAdoptionItems);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [copied, setCopied] = useState(false);
  const [rawHtmlEdit, setRawHtmlEdit] = useState(null);
  const [syncMessage, setSyncMessage] = useState(null);
  const [viewingRecordId, setViewingRecordId] = useState(null);
  const [docModalTarget, setDocModalTarget] = useState<{
    type: "awareness" | "awareness-subitem" | "training" | "adoption";
    id: string;
    parentId?: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/load-digest?key=ai-bulletin-data");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.issueTag) setIssueTag(data.issueTag);
            if (data.awarenessItems) {
              setAwarenessItems(
                data.awarenessItems.map((it) =>
                  makeAwarenessItem({
                    ...it,
                    subItems: (it.subItems || []).map((s) => makeAwarenessSubItem(s)),
                  })
                )
              );
            }
            if (typeof data.trainingSectionTitle === "string") setTrainingSectionTitle(data.trainingSectionTitle);
            if (data.trainingItems) setTrainingItems(data.trainingItems.map((it) => makeTrainingItem(it)));
            if (data.adoptionItems) {
              setAdoptionItems(
                data.adoptionItems.map((it) =>
                  makeAdoptionItem(it)
                )
              );
            } else if (data.adoption) {
              const old = data.adoption;

              setAdoptionItems([
                makeAdoptionItem({
                  header: "Funding Support for AI Adoption",
                  body: old.funding?.body || "",
                  tag: old.funding?.tag || null,
                  color: "navy",
                  isPreset: true,
                }),

                makeAdoptionItem({
                  header: "Common AI Adoption Challenges Observed",
                  body: old.challenges?.body || "",
                  tag: old.challenges?.tag || null,
                  color: "navy",
                  isPreset: true,
                }),

                makeAdoptionItem({
                  header: "Suggested Action This Month",
                  body: old.suggestedAction?.body || "",
                  tag: old.suggestedAction?.tag || null,
                  color: "cyan",
                  isPreset: true,
                }),

                ...(old.extraItems || []).map((it) =>
                  makeAdoptionItem(it)
                ),
              ]);
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
          body: JSON.stringify({
            issueTag,
            awarenessItems,
            trainingSectionTitle,
            trainingItems,
            adoptionItems,
            rawHtmlEdit,
            builtHtml: html,
          }),
        });
        setSaveStatus(res.ok ? "saved" : "error");
      } catch (e) {
        console.error("Failed to save AI bulletin:", e);
        setSaveStatus("error");
      }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    issueTag,
    awarenessItems,
    trainingSectionTitle,
    trainingItems,
    adoptionItems,
    rawHtmlEdit,
    loaded
  ]);

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
  const handleAddDocs = (newDocs) => {
    if (!docModalTarget) return;
  
    const { type, id, parentId } = docModalTarget;
  
    if (type === "awareness") {
      setAwarenessItems(
        awarenessItems.map((item) =>
          item.id === id
            ? {
                ...item,
                docs: [...(item.docs || []), ...newDocs],
              }
            : item
        )
      );
    }
  
    if (type === "awareness-subitem") {
      setAwarenessItems(
        awarenessItems.map((item) =>
          item.id === parentId
            ? {
                ...item,
                subItems: (item.subItems || []).map((sub) =>
                  sub.id === id
                    ? {
                        ...sub,
                        docs: [...(sub.docs || []), ...newDocs],
                      }
                    : sub
                ),
              }
            : item
        )
      );
    }
  
    if (type === "training") {
      setTrainingItems(
        trainingItems.map((item) =>
          item.id === id
            ? {
                ...item,
                docs: [...(item.docs || []), ...newDocs],
              }
            : item
        )
      );
    }
  
    if (type === "adoption") {
      setAdoptionItems(
        adoptionItems.map((item) =>
          item.id === id
            ? {
                ...item,
                docs: [...(item.docs || []), ...newDocs],
              }
            : item
        )
      );
    }
  };
  // ---- sub-item helpers (awareness only) ----
  const updateSubItem = (parentItem, subId, patch) => {
    const arr = (parentItem.subItems || []).map((s) => (s.id === subId ? { ...s, ...patch } : s));
    updateItem(awarenessItems, setAwarenessItems, parentItem.id, { subItems: arr });
  };
  const moveSubItem = (parentItem, index, dir) => {
    const arr = [...(parentItem.subItems || [])];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    updateItem(awarenessItems, setAwarenessItems, parentItem.id, { subItems: arr });
  };
  const removeSubItem = (parentItem, subId) => {
    updateItem(awarenessItems, setAwarenessItems, parentItem.id, {
      subItems: (parentItem.subItems || []).filter((s) => s.id !== subId),
    });
  };
  const addSubItem = (parentItem) => {
    updateItem(awarenessItems, setAwarenessItems, parentItem.id, {
      subItems: [...(parentItem.subItems || []), makeAwarenessSubItem()],
    });
  };

  const generatedHtml = buildFullHTML({
    issueTag,
    awarenessItems,
    trainingSectionTitle,
    trainingItems,
    adoptionItems,
  });
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

  const handleResetHtml = () => {
    setRawHtmlEdit(null);
    setSyncMessage(null);
  };

  const handleApplyHtmlToFields = () => {
    try {
      const parsed = parseHtmlToState(html);
      const foundAnything =
        parsed.awarenessItems.length ||
        parsed.trainingItems.length ||
        parsed.adoptionItems.length ||
        parsed.issueTag;
      if (!foundAnything) {
        setSyncMessage({
          type: "error",
          text: "Couldn't find any recognizable fields in that HTML — the data markers may have been removed or the structure changed too much.",
        });
        return;
      }
      setIssueTag(parsed.issueTag || issueTag);
      setTrainingSectionTitle(parsed.trainingSectionTitle || trainingSectionTitle);
      setAwarenessItems(
        parsed.awarenessItems.map((it) =>
          makeAwarenessItem({
            ...it,
            subItems: (it.subItems || []).map((s) => makeAwarenessSubItem(s)),
          })
        )
      );
      setTrainingItems(parsed.trainingItems.map((it) => makeTrainingItem(it)));
      setAdoptionItems(
        parsed.adoptionItems.map((it) =>
          makeAdoptionItem(it)
        )
      );
      setRawHtmlEdit(null);
      setSyncMessage({ type: "success", text: "Fields updated from your HTML edits." });
    } catch (e) {
      setSyncMessage({ type: "error", text: "Couldn't parse that HTML: " + e.message });
    }
  };

  const tabBtn = (key, label, Icon) => (
    <button
      onClick={() => setTab(key)}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 ${tab === key ? "border-indigo-700 text-indigo-800" : "border-transparent text-gray-500 hover:text-gray-700"
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
            <h1 className="text-xl font-bold text-indigo-900">
              AI Bulletin Builder
            </h1>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {saveStatus === "saving" && (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving…
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Save size={13} />
                Saved
              </>
            )}
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
                      <StatusBadgePicker
                        item={item}
                        onChange={(patch) => updateItem(awarenessItems, setAwarenessItems, item.id, patch)}
                      />
                      <Field label="Body">
                        <RichTextEditor
                          value={item.body}
                          onChange={(htmlVal) => updateItem(awarenessItems, setAwarenessItems, item.id, { body: htmlVal })}
                        />
                      </Field>
                      <DocumentsField
  docs={item.docs || []}
  onChange={(docs) =>
    updateItem(
      awarenessItems,
      setAwarenessItems,
      item.id,
      { docs }
    )
  }
  onAdd={() =>
    setDocModalTarget({
      type: "awareness",
      id: item.id,
    })
  }
/>
                      <TagBlock
                        value={item.tag}
                        onChange={(htmlVal) => updateItem(awarenessItems, setAwarenessItems, item.id, { tag: htmlVal })}
                        color="navy"
                        label="Add optional tag block"
                      />

                      {/* ---- Sub-items (nested under the main item, dark/navy header like Training) ---- */}
                      <div className="mt-4 pl-4 border-l-2 border-indigo-200 space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Sub-items
                        </p>

                        {(item.subItems || []).map((sub, si) => (
                          <div key={sub.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-slate-700">
                                {sub.header.trim() || `Sub-item ${si + 1} (untitled)`}
                              </span>
                              <MoveButtons
                                index={si}
                                length={item.subItems.length}
                                onMove={(index, dir) => moveSubItem(item, index, dir)}
                                onRemove={() => removeSubItem(item, sub.id)}
                              />
                            </div>

                            <Field label="Sub-item header">
                              <input
                                className={inputCls}
                                value={sub.header}
                                onChange={(e) => updateSubItem(item, sub.id, { header: e.target.value })}
                              />
                            </Field>

                            <StatusBadgePicker
                              item={sub}
                              onChange={(patch) => updateSubItem(item, sub.id, patch)}
                            />

                            <Field label="Body">
                              <RichTextEditor
                                value={sub.body}
                                onChange={(htmlVal) => updateSubItem(item, sub.id, { body: htmlVal })}
                              />
                            </Field>
                            <DocumentsField
  docs={sub.docs || []}
  onChange={(docs) =>
    updateSubItem(
      item,
      sub.id,
      { docs }
    )
  }
  onAdd={() =>
    setDocModalTarget({
      type: "awareness-subitem",
      id: sub.id,
      parentId: item.id,
    })
  }
/>
                            <TagBlock
                              value={sub.tag}
                              onChange={(htmlVal) => updateSubItem(item, sub.id, { tag: htmlVal })}
                              color="navy"
                              label="Add optional tag block"
                            />
                          </div>
                        ))}

                        <button
                          onClick={() => addSubItem(item)}
                          className="flex items-center gap-1.5 text-xs text-slate-600 font-medium hover:text-slate-900"
                        >
                          <Plus size={14} /> Add sub-item
                        </button>
                      </div>
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
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <Field label="Training section title">
                      <input
                        className={inputCls}
                        value={trainingSectionTitle}
                        onChange={(e) => setTrainingSectionTitle(e.target.value)}
                        placeholder="SSA AI Training & Industry Activities"
                      />
                    </Field>
                  </div>

                  {trainingItems.map((item, i) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-indigo-700">
                          {item.name.trim() || `Training ${i + 1} (untitled)`}
                        </span>
                        <StatusBadgePicker
                        item={item}
                        onChange={(patch) => updateItem(trainingItems, setTrainingItems, item.id, patch)}
                      />
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
                      <DocumentsField
  docs={item.docs || []}
  onChange={(docs) =>
    updateItem(
      trainingItems,
      setTrainingItems,
      item.id,
      { docs }
    )
  }
  onAdd={() =>
    setDocModalTarget({
      type: "training",
      id: item.id,
    })
  }
/>
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
                  {adoptionItems.map((item, i) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-indigo-700">
                          {item.header.trim() || `Item ${i + 1} (untitled)`}

                          {item.isPreset && (
                            <span className="ml-2 text-gray-400 font-normal">
                              (preset)
                            </span>
                          )}
                        </span>

                        <MoveButtons
                          index={i}
                          length={adoptionItems.length}
                          onMove={(index, dir) =>
                            move(
                              adoptionItems,
                              setAdoptionItems,
                              index,
                              dir
                            )
                          }
                          onRemove={() =>
                            setAdoptionItems(
                              adoptionItems.filter(
                                (x) => x.id !== item.id
                              )
                            )
                          }
                        />
                      </div>

                      <Field label="Item block header">
                        <input
                          className={inputCls}
                          value={item.header}
                          onChange={(e) =>
                            updateItem(
                              adoptionItems,
                              setAdoptionItems,
                              item.id,
                              { header: e.target.value }
                            )
                          }
                        />
                      </Field>
                      <StatusBadgePicker
                        item={item}
                        onChange={(patch) => updateItem(adoptionItems, setAdoptionItems, item.id, patch)}
                      />
                      <Field label="Body">
                        <RichTextEditor
                          value={item.body}
                          onChange={(htmlVal) =>
                            updateItem(
                              adoptionItems,
                              setAdoptionItems,
                              item.id,
                              { body: htmlVal }
                            )
                          }
                        />
                      </Field>
                      <DocumentsField
  docs={item.docs || []}
  onChange={(docs) =>
    updateItem(
      adoptionItems,
      setAdoptionItems,
      item.id,
      { docs }
    )
  }
  onAdd={() =>
    setDocModalTarget({
      type: "adoption",
      id: item.id,
    })
  }
/>

                      <TagBlock
                        value={item.tag}
                        onChange={(htmlVal) =>
                          updateItem(
                            adoptionItems,
                            setAdoptionItems,
                            item.id,
                            { tag: htmlVal }
                          )
                        }
                        color={item.color}
                        label="Add optional tag block"
                      />
                    </div>
                  ))}

                  <button
                    onClick={() =>
                      setAdoptionItems([
                        ...adoptionItems,
                        makeAdoptionItem(),
                      ])
                    }
                    className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900"
                  >
                    <Plus size={16} />
                    Add adoption item
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
                        onClick={handleApplyHtmlToFields}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white text-sm rounded font-medium hover:bg-emerald-800"
                      >
                        <Save size={15} /> Apply HTML changes to fields
                      </button>
                    )}
                    {isEdited && (
                      <button
                        onClick={handleResetHtml}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded font-medium hover:bg-gray-50"
                      >
                        <RotateCcw size={15} /> Discard edits
                      </button>
                    )}
                  </div>
                  {isEdited && !syncMessage && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-3">
                      Showing your manual edits. The Awareness / Training / Adoption tabs won't reflect this until you click <strong>Apply HTML changes to fields</strong> — text edits inside existing fields sync fine, but new blocks you hand-write from scratch won't be recognized.
                    </p>
                  )}
                  {syncMessage && (
                    <p className={`text-xs rounded px-2 py-1.5 mb-3 border ${syncMessage.type === "success" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"}`}>
                      {syncMessage.text}
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
                    onChange={(e) => {
                      setRawHtmlEdit(e.target.value);
                      setSyncMessage(null);
                    }}
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
