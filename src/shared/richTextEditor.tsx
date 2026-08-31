import { useEffect, useRef } from "react";

export default function RichTextEditor({ value, onChange }) {
  const ref = useRef(null);
  const init = useRef(false);
  const savedRange = useRef(null);

  useEffect(() => {
    if (ref.current && !init.current) {
      ref.current.innerHTML = value || "";
      init.current = true;
    }
  }, [value]);

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
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  const insertLink = () => {
    const sel = window.getSelection();
    ref.current.focus();
    if (savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }

    const selectedText = sel.toString();
    const url = window.prompt("Enter Link URL:", "https://");
    if (!url) return;

    ref.current.focus();
    sel.removeAllRanges();
    if (savedRange.current) {
      sel.addRange(savedRange.current);
    }

    const linkText = selectedText || url;
    const html = `<a href="${url}" target="_blank" style="color:#1b75bc;text-decoration:underline;font-weight:bold;">${escapeHtml(linkText)}</a>`;
    document.execCommand("insertHTML", false, html);
    onChange(ref.current.innerHTML);
  };

  const btn = "px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-700";

  return (
    <div className="border border-gray-300 rounded overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b border-gray-200 p-1.5 bg-gray-50">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} className={btn + " font-bold"}>B</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} className={btn + " underline"}>U</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} className={btn}>• List</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertOrderedList")} className={btn}>1. List</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertTable} className={btn}>Table</button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
          onClick={insertLink}
          className={btn}
        >
          Link
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("unlink")} className={btn}>Unlink</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("removeFormat")} className={btn}>Clear</button>
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
  );
}