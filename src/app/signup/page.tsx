'use client'

import { useRouter } from 'next/navigation'

export default function SignupSelector() {

  const router = useRouter()

  return (
   <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6 pt-24">

      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-6">

        <h1 className="text-2xl font-bold text-emerald-300">
          Welcome to Bank of Unique Ideas
        </h1>

        <p className="text-white/60">
          Choose how you want to join
        </p>

        <div className="grid gap-4">

          <button
            onClick={() => router.push('/signup/inventor')}
            className="bg-emerald-400 text-black py-3 rounded-lg font-semibold"
          >
            I am an Inventor
          </button>

          <button
            onClick={() => router.push('/signup/investor')}
            className="bg-blue-400 text-black py-3 rounded-lg font-semibold"
          >
            I am an Investor
          </button>

        </div>

      </div>

    </main>
  )
}