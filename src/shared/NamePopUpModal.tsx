import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface NamePopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;

  heading?: string;
  fieldLabel?: string;
  placeholder?: string;
  buttonText?: string;
}

export default function NamePopUpModal({
  isOpen,
  onClose,
  onAdd,
  heading = "Create New Item",
  fieldLabel = "Item Name",
  placeholder = "Enter a name",
  buttonText = "Create",
}: NamePopUpModalProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setName("");
    onClose();
  };

  const handleCreate = () => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    onAdd(trimmedName);
    setName("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-indigo-900">
            {heading}
          </h3>

          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleCreate();
          }}
        >
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {fieldLabel}
          </label>

          <div className="flex gap-2">
            <input
              autoFocus
              className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
              placeholder={placeholder}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded bg-indigo-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}