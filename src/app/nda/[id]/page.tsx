"use client";

import { useState } from "react";

export default function NdaForm({ params }: { params: { id: string } }) {
  const requestId = params.id;

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle"|"loading"|"error"|"success">("idle");
  const [message, setMessage] = useState("");

  async function uploadSignedNDA(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setStatus("error");
      setMessage("Please upload the signed NDA file.");
      return;
    }

    setStatus("loading");
    setMessage("Uploading NDA...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("requestId", requestId);

    const res = await fetch("/api/nda/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(data.error || "Upload failed.");
      return;
    }

    setStatus("success");
    setMessage("NDA uploaded successfully.");
  }

  async function approveNDA() {
    setStatus("loading");
    setMessage("Sending NDA approval email...");

    const res = await fetch("/api/nda/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ndaId: requestId
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      setStatus("error");
      setMessage(data.error || "Could not send approval email.");
      return;
    }

    setStatus("success");
    setMessage("NDA approval email sent successfully.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-lg p-6 bg-slate-900 rounded-xl shadow">
        <h1 className="text-xl mb-3">NDA Request: {requestId}</h1>

        <form onSubmit={uploadSignedNDA} className="space-y-3">
          <label className="block text-sm">
            Upload Signed NDA
            <input
              type="file"
              className="mt-1 block w-full"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-2 rounded bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60"
          >
            {status === "loading" ? "Uploading..." : "Upload NDA"}
          </button>
        </form>

        <hr className="my-4 opacity-40" />

        <button
          onClick={approveNDA}
          disabled={status === "loading"}
          className="w-full py-2 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-60"
        >
          {status === "loading" ? "Processing..." : "Approve & Send NDA Link"}
        </button>

        {status !== "idle" && (
          <p className={`mt-3 text-sm ${status === "error" ? "text-red-400" : "text-emerald-400"}`}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
}