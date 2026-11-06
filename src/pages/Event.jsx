import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { deleteBillImage, logActivity, must, uploadBillImage } from '../lib/data'
import { fmt } from '../lib/money'
import { go } from '../lib/router'
import { useGroup } from '../lib/ctx'
import { useSignedUrls } from '../lib/useUrls'
import { Avatar, AvatarStack, Badge, Empty, ErrorBox, Fab, dateTimeVN } from '../components/ui'
import BillForm from '../components/BillForm'
import EventForm from '../components/EventForm'
import ImageViewer from '../components/ImageViewer'

export default function EventPage({ eid }) {
  const { data, reload, gid, actor, memberById } = useGroup()
  const ev = data.events.find((e) => e.id === eid)
  const [billModal, setBillModal] = useState(null) // {bill}
  const [editEvent, setEditEvent] = useState(false)
  const [viewer, setViewer] = useState(null)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef()
  const images = data.images.filter((i) => i.event_id === eid)
  const urls = useSignedUrls(images)

  if (!ev) return <Empty icon="🔍" title="Không tìm thấy sự kiện" hint="Sự kiện có thể đã bị xóa.">
    <button className="btn-primary" onClick={() => go(`/g/${gid}`)}>Về nhóm</button>
  </Empty>

  const locked = ev.status === 'locked'
  const people = data.participants.filter((p) => p.event_id === eid).map((p) => memberById[p.member_id]).filter(Boolean)
  const bills = data.bills.filter((b) => b.event_id === eid)
  const computed = Object.fromEntries(data.computed.map((c) => [c.id, c]))
  const total = bills.reduce((s, b) => s + b.total, 0)

  // tổng kết theo người trong sự kiện: đã ứng, phải chịu
  const sum = {}
  bills.forEach((b) => {
    const c = computed[b.id]
    if (!c || c.errors.length) return
    sum[b.paid_by] = sum[b.paid_by] || { paid: 0, owed: 0 }
    sum[b.paid_by].paid += b.total
    Object.entries(c.owed).forEach(([m, a]) => {
      sum[m] = sum[m] || { paid: 0, owed: 0 }
      sum[m].owed += a
    })
  })

  async function run(fn) {
    setBusy(true)
    setErr(null)
    try {
      await fn()
      await reload()
    } catch (e) {
      setErr(e)
    } finally {
      setBusy(false)
    }
  }

  const lock = () =>
    run(async () => {
      if (!bills.length) throw new Error('Cần có ít nhất 1 bill trước khi chốt')
      const bad = bills.find((b) => computed[b.id]?.errors.length)
      if (bad) throw new Error(`Bill "${bad.restaurant || 'không tên'}" còn lỗi: ${computed[bad.id].errors[0]}`)
      must(await supabase.from('events').update({ status: 'locked', locked_at: new Date().toISOString() }).eq('id', eid))
      await logActivity(gid, actor, 'event.lock', 'event', eid, { name: ev.name, total })
    })
  const unlock = () =>
    run(async () => {
      if (!window.confirm('Mở lại sự kiện để chỉnh sửa? Công nợ liên quan sẽ được tính lại và thao tác này được ghi vào lịch sử.')) return
      must(await supabase.from('events').update({ status: 'draft', locked_at: null }).eq('id', eid))
      await logActivity(gid, actor, 'event.unlock', 'event', eid, { name: ev.name })
    })
  const removeEvent = () =>
    run(async () => {
      if (!window.confirm(`Xóa sự kiện "${ev.name}" cùng toàn bộ bill và ảnh?`)) return
      for (const img of images) await deleteBillImage(img).catch(() => {})
      must(await supabase.from('events').delete().eq('id', eid))
      await logActivity(gid, actor, 'event.delete', 'event', eid, { name: ev.name, total })
      go(`/g/${gid}`)
    })
  const removeBill = (b) =>
    run(async () => {
      if (!window.confirm(`Xóa bill "${b.restaurant || 'không tên'}" (${fmt(b.total)})?`)) return
      for (const img of images.filter((i) => i.bill_id === b.id)) await deleteBillImage(img).catch(() => {})
      must(await supabase.from('bills').delete().eq('id', b.id))
      await logActivity(gid, actor, 'bill.delete', 'bill', b.id, { event: ev.name, restaurant: b.restaurant, total: b.total })
    })
  const addImages = (files) =>
    run(async () => {
      for (const file of files) await uploadBillImage({ gid, eid, billId: null, file, userId: actor.userId })
      await logActivity(gid, actor, 'image.add', 'event', eid, { count: files.length, event: ev.name })
    })
  const removeImage = (img) =>
    run(async () => {
      if (!window.confirm('Xóa ảnh này?')) return
      await deleteBillImage(img)
      await logActivity(gid, actor, 'image.delete', 'event', eid, { event: ev.name })
    })

  return (
    <div>
      <ErrorBox error={err} />
      <div className="card mb-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold">{ev.name}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{dateTimeVN(ev.event_date)}{ev.location ? ` · ${ev.location}` : ''}</p>
          </div>
          <Badge tone={locked ? 'green' : 'amber'}>{locked ? 'Đã chốt' : 'Đang nhập'}</Badge>
        </div>
        {ev.note && <p className="mt-2 text-sm text-slate-600">{ev.note}</p>}
        <div className="mt-3 flex items-center justify-between">
          <AvatarStack list={people} max={7} />
          <div className="text-right">
            <div className="text-xs text-slate-400">Tổng chi</div>
            <div className="num text-2xl font-extrabold text-brand-700">{fmt(total)}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {!locked && <button className="btn-ghost btn-sm" onClick={() => setEditEvent(true)}>Sửa thông tin</button>}
          {locked ? (
            <button className="btn-ghost btn-sm" disabled={busy} onClick={unlock}>Mở lại để chỉnh sửa</button>
          ) : (
            <button className="btn-primary btn-sm" disabled={busy} onClick={lock}>Chốt sự kiện</button>
          )}
          {!locked && <button className="btn-danger btn-sm" disabled={busy} onClick={removeEvent}>Xóa</button>}
        </div>
        {!locked && <p className="mt-2 text-xs text-slate-400">Chỉ sự kiện đã chốt mới được tính vào công nợ của nhóm.</p>}
      </div>

      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Bill ({bills.length})</h3>
      {bills.length === 0 ? (
        <Empty icon="🧾" title="Chưa có bill nào" hint="Thêm bill đầu tiên: nhập tổng tiền, người ứng tiền và món riêng nếu có." />
      ) : (
        <div className="space-y-3">
          {bills.map((b) => {
            const c = computed[b.id]
            const payer = memberById[b.paid_by]
            const bi = images.filter((i) => i.bill_id === b.id)
            return (
              <div key={b.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold">{b.restaurant || 'Bill không tên'}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Avatar m={payer} size={18} /> {payer?.name} đã ứng · {new Date(b.paid_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div className="num text-lg font-extrabold">{fmt(b.total)}</div>
                </div>
                {c.errors.length > 0 ? (
                  <p className="mt-2 text-sm text-rose-600">{c.errors[0]}</p>
                ) : (
                  <div className="mt-3 divide-y divide-slate-50 rounded-xl bg-slate-50 px-3">
                    {Object.entries(c.owed).map(([m, a]) => {
                      const mine = data.items.filter((i) => i.bill_id === b.id && i.member_id === m)
                      const mineSum = mine.reduce((s, i) => s + i.amount, 0)
                      return (
                        <div key={m} className="flex items-center justify-between py-2 text-sm">
                          <span className="flex items-center gap-2"><Avatar m={memberById[m]} size={22} />{memberById[m]?.name}
                            {mine.length > 0 && <span className="text-[11px] text-slate-400">gồm {mine.map((i) => i.name || 'món riêng').join(', ')} {fmt(mineSum)}</span>}
                          </span>
                          <b className="num">{fmt(a)}</b>
                        </div>
                      )
                    })}
                    <div className="py-2 text-[11px] text-slate-400">
                      Chi phí chung {fmt(c.sharedAmount)} chia cho {b.shared_member_ids.length} người{c.personalSum ? ` · món riêng ${fmt(c.personalSum)}` : ''}
                    </div>
                  </div>
                )}
                {b.note && <p className="mt-2 text-xs text-slate-500">📝 {b.note}</p>}
                {bi.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    {bi.map((i) => urls[i.path] && (
                      <img key={i.id} src={urls[i.path]} alt="Hóa đơn" className="h-16 w-16 shrink-0 cursor-zoom-in rounded-lg object-cover" onClick={() => setViewer(urls[i.path])} />
                    ))}
                  </div>
                )}
                {!locked && (
                  <div className="mt-3 flex gap-2">
                    <button className="btn-ghost btn-sm" onClick={() => setBillModal({ bill: b })}>Sửa</button>
                    <button className="btn-danger btn-sm" disabled={busy} onClick={() => removeBill(b)}>Xóa</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {bills.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Tổng kết sự kiện</h3>
          <div className="card divide-y divide-slate-50 px-4">
            {people.map((m) => {
              const s = sum[m.id] || { paid: 0, owed: 0 }
              const diff = s.paid - s.owed
              return (
                <div key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="flex items-center gap-2"><Avatar m={m} size={26} /><span className="font-semibold">{m.name}</span></span>
                  <span className="text-right text-xs text-slate-500">
                    ứng <b className="num text-slate-700">{fmt(s.paid)}</b> · chịu <b className="num text-slate-700">{fmt(s.owed)}</b>
                    <div className={`num text-sm font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {diff > 0 ? `nhận lại ${fmt(diff)}` : diff < 0 ? `cần trả ${fmt(-diff)}` : 'cân bằng'}
                    </div>
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      <h3 className="mb-2 mt-6 flex items-center justify-between text-sm font-bold uppercase tracking-wide text-slate-500">
        <span>Ảnh hóa đơn ({images.length})</span>
        <span>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => { const fl = Array.from(e.target.files); e.target.value = ''; if (fl.length) addImages(fl) }} />
          <button className="btn-soft btn-sm normal-case" disabled={busy} onClick={() => fileRef.current.click()}>📷 Chụp / tải ảnh</button>
        </span>
      </h3>
      {images.length === 0 ? (
        <p className="text-sm text-slate-400">Chưa có ảnh. Chụp bill gốc để mọi người đối chiếu khi cần.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((i) => (
            <div key={i.id} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
              {urls[i.path] && <img src={urls[i.path]} alt="Hóa đơn" className="h-full w-full cursor-zoom-in object-cover" onClick={() => setViewer(urls[i.path])} />}
              <button className="absolute right-1 top-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white" onClick={() => removeImage(i)} aria-label="Xóa ảnh">✕</button>
            </div>
          ))}
        </div>
      )}

      {!locked && <Fab onClick={() => setBillModal({ bill: null })}>＋ Thêm bill</Fab>}
      {billModal && <BillForm event={ev} bill={billModal.bill} onClose={() => setBillModal(null)} />}
      {editEvent && <EventForm event={ev} onClose={() => setEditEvent(false)} />}
      {viewer && <ImageViewer src={viewer} onClose={() => setViewer(null)} />}
    </div>
  )
}
