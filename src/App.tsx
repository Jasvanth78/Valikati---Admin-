import Layout from './components/Layout'
import { useCallback, useEffect, useRef, useState } from 'react'
import Login from './pages/Login'
import { API_BASE_URL } from './utils/api'

function App() {
  const [session, setSession] = useState<{ email: string } | null>(null)
  const [checking, setChecking] = useState(!!localStorage.getItem('adminToken'))
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const generation = useRef(0)
  const logout = useCallback((expired = false) => {
    generation.current++; localStorage.removeItem('adminToken'); setSession(null); setChecking(false); setError('')
    setMessage(expired ? 'Your session expired. Please sign in again.' : '')
  }, [])
  const verify = useCallback(async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) { logout(); return }
    const request = ++generation.current
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/session`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(15000) })
      if (request !== generation.current) return
      if (response.status === 401 || response.status === 403) { logout(true); return }
      const data = await response.json()
      if (request !== generation.current) return
      if (!response.ok || !data.email) throw Error('Unable to verify your session. Check the backend and retry.')
      setSession({ email: data.email }); setError(''); setMessage('')
    } catch (_) { if (request === generation.current) setError('Unable to verify your session. Check the backend and retry.') }
    finally { if (request === generation.current) setChecking(false) }
  }, [logout])
  useEffect(() => {
    void verify()
    const expired = () => logout(true)
    const focus = () => { if (localStorage.getItem('adminToken')) void verify() }
    const storage = (event: StorageEvent) => { if (event.key === 'adminToken') void verify() }
    const timer = window.setInterval(focus, 60000)
    window.addEventListener('focus', focus); window.addEventListener('storage', storage); window.addEventListener('admin-session-expired', expired)
    return () => { generation.current++; window.clearInterval(timer); window.removeEventListener('focus', focus); window.removeEventListener('storage', storage); window.removeEventListener('admin-session-expired', expired) }
  }, [verify, logout])
  if (checking || (!session && error && localStorage.getItem('adminToken'))) return <main className="flex min-h-screen items-center justify-center bg-astrology-dark text-white"><div className="space-y-4 text-center"><p role="status">{checking ? 'Checking admin session…' : error}</p>{!checking && <><button onClick={() => { setChecking(true); void verify() }} className="rounded-lg bg-gold-gradient px-5 py-3 text-black">Retry</button><button onClick={() => logout()} className="ml-4">Back to sign-in</button></>}</div></main>
  if (!session) return <Login message={message} onSignedIn={() => { setChecking(true); void verify() }} />
  return <><Layout adminEmail={session.email} onLogout={() => logout()} />{error && <div role="alert" className="fixed bottom-4 right-4 z-50 max-w-md rounded-xl bg-red-950 p-4 text-red-200">{error}<button onClick={() => void verify()} className="ml-3 underline">Retry</button></div>}</>
}

export default App
