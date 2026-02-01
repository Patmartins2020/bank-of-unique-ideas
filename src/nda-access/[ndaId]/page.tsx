"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

function pickParam(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

export default function NdaAccessPage() {
  const params = useParams();
  const router = useRouter();

  const ndaId = useMemo(() => {
    const raw =
      pickParam((params as any)?.ndaId) ||
      pickParam((params as any)?.id);
    return String(raw || "").trim();
  }, [params]);

  const [msg, setMsg] = useState("Validating your NDA access...");

  useEffect(() => {
    let alive = true;

    async function run(validId: string) {
      try {
        const res = await fetch(
          `/api/nda/access?ndaId=${encodeURIComponent(validId)}`,
          { cache: "no-store" }
        );

        const data = await res.json().catch(() => ({} as any));

        if (!alive) return;

        if (!res.ok) {
          setMsg(data?.error || "Access denied.");
          return;
        }

        const redirectTo = data?.redirectTo;

        if (typeof redirectTo !== "string" || !redirectTo) {
          setMsg("No redirect target returned.");
          return;
        }

        router.replace(redirectTo);
      } catch (e: any) {
        if (!alive) return;
        setMsg(e?.message || "Network error validating NDA.");
      }
    }

    if (!ndaId) {
      setMsg("Missing NDA ID.");
      return () => {
        alive = false;
      };
    }

    run(ndaId);

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