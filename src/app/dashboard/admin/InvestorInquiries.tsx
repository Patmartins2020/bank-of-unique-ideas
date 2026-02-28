"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type InquiryRow = {
  id: string;
  idea_id: string;
  investor_id: string;
  investor_email: string | null;
  investor_name: string | null;
  message: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
  contacted_at: string | null;
  closed_at: string | null;
  // If FK relationship is detected by Supabase, this may appear:
  ideas?: { title: string | null; category: string | null } | null;
};

export default function InvestorInquiriesTable() {
  const supabase = createClientComponentClient();

  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const count = useMemo(() => rows.length, [rows]);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      // Try to pull idea title via relationship (if configured)
     const { data, error } = await supabase
  .from("investor_inquiries")
  .select(
    "id, idea_id, investor_id, investor_email, investor_name, message, status, created_at, contacted_at, closed_at"
  )
  .order("created_at", { ascending: false });

if (error) throw error;

setRows(data ?? []);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Failed to load investor inquiries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(id: string, status: "contacted" | "closed") {
    setErr(null);
    try {
      const patch: any = { status };

      if (status === "contacted") patch.contacted_at = new Date().toISOString();
      if (status === "closed") patch.closed_at = new Date().toISOString();

      const { error } = await supabase
        .from("investor_inquiries")
        .update(patch)
        .eq("id", id);

      if (error) throw error;

      // Refresh list
      await load();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Failed to update status.");
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-bold text-emerald-300">
            Investor Inquiries <span className="text-white/60">({count})</span>
          </h2>
          <p className="text-sm text-white/60">
            Messages sent from the investor contact page.
          </p>
        </div>

        <button
          onClick={load}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-white/70">Loading…</p>}

      {err && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-rose-200 mb-3">
          {err}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <p className="text-white/60">No inquiries yet.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="text-white/70">
              <tr className="border-b border-white/10">
                <th className="text-left py-2 pr-3">Date</th>
                <th className="text-left py-2 pr-3">Investor</th>
                <th className="text-left py-2 pr-3">Idea</th>
                <th className="text-left py-2 pr-3">Status</th>
                <th className="text-left py-2 pr-3">Message</th>
                <th className="text-left py-2 pr-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const title = r.ideas?.title || "View idea";
                const category = r.ideas?.category || "";
                const email = r.investor_email || "";
                const name = r.investor_name || "";

                return (
                  <tr key={r.id} className="border-b border-white/5 align-top">
                    <td className="py-3 pr-3 text-white/70">
                      {new Date(r.created_at).toLocaleString()}
                    </td>

                    <td className="py-3 pr-3">
                      <div className="font-semibold">{name || "—"}</div>
                      <div className="text-white/70">{email || "—"}</div>
                    </td>

                    <td className="py-3 pr-3">
                      <div className="font-semibold">{title}</div>
                      <div className="text-emerald-300/80 text-xs">{category}</div>
                      <div className="text-white/50 text-xs font-mono mt-1">
                        {r.idea_id}
                      </div>
                      <div className="mt-2">
                        <Link
                          className="text-xs underline text-white/70 hover:text-white"
                          href={`/investor/ideas/${r.idea_id}`}
                        >
                          Open idea page
                        </Link>
                      </div>
                    </td>

                    <td className="py-3 pr-3">
                      <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs">
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3 pr-3 text-white/80 max-w-[420px]">
                      {r.message}
                    </td>

                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => updateStatus(r.id, "contacted")}
                          className="rounded-lg bg-sky-400 px-3 py-2 text-xs font-semibold text-black hover:bg-sky-300"
                        >
                          Mark contacted
                        </button>

                        <button
                          onClick={() => updateStatus(r.id, "closed")}
                          className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-black hover:bg-emerald-300"
                        >
                          Close
                        </button>

                        {email && (
                          <a
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                            href={`mailto:${email}?subject=${encodeURIComponent(
                              "Following up on your inquiry"
                            )}`}
                          >
                            Email investor
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}