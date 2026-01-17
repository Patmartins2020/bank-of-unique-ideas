// src/app/nda/[id]/NdaUploadForm.tsx
"use client";

import { useMemo, useState } from "react";

type NdaStatus = "pending" | "signed" | "approved" | "rejected";

export default function NdaUploadForm({
  requestId,
  currentStatus,
  alreadyUploaded,
}: {
  requestId: string;
  currentStatus: NdaStatus;
  alreadyUploaded: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  const disabledReason = useMemo(() => {
    if (currentStatus === "approved") return "Already approved.";
    if (currentStatus === "rejected") return "Rejected.";
    if (alreadyUploaded || currentStatus === "signed") return "Signed NDA already uploaded.";
    return null;
  }, [currentStatus, alreadyUploaded]);

  async function uploadSignedNDA(e: React.FormEvent) {
    e.preventDefault();

    if (disabledReason) {
      setStatus("error");
      setMessage(disabledReason);
      return;
    }

    if (!file) {
      setStatus("error");
      setMessage("Please choose the signed NDA file.");
      return;
    }

    // CLIENT-SIDE VALIDATION
    const maxBytes = 10 * 1024 * 1024; // 10MB
    const allowed = ["application/pdf", "image/png", "image/jpeg"];

    if (!allowed.includes(file.type)) {
      setStatus("error");
      setMessage("Only PDF, PNG, or JPG files are allowed.");
      return;
    }
    if (file.size > maxBytes) {
      setStatus("error");
      setMessage("File is too large. Max size is 10MB.");
      return;
    }

    setStatus("loading");
    setMessage("Uploading signed NDA...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("requestId", requestId);

    const res = await fetch("/api/nda/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus("error");
      setMessage(data?.error || "Upload failed.");
      return;
    }

    setStatus("success");
    setMessage("Upload successful. Our team will review and approve.");
    setFile(null);
  }

  return (
    <div className="p-4 rounded bg-slate-800 border border-slate-700">
      <h2 className="text-sm font-semibold">Upload Signed NDA</h2>

      {disabledReason ? (
        <p className="mt-2 text-sm text-slate-300">{disabledReason}</p>
      ) : (
        <form onSubmit={uploadSignedNDA} className="mt-3 space-y-3">
          <input
            type="file"
            className="block w-full text-sm"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-2 rounded bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60"
          >
            {status === "loading" ? "Uploading..." : "Upload Signed NDA"}
          </button>
        </form>
      )}

      {status !== "idle" && (
        <p className={`mt-3 text-sm ${status === "error" ? "text-red-300" : "text-emerald-300"}`}>
          {message}
        </p>
      )}
    </div>
  );
}