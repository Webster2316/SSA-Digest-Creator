import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";

export default function MoveButtons({ index, length, onMove, onRemove }: {
  index: number; 
  length: number;
  onMove: (index: number, dir: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onMove(index, -1)} disabled={index === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" title="Move up"><ChevronUp size={16} /></button>
      <button onClick={() => onMove(index, 1)} disabled={index === length - 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" title="Move down"><ChevronDown size={16} /></button>
      <button onClick={onRemove} className="p-1 rounded hover:bg-red-50 text-red-500" title="Remove"><Trash2 size={16} /></button>
    </div>
  );
}