import React, { useState } from 'react'
import { LockKeyhole, Star, Eye, EyeOff } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'

export default function Login({ onSignedIn, message = '' }: { onSignedIn: () => void; message?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), password }), signal: AbortSignal.timeout(15000) })
      const data = await response.json()
      if (!response.ok || typeof data.token !== 'string' || !data.token) throw Error(data.message || data.error || 'Sign-in failed. Please retry.')
      localStorage.setItem('adminToken', data.token)
      setPassword(''); onSignedIn()
    } catch (e) { setError(e instanceof Error && e.name !== 'TimeoutError' && e.name !== 'TypeError' ? e.message : 'Cannot connect to the backend. Check that it is running and try again.') }
    finally { setBusy(false) }
  }
  return <main className="flex min-h-screen items-center justify-center bg-astrology-dark px-5 py-12 text-white font-['Outfit']">
    <section className="w-full max-w-md rounded-3xl border border-astrology-gold/25 bg-astrology-card p-8 shadow-2xl">
      <div className="mb-8 flex items-center justify-center gap-3"><div className="rounded-full bg-gold-gradient p-3"><Star className="fill-black text-black" size={28} /></div><span className="text-2xl font-bold text-astrology-gold">Valikatti Admin</span></div>
      <div className="mb-6 text-center"><LockKeyhole className="mx-auto mb-3 text-astrology-gold" size={30} /><h1 className="text-2xl font-bold">Admin sign-in</h1><p className="mt-2 text-sm text-gray-400">Sign in with your existing admin account.</p></div>
      {message && <p role="status" className="mb-4 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-200">{message}</p>}
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <form onSubmit={submit} className="space-y-5">
        <label className="block text-sm">Email<input required type="email" autoComplete="username" disabled={busy} value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-astrology-dark px-4 py-3 outline-none focus:border-astrology-gold" placeholder="Admin email" /></label>
        <label className="block text-sm">Password<div className="relative mt-2"><input required type={visible ? 'text' : 'password'} autoComplete="current-password" disabled={busy} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-white/15 bg-astrology-dark px-4 py-3 pr-12 outline-none focus:border-astrology-gold" placeholder="Password" /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)} className="absolute right-3 top-3 text-gray-400">{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button></div></label>
        <button disabled={busy} className="w-full rounded-xl bg-gold-gradient py-3 font-bold text-black disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </section>
  </main>
}
