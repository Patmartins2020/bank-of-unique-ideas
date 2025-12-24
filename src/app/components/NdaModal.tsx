'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Supabase client for client components (carries auth cookies)
const supabase = createClientComponentClient()

type Props = {
  open: boolean
  onClose: () => void
  ideaId: string
  ideaTitle: string
}

export default function NdaModal({ open, onClose, ideaId, ideaTitle }: Props) {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  if (!open) return null

  async function requestNDA(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)

    if (!email.trim()) {
      setErr('Please enter your work email.')
      return
    }

    if (!agree) {
      setErr('Please agree to the NDA request terms.')
      return
    }

    try {
      setLoading(true)

      // 1) Ensure user is logged in (needed for RLS: user_id = auth.uid())
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error(authError)
        setErr('Could not verify your session. Please log in again.')
        return
      }

      if (!user) {
        // Not logged in → send to login instead of inserting with null user_id
        onClose()
        router.push('/login')
        return
      }

      // 2) Insert NDA request with correct user_id
      const { error } = await supabase.from('nda_requests').insert({
        idea_id: ideaId,
        user_id: user.id,      // ✅ matches RLS policy (auth.uid())
        email: email.trim(),
        status: 'requested',   // ✅ allowed by your CHECK constraint
        // access_token, otp_code, etc. can stay NULL for now
      })

      if (error) {
        console.error(error)
        throw error
      }

      setMsg('✅ Request received. NDA instructions will be sent by email.')
      setEmail('')
      setAgree(false)
    } catch (e: any) {
      console.error(e)
      setErr(e?.message || 'Could not submit request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0f1629] p-5 text-white shadow-xl">
        <h3 className="text-lg font-semibold">Request NDA — {ideaTitle}</h3>
        <p className="mt-1 text-sm text-white/70">
          This idea is protected. Submit your work email to receive an NDA and view the full brief.
        </p>

        <form onSubmit={requestNDA} className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-white/80">Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 outline-none"
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              I agree that this request is for evaluation only; disclosure is under mutual NDA and
              does not transfer IP ownership.
            </span>
          </label>

          {err && <p className="text-xs text-red-300">{err}</p>}
          {msg && <p className="text-xs text-emerald-300">{msg}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Request NDA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}