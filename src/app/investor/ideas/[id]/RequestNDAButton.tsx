"use client";

import { useState } from "react";

export default function RequestNDAButton({ ideaId }: { ideaId: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleRequest() {
    if (!ideaId) return;

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/nda/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("NDA request failed:", data);
        setMsg(data?.error || "Request failed");
        return;
      }

      // success
      setMsg("Request sent successfully.");

      // For DEV: show link returned by server (since email may not be configured yet)
      if (data?.accessLink) {
        console.log("NDA access link:", data.accessLink);
      }
    } catch (err: any) {
      console.error(err);
      setMsg(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleRequest}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Requesting..." : "Request NDA"}
      </button>

      {msg && <p className="text-sm text-white/80">{msg}</p>}
    </div>
  );
}