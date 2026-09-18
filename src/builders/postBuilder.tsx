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
import useConfirmDelete from "../shared/useConfirmDelete";
import Field from "../shared/field";
import RichTextEditor from "../shared/richTextEditor";
import { uid, esc, inputCls } from "../shared/utils";
import DocumentUploadModal from "../shared/documentUploadModal";
import NamePopUp from "../shared/NamePopUpModal";

interface GalleryImage {
  url: string;
  name?: string;
  alt?: string;
}

interface Post {
  id: string;
  title: string;
  caption: string;
  gallery: GalleryImage[];
}
function getDateTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
export default function PostBuilder() {
    const [loaded, setLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState("idle");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);



  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/load-digest?key=posts-draft-data");
        if (res.ok) {
          const data = await res.json();

          if (Array.isArray(data?.posts)) {
            setPosts(data.map(posts));
          }

        }
      } catch (e) {
        console.error("Failed to load post drafter:", e);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    setSaveStatus("saving");

    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/save-digest?key=posts-draft-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ posts }),
        });

        if (res.ok) {
          setSaveStatus(`Saved at ${getDateTime()}`);
        } else {
          setSaveStatus("error");
        }
      } catch (e) {
        console.error("Failed to save posts drafter:", e);
        setSaveStatus("error");
      }
    }, 700);

    return () => clearTimeout(t);
  }, [posts]);


  const handleAddPost = () => {
    setPosts((current) => [
      ...current,
      {
        id: uid(),
        title: "",
        caption: "",
        gallery: [],
      },
    ]);
  };

  const updateCaption = (postId: string, caption: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, caption }
          : post
      )
    );
  };

  const deletePost = (postId: string) => {
    setPosts((current) =>
      current.filter((post) => post.id !== postId)
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-4xl p-4">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <img
            src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
            alt="SSA Logo"
            className="h-8 w-auto"
          />

          <h1 className="text-xl font-bold text-indigo-900">
            LinkedIn Post Drafts
          </h1>

          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
            {saveStatus === "saving" && (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving…
              </>
            )}

            {saveStatus.startsWith("Saved at") && (
              <>
                <Save size={13} />
                {saveStatus}
              </>
            )}

            {saveStatus === "error" && (
              <span className="text-red-600">Save failed</span>
            )}
          </div>
        </div>

        {/* Post editors */}
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div
              key={post.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-indigo-900">
                  Draft {index + 1}: {post.title}
                </h2>

                <button
                  type="button"
                  onClick={() => deletePost(post.id)}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete draft"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <Field label="Caption">
                <RichTextEditor
                  value={post.caption}
                  onChange={(caption: string) =>
                    updateCaption(post.id, caption)
                  }
                />
              </Field>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsNameModalOpen(true)}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-900"
        >
          <Plus size={16} />
          Draft a post
        </button>
        <NamePopUpModal
  isOpen={isNameModalOpen}
  onClose={() => setIsNameModalOpen(false)}
  onAdd={handleAddPost}
  heading="Create Post Draft"
  fieldLabel="Post Title"
  placeholder="e.g. idk insert linked in post header..."
  buttonText="Create Draft"
/>
      </div>
    </div>
  );
}