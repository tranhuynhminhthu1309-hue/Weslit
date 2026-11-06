import { useEffect } from 'react'

export const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#84cc16']

export function Avatar({ m, size = 32 }) {
  const name = m?.name || '?'
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: m?.color || '#94a3b8', fontSize: size * 0.42 }}
      title={name}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

export function AvatarStack({ list, max = 5 }) {
  return (
    <span className="flex -space-x-2">
      {list.slice(0, max).map((m) => (
        <span key={m.id} className="rounded-full ring-2 ring-white">
          <Avatar m={m} size={26} />
        </span>
      ))}
      {list.length > max && (
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 ring-2 ring-white">
          +{list.length - max}
        </span>
      )}
    </span>
  )
}

export function Badge({ tone = 'slate', children }) {
  const t = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
    brand: 'bg-brand-50 text-brand-700',
  }[tone]
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${t}`}>{children}</span>
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold">{title}</h3>
          <button className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="mb-3 block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

export function Spinner({ text = 'Đang tải...' }) {
  return <div className="p-10 text-center text-sm text-slate-400">{text}</div>
}

export function Empty({ icon = '🧾', title, hint, children }) {
  return (
    <div className="card p-8 text-center">
      <div className="mb-2 text-4xl">{icon}</div>
      <div className="font-semibold">{title}</div>
      {hint && <div className="mt-1 text-sm text-slate-500">{hint}</div>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

export function ErrorBox({ error }) {
  if (!error) return null
  return <div className="mb-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error.message || String(error)}</div>
}

export function Fab({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 active:scale-95 sm:bottom-6"
    >
      {children}
    </button>
  )
}

export const dateVN = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
export const dateTimeVN = (d) => new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
export const monthKey = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`
}
