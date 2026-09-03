import { useEffect, useRef, useState } from "react";
import { Unlink, Link, Palette } from "lucide-react"
import { HexColorPicker } from "react-colorful"


export default function RichTextEditor({ value, onChange }) {
  const ref = useRef(null);
  const init = useRef(false);
  const savedRange = useRef(null);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [showColorPicker, setShowColorPicker] = useState("#000000");

  useEffect(() => {
    if (ref.current && !init.current) {
      ref.current.innerHTML = value || "";
      init.current = true;
    }
  }, [value]);

  const setColor = (color) => {
    ref.current?.focus();

    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    document.execCommand("foreColor", false, color);
    onChange(ref.current.innerHTML);
    setShowColorPicker(false);
    savedRange.current = null;
  };

  const openColorPicker = () => {
    saveSelection();
    setShowColorPicker((prev) => !prev);
  };


  const exec = (cmd, val = null) => {
    ref.current.focus();
    document.execCommand(cmd, false, val);
    onChange(ref.current.innerHTML);
  };

  const insertTable = () => {
    ref.current.focus();
    const cell = 'style="border:1px solid #ccc;padding:6px;font-size:13px;"';
    const html = `<table style="border-collapse:collapse;width:100%;margin:8px 0;"><tbody><tr><td ${cell}>Cell</td><td ${cell}>Cell</td></tr><tr><td ${cell}>Cell</td><td ${cell}>Cell</td></tr></tbody></table><p><br></p>`;
    document.execCommand("insertHTML", false, html);
    onChange(ref.current.innerHTML);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ref.current && ref.current.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const escapeHtml = (str) => {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const normalizeUrl = (url) => {
    let trimmed = url.trim();

    // Remove accidental leading slashes
    trimmed = trimmed.replace(/^\/+/, "");

    if (
      /^https?:\/\//i.test(trimmed) ||
      /^mailto:/i.test(trimmed) ||
      /^tel:/i.test(trimmed)
    ) {
      return trimmed;
    }

    return `https://${trimmed}`;
  };

  const insertLink = () => {
    if (!linkUrl.trim() || linkUrl.trim() === "https://") {
      return;
    }

    const finalUrl = normalizeUrl(linkUrl);
    const text = linkText.trim() || finalUrl;

    const sel = window.getSelection();

    ref.current?.focus();

    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }

    const html = `<a href="${escapeHtml(
      finalUrl
    )}" target="_blank" rel="noopener noreferrer" style="color:#1b75bc;text-decoration:underline;font-weight:bold;">${escapeHtml(
      text
    )}</a>`;

    document.execCommand("insertHTML", false, html);

    if (ref.current) {
      onChange(ref.current.innerHTML);
    }

    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
    savedRange.current = null;
  };

  const openLinkModal = () => {
    const sel = window.getSelection();

    saveSelection();

    setLinkText(sel?.toString() || "");
    setLinkUrl("");
    setShowLinkModal(true);
  };



  const btn = "px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-700";

  return (
    <>
      <div className="border border-gray-300 rounded overflow-hidden">
        <div className="flex flex-wrap gap-1 border-b border-gray-200 p-1.5 bg-gray-50">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("bold")}
            className={btn + " font-bold"}
          >
            B
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("italic")}
            className={btn + " italic"}
          >
            I
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("underline")}
            className={btn + " underline"}
          >
            U
          </button>
          <div className="relative">
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={openColorPicker}
    className={btn}
  >
    <Palette size={14} />
  </button>

  {showColorPicker && (
    <div className="absolute z-50 mt-1 flex flex-wrap gap-1 rounded border border-gray-200 bg-white p-2 shadow-lg w-36">
      {["#000000", "#1b75bc", "#e11d48", "#16a34a", "#f59e0b", "#7c3aed", "#374151", "#ffffff"].map((c) => (
        <button
          key={c}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setColor(c)}
          className="h-5 w-5 rounded-full border border-gray-300"
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}

<HexColorPicker
  color={pickerColor}
  onChange={(c) => {
    setPickerColor(c);
    setColor(c);
  }}
  style={{ width: 150, height: 120 }}
/>
    </div>
  )}
</div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("insertUnorderedList")}
            className={btn}
          >
            • List
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("insertOrderedList")}
            className={btn}
          >
            1. List
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertTable}
            className={btn}
          >
            Table
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={openLinkModal}
            className={btn}
          >
            <Link size={14} />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("unlink")}
            className={btn}
          >
            <Unlink size={14} />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("removeFormat")}
            className={btn}
          >
            Clear
          </button>
        </div>

        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
          className="p-3 text-sm focus:outline-none"
          style={{ minHeight: "90px" }}
        />
      </div>

      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">
              Insert Link
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Text to display
                </label>

                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  URL
                </label>

                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  autoFocus
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={insertLink}
                className="px-3 py-1.5 text-sm rounded bg-indigo-700 text-white hover:bg-indigo-800"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
