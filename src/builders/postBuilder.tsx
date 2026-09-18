import { useState, useEffect } from "react";
import {
    Trash2,
    CircleCheck,
    Plus,
    Loader2,
    Archive,
    Save,
    Copy,
    Check,
} from "lucide-react";
import useConfirmDelete from "../../shared/useConfirmDelete";
import Field from "../../shared/field";
import RichTextEditor from "../../shared/richTextEditor";
import { uid, esc, inputCls } from "../../shared/utils";

interface GalleryImage {
    url: string;
    name?: string;
    alt?: string;
}

interface Post {
caption: string,
gallery: GalleryImage[],
}

export default function postBuilder() {
    const [loaded, setLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState("idle");

return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
<div>
     {/* HEADER */}
     <div className="flex items-center gap-3 mb-4">
     <img
       src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
       alt="SSA Logo"
       className="h-8 w-auto"
     />

     <h1 className="text-xl font-bold text-indigo-900">LinkedIn Post Drafts</h1>

     <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
       {saveStatus === "saving" && (
         <>
           <Loader2 size={13} className="animate-spin" /> Saving…
         </>
       )}
       {saveStatus.startsWith("Saved at") && (
         <>
           <Save size={13} /> {saveStatus}
         </>
       )}
       {saveStatus === "error" && <span className="text-red-600">Save failed</span>}
     </div>
     </div>
     <p>work in progress</p></div>
     </div>
     </div>
)
}