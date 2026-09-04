import { useState } from "react";
import DeleteConfirmModal from "./deleteConfirmModal";

interface DeleteRequest {
  itemType?: string;
  itemName?: string;
  action: () => void;
}

export default function useConfirmDelete() {
  const [request, setRequest] = useState<DeleteRequest | null>(null);

  const confirmDelete = ({
    itemType = "item",
    itemName = "",
    action,
  }: DeleteRequest) => {
    setRequest({
      itemType,
      itemName,
      action,
    });
  };

  const closeDeleteModal = () => {
    setRequest(null);
  };

  const handleConfirm = () => {
    if (!request) return;

    request.action();
    setRequest(null);
  };

  const deleteModal = (
    <DeleteConfirmModal
      isOpen={request !== null}
      itemType={request?.itemType}
      itemName={request?.itemName}
      onClose={closeDeleteModal}
      onConfirm={handleConfirm}
    />
  );

  return {
    confirmDelete,
    deleteModal,
  };
}