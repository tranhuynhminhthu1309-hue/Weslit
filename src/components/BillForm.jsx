import { useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { logActivity, must, uploadBillImage } from '../lib/data'
import { computeBill, fmt, parseMoney } from '../lib/money'
import { useGroup } from '../lib/ctx'
import { Avatar, ErrorBox, Field, Modal } from './ui'

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Nhập / sửa 1 bill: tổng hóa đơn, người ứng tiền, món riêng (gán từng người), người chia khoản chung.
 * Chi phí chung = tổng bill - tổng món riêng, chia đều cho người được chọn (phần lẻ xử lý trong money.js).
 */
export default function BillForm({ event, bill, onClose }) {
  const { data, reload, gid, actor, memberById } = useGroup()
  const parts = data.participants.filter((p) => p.event_id === event.id).map((p) => p.member_id)
  const people = parts.map((id) => memberById[id]).filter(Boolean)
  const oldItems = bill ? data.items.filter((i) => i.bill_id === bill.id) : []
  const myId = data.members.find((m) => m.user_id === actor.userId)?.id
  const billId = useMemo(() => bill?.id || crypto.randomUUID(), [bill])

  const [f, setF] = useState({
    restaurant: bill?.restaurant || '',
    total: bill ? String(bill.total) : '',
    paid_by: bill?.paid_by || (parts.includes(myId) ? myId : parts[0] || ''),
    paid_at: bill?.paid_at || today(),
    note: bill?.note || '',
  })
  const [shared, setShared] = useState(new Set(bill ? bill.shared_member_ids : parts))
  const [items, setItems] = useState(oldItems.map((i) => ({ key: i.id, name: i.name, amount: String(i.amount), member_id: i.member_id })))
  const [files, setFiles] = useState([])
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef()

  const total = parseMoney(f.total)
  const calc = computeBill(
    { id: billId, total, paid_by: f.paid_by, shared_member_ids: [...shared] },
    items.map((i) => ({ amount: parseMoney(i.amount), member_id: i.member_id }))
  )
  const toggle = (id) =>
    setShared((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const setItem = (k, patch) => setItems((l) => l.map((x) => (x.key === k ? { ...x, ...patch } : x)))
  const addItem = () => setItems((l) => [...l, { key: crypto.randomUUID(), name: '', amount: '', member_id: parts[0] || '' }])

  async function save(e) {
    e.preventDefault()
    setErr(null)
    if (total <= 0) return setErr(new Error('Nhập tổng giá trị hóa đơn'))
    if (calc.errors.length) return setErr(new Error(calc.errors[0]))
    if (items.some((i) => parseMoney(i.amount) <= 0)) return setErr(new Error('Món riêng cần có số tiền lớn hơn 0'))
    setBusy(true)
    try {
      const row = {
        restaurant: f.restaurant.trim(),
        total,
        paid_by: f.paid_by,
        paid_at: f.paid_at,
        note: f.note.trim() || null,
        shared_member_ids: [...shared],
      }
      const itemRows = items.map((i) => ({ group_id: gid, bill_id: billId, name: i.name.trim(), amount: parseMoney(i.amount), member_id: i.member_id }))
      if (bill) {
        must(await supabase.from('bills').update(row).eq('id', billId))
        must(await supabase.from('bill_personal_items').delete().eq('bill_id', billId))
      } else {
        must(await supabase.from('bills').insert({ ...row, id: billId, group_id: gid, event_id: event.id, created_by: actor.userId }))
      }
      if (itemRows.length) must(await supabase.from('bill_personal_items').insert(itemRows))
      // lưu lịch sử thay đổi: ghi cả giá trị trước và sau
      await logActivity(gid, actor, bill ? 'bill.update' : 'bill.create', 'bill', billId, {
        event: event.name,
        before: bill ? { restaurant: bill.restaurant, total: bill.total, paid_by: bill.paid_by, personal: oldItems.map((i) => ({ name: i.name, amount: i.amount, member_id: i.member_id })), shared: bill.shared_member_ids } : null,
        after: { restaurant: row.restaurant, total, paid_by: row.paid_by, personal: itemRows.map((i) => ({ name: i.name, amount: i.amount, member_id: i.member_id })), shared: row.shared_member_ids },
      })
      for (const file of files) await uploadBillImage({ gid, eid: event.id, billId, file, userId: actor.userId })
      await reload()
      onClose()
    } catch (e2) {
      setErr(e2)
    } finally {
      setBusy(false)
    }
  }

  const unassigned = Math.max(calc.sharedAmount, 0)
  const sharedList = [...shared]

  return (
    <Modal title={bill ? 'Sửa bill' : 'Thêm bill'} onClose={onClose} wide>
      <form onSubmit={save}>
        <ErrorBox error={err} />
        <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
          <Field label="Quán / nơi thanh toán">
            <input className="input" value={f.restaurant} onChange={(e) => setF({ ...f, restaurant: e.target.value })} placeholder="Tên nhà hàng, quán ăn" />
          </Field>
          <Field label="Tổng giá trị hóa đơn (đ)">
            <input className="input num text-lg font-bold" inputMode="numeric" required value={f.total ? new Intl.NumberFormat('vi-VN').format(total) : ''} onChange={(e) => setF({ ...f, total: e.target.value })} placeholder="0" />
          </Field>
          <Field label="Người thanh toán (ứng tiền)">
            <select className="input" value={f.paid_by} onChange={(e) => setF({ ...f, paid_by: e.target.value })}>
              {people.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Ngày thanh toán">
            <input className="input" type="date" required value={f.paid_at} onChange={(e) => setF({ ...f, paid_at: e.target.value })} />
          </Field>
        </div>

        <div className="mb-4 rounded-2xl bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold">Món riêng (chỉ một người dùng)</span>
            <button type="button" className="btn-soft btn-sm" onClick={addItem}>+ Thêm món riêng</button>
          </div>
          {items.length === 0 && <p className="text-xs text-slate-400">Không có món riêng thì cả hóa đơn được chia đều cho những người chọn bên dưới.</p>}
          {items.map((i) => (
            <div key={i.key} className="mb-2 grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1.2fr_1fr_1fr_auto]">
              <input className="input" placeholder="Tên món" value={i.name} onChange={(e) => setItem(i.key, { name: e.target.value })} />
              <button type="button" className="rounded-xl px-2 text-rose-500 hover:bg-rose-50 sm:order-last" onClick={() => setItems((l) => l.filter((x) => x.key !== i.key))} aria-label="Xóa món">🗑</button>
              <input className="input num" inputMode="numeric" placeholder="Số tiền" value={i.amount ? new Intl.NumberFormat('vi-VN').format(parseMoney(i.amount)) : ''} onChange={(e) => setItem(i.key, { amount: e.target.value })} />
              <select className="input" value={i.member_id} onChange={(e) => setItem(i.key, { member_id: e.target.value })}>
                {people.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="label !mb-0">Chia đều khoản chung cho ({shared.size} người)</span>
            <span className="space-x-2 text-xs">
              <button type="button" className="text-brand-600" onClick={() => setShared(new Set(parts))}>Tất cả</button>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {people.map((m) => (
              <button type="button" key={m.id} onClick={() => toggle(m.id)} className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium ${shared.has(m.id) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-400 line-through'}`}>
                <Avatar m={m} size={24} />
                {m.name}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">Bỏ chọn người không dùng khoản chi chung (ví dụ người đến sau, người không ăn).</p>
        </div>

        <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50/50 p-3">
          <div className="mb-2 flex justify-between text-sm">
            <span>Chi phí chung</span>
            <b className="num">{fmt(unassigned)}</b>
          </div>
          {calc.errors.length > 0 ? (
            <p className="text-sm font-medium text-rose-600">{calc.errors[0]}</p>
          ) : (
            <>
              {people.filter((m) => calc.owed[m.id]).map((m) => (
                <div key={m.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="flex items-center gap-2"><Avatar m={m} size={22} />{m.name}{m.id === f.paid_by && <span className="text-[11px] text-slate-400">(ứng tiền)</span>}</span>
                  <b className="num">{fmt(calc.owed[m.id])}</b>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-brand-100 pt-2 text-sm font-bold">
                <span>Tổng phân bổ</span>
                <span className={`num ${Object.values(calc.owed).reduce((a, b) => a + b, 0) === total ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fmt(Object.values(calc.owed).reduce((a, b) => a + b, 0))} / {fmt(total)}
                </span>
              </div>
            </>
          )}
        </div>

        <Field label="Ghi chú">
          <input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </Field>

        <div className="mb-4">
          <span className="label">Ảnh hóa đơn</span>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => { setFiles((l) => [...l, ...Array.from(e.target.files)]); e.target.value = '' }} />
          <div className="flex flex-wrap gap-2">
            {files.map((file, i) => (
              <div key={i} className="relative h-16 w-16 overflow-hidden rounded-xl bg-slate-100">
                <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                <button type="button" className="absolute right-0 top-0 rounded-bl-lg bg-black/60 px-1.5 text-xs text-white" onClick={() => setFiles((l) => l.filter((_, k) => k !== i))}>✕</button>
              </div>
            ))}
            <button type="button" className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-500" onClick={() => fileRef.current.click()}>
              <span className="text-xl">📷</span>Chụp / tải
            </button>
          </div>
        </div>

        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu bill'}</button>
      </form>
    </Modal>
  )
}
