import { useEffect } from 'react'
import { Avatar } from './Avatar'

export { Avatar }

const P = {
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  calendar: 'M8 3v4m8-4v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  wallet: 'M3 7a2 2 0 012-2h13v4M3 7v10a2 2 0 002 2h14a1 1 0 001-1v-3m-4-2h4v-4a1 1 0 00-1-1H5a2 2 0 01-2-2M17 14h.01',
  image: 'M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm3 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-4 8l5-5 4 4 3-3 6 6',
  users: 'M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1m13-9a3 3 0 100-6m5 15v-1a4 4 0 00-3-3.87M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
  clock: 'M12 7v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z',
  back: 'M15 18l-6-6 6-6',
  plus: 'M12 5v14M5 12h14',
  camera: 'M4 8h3l2-3h6l2 3h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1zm8 9a4 4 0 100-8 4 4 0 000 8z',
}
/** Icon SVG (nét mảnh), hiển thị giống nhau trên mọi thiết bị, không phụ thuộc font emoji. */
export function Icon({ name, size = 22, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={P[name]} />
    </svg>
  )
}

export const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#84cc16']

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

/** Nút nổi: luôn nằm trên thanh điều hướng và thẳng hàng với phần nội dung, cả điện thoại lẫn máy tính. */
export function Fab({ onClick, children }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30">
      <div className="mx-auto flex max-w-3xl justify-end px-4">
        <button onClick={onClick} className="pointer-events-auto flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 active:scale-95">
          {children}
        </button>
      </div>
    </div>
  )
}

export const dateVN = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
export const dateTimeVN = (d) => new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
export const monthKey = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`
}
