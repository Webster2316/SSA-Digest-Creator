import { useState } from "react";
import { X, Link as LinkIcon } from "lucide-react";

interface namePopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (title: string) => void;
}

export default function namePopUpModal({ isOpen, onClose, onAdd }: namePopUpModalProps) {
const [eventName, setEventName] = useState("");

    if (!isOpen) return null;

    const handleCreate = () => {
       const trimmedName = eventName.trim();

       if(!trimmedName) requestAnimationFrame;

        onAdd(trimmedName);
     setEventName("");
        onClose();
    }

    return (
        <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-indigo-900">
              Create New Event
            </h3>
  
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
  
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Event Name
            </label>
  
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                placeholder="e.g MaritimeConvo@SSA"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
  
              <button
                onClick={handleCreate}
                className="px-3 py-1.5 bg-indigo-800 text-white text-sm rounded font-medium hover:bg-indigo-900"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }