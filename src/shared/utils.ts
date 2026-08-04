export const uid = () => Math.random().toString(36).slice(2, 10);

export function esc(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function tagPills(tagStr: string) {
  return (tagStr || "").split(",").map((t) => t.trim()).filter(Boolean)
    .map((t) => `<span style="white-space:normal;word-wrap:break-word;word-break:break-word;background:#f4f1ec;border:1px solid #e8e3da;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#000000;padding:2px 8px;margin-right:6px;line-height:2.2;">${esc(t)}</span>`)
    .join("");
}

export function formatDeadline(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch (e) {
    return dateStr;
  }
}

export const inputCls = "w-full border border-gray-300 rounded px-2 py-1.5 text-sm";