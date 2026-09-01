import { useState, useCallback } from "react";
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export type UploadStatus = "uploading" | "uploaded" | "duplicate" | "error";

export interface FileUploadResult {
    filename:string;
    status: UploadStatus;
    link?: string;
}

interface DigestDropZoneProps {
    onLinksReady?: (uploaded: FileUploadResult[]) => void;
}

function fileToBase64(file: File): Promise<string> {
return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});
}

export default function DigestDropZone({onLinksReady }: DigestDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [fileStatuses, setFileStatuses] = useState<FileUploadResult[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleFiles = useCallback(
        async (fileList: FileList) => {
            const files = Array.from(fileList);
            setIsUploading(true);
            setFileStatuses(files.map((f) =>({ filename: f.name, status: "uploading" as const})));

            try {
                const payload = await Promise.all(
                    files.map(async (file) => ({
                        filename: file.name,
                        contentType: file.type,
                        contentBytes: await fileToBase64(file),
                    }))
                );
                const res = await fetch("/api/dragAndDrop", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ files: payload }), 
                });

                const data = await res.json();
                const results: FileUploadResult[] = data.results ?? data;

                setFileStatuses(results);

                const duplicates = results.filter((r) => r.status === "duplicate");
                if (duplicates.length > 0) {
                    alert(`Already uploaded: ${duplicates.map((d) => d.filename).join(", ")}`);
                }
                const uploaded = results.filter((r) => r.status === "uploaded");
                if (uploaded.length > 0 && onLinksReady) {
                    onLinksReady(uploaded);
                }
            } catch (err) {
                console.error("Upload failed:", err);
                setFileStatuses(files.map((f) => ({ filename: f.name, status: "error" as const })));
            } finally {
                setIsUploading(false);
              }
            },
            [onLinksReady]
          );

          const handleDrop = (e: React.DragEvent<HTMLDivElemnts>) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          };

          const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) handleFiles(e.target.files);
          };

          return (
            //returning UI
            <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          >
            {!isUploading && fileStatuses.length === 0 && (
              <label htmlFor="digest-file-input" className="cursor-pointer text-gray-500">
                Drag files here, or click to browse
              </label>
            )}
      
            <input
              type="file"
              multiple
              className="hidden"
              id="digest-file-input"
              onChange={handleInputChange}
            />
      
            {fileStatuses.length > 0 && (
              <ul className="text-left space-y-1 mt-2">
                {fileStatuses.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
    {f.status === "uploading" && <Loader2 size={40} className="animate-spin text-indigo-600" />}
    {f.status === "uploaded" && <CheckCircle2 size={40} className="text-emerald-600" />}
    {f.status === "duplicate" && <AlertTriangle size={40} className="text-amber-600" />}
    {f.status === "error" && <XCircle size={40} className="text-red-600" />}
    <span>{f.filename}</span>
  </li>
                ))}
              </ul>
            )}
          </div>
          );
}
