import RichTextEditor from "./richTextEditor";

const COLORS = {
navy: { border: "#262261", bg: "#f4f7fb" },
blue: { border: "#1b75bc", bg: "#eaf4fb" },
cyan: { border: "#00aeef", bg: "#eafaff" },
}

export default function TagBlocks({ value, onChange, color = "navy", label = "Add Optional tag block "}) {
  const included = value !== null && value !== undefined;
  const c = COLORS[color] || COLORS.navy;

  const toggle = () => {
    if (included) {
        onChange(null);
    } else {
        onChange("")
    }
  }

  return(
    <div className="mt-2">
    <label className="flex items-center gap-2 text-xs text-gray-600 mb-1.5 cursor-pointer">
      <input type="checkbox" checked={included} onChange={toggle} className="cursor-pointer" />
      {included ? "Tag block included" : label}
    </label>

    {included && (
      <div
        className="rounded-sm"
        style={{ borderLeft: `4px solid ${c.border}`, backgroundColor: c.bg, padding: "2px" }}
      >
        <RichTextEditor value={value} onChange={onChange} />
      </div>
    )}
  </div>
);
}

// Pure export helper — produces the exact table markup from the HTML template.
// Called from utils.ts when generating the final bulletin HTML.
export function renderTagBlockHTML(html, color = "navy", fieldKey) {
const stripped = (html || "").replace(/<[^>]*>/g, "").trim();
if (!stripped) return ""; // nothing to render if empty/removed

const c = COLORS[color] || COLORS.navy;

return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" data-field="${fieldKey}">
<tr>
<td style="padding: 18px; background-color: ${c.bg}; border-left: 4px solid ${c.border};">
${html}
</td>
</tr>
</table>`;
}