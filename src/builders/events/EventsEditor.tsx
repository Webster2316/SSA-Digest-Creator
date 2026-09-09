import { useState, useEffect } from "react";
import { Plus, Copy, Check, Save, Eye, Code2, BookOpen, GraduationCap, TrendingUp, Archive, Loader2, RotateCcw, Trash2 } from "lucide-react";
import Field from "../../shared/field";
import MoveButtons from "../../shared/moveButtons";
import RecordsPanel from "../../shared/recordsPanel";
import RecordViewer from "../../shared/recordViewer";
import RichTextEditor from "../../shared/richTextEditor";
import { uid, esc, inputCls } from "../../shared/utils";
import DocumentUploadModal from "../../shared/documentUploadModal";
import useConfirmDelete from "../../shared/useConfirmDelete";

const FONT = "'Yu Gothic UI','Yu Gothic','Meiryo','Segoe UI',Arial,sans-serif";

export default function EventsEditor() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState("idle");
    const { confirmDelete, deleteModal } = useConfirmDelete();
    const [issueRange, setIssueRange] = useState("Issue: ");
    const [greeting, setGreeting] = useState("Dear Member, below is...");
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
   
    return (
        <div>
        <div className="flex items-center gap-3 mb-4">
      <img
        src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
        alt="SSA Logo"
        className="h-8 w-auto"
      />

      <h1 className="text-xl font-bold text-indigo-900">
        Upcoming Events
      </h1>

      <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
      {saveStatus === "saving" && <><Loader2 size={13} className="animate-spin" /> Saving…</>}
      {saveStatus.startsWith("Saved at") && (
<>
<Save size={13} />
{saveStatus}
</>
)}
{saveStatus === "error" && (
<span className="text-red-600">
Save failed
</span>
)}
    </div>
    </div>
</div>
    )
}