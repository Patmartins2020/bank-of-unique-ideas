'use client';

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white">
      {/* Page shell */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8">

        {/* Top header */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-5 sm:p-6 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-300 tracking-tight">
            Admin Console
          </h1>
          <p className="mt-1 text-white/70">
            Welcome, Admin. Here you can manage submitted ideas, users, and NDA requests.
          </p>
        </div>

        {/* Quick overview / sections */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white/90">Pending Ideas</h2>
            <p className="mt-1 text-sm text-white/60">
              Review, approve, or reject new submissions.
            </p>
            <div className="mt-4 h-24 rounded-lg border border-white/10 bg-black/20" />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white/90">NDA Requests</h2>
            <p className="mt-1 text-sm text-white/60">
              Handle investor NDA requests and grant access.
            </p>
            <div className="mt-4 h-24 rounded-lg border border-white/10 bg-black/20" />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white/90">System Activity</h2>
            <p className="mt-1 text-sm text-white/60">
              Recent actions and helpful metrics.
            </p>
            <div className="mt-4 h-24 rounded-lg border border-white/10 bg-black/20" />
          </div>
        </div>

        {/* Placeholder for your existing lists/tables/cards */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-lg font-semibold text-white/90">Ideas</h3>
          <p className="mt-1 text-sm text-white/60">
            Your existing idea list/table/cards can go here.
          </p>
          <div className="mt-4 h-40 rounded-lg border border-white/10 bg-black/20" />
        </div>
      </section>
    </main>
  );
}