'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type ProfileRow = {
  id: string
  full_name: string | null
  role: string | null
}

type NdaRow = {
  id: string
  idea_id: string
  status: string
  created_at: string
}

type AccessRow = {
  id: string
  idea_id: string
  status: string
  created_at: string
}

type IdeaRow = {
  id: string
  title: string
  category: string | null
  status: string | null
  created_at: string
}

export default function InvestorDashboardPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('Investor')

  const [ndaRequests, setNdaRequests] = useState<NdaRow[]>([])
  const [accessRows, setAccessRows] = useState<AccessRow[]>([])
  const [confirmedIdeas, setConfirmedIdeas] = useState<IdeaRow[]>([])

  const stats = useMemo(() => {
    const ndaPending = ndaRequests.filter((n) => ['requested', 'pending'].includes(n.status)).length
    const ndaApproved = ndaRequests.filter((n) => ['approved', 'active'].includes(n.status)).length
    const accessActive = accessRows.filter((a) => a.status === 'active').length
    return { ndaPending, ndaApproved, accessActive }
  }, [ndaRequests, accessRows])

  async function handleLogout() {
    setBusy(true)
    setError(null)
    try {
      await supabase.auth.signOut()
      router.replace('/splash') // or '/'
    } catch (e: any) {
      setError(e?.message || 'Logout failed.')
    } finally {
      setBusy(false)
    }
  }

  function handleSwitchAccount() {
    // does NOT sign out; just takes user to login so they can sign in as another user
    router.push('/login')
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        // 1) Must be logged in
        const { data: uRes, error: uErr } = await supabase.auth.getUser()
        if (uErr) throw uErr

        const user = uRes.user
        if (!user) {
          router.replace('/login')
          return
        }

        // 2) Load profile and enforce role=investor
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', user.id)
          .maybeSingle<ProfileRow>()

        const role =
          prof?.role ||
          ((user.user_metadata as any)?.role as string | undefined) ||
          null

        if (role !== 'investor') {
          // If they are inventor, bounce them to inventor page
          router.replace('/my-ideas')
          return
        }

        const name =
          prof?.full_name ||
          (user.user_metadata as any)?.full_name ||
          user.email ||
          'Investor'

        if (!cancelled) setDisplayName(name)

        // 3) NDA requests (RLS should allow investor to read own)
        const { data: ndaRows, error: ndaErr } = await supabase
          .from('nda_requests')
          .select('id, idea_id, status, created_at')
          .order('created_at', { ascending: false })

        if (ndaErr) throw ndaErr
        if (!cancelled) setNdaRequests((ndaRows || []) as NdaRow[])

        // 4) Access rows (RLS should allow investor to read own)
        const { data: accRows, error: accErr } = await supabase
          .from('idea_access')
          .select('id, idea_id, status, created_at')
          .order('created_at', { ascending: false })

        if (accErr) throw accErr
        if (!cancelled) setAccessRows((accRows || []) as AccessRow[])

        // 5) Browse confirmed ideas (public policy should allow reading confirmed ideas)
        const { data: ideaRows, error: ideaErr } = await supabase
          .from('ideas')
          .select('id, title, category, status, created_at')
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false })
          .limit(12)

        if (ideaErr) throw ideaErr
        if (!cancelled) setConfirmedIdeas((ideaRows || []) as IdeaRow[])
    } catch (e: any) {
  console.warn('[InvestorDashboard] transient error:', e)

  // If auth is missing, redirect instead of showing error
  if (e?.message?.toLowerCase().includes('auth')) {
    router.replace('/login')
    return
  }

  // Otherwise show a generic error
  if (!cancelled) {
    setError('Unable to load dashboard data. Please refresh.')
  }
} finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b1120] text-white grid place-items-center">
        <p className="text-white/70">Loading investor dashboard…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0b1120] text-white px-6 pt-20 pb-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-extrabold text-emerald-400">Investor Dashboard</h1>
            <p className="text-white/70 mt-2">
              Welcome, <span className="text-white font-semibold">{displayName}</span>. Track NDAs, access,
              and browse confirmed ideas.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSwitchAccount}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Switch account
            </button>

            <button
              disabled={busy}
              onClick={handleLogout}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? 'Logging out…' : 'Logout'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="NDA Pending" value={stats.ndaPending} />
          <StatCard title="NDA Approved" value={stats.ndaApproved} />
          <StatCard title="Active Access" value={stats.accessActive} />
        </div>

        {/* NDA Requests */}
        <section className="mt-10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-bold">My NDA Requests</h2>
            <button onClick={() => router.push('/')} className="text-emerald-300 underline text-sm">
              Browse ideas on homepage
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {ndaRequests.length === 0 ? (
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-white/70">
                No NDA requests yet. Browse confirmed ideas and request NDA.
              </div>
            ) : (
              ndaRequests.slice(0, 10).map((n) => (
                <div key={n.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-white font-semibold">
                        Idea ID: <span className="text-white/80">{n.idea_id}</span>
                      </p>
                      <p className="text-white/60 text-sm mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-black/30 border border-white/10 text-sm">
                      {n.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Access */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">My Granted Access</h2>

          <div className="mt-4 grid gap-3">
            {accessRows.filter((a) => a.status === 'active').length === 0 ? (
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-white/70">
                No active access yet. Once an inventor grants access, it will show here.
              </div>
            ) : (
              accessRows
                .filter((a) => a.status === 'active')
                .slice(0, 10)
                .map((a) => (
                  <div key={a.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-white font-semibold">
                          Idea ID: <span className="text-white/80">{a.idea_id}</span>
                        </p>
                        <p className="text-white/60 text-sm mt-1">
                          Granted: {new Date(a.created_at).toLocaleString()}
                        </p>
                      </div>

                      <button
                        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
                        onClick={() => router.push(`/ideas/${a.idea_id}`)}
                      >
                        View brief
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>

        {/* Browse confirmed ideas */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">Browse Confirmed Ideas</h2>
          <p className="text-white/60 text-sm mt-1">
            These are public summaries. Full details require NDA + inventor approval.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {confirmedIdeas.length === 0 ? (
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-white/70">
                No confirmed ideas available yet.
              </div>
            ) : (
              confirmedIdeas.map((i) => (
                <div
                  key={i.id}
                  className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">{i.title}</h3>
                      <p className="text-white/60 text-sm mt-1">
                        {i.category || 'General'} • {new Date(i.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-black/30 border border-white/10 text-sm">
                      {i.status || 'confirmed'}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-3 flex-wrap">
                    <button
                      className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                      onClick={() => router.push(`/ideas/${i.id}`)}
                    >
                      View summary
                    </button>

                    <button
                      className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black"
                      onClick={() => router.push(`/nda/request?idea_id=${i.id}`)}
                    >
                      Request NDA
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
      <p className="text-white/60 text-sm">{title}</p>
      <p className="text-3xl font-extrabold mt-1">{value}</p>
    </div>
  )
}