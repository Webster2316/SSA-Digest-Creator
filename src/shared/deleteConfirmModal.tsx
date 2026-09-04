import { AlertTriangle, Trash2, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  itemType?: string;
  itemName?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  itemType = "item",
  itemName = "",
  onClose,
  onConfirm,
}: Props) {
  if (!isOpen) return null;

  const cleanName = itemName.trim();

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Delete {itemType}?
              </h3>

              <p className="text-xs text-gray-500 mt-0.5">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Item being deleted */}
        {cleanName && (
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 mb-5">
            <p className="text-xs text-gray-500 mb-1">
              {itemType}
            </p>

            <p className="text-sm font-medium text-gray-800">
              {cleanName}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded font-medium hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded font-medium hover:bg-red-700 flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}