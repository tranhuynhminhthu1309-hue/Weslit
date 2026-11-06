import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ErrorBox, Field } from '../components/ui'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [err, setErr] = useState(null)
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr(null)
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name || email.split('@')[0] } } })
        if (error) throw error
        if (!data.session) setInfo('Đã gửi email xác nhận. Mở email và bấm vào liên kết, rồi quay lại đăng nhập.')
      }
    } catch (e2) {
      setErr(e2)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-600 to-fuchsia-500 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-5 text-center">
          <div className="text-4xl">🧾</div>
          <h1 className="mt-1 text-2xl font-extrabold">WeSplit</h1>
          <p className="text-sm text-slate-500">Chia bill cùng hội bạn</p>
        </div>
        <ErrorBox error={err} />
        {info && <div className="mb-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{info}</div>}
        {mode === 'signup' && (
          <Field label="Tên hiển thị">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: An" />
          </Field>
        )}
        <Field label="Email">
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Mật khẩu">
          <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button>
        <button type="button" className="mt-3 w-full text-center text-sm text-brand-700" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </form>
    </div>
  )
}
