"use client";

import { useEffect, useMemo, useState } from "react";

type NdaStatus = "requested" | "signed" | "approved" | "rejected" | string;

type NdaResponse = {
  nda: {
    id: string;
    status: NdaStatus | null;
    investorEmail: string | null;
    signed_nda_path: string | null;
    created_at: string | null;
    unblur_until: string | null;
  };
  error?: string;
};

export default function NdaPage({ params }: { params: { id: string } }) {
  const requestId = params.id;

  const [loading, setLoading] = useState(true);
  const [nda, setNda] = useState<NdaResponse["nda"] | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  // Public template link (bucket must be public for this file)
  // You said you will store it as: templates/NDA.pdf
  // inside a bucket (example bucket name: nda_files)
  const templateUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Change these 2 if your bucket/path differ:
    const bucket = "nda_files";
    const path = "templates/NDA.pdf";
    return base ? `${base}/storage/v1/object/public/${bucket}/${path}` : "#";
  }, []);

  async function fetchNda() {
    setLoading(true);
    try {
      const res = await fetch(`/api/nda/get?id=${encodeURIComponent(requestId)}`);
      const data = (await res.json()) as Partial<NdaResponse>;

      if (!res.ok) {
        setNda(null);
        setStatus("error");
        setMessage(data?.error || "Invalid or expired NDA link.");
        return;
      }

      setNda(data.nda ?? null);
      setStatus("idle");
      setMessage("");
    } catch (e: any) {
      setNda(null);
      setStatus("error");
      setMessage(e?.message || "Failed to load NDA request.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setStatus("error");
      setMessage("Please choose your signed NDA file (PDF preferred).");
      return;
    }

    // Client-side validation (simple)
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setStatus("error");
      setMessage("File is too large. Max size is 10MB.");
      return;
    }

    setStatus("loading");
    setMessage("Uploading your signed NDA…");

    try {
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
      setMessage("Upload received. Please wait while our admin reviews it.");

      // Refresh NDA status so page changes immediately
      await fetchNda();
    } catch (e: any) {
      setStatus("error");
      setMessage(e?.message || "Upload failed.");
    }
  }

  const ndaStatus: NdaStatus = (nda?.status ?? "requested") as NdaStatus;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg">
        <h1 className="text-2xl font-semibold mb-2">NDA Portal</h1>
        <p className="text-sm text-white/70 mb-6">
          Please download the NDA, sign it, and upload the signed copy here.
        </p>

        {loading && <p className="text-white/70">Loading…</p>}

        {!loading && !nda && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
            {message || "Invalid or expired NDA link."}
          </div>
        )}

        {!loading && nda && (
          <div className="space-y-4">
            {/* Calm status banner */}
            {ndaStatus === "rejected" && (
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
                This NDA request was rejected. If you believe this is a mistake, please contact support.
              </div>
            )}

            {ndaStatus === "approved" && (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">
                Your NDA has been approved. You will receive the access link shortly (or it may already be in your email).
              </div>
            )}

            {ndaStatus === "signed" && (
              <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-4 text-sky-200">
                We have received your signed NDA. Please wait while an admin reviews it.
              </div>
            )}

            {(ndaStatus === "requested" || ndaStatus === null || ndaStatus === "") && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-white/80">
                Status: <span className="font-semibold">Awaiting your signed NDA</span>
              </div>
            )}

            {/* Download always available (simple) */}
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/80 mb-3">
                1) Download the NDA template:
              </p>
              <a
                href={templateUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
              >
                Download NDA (PDF)
              </a>

              <p className="mt-3 text-xs text-white/50">
                If this download does not open, it means the template file is not public or not in the right bucket/path.
              </p>
            </div>

            {/* Upload only allowed when not rejected/approved */}
            {ndaStatus !== "rejected" && ndaStatus !== "approved" && (
              <form onSubmit={handleUpload} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
                <p className="text-sm text-white/80">
                  2) Upload your signed NDA:
                </p>

                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  className="block w-full text-sm"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full rounded-lg bg-white/90 px-4 py-2 text-sm font-semibold text-black hover:bg-white disabled:opacity-60"
                >
                  {status === "loading" ? "Uploading…" : "Upload Signed NDA"}
                </button>

                {status !== "idle" && message && (
                  <p className={`text-sm ${status === "error" ? "text-rose-300" : "text-emerald-300"}`}>
                    {message}
                  </p>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}