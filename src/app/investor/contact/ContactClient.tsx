"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type IdeaMini = {
  id: string;
  title: string | null;
  category: string | null;
};

type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
};

export default function ContactClient() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const sp = useSearchParams();

  const ideaId = (sp.get("ideaId") || "").trim();

  const ADMIN_EMAIL = useMemo(() => {
    // Client-safe env var (NEXT_PUBLIC_*)
    return (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "patmartinsbest@gmail.com").trim();
  }, []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [idea, setIdea] = useState<IdeaMini | null>(null);

  const [investorName, setInvestorName] = useState("");
  const [investorEmail, setInvestorEmail] = useState("");

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      setToast(null);

      try {
        // Must be logged in
        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;

        const user = auth.user;
        if (!user) {
          router.replace("/login");
          return;
        }

        // Must be investor
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("id, role, full_name")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>();

        if (profErr) throw profErr;

        const role = (prof?.role ?? (user.user_metadata as any)?.role ?? "investor") as string;
        if (role !== "investor") {
          router.replace("/");
          return;
        }

        const name = prof?.full_name || (user.user_metadata as any)?.full_name || "";
        const email = user.email || "";

        if (!cancelled) {
          setInvestorName(name);
          setInvestorEmail(email);
        }

        if (!ideaId) {
          if (!cancelled) setErr("Missing ideaId. Please open this page from an idea card.");
          return;
        }

        // Load minimal idea info (safe fields)
        const { data: ideaRow, error: ideaErr } = await supabase
          .from("ideas")
          .select("id, title, category")
          .eq("id", ideaId)
          .maybeSingle<IdeaMini>();

        if (ideaErr) throw ideaErr;
        if (!ideaRow) {
          if (!cancelled) setErr("Idea not found.");
          return;
        }

        if (!cancelled) setIdea(ideaRow);
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setErr(e?.message || "Failed to load contact page.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, router, ideaId]);

  async function handleSend() {
    if (sending) return;

    setErr(null);
    setToast(null);

    if (!ideaId) {
      setErr("Missing ideaId.");
      return;
    }
    if (!message.trim()) {
      setErr("Please type a short message.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/investor/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId,
          investorEmail,
          investorName,
          message: message.trim(),
        }),
      });

      // If endpoint not created yet, fallback to mailto
      if (res.status === 404) {
        throw new Error("NO_API");
      }

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setErr(data?.error || "Failed to send message.");
        return;
      }

      setMessage("");
      setToast("✅ Message sent. Admin will contact you via email soon.");
    } catch (e: any) {
      if (e?.message === "NO_API") {
        const subject = encodeURIComponent("Request Full Brief / Start Discussion");
        const body = encodeURIComponent(
          `Hello Admin,\n\nI am interested in discussing this idea.\n\nIdea ID: ${ideaId}\nIdea Title: ${
            idea?.title || "—"
          }\nInvestor: ${investorName || "—"}\nEmail: ${investorEmail || "—"}\n\nMessage:\n${message.trim()}\n`
        );
        window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
        return;
      }

      console.error(e);
      setErr(e?.message || "Unexpected error sending message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-emerald-300">
              Request Full Brief / Start Discussion
            </h1>
            <p className="text-white/70 mt-1">
              Send a message to the admin. You will be contacted via email.
            </p>
          </div>

          <Link
            href="/investor/ideas"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Back
          </Link>
        </div>

        {loading && <p className="text-white/70">Loading…</p>}

        {toast && (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">
            {toast}
          </div>
        )}

        {err && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
            {err}
          </div>
        )}

        {!loading && idea && (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <p className="text-xs text-white/60">Idea</p>
            <p className="text-lg font-semibold">{idea.title || "Untitled idea"}</p>
            <p className="text-sm text-emerald-300">{idea.category || "General"}</p>
            <p className="text-xs text-white/50 mt-2 font-mono">ID: {idea.id}</p>
          </div>
        )}

        {!loading && (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Your name</label>
              <input
                value={investorName}
                onChange={(e) => setInvestorName(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Your email</label>
              <input
                value={investorEmail}
                onChange={(e) => setInvestorEmail(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="you@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="Briefly tell the admin what you want to discuss..."
              />
              <p className="text-xs text-white/50 mt-2">
                Tip: include what you want next (call, brief, licensing terms, partnership, etc).
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSend}
                disabled={sending}
                className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send to Admin"}
              </button>

              <a
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                href={`mailto:${ADMIN_EMAIL}`}
              >
                Email Admin Directly
              </a>
            </div>

            <p className="text-xs text-white/50">
              Note: If the “Investor Inquiries” API is not yet created, the Send button will open your email app (safe fallback).
            </p>
          </div>
        )}
      </div>
    </main>
  );
}