import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import { AppCtx } from './lib/ctx'
import { useRoute, go } from './lib/router'
import { Spinner } from './components/ui'
import AuthPage from './pages/Auth'
import HomePage from './pages/Home'
import GroupShell from './pages/GroupShell'

function SetupNotice() {
  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="card p-6">
        <h1 className="mb-2 text-xl font-bold">Chưa kết nối Supabase</h1>
        <p className="text-sm text-slate-600">
          Tạo file <code className="rounded bg-slate-100 px-1">.env</code> từ <code className="rounded bg-slate-100 px-1">.env.example</code> và điền
          <code className="rounded bg-slate-100 px-1"> VITE_SUPABASE_URL</code>,
          <code className="rounded bg-slate-100 px-1"> VITE_SUPABASE_ANON_KEY</code>, rồi chạy lại. Xem README để biết các bước.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const route = useRoute()
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return setProfile(null)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data || { id: session.user.id, display_name: session.user.email }))
  }, [session])

  if (!isConfigured) return <SetupNotice />
  if (session === undefined) return <Spinner />
  if (!session) return <AuthPage />
  if (!profile) return <Spinner />

  const ctx = { user: session.user, profile, setProfile }
  return (
    <AppCtx.Provider value={ctx}>
      {route.name === 'home' && <HomePage />}
      {(route.name === 'group' || route.name === 'event') && <GroupShell key={route.gid} route={route} />}
    </AppCtx.Provider>
  )
}

export { go }
