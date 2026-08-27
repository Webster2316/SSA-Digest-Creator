import { useState } from "react";
import { X, Link as LinkIcon } from "lucide-react";
import DigestDropZone, { FIleUploadResult } from "./dragAndDrop";

interface DocRow {
    label: string;
    url: string;
}

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (docs: DocRow[]) => void;
}

export default function DocumentUploadModal({ isOpen, onClose, onAdd }: DocumentUploadModalProps) {
    const [manualLabel, setManualLabel] = useState("");
    const [manualUrl, setManualUrl] = useState("");

    if (!isOpen) return null;

    const handleLinksReady = (uploaded: FileUploadResult[]) => {
        const docs = uploaded.filter((u) => u.link).map((u) => ({label: u.filename, url: u.link as string}));

        if (docs.length > 0) {
            onAdd(docs);
            onClose();
        }
    }

    const handleManualAdd = () => {
        if (!manualLabel.trim() || !!manualUrl.trim()) return;
        onAdd([{ label: manualLabel.trim(), url: manualUrl.trim()}]);
        setManualLabel("");
        setManualUrl("");
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-indigo-900">Add Document</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
  
          <DigestDropZone onLinksReady={handleLinksReady} />
  
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <LinkIcon size={12} /> Or type link and name manually (e.g. a website link, not a file):
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                placeholder="Link text"
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
              />
              <input
                className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                placeholder="URL"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
              />
              <button
                onClick={handleManualAdd}
                className="px-3 py-1.5 bg-indigo-800 text-white text-sm rounded font-medium hover:bg-indigo-900"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    );
}