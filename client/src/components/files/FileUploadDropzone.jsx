import { useCallback, useRef, useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import toast from "react-hot-toast";
import { fileService } from "../../services/fileService.js";

const FileUploadDropzone = ({ workspaceId, category = "general", onUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(null);
  const inputRef = useRef(null);

  const handleUpload = async (fileList) => {
    if (!fileList?.length) return;
    const formData = new FormData();
    Array.from(fileList).forEach((f) => formData.append("files", f));
    formData.append("category", category);

    try {
      setProgress(0);
      const { data } = await fileService.upload(workspaceId, formData, (evt) => {
        setProgress(Math.round((evt.loaded / evt.total) * 100));
      });
      toast.success(`${data.files.length} file(s) uploaded`);
      onUploaded?.(data.files);
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setProgress(null);
    }
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleUpload(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceId, category]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-slate-300 dark:border-slate-600"
      }`}
    >
      <FiUploadCloud className="mx-auto text-3xl text-primary mb-2" />
      <p className="text-sm font-medium">Drag & drop files here, or click to browse</p>
      <p className="text-xs text-secondary mt-1">Images, PDFs, documents, up to 25MB each</p>

      {progress !== null && (
        <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => handleUpload(e.target.files)}
      />
    </div>
  );
};

export default FileUploadDropzone;
