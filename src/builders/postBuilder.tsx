import { useEffect, useState } from "react";
import {
  Trash2,
  Plus,
  Loader2,
  Save,
  Download,
  ImagePlus,
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

function getDateTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function galleryImageSrc(image: GalleryImage): string {
  const content = image.contentBytes?.trim();

  if (!content) return "";

  if (content.startsWith("data:image/")) {
    return content;
  }

  if (/^https?:\/\//i.test(content)) {
    throw new Error("contentBytes contains a URL instead of Base64 data.");
  }

  const extension = image.name?.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    bmp: "image/bmp",
    svg: "image/svg+xml",
  };

  const mimeType = mimeTypes[extension ?? ""] ?? "image/png";

  return `data:${mimeType};base64,${content}`;
}

export default function PostBuilder() {
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [galleryPostId, setGalleryPostId] = useState<string | null>(
    null
  );
  const [downloadingPostId, setDownloadingPostId] = useState<
    string | null
  >(null);

  const addGalleryImages = (
    postId: string,
    docs: {  label: string;
      url: string;
      contentBytes?: string; }[]
  ) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              gallery: [
                ...(post.gallery ?? []),
                ...docs.map((doc) => ({
                  name: doc.label,
                  alt: doc.label,
                  url: doc.url,
                  contentBytes: doc.contentBytes
                })),
              ],
            }
          : post
      )
    );
  };


  const removeGalleryImage = (
    postId: string,
    imageUrl: string
  ) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              gallery: (post.gallery ?? []).filter(
                (image) => image.url !== imageUrl
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
  
      for (let index = 0; index < post.gallery.length; index++) {
        const image = post.gallery[index];
        const source = galleryImageSrc(image);
  
        if (!source) {
          throw new Error(
            `${image.name ?? `Image ${index + 1}`} has no image data. ` +
            "Please remove it and upload it again."
          );
        }
  
        const response = await fetch(source);
  
        if (!response.ok) {
          throw new Error(`Could not read ${image.name ?? "image"}.`);
        }
  
        const blob = await response.blob();
  
        if (!blob.type.startsWith("image/")) {
          throw new Error(`${image.name ?? "File"} is not image content.`);
        }
  
        const filename = (
          image.name || `image-${index + 1}.png`
        ).replace(/[\\/:*?"<>|]/g, "_");
  
        // Prefix prevents files with identical names overwriting each other.
        zip.file(`${index + 1}-${filename}`, blob);
      }
  
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
  
      const title = (post.title || "gallery").replace(/[\\/:*?"<>|]/g, "_");
  
      link.href = blobUrl;
      link.download = `${title}-gallery.zip`;
  
      document.body.appendChild(link);
      link.click();
      link.remove();
  
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
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
        const res = await fetch(
          "/api/load-digest?key=posts-draft-data"
        );

        if (res.ok) {
          const data = await res.json();

          if (Array.isArray(data?.posts)) {
            setPosts(
              data.posts.map((post: Post) => ({
                ...post,
                gallery: Array.isArray(post.gallery)
                  ? post.gallery
                  : [],
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
        const res = await fetch(
          "/api/save-digest?key=posts-draft-data",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ posts }),
          }
        );

        if (res.ok) {
          setSaveStatus(`Saved at ${getDateTime()}`);
        } else {
          setSaveStatus("error");
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
      {
        id: uid(),
        title: title.trim(),
        caption: "",
        gallery: [],
      },
    ]);
  };

  const updateCaption = (
    postId: string,
    caption: string
  ) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              caption,
            }
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
                      onChange={(caption) =>
                        updateCaption(post.id, caption)
                      }
                    />
                  </Field>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Gallery
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setGalleryPostId(post.id)
                      }
                      className="flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900"
                    >
                      <ImagePlus size={14} />
                      Add images
                    </button>
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
                                    imageUrl
                                  );

                                  event.currentTarget.classList.add(
                                    "object-contain"
                                  );
                                }}
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  removeGalleryImage(
                                    post.id,
                                    image.url
                                  )
                                }
                                className="absolute right-1 top-1 hidden rounded-full bg-black/70 p-1 text-white hover:bg-red-600 group-hover:block"
                                title="Remove image"
                              >
                                <X size={10} />
                              </button>

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
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={
                      !post.gallery?.length ||
                      downloadingPostId === post.id
                    }
                    onClick={() => downloadImages(post)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-indigo-700 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {downloadingPostId === post.id ? (
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
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
