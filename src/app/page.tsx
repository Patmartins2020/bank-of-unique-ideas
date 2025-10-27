'use client'
import { useState } from 'react'

interface Idea {
  id: number
  title: string
  tagline: string
  impact: string
  protected: boolean
}

export default function Home() {
  const [search, setSearch] = useState('')

  const ideas: Idea[] = [
    { id: 1, title: 'CleanRide247', tagline: 'Self-cleaning vehicle system', impact: 'Smart car hygiene tech', protected: false },
    { id: 2, title: 'Viewviq Smart Mirror', tagline: 'AI traffic mirror with DUI detection', impact: 'Reduces road deaths', protected: true },
    { id: 3, title: 'StrongGeeBike', tagline: 'Heavy-duty hybrid bike', impact: 'Affordable load transport', protected: true },
    { id: 4, title: 'EcoChairPress', tagline: 'Recycles melted plastic into furniture', impact: 'Waste to wealth innovation', protected: false },
  ]

  const filtered = ideas.filter((i) =>
    i.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen px-6 py-12 text-center">
      <h1 className="text-4xl font-bold mb-6 text-emerald-400">Bank of Unique Ideas</h1>
      <p className="text-gray-400 max-w-xl mx-auto mb-10">
        A digital United Nations of inventions and innovations — where every mind counts.
      </p>

      <input
        type="text"
        placeholder="Search ideas..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-4 py-2 rounded-md w-64 bg-neutral-800 text-white border border-neutral-700 focus:border-emerald-400 outline-none mb-8"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
        {filtered.map((idea) => (
          <div
            key={idea.id}
            className="p-6 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-emerald-400 transition"
          >
            <h2 className="text-2xl font-semibold mb-2 text-emerald-300">{idea.title}</h2>
            <p className={`text-gray-400 ${idea.protected ? 'blur-sm select-none' : ''}`}>
              {idea.tagline}
            </p>
            <p className={`text-gray-500 text-sm mt-2 ${idea.protected ? 'blur-sm select-none' : ''}`}>
              {idea.impact}
            </p>
            {idea.protected && (
              <p className="text-xs mt-3 text-amber-400 italic">Protected by inventor’s confidentiality</p>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}

