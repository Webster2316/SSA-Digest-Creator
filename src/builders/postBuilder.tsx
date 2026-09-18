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
import DocumentUploadModal from "../../shared/documentUploadModal";

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
    const { confirmDelete, deleteModal } = useConfirmDelete();
    const [ posts, setPosts ] =  useState<Post[]>([]);


    const handleAddPost = (title: string) => {
        setPosts((prev) => [
          ...prev,
          {
            id: uid(),
           caption: "",
           gallery: [],
          },
        ]);
      };
return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">

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
     {/* addPost section */}
 
     <Field label="Caption">
  <RichTextEditor
    value={post.caption ?? ""}
    onChange={(caption: string) =>
      setPost({ ...post, caption })
    }
  />
</Field>
     
     
     <button
                onClick={() =>
                  setPosts([
                    ...posts,
                    {
                        id: uid(),
                        caption: "",
                        gallery: [],
                    },
                  ])
                }
                className="flex items-center gap-1.5 text-sm text-indigo-700 font-medium hover:text-indigo-900"
              >
                <Plus size={16} /> Draft a post
              </button>
     
     
     
     </div>
     <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onAdd={addDocuments}
        builderKey="events-builder-data"
      />
      {deleteModal}
     </div>
)
}