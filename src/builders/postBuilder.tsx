import { useEffect, useRef, useState } from "react";
import {
  Trash2,
  Plus,
  Loader2,
  Save,
  Download,
  ImagePlus,
  Upload,
  X,
} from "lucide-react";
import JSZip from "jszip";

import Field from "../shared/field";
import RichTextEditor from "../shared/richTextEditor";
import { uid } from "../shared/utils";
import DocumentUploadModal from "../shared/documentUploadModal";
import NamePopUp from "../shared/NamePopUpModal";

interface GalleryImage {
  url: string;
  name?: string;
  alt?: string;
  contentBytes?: string;
}

interface Post {
  id: string;
  title: string;
  caption: string;
  gallery: GalleryImage[];
}

const MAX_DIMENSION = 1600;
const MAX_PAYLOAD_BYTES = 4_000_000; // Vercel body limit is ~4.5 MB

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
};

function getDateTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}

/** Raw Base64 with no data: prefix, or "" if there is no usable data. */
function galleryImageBase64(image: GalleryImage): string {
  const content = image.contentBytes?.trim();
  if (!content) return "";
  if (content.startsWith("data:")) {
    return content.slice(content.indexOf(",") + 1).replace(/\s/g, "");
  }
  if (/^https?:\/\//i.test(content)) return "";
  return content.replace(/\s/g, "");
}

/** Preview source. Never throws. Returns "" when nothing can be previewed. */
function galleryImageSrc(image: GalleryImage): string {
  const content = image.contentBytes?.trim();
  if (!content) return "";
  if (content.startsWith("data:image/")) return content;
  if (/^https?:\/\//i.test(content)) return "";

  const extension = image.name?.split(".").pop()?.toLowerCase();
  const mimeType = MIME_TYPES[extension ?? ""] ?? "image/png";

  return `data:${mimeType};base64,${galleryImageBase64(image)}`;
}

/** Resize and compress a local file so the saved JSON stays small. */
function compressImage(file: File): Promise<GalleryImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(
        1,
        MAX_DIMENSION / Math.max(img.width, img.height)
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Could not process ${file.name}.`));
        return;
      }

      // White background so transparent PNGs don't turn black in JPEG
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      URL.revokeObjectURL(objectUrl);

      const baseName = file.name.replace(/\.[^.]+$/, "");
      resolve({
        url: `local:${uid()}`,
        name: `${baseName}.jpg`,
        alt: file.name,
        contentBytes: dataUrl.split(",")[1],
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`${file.name} is not a readable image.`));
    };

    img.src = objectUrl;
  });
}

export default function PostBuilder() {
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [galleryPostId, setGalleryPostId] = useState<string | null>(null);
  const [downloadingPostId, setDownloadingPostId] = useState<string | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  const appendImages = (postId: string, images: GalleryImage[]) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, gallery: [...(post.gallery ?? []), ...images] }
          : post
      )
    );
  };

  // Images coming back from the SharePoint upload modal
  const addGalleryImages = (
    postId: string,
    docs: { label: string; url: string; contentBytes?: string }[]
  ) => {
    // Diagnostic: MISSING here means the modal isn't returning file content
    console.log(
      "modal returned:",
      docs.map((d) => ({
        label: d.label,
        url: d.url,
        bytesLength: d.contentBytes?.length ?? "MISSING",
      }))
    );

    appendImages(
      postId,
      docs.map((doc) => ({
        name: doc.label,
        alt: doc.label,
        url: doc.url,
        contentBytes: doc.contentBytes,
      }))
    );
  };

  // Images picked from the user's computer
  const handleLocalFiles = async (files: FileList | null) => {
    const postId = uploadTargetRef.current;
    if (!files?.length || !postId) return;

    const results = await Promise.allSettled(
      Array.from(files).map((file) => compressImage(file))
    );

    const images = results
      .filter(
        (r): r is PromiseFulfilledResult<GalleryImage> =>
          r.status === "fulfilled"
      )
      .map((r) => r.value);

    const failed = results.filter((r) => r.status === "rejected").length;

    if (images.length) appendImages(postId, images);
    if (failed) alert(`${failed} file(s) could not be read as images.`);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeGalleryImage = (postId: string, imageIndex: number) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              gallery: (post.gallery ?? []).filter(
                (_, i) => i !== imageIndex
              ),
            }
          : post
      )
    );
  };

  const downloadImages = async (post: Post) => {
    if (!post.gallery?.length) return;

    setDownloadingPostId(post.id);

    try {
      const zip = new JSZip();
      const skipped: string[] = [];
      let added = 0;

      for (let index = 0; index < post.gallery.length; index++) {
        const image = post.gallery[index];
        const label = image.name ?? `Image ${index + 1}`;
        const filename = safeFilename(image.name || `image-${index + 1}.png`);
        const zipName = `${index + 1}-${filename}`;

        const base64 = galleryImageBase64(image);

        if (base64) {
          zip.file(zipName, base64, { base64: true });
          added++;
          continue;
        }

        // No stored data: try the URL (works only if it is publicly readable)
        if (/^https?:\/\//i.test(image.url)) {
          try {
            const response = await fetch(image.url);
            if (!response.ok) throw new Error("bad response");

            const blob = await response.blob();
            if (!blob.type.startsWith("image/")) throw new Error("not image");

            zip.file(zipName, blob);
            added++;
            continue;
          } catch {
            // fall through to skipped
          }
        }

        skipped.push(label);
      }

      if (added === 0) {
        throw new Error(
          `No image data found for:\n${skipped.join("\n")}\n\n` +
            "Remove them and re-add using “Upload from computer”."
        );
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = `${safeFilename(post.title || "gallery")}-gallery.zip`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);

      if (skipped.length) {
        alert(
          `Downloaded, but these had no image data and were skipped:\n${skipped.join(
            "\n"
          )}`
        );
      }
    } catch (error) {
      console.error("Failed to download gallery:", error);
      alert(
        error instanceof Error
          ? error.message
          : "The gallery could not be downloaded."
      );
    } finally {
      setDownloadingPostId(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/load-digest?key=posts-draft-data");

        if (res.ok) {
          const data = await res.json();

          if (Array.isArray(data?.posts)) {
            setPosts(
              data.posts.map((post: Post) => ({
                ...post,
                gallery: Array.isArray(post.gallery) ? post.gallery : [],
              }))
            );
          }
        }
      } catch (error) {
        console.error("Failed to load post drafter:", error);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    setSaveStatus("saving");

    const timeout = setTimeout(async () => {
      try {
        const body = JSON.stringify({ posts });

        if (body.length > MAX_PAYLOAD_BYTES) {
          setSaveStatus("too-large");
          return;
        }

        const res = await fetch("/api/save-digest?key=posts-draft-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (res.ok) {
          setSaveStatus(`Saved at ${getDateTime()}`);
        } else {
          console.error("Save failed with status", res.status);
          setSaveStatus(`error:${res.status}`);
        }
      } catch (error) {
        console.error("Failed to save posts drafter:", error);
        setSaveStatus("error");
      }
    }, 700);

    return () => clearTimeout(timeout);
  }, [posts, loaded]);

  const handleAddPost = (title: string) => {
    setPosts((current) => [
      ...current,
      { id: uid(), title: title.trim(), caption: "", gallery: [] },
    ]);
  };

  const updateCaption = (postId: string, caption: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, caption } : post
      )
    );
  };

  const deletePost = (postId: string) => {
    setPosts((current) => current.filter((post) => post.id !== postId));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-4xl p-4">
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

            {saveStatus === "too-large" && (
              <span className="text-red-600">
                Too large to save. Remove some images.
              </span>
            )}

            {saveStatus.startsWith("error") && (
              <span className="text-red-600">
                Save failed
                {saveStatus.includes(":") ? ` (${saveStatus.split(":")[1]})` : ""}
              </span>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleLocalFiles(e.target.files)}
        />

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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Field label="Caption">
                    <RichTextEditor
                      value={post.caption}
                      onChange={(caption) => updateCaption(post.id, caption)}
                    />
                  </Field>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Gallery
                    </span>

                    <div className="flex items-center gap-3">
                      {/* <button
                        type="button"
                        onClick={() => {
                          uploadTargetRef.current = post.id;
                          fileInputRef.current?.click();
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900"
                      >
                        <Upload size={14} />
                        Upload from computer
                      </button> */}

                      <button
                        type="button"
                        onClick={() => setGalleryPostId(post.id)}
                        className="flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900"
                      >
                        <ImagePlus size={14} />
                        Add images
                      </button>
                    </div>
                  </div>

                  <div className="min-h-40 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-2">
                    {!post.gallery?.length ? (
                      <div className="flex h-36 items-center justify-center text-xs text-gray-400">
                        No images uploaded
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {post.gallery.map((image, imageIndex) => {
                          const imageUrl = galleryImageSrc(image);

                          return (
                            <div
                              key={`${image.url}-${imageIndex}`}
                              className="group relative"
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={
                                    image.alt ??
                                    image.name ??
                                    `Gallery image ${imageIndex + 1}`
                                  }
                                  className="aspect-square w-full rounded border border-gray-200 bg-white object-cover"
                                  onError={(event) => {
                                    console.error(
                                      "Image preview failed:",
                                      image.name
                                    );
                                    event.currentTarget.classList.add(
                                      "object-contain"
                                    );
                                  }}
                                />
                              ) : (
                                <div
                                  className="flex aspect-square w-full items-center justify-center rounded border border-gray-200 bg-white p-1 text-center text-[10px] text-gray-400"
                                  title="No image data stored. Remove and re-add this image."
                                >
                                  No preview
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  removeGalleryImage(post.id, imageIndex)
                                }
                                className="absolute right-1 top-1 hidden rounded-full bg-black/70 p-1 text-white hover:bg-red-600 group-hover:block"
                                title="Remove image"
                              >
                                <X size={10} />
                              </button>

                              {imageUrl && (
                                <div className="pointer-events-none absolute right-full top-0 z-30 mr-2 hidden w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-xl group-hover:block">
                                  <img
                                    src={imageUrl}
                                    alt={image.alt ?? image.name ?? ""}
                                    className="max-h-64 w-full object-contain"
                                  />

                                  {image.name && (
                                    <p className="mt-1 truncate text-xs text-gray-500">
                                      {image.name}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={
                      !post.gallery?.length || downloadingPostId === post.id
                    }
                    onClick={() => downloadImages(post)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-indigo-700 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {downloadingPostId === post.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}

                    {downloadingPostId === post.id
                      ? "Downloading…"
                      : "Download images"}
                  </button>
                </div>
              </div>
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

        <NamePopUp
          isOpen={isNameModalOpen}
          onClose={() => setIsNameModalOpen(false)}
          onAdd={handleAddPost}
          heading="Create Post Draft"
          fieldLabel="Post Title"
          placeholder="e.g. LinkedIn post title"
          buttonText="Create Draft"
        />

        <DocumentUploadModal
          isOpen={galleryPostId !== null}
          onClose={() => setGalleryPostId(null)}
          builderKey="posts-draft-data"
          onAdd={(docs) => {
            if (!galleryPostId) return;

            addGalleryImages(galleryPostId, docs);
            setGalleryPostId(null);
          }}
        />
      </div>
    </div>
  );
}
