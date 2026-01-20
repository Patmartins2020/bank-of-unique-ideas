"use client";

import { useEffect, useMemo, useState } from "react";

type NDA = {
  id: string;
  status: "pending" | "signed" | "approved" | "rejected";
  signed_nda_path: string | null;
};

export default function NDAPage({ params }: { params: { id: string } }) {
  const requestId = params.id;

  const [nda, setNda] = useState<NDA | null>(null);
  const [templateUrl, setTemplateUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const canUpload = useMemo(() => {
    if (!nda) return false;
    if (nda.status === "rejected" || nda.status === "approved") return false;
    if (nda.status === "signed" || nda.signed_nda_path) return false;
    return true;
  }, [nda]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);

        const r1 = await fetch(`/api/nda/get?id=${encodeURIComponent(requestId)}`, {
          cache: "no-store",
        });
        const j1 = await r1.json();
        if (!r1.ok) throw new Error(j1?.error || "Invalid or expired NDA link.");

        const ndaRow: NDA = j1.nda;

        const r2 = await fetch(`/api/nda/template?requestId=${encodeURIComponent(requestId)}`, {
          cache: "no-store",
        });
        const j2 = await r2.json();
        if (!r2.ok) throw new Error(j2?.error || "Could not load NDA template link.");

        if (!alive) return;
        setNda(ndaRow);
        setTemplateUrl(j2.url || "");
        setMsg("");
      } catch (e: any) {
        if (!alive) return;
        setMsg(e?.message || "Something went wrong.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [requestId]);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    if (!canUpload) {
      setMsg("Upload is not allowed for this NDA state.");
      return;
    }

    if (!file) {
      setMsg("Please choose the signed file first.");
      return;
    }

    // Client-side validation (mirrors server)
    const maxBytes = 10 * 1024 * 1024;
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowed.includes(file.type)) {
      setMsg("Only PDF, PNG, or JPG files are allowed.");
      return;
    }
    if (file.size > maxBytes) {
      setMsg("File too large (max 10MB).");
      return;
    }

    try {
      setUploading(true);

      const form = new FormData();
      form.append("file", file);
      form.append("requestId", requestId);

      const res = await fetch("/api/nda/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.error || "Upload failed.");
        return;
      }

      setMsg("Signed NDA uploaded successfully. We will review it shortly.");

      // Refresh NDA state after upload
      const r1 = await fetch(`/api/nda/get?id=${encodeURIComponent(requestId)}`, {
        cache: "no-store",
      });
      const j1 = await r1.json();
      if (r1.ok) setNda(j1.nda);
    } catch (err: any) {
      setMsg(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p>Loading NDA request…</p>
      </main>
    );
  }

  if (!nda) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p>{msg || "Invalid or expired NDA link."}</p>
      </main>
    );
  }

  if (nda.status === "approved") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="w-full max-w-lg p-6 bg-slate-900 rounded-xl">
          <h1 className="text-xl mb-2">NDA Request</h1>
          <p>This NDA has already been approved.</p>
        </div>
      </main>
    );
  }

  if (nda.status === "rejected") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="w-full max-w-lg p-6 bg-slate-900 rounded-xl">
          <h1 className="text-xl mb-2">NDA Request</h1>
          <p>This NDA request was rejected.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-lg p-6 bg-slate-900 rounded-xl shadow">
        <h1 className="text-xl mb-4">NDA Request</h1>

        <div className="mb-4 text-sm opacity-90">
          Status:{" "}
          <span className="font-semibold">
            {nda.status === "pending" ? "Pending signature" : nda.status === "signed" ? "Signed (under review)" : nda.status}
          </span>
        </div>

        <a
          href={templateUrl || "#"}
          target="_blank"
          rel="noreferrer"
          className={`block mb-6 underline ${templateUrl ? "text-emerald-400" : "text-slate-500 pointer-events-none"}`}
        >
          Download NDA Template
        </a>

        {nda.status === "signed" || nda.signed_nda_path ? (
          <div className="p-3 rounded bg-slate-800 text-sm">
            Signed NDA already uploaded. Please wait for admin review/approval.
          </div>
        ) : (
          <form onSubmit={onUpload} className="space-y-3">
            <label className="block text-sm">
              Upload Signed NDA (PDF/PNG/JPG, max 10MB)
              <input
                type="file"
                className="mt-2 block w-full"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            <button
              type="submit"
              disabled={!canUpload || uploading}
              className="w-full py-2 rounded bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload Signed NDA"}
            </button>
          </form>
        )}

        {msg ? <p className="mt-4 text-sm">{msg}</p> : null}
      </div>
    </main>
  );
}