'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  const ADMIN_PASSWORD = 'unique@2025'

  function handle(e: React.FormEvent) {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      localStorage.setItem('isAdmin', 'true')
      router.push('/dashboard')
    } else {
      setErr('Access Denied: Incorrect Password')
    }
  }

  return (
    <div style={{display:'grid',placeItems:'center',minHeight:'100vh',background:'#000',color:'#fff'}}>
      <div style={{width:320,padding:20,borderRadius:10,background:'#111',border:'1px solid #222'}}>
        <h1 style={{textAlign:'center',marginBottom:12}}>Admin Login (PW-only)</h1>
        <form onSubmit={handle}>
          <input
            type="password"
            placeholder="Admin password"
            value={pw}
            onChange={e=>setPw(e.target.value)}
            style={{width:'100%',padding:10,borderRadius:6,border:'1px solid #333',background:'#1b1b1b',color:'#fff'}}
          />
          <button
            type="submit"
            style={{marginTop:10,width:'100%',padding:10,borderRadius:6,background:'#fff',color:'#000',fontWeight:700}}
          >
            Login
          </button>
        </form>
        {err && <p style={{color:'tomato',marginTop:8}}>{err}</p>}
      </div>
    </div>
  )
}
