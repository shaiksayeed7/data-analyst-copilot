"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, Loader2 } from "lucide-react";
import { uploadFile, UploadResponse } from "@/lib/api";

interface Props {
  onUpload: (data: UploadResponse) => void;
}

export default function FileUpload({ onUpload }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;
      const file = accepted[0];
      setLoading(true);
      setError(null);
      try {
        const result = await uploadFile(file);
        onUpload(result);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Upload failed. Please try again.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Data Analyst Copilot</h1>
        <p className="text-slate-400 text-sm">
          Upload a CSV or Excel file to start analysing your data with AI
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`w-full max-w-md border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? "border-blue-500 bg-blue-500/10" : "border-slate-600 hover:border-blue-500 hover:bg-slate-800/60"}
          ${loading ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-slate-300 text-sm">Analysing your data…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <UploadCloud
              className={`w-12 h-12 ${isDragActive ? "text-blue-400" : "text-slate-500"}`}
            />
            <p className="text-slate-300 font-medium">
              {isDragActive ? "Drop your file here" : "Drag & drop your file here"}
            </p>
            <p className="text-slate-500 text-xs">or click to browse</p>
            <div className="flex gap-2 mt-2">
              {[".csv", ".xlsx", ".xls"].map((ext) => (
                <span
                  key={ext}
                  className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded-full"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="w-full max-w-md bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm flex items-start gap-2">
          <FileText className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <p className="text-slate-600 text-xs">
        Your data is processed in memory and never stored permanently.
      </p>
    </div>
  );
}
