'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Mode = 'inventor' | 'investor'

const INTERESTS = [
  'Mobility & Safety',
  'Eco & Sustainability',
  'FinTech & Payments',
  'AgriTech & Food',
  'AI & Data',
  'Hardware & Robotics',
  'Media & Entertainment',
  'Smart Security & Tech',
  'HealthTech & MedTech',
  'EdTech',
  'Energy & CleanTech',
  'Consumer & Lifestyle',
  'Logistics & Supply Chain',
  'GovTech & Civic',
]

export default function SignupPage() {

  const router = useRouter()

  const [mode, setMode] = useState<Mode>('inventor')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [otherArea, setOtherArea] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

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
    setMessage('')

    const nameTrim = fullName.trim()
    const emailTrim = email.trim()
    const passwordTrim = pwd.trim()

    if (!nameTrim) return setError('Enter your full name')
    if (!emailTrim) return setError('Enter your email')

    if (passwordTrim.length < 6)
      return setError('Password must be at least 6 characters')

    if (pwd !== confirmPwd)
      return setError('Passwords do not match')

    setLoading(true)

    const interests = [...selectedInterests]
    if (otherArea.trim()) interests.push(otherArea.trim())

    try {

      const { data, error: signError } = await supabase.auth.signUp({
        email: emailTrim,
        password: passwordTrim,
        options: {
          emailRedirectTo: "https://bankofuniqueideas.com/login",
          data: {
            role: mode,
            full_name: nameTrim
          }
        }
      })

      if (signError) {
        setError(signError.message)
        setLoading(false)
        return
      }

      const user = data?.user

      if (!user) {
        setError('Signup failed. Please try again.')
        setLoading(false)
        return
      }

      // ✅ FIXED PROFILE INSERT
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: nameTrim,
          email: emailTrim,
          role: mode,
          interests,
          admin: 'user' // 🔥 THIS FIXES YOUR ERROR
        })

      if (profileError) {
        console.error(profileError)
        setError(profileError.message)
        setLoading(false)
        return
      }

      setMessage('Account created successfully.')

      setTimeout(() => {
        router.push('/login')
      }, 1200)

    } catch (err) {
      console.error(err)
      setError('Network error. Please try again.')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">

      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-emerald-300 hover:text-emerald-200">
            ← Home
          </Link>
          <h1 className="text-lg font-semibold">Sign Up</h1>
          <div />
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8">

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">

          <div className="mb-6 flex gap-2">

            <button
              type="button"
              onClick={() => setMode('inventor')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
                mode === 'inventor'
                  ? 'bg-emerald-400 text-black'
                  : 'bg-black/40 text-white/80'
              }`}
            >
              Inventor
            </button>

            <button
              type="button"
              onClick={() => setMode('investor')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
                mode === 'investor'
                  ? 'bg-emerald-400 text-black'
                  : 'bg-black/40 text-white/80'
              }`}
            >
              Investor
            </button>

          </div>

          <form onSubmit={handleSignup} className="grid gap-4">

            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2"
            />

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2"
            />

            <div className="relative">

              <input
                type={showPwd ? 'text' : 'password'}
                value={pwd}
                onChange={e => setPwd(e.target.value)}
                placeholder="Password"
                className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 pr-16"
              />

              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-2 top-2 text-xs text-emerald-300"
              >
                {showPwd ? 'Hide' : 'Show'}
              </button>

            </div>

            <div className="relative">

              <input
                type={showConfirmPwd ? 'text' : 'password'}
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                placeholder="Confirm Password"
                className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 pr-16"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-2 top-2 text-xs text-emerald-300"
              >
                {showConfirmPwd ? 'Hide' : 'Show'}
              </button>

            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {INTERESTS.map(label => (
                <label key={label} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedInterests.includes(label)}
                    onChange={() => toggleInterest(label)}
                  />
                  {label}
                </label>
              ))}
            </div>

            <input
              value={otherArea}
              onChange={e => setOtherArea(e.target.value)}
              placeholder="Other interest..."
              className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2"
            />

            {error && <p className="text-red-400">{error}</p>}
            {message && <p className="text-green-400">{message}</p>}

            <button
              disabled={loading}
              className="rounded-md bg-emerald-400 px-4 py-2 font-semibold text-black"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-sm text-white/70">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-300 underline">
                Login
              </Link>
            </p>

          </form>

        </div>

      </section>

    </main>
  )
}