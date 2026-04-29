'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const INTERESTS = [
  'Mobility & Safety',
  'Eco & Sustainability',
  'FinTech & Payments',
  'AgriTech & Food',
  'AI & Data',
  'Hardware & Robotics',
  'Smart Security & Tech'
]

export default function InventorSignup() {

  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false) // ✅ NEW STATE

  function toggleInterest(label: string) {
    setSelectedInterests(prev =>
      prev.includes(label)
        ? prev.filter(x => x !== label)
        : [...prev, label]
    )
  }

  async function handleSignup(e: React.FormEvent) {

    e.preventDefault()
    setError('')

    if (!fullName.trim()) return setError('Enter your full name')
    if (!email.trim()) return setError('Enter your email')
    if (pwd.length < 6) return setError('Password must be at least 6 characters')
    if (pwd !== confirmPwd) return setError('Passwords do not match')

    setLoading(true)

    try {

      const { data, error: signError } = await supabase.auth.signUp({
        email,
        password: pwd,
        options: {
          emailRedirectTo: "https://bankofuniqueideas.com/login",
          data: {
            role: 'inventor',
            full_name: fullName
          }
        }
      })

      if (signError) throw signError

      const user = data?.user
      if (!user) throw new Error('Signup failed')

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: fullName,
          email,
          role: 'inventor',
          interests: selectedInterests,
          admin: 'user'
        })

      if (profileError) throw profileError

      // ✅ SHOW EMAIL CONFIRMATION SCREEN
      setEmailSent(true)

    } catch (err: any) {
      console.error(err)
      setError(err.message)
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6 pt-24">

      <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-2xl p-6">

        {emailSent ? (

          // ✅ EMAIL CONFIRMATION SCREEN
          <div className="text-center space-y-4">

            <h2 className="text-2xl font-bold text-emerald-300">
              📩 Check your email
            </h2>

            <p className="text-white/70">
              We’ve sent a confirmation link to:
            </p>

            <p className="text-white font-semibold">
              {email}
            </p>

            <p className="text-white/60 text-sm">
              Please verify your account before logging in.
            </p>

            <button
              onClick={() => router.push('/login')}
              className="mt-4 bg-emerald-400 text-black px-6 py-2 rounded-full font-semibold"
            >
              Go to Login
            </button>

          </div>

        ) : (

          // ✅ SIGNUP FORM
          <>
            <h1 className="text-2xl font-bold text-emerald-300 mb-2">
              Inventor Signup
            </h1>

            <p className="text-white/60 mb-6">
              Protect your ideas and receive verified certificates
            </p>

            <form onSubmit={handleSignup} className="grid gap-4">

              <input
                placeholder="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2"
              />

              <input
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2"
              />

              <input
                type="password"
                placeholder="Password"
                value={pwd}
                onChange={e => setPwd(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2"
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2"
              />

              <div className="grid grid-cols-2 gap-2 text-xs">
                {INTERESTS.map(label => (
                  <label key={label} className="flex gap-2">
                    <input
                      type="checkbox"
                      onChange={() => toggleInterest(label)}
                    />
                    {label}
                  </label>
                ))}
              </div>

              {error && <p className="text-red-400">{error}</p>}

              <button
                disabled={loading}
                className="bg-emerald-400 text-black py-2 rounded-md font-semibold"
              >
                {loading ? 'Creating...' : 'Create Inventor Account'}
              </button>

              <p className="text-sm text-white/60">
                Already have an account?{' '}
                <Link href="/login" className="text-emerald-300">
                  Login
                </Link>
              </p>

            </form>
          </>
        )}

      </div>

    </main>
  )
}