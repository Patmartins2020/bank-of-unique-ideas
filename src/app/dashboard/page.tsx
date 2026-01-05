// src/app/dashboard/page.tsx
'use client';

import Dashboard from './Dashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black text-white">
      <main className="max-w-6xl mx-auto px-4 pt-8 pb-20 overflow-y-auto">
        {/* ⬇️ IMPORTANT: put your REAL admin email here */}
        <Dashboard adminEmail="patmartinsbest@gmail.com" />
      </main>
    </div>
  );
}