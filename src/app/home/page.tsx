'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import NdaModal from '../components/NdaModal'
import { supabase } from '../lib/supabase'

type Idea = {
  id: string
  title: string
  tagline: string
  impact: string
  category: string
  status: string
  protected: boolean
}

const SEED: Idea[] = [
  {
    id: '1',
    title: 'CleanRide247',
    category: 'Mobility & Safety',
    status: 'Concept',
    tagline: 'Self-cleaning vehicle system',
    impact: 'Smart car hygiene tech',
    protected: false,
  },
  {
    id: '2',
    title: 'Viewviq Smart Mirror',
    category: 'Smart Security & Tech',
    status: 'Patent Pending',
    tagline: 'AI traffic mirror with DUI detection',
    impact: 'Reduces road deaths',
    protected: true,
  },
  {
    id: '3',
    title: 'StrongGeeBike',
    category: 'Mobility & Safety',
    status: 'Prototype',
    tagline: 'Heavy-duty hybrid bike',
    impact: 'Affordable load transport',
    protected: true,
  },
  {
    id: '4',
    title: 'EcoChairPress',
    category: 'Eco & Sustainability',
    status: 'Prototype',
    tagline: 'Recycles melted plastic into furniture',
    impact: 'Waste to wealth innovation',
    protected: false,
  },
]

const KEY = 'bui_ideas'

export default function Home() {
  // ✅ Hooks MUST always run every render
  const [search, setSearch] = useState('')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [cat, setCat] = useState('All')

  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState<string | null>(null)

  // NDA modal state
  const [ndaOpen, setNdaOpen] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<{ id: string; title: string } | null>(null)

  // ✅ Load ideas on mount (client only)
  useEffect(() => {
    let cancelled = false

    async function loadAll() {
      setLoading(true)
      setLoadErr(null)

      // 1) Local storage + SEED
      let extra: Idea[] = []
      try {
        const saved = localStorage.getItem(KEY)
        extra = saved ? JSON.parse(saved) : []
      } catch {
        extra = []
      }

      const localIdeas: Idea[] = [
        ...extra,
        ...SEED.filter((s) => !extra.find((e) => e.id === s.id)),
      ]

      // 2) Fetch confirmed ideas from Supabase
      const { data, error } = await supabase
        .from('ideas')
        .select('id,title,tagline,impact,category,status,protected,created_at')
        .ilike('status', 'confirmed')
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (error) {
        console.error('Homepage Supabase ideas fetch error:', error.message)
        setIdeas(localIdeas) // fallback
        setLoadErr('Could not load confirmed ideas. Showing local list only.')
        setLoading(false)
        return
      }

      const confirmedFromDb: Idea[] = (data ?? []).map((r: any) => ({
        id: String(r.id),
        title: r.title ?? '',
        tagline: r.tagline ?? '',
        impact: r.impact ?? '',
        category: r.category ?? 'General',
        status: r.status ?? 'confirmed',
        protected: r.protected ?? true,
      }))

      // 3) Merge (avoid duplicates by id)
      const merged: Idea[] = [
        ...confirmedFromDb,
        ...localIdeas.filter((l) => !confirmedFromDb.find((d) => d.id === l.id)),
      ]

      setIdeas(merged)
      setLoading(false)
    }

    loadAll()

    return () => {
      cancelled = true
    }
  }, [])

  // ✅ useMemo hooks run ALWAYS (no early return before them)
  const cats = useMemo(() => {
    return ['All', ...Array.from(new Set(ideas.map((i) => i.category)))]
  }, [ideas])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return ideas.filter((i) => {
      const matchesCat = cat === 'All' || i.category === cat
      const hay = (i.title + ' ' + (i.tagline || '') + ' ' + (i.impact || '')).toLowerCase()
      const matchesSearch = !q || hay.includes(q)
      return matchesCat && matchesSearch
    })
  }, [ideas, search, cat])

  return (
    <main
      className="
        min-h-screen
        px-6 py-12
        text-center text-white
        bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900
      "
    >
      <h1 className="text-4xl font-bold mb-3 text-emerald-400">Bank of Unique Ideas</h1>
      <p className="text-gray-400 max-w-xl mx-auto mb-10">
        A digital United Nations of inventions and innovations — where every mind counts.
      </p>

      {/* SEARCH + CATEGORY FILTER */}
      <div className="flex gap-2 justify-center items-center flex-wrap mb-6">
        <input
          type="text"
          placeholder="Search ideas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-md w-64 bg-neutral-800 text-white border border-neutral-700 focus:border-emerald-400 outline-none"
        />
        <div className="flex gap-2 flex-wrap">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-2 rounded-md text-xs border ${
                cat === c
                  ? 'border-white/40 bg-white/10'
                  : 'border-white/15 bg-white/5 text-white/80'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loadErr && <p className="mb-4 text-xs text-amber-300">{loadErr}</p>}

      {/* LOADING STATE */}
      {loading ? (
        <div className="grid place-items-center py-10">
          <p className="text-gray-400">Loading ideas…</p>
        </div>
      ) : (
        <>
          {/* IDEA CARDS */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
            {filtered.map((idea) => (
              <div
                key={idea.id}
                className="group relative p-6 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-emerald-400 transition text-left overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h2
                    className={`text-2xl font-semibold mb-2 text-emerald-300 ${
                      idea.protected ? 'blur-sm select-none pointer-events-none' : ''
                    }`}
                    title={idea.protected ? 'Title hidden — request NDA to view.' : undefined}
                  >
                    {idea.title}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 text-white/70">
                    {idea.category} • {idea.status}
                  </span>
                </div>

                <p
                  className={`text-gray-300 ${
                    idea.protected ? 'blur-sm select-none pointer-events-none' : ''
                  }`}
                  title={idea.protected ? 'Protected concept — request NDA to view details.' : undefined}
                >
                  {idea.tagline || '—'}
                </p>
                <p
                  className={`text-gray-500 text-sm mt-2 ${
                    idea.protected ? 'blur-sm select-none pointer-events-none' : ''
                  }`}
                  title={idea.protected ? 'Protected impact — available under NDA.' : undefined}
                >
                  {idea.impact || '—'}
                </p>

                {idea.protected && (
                  <div className="mt-4 text-[11px] text-white/60">
                    ▶ Hover on this card to read a high-level preview.
                  </div>
                )}

                {idea.protected && (
                  <div
                    className="pointer-events-none absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    aria-hidden
                  >
                    <div className="mx-4 max-w-sm rounded-xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur">
                      <p className="text-sm text-white/85">
                        <strong>High-level preview:</strong>{' '}
                        {(() => {
                          const byCat: Record<string, string> = {
                            'Smart Security & Tech':
                              'A safety/efficiency concept exploring intelligent detection and automation.',
                            'Eco & Sustainability':
                              'A greener approach aimed at reducing waste and improving resource use.',
                            'Home & Lifestyle':
                              'A comfort-focused concept designed to simplify everyday living.',
                            'Mobility & Safety':
                              'A movement/safety idea targeting safer, smoother transport experiences.',
                            General:
                              'An innovative concept addressing a clear problem with a practical, scalable path.',
                          }
                          return (
                            byCat[idea.category] ||
                            'An innovative concept with practical, scalable potential.'
                          )
                        })()}
                      </p>
                      <p className="mt-2 text-xs text-white/70">
                        Full brief available after NDA request.
                      </p>
                    </div>
                  </div>
                )}

                <div className="relative mt-4 flex items-center gap-6">
                  {idea.protected ? (
                    <div className="group/tt inline-block">
                      <span className="text-xs text-amber-300 cursor-pointer">
                        🔒 Confidential — NDA required
                      </span>
                      <div className="invisible group-hover/tt:visible absolute z-10 mt-2 w-64 rounded-md border border-white/15 bg-white/10 p-3 text-xs text-white/80 backdrop-blur">
                        This card is intentionally blurred to protect the inventor’s IP. Click
                        “Request NDA” to view the full brief.
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-white/60">Public preview</span>
                  )}

                  {idea.protected && (
                    <button
                      onClick={() => {
                        setSelectedIdea({ id: idea.id, title: idea.title })
                        setNdaOpen(true)
                      }}
                      className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-black hover:opacity-90"
                    >
                      Request NDA
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
<div className="mt-10 space-y-3 text-sm">
  <p className="text-white/70">
    <strong>Are you an investor?</strong>{' '}
    <Link href="/nda" className="underline text-emerald-300">
      Click here
    </Link>
  </p>

  <p className="text-white/70">
    <strong>Are you an inventor?</strong>{' '}
    <Link href="/my-ideas" className="underline text-emerald-300">
      Click here
    </Link>
    {' '}or{' '}
    <Link href="/signup" className="underline text-emerald-300">
      Sign up
    </Link>
  </p>

  <button
    onClick={async () => {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }}
    className="underline text-red-300"
  >
    Logout
  </button>
</div>
      {/* NDA MODAL */}
      {selectedIdea && (
        <NdaModal
          open={ndaOpen}
          onClose={() => setNdaOpen(false)}
          ideaId={selectedIdea.id}
          ideaTitle={selectedIdea.title}
        />
      )}
        </>
      )}
    </main>
  )
}