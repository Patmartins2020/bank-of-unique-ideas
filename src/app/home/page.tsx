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

export default function Home() {
  // UI state
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')

  // Data state
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState<string | null>(null)

  // Auth/access state
  const [userId, setUserId] = useState<string | null>(null)
  const [accessSet, setAccessSet] = useState<Set<string>>(new Set())

  // NDA modal state
  const [ndaOpen, setNdaOpen] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadAll() {
      setLoading(true)
      setLoadErr(null)

      try {
        // 1) Get logged-in user (if any)
        const { data: authData, error: authErr } = await supabase.auth.getUser()
        if (authErr) console.warn('auth.getUser error:', authErr.message)

        const uid = authData?.user?.id ?? null
        if (!cancelled) setUserId(uid)

        // 2) Fetch confirmed ideas from Supabase
        const { data: ideasData, error: ideasErr } = await supabase
          .from('ideas')
          .select('id,title,tagline,impact,category,status,protected,created_at')
          .ilike('status', 'confirmed')
          .order('created_at', { ascending: false })

        if (ideasErr) throw ideasErr

        const confirmedIdeas: Idea[] = (ideasData ?? []).map((r: any) => ({
          id: String(r.id),
          title: r.title ?? '',
          tagline: r.tagline ?? '',
          impact: r.impact ?? '',
          category: r.category ?? 'General',
          status: r.status ?? 'confirmed',
          protected: r.protected ?? true,
        }))

        // 3) Fetch access rows for investor (only if logged in)
        let s = new Set<string>()
        if (uid) {
          const nowIso = new Date().toISOString()

          // NOTE: this assumes idea_access has:
          // - investor_id uuid
          // - idea_id uuid
          // - status text ('active')
          // - expires_at timestamptz (nullable)
          const { data: accessData, error: accessErr } = await supabase
            .from('idea_access')
            .select('idea_id, status, expires_at')
            .eq('investor_id', uid)
            .eq('status', 'active')
            .or(`expires_at.is.null,expires_at.gt.${nowIso}`)

          if (accessErr) {
            console.error('idea_access fetch error:', accessErr.message)
          } else {
            s = new Set((accessData ?? []).map((a: any) => String(a.idea_id)))
          }
        }

        if (cancelled) return

        setIdeas(confirmedIdeas)
        setAccessSet(s)
      } catch (e: any) {
        console.error('Homepage load error:', e?.message || e)
        if (!cancelled) {
          setIdeas([])
          setAccessSet(new Set())
          setLoadErr(e?.message || 'Failed to load ideas.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAll()

    return () => {
      cancelled = true
    }
  }, [])

  // Categories (always computed)
  const cats = useMemo(() => {
    return ['All', ...Array.from(new Set(ideas.map((i) => i.category))).filter(Boolean)]
  }, [ideas])

  // Filtered ideas
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return ideas.filter((i) => {
      const matchesCat = cat === 'All' || i.category === cat
      const hay = `${i.title} ${i.tagline || ''} ${i.impact || ''}`.toLowerCase()
      const matchesSearch = !q || hay.includes(q)
      return matchesCat && matchesSearch
    })
  }, [ideas, search, cat])

  // Helper: should this idea be blurred?
  const isBlurred = (idea: Idea) => {
    // blur only if idea is protected AND user doesn't have access
    if (!idea.protected) return false
    return !accessSet.has(String(idea.id))
  }

  return (
    <main className="min-h-screen px-6 py-12 text-center text-white bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900">
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
                cat === c ? 'border-white/40 bg-white/10' : 'border-white/15 bg-white/5 text-white/80'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loadErr && <p className="mb-4 text-xs text-amber-300">{loadErr}</p>}

      {/* LOADING */}
      {loading ? (
        <div className="grid place-items-center py-10">
          <p className="text-gray-400">Loading ideas…</p>
        </div>
      ) : (
        <>
          {/* IDEA CARDS */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
            {filtered.map((idea) => {
              const blurred = isBlurred(idea)

              return (
                <div
                  key={idea.id}
                  className="group relative p-6 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-emerald-400 transition text-left overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <h2
                      className={`text-2xl font-semibold mb-2 text-emerald-300 ${
                        blurred ? 'blur-sm select-none pointer-events-none' : ''
                      }`}
                      title={blurred ? 'Title hidden — request NDA to view.' : undefined}
                    >
                      {idea.title}
                    </h2>

                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 text-white/70">
                      {idea.category} • {idea.status}
                    </span>
                  </div>

                  <p
                    className={`text-gray-300 ${blurred ? 'blur-sm select-none pointer-events-none' : ''}`}
                    title={blurred ? 'Protected concept — request NDA to view details.' : undefined}
                  >
                    {idea.tagline || '—'}
                  </p>

                  <p
                    className={`text-gray-500 text-sm mt-2 ${blurred ? 'blur-sm select-none pointer-events-none' : ''}`}
                    title={blurred ? 'Protected impact — available under NDA.' : undefined}
                  >
                    {idea.impact || '—'}
                  </p>

                  {/* If user HAS access, show a small badge */}
                  {idea.protected && !blurred && (
                    <div className="mt-4 text-[11px] text-emerald-300">
                      ✅ Access granted — full details visible
                    </div>
                  )}

                  {/* Hover hint (only if blurred) */}
                  {blurred && (
                    <div className="mt-4 text-[11px] text-white/60">▶ Hover on this card to read a high-level preview.</div>
                  )}

                  {/* Teaser overlay on hover (blurred only) */}
                  {blurred && (
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
                              'Eco & Sustainability': 'A greener approach aimed at reducing waste and improving resource use.',
                              'Home & Lifestyle': 'A comfort-focused concept designed to simplify everyday living.',
                              'Mobility & Safety': 'A movement/safety idea targeting safer, smoother transport experiences.',
                              General: 'An innovative concept addressing a clear problem with a practical, scalable path.',
                            }
                            return byCat[idea.category] || 'An innovative concept with practical, scalable potential.'
                          })()}
                        </p>
                        <p className="mt-2 text-xs text-white/70">Full brief available after NDA request.</p>
                      </div>
                    </div>
                  )}

                  {/* CTA row */}
                  <div className="relative mt-4 flex items-center gap-6">
                    {blurred ? (
                      <div className="group/tt inline-block">
                        <span className="text-xs text-amber-300 cursor-pointer">🔒 Confidential — NDA required</span>
                        <div className="invisible group-hover/tt:visible absolute z-10 mt-2 w-64 rounded-md border border-white/15 bg-white/10 p-3 text-xs text-white/80 backdrop-blur">
                          This card is intentionally blurred to protect the inventor’s IP. Click “Request NDA” to view the full
                          brief.
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-white/60">Visible</span>
                    )}

                    {blurred && (
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
              )
            })}
          </div>

          {/* Investor/Inventor routing helper */}
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
              </Link>{' '}
              or{' '}
              <Link href="/signup" className="underline text-emerald-300">
                Sign up
              </Link>
            </p>

            <button
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/login'
              }}
              className="underline text-red-300"
            >
              Logout
            </button>

            {/* Optional: show who is logged in */}
            <p className="text-[11px] text-white/40">User: {userId ? 'signed in' : 'guest'}</p>
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