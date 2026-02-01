"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function NdaAccessPage() {
  const params = useParams();
  const router = useRouter();

  const ndaId = typeof params?.ndaId === "string" ? params.ndaId : "";

  const [msg, setMsg] = useState("Validating your NDA access...");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        if (!ndaId) {
          setMsg("Invalid NDA ID.");
          return;
        }

        const res = await fetch(`/api/nda/access?ndaId=${encodeURIComponent(ndaId)}`);
        const data = await res.json();

        if (!alive) return;

        if (!res.ok) {
          setMsg(data?.error || "Access denied.");
          return;
        }

        if (!data?.redirectTo) {
          setMsg("No redirect target returned.");
          return;
        }

        router.replace(data.redirectTo);
      } catch (e: any) {
        if (!alive) return;
        setMsg(e?.message || "Network error validating NDA.");
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [ndaId, router]);

  return (
    <main className="min-h-screen bg-[#020617] text-white px-6 pt-24 pb-10">
      <div className="max-w-xl mx-auto space-y-3">
        <h1 className="text-2xl font-extrabold text-emerald-300">NDA Access</h1>
        <p className="text-white/80">{msg}</p>
      </div>
    </main>
  );
}