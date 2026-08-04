import { useEffect, useRef } from "react";
export default function RichTextEditor ({ value, onChange }) {
    const ref = useRef(null);
    const init = useRef(false);
  
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
  
    const btn = "px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-700";
  
    return (
      <div className="border border-gray-300 rounded overflow-hidden">
        <div className="flex flex-wrap gap-1 border-b border-gray-200 p-1.5 bg-gray-50">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} className={btn + " font-bold"}>B</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} className={btn + " underline"}>U</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} className={btn}>• List</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertOrderedList")} className={btn}>1. List</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertTable} className={btn}>Table</button>
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
  