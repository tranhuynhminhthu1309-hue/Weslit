import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { logActivity, must } from '../lib/data'
import { useGroup } from '../lib/ctx'
import { Avatar, ErrorBox, Field, Modal } from './ui'

const toLocalInput = (d) => {
  const x = new Date(d)
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset())
  return x.toISOString().slice(0, 16)
}

/** Tạo / sửa sự kiện. Người tham gia được chọn riêng cho từng sự kiện. */
export default function EventForm({ event, onClose, onSaved }) {
  const { data, reload, gid, actor } = useGroup()
  const members = data.members.filter((m) => m.active)
  const current = event ? data.participants.filter((p) => p.event_id === event.id).map((p) => p.member_id) : []
  const [f, setF] = useState({
    name: event?.name || '',
    event_date: toLocalInput(event?.event_date || new Date()),
    location: event?.location || '',
    note: event?.note || '',
  })
  const [sel, setSel] = useState(new Set(current))
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  const toggle = (id) =>
    setSel((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  async function save(e) {
    e.preventDefault()
    if (sel.size === 0) return setErr(new Error('Chọn ít nhất 1 người tham gia'))
    setBusy(true)
    setErr(null)
    try {
      const row = { name: f.name.trim(), event_date: new Date(f.event_date).toISOString(), location: f.location.trim() || null, note: f.note.trim() || null }
      let id = event?.id
      if (event) {
        must(await supabase.from('events').update(row).eq('id', id))
        // người bị bỏ khỏi sự kiện không được còn xuất hiện trong bill của sự kiện
        const removed = current.filter((m) => !sel.has(m))
        if (removed.length) {
          const used = data.bills.filter((b) => b.event_id === id && (removed.includes(b.paid_by) || b.shared_member_ids.some((m) => removed.includes(m)))).length
          const usedItems = data.items.filter((i) => removed.includes(i.member_id) && data.bills.some((b) => b.id === i.bill_id && b.event_id === id)).length
          if (used || usedItems) throw new Error('Có người bị bỏ vẫn đang nằm trong bill của sự kiện này. Hãy sửa bill trước.')
          must(await supabase.from('event_participants').delete().eq('event_id', id).in('member_id', removed))
        }
        const added = [...sel].filter((m) => !current.includes(m))
        if (added.length) must(await supabase.from('event_participants').insert(added.map((m) => ({ event_id: id, member_id: m, group_id: gid }))))
        await logActivity(gid, actor, 'event.update', 'event', id, { name: row.name })
      } else {
        const created = must(await supabase.from('events').insert({ ...row, group_id: gid, created_by: actor.userId }).select().single())
        id = created.id
        must(await supabase.from('event_participants').insert([...sel].map((m) => ({ event_id: id, member_id: m, group_id: gid }))))
        await logActivity(gid, actor, 'event.create', 'event', id, { name: row.name })
      }
      await reload()
      onSaved?.(id)
      onClose()
    } catch (e2) {
      setErr(e2)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={event ? 'Sửa sự kiện' : 'Tạo sự kiện'} onClose={onClose}>
      <form onSubmit={save}>
        <ErrorBox error={err} />
        <Field label="Tên sự kiện">
          <input className="input" required autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ăn lẩu, cà phê, xem phim..." />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ngày giờ">
            <input className="input" type="datetime-local" required value={f.event_date} onChange={(e) => setF({ ...f, event_date: e.target.value })} />
          </Field>
          <Field label="Địa điểm">
            <input className="input" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
          </Field>
        </div>
        <Field label="Ghi chú">
          <textarea className="input" rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </Field>
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="label !mb-0">Ai tham gia? ({sel.size})</span>
            <span className="space-x-2 text-xs">
              <button type="button" className="text-brand-600" onClick={() => setSel(new Set(members.map((m) => m.id)))}>Chọn tất cả</button>
              <button type="button" className="text-slate-400" onClick={() => setSel(new Set())}>Bỏ chọn</button>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium ${sel.has(m.id) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500'}`}
              >
                <Avatar m={m} size={24} />
                {m.name}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu sự kiện'}</button>
      </form>
    </Modal>
  )
}
